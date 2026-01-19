import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Enrollment, EnrollmentStatus } from "../../entities/enrollment.entity";
import { Course, CourseStatus } from "../../entities/course.entity";
import { EpisodeCompletion } from "../../entities/episode-completion.entity";
import { Episode } from "../../entities/episode.entity";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { UpdateStatusEnrollmentDto } from "./dto/update-enrollment.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class EnrollmentsService {
    private readonly logger = new Logger(EnrollmentsService.name);

    constructor(
        @InjectRepository(Enrollment)
        private enrollmentRepository: Repository<Enrollment>,
        @InjectRepository(Course)
        private courseRepository: Repository<Course>,
        @InjectRepository(EpisodeCompletion)
        private episodeCompletionRepository: Repository<EpisodeCompletion>,
        @InjectRepository(Episode)
        private episodeRepository: Repository<Episode>
    ) {}

    async createEnrollment(
        createEnrollmentDto: CreateEnrollmentDto,
        courseId: number
    ): Promise<Enrollment> {
        // Check if course exists and is published
        const course = await this.courseRepository.findOne({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException("Course not found");
        }

        if (
            course.status !== CourseStatus.PUBLISHED &&
            course.status !== CourseStatus.APPROVED
        ) {
            throw new BadRequestException("Course is not published yet");
        }

        // Check if already enrolled
        const existingEnrollment = await this.enrollmentRepository.findOne({
            where: {
                student: { id: createEnrollmentDto.studentId },
                course: { id: courseId },
            },
        });

        if (existingEnrollment) {
            throw new ConflictException("Already enrolled in this course");
        }

        const enrollment = this.enrollmentRepository.create({
            student: {
                id: createEnrollmentDto.studentId,
            },
            course: {
                id: courseId,
            },
        });
        return await this.enrollmentRepository.save(enrollment);
    }

    async findEnrollmentById(
        courseId: number,
        enrollmentId: number
    ): Promise<Enrollment> {
        const enrollment = await this.enrollmentRepository.findOne({
            where: {
                id: enrollmentId,
                course: {
                    id: courseId,
                },
            },
            relations: ["course", "lastEpisode", "completions"],
        });

        if (!enrollment) {
            throw new NotFoundException("Enrollment not found");
        }

        return enrollment;
    }

    async getEnrollmentsByCourse(
        courseId: number,
        paginationDto: PaginationDto
    ) {
        const {
            page = 1,
            limit = 5,
            order = "ASC",
            sortBy = "id",
        } = paginationDto;
        const skip = (page - 1) * limit;

        const [enrollments, total] =
            await this.enrollmentRepository.findAndCount({
                where: { course: { id: courseId } },
                relations: ["student"],
                skip,
                take: limit,
                order: { [sortBy]: order.toUpperCase() },
            });

        return {
            data: enrollments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getStudentEnrollments(
        studentId: number,
        subscribed: boolean | null,
        paginationDto: PaginationDto
    ) {
        const queryBuilder = this.enrollmentRepository
            .createQueryBuilder("enrollment")
            .leftJoinAndSelect("enrollment.course", "course")
            .where("enrollment.user_id = :studentId", { studentId })
            .andWhere("course.status IN (:...courseStatuses)", {
                courseStatuses: [CourseStatus.PUBLISHED, CourseStatus.APPROVED],
            });

        // Only filter by status if subscribed is explicitly set
        if (subscribed === true) {
            queryBuilder.andWhere("enrollment.status = :status", {
                status: EnrollmentStatus.ACTIVE,
            });
        } else if (subscribed === false) {
            queryBuilder.andWhere("enrollment.status != :status", {
                status: EnrollmentStatus.ACTIVE,
            });
        }
        // If subscribed is null/undefined, get all enrollments (no status filter)

        const [enrollments, total] = await queryBuilder
            .orderBy("enrollment.enrolledAt", "DESC")
            .getManyAndCount();

        return {
            enrollments,
        };
    }

    async updateEnrollment(
        courseId: number,
        enrollmentId: number,
        updateStatusEnrollmentDto: UpdateStatusEnrollmentDto
    ): Promise<Enrollment> {
        const enrollment = await this.enrollmentRepository.findOne({
            where: {
                id: enrollmentId,
                course: {
                    id: courseId,
                },
            },
        });

        if (!enrollment) {
            throw new NotFoundException("Not found enrollment.");
        }

        if (updateStatusEnrollmentDto.status === EnrollmentStatus.CANCELLED) {
            enrollment.cancelledAt = new Date();
        } else if (
            updateStatusEnrollmentDto.status === EnrollmentStatus.COMPLETED
        ) {
            enrollment.completedAt = new Date();
        }

        Object.assign(enrollment, updateStatusEnrollmentDto);
        return await this.enrollmentRepository.save(enrollment);
    }

    async markEpisodeComplete(
        courseId: number,
        enrollmentId: number,
        episodeId: number
    ): Promise<void> {
        const enrollment = await this.findEnrollmentById(
            courseId,
            enrollmentId
        );

        // Check if episode belongs to the enrolled course
        const episode = await this.episodeRepository.findOne({
            where: { id: episodeId },
            relations: ["chapter"],
        });

        if (!episode || episode.chapter.course.id !== enrollment.course.id) {
            throw new BadRequestException("Invalid episode for this course");
        }

        // Check if already completed
        const existingCompletion =
            await this.episodeCompletionRepository.findOne({
                where: { enrollmentId, episodeId },
            });

        if (!existingCompletion) {
            const completion = this.episodeCompletionRepository.create({
                enrollmentId,
                episodeId,
            });
            await this.episodeCompletionRepository.save(completion);
        }

        // Update last episode to this episode
        enrollment.lastEpisode = episode;
        await this.enrollmentRepository.save(enrollment);

        // Update progress
        await this.updateProgress(enrollmentId);
    }

    async updateLastEpisode(
        courseId: number,
        enrollmentId: number,
        episodeId: number
    ) {
        const enrollment = await this.findEnrollmentById(
            courseId,
            enrollmentId
        );

        // Validate episode belongs to the enrolled course
        const episode = await this.episodeRepository.findOne({
            where: { id: episodeId },
            relations: ["chapter", "chapter.course"],
        });

        if (!episode || episode.chapter.course.id !== courseId) {
            throw new BadRequestException(
                "Invalid episode for this course"
            );
        }

        // Update last episode
        enrollment.lastEpisode = episode;
        return await this.enrollmentRepository.save(enrollment);
    }

    async completeCourse(
        courseId: number,
        enrollmentId: number
    ): Promise<Enrollment> {
        const enrollment = await this.findEnrollmentById(
            courseId,
            enrollmentId
        );

        // Mark course as completed
        enrollment.status = EnrollmentStatus.COMPLETED;
        enrollment.completedAt = new Date();
        enrollment.isCompleted = true;
        enrollment.progressPercentage = 100;

        return await this.enrollmentRepository.save(enrollment);
    }

    async resetCourse(
        courseId: number,
        enrollmentId: number
    ): Promise<Enrollment> {
        const enrollment = await this.findEnrollmentById(
            courseId,
            enrollmentId
        );

        // Delete all episode completions for this enrollment
        await this.episodeCompletionRepository.delete({ enrollmentId });

        // Reset enrollment to initial state using direct update
        await this.enrollmentRepository.update(enrollmentId, {
            status: EnrollmentStatus.ACTIVE,
            completedAt: null,
            isCompleted: false,
            progressPercentage: 0,
            lastEpisode: null,
        });

        // Fetch and return updated enrollment
        return await this.findEnrollmentById(courseId, enrollmentId);
    }

    private async updateProgress(enrollmentId: number): Promise<void> {
        const enrollment = await this.enrollmentRepository.findOne({
            where: { id: enrollmentId },
            relations: ["course", "lastEpisode", "completions"],
        });

        if (!enrollment) return;

        // Count total episodes
        let totalEpisodes = 0;
        enrollment.course.chapters.forEach((chapter) => {
            totalEpisodes += chapter.episodes.length;
        });

        // Calculate progress
        const completedEpisodes = enrollment.completions.length;
        const progress =
            totalEpisodes > 0 ? (completedEpisodes / totalEpisodes) * 100 : 0;

        enrollment.progressPercentage = Math.round(progress * 100) / 100;

        if (progress === 100) {
            enrollment.status = EnrollmentStatus.COMPLETED;
            enrollment.completedAt = new Date();
            enrollment.isCompleted = true;
        }

        await this.enrollmentRepository.save(enrollment);
    }
}
