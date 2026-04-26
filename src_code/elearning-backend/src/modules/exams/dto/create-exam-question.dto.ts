import { IsString, IsNumber, IsOptional } from "class-validator";

export class CreateExamQuestionDto {
    @IsOptional()
    @IsNumber()
    examId?: number;

    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsNumber()
    order: number;
}
