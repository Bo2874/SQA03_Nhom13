import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum CourseStatusByAdmin {
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PUBLISHED = "PUBLISHED",
}

export class UpdateCourseByAdminDto {
    @IsEnum(CourseStatusByAdmin)
    @IsNotEmpty()
    status: CourseStatusByAdmin;

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
