// enrollment.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Course } from "./course.entity";
import { Episode } from "./episode.entity";
import { EpisodeCompletion } from "./episode-completion.entity";

export enum EnrollmentStatus {
    ACTIVE = "ACTIVE",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED",
}

@Entity("enrollments")
export class Enrollment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (u) => u.enrollments)
    @JoinColumn({ name: "user_id" })
    student: User;

    @ManyToOne(() => Course, (c) => c.enrollments)
    @JoinColumn({ name: "course_id" })
    course: Course;

    @Column({
        type: "enum",
        enum: EnrollmentStatus,
        default: EnrollmentStatus.ACTIVE,
    })
    status: EnrollmentStatus;

    @Column({
        type: "timestamp",
        name: "enrolled_at",
        default: () => "CURRENT_TIMESTAMP",
    })
    enrolledAt: Date;

    @Column({ type: "timestamp", name: "cancelled_at", nullable: true })
    cancelledAt: Date | null;

    @Column({ type: "timestamp", name: "completed_at", nullable: true })
    completedAt: Date | null;

    @Column({
        name: "progress_percentage",
        type: "decimal",
        precision: 5,
        scale: 2,
        default: 0,
    })
    progressPercentage: number;

    @Column({
        name: "is_completed",
        type: "boolean",
        default: false,
    })
    isCompleted: boolean;

    @ManyToOne(() => Episode, { nullable: true })
    @JoinColumn({ name: "last_episode_id" })
    lastEpisode: Episode | null;

    @OneToMany(() => EpisodeCompletion, (ec) => ec.enrollment)
    completions: EpisodeCompletion[];
}
