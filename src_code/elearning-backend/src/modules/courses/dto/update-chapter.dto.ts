import { IsString, IsNumber, IsOptional } from "class-validator";

export class UpdateChapterDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsNumber()
    @IsOptional()
    order?: number;
}
