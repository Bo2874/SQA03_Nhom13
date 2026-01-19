import { IsString, IsNotEmpty } from "class-validator";

export class CreateGradeLevelDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
