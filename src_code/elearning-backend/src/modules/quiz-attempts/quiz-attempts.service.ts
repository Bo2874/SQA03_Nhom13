import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuizAttempt } from "../../entities/quiz-attempt.entity";
import { Episode, EpisodeType } from "../../entities/episode.entity";
import { Enrollment, EnrollmentStatus } from "../../entities/enrollment.entity";
import { QuizQuestion } from "../../entities/quiz-question.entity";
import { QuizAnswer } from "../../entities/quiz-answer.entity";
import { CreateQuizAttemptDto } from "./dto/create-quiz-attempt.dto";
import { QuizResultDto } from "./dto/quiz-result.dto";
import { QuizAttemptResponseDto } from "./dto/quiz-attempt-response.dto";

@Injectable()
export class QuizAttemptsService {
    private readonly logger = new Logger(QuizAttemptsService.name);

    constructor(
        @InjectRepository(QuizAttempt)
        private quizAttemptRepository: Repository<QuizAttempt>,
        @InjectRepository(Episode)
        private episodeRepository: Repository<Episode>,
        @InjectRepository(Enrollment)
        private enrollmentRepository: Repository<Enrollment>,
        @InjectRepository(QuizQuestion)
        private quizQuestionRepository: Repository<QuizQuestion>,
        @InjectRepository(QuizAnswer)
        private quizAnswerRepository: Repository<QuizAnswer>
    ) {}

    /**
     * Submit quiz và tính điểm tự động
     */
    async submitQuiz(
        createQuizAttemptDto: CreateQuizAttemptDto
    ): Promise<QuizResultDto> {
        this.logger.log(
            `Student ${createQuizAttemptDto.studentId} submitting quiz for episode ${createQuizAttemptDto.episodeId}`
        );

        // 1. Validate episode
        const episode = await this.episodeRepository.findOne({
            where: { id: createQuizAttemptDto.episodeId },
            relations: ["chapter", "chapter.course"],
        });

        if (!episode) {
            throw new NotFoundException(
                `Episode with ID ${createQuizAttemptDto.episodeId} not found`
            );
        }

        if (episode.type !== EpisodeType.QUIZ) {
            throw new BadRequestException("This episode is not a quiz");
        }

        // 2. Kiểm tra student đã enroll course chưa
        const enrollment = await this.enrollmentRepository.findOne({
            where: {
                student: { id: createQuizAttemptDto.studentId },
                course: { id: episode.chapter.course.id },
                status: EnrollmentStatus.ACTIVE,
            },
        });

        if (!enrollment) {
            throw new ForbiddenException(
                "You must be enrolled in this course to take the quiz"
            );
        }

        // 3. Kiểm tra đã làm quiz này chưa (mỗi quiz chỉ làm 1 lần)
        const existingAttempt = await this.quizAttemptRepository.findOne({
            where: {
                episode: { id: createQuizAttemptDto.episodeId },
                student: { id: createQuizAttemptDto.studentId },
            },
        });

        if (existingAttempt) {
            throw new BadRequestException(
                "You have already completed this quiz. Each quiz can only be attempted once."
            );
        }

        // 4. Lấy tất cả questions và answers
        const questions = await this.quizQuestionRepository.find({
            where: { episode: { id: createQuizAttemptDto.episodeId } },
            relations: ["answers"],
            order: { order: "ASC" },
        });

        if (!questions || questions.length === 0) {
            throw new BadRequestException("This quiz has no questions");
        }

        // 5. Validate responses
        const questionIds = questions.map((q) => q.id);
        const responseQuestionIds = Object.keys(
            createQuizAttemptDto.responsesJson
        ).map(Number);

        // Kiểm tra có trả lời đủ câu hỏi không
        const missingQuestions = questionIds.filter(
            (qId) => !responseQuestionIds.includes(qId)
        );

        if (missingQuestions.length > 0) {
            throw new BadRequestException(
                `Missing answers for question IDs: ${missingQuestions.join(", ")}`
            );
        }

        // Kiểm tra có câu trả lời không hợp lệ không
        const invalidQuestions = responseQuestionIds.filter(
            (qId) => !questionIds.includes(qId)
        );

        if (invalidQuestions.length > 0) {
            throw new BadRequestException(
                `Invalid question IDs: ${invalidQuestions.join(", ")}`
            );
        }

        // 6. Tính điểm và tạo chi tiết kết quả
        let correctAnswers = 0;
        const totalQuestions = questions.length;
        const details: QuizResultDto["details"] = [];

        for (const question of questions) {
            const studentAnswerId =
                createQuizAttemptDto.responsesJson[question.id];
            const correctAnswer = question.answers.find((a) => a.isCorrect);

            if (!correctAnswer) {
                this.logger.warn(
                    `Question ${question.id} has no correct answer marked`
                );
                throw new BadRequestException(
                    `Question ${question.id} has no correct answer configured`
                );
            }

            // Validate student answer exists
            const studentAnswer = question.answers.find(
                (a) => a.id === studentAnswerId
            );
            if (!studentAnswer) {
                throw new BadRequestException(
                    `Invalid answer ID ${studentAnswerId} for question ${question.id}`
                );
            }

            const isCorrect = studentAnswerId === correctAnswer.id;
            if (isCorrect) {
                correctAnswers++;
            }

            details.push({
                questionId: question.id,
                questionContent: question.content,
                questionImageUrl: question.imageUrl,
                studentAnswerId,
                studentAnswerContent: studentAnswer.content,
                correctAnswerId: correctAnswer.id,
                correctAnswerContent: correctAnswer.content,
                isCorrect,
            });
        }

        // Tính điểm phần trăm
        const score =
            totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const passed = score >= 60; // Pass threshold: 60%

        // 7. Lưu quiz attempt vào database
        const quizAttempt = this.quizAttemptRepository.create({
            episode: { id: createQuizAttemptDto.episodeId },
            student: { id: createQuizAttemptDto.studentId },
            submittedAt: new Date(),
            score: Math.round(score * 100) / 100, // Làm tròn 2 chữ số thập phân
            responsesJson: createQuizAttemptDto.responsesJson,
        });

        const savedAttempt =
            await this.quizAttemptRepository.save(quizAttempt)[0];

        this.logger.log(
            `Quiz attempt ${savedAttempt.id} saved. Score: ${savedAttempt.score}, Passed: ${passed}`
        );

        // 8. Return kết quả chi tiết
        return {
            attemptId: savedAttempt.id,
            score: savedAttempt.score,
            totalQuestions,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            submittedAt: savedAttempt.submittedAt,
            passed,
            details,
        };
    }

    /**
     * Lấy tất cả quiz attempts của student
     */
    async findByStudent(studentId: number): Promise<QuizAttemptResponseDto[]> {
        const attempts = await this.quizAttemptRepository.find({
            where: { student: { id: studentId } },
            relations: [
                "episode",
                "episode.chapter",
                "episode.chapter.course",
                "student",
            ],
            order: { submittedAt: "DESC" },
        });

        return attempts.map((attempt) => ({
            id: attempt.id,
            episodeId: attempt.episode.id,
            episodeTitle: attempt.episode.title,
            studentId: attempt.student.id,
            studentName: attempt.student.fullName,
            score: attempt.score,
            submittedAt: attempt.submittedAt,
            passed: Number(attempt.score) >= 60,
        }));
    }

    /**
     * Lấy tất cả quiz attempts theo episode (cho teacher xem)
     */
    async findByEpisode(episodeId: number): Promise<QuizAttemptResponseDto[]> {
        const attempts = await this.quizAttemptRepository.find({
            where: { episode: { id: episodeId } },
            relations: ["student", "episode"],
            order: { score: "DESC", submittedAt: "ASC" },
        });

        return attempts.map((attempt) => ({
            id: attempt.id,
            episodeId: attempt.episode.id,
            episodeTitle: attempt.episode.title,
            studentId: attempt.student.id,
            studentName: attempt.student.fullName,
            score: attempt.score,
            submittedAt: attempt.submittedAt,
            passed: Number(attempt.score) >= 60,
        }));
    }

    /**
     * Lấy chi tiết một quiz attempt
     */
    async findOne(id: number): Promise<QuizAttempt> {
        const attempt = await this.quizAttemptRepository.findOne({
            where: { id },
            relations: [
                "episode",
                "episode.chapter",
                "episode.chapter.course",
                "student",
            ],
        });

        if (!attempt) {
            throw new NotFoundException(`Quiz attempt with ID ${id} not found`);
        }

        return attempt;
    }

    /**
     * Kiểm tra student đã làm quiz chưa
     */
    async checkAttempt(
        studentId: number,
        episodeId: number
    ): Promise<QuizAttempt | null> {
        return await this.quizAttemptRepository.findOne({
            where: { student: { id: studentId }, episode: { id: episodeId } },
            relations: ["episode"],
        });
    }

    /**
     * Lấy kết quả chi tiết của quiz attempt với answers
     */
    async getDetailedResult(attemptId: number): Promise<QuizResultDto> {
        const attempt = await this.quizAttemptRepository.findOne({
            where: { id: attemptId },
            relations: ["episode", "student"],
        });

        if (!attempt) {
            throw new NotFoundException(
                `Quiz attempt with ID ${attemptId} not found`
            );
        }

        // Lấy questions và answers
        const questions = await this.quizQuestionRepository.find({
            where: { episode: { id: attempt.episode.id } },
            relations: ["answers"],
            order: { order: "ASC" },
        });

        let correctAnswers = 0;
        const totalQuestions = questions.length;
        const details: QuizResultDto["details"] = [];

        for (const question of questions) {
            const studentAnswerId = attempt.responsesJson[question.id];
            const correctAnswer = question.answers.find((a) => a.isCorrect);
            const studentAnswer = question.answers.find(
                (a) => a.id === studentAnswerId
            );

            const isCorrect = studentAnswerId === correctAnswer?.id;
            if (isCorrect) {
                correctAnswers++;
            }

            details.push({
                questionId: question.id,
                questionContent: question.content,
                questionImageUrl: question.imageUrl,
                studentAnswerId,
                studentAnswerContent: studentAnswer?.content || "N/A",
                correctAnswerId: correctAnswer?.id || 0,
                correctAnswerContent: correctAnswer?.content || "N/A",
                isCorrect,
            });
        }

        const passed = Number(attempt.score) >= 60;

        return {
            attemptId: attempt.id,
            score: attempt.score,
            totalQuestions,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            submittedAt: attempt.submittedAt,
            passed,
            details,
        };
    }

    /**
     * Lấy thống kê quiz attempts theo course
     */
    async getStatisticsByCourse(courseId: number) {
        // Lấy tất cả episodes của course
        const episodes = await this.episodeRepository
            .createQueryBuilder("episode")
            .leftJoin("episode.chapter", "chapter")
            .where("chapter.courseId = :courseId", { courseId })
            .andWhere("episode.type = :type", { type: EpisodeType.QUIZ })
            .getMany();

        const episodeIds = episodes.map((e) => e.id);

        if (episodeIds.length === 0) {
            return {
                totalQuizzes: 0,
                totalAttempts: 0,
                averageScore: 0,
                passedAttempts: 0,
                failedAttempts: 0,
                passRate: 0,
            };
        }

        // Lấy tất cả attempts
        const attempts = await this.quizAttemptRepository
            .createQueryBuilder("attempt")
            .where("attempt.episodeId IN (:...episodeIds)", { episodeIds })
            .getMany();

        const totalAttempts = attempts.length;
        const averageScore =
            totalAttempts > 0
                ? attempts.reduce((sum, a) => sum + Number(a.score), 0) /
                  totalAttempts
                : 0;

        const passedAttempts = attempts.filter(
            (a) => Number(a.score) >= 60
        ).length;
        const failedAttempts = totalAttempts - passedAttempts;
        const passRate =
            totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

        return {
            totalQuizzes: episodeIds.length,
            totalAttempts,
            averageScore: Math.round(averageScore * 100) / 100,
            passedAttempts,
            failedAttempts,
            passRate: Math.round(passRate * 100) / 100,
        };
    }

    /**
     * Get leaderboard for specific quiz episode
     */
    async getQuizLeaderboard(episodeId: number) {
        const attempts = await this.quizAttemptRepository.find({
            where: { episode: { id: episodeId } },
            relations: ["student"],
            order: { score: "DESC", submittedAt: "ASC" },
        });

        return attempts.map((attempt, index) => ({
            rank: index + 1,
            studentId: attempt.student.id,
            studentName: attempt.student.fullName,
            studentEmail: attempt.student.email,
            score: attempt.score,
            submittedAt: attempt.submittedAt,
            passed: Number(attempt.score) >= 60,
        }));
    }

    /**
     * Get quiz attempts by course (for teacher)
     */
    async findByCourse(courseId: number): Promise<QuizAttemptResponseDto[]> {
        const episodes = await this.episodeRepository
            .createQueryBuilder("episode")
            .leftJoin("episode.chapter", "chapter")
            .where("chapter.courseId = :courseId", { courseId })
            .andWhere("episode.type = :type", { type: EpisodeType.QUIZ })
            .getMany();

        const episodeIds = episodes.map((e) => e.id);

        if (episodeIds.length === 0) {
            return [];
        }

        const attempts = await this.quizAttemptRepository.find({
            where: {
                episode: {
                    id: episodeIds.length > 0 ? episodeIds[0] : undefined,
                },
            },
            relations: ["student", "episode"],
            order: { submittedAt: "DESC" },
        });

        return attempts.map((attempt) => ({
            id: attempt.id,
            episodeId: attempt.episode.id,
            episodeTitle: attempt.episode.title,
            studentId: attempt.student.id,
            studentName: attempt.student.fullName,
            score: attempt.score,
            submittedAt: attempt.submittedAt,
            passed: Number(attempt.score) >= 60,
        }));
    }
}
