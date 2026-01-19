// user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "typeorm";
import { Course } from "./course.entity";
import { QuizAttempt } from "./quiz-attempt.entity";
import { Enrollment } from "./enrollment.entity";
import { Exam } from "./exam.entity";
import { ExamAttempt } from "./exam-attempt.entity";

export enum UserRole {
    ADMIN = "ADMIN",
    TEACHER = "TEACHER",
    STUDENT = "STUDENT",
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ name: "password_hash" })
    passwordHash: string;

    @Column({ name: "full_name" })
    fullName: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ type: "text", name: "avatar_url", nullable: true })
    avatarUrl: string;

    @Column({ type: "enum", enum: UserRole })
    role: UserRole;

    @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus;

    @Column({
        name: "created_at",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt: Date;

    @Column({
        name: "updated_at",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    updatedAt: Date;

    // RELATIONS
    @OneToMany(() => Course, (course) => course.teacher)
    courses: Course[];

    @OneToMany(() => QuizAttempt, (attempt) => attempt.student)
    quizAttempts: QuizAttempt[];

    @OneToMany(() => Enrollment, (enroll) => enroll.student)
    enrollments: Enrollment[];

    @OneToMany(() => Exam, (exam) => exam.teacher)
    exams: Exam[];

    @OneToMany(() => ExamAttempt, (attempt) => attempt.student)
    examAttempts: ExamAttempt[];
}
