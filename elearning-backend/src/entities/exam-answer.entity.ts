import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { ExamQuestion } from "./exam-question.entity";

@Entity("exam_answers")
export class ExamAnswer {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "question_id", type: "bigint", nullable: false })
    questionId: number;

    @Column({ name: "content", type: "varchar", length: 500, nullable: false })
    content: string;

    @Column({ name: "is_correct", type: "boolean", default: false })
    isCorrect: boolean;

    @ManyToOne(() => ExamQuestion, (question) => question.answers, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "question_id" })
    question: ExamQuestion;
}
