import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { SearchTeachersDto } from "./dto/search-teachers.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}

    async findById(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return user;
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        Object.assign(user, updateUserDto);
        return await this.userRepository.save(user);
    }

    async deleteUser(id: number): Promise<void> {
        const user = await this.findById(id);
        await this.userRepository.remove(user);
    }

    async getAllTeachers(paginationDto: PaginationDto) {
        const { page, limit, order, sortBy } = paginationDto;
        const skip = (page - 1) * limit;

        const [users, total] = await this.userRepository.findAndCount({
            where: {
                role: UserRole.TEACHER,
            },
            skip,
            take: limit,
            order: { [sortBy]: order.toUpperCase() },
        });

        const cleanedUsers = users.map((u) => {
            const { passwordHash, ...rest } = u;
            return rest;
        });

        return {
            data: cleanedUsers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async createTeacher(createTeacherDto: CreateTeacherDto) {
        // Check if email already exists
        const existingUser = await this.userRepository.findOne({
            where: { email: createTeacherDto.email },
        });

        if (existingUser) {
            throw new ConflictException("Email already exists");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createTeacherDto.password, 10);

        // Create teacher account
        const teacher = this.userRepository.create({
            email: createTeacherDto.email,
            passwordHash: hashedPassword,
            fullName: createTeacherDto.fullName,
            phone: createTeacherDto.phone,
            avatarUrl: createTeacherDto.avatarUrl,
            role: UserRole.TEACHER,
            status: UserStatus.ACTIVE,
        });

        await this.userRepository.save(teacher);

        const { passwordHash, ...result } = teacher;
        return result;
    }

    async searchTeachers(searchDto: SearchTeachersDto) {
        const { keyword, page = 1, limit = 12 } = searchDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.courses", "courses")
            .loadRelationCountAndMap(
                "user.totalCourses",
                "user.courses",
                "publishedCourses",
                (qb) => qb.where("publishedCourses.status IN (:...statuses)", {
                    statuses: ["APPROVED", "PUBLISHED"],
                })
            )
            .loadRelationCountAndMap(
                "user.totalStudents",
                "user.courses",
                "courseForStudents",
                (qb) =>
                    qb
                        .leftJoin("courseForStudents.enrollments", "enrollments")
                        .where("courseForStudents.status IN (:...statuses)", {
                            statuses: ["APPROVED", "PUBLISHED"],
                        })
            )
            .where("user.role = :role", { role: UserRole.TEACHER })
            .andWhere("user.status = :status", { status: UserStatus.ACTIVE });

        // Filter by keyword (search in fullName and email)
        if (keyword) {
            queryBuilder.andWhere(
                "(user.full_name LIKE :keyword OR user.email LIKE :keyword)",
                { keyword: `%${keyword}%` }
            );
        }

        const [teachers, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy("user.createdAt", "DESC")
            .getManyAndCount();

        // Remove password hash from response
        const cleanedTeachers = teachers.map((teacher) => {
            const { passwordHash, ...rest } = teacher;
            return rest;
        });

        return {
            teachers: cleanedTeachers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getTeacherById(id: number) {
        const teacher = await this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.courses", "courses")
            .leftJoinAndSelect("courses.subject", "subject")
            .leftJoinAndSelect("courses.gradeLevel", "gradeLevel")
            .loadRelationCountAndMap("courses.chapterCount", "courses.chapters")
            .loadRelationCountAndMap(
                "courses.enrollmentCount",
                "courses.enrollments"
            )
            .where("user.id = :id", { id })
            .andWhere("user.role = :role", { role: UserRole.TEACHER })
            .getOne();

        if (!teacher) {
            throw new NotFoundException("Teacher not found");
        }

        // Filter only published courses
        const publishedCourses = teacher.courses?.filter(
            (course) =>
                course.status === "APPROVED" || course.status === "PUBLISHED"
        );

        const { passwordHash, ...teacherData } = teacher;

        return {
            ...teacherData,
            courses: publishedCourses,
            totalCourses: publishedCourses?.length || 0,
        };
    }

    async getFeaturedTeachers(emails: string[]) {
        if (!emails || emails.length === 0) {
            return [];
        }

        const teachers = await this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.courses", "courses")
            .loadRelationCountAndMap(
                "courses.enrollmentCount",
                "courses.enrollments"
            )
            .where("user.email IN (:...emails)", { emails })
            .andWhere("user.role = :role", { role: UserRole.TEACHER })
            .andWhere("user.status = :status", { status: UserStatus.ACTIVE })
            .getMany();

        // Map teachers and filter published courses
        const mappedTeachers = teachers.map((teacher) => {
            const publishedCourses = teacher.courses?.filter(
                (course) =>
                    course.status === "APPROVED" || course.status === "PUBLISHED"
            );

            const { passwordHash, ...teacherData } = teacher;

            return {
                ...teacherData,
                courses: publishedCourses,
                totalCourses: publishedCourses?.length || 0,
            };
        });

        // Sort by the order of emails array
        const sortedTeachers = emails
            .map((email) =>
                mappedTeachers.find((t) => t.email === email)
            )
            .filter((t) => t !== undefined);

        return sortedTeachers;
    }
}
