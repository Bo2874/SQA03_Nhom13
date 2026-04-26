import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Enrollment } from "../../entities/enrollment.entity";
import { Course } from "../../entities/course.entity";
import { EpisodeCompletion } from "../../entities/episode-completion.entity";
import { Episode } from "../../entities/episode.entity";
import { EnrollmentsService } from "./enrollments.service";
import { EnrollmentsController } from "./enrollments.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Enrollment,
            Course,
            EpisodeCompletion,
            Episode,
        ]),
    ],
    providers: [EnrollmentsService],
    controllers: [EnrollmentsController],
    exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
