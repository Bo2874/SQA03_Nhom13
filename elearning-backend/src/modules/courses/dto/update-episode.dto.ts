import { IsString, IsNumber, IsOptional, IsEnum } from "class-validator";
import { EpisodeType } from "src/entities/episode.entity";

export class UpdateEpisodeDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsOptional()
    @IsNumber()
    durationSeconds?: number;

    @IsOptional()
    @IsEnum(EpisodeType)
    type?: EpisodeType;
}
