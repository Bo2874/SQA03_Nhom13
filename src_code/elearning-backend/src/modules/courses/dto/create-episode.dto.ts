import {
    IsString,
    IsNumber,
    IsEnum,
    IsOptional,
    IsNotEmpty,
} from "class-validator";
import { EpisodeType } from "../../../entities/episode.entity";

export class CreateEpisodeDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsEnum(EpisodeType)
    type: EpisodeType = EpisodeType.VIDEO;

    @IsOptional()
    @IsString()
    videoUrl?: string;

    @IsOptional()
    @IsNumber()
    durationSeconds?: number;

    @IsNumber()
    @IsNotEmpty()
    order: number;
}
