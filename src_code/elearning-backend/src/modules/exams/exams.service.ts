import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, IsNull } from "typeorm";
import { Exam, ExamStatus } from "../../entities/exam.entity";
import { ExamQuestion } from "../../entities/exam-question.entity";
import { ExamAnswer } from "../../entities/exam-answer.entity";
import { ExamAttempt } from "../../entities/exam-attempt.entity";
import { Enrollment } from "../../entities/enrollment.entity";
import { CreateExamDto } from "./dto/create-exam.dto";
import { UpdateExamDto } from "./dto/update-exam.dto";
import { CreateExamQuestionDto } from "./dto/create-exam-question.dto";
import { CreateExamAnswerDto } from "./dto/create-exam-answer.dto";
import { CreateExamAttemptDto } from "./dto/create-exam-attempt.dto";
import { SubmitExamDto } from "./dto/submit-exam.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class ExamsService {
    constructor(
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        @InjectRepository(ExamQuestion)
        private examQuestionRepository: Repository<ExamQuestion>,
        @InjectRepository(ExamAnswer)
        private examAnswerRepository: Repository<ExamAnswer>,
        @InjectRepository(ExamAttempt)
        private examAttemptRepository: Repository<ExamAttempt>,
        @InjectRepository(Enrollment)
        private enrollmentRepository: Repository<Enrollment>
    ) {}

    async createExam(createExamDto: CreateExamDto): Promise<Exam> {
        const exam = this.examRepository.create({
            ...createExamDto,
            submittedAt: new Date(),
        });
        return await this.examRepository.save(exam);
    }

    async findExamById(id: number): Promise<Exam> {
        const exam = await this.examRepository.findOne({
            where: { id },
            relations: ["teacher", "course", "questions", "questions.answers"],
        });
        if (!exam) {
            throw new NotFoundException("Exam not found");
        }

        // Add question count as virtual field
        (exam as any).questionCount = exam.questions?.length || 0;

        return exam;
    }

    async getExams(
        paginationDto: PaginationDto,
        status?: ExamStatus,
        user?: any
    ) {
        const { page, limit, order, sortBy } = paginationDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.examRepository
            .createQueryBuilder("exam")
            .leftJoinAndSelect("exam.teacher", "teacher")
            .leftJoinAndSelect("exam.course", "course")
            .loadRelationCountAndMap("exam.questionCount", "exam.questions");

        // Filter by teacher if user is TEACHER role
        if (user && user.role === "TEACHER") {
            queryBuilder.where("exam.teacherId = :teacherId", {
                teacherId: user.userId,
            });
        }

        // Filter by status if provided
        if (status) {
            if (user && user.role === "TEACHER") {
                queryBuilder.andWhere("exam.status = :status", { status });
            } else {
                queryBuilder.where("exam.status = :status", { status });
            }
        }

        const [exams, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy(`exam.${sortBy}`, order.toUpperCase() as "ASC" | "DESC")
            .getManyAndCount();

        return {
            data: exams,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async updateExam(id: number, updateExamDto: UpdateExamDto): Promise<Exam> {
        const exam = await this.findExamById(id);
        Object.assign(exam, updateExamDto);
        return await this.examRepository.save(exam);
    }

    async deleteExam(id: number): Promise<void> {
        const exam = await this.findExamById(id);

        // Delete all exam attempts first (foreign key constraint)
        await this.examAttemptRepository.delete({ exam: { id } });

        // Delete all answers for questions in this exam
        const questions = await this.examQuestionRepository.find({
            where: { exam: { id } },
        });

        for (const question of questions) {
            await this.examAnswerRepository.delete({ question: { id: question.id } });
        }

        // Delete all questions
        await this.examQuestionRepository.delete({ exam: { id } });

        // Finally delete the exam
        await this.examRepository.remove(exam);
    }

    async createExamQuestion(
        createExamQuestionDto: CreateExamQuestionDto
    ): Promise<ExamQuestion> {
        const question = this.examQuestionRepository.create(
            createExamQuestionDto
        );
        return await this.examQuestionRepository.save(question);
    }

    async createExamAnswer(
        createExamAnswerDto: CreateExamAnswerDto
    ): Promise<ExamAnswer> {
        const answer = this.examAnswerRepository.create(createExamAnswerDto);
        return await this.examAnswerRepository.save(answer);
    }

    async startExamAttempt(
        createExamAttemptDto: CreateExamAttemptDto
    ): Promise<ExamAttempt> {
        const exam = await this.findExamById(createExamAttemptDto.examId);

        // Check if exam is live or approved
        if (exam.status !== ExamStatus.LIVE && exam.status !== ExamStatus.APPROVED) {
            throw new BadRequestException(`Exam is not available for taking. Current status: ${exam.status}`);
        }

        // Check if student has completed the course
        if (exam.courseId) {
            const enrollment = await this.enrollmentRepository.findOne({
                where: {
                    course: { id: exam.courseId },
                    student: { id: createExamAttemptDto.studentId },
                },
            });

            if (!enrollment) {
                throw new BadRequestException("You must be enrolled in this course");
            }

            if (!enrollment.isCompleted) {
                throw new BadRequestException("You must complete the course before taking the exam");
            }
        }

        // Check if student has an existing attempt
        const existingAttempt = await this.examAttemptRepository.findOne({
            where: {
                exam: { id: createExamAttemptDto.examId },
                student: { id: createExamAttemptDto.studentId },
            },
        });

        // If there's an existing attempt that is already submitted, don't allow new attempt
        if (existingAttempt && existingAttempt.submittedAt) {
            throw new BadRequestException(
                "You have already completed this exam"
            );
        }

        // If there's an unsubmitted attempt, return it to continue
        if (existingAttempt && !existingAttempt.submittedAt) {
            return existingAttempt;
        }

        // Create new attempt if none exists
        const attempt = this.examAttemptRepository.create({
            exam: { id: createExamAttemptDto.examId } as Exam,
            student: { id: createExamAttemptDto.studentId } as any,
            startedAt: new Date(),
        });

        return await this.examAttemptRepository.save(attempt);
    }

    async submitExam(
        id: number,
        submitExamDto: SubmitExamDto
    ): Promise<ExamAttempt> {
        const attempt = await this.examAttemptRepository.findOne({
            where: { id },
            relations: ["exam", "exam.questions", "exam.questions.answers"],
        });

        if (!attempt) {
            throw new NotFoundException("Exam attempt not found");
        }

        if (attempt.submittedAt) {
            throw new BadRequestException("Exam already submitted");
        }

        // Calculate score
        let correctAnswers = 0;
        let totalQuestions = attempt.exam.questions.length;

        attempt.exam.questions.forEach((question) => {
            const studentAnswer = submitExamDto.responsesJson[question.id];
            const correctAnswer = question.answers.find((a) => a.isCorrect);

            if (
                studentAnswer &&
                correctAnswer &&
                studentAnswer === correctAnswer.id
            ) {
                correctAnswers++;
            }
        });

        const score =
            totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        // Calculate time spent
        const timeSpent = Math.floor(
            (new Date().getTime() - new Date(attempt.startedAt).getTime()) /
                1000
        );

        attempt.submittedAt = new Date();
        attempt.score = Math.round(score * 100) / 100;
        attempt.timeSpentSeconds = timeSpent;
        attempt.responsesJson = submitExamDto.responsesJson;

        return await this.examAttemptRepository.save(attempt);
    }

    async getExamLeaderboard(examId: number) {
        const attempts = await this.examAttemptRepository.find({
            where: { exam: { id: examId }, submittedAt: Not(IsNull()) },
            relations: ["student", "exam", "exam.questions"],
            order: { score: "DESC" },
        });

        return attempts.map((attempt, index) => {
            const totalQuestions = attempt.exam?.questions?.length || 0;
            const correctAnswers = Math.round((attempt.score / 100) * totalQuestions);

            return {
                rank: index + 1,
                studentId: attempt.student.id,
                fullName: attempt.student.fullName,
                email: attempt.student.email,
                score: attempt.score,
                correctAnswers,
                totalQuestions,
                timeSpentSeconds: attempt.timeSpentSeconds,
                submittedAt: attempt.submittedAt,
            };
        });
    }

    async getExamAttempt(examId: number, studentId: number) {
        return await this.examAttemptRepository.findOne({
            where: { exam: { id: examId }, student: { id: studentId } },
            relations: ["exam", "exam.questions", "exam.questions.answers"],
        });
    }

    async getExamQuestions(examId: number): Promise<ExamQuestion[]> {
        const exam = await this.findExamById(examId);
        return exam.questions || [];
    }

    async updateExamQuestion(
        examId: number,
        questionId: number,
        updateData: Partial<ExamQuestion>
    ): Promise<ExamQuestion> {
        const question = await this.examQuestionRepository.findOne({
            where: { id: questionId, exam: { id: examId } },
        });
        if (!question) throw new NotFoundException("Question not found");
        Object.assign(question, updateData);
        return await this.examQuestionRepository.save(question);
    }

    async deleteExamQuestion(
        examId: number,
        questionId: number
    ): Promise<void> {
        const question = await this.examQuestionRepository.findOne({
            where: { id: questionId, exam: { id: examId } },
        });
        if (!question) throw new NotFoundException("Question not found");
        await this.examQuestionRepository.remove(question);
    }

    async updateExamAnswer(
        examId: number,
        questionId: number,
        answerId: number,
        updateData: Partial<ExamAnswer>
    ): Promise<ExamAnswer> {
        const answer = await this.examAnswerRepository.findOne({
            where: {
                id: answerId,
                question: { id: questionId, exam: { id: examId } },
            },
        });
        if (!answer) throw new NotFoundException("Answer not found");
        Object.assign(answer, updateData);
        return await this.examAnswerRepository.save(answer);
    }

    async deleteExamAnswer(
        examId: number,
        questionId: number,
        answerId: number
    ): Promise<void> {
        const answer = await this.examAnswerRepository.findOne({
            where: {
                id: answerId,
                question: { id: questionId, exam: { id: examId } },
            },
        });
        if (!answer) throw new NotFoundException("Answer not found");
        await this.examAnswerRepository.remove(answer);
    }
}
