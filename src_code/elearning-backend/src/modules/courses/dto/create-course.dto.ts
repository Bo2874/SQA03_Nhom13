import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsNotEmpty,
} from "class-validator";
import { CourseStatus } from "../../../entities/course.entity";

export class CreateCourseDto {
    @IsNumber()
    @IsNotEmpty()
    teacherId: number;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @IsOptional()
    @IsNumber()
    subjectId?: number;

    @IsOptional()
    @IsNumber()
    gradeLevelId?: number;

    @IsOptional()
    @IsEnum(CourseStatus)
    status?: CourseStatus = CourseStatus.DRAFT;
}
