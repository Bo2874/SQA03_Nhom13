// quiz-attempt.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    JoinColumn,
} from "typeorm";
import { Episode } from "./episode.entity";
import { User } from "./user.entity";

@Entity("quiz_attempts")
export class QuizAttempt {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Episode)
    @JoinColumn({ name: "episode_id" })
    episode: Episode;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    student: User;

    @Column({ type: "timestamp", name: "submitted_at", nullable: true })
    submittedAt: Date;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    score: number;

    @Column({ type: "json", name: "responses_json", nullable: true })
    responsesJson: any;
}
