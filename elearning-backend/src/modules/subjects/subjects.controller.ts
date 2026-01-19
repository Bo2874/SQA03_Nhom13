import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
} from "@nestjs/common";
import { SubjectsService } from "./subjects.service";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";

@Controller("api/v1/subjects")
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) {}

    // Public endpoint - no authentication required
    @Get()
    async findAll() {
        const subjects = await this.subjectsService.findAll();
        return ApiResponse.success(subjects, "success");
    }

    // Public endpoint - no authentication required
    @Get(":id")
    async findOne(@Param("id") id: string) {
        const subject = await this.subjectsService.findOne(+id);
        return ApiResponse.success(subject, "success");
    }

    // Protected endpoint - only ADMIN can create
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() createSubjectDto: CreateSubjectDto) {
        const subject = await this.subjectsService.create(createSubjectDto);
        return ApiResponse.success(subject, "Subject created successfully");
    }

    // Protected endpoint - only ADMIN can update
    @Put(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(
        @Param("id") id: string,
        @Body() updateSubjectDto: UpdateSubjectDto
    ) {
        const subject = await this.subjectsService.update(
            +id,
            updateSubjectDto
        );
        return ApiResponse.success(subject, "Subject updated successfully");
    }

    // Protected endpoint - only ADMIN can delete
    @Delete(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async remove(@Param("id") id: string) {
        await this.subjectsService.remove(+id);
        return ApiResponse.success(null, "Subject deleted successfully");
    }
}
