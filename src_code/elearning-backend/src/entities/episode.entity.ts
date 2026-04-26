// episode.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    RelationId,
} from "typeorm";
import { Chapter } from "./chapter.entity";
import { QuizQuestion } from "./quiz-question.entity";

export enum EpisodeType {
    VIDEO = "VIDEO",
    QUIZ = "QUIZ",
}

@Entity("episodes")
export class Episode {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Chapter, (chapter) => chapter.episodes, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "chapter_id" })
    chapter: Chapter;

    @RelationId((episode: Episode) => episode.chapter)
    chapter_id: number;

    @Column()
    title: string;

    @Column({ type: "enum", enum: EpisodeType })
    type: EpisodeType;

    @Column({ type: "text", name: "video_url", nullable: true })
    videoUrl: string;

    @Column({ name: "duration_seconds", nullable: true })
    durationSeconds: number;

    @Column()
    order: number;

    @Column({
        name: "created_at",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt: Date;

    @OneToMany(() => QuizQuestion, (q) => q.episode)
    quizQuestions: QuizQuestion[];
}
