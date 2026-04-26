import { IsString, IsNumber, IsOptional, IsNotEmpty } from "class-validator";

export class CreateMaterialDto {
    @IsString()
    @IsNotEmpty({ message: "Title is required." })
    title: string;

    @IsString()
    @IsNotEmpty({ message: "File url is required." })
    fileUrl: string;

    @IsOptional()
    @IsNumber()
    fileSizeKb?: number;
}
