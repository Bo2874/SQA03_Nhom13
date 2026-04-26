import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subject } from "../../entities/subject.entity";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";

@Injectable()
export class SubjectsService {
    constructor(
        @InjectRepository(Subject)
        private subjectRepository: Repository<Subject>
    ) {}

    async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
        // Check if subject already exists
        const existingSubject = await this.subjectRepository.findOne({
            where: { name: createSubjectDto.name },
        });

        if (existingSubject) {
            throw new BadRequestException("Subject already exists");
        }

        const subject = this.subjectRepository.create(createSubjectDto);
        return await this.subjectRepository.save(subject);
    }

    async findAll(): Promise<Subject[]> {
        return await this.subjectRepository.find({
            order: { name: "ASC" },
        });
    }

    async findOne(id: number): Promise<Subject> {
        const subject = await this.subjectRepository.findOne({
            where: { id },
            relations: ["courses"],
        });

        if (!subject) {
            throw new NotFoundException("Subject not found");
        }

        return subject;
    }

    async update(
        id: number,
        updateSubjectDto: UpdateSubjectDto
    ): Promise<Subject> {
        const subject = await this.findOne(id);
        Object.assign(subject, updateSubjectDto);
        return await this.subjectRepository.save(subject);
    }

    async remove(id: number): Promise<void> {
        const subject = await this.findOne(id);
        await this.subjectRepository.remove(subject);
    }
}
