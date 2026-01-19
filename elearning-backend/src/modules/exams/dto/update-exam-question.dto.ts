import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class UpdateExamQuestionDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsNumber()
    order?: number;
}
