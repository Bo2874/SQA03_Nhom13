import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateCourseMaterialDto {
    @IsString()
    @IsOptional()
    title: string;

    @IsString()
    @IsOptional()
    fileUrl: string;

    @IsNumber()
    @IsOptional()
    fileSizeKb?: number;
}
