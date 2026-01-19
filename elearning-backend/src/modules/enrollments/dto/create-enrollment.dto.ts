import { IsNumber } from "class-validator";

export class CreateEnrollmentDto {
    @IsNumber()
    studentId: number;
}
