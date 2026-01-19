import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    Query,
    UseGuards,
    ParseIntPipe,
    Request,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { UpdateStatusEnrollmentDto } from "./dto/update-enrollment.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";
import { StudentEnrollmentsQueryDto } from "./dto/get-student-enrollments.dto";

@Controller("api/v1/courses")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) {}

    @Get("students/enrollments")
    @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
    async getStudentEnrollments(
        @Request() req,
        @Query() studentEnrollmentsQueryDto: StudentEnrollmentsQueryDto
    ) {
        const {
            subscribed,
            "student-id": studentIdParam,
            ...pagination
        } = studentEnrollmentsQueryDto;

        // Use query param only if provided (for admin purposes)
        const studentId = studentIdParam || req.user?.id;

        // Convert subscribed to boolean or null
        let subscribedFilter: boolean | null = null;
        if (subscribed === "true") {
            subscribedFilter = true;
        } else if (subscribed === "false") {
            subscribedFilter = false;
        }
        // If subscribed is undefined or any other value, subscribedFilter remains null

        const result = await this.enrollmentsService.getStudentEnrollments(
            studentId,
            subscribedFilter,
            pagination
        );
        return ApiResponse.success(result, "success");
    }

    @Post(":id/enrollments")
    @Roles(UserRole.STUDENT)
    async enrollCourse(
        @Body() createEnrollmentDto: CreateEnrollmentDto,
        @Param("id", ParseIntPipe) courseId: number
    ) {
        const enrollment = await this.enrollmentsService.createEnrollment(
            createEnrollmentDto,
            courseId
        );
        return ApiResponse.success(enrollment, "success");
    }

    @Put(":courseId/enrollments/:id/status")
    @Roles(UserRole.STUDENT)
    async updateEnrollment(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("id", ParseIntPipe) enrollmentId: number,
        @Body() updateStatusEnrollmentDto: UpdateStatusEnrollmentDto
    ) {
        const enrollment = await this.enrollmentsService.updateEnrollment(
            courseId,
            enrollmentId,
            updateStatusEnrollmentDto
        );
        return ApiResponse.success(enrollment, "success");
    }

    @Get(":id/enrollments/:enrollmentId")
    @Roles(UserRole.STUDENT)
    async getEnrollment(
        @Param("id", ParseIntPipe) courseId: number,
        @Param("enrollmentId", ParseIntPipe) enrollmentId: number
    ) {
        const enrollment = await this.enrollmentsService.findEnrollmentById(
            courseId,
            enrollmentId
        );
        return ApiResponse.success(enrollment, "success");
    }

    @Post(":courseId/enrollments/:enrollmentId/episodes/:episodeId/complete")
    @Roles(UserRole.STUDENT)
    async markEpisodeComplete(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("enrollmentId", ParseIntPipe) enrollmentId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number
    ) {
        await this.enrollmentsService.markEpisodeComplete(
            courseId,
            enrollmentId,
            episodeId
        );

        // Get updated enrollment to return with new progress
        const enrollment = await this.enrollmentsService.findEnrollmentById(
            courseId,
            enrollmentId
        );

        return ApiResponse.success(
            { message: "Episode marked as complete", enrollment },
            "success"
        );
    }

    @Put(":courseId/enrollments/:enrollmentId/last-episode")
    @Roles(UserRole.STUDENT)
    async updateLastEpisode(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("enrollmentId", ParseIntPipe) enrollmentId: number,
        @Body("episodeId", ParseIntPipe) episodeId: number
    ) {
        const enrollment = await this.enrollmentsService.updateLastEpisode(
            courseId,
            enrollmentId,
            episodeId
        );
        return ApiResponse.success(enrollment, "Last episode updated");
    }

    // IMPORTANT: More specific routes must come before less specific ones
    @Post(":courseId/enrollments/:enrollmentId/reset")
    @Roles(UserRole.STUDENT)
    async resetCourse(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("enrollmentId", ParseIntPipe) enrollmentId: number
    ) {
        const enrollment = await this.enrollmentsService.resetCourse(
            courseId,
            enrollmentId
        );
        return ApiResponse.success(
            enrollment,
            "Đã reset khóa học. Bạn có thể bắt đầu học lại từ đầu!"
        );
    }

    @Post(":courseId/enrollments/:enrollmentId/complete")
    @Roles(UserRole.STUDENT)
    async completeCourse(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("enrollmentId", ParseIntPipe) enrollmentId: number
    ) {
        const enrollment = await this.enrollmentsService.completeCourse(
            courseId,
            enrollmentId
        );
        return ApiResponse.success(
            enrollment,
            "Chúc mừng! Bạn đã hoàn thành khóa học!"
        );
    }
}
