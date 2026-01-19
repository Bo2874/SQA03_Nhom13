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
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseByTeacherDto } from "./dto/update-course-by-teacher.dto";
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { CreateEpisodeDto } from "./dto/create-episode.dto";
import { CreateQuizQuestionDto } from "./dto/create-quiz-question.dto";
import { CreateQuizAnswerDto } from "./dto/create-quiz-answer.dto";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { User, UserRole } from "../../entities/user.entity";
import { CourseStatus } from "../../entities/course.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";
import { CoursesQueryDto } from "./dto/courses-query.dto";
import {
    CourseStatusByAdmin,
    UpdateCourseByAdminDto,
} from "./dto/update-course-by-admin.dto";
import { UpdateCourseMaterialDto } from "./dto/update-course-material.dto";
import { UpdateChapterDto } from "./dto/update-chapter.dto";
import { UpdateEpisodeDto } from "./dto/update-episode.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { UpdateQuizAnswerDto } from "./dto/update-answer.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SearchCoursesDto } from "./dto/search-courses.dto";

@Controller("api/v1/courses")
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) {}

    // Protected endpoint - only TEACHER and ADMIN can access
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async getCourses(
        // @Query() courseQueryDto: CoursesQueryDto,
        @CurrentUser() user: User
    ) {
        const result = await this.coursesService.getCourses(
            // courseQueryDto,
            user
        );
        return ApiResponse.success(result, "success");
    }

    // Public endpoint - anyone can view approved courses
    @Get("approved")
    async getApprovedCourse() {
        return ApiResponse.success(
            await this.coursesService.getApprovedCourses(),
            "success"
        );
    }

    // Public endpoint - search courses
    @Get("search")
    async searchCourses(@Query() searchDto: SearchCoursesDto) {
        return ApiResponse.success(
            await this.coursesService.searchCourses(searchDto),
            "success"
        );
    }

    // Public endpoint - get featured courses for home page
    @Get("featured/courses")
    async getFeaturedCourses(@Query("limit") limit?: number) {
        return ApiResponse.success(
            await this.coursesService.getFeaturedCourses(limit || 8),
            "success"
        );
    }

    // Public endpoint - get courses by subject for home page
    @Get("subject/:subjectId")
    async getCoursesBySubject(
        @Param("subjectId", ParseIntPipe) subjectId: number,
        @Query("limit") limit?: number
    ) {
        return ApiResponse.success(
            await this.coursesService.getCoursesBySubject(subjectId, limit || 8),
            "success"
        );
    }

    // Public endpoint - get platform statistics
    @Get("stats/platform")
    async getPlatformStats() {
        return ApiResponse.success(
            await this.coursesService.getPlatformStats(),
            "success"
        );
    }

    // Public endpoint - anyone can view course details
    // If user is authenticated, also return their enrollment info
    @Get(":id")
    @UseGuards(JwtAuthGuard)
    async getCourseById(@Param("id") id: string, @CurrentUser() user?: User) {
        const course = await this.coursesService.findCourseById(+id, user?.id);
        return ApiResponse.success(course, "success");
    }

    // Protected endpoint - only TEACHER can create
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async createCourse(@Body() createCourseDto: CreateCourseDto) {
        const course = await this.coursesService.createCourse(createCourseDto);
        return ApiResponse.success(course, "success");
    }

    // Protected endpoint - only TEACHER can update their own courses
    @Put(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async updateCourse(
        @Param("id") id: string,
        @Body() updateCourseDto: UpdateCourseByTeacherDto,
        @CurrentUser() user: User
    ) {
        console.log("update course dto:-----------", updateCourseDto);

        const course = await this.coursesService.updateCourseByTeacher(
            +id,
            updateCourseDto,
            user
        );

        return ApiResponse.success(course, "success");
    }

    // Protected endpoint - only ADMIN can approve/reject
    @Put(":id/by-admin")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateCourseByAdmin(
        @Param("id") id: string,
        @Body() dto: UpdateCourseByAdminDto
    ) {
        if (
            dto.status === CourseStatusByAdmin.APPROVED ||
            dto.status === CourseStatusByAdmin.PUBLISHED
        ) {
            dto.rejectionReason = "";
        }

        const course = await this.coursesService.updateCourseByAdmin(+id, dto);

        return ApiResponse.success(course, "success");
    }

    // Protected endpoint - only TEACHER (own courses) and ADMIN can delete
    @Delete(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteCourse(
        @Param("id") id: string,
        @CurrentUser() user: User
    ) {
        await this.coursesService.deleteCourse(+id, user);
        return ApiResponse.success(null, "Course deleted successfully");
    }

    // Course Materials
    // Protected endpoint - only TEACHER can create materials
    @Post(":id/materials")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async createMaterial(
        @Body() createMaterialDto: CreateMaterialDto,
        @Param("id") courseId: string
    ) {
        const material = await this.coursesService.createCourseMaterial(
            createMaterialDto,
            +courseId
        );
        return ApiResponse.success(material, "success");
    }

    // Public endpoint - anyone can view material details
    @Get(":id/materials/:materialId")
    async findMaterialById(@Param("materialId") materialId: string) {
        const material =
            await this.coursesService.findCourseMaterialById(+materialId);
        return ApiResponse.success(material, "success");
    }

    // Protected endpoint - only TEACHER can update materials
    @Put(":courseId/materials/:materialId")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async updateCourseMaterials(
        @Body() updateCourseMaterialDto: UpdateCourseMaterialDto,
        @Param("materialId") materialId: string
    ) {
        const material = await this.coursesService.updateCourseMaterialById(
            updateCourseMaterialDto,
            +materialId
        );
        return ApiResponse.success(material, "success");
    }

    // Protected endpoint - only TEACHER can delete materials
    @Delete(":courseId/materials/:materialId")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteCourseMaterials(@Param("materialId") materialId: string) {
        await this.coursesService.deleteCourseMaterialById(+materialId);
    }

    // Chapters
    // Protected endpoint - only TEACHER can create chapters
    @Post(":id/chapters")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async createChapter(
        @Body() createChapterDto: CreateChapterDto,
        @Param("id") courseId: string
    ) {
        const chapter = await this.coursesService.createChapter(
            createChapterDto,
            +courseId
        );
        return ApiResponse.success(chapter, "success");
    }

    // Public endpoint - anyone can view chapter details
    @Get(":courseId/chapters/:id")
    async findChapterById(
        @Param("id") id: string,
        @Param("courseId") courseId: string
    ) {
        const chapter = await this.coursesService.findChapterById(
            +id,
            +courseId
        );
        return ApiResponse.success(chapter, "success");
    }

    // Protected endpoint - only TEACHER can update chapters
    @Put(":courseId/chapters/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async updateChapterById(
        @Param("id") id: string,
        @Param("courseId") courseId: string,
        @Body() updateChapterDto: UpdateChapterDto
    ) {
        const chapter = await this.coursesService.updateChapterById(
            +id,
            +courseId,
            updateChapterDto
        );

        return ApiResponse.success(chapter, "success");
    }

    // Protected endpoint - only TEACHER can delete chapters
    @Delete(":courseId/chapters/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    @HttpCode(HttpStatus.OK)
    async deleteChapterById(
        @Param("id") id: string,
        @Param("courseId") courseId: string
    ) {
        await this.coursesService.deleteChapterById(+id, +courseId);
        return ApiResponse.success(null, "Chapter deleted successfully");
    }

    // Episodes
    // Protected endpoint - only TEACHER can create episodes
    @Post(":courseId/chapters/:chapterId/episodes")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async createEpisode(
        @Body() createEpisodeDto: CreateEpisodeDto,
        @Param("courseId") courseId: string,
        @Param("chapterId") chapterId: string
    ) {
        const episode = await this.coursesService.createEpisode(
            createEpisodeDto,
            +courseId,
            +chapterId
        );
        return ApiResponse.success(episode, "success");
    }

    // Public endpoint - anyone can view episode details
    @Get(":courseId/chapters/:chapterId/episodes/:id")
    async findEpisodeById(
        @Param("courseId") courseId: string,
        @Param("chapterId") chapterId: string,
        @Param("id") id: string
    ) {
        const episode = await this.coursesService.findEpisodeById(
            +courseId,
            +chapterId,
            +id
        );
        return ApiResponse.success(episode, "success");
    }

    // Protected endpoint - only TEACHER can update episodes
    @Put(":courseId/chapters/:chapterId/episodes/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async updateEpisodeById(
        @Param("courseId") courseId: string,
        @Param("chapterId") chapterId: string,
        @Param("id") id: string,
        @Body() updateEpisodeDto: UpdateEpisodeDto
    ) {
        const episode = await this.coursesService.updateEpisodeById(
            +courseId,
            +chapterId,
            +id,
            updateEpisodeDto
        );

        return ApiResponse.success(episode, "success");
    }

    // Protected endpoint - only TEACHER can delete episodes
    @Delete(":courseId/chapters/:chapterId/episodes/:id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    @HttpCode(HttpStatus.OK)
    async deleteEpisodeById(
        @Param("courseId") courseId: string,
        @Param("chapterId") chapterId: string,
        @Param("id") id: string
    ) {
        await this.coursesService.deleteEpisodeById(+courseId, +chapterId, +id);
        return ApiResponse.success(null, "Episode deleted successfully");
    }

    // Quiz Questions
    // Protected endpoint - only TEACHER can create questions
    @Post(":courseId/chapters/:chapterId/episodes/:episodeId/questions")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async createQuizQuestion(
        @Body() createQuizQuestionDto: CreateQuizQuestionDto,
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number
    ) {
        const question = await this.coursesService.createQuizQuestion(
            createQuizQuestionDto,
            courseId,
            chapterId,
            episodeId
        );
        return ApiResponse.success(question, "success");
    }

    // Public endpoint - anyone can view question details
    @Get(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId"
    )
    async getQuizQuestion(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number
    ) {
        const question = await this.coursesService.findQuizQuestionById(
            courseId,
            chapterId,
            episodeId,
            questionId
        );
        return ApiResponse.success(question, "success");
    }

    // Protected endpoint - only TEACHER can update questions
    @Put(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId"
    )
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async updateQuestionById(
        @Body() updateQuestionDto: UpdateQuestionDto,
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number
    ) {
        const question = await this.coursesService.updateQuestionById(
            updateQuestionDto,
            courseId,
            chapterId,
            episodeId,
            questionId
        );

        return ApiResponse.success(question, "success");
    }

    // Protected endpoint - only TEACHER can delete questions
    @Delete(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId"
    )
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteQuestionById(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number
    ) {
        await this.coursesService.deleteQuestionById(
            courseId,
            chapterId,
            episodeId,
            questionId
        );
    }

    // Quiz Answers
    // Protected endpoint - only TEACHER can create answers
    @Post(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers"
    )
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async createQuizAnswer(
        @Body() createQuizAnswerDto: CreateQuizAnswerDto,
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number
    ) {
        const answer = await this.coursesService.createQuizAnswer(
            createQuizAnswerDto,
            courseId,
            chapterId,
            episodeId,
            questionId
        );
        return ApiResponse.success(answer, "success");
    }

    // Public endpoint - anyone can view answer details
    @Get(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers/:answerId"
    )
    async findAnswerById(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number,
        @Param("answerId", ParseIntPipe) answerId: number
    ) {
        const answer = await this.coursesService.findAnswerById(
            courseId,
            chapterId,
            episodeId,
            questionId,
            answerId
        );
        return ApiResponse.success(answer, "success");
    }

    // Protected endpoint - only TEACHER can update answers
    @Put(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers/:answerId"
    )
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    async updateAnswerById(
        @Body() updateAnswerDto: UpdateQuizAnswerDto,
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number,
        @Param("answerId", ParseIntPipe) answerId: number
    ) {
        const answer = await this.coursesService.updateAnswerById(
            updateAnswerDto,
            courseId,
            chapterId,
            episodeId,
            questionId,
            answerId
        );
        return ApiResponse.success(answer, "success");
    }

    // Protected endpoint - only TEACHER can delete answers
    @Delete(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers/:answerId"
    )
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAnswerById(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number,
        @Param("answerId", ParseIntPipe) answerId: number
    ) {
        const answer = await this.coursesService.deleteAnswerById(
            courseId,
            chapterId,
            episodeId,
            questionId,
            answerId
        );
        return ApiResponse.success(answer, "success");
    }

    // Public endpoint - anyone can view all materials
    @Get(":courseId/materials")
    async findAllCourseMaterials(
        @Param("courseId", ParseIntPipe) courseId: number
    ) {
        return ApiResponse.success(
            await this.coursesService.findAllCourseMaterials(courseId),
            "success"
        );
    }

    // Public endpoint - anyone can view all chapters
    @Get(":courseId/chapters")
    async findAllChapters(@Param("courseId", ParseIntPipe) courseId: number) {
        return ApiResponse.success(
            await this.coursesService.findAllChapters(courseId),
            "success"
        );
    }

    // Public endpoint - anyone can view all episodes
    @Get(":courseId/chapters/:chapterId/episodes")
    async findAllEpisodes(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number
    ) {
        return ApiResponse.success(
            await this.coursesService.findAllEpisodes(courseId, chapterId),
            "success"
        );
    }

    // Public endpoint - anyone can view all questions
    @Get(":courseId/chapters/:chapterId/episodes/:episodeId/questions")
    async findAllQuestions(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number
    ) {
        return ApiResponse.success(
            await this.coursesService.findAllQuestions(
                courseId,
                chapterId,
                episodeId
            ),
            "success"
        );
    }

    // Public endpoint - anyone can view all answers
    @Get(
        ":courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers"
    )
    async findAllAnswers(
        @Param("courseId", ParseIntPipe) courseId: number,
        @Param("chapterId", ParseIntPipe) chapterId: number,
        @Param("episodeId", ParseIntPipe) episodeId: number,
        @Param("questionId", ParseIntPipe) questionId: number
    ) {
        return ApiResponse.success(
            await this.coursesService.findAllAnswers(
                courseId,
                chapterId,
                episodeId,
                questionId
            ),
            "success"
        );
    }
}
