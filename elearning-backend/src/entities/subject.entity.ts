// subject.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Course } from "./course.entity";

@Entity("subjects")
export class Subject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => Course, (course) => course.subject)
    courses: Course[];
}
