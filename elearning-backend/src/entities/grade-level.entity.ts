// grade-level.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Course } from "./course.entity";

@Entity("grade_levels")
export class GradeLevel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => Course, (c) => c.gradeLevel)
    courses: Course[];
}
