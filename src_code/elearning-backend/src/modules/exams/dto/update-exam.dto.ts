import {
    IsString,
    IsNumber,
    IsEnum,
    IsOptional,
} from "class-validator";
import { ExamStatus } from "../../../entities/exam.entity";

export class UpdateExamDto {
    @IsOptional()
    @IsNumber()
    courseId?: number;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsNumber()
    durationMinutes?: number;

    @IsOptional()
    @IsEnum(ExamStatus)
    status?: ExamStatus;

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
