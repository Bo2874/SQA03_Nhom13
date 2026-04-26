import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { CourseStatus } from "src/entities/course.entity";

export class CoursesQueryDto extends PaginationDto {
    @IsOptional()
    @IsEnum(CourseStatus)
    status?: CourseStatus;
}
