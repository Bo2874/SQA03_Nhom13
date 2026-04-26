// course.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Subject } from "./subject.entity";
import { GradeLevel } from "./grade-level.entity";
import { Chapter } from "./chapter.entity";
import { CourseMaterial } from "./course-material.entity";
import { Enrollment } from "./enrollment.entity";
import { Exam } from "./exam.entity";
import { ZoomMeeting } from "./zoom-meeting.entity";

export enum CourseStatus {
    DRAFT = "DRAFT",
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PUBLISHED = "PUBLISHED",
}

@Entity("courses")
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "teacher_id" })
    teacherId: number;

    @ManyToOne(() => User, (user) => user.courses)
    @JoinColumn({ name: "teacher_id" })
    teacher: User;

    @Column()
    title: string;

    @Column({ type: "text", nullable: true })
    summary: string;

    @Column({ type: "text", name: "thumbnail_url", nullable: true })
    thumbnailUrl: string;

    @ManyToOne(() => Subject, (subject) => subject.courses)
    @JoinColumn({ name: "subject_id" })
    subject: Subject;

    @ManyToOne(() => GradeLevel, (grade) => grade.courses)
    @JoinColumn({ name: "grade_level_id" })
    gradeLevel: GradeLevel;

    @Column({ type: "enum", enum: CourseStatus, default: CourseStatus.DRAFT })
    status: CourseStatus;

    @Column({ type: "text", name: "rejection_reason", nullable: true })
    rejectionReason: string;

    @Column({ type: "timestamp", name: "submitted_at", nullable: true })
    submittedAt: Date;

    @Column({ type: "timestamp", name: "approved_at", nullable: true })
    approvedAt: Date;

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

    @OneToMany(() => Chapter, (c) => c.course)
    chapters: Chapter[];

    @OneToMany(() => CourseMaterial, (m) => m.course)
    materials: CourseMaterial[];

    @OneToMany(() => Enrollment, (e) => e.course)
    enrollments: Enrollment[];

    @OneToMany(() => Exam, (e) => e.course)
    exams: Exam[];

    @OneToMany(() => ZoomMeeting, (zm) => zm.course)
    zoomMeetings: ZoomMeeting[];
}
