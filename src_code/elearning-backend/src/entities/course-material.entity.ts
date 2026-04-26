import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from "typeorm";
import { Course } from "./course.entity";

@Entity("course_materials")
export class CourseMaterial {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Course, (course) => course.materials, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "course_id" })
    course: Course;

    @Column()
    title: string;

    @Column({ type: "text" })
    fileUrl: string;

    @Column({ type: "int", nullable: true })
    fileSizeKb: number;

    @CreateDateColumn()
    uploadedAt: Date;
}
