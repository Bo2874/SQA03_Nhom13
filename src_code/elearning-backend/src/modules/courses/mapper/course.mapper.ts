// mappers/course-update.mapper.ts
import { Injectable } from "@nestjs/common";
import { UpdateCourseByTeacherDto } from "../dto/update-course-by-teacher.dto";
import {
    Chapter,
    Course,
    CourseMaterial,
    Episode,
    QuizAnswer,
    QuizQuestion,
} from "src/entities";
import { UpdateCourseByAdminDto } from "../dto/update-course-by-admin.dto";
import { UpdateCourseMaterialDto } from "../dto/update-course-material.dto";
import { UpdateChapterDto } from "../dto/update-chapter.dto";
import { UpdateEpisodeDto } from "../dto/update-episode.dto";
import { UpdateQuestionDto } from "../dto/update-question.dto";
import { UpdateQuizAnswerDto } from "../dto/update-answer.dto";

@Injectable()
export class CourseMapper {
    updateCourseByTeacher(
        dto: UpdateCourseByTeacherDto,
        course: Course
    ): Course {
        if (dto.title !== undefined) {
            course.title = dto.title;
        }

        if (dto.summary !== undefined) {
            course.summary = dto.summary ?? null;
        }

        if (dto.thumbnailUrl !== undefined) {
            course.thumbnailUrl = dto.thumbnailUrl ?? null;
        }

        if (dto.subjectId !== undefined) {
            course.subject = { id: dto.subjectId } as any;
        }

        if (dto.gradeLevelId !== undefined) {
            course.gradeLevel = { id: dto.gradeLevelId } as any;
        }

        if (dto.status !== undefined) {
            course.status = dto.status as unknown as Course["status"];
        }

        return course;
    }

    updateCourseByAdmin(dto: UpdateCourseByAdminDto, course: Course): Course {
        if (dto.rejectionReason !== undefined) {
            course.rejectionReason = dto.rejectionReason;
        }

        if (dto.status !== undefined) {
            course.status = dto.status as unknown as Course["status"];
        }

        return course;
    }

    updateCourseMaterial(
        dto: UpdateCourseMaterialDto,
        courseMaterial: CourseMaterial
    ) {
        if (dto.fileSizeKb !== undefined) {
            courseMaterial.fileSizeKb = dto.fileSizeKb;
        }

        if (dto.fileUrl !== undefined) {
            courseMaterial.fileUrl = dto.fileUrl;
        }

        if (dto.title !== undefined) {
            courseMaterial.title = dto.title;
        }

        return courseMaterial;
    }

    updateChapter(dto: UpdateChapterDto, chapter: Chapter) {
        if (dto.title !== undefined) {
            chapter.title = dto.title;
        }

        if (dto.order !== undefined) {
            chapter.order = dto.order;
        }

        return chapter;
    }

    updateEpisode(dto: UpdateEpisodeDto, episode: Episode) {
        if (dto.durationSeconds !== undefined) {
            episode.durationSeconds = dto.durationSeconds;
        }

        if (dto.order !== undefined) {
            episode.order = dto.order;
        }

        if (dto.title !== undefined) {
            episode.title = dto.title;
        }

        if (dto.type !== undefined) {
            episode.type = dto.type;
        }

        if (dto.videoUrl !== undefined) {
            episode.videoUrl = dto.videoUrl;
        }

        return episode;
    }

    updateQuestion(dto: UpdateQuestionDto, question: QuizQuestion) {
        if (dto.content !== undefined) {
            question.content = dto.content;
        }

        if (dto.imageUrl !== undefined) {
            question.imageUrl = dto.imageUrl;
        }

        if (dto.order !== undefined) {
            question.order = dto.order;
        }

        return question;
    }

    updateAnswer(dto: UpdateQuizAnswerDto, answer: QuizAnswer) {
        if (dto.content !== undefined) {
            answer.content = dto.content;
        }

        if (dto.isCorrect) {
            answer.isCorrect = dto.isCorrect;
        }

        if (dto.order !== undefined) {
            answer.order = dto.order;
        }

        return answer;
    }
}
