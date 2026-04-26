import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Exam } from "./exam.entity";
import { User } from "./user.entity";

@Entity("exam_attempts")
export class ExamAttempt {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Exam, (exam) => exam.attempts)
    @JoinColumn({ name: "exam_id" })
    exam: Exam;

    @ManyToOne(() => User, (user) => user.examAttempts)
    @JoinColumn({ name: "user_id" })
    student: User;

    @Column()
    startedAt: Date;

    @Column({ nullable: true })
    submittedAt: Date;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    score: number;

    @Column({ type: "int", nullable: true })
    timeSpentSeconds: number;

    @Column({ type: "json", name: "responses_json", nullable: true })
    responsesJson: any;
}
