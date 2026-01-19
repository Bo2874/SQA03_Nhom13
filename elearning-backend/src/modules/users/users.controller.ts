import {
    Controller,
    Get,
    Put,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Post,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { SearchTeachersDto } from "./dto/search-teachers.dto";
import { GetFeaturedTeachersDto } from "./dto/get-featured-teachers.dto";

@Controller("api/v1")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // Public endpoint - search teachers
    @Get("teachers/search")
    async searchTeachers(@Query() searchDto: SearchTeachersDto) {
        const result = await this.usersService.searchTeachers(searchDto);
        return ApiResponse.success(result, "success");
    }

    // Public endpoint - get teacher detail by id
    @Get("teachers/:id")
    async getTeacherById(@Param("id") id: string) {
        const result = await this.usersService.getTeacherById(+id);
        return ApiResponse.success(result, "success");
    }

    // Public endpoint - get featured teachers by emails
    @Post("teachers/featured")
    async getFeaturedTeachers(@Body() dto: GetFeaturedTeachersDto) {
        const result = await this.usersService.getFeaturedTeachers(dto.emails);
        return ApiResponse.success(result, "success");
    }

    // Admin endpoints
    // Lấy danh sách tất cả giáo viên
    @Get("teachers")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAllTeachers(@Query() paginationDto: PaginationDto) {
        const result = await this.usersService.getAllTeachers(paginationDto);
        return ApiResponse.success(result, "success");
    }

    // Admin tạo tài khoản giáo viên mới
    @Post("teachers")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async createTeacher(@Body() createTeacherDto: CreateTeacherDto) {
        const teacher = await this.usersService.createTeacher(createTeacherDto);
        return ApiResponse.success(teacher, "Teacher created successfully");
    }

    // Admin update teacher
    @Patch("teachers/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateTeacher(
        @Param("id") id: string,
        @Body() updateUserDto: UpdateUserDto
    ) {
        const user = await this.usersService.updateUser(+id, updateUserDto);
        return ApiResponse.success(user, "Teacher updated successfully");
    }

    @Put("users/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async updateUser(
        @Param("id") id: string,
        @Body() updateUserDto: UpdateUserDto
    ) {
        const user = await this.usersService.updateUser(+id, updateUserDto);
        return ApiResponse.success(user, "update successfully");
    }

    @Delete("teachers/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async deleteTeacher(@Param("id") id: string) {
        await this.usersService.deleteUser(+id);
        return ApiResponse.success(null, "Teacher deleted successfully");
    }

    @Delete("students/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async deleteStudent(@Param("id") id: string) {
        await this.usersService.deleteUser(+id);
        return ApiResponse.success(null, "Student deleted successfully");
    }
}
