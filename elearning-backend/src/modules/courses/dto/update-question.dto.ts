import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateQuestionDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsNumber()
    order: number;
}
