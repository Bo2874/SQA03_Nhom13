import { IsOptional, IsString, IsBoolean } from "class-validator";

export class UpdateExamAnswerDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsBoolean()
    isCorrect?: boolean;
}
