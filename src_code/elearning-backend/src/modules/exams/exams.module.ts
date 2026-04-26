import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Exam } from "../../entities/exam.entity";
import { ExamQuestion } from "../../entities/exam-question.entity";
import { ExamAnswer } from "../../entities/exam-answer.entity";
import { ExamAttempt } from "../../entities/exam-attempt.entity";
import { Enrollment } from "../../entities/enrollment.entity";
import { ExamsService } from "./exams.service";
import { ExamsController, ExamAttemptsController } from "./exams.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Exam, ExamQuestion, ExamAnswer, ExamAttempt, Enrollment]),
    ],
    providers: [ExamsService],
    controllers: [ExamsController, ExamAttemptsController],
    exports: [ExamsService],
})
export class ExamsModule {}
