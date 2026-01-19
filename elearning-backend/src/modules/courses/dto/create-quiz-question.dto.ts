import { IsString, IsNumber, IsOptional, IsNotEmpty } from "class-validator";

export class CreateQuizQuestionDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsNumber()
    order: number;
}
