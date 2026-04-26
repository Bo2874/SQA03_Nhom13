import { IsOptional, IsString, IsInt, IsBooleanString } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class StudentEnrollmentsQueryDto extends PaginationDto {
    @IsOptional()
    @IsBooleanString()
    subscribed?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    "student-id": number;
}
