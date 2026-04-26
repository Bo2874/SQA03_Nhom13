// chapter.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { Course } from "./course.entity";
import { Episode } from "./episode.entity";

@Entity("chapters")
export class Chapter {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Course, (course) => course.chapters, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "course_id" })
    course: Course;

    @Column()
    title: string;

    @Column()
    order: number;

    @OneToMany(() => Episode, (e) => e.chapter)
    episodes: Episode[];
}
