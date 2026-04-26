import { IsNumber, IsEnum, IsOptional } from "class-validator";
import { EnrollmentStatus } from "../../../entities/enrollment.entity";

export class UpdateStatusEnrollmentDto {
    @IsOptional()
    @IsEnum(EnrollmentStatus)
    status?: EnrollmentStatus;
}
