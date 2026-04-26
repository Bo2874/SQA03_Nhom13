import {
    IsString,
    IsNumber,
    IsEnum,
    IsOptional,
} from "class-validator";
import { ExamStatus } from "../../../entities/exam.entity";

export class CreateExamDto {
    @IsNumber()
    teacherId: number;

    @IsOptional()
    @IsNumber()
    courseId?: number;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    durationMinutes: number;

    @IsOptional()
    @IsNumber()
    passingScore?: number;

    @IsOptional()
    @IsNumber()
    maxAttempts?: number;

    @IsOptional()
    @IsEnum(ExamStatus)
    status?: ExamStatus = ExamStatus.DRAFT;
}
