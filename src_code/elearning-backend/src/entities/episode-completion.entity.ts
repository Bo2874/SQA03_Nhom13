// episode-completion.entity.ts
import { Entity, ManyToOne, PrimaryColumn, Column, JoinColumn } from "typeorm";
import { Enrollment } from "./enrollment.entity";
import { Episode } from "./episode.entity";

@Entity("episode_completions")
export class EpisodeCompletion {
    @PrimaryColumn({ name: "enrollment_id" })
    enrollmentId: number;

    @PrimaryColumn({ name: "episode_id" })
    episodeId: number;

    @ManyToOne(() => Enrollment, (e) => e.completions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "enrollment_id" })
    enrollment: Enrollment;

    @ManyToOne(() => Episode, { onDelete: "CASCADE" })
    @JoinColumn({ name: "episode_id" })
    episode: Episode;

    @Column({
        type: "timestamp",
        name: "completed_at",
        default: () => "CURRENT_TIMESTAMP",
    })
    completedAt: Date;
}
