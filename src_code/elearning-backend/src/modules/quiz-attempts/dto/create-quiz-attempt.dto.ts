import { IsNumber, IsObject, IsNotEmpty } from "class-validator";

export class CreateQuizAttemptDto {
    @IsNumber()
    @IsNotEmpty()
    episodeId: number;

    @IsNumber()
    @IsNotEmpty()
    studentId: number;

    @IsObject()
    @IsNotEmpty()
    responsesJson: Record<number, number>; // { questionId: answerId }
}
