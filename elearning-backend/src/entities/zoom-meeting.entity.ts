import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from "typeorm";
import { Course } from "./course.entity";
import { User } from "./user.entity";

@Entity("zoom_meetings")
export class ZoomMeeting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "course_id", type: "int" })
    courseId: number;

    @ManyToOne(() => Course, (course) => course.zoomMeetings)
    @JoinColumn({ name: "course_id" })
    course: Course;

    @Column({ name: "teacher_id", type: "int" })
    teacherId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "teacher_id" })
    teacher: User;

    @Column({ type: "varchar", length: 255 })
    title: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({
        name: "zoom_meeting_id",
        type: "varchar",
        length: 100,
        nullable: true,
    })
    zoomMeetingId: string;

    @Column({ name: "join_url", type: "text", nullable: true })
    joinUrl: string;

    @Column({ name: "start_url", type: "text", nullable: true })
    startUrl: string;

    @Column({
        name: "meeting_password",
        type: "varchar",
        length: 50,
        nullable: true,
    })
    meetingPassword: string;

    @Column({ name: "scheduled_time", type: "timestamp", nullable: true })
    scheduledTime: Date;

    @Column({ name: "duration_minutes", type: "int", default: 60 })
    durationMinutes: number;

    @Column({ type: "varchar", length: 50, default: "scheduled" })
    status: string; // scheduled, live, completed, cancelled

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
}
