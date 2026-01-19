// quiz-question.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { Episode } from "./episode.entity";
import { QuizAnswer } from "./quiz-answer.entity";

@Entity("quiz_questions")
export class QuizQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Episode, (e) => e.quizQuestions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "episode_id" })
    episode: Episode;

    @Column({ type: "text" })
    content: string;

    @Column({ type: "text", name: "image_url", nullable: true })
    imageUrl: string;

    @Column()
    order: number;

    @OneToMany(() => QuizAnswer, (a) => a.question)
    answers: QuizAnswer[];
}
