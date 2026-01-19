import { IsArray, IsEmail } from "class-validator";
import { Type } from "class-transformer";

export class GetFeaturedTeachersDto {
    @IsArray()
    @IsEmail({}, { each: true })
    @Type(() => String)
    emails: string[];
}
