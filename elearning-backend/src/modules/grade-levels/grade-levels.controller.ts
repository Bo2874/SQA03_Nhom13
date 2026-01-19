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
import { GradeLevelsService } from "./grade-levels.service";
import { CreateGradeLevelDto } from "./dto/create-grade-level.dto";
import { UpdateGradeLevelDto } from "./dto/update-grade-level.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";

@Controller("api/v1/grade-levels")
export class GradeLevelsController {
    constructor(private readonly gradeLevelsService: GradeLevelsService) {}

    // Public endpoint - no authentication required
    @Get()
    async findAll() {
        const gradeLevels = await this.gradeLevelsService.findAll();
        return ApiResponse.success(gradeLevels, "success");
    }

    // Public endpoint - no authentication required
    @Get(":id")
    async findOne(@Param("id") id: string) {
        const gradeLevel = await this.gradeLevelsService.findOne(+id);
        return ApiResponse.success(gradeLevel, "success");
    }

    // Protected endpoint - only ADMIN can create
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() createGradeLevelDto: CreateGradeLevelDto) {
        const gradeLevel =
            await this.gradeLevelsService.create(createGradeLevelDto);
        return ApiResponse.success(
            gradeLevel,
            "Grade level created successfully"
        );
    }

    // Protected endpoint - only ADMIN can update
    @Put(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(
        @Param("id") id: string,
        @Body() updateGradeLevelDto: UpdateGradeLevelDto
    ) {
        const gradeLevel = await this.gradeLevelsService.update(
            +id,
            updateGradeLevelDto
        );
        return ApiResponse.success(
            gradeLevel,
            "Grade level updated successfully"
        );
    }

    // Protected endpoint - only ADMIN can delete
    @Delete(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async remove(@Param("id") id: string) {
        await this.gradeLevelsService.remove(+id);
        return ApiResponse.success(null, "Grade level deleted successfully");
    }
}
