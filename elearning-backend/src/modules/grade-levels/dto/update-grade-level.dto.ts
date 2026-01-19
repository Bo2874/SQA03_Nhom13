import { IsString, IsOptional } from "class-validator";

export class UpdateGradeLevelDto {
    @IsOptional()
    @IsString()
    name?: string;
}
