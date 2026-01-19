import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from "@nestjs/common";
import { ExamsService } from "./exams.service";
import { CreateExamDto } from "./dto/create-exam.dto";
import { UpdateExamDto } from "./dto/update-exam.dto";
import { CreateExamQuestionDto } from "./dto/create-exam-question.dto";
import { CreateExamAnswerDto } from "./dto/create-exam-answer.dto";
import { CreateExamAttemptDto } from "./dto/create-exam-attempt.dto";
import { SubmitExamDto } from "./dto/submit-exam.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { User, UserRole } from "../../entities/user.entity";
import { ExamStatus } from "../../entities/exam.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("api/v1/exams")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
    constructor(private readonly examsService: ExamsService) {}

    @Get()
    @Roles(UserRole.TEACHER, UserRole.STUDENT)
    async getExams(
        @Query() paginationDto: PaginationDto,
        @Query("status") status?: ExamStatus,
        @CurrentUser() user?: User
    ) {
        const result = await this.examsService.getExams(
            paginationDto,
            status,
            user
        );
        return ApiResponse.success(result.data, "success");
    }

    @Get(":id")
    async getExam(@Param("id") id: string) {
        const exam = await this.examsService.findExamById(+id);
        return ApiResponse.success(exam, "success");
    }

    @Post()
    @Roles(UserRole.TEACHER)
    async createExam(@Body() createExamDto: CreateExamDto) {
        const exam = await this.examsService.createExam(createExamDto);
        return ApiResponse.success(exam, "success");
    }

    @Put(":id")
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async updateExam(
        @Param("id") id: string,
        @Body() updateExamDto: UpdateExamDto
    ) {
        const exam = await this.examsService.updateExam(+id, updateExamDto);
        return ApiResponse.success(exam, "success");
    }

    @Delete(":id")
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async deleteExam(@Param("id") id: string) {
        await this.examsService.deleteExam(+id);
        return ApiResponse.success(null, "Exam deleted successfully");
    }

    @Post(":id/questions")
    @Roles(UserRole.TEACHER)
    async createQuestion(
        @Param("id") examId: string,
        @Body() createQuestionDto: CreateExamQuestionDto
    ) {
        const questionData = { ...createQuestionDto, examId: +examId };
        const question =
            await this.examsService.createExamQuestion(questionData);
        return ApiResponse.success(question, "success");
    }

    @Post(":examId/questions/:id/answers")
    @Roles(UserRole.TEACHER)
    async createAnswer(
        @Param("id") questionId: string,
        @Body() createAnswerDto: CreateExamAnswerDto
    ) {
        const answerData = { ...createAnswerDto, questionId: +questionId };
        const answer = await this.examsService.createExamAnswer(answerData);
        return ApiResponse.success(answer, "success");
    }

    @Get(":id/leaderboard")
    @Roles(UserRole.TEACHER, UserRole.STUDENT)
    async getLeaderboard(@Param("id") id: string) {
        const leaderboard = await this.examsService.getExamLeaderboard(+id);
        return ApiResponse.success(leaderboard, "success");
    }
    @Get(":id/questions")
    @Roles(UserRole.TEACHER)
    async getExamQuestions(@Param("id") id: string) {
        const questions = await this.examsService.getExamQuestions(+id);
        return ApiResponse.success(questions, "success");
    }

    @Put(":examId/questions/:id")
    @Roles(UserRole.TEACHER)
    async updateQuestion(
        @Param("examId") examId: string,
        @Param("id") id: string,
        @Body() updateData: any
    ) {
        const question = await this.examsService.updateExamQuestion(
            +examId,
            +id,
            updateData
        );
        return ApiResponse.success(question, "Question updated successfully");
    }

    @Delete(":examId/questions/:id")
    @Roles(UserRole.TEACHER)
    async deleteQuestion(
        @Param("examId") examId: string,
        @Param("id") id: string
    ) {
        await this.examsService.deleteExamQuestion(+examId, +id);
        return ApiResponse.success(null, "Question deleted successfully");
    }

    @Put(":examId/questions/:questionId/answers/:id")
    @Roles(UserRole.TEACHER)
    async updateAnswer(
        @Param("examId") examId: string,
        @Param("questionId") questionId: string,
        @Param("id") id: string,
        @Body() updateData: any
    ) {
        const answer = await this.examsService.updateExamAnswer(
            +examId,
            +questionId,
            +id,
            updateData
        );
        return ApiResponse.success(answer, "Answer updated successfully");
    }

    @Delete(":examId/questions/:questionId/answers/:id")
    @Roles(UserRole.TEACHER)
    async deleteAnswer(
        @Param("examId") examId: string,
        @Param("questionId") questionId: string,
        @Param("id") id: string
    ) {
        await this.examsService.deleteExamAnswer(+examId, +questionId, +id);
        return ApiResponse.success(null, "Answer deleted successfully");
    }

    // ==================== EXAM ATTEMPTS (Student) ====================

    @Post(":id/attempts/start")
    @Roles(UserRole.STUDENT)
    async startExamAttempt(
        @Param("id") examId: string,
        @CurrentUser() user: User
    ) {
        const createAttemptDto: CreateExamAttemptDto = {
            examId: +examId,
            studentId: user.id,
        };
        const attempt = await this.examsService.startExamAttempt(createAttemptDto);
        return ApiResponse.success(attempt, "Exam attempt started successfully");
    }

    @Post(":id/attempts/:attemptId/submit")
    @Roles(UserRole.STUDENT)
    async submitExamAttempt(
        @Param("id") examId: string,
        @Param("attemptId") attemptId: string,
        @Body() submitExamDto: SubmitExamDto
    ) {
        const attempt = await this.examsService.submitExam(+attemptId, submitExamDto);
        return ApiResponse.success(attempt, "Exam submitted successfully");
    }

    @Get(":id/attempts/my-attempt")
    @Roles(UserRole.STUDENT)
    async getMyAttempt(
        @Param("id") examId: string,
        @CurrentUser() user: User
    ) {
        const attempt = await this.examsService.getExamAttempt(+examId, user.id);
        return ApiResponse.success(attempt, "success");
    }
}

@Controller("api/v1/exam-attempts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamAttemptsController {
    constructor(private readonly examsService: ExamsService) {}

    @Post()
    @Roles(UserRole.STUDENT)
    async startExam(@Body() createAttemptDto: CreateExamAttemptDto) {
        const attempt =
            await this.examsService.startExamAttempt(createAttemptDto);
        return ApiResponse.success(attempt, "success");
    }

    @Put(":id")
    @Roles(UserRole.STUDENT)
    async submitExam(
        @Param("id") id: string,
        @Body() submitExamDto: SubmitExamDto
    ) {
        const attempt = await this.examsService.submitExam(+id, submitExamDto);
        return ApiResponse.success(attempt, "Exam submitted successfully");
    }
}
