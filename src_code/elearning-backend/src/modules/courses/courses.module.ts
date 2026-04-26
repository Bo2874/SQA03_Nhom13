import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Course } from "../../entities/course.entity";
import { Chapter } from "../../entities/chapter.entity";
import { Episode } from "../../entities/episode.entity";
import { QuizQuestion } from "../../entities/quiz-question.entity";
import { QuizAnswer } from "../../entities/quiz-answer.entity";
import { CourseMaterial } from "../../entities/course-material.entity";
import { User } from "../../entities/user.entity";
import { CoursesService } from "./courses.service";
import { CoursesController } from "./courses.controller";
import { CourseMapper } from "./mapper/course.mapper";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Course,
            Chapter,
            Episode,
            QuizQuestion,
            QuizAnswer,
            CourseMaterial,
            User,
        ]),
    ],
    providers: [CoursesService, CourseMapper],
    controllers: [CoursesController],
    exports: [CoursesService],
})
export class CoursesModule {}
