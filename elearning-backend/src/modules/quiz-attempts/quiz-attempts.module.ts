import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuizAttempt } from "../../entities/quiz-attempt.entity";
import { Episode } from "../../entities/episode.entity";
import { Enrollment } from "../../entities/enrollment.entity";
import { QuizQuestion } from "../../entities/quiz-question.entity";
import { QuizAnswer } from "../../entities/quiz-answer.entity";
import { QuizAttemptsService } from "./quiz-attempts.service";
import { QuizAttemptsController } from "./quiz-attempts.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            QuizAttempt,
            Episode,
            Enrollment,
            QuizQuestion,
            QuizAnswer,
        ]),
    ],
    providers: [QuizAttemptsService],
    controllers: [QuizAttemptsController],
    exports: [QuizAttemptsService],
})
export class QuizAttemptsModule {}
