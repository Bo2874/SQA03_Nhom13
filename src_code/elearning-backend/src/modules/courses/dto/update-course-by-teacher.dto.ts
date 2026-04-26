import { IsString, IsOptional, IsNumber, IsEnum } from "class-validator";

export enum CourseStatusByTeacher {
    DRAFT = "DRAFT",
    PENDING_REVIEW = "PENDING_REVIEW",
}

export class UpdateCourseByTeacherDto {
    @IsOptional()
    @IsString()
    title?: string;

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
    @IsEnum(CourseStatusByTeacher)
    status?: CourseStatusByTeacher;
}
