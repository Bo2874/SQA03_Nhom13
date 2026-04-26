import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GradeLevel } from "../../entities/grade-level.entity";
import { GradeLevelsService } from "./grade-levels.service";
import { GradeLevelsController } from "./grade-levels.controller";

@Module({
    imports: [TypeOrmModule.forFeature([GradeLevel])],
    providers: [GradeLevelsService],
    controllers: [GradeLevelsController],
    exports: [GradeLevelsService],
})
export class GradeLevelsModule {}
