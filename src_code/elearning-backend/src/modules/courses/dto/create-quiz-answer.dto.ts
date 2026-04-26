import { IsString, IsBoolean, IsNotEmpty, IsNumber } from "class-validator";

export class CreateQuizAnswerDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsBoolean()
    @IsNotEmpty()
    isCorrect: boolean;

    @IsNumber()
    order: number;
}
