import { IsString, IsNumber, IsNotEmpty } from "class-validator";

export class CreateChapterDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsNumber()
    @IsNotEmpty()
    order: number;
}
