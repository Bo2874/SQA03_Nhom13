import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";
import { Subject } from "../src/entities/subject.entity";
import { GradeLevel } from "../src/entities/grade-level.entity";

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log("Starting database seeding...");

    try {
                
        const subjectRepository = dataSource.getRepository(Subject);
        const subjects = [
            "Toán học",
            "Ngữ văn",
            "Tiếng Anh",
            "Vật lý",
            "Hóa học",
            "Sinh học",
            "Lịch sử",
            "Địa lý",
            "Tin học",
            "Công nghệ",
            "Giáo dục công dân",
            "Âm nhạc",
            "Mỹ thuật",
            "Thể dục",
        ];

        const subjectEntities: Subject[] = [];
        for (const subjectName of subjects) {
            let subject = await subjectRepository.findOne({
                where: { name: subjectName },
            });
            if (!subject) {
                subject = await subjectRepository.save({ name: subjectName });
            }
            subjectEntities.push(subject);
        }
        console.log(`✓ ${subjects.length} subjects created`);

        // Seed Grade Levels
        const gradeLevelRepository = dataSource.getRepository(GradeLevel);
        const gradeLevels = [
            "Lớp 1",
            "Lớp 2",
            "Lớp 3",
            "Lớp 4",
            "Lớp 5",
            "Lớp 6",
            "Lớp 7",
            "Lớp 8",
            "Lớp 9",
            "Lớp 10",
            "Lớp 11",
            "Lớp 12",
        ];

        const gradeLevelEntities: GradeLevel[] = [];
        for (const gradeName of gradeLevels) {
            let gradeLevel = await gradeLevelRepository.findOne({
                where: { name: gradeName },
            });
            if (!gradeLevel) {
                gradeLevel = await gradeLevelRepository.save({
                    name: gradeName,
                });
            }
            gradeLevelEntities.push(gradeLevel);
        }

    } catch (error) {
        console.error("Error seeding database:", error);
        throw error;
    } finally {
        await app.close();
    }
}

seed();
