import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { getDatabaseConfig } from "./config/database.config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { EnrollmentsModule } from "./modules/enrollments/enrollments.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { ZoomModule } from "./modules/zoom/zoom.module";
import { SubjectsModule } from "./modules/subjects/subjects.module";
import { GradeLevelsModule } from "./modules/grade-levels/grade-levels.module";
import { QuizAttemptsModule } from "./modules/quiz-attempts/quiz-attempts.module";
import { ChatbotModule } from "./modules/chatbot/chatbot.module";
// import { StatisticsModule } from "./modules/statistics/statistics.module";
// import { SearchModule } from "./modules/search/search.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ".env.dev",
        }),
        TypeOrmModule.forRoot(getDatabaseConfig()),
        AuthModule,
        UsersModule,
        CoursesModule,
        EnrollmentsModule,
        ExamsModule,
        ZoomModule,
        SubjectsModule,
        GradeLevelsModule,
        QuizAttemptsModule,
        ChatbotModule,
        // StatisticsModule,
        // SearchModule,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule {}
