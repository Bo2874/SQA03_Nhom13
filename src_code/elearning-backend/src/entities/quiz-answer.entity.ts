// quiz-answer.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { QuizQuestion } from "./quiz-question.entity";

@Entity("quiz_answers")
export class QuizAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => QuizQuestion, (q) => q.answers, { onDelete: "CASCADE" })
    @JoinColumn({ name: "question_id" })
    question: QuizQuestion;

    @Column({ nullable: false })
    content: string;

    @Column({ name: "is_correct", default: false })
    isCorrect: boolean;

    @Column({ nullable: false })
    order: number;
}
