import { IsNotEmpty } from "class-validator";

export class SubmitExamDto {
    @IsNotEmpty()
    responsesJson: Record<number, number>;
}
