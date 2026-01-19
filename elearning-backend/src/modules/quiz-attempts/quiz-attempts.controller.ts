import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from "@nestjs/common";
import { QuizAttemptsService } from "./quiz-attempts.service";
import { CreateQuizAttemptDto } from "./dto/create-quiz-attempt.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "../../entities/user.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";

@Controller("api/v1/quiz-attempts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizAttemptsController {
    constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

    /**
     * Submit quiz (Student only)
     * POST /api/v1/quiz-attempts
     */
    @Post()
    @Roles(UserRole.STUDENT)
    @HttpCode(HttpStatus.CREATED)
    async submitQuiz(
        @Body() createQuizAttemptDto: CreateQuizAttemptDto,
        @CurrentUser() user: any
    ) {
        // Verify student can only submit their own quiz
        if (createQuizAttemptDto.studentId !== user.userId) {
            return ApiResponse.error("You can only submit your own quiz");
        }

        const result =
            await this.quizAttemptsService.submitQuiz(createQuizAttemptDto);
        return ApiResponse.success(result, "Quiz submitted successfully");
    }

    /**
     * Get all quiz attempts by student
     * GET /api/v1/quiz-attempts/student/:studentId
     */
    @Get("student/:studentId")
    async findByStudent(
        @Param("studentId", ParseIntPipe) studentId: number,
        @CurrentUser() user: any
    ) {
        // Student can only view their own attempts
        if (user.role === UserRole.STUDENT && user.userId !== studentId) {
            return ApiResponse.error("Unauthorized access");
        }

        const attempts =
            await this.quizAttemptsService.findByStudent(studentId);
        return ApiResponse.success(attempts, "success");
    }

    /**
     * Get all quiz attempts by episode (Teacher/Admin)
     * GET /api/v1/quiz-attempts/episode/:episodeId
     */
    @Get("episode/:episodeId")
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async findByEpisode(@Param("episodeId", ParseIntPipe) episodeId: number) {
        const attempts =
            await this.quizAttemptsService.findByEpisode(episodeId);
        return ApiResponse.success(attempts, "success");
    }

    /**
     * Get quiz leaderboard
     * GET /api/v1/quiz-attempts/episode/:episodeId/leaderboard
     */
    @Get("episode/:episodeId/leaderboard")
    async getLeaderboard(@Param("episodeId", ParseIntPipe) episodeId: number) {
        const leaderboard =
            await this.quizAttemptsService.getQuizLeaderboard(episodeId);
        return ApiResponse.success(leaderboard, "success");
    }

    /**
     * Get all quiz attempts by course (Teacher/Admin)
     * GET /api/v1/quiz-attempts/course/:courseId
     */
    @Get("course/:courseId")
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async findByCourse(@Param("courseId", ParseIntPipe) courseId: number) {
        const attempts = await this.quizAttemptsService.findByCourse(courseId);
        return ApiResponse.success(attempts, "success");
    }

    /**
     * Get specific quiz attempt details
     * GET /api/v1/quiz-attempts/:id
     */
    @Get(":id")
    async findOne(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: any
    ) {
        const attempt = await this.quizAttemptsService.findOne(id);

        // Student can only view their own attempt
        if (
            (user.role === UserRole.STUDENT && attempt.student,
            id !== user.userId)
        ) {
            return ApiResponse.error("Unauthorized access");
        }

        return ApiResponse.success(attempt, "success");
    }

    /**
     * Get detailed result with answers
     * GET /api/v1/quiz-attempts/:id/result
     */
    @Get(":id/result")
    async getDetailedResult(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: any
    ) {
        const attempt = await this.quizAttemptsService.findOne(id);

        // Student can only view their own result
        if (
            user.role === UserRole.STUDENT &&
            attempt.student.id !== user.userId
        ) {
            return ApiResponse.error("Unauthorized access");
        }

        const result = await this.quizAttemptsService.getDetailedResult(id);
        return ApiResponse.success(result, "success");
    }

    /**
     * Check if student has attempted quiz
     * GET /api/v1/quiz-attempts/check/:studentId/:episodeId
     */
    @Get("check/:studentId/:episodeId")
    @Roles(UserRole.STUDENT)
    async checkAttempt(
        @Param("studentId", ParseIntPipe) studentId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @CurrentUser() user: any
    ) {
        // Student can only check their own attempts
        if (user.userId !== studentId) {
            return ApiResponse.error("Unauthorized access");
        }

        const attempt = await this.quizAttemptsService.checkAttempt(
            studentId,
            episodeId
        );

        return ApiResponse.success(
            {
                hasAttempted: !!attempt,
                attempt: attempt
                    ? {
                          id: attempt.id,
                          score: attempt.score,
                          submittedAt: attempt.submittedAt,
                          passed: Number(attempt.score) >= 60,
                      }
                    : null,
            },
            "success"
        );
    }

    /**
     * Get quiz statistics by course
     * GET /api/v1/quiz-attempts/statistics/course/:courseId
     */
    @Get("statistics/course/:courseId")
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async getStatistics(@Param("courseId", ParseIntPipe) courseId: number) {
        const stats =
            await this.quizAttemptsService.getStatisticsByCourse(courseId);
        return ApiResponse.success(stats, "success");
    }
}
