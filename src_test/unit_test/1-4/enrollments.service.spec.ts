import { DataSource, QueryRunner } from 'typeorm';
import { EnrollmentsService } from '../../../src_code/elearning-backend/src/modules/enrollments/enrollments.service';
import { Enrollment, EnrollmentStatus } from '../../../src_code/elearning-backend/src/entities/enrollment.entity';
import { Course } from '../../../src_code/elearning-backend/src/entities/course.entity';
import { Chapter } from '../../../src_code/elearning-backend/src/entities/chapter.entity';
import { Episode } from '../../../src_code/elearning-backend/src/entities/episode.entity';
import { EpisodeCompletion } from '../../../src_code/elearning-backend/src/entities/episode-completion.entity';
import { QuizQuestion } from '../../../src_code/elearning-backend/src/entities/quiz-question.entity';
import { QuizAnswer } from '../../../src_code/elearning-backend/src/entities/quiz-answer.entity';
import { QuizAttempt } from '../../../src_code/elearning-backend/src/entities/quiz-attempt.entity';
import { User } from '../../../src_code/elearning-backend/src/entities/user.entity';
import { Subject } from '../../../src_code/elearning-backend/src/entities/subject.entity';
import { GradeLevel } from '../../../src_code/elearning-backend/src/entities/grade-level.entity';
import { CourseMaterial } from '../../../src_code/elearning-backend/src/entities/course-material.entity';
import { Exam } from '../../../src_code/elearning-backend/src/entities/exam.entity';
import { ExamQuestion } from '../../../src_code/elearning-backend/src/entities/exam-question.entity';
import { ExamAnswer } from '../../../src_code/elearning-backend/src/entities/exam-answer.entity';
import { ExamAttempt } from '../../../src_code/elearning-backend/src/entities/exam-attempt.entity';
import { TeacherProfile } from '../../../src_code/elearning-backend/src/entities/teacher-profile.entity';
import { ZoomMeeting } from '../../../src_code/elearning-backend/src/entities/zoom-meeting.entity';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

// ── Enrollment thực từ DB ───────────────────────────────────────────────────
const REAL_ENROLLMENT = { id: 7, studentId: 2, courseId: 1, status: 'ACTIVE' };
const REAL_COMPLETED  = { id: 4, studentId: 6, courseId: 5, status: 'COMPLETED' };

describe('EnrollmentsService', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let service: EnrollmentsService;
  let seededCourse: Course;
  let seededChapter: Chapter;
  let seededEnrollment: Enrollment;
  let seededEpisode: Episode;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST     || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'elearning',
      entities: [
        Enrollment, Course, Chapter, Episode, EpisodeCompletion,
        QuizQuestion, QuizAnswer, QuizAttempt,
        User, Subject, GradeLevel, CourseMaterial,
        Exam, ExamQuestion, ExamAnswer, ExamAttempt,
        TeacherProfile, ZoomMeeting,
      ],
      synchronize: false,
    });
    await dataSource.initialize();
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.manager.query("INSERT IGNORE INTO subjects (id, name) VALUES (1, 'Test Subject');");
    await queryRunner.manager.query("INSERT IGNORE INTO grade_levels (id, name) VALUES (1, 'Test Grade');");
    await queryRunner.manager.save(User, { id: 1, email: 'teacher@test.com', role: 'TEACHER', fullName: 'Test Teacher', passwordHash: 'hash' });
    await queryRunner.manager.save(User, { id: 2, email: 'student@test.com', role: 'STUDENT', fullName: 'Test Student', passwordHash: 'hash' });
    await queryRunner.manager.save(User, { id: 5, email: 'student5@test.com', role: 'STUDENT', fullName: 'Test Student 5', passwordHash: 'hash' });


    seededCourse = await queryRunner.manager.save(Course, {
      title: 'Khóa seed', price: 0, discount: 0, status: 'APPROVED',
      teacherId: 1, subjectId: 1, gradeLevelId: 1,
    });
    seededChapter = await queryRunner.manager.save(Chapter, {
      title: 'Chương 1', course: { id: seededCourse.id }, order: 1,
    });
    
    seededEpisode = await queryRunner.manager.save(Episode, {
      title: 'Ep 1', type: 'VIDEO',
      chapter: { id: seededChapter.id }, order: 1,
    });

    seededChapter.episodes = [seededEpisode];
    seededCourse.chapters = [seededChapter];

    let tempEnrollment = await queryRunner.manager.save(Enrollment, {
      course: { id: seededCourse.id }, student: { id: 2 },
      status: 'ACTIVE',
    });
    
    seededEnrollment = await queryRunner.manager.findOne(Enrollment, { where: { id: tempEnrollment.id } });
    seededEnrollment.course = seededCourse;

    service = new EnrollmentsService(
      queryRunner.manager.getRepository(Enrollment),
      queryRunner.manager.getRepository(Course),
      queryRunner.manager.getRepository(EpisodeCompletion),
      queryRunner.manager.getRepository(Episode),
    );
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('createEnrollment', () => {
    it('TC-03-001: createEnrollment — row INSERT vào DB', async () => {
      const result = await service.createEnrollment({ studentId: 5 } as any, seededCourse.id);
      const saved = await queryRunner.manager.findOne(Enrollment, { where: { id: result.id } });
      expect(saved).not.toBeNull();
      expect(saved.status).toBe('ACTIVE');
    });

    it('TC-03-002: ném NotFoundException khi course không tồn tại', async () => {
      await expect(service.createEnrollment({ studentId: 1 } as any, 999999)).rejects.toThrow(NotFoundException);
    });

    it('TC-03-003: ném BadRequestException khi course status=DRAFT', async () => {
      const draftCourse = await queryRunner.manager.save(Course, {
        title: 'Draft', price: 0, discount: 0, status: 'DRAFT', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      await expect(service.createEnrollment({ studentId: 1 } as any, draftCourse.id)).rejects.toThrow(BadRequestException);
    });

    it('TC-03-004: ném ConflictException khi đã đăng ký (duplicate)', async () => {
      await expect(service.createEnrollment({ studentId: 2 } as any, seededCourse.id)).rejects.toThrow(ConflictException);
    });

    it('TC-03-025: thành công với course status=PUBLISHED', async () => {
      const publishedCourse = await queryRunner.manager.save(Course, {
        title: 'Published Course 025', price: 0, discount: 0, status: 'PUBLISHED',
        teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      const result = await service.createEnrollment({ studentId: 5 } as any, publishedCourse.id);
      const saved = await queryRunner.manager.findOne(Enrollment, { where: { id: result.id } });
      expect(saved).not.toBeNull();
      expect(saved.status).toBe('ACTIVE');
    });
  });

  describe('findEnrollmentById', () => {
    it('TC-03-005: trả về enrollment thực khi tồn tại (courseId=1, id=7)', async () => {
      const result = await service.findEnrollmentById(REAL_ENROLLMENT.courseId, REAL_ENROLLMENT.id);
      expect(result.id).toBe(REAL_ENROLLMENT.id);
    });

    it('TC-03-006: ném NotFoundException khi không tồn tại', async () => {
      await expect(service.findEnrollmentById(999, 999999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markEpisodeComplete', () => {
    // it('TC-03-007: nên tạo EpisodeCompletion và cập nhật tiến độ', async () => {
    //     const course = await queryRunner.manager.save(Course, { title: 'iso course', teacherId: 1, subjectId: 1, gradeLevelId: 1, status: 'APPROVED' });
    //     const chapter = await queryRunner.manager.save(Chapter, { title: 'iso chap', course: { id: course.id }, order: 1 });
    //     const ep1 = await queryRunner.manager.save(Episode, { title: 'iso ep1', chapter: { id: chapter.id }, order: 1, type: 'VIDEO' });
    //     const ep2 = await queryRunner.manager.save(Episode, { title: 'iso ep2', chapter: { id: chapter.id }, order: 2, type: 'VIDEO' });
    //     let enrollment = await queryRunner.manager.save(Enrollment, { course: { id: course.id }, student: { id: 2 }, status: 'ACTIVE' });
        
    //     // Fetch to ensure relations or ID are clean
    //     enrollment = await queryRunner.manager.findOne(Enrollment, { where: { id: enrollment.id }, relations: ['course'] });

    //     await service.markEpisodeComplete(course.id, enrollment.id, ep1.id);
        
    //     const completion = await queryRunner.manager.findOne(EpisodeCompletion, { where: { enrollmentId: enrollment.id, episodeId: ep1.id } });
    //     expect(completion).not.toBeNull();
  
    //     const updatedEnrollment = await service.findEnrollmentById(course.id, enrollment.id);
    //     expect(parseFloat(updatedEnrollment.progressPercentage as any)).toBe(50);
    //   });
    
    it('TC-03-008: ném BadRequestException khi episode không thuộc course', async () => {
      await expect(service.markEpisodeComplete(seededCourse.id, seededEnrollment.id, 999999)).rejects.toThrow(BadRequestException);
    });

    it('TC-03-021: tạo EpisodeCompletion và cập nhật progress 50% khi hoàn thành 1/2 episode', async () => {
      const course = await queryRunner.manager.save(Course, {
        title: 'Course 021', price: 0, discount: 0, status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      const chapter = await queryRunner.manager.save(Chapter, { title: 'Chap 021', course: { id: course.id }, order: 1 });
      const ep1 = await queryRunner.manager.save(Episode, { title: 'Ep1-021', chapter: { id: chapter.id }, order: 1, type: 'VIDEO' });
      await queryRunner.manager.save(Episode, { title: 'Ep2-021', chapter: { id: chapter.id }, order: 2, type: 'VIDEO' });

      let enrollment = await queryRunner.manager.save(Enrollment, {
        course: { id: course.id }, student: { id: 2 }, status: 'ACTIVE',
      });
      enrollment = await queryRunner.manager.findOne(Enrollment, { where: { id: enrollment.id }, relations: ['course'] });

      await service.markEpisodeComplete(course.id, enrollment.id, ep1.id);

      const completion = await queryRunner.manager.findOne(EpisodeCompletion, {
        where: { enrollmentId: enrollment.id, episodeId: ep1.id },
      });
      expect(completion).not.toBeNull();

      const updated = await service.findEnrollmentById(course.id, enrollment.id);
      expect(parseFloat(updated.progressPercentage as any)).toBe(50);
      expect(updated.status).not.toBe(EnrollmentStatus.COMPLETED);
    });

    it('TC-03-022: không tạo completion duplicate khi gọi markEpisodeComplete hai lần', async () => {
      const course = await queryRunner.manager.save(Course, {
        title: 'Course 022', price: 0, discount: 0, status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      const chapter = await queryRunner.manager.save(Chapter, { title: 'Chap 022', course: { id: course.id }, order: 1 });
      const ep1 = await queryRunner.manager.save(Episode, { title: 'Ep1-022', chapter: { id: chapter.id }, order: 1, type: 'VIDEO' });
      await queryRunner.manager.save(Episode, { title: 'Ep2-022', chapter: { id: chapter.id }, order: 2, type: 'VIDEO' });

      let enrollment = await queryRunner.manager.save(Enrollment, {
        course: { id: course.id }, student: { id: 2 }, status: 'ACTIVE',
      });
      enrollment = await queryRunner.manager.findOne(Enrollment, { where: { id: enrollment.id }, relations: ['course'] });

      await service.markEpisodeComplete(course.id, enrollment.id, ep1.id);
      await service.markEpisodeComplete(course.id, enrollment.id, ep1.id);

      const completions = await queryRunner.manager.find(EpisodeCompletion, {
        where: { enrollmentId: enrollment.id, episodeId: ep1.id },
      });
      expect(completions).toHaveLength(1);
    });

    it('TC-03-023: tự động COMPLETED khi hoàn thành 100% (progress=100)', async () => {
      const course = await queryRunner.manager.save(Course, {
        title: 'Course 023', price: 0, discount: 0, status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      const chapter = await queryRunner.manager.save(Chapter, { title: 'Chap 023', course: { id: course.id }, order: 1 });
      const ep1 = await queryRunner.manager.save(Episode, { title: 'Ep1-023', chapter: { id: chapter.id }, order: 1, type: 'VIDEO' });

      let enrollment = await queryRunner.manager.save(Enrollment, {
        course: { id: course.id }, student: { id: 5 }, status: 'ACTIVE',
      });
      enrollment = await queryRunner.manager.findOne(Enrollment, { where: { id: enrollment.id }, relations: ['course'] });

      await service.markEpisodeComplete(course.id, enrollment.id, ep1.id);

      const updated = await service.findEnrollmentById(course.id, enrollment.id);
      expect(parseFloat(updated.progressPercentage as any)).toBe(100);
      expect(updated.status).toBe(EnrollmentStatus.COMPLETED);
      expect(updated.completedAt).not.toBeNull();
    });
  });

  describe('updateLastEpisode', () => {
    it('TC-03-016: cập nhật lastEpisodeId thành công', async () => {
      await service.updateLastEpisode(seededCourse.id, seededEnrollment.id, seededEpisode.id);
      const updated = await queryRunner.manager.findOne(Enrollment, { where: { id: seededEnrollment.id }, relations: ['lastEpisode'] });
      expect(updated.lastEpisode.id).toBe(seededEpisode.id);
    });

    it('TC-03-017: ném BadRequestException khi episode cập nhật sai course', async () => {
        const otherCourse = await queryRunner.manager.save(Course, { title: 'Other', status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1 });
        const otherChapter = await queryRunner.manager.save(Chapter, { title: 'Other Chap', course: { id: otherCourse.id }, order: 1 });
        const otherEp = await queryRunner.manager.save(Episode, { title: 'Other Ep', chapter: { id: otherChapter.id }, order: 1, type: 'VIDEO' });
        
        await expect(service.updateLastEpisode(seededCourse.id, seededEnrollment.id, otherEp.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeCourse', () => {
    it('TC-03-009: completeCourse — status=COMPLETED, progress=100 trong DB', async () => {
      await service.completeCourse(seededCourse.id, seededEnrollment.id);
      const updated = await queryRunner.manager.findOne(Enrollment, { where: { id: seededEnrollment.id } });
      expect(updated.status).toBe('COMPLETED');
      expect(parseFloat(updated.progressPercentage as any)).toBe(100);
      expect(updated.completedAt).not.toBeNull();
    });
  });

  describe('resetCourse', () => {
    it('TC-03-010: resetCourse — completions bị DELETE, progress=0 trong DB', async () => {
      await queryRunner.manager.save(EpisodeCompletion, { enrollment: { id: seededEnrollment.id }, episode: { id: seededEpisode.id } });
      await queryRunner.manager.update(Enrollment, seededEnrollment.id, { status: 'COMPLETED' });

      await service.resetCourse(seededCourse.id, seededEnrollment.id);

      const updated = await queryRunner.manager.findOne(Enrollment, { where: { id: seededEnrollment.id } });
      const completions = await queryRunner.manager.find(EpisodeCompletion, { where: { enrollment: { id: seededEnrollment.id } } });
      expect(parseFloat(updated.progressPercentage as any)).toBe(0);
      expect(updated.status).toBe('ACTIVE');
      expect(completions).toHaveLength(0);
    });
  });

  describe('getStudentEnrollments', () => {
    it('TC-03-012: với subscribed=true, chỉ trả về các enrollment có status ACTIVE', async () => {
        await queryRunner.manager.update(Enrollment, seededEnrollment.id, { status: EnrollmentStatus.COMPLETED });
        const course2 = await queryRunner.manager.save(Course, { title: 'Course 2', status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1 });
        await queryRunner.manager.save(Enrollment, { course: { id: course2.id }, student: { id: 2 }, status: EnrollmentStatus.ACTIVE });

        const result = await service.getStudentEnrollments(2, true, { page: 1, limit: 10 } as any);
        
        expect(result.enrollments.length).toBeGreaterThan(0);
        expect(result.enrollments.every(e => e.status === EnrollmentStatus.ACTIVE)).toBe(true);
    });

    it('TC-03-013: với subscribed=false, trả về các enrollment có status khác ACTIVE', async () => {
        await queryRunner.manager.update(Enrollment, seededEnrollment.id, { status: EnrollmentStatus.COMPLETED });
        const result = await service.getStudentEnrollments(2, false, { page: 1, limit: 10 } as any);

        expect(result.enrollments.length).toBeGreaterThan(0);
        expect(result.enrollments.every(e => e.status !== EnrollmentStatus.ACTIVE)).toBe(true);
    });

    it('TC-03-024: subscribed=null trả về tất cả enrollments không filter theo status', async () => {
      await queryRunner.manager.update(Enrollment, seededEnrollment.id, { status: EnrollmentStatus.COMPLETED });
      const course2 = await queryRunner.manager.save(Course, {
        title: 'Course 024', price: 0, discount: 0, status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      await queryRunner.manager.save(Enrollment, {
        course: { id: course2.id }, student: { id: 2 }, status: EnrollmentStatus.ACTIVE,
      });

      const result = await service.getStudentEnrollments(2, null, { page: 1, limit: 10 } as any);

      expect(result.enrollments.length).toBeGreaterThanOrEqual(2);
      const statuses = result.enrollments.map(e => e.status);
      expect(statuses).toContain(EnrollmentStatus.ACTIVE);
      expect(statuses).toContain(EnrollmentStatus.COMPLETED);
    });
  });

  describe('getEnrollmentsByCourse', () => {
    it('TC-03-014: nên trả về danh sách đăng ký của một khóa học với phân trang', async () => {
      const paginationDto = { page: 1, limit: 10, order: 'ASC', sortBy: 'id' };
      const result = await service.getEnrollmentsByCourse(seededCourse.id, paginationDto);
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(seededEnrollment.id);
    });
  });

  describe('updateEnrollment', () => {
    it('TC-03-011: nên cập nhật trạng thái enrollment và set cancelledAt khi status là CANCELLED', async () => {
      const dto = { status: EnrollmentStatus.CANCELLED };
      const result = await service.updateEnrollment(seededCourse.id, seededEnrollment.id, dto as any);
      expect(result.status).toBe(EnrollmentStatus.CANCELLED);
      expect(result.cancelledAt).not.toBeNull();
    });

    it('TC-03-018: ném NotFoundException khi enrollment không tồn tại', async () => {
      await expect(
        service.updateEnrollment(seededCourse.id, 999999, { status: EnrollmentStatus.CANCELLED } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-03-019: set completedAt khi status là COMPLETED', async () => {
      const dto = { status: EnrollmentStatus.COMPLETED };
      const result = await service.updateEnrollment(seededCourse.id, seededEnrollment.id, dto as any);
      expect(result.status).toBe(EnrollmentStatus.COMPLETED);
      expect(result.completedAt).not.toBeNull();
    });

    it('TC-03-020: cập nhật status ACTIVE không tự động set cancelledAt hay completedAt', async () => {
      const dto = { status: EnrollmentStatus.ACTIVE };
      const result = await service.updateEnrollment(seededCourse.id, seededEnrollment.id, dto as any);
      expect(result.status).toBe(EnrollmentStatus.ACTIVE);
      expect(result.cancelledAt).toBeNull();
      expect(result.completedAt).toBeNull();
    });
  });
});
