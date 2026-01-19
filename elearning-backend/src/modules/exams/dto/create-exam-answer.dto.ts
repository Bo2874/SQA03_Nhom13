import { IsString, IsNumber, IsBoolean, IsOptional } from "class-validator";

export class CreateExamAnswerDto {
    @IsOptional()
    @IsNumber()
    questionId?: number;

    @IsString()
    content: string;

    @IsBoolean()
    isCorrect: boolean;
}
