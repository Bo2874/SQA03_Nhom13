import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Course, CourseStatus } from "../../entities/course.entity";
import { Chapter } from "../../entities/chapter.entity";
import { Episode, EpisodeType } from "../../entities/episode.entity";
import { QuizQuestion } from "../../entities/quiz-question.entity";
import { QuizAnswer } from "../../entities/quiz-answer.entity";
import { CourseMaterial } from "../../entities/course-material.entity";
import { User, UserRole } from "../../entities/user.entity";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseByTeacherDto } from "./dto/update-course-by-teacher.dto";
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { CreateEpisodeDto } from "./dto/create-episode.dto";
import { CreateQuizQuestionDto } from "./dto/create-quiz-question.dto";
import { CreateQuizAnswerDto } from "./dto/create-quiz-answer.dto";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CoursesQueryDto } from "./dto/courses-query.dto";
import {
    CourseStatusByAdmin,
    UpdateCourseByAdminDto,
} from "./dto/update-course-by-admin.dto";
import { CourseMapper } from "./mapper/course.mapper";
import { UpdateCourseMaterialDto } from "./dto/update-course-material.dto";
import { UpdateChapterDto } from "./dto/update-chapter.dto";
import { UpdateEpisodeDto } from "./dto/update-episode.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { UpdateQuizAnswerDto } from "./dto/update-answer.dto";
import { SearchCoursesDto } from "./dto/search-courses.dto";

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course)
        private courseRepository: Repository<Course>,
        @InjectRepository(Chapter)
        private chapterRepository: Repository<Chapter>,
        @InjectRepository(Episode)
        private episodeRepository: Repository<Episode>,
        @InjectRepository(QuizQuestion)
        private quizQuestionRepository: Repository<QuizQuestion>,
        @InjectRepository(QuizAnswer)
        private quizAnswerRepository: Repository<QuizAnswer>,
        @InjectRepository(CourseMaterial)
        private courseMaterialRepository: Repository<CourseMaterial>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly courseMapper: CourseMapper
    ) {}

    // Course CRUD
    async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
        const course = this.courseRepository.create({
            ...createCourseDto,
            teacher: { id: createCourseDto.teacherId },
            subject: { id: createCourseDto.subjectId },
            gradeLevel: { id: createCourseDto.gradeLevelId },
            submittedAt: new Date(),
        });
        return await this.courseRepository.save(course);
    }

    async findCourseById(id: number, userId?: number): Promise<Course> {
        const course = await this.courseRepository
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.teacher", "teacher")
            .leftJoinAndSelect("course.subject", "subject")
            .leftJoinAndSelect("course.gradeLevel", "gradeLevel")
            .leftJoinAndSelect("course.chapters", "chapters")
            .leftJoinAndSelect("chapters.episodes", "episodes")
            .leftJoinAndSelect("course.materials", "materials")
            .leftJoinAndSelect("course.exams", "exams")
            .leftJoinAndSelect("course.zoomMeetings", "zoomMeetings")
            .leftJoinAndSelect("zoomMeetings.teacher", "zoomTeacher")
            .loadRelationCountAndMap(
                "course.enrollmentCount",
                "course.enrollments"
            )
            .where("course.id = :id", { id })
            .getOne();

        if (!course) {
            throw new NotFoundException("Course not found");
        }

        // If user is authenticated, fetch their enrollment info
        if (userId) {
            const enrollment = await this.courseRepository.manager
                .getRepository("Enrollment")
                .createQueryBuilder("enrollment")
                .where("enrollment.course_id = :courseId", { courseId: id })
                .andWhere("enrollment.user_id = :userId", { userId })
                .getOne();

            if (enrollment) {
                (course as any).enrollment = enrollment;
            }
        }

        return course;
    }

    // async getCourses(courseQueryDto: CoursesQueryDto, user: any) {
    //     const { page, limit, order, sortBy, status } = courseQueryDto;
    //     const skip = (page - 1) * limit;

    //     const queryBuilder = this.courseRepository
    //         .createQueryBuilder("course")
    //         .leftJoinAndSelect("course.teacher", "teacher")
    //         .leftJoinAndSelect("course.subject", "subject")
    //         .leftJoinAndSelect("course.gradeLevel", "gradeLevel")
    //         .loadRelationCountAndMap("course.chapterCount", "course.chapters")
    //         .loadRelationCountAndMap(
    //             "course.totalEpisodes",
    //             "course.chapters",
    //             "chapters",
    //             (qb) => qb.leftJoin("chapters.episodes", "episodes")
    //         );

    //     // TEACHER can only see their own courses
    //     // ADMIN can see all courses
    //     if (user.role === "TEACHER") {
    //         queryBuilder.where("teacher.id = :teacherId", {
    //             teacherId: user.sub || user.id || user.userId,
    //         });
    //     }

    //     // Additional status filter if provided
    //     if (status) {
    //         if (user.role === "TEACHER") {
    //             queryBuilder.andWhere("course.status = :status", { status });
    //         } else {
    //             queryBuilder.where("course.status = :status", { status });
    //         }
    //     }

    //     const [courses, total] = await queryBuilder
    //         .skip(skip)
    //         .take(limit)
    //         .orderBy(`course.${sortBy}`, order.toUpperCase() as "ASC" | "DESC")
    //         .getManyAndCount();

    //     return {
    //         courses,
    //         totalPages: Math.ceil(total / limit),
    //     };
    // }

    async getCourses(user: any) {
        const queryBuilder = this.courseRepository
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.teacher", "teacher")
            .leftJoinAndSelect("course.subject", "subject")
            .leftJoinAndSelect("course.gradeLevel", "gradeLevel")
            .loadRelationCountAndMap("course.chapterCount", "course.chapters")
            .loadRelationCountAndMap(
                "course.totalEpisodes",
                "course.chapters",
                "chapters",
                (qb) => qb.leftJoin("chapters.episodes", "episodes")
            )
            .loadRelationCountAndMap(
                "course.enrollmentCount",
                "course.enrollments"
            )
            .orderBy("course.submittedAt", "DESC");

        // Nếu là user thường thì chỉ lấy course đã publish
        if (user.role === "USER") {
            queryBuilder.where("course.status = :status", {
                status: "PUBLISHED",
            });
        }
        // Nếu là teacher thì chỉ lấy course của mình
        else if (user.role === "TEACHER") {
            queryBuilder.where("teacher.id = :teacherId", {
                teacherId: user.sub || user.id || user.userId,
            });
        }
        // Admin thì lấy tất cả trừ DRAFT (DRAFT chỉ dành cho teacher)
        else if (user.role === "ADMIN") {
            queryBuilder.where("course.status != :draftStatus", {
                draftStatus: CourseStatus.DRAFT,
            });
        }

        const courses = await queryBuilder.getMany();
        return { courses };
    }

    async getApprovedCourses() {
        const queryBuilder = this.courseRepository
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.teacher", "teacher")
            .leftJoinAndSelect("course.subject", "subject")
            .leftJoinAndSelect("course.gradeLevel", "gradeLevel")
            .loadRelationCountAndMap("course.chapterCount", "course.chapters")
            .loadRelationCountAndMap(
                "course.totalEpisodes",
                "course.chapters",
                "chapters",
                (qb) => qb.leftJoin("chapters.episodes", "episodes")
            )
            .loadRelationCountAndMap(
                "course.enrollmentCount",
                "course.enrollments"
            )
            .orderBy("course.submittedAt", "DESC")
            .where("course.status = :published", {
                published: CourseStatus.PUBLISHED,
            });

        const courses = await queryBuilder.getMany();

        return {
            courses,
            total: courses.length,
        };
    }

    async searchCourses(searchDto: SearchCoursesDto) {
        const { keyword, subjectId, gradeLevelId, page = 1, limit = 12 } = searchDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.courseRepository
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.teacher", "teacher")
            .leftJoinAndSelect("course.subject", "subject")
            .leftJoinAndSelect("course.gradeLevel", "gradeLevel")
            .loadRelationCountAndMap("course.chapterCount", "course.chapters")
            .loadRelationCountAndMap(
                "course.totalEpisodes",
                "course.chapters",
                "chapters",
                (qb) => qb.leftJoin("chapters.episodes", "episodes")
            )
            .loadRelationCountAndMap(
                "course.enrollmentCount",
                "course.enrollments"
            )
            .where("course.status = :published", {
                published: CourseStatus.PUBLISHED,
            });

        // Filter by keyword (search in title and summary)
        if (keyword) {
            queryBuilder.andWhere(
                "(course.title LIKE :keyword OR course.summary LIKE :keyword)",
                { keyword: `%${keyword}%` }
            );
        }

        // Filter by subject
        if (subjectId) {
            queryBuilder.andWhere("course.subject_id = :subjectId", { subjectId });
        }

        // Filter by grade level
        if (gradeLevelId) {
            queryBuilder.andWhere("course.grade_level_id = :gradeLevelId", { gradeLevelId });
        }

        const [courses, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy("course.submittedAt", "DESC")
            .getManyAndCount();

        return {
            courses,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async updateCourseByAdmin(
        id: number,
        updateCourseByAdminDto: UpdateCourseByAdminDto
    ): Promise<Course> {
        const course = await this.findCourseById(id);
        this.courseMapper.updateCourseByAdmin(updateCourseByAdminDto, course);

        if (
            updateCourseByAdminDto.status === CourseStatusByAdmin.REJECTED &&
            (!updateCourseByAdminDto.rejectionReason ||
                updateCourseByAdminDto.rejectionReason.trim() === "")
        ) {
            throw new BadRequestException(
                "Rejection reason is required when status is REJECTED"
            );
        }

        if (
            updateCourseByAdminDto.status === CourseStatusByAdmin.APPROVED ||
            updateCourseByAdminDto.status === CourseStatusByAdmin.PUBLISHED
        ) {
            course.approvedAt = new Date();
            course.rejectionReason = "";
        }

        return await this.courseRepository.save(course);
    }

    async updateCourseByTeacher(
        id: number,
        updateCourseDto: UpdateCourseByTeacherDto,
        user: any
    ) {
        const course = await this.findCourseById(id);

        // Check if the teacher owns this course
        const userId = user.sub || user.id || user.userId;
        if (course.teacher.id !== userId) {
            throw new ForbiddenException(
                "You can only update your own courses"
            );
        }

        // Teacher can only change status between DRAFT, REJECTED, and PENDING_REVIEW
        // Cannot modify courses that are APPROVED or PUBLISHED (but CAN modify REJECTED to allow resubmission)
        if (updateCourseDto.status !== undefined) {
            if (
                course.status === CourseStatus.APPROVED ||
                course.status === CourseStatus.PUBLISHED
            ) {
                throw new ForbiddenException(
                    "Cannot update status of approved or published courses"
                );
            }
        }

        this.courseMapper.updateCourseByTeacher(updateCourseDto, course);
        return await this.courseRepository.save(course);
    }

    async deleteCourse(id: number, user: any): Promise<void> {
        const course = await this.findCourseById(id);

        // ADMIN can delete any course, TEACHER can only delete their own
        const userId = user.sub || user.id || user.userId;
        if (user.role === "TEACHER" && course.teacher.id !== userId) {
            throw new ForbiddenException(
                "You can only delete your own courses"
            );
        }

        await this.courseRepository.remove(course);
    }

    // Chapter operations
    async createChapter(
        createChapterDto: CreateChapterDto,
        courseId: number
    ): Promise<Chapter> {
        const chapter = this.chapterRepository.create({
            ...createChapterDto,
            course: { id: courseId },
        });
        return await this.chapterRepository.save(chapter);
    }

    async findChapterById(id: number, courseId: number): Promise<Chapter> {
        const chapter = await this.chapterRepository.findOne({
            where: { id, course: { id: courseId } },
            relations: ["course", "episodes"],
        });
        if (!chapter) {
            throw new NotFoundException("Chapter not found");
        }
        return chapter;
    }

    async updateChapterById(
        id: number,
        courseId: number,
        updateChapterDto: UpdateChapterDto
    ) {
        const chapter = await this.findChapterById(id, courseId);

        this.courseMapper.updateChapter(updateChapterDto, chapter);

        return await this.chapterRepository.save(chapter);
    }

    async deleteChapterById(id: number, courseId: number) {
        const chapter = await this.findChapterById(id, courseId);
        await this.chapterRepository.remove(chapter);
    }

    // Episode operations
    async createEpisode(
        createEpisodeDto: CreateEpisodeDto,
        courseId: number,
        chapterId: number
    ): Promise<Episode> {
        if (
            createEpisodeDto.type === EpisodeType.VIDEO &&
            (!createEpisodeDto.videoUrl ||
                createEpisodeDto.videoUrl.trim() === "")
        ) {
            throw new BadRequestException("Type video should have video url.");
        }

        if (createEpisodeDto.type === EpisodeType.QUIZ) {
            createEpisodeDto.videoUrl = "";
            createEpisodeDto.durationSeconds = 0;
        }

        const episode = this.episodeRepository.create({
            ...createEpisodeDto,
            chapter: { id: chapterId, course: { id: courseId } },
        });

        return await this.episodeRepository.save(episode);
    }

    async findEpisodeById(
        courseId: number,
        chapterId: number,
        id: number
    ): Promise<Episode> {
        const episode = await this.episodeRepository
            .createQueryBuilder("episode")
            .leftJoinAndSelect("episode.chapter", "chapter")
            .leftJoinAndSelect("chapter.course", "course")
            .leftJoinAndSelect("episode.quizQuestions", "quizQuestions")
            .leftJoinAndSelect("quizQuestions.answers", "answers")
            .where("episode.id = :id", { id })
            .andWhere("chapter.id = :chapterId", { chapterId })
            .andWhere("course.id = :courseId", { courseId })
            .getOne();

        if (!episode) {
            throw new NotFoundException("Episode not found");
        }
        return episode;
    }

    async updateEpisodeById(
        courseId: number,
        chapterId: number,
        id: number,
        updateEpisodeDto: UpdateEpisodeDto
    ) {
        const episode = await this.findEpisodeById(courseId, chapterId, id);
        this.courseMapper.updateEpisode(updateEpisodeDto, episode);
        return this.episodeRepository.save(episode);
    }

    async deleteEpisodeById(courseId: number, chapterId: number, id: number) {
        const episode = await this.findEpisodeById(courseId, chapterId, id);
        await this.episodeRepository.remove(episode);
    }

    // Quiz Question operations
    async createQuizQuestion(
        createQuizQuestionDto: CreateQuizQuestionDto,
        courseId: number,
        chapterId: number,
        episodeId: number
    ): Promise<QuizQuestion> {
        const episode = await this.episodeRepository.findOne({
            where: {
                id: episodeId,
                type: EpisodeType.QUIZ,
                chapter: {
                    id: chapterId,
                    course: {
                        id: courseId,
                    },
                },
            },
        });

        if (!episode) {
            throw new NotFoundException(
                `Not found episode with id ${episodeId} has type ${EpisodeType.QUIZ}.`
            );
        }

        const question = this.quizQuestionRepository.create({
            ...createQuizQuestionDto,
            episode: { id: episodeId },
        });
        return await this.quizQuestionRepository.save(question);
    }

    async findQuizQuestionById(
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number
    ): Promise<QuizQuestion> {
        const question = await this.quizQuestionRepository.findOne({
            where: {
                id: questionId,
                episode: {
                    id: episodeId,
                    chapter: {
                        id: chapterId,
                        course: {
                            id: courseId,
                        },
                    },
                },
            },
            relations: ["episode", "answers"],
        });

        if (!question) {
            throw new NotFoundException(
                `Not found question with id: ${questionId}.`
            );
        }

        return question;
    }

    async updateQuestionById(
        updateQuestionDto: UpdateQuestionDto,
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number
    ) {
        const question = await this.findQuizQuestionById(
            courseId,
            chapterId,
            episodeId,
            questionId
        );

        this.courseMapper.updateQuestion(updateQuestionDto, question);

        return await this.quizQuestionRepository.save(question);
    }

    async deleteQuestionById(
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number
    ) {
        const question = await this.findQuizQuestionById(
            courseId,
            chapterId,
            episodeId,
            questionId
        );
        await this.quizQuestionRepository.remove(question);
    }

    // Quiz Answer operations
    async createQuizAnswer(
        createQuizAnswerDto: CreateQuizAnswerDto,
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number
    ): Promise<QuizAnswer> {
        const answer = this.quizAnswerRepository.create({
            ...createQuizAnswerDto,
            question: {
                id: questionId,
                episode: {
                    id: episodeId,
                    chapter: {
                        id: chapterId,
                        course: {
                            id: courseId,
                        },
                    },
                },
            },
        });
        return await this.quizAnswerRepository.save(answer);
    }

    async findAnswerById(
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number,
        answerId: number
    ): Promise<QuizAnswer> {
        const quizAnswer = await this.quizAnswerRepository.findOne({
            where: {
                id: answerId,
                question: {
                    id: questionId,
                    episode: {
                        id: episodeId,
                        chapter: {
                            id: chapterId,
                            course: {
                                id: courseId,
                            },
                        },
                    },
                },
            },
        });

        if (!quizAnswer) {
            throw new NotFoundException(
                `Not found answer with id: ${answerId}.`
            );
        }

        return quizAnswer;
    }

    async updateAnswerById(
        updateQuizAnswerDto: UpdateQuizAnswerDto,
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number,
        answerId: number
    ) {
        const answer = await this.findAnswerById(
            courseId,
            chapterId,
            episodeId,
            questionId,
            answerId
        );

        this.courseMapper.updateAnswer(updateQuizAnswerDto, answer);

        return await this.quizAnswerRepository.save(answer);
    }

    async deleteAnswerById(
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number,
        answerId: number
    ) {
        const answer = await this.findAnswerById(
            courseId,
            chapterId,
            episodeId,
            questionId,
            answerId
        );

        await this.quizAnswerRepository.remove(answer);
    }

    // Course Material operations
    async createCourseMaterial(
        createMaterialDto: CreateMaterialDto,
        courseId: number
    ): Promise<CourseMaterial> {
        const material = this.courseMaterialRepository.create({
            ...createMaterialDto,
            course: { id: courseId },
        });
        return await this.courseMaterialRepository.save(material);
    }

    async updateCourseMaterialById(
        updateCourseMaterialDto: UpdateCourseMaterialDto,
        materialId: number
    ) {
        const material = await this.courseMaterialRepository.findOne({
            where: { id: materialId },
        });

        if (!material) {
            throw new NotFoundException("Not found course material id.");
        }

        this.courseMapper.updateCourseMaterial(
            updateCourseMaterialDto,
            material
        );
        material.uploadedAt = new Date();

        return await this.courseMaterialRepository.save(material);
    }

    async findCourseMaterialById(materialId: number) {
        const material = await this.courseMaterialRepository.findOne({
            where: {
                id: materialId,
            },
        });

        if (!material) {
            throw new NotFoundException("Not found course material id.");
        }

        return material;
    }

    async deleteCourseMaterialById(materialId: number) {
        const material = await this.findCourseMaterialById(materialId);
        await this.courseMaterialRepository.remove(material);
    }

    // Get alls:
    async findAllCourseMaterials(courseId: number) {
        return this.courseMaterialRepository.find({
            where: {
                course: {
                    id: courseId,
                },
            },
        });
    }

    async findAllChapters(courseId: number) {
        return this.chapterRepository.find({
            where: {
                course: { id: courseId },
            },
        });
    }

    async findAllEpisodes(courseId: number, chapterId: number) {
        return this.episodeRepository.find({
            where: {
                chapter: {
                    id: chapterId,
                    course: { id: courseId },
                },
            },
        });
    }

    async findAllQuestions(
        courseId: number,
        chapterId: number,
        episodeId: number
    ) {
        return this.quizQuestionRepository.find({
            where: {
                episode: {
                    id: episodeId,
                    chapter: { id: chapterId, course: { id: courseId } },
                },
            },
        });
    }

    async findAllAnswers(
        courseId: number,
        chapterId: number,
        episodeId: number,
        questionId: number
    ) {
        return this.quizAnswerRepository.find({
            where: {
                question: {
                    id: questionId,
                    episode: {
                        id: episodeId,
                        chapter: { id: chapterId, course: { id: courseId } },
                    },
                },
            },
        });
    }

    // Home page APIs
    async getFeaturedCourses(limit: number = 8) {
        const queryBuilder = this.courseRepository
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.teacher", "teacher")
            .leftJoinAndSelect("course.subject", "subject")
            .leftJoinAndSelect("course.gradeLevel", "gradeLevel")
            .loadRelationCountAndMap("course.chapterCount", "course.chapters")
            .loadRelationCountAndMap(
                "course.totalEpisodes",
                "course.chapters",
                "chapters",
                (qb) => qb.leftJoin("chapters.episodes", "episodes")
            )
            .loadRelationCountAndMap(
                "course.enrollmentCount",
                "course.enrollments"
            )
            .where(
                "(course.status = :approved OR course.status = :published)",
                {
                    approved: CourseStatus.APPROVED,
                    published: CourseStatus.PUBLISHED,
                }
            )
            .orderBy("course.submittedAt", "DESC")
            .take(limit);

        const courses = await queryBuilder.getMany();
        return { courses };
    }

    async getCoursesBySubject(subjectId: number, limit: number = 8) {
        const queryBuilder = this.courseRepository
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.teacher", "teacher")
            .leftJoinAndSelect("course.subject", "subject")
            .leftJoinAndSelect("course.gradeLevel", "gradeLevel")
            .loadRelationCountAndMap("course.chapterCount", "course.chapters")
            .loadRelationCountAndMap(
                "course.totalEpisodes",
                "course.chapters",
                "chapters",
                (qb) => qb.leftJoin("chapters.episodes", "episodes")
            )
            .loadRelationCountAndMap(
                "course.enrollmentCount",
                "course.enrollments"
            )
            .where(
                "course.status = :published AND subject.id = :subjectId",
                {
                    published: CourseStatus.PUBLISHED,
                    subjectId,
                }
            )
            .orderBy("course.submittedAt", "DESC")
            .take(limit);

        const courses = await queryBuilder.getMany();
        return { courses };
    }

    async getPlatformStats() {
        // Get total courses that are approved or published
        const totalCourses = await this.courseRepository.count({
            where: [
                { status: CourseStatus.APPROVED },
                { status: CourseStatus.PUBLISHED },
            ],
        });

        // Get total students from users table with role STUDENT
        const totalStudents = await this.userRepository.count({
            where: { role: UserRole.STUDENT },
        });

        // Get total teachers from users table with role TEACHER
        const totalTeachers = await this.userRepository.count({
            where: { role: UserRole.TEACHER },
        });

        // Get total episodes (tất cả episodes)
        const episodeResult = await this.courseRepository.query(`
            SELECT COUNT(e.id) as totalEpisodes
            FROM episodes e
        `);
        const totalEpisodes = episodeResult[0]?.totalEpisodes || 0;

        return {
            totalCourses,
            totalStudents,
            totalTeachers,
            totalEpisodes,
        };
    }
}
