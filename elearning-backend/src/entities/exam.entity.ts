import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Course } from "./course.entity";
import { ExamQuestion } from "./exam-question.entity";
import { ExamAttempt } from "./exam-attempt.entity";

export enum ExamStatus {
    DRAFT = "DRAFT",
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    LIVE = "LIVE",
    CLOSED = "CLOSED",
}

@Entity("exams")
export class Exam {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "teacher_id", type: "bigint", nullable: false })
    teacherId: number;

    @Column({ name: "course_id", type: "bigint", nullable: true })
    courseId: number | null;

    @Column({ name: "title", type: "varchar", length: 255, nullable: false })
    title: string;

    @Column({ name: "duration_minutes", type: "int", nullable: false })
    durationMinutes: number;

    @Column({
        name: "status",
        type: "enum",
        enum: ExamStatus,
        default: ExamStatus.DRAFT,
    })
    status: ExamStatus;

    @Column({ name: "rejection_reason", type: "text", nullable: true })
    rejectionReason: string | null;

    @Column({ name: "submitted_at", type: "timestamp", nullable: true })
    submittedAt: Date | null;

    @Column({ name: "approved_at", type: "timestamp", nullable: true })
    approvedAt: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.exams)
    @JoinColumn({ name: "teacher_id" })
    teacher: User;

    @ManyToOne(() => Course, (course) => course.exams, { nullable: true })
    @JoinColumn({ name: "course_id" })
    course: Course | null;

    @OneToMany(() => ExamQuestion, (question) => question.exam, {
        cascade: true,
    })
    questions: ExamQuestion[];

    @OneToMany(() => ExamAttempt, (attempt) => attempt.exam)
    attempts: ExamAttempt[];
}
