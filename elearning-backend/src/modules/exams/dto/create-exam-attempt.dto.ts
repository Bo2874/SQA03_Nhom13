import { IsNumber, IsOptional } from "class-validator";

export class CreateExamAttemptDto {
    @IsNumber()
    examId: number;

    @IsNumber()
    studentId: number;
}
