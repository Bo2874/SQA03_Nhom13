import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GradeLevel } from "../../entities/grade-level.entity";
import { CreateGradeLevelDto } from "./dto/create-grade-level.dto";
import { UpdateGradeLevelDto } from "./dto/update-grade-level.dto";

@Injectable()
export class GradeLevelsService {
    constructor(
        @InjectRepository(GradeLevel)
        private gradeLevelRepository: Repository<GradeLevel>
    ) {}

    async create(
        createGradeLevelDto: CreateGradeLevelDto
    ): Promise<GradeLevel> {
        // Check if grade level already exists
        const existingGradeLevel = await this.gradeLevelRepository.findOne({
            where: { name: createGradeLevelDto.name },
        });

        if (existingGradeLevel) {
            throw new BadRequestException("Grade level already exists");
        }

        const gradeLevel =
            this.gradeLevelRepository.create(createGradeLevelDto);
        return await this.gradeLevelRepository.save(gradeLevel);
    }

    async findAll(): Promise<GradeLevel[]> {
        return await this.gradeLevelRepository.find({
            order: { name: "ASC" },
        });
    }

    async findOne(id: number): Promise<GradeLevel> {
        const gradeLevel = await this.gradeLevelRepository.findOne({
            where: { id },
            relations: ["courses"],
        });

        if (!gradeLevel) {
            throw new NotFoundException("Grade level not found");
        }

        return gradeLevel;
    }

    async update(
        id: number,
        updateGradeLevelDto: UpdateGradeLevelDto
    ): Promise<GradeLevel> {
        const gradeLevel = await this.findOne(id);
        Object.assign(gradeLevel, updateGradeLevelDto);
        return await this.gradeLevelRepository.save(gradeLevel);
    }

    async remove(id: number): Promise<void> {
        const gradeLevel = await this.findOne(id);
        await this.gradeLevelRepository.remove(gradeLevel);
    }
}
