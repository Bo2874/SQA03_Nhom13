import {
    IsString,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsNumber,
} from "class-validator";

export class UpdateQuizAnswerDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    content?: string;

    @IsOptional()
    @IsBoolean()
    @IsNotEmpty()
    isCorrect?: boolean;

    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    order?: number;
}
