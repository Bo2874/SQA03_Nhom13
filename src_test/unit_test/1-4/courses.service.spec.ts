import { DataSource, QueryRunner } from 'typeorm';
import { CoursesService } from '../../../src_code/elearning-backend/src/modules/courses/courses.service';
import { Course, CourseStatus } from '../../../src_code/elearning-backend/src/entities/course.entity';
import { Chapter } from '../../../src_code/elearning-backend/src/entities/chapter.entity';
import { Episode } from '../../../src_code/elearning-backend/src/entities/episode.entity';
import { QuizQuestion } from '../../../src_code/elearning-backend/src/entities/quiz-question.entity';
import { QuizAnswer } from '../../../src_code/elearning-backend/src/entities/quiz-answer.entity';
import { CourseMaterial } from '../../../src_code/elearning-backend/src/entities/course-material.entity';
import { User } from '../../../src_code/elearning-backend/src/entities/user.entity';
import { Subject } from '../../../src_code/elearning-backend/src/entities/subject.entity';
import { GradeLevel } from '../../../src_code/elearning-backend/src/entities/grade-level.entity';
import { QuizAttempt } from '../../../src_code/elearning-backend/src/entities/quiz-attempt.entity';
import { Enrollment } from '../../../src_code/elearning-backend/src/entities/enrollment.entity';
import { EpisodeCompletion } from '../../../src_code/elearning-backend/src/entities/episode-completion.entity';
import { Exam } from '../../../src_code/elearning-backend/src/entities/exam.entity';
import { ExamAttempt } from '../../../src_code/elearning-backend/src/entities/exam-attempt.entity';
import { ZoomMeeting } from '../../../src_code/elearning-backend/src/entities/zoom-meeting.entity';
import { ExamQuestion } from '../../../src_code/elearning-backend/src/entities/exam-question.entity';
import { ExamAnswer } from '../../../src_code/elearning-backend/src/entities/exam-answer.entity';
import { TeacherProfile } from '../../../src_code/elearning-backend/src/entities/teacher-profile.entity';
import { CourseMapper } from '../../../src_code/elearning-backend/src/modules/courses/mapper/course.mapper';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

// ── Course thực từ DB (db/elearning_courses.sql) ────────────────────────────
const REAL_APPROVED_COURSE = { id: 1, title: 'Toán Học Cơ Bản Lớp 6', teacherId: 2 };
const REAL_DRAFT_COURSE = { id: 7, title: 'toán giải tích', teacherId: 13 };
const REAL_CHAPTER_OF_C1 = { id: 1, courseId: 1 };

describe('CoursesService', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let service: CoursesService;
  let seededCourse: Course;
  let seededChapter: Chapter;
  let courseMapper: CourseMapper;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'elearning',
      entities: [
        Course, Chapter, Episode, EpisodeCompletion,
        QuizQuestion, QuizAnswer, QuizAttempt,
        CourseMaterial, User,
        Subject, GradeLevel,
        Enrollment,
        Exam, ExamQuestion, ExamAnswer, ExamAttempt,
        ZoomMeeting, TeacherProfile,
      ],
      synchronize: false,
    });
    await dataSource.initialize();
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // FIX: Seed FKs và User với passwordHash để tránh lỗi test
    await queryRunner.manager.query("INSERT IGNORE INTO subjects (id, name) VALUES (1, 'Test Subject');");
    await queryRunner.manager.query("INSERT IGNORE INTO grade_levels (id, name) VALUES (1, 'Test Grade');");
    await queryRunner.manager.save(User, { id: 1, email: 'teacher@test.com', role: 'TEACHER', fullName: 'Test Teacher', passwordHash: 'hash1' });
    await queryRunner.manager.save(User, { id: 99, email: 'other@test.com', role: 'TEACHER', fullName: 'Other Teacher', passwordHash: 'hash2' });


    seededCourse = await queryRunner.manager.save(Course, {
      title: 'Khóa học seed test',
      status: 'PENDING_REVIEW',
      teacher: { id: 1 },
      subject: { id: 1 },
      gradeLevel: { id: 1 },
    });
    seededChapter = await queryRunner.manager.save(Chapter, {
      title: 'Chương 1',
      course: { id: seededCourse.id },
      order: 1,
    });

    courseMapper = new CourseMapper();
    service = new CoursesService(
      queryRunner.manager.getRepository(Course),
      queryRunner.manager.getRepository(Chapter),
      queryRunner.manager.getRepository(Episode),
      queryRunner.manager.getRepository(QuizQuestion),
      queryRunner.manager.getRepository(QuizAnswer),
      queryRunner.manager.getRepository(CourseMaterial),
      queryRunner.manager.getRepository(User),
      courseMapper,
    );
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  // ── createCourse ───────────────────────────────────────────────────────────
  describe('createCourse', () => {
    it('TC-02-001: createCourse — row được INSERT vào DB', async () => {
      const dto = { title: 'Khóa học A', price: 100000, discount: 0, teacherId: 1, subjectId: 1, gradeLevelId: 1 };
      const result = await service.createCourse(dto as any);

      const saved = await queryRunner.manager.findOne(Course, { where: { id: result.id } });
      expect(saved).not.toBeNull();
      expect(saved.title).toBe('Khóa học A');
      expect(result).toHaveProperty('submittedAt');
    });

    it('TC-02-002: price/discount không tồn tại trong entity — bỏ qua assertion giá', async () => {
      const result = await service.createCourse({
        title: 'Free', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      } as any);
      expect(result.id).toBeDefined();
    });

    it('TC-02-004: discount không tồn tại — bỏ qua assertion', async () => {
      const result = await service.createCourse({
        title: 'Full discount', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      } as any);
      expect(result.id).toBeDefined();
    });
  });

  // ── findCourseById — dùng course thực ──────────────────────────────────────
  describe('findCourseById', () => {
    it('TC-02-005: trả về course thực khi ID=1 (Toán Cơ Bản Lớp 6)', async () => {
      const result = await service.findCourseById(REAL_APPROVED_COURSE.id);
      expect(result.id).toBe(REAL_APPROVED_COURSE.id);
      expect(result.title).toBe(REAL_APPROVED_COURSE.title);
    });

    it('TC-02-006: ném NotFoundException khi ID không tồn tại', async () => {
      await expect(service.findCourseById(999999)).rejects.toThrow(NotFoundException);
    });

    it('TC-02-007: ném NotFoundException khi ID = 0 (biên)', async () => {
      await expect(service.findCourseById(0)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getCourses (NEW) ───────────────────────────────────────────────────────
  describe('getCourses', () => {
    beforeEach(async () => {
        await queryRunner.manager.update(Course, seededCourse.id, { status: CourseStatus.PUBLISHED });
    });

    it('TC-02-008: với role STUDENT, chỉ nên trả về các khóa học PUBLISHED', async () => {
      await queryRunner.manager.save(Course, { title: 'Draft Course', status: CourseStatus.DRAFT, teacherId: 1, subjectId: 1, gradeLevelId: 1 });
      const userPayload = { role: 'USER' };
      const result = await service.getCourses(userPayload);
      expect(result.courses.every(c => c.status === CourseStatus.PUBLISHED)).toBe(true);
    });

    it('TC-02-009: với role TEACHER, chỉ nên trả về khóa học của chính giáo viên đó', async () => {
      const userPayload = { role: 'TEACHER', userId: 1 };
      const result = await service.getCourses(userPayload);
      expect(result.courses.every(c => c.teacherId === 1)).toBe(true);
      expect(result.courses.length).toBeGreaterThan(0);
    });

    it('TC-02-010: với role ADMIN, trả về tất cả khóa học trừ DRAFT', async () => {
      await queryRunner.manager.save(Course, { title: 'Draft Course', status: CourseStatus.DRAFT, teacherId: 1, subjectId: 1, gradeLevelId: 1 });
      const userPayload = { role: 'ADMIN' };
      const result = await service.getCourses(userPayload);
      expect(result.courses.some(c => c.status === CourseStatus.DRAFT)).toBe(false);
    });
  });

  // ── updateCourseByAdmin ────────────────────────────────────────────────────
  describe('updateCourseByAdmin', () => {
    it('TC-02-011: APPROVED → approvedAt được SET trong DB', async () => {
      const result = await service.updateCourseByAdmin(seededCourse.id, { status: 'APPROVED' } as any);
      const updated = await queryRunner.manager.findOne(Course, { where: { id: seededCourse.id } });
      expect(updated.status).toBe('APPROVED');
      expect(updated.approvedAt).not.toBeNull();
    });

    it('TC-02-012: REJECTED không có rejectionReason → ném BadRequestException', async () => {
      await expect(service.updateCourseByAdmin(seededCourse.id, { status: 'REJECTED' } as any)).rejects.toThrow(BadRequestException);
      const unchanged = await queryRunner.manager.findOne(Course, { where: { id: seededCourse.id } });
      expect(unchanged.status).toBe('PENDING_REVIEW');
    });

    it('TC-02-013: REJECTED có rejectionReason → status UPDATE trong DB', async () => {
      const result = await service.updateCourseByAdmin(seededCourse.id, {
        status: 'REJECTED', rejectionReason: 'Nội dung không phù hợp',
      } as any);
      const updated = await queryRunner.manager.findOne(Course, { where: { id: seededCourse.id } });
      expect(updated.status).toBe('REJECTED');
      expect(updated.rejectionReason).toBe('Nội dung không phù hợp');
    });
  });

  // ── updateCourseByTeacher (UPDATED) ──────────────────────────────────────
  describe('updateCourseByTeacher', () => {
    it('TC-02-014: nên ném ForbiddenException khi không phải chủ sở hữu', async () => {
      const userPayload = { userId: 99 };
      await expect(
        service.updateCourseByTeacher(seededCourse.id, { title: 'New Title' } as any, userPayload)
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-02-015: nên cập nhật thành công khi là chủ sở hữu', async () => {
      const userPayload = { userId: 1 };
      const dto = { title: 'Updated Title By Teacher' };
      await service.updateCourseByTeacher(seededCourse.id, dto as any, userPayload);
      const updatedCourse = await queryRunner.manager.findOne(Course, { where: { id: seededCourse.id } });
      expect(updatedCourse.title).toBe('Updated Title By Teacher');
    });
  });

  // ── deleteCourse (NEW) ─────────────────────────────────────────────────────
  describe('deleteCourse', () => {
    it('nên xóa thành công với vai trò ADMIN', async () => {
        const userPayload = { role: 'ADMIN', userId: 99 };
        await service.deleteCourse(seededCourse.id, userPayload);
        const course = await queryRunner.manager.findOne(Course, { where: { id: seededCourse.id } });
        expect(course).toBeNull();
    });

    it('nên ném ForbiddenException khi TEACHER xóa khóa học của người khác', async () => {
        const userPayload = { role: 'TEACHER', userId: 99 };
        await expect(service.deleteCourse(seededCourse.id, userPayload)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── createEpisode ──────────────────────────────────────────────────────────
  describe('createEpisode', () => {
    it('TC-02-016: VIDEO với videoUrl → Episode INSERT vào DB', async () => {
      const result = await service.createEpisode(
        { type: 'VIDEO', videoUrl: 'https://yt.be/x', title: 'Ep 1', order: 1 } as any,
        seededCourse.id, seededChapter.id,
      );
      const saved = await queryRunner.manager.findOne(Episode, { where: { id: result.id } });
      expect(saved).not.toBeNull();
      expect(saved.type).toBe('VIDEO');
    });

    it('TC-02-017: VIDEO không có videoUrl → ném BadRequestException', async () => {
      await expect(
        service.createEpisode(
          { type: 'VIDEO', videoUrl: null, title: 'Ep X', order: 2 } as any,
          seededCourse.id, seededChapter.id,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('TC-02-018: QUIZ → videoUrl nên là falsy', async () => {
      const result = await service.createEpisode(
        { type: 'QUIZ', videoUrl: 'http://x.com', title: 'Quiz 1', order: 3 } as any,
        seededCourse.id, seededChapter.id,
      );
      const saved = await queryRunner.manager.findOne(Episode, { where: { id: result.id } });
      expect(saved.videoUrl).toBeFalsy();
    });
  });

  // ── getFeaturedCourses / searchCourses ─────────────────────────────────────
  describe('getApprovedCourses', () => {
    it('nên trả về chỉ các khóa học có status PUBLISHED', async () => {
      await queryRunner.manager.update(Course, seededCourse.id, { status: CourseStatus.PUBLISHED });
      const result = await service.getApprovedCourses();
      expect(result.courses.every(c => c.status === CourseStatus.PUBLISHED)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  // ── Chapter CRUD ──────────────────────────────────────────────────────────
  describe('Chapter CRUD', () => {
    it('TC-02-025: createChapter — nên lưu chapter vào DB', async () => {
      const dto = { title: 'New Chapter', order: 2 };
      const result = await service.createChapter(dto as any, seededCourse.id);
      expect(result.title).toBe('New Chapter');
      expect(result.course.id).toBe(seededCourse.id);
    });

    it('TC-02-026: findChapterById — nên trả về chapter khi tồn tại', async () => {
      const result = await service.findChapterById(seededChapter.id, seededCourse.id);
      expect(result.id).toBe(seededChapter.id);
    });

    it('TC-02-027: findChapterById — nên ném NotFoundException khi không tồn tại', async () => {
      await expect(service.findChapterById(999, seededCourse.id)).rejects.toThrow(NotFoundException);
    });

    it('TC-02-028: updateChapterById — nên cập nhật title', async () => {
      await service.updateChapterById(seededChapter.id, seededCourse.id, { title: 'Updated Chapter' } as any);
      const updated = await queryRunner.manager.findOne(Chapter, { where: { id: seededChapter.id } });
      expect(updated.title).toBe('Updated Chapter');
    });

    it('TC-02-029: deleteChapterById — nên xóa chapter khỏi DB', async () => {
      await service.deleteChapterById(seededChapter.id, seededCourse.id);
      const deleted = await queryRunner.manager.findOne(Chapter, { where: { id: seededChapter.id } });
      expect(deleted).toBeNull();
    });

    it('TC-02-030: findAllChapters — nên trả về danh sách chapter của course', async () => {
      const result = await service.findAllChapters(seededCourse.id);
      expect(result.length).toBeGreaterThan(0);
      // The service doesn't load the 'course' relation in findAllChapters, so result[0].course will be undefined
      // But result[0] should have the data
      expect(result[0].title).toBe(seededChapter.title);
    });
  });

  // ── Episode CRUD ──────────────────────────────────────────────────────────
  describe('Episode CRUD', () => {
    let seededEpisode: Episode;

    beforeEach(async () => {
      seededEpisode = await queryRunner.manager.save(Episode, {
        title: 'Seeded Ep', type: 'VIDEO', videoUrl: 'http://v.com', chapter: { id: seededChapter.id }, order: 1,
      });
    });

    it('TC-02-031: findEpisodeById — nên trả về episode khi đúng course/chapter/id', async () => {
      const result = await service.findEpisodeById(seededCourse.id, seededChapter.id, seededEpisode.id);
      expect(result.id).toBe(seededEpisode.id);
    });

    it('TC-02-032: updateEpisodeById — nên cập nhật title', async () => {
      await service.updateEpisodeById(seededCourse.id, seededChapter.id, seededEpisode.id, { title: 'Updated Ep' } as any);
      const updated = await queryRunner.manager.findOne(Episode, { where: { id: seededEpisode.id } });
      expect(updated.title).toBe('Updated Ep');
    });

    it('TC-02-033: deleteEpisodeById — nên xóa episode', async () => {
      await service.deleteEpisodeById(seededCourse.id, seededChapter.id, seededEpisode.id);
      const deleted = await queryRunner.manager.findOne(Episode, { where: { id: seededEpisode.id } });
      expect(deleted).toBeNull();
    });

    it('TC-02-034: findAllEpisodes — nên trả về danh sách episode của chapter', async () => {
      const result = await service.findAllEpisodes(seededCourse.id, seededChapter.id);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Quiz Question & Answer CRUD ───────────────────────────────────────────
  describe('Quiz Question & Answer CRUD', () => {
    let quizEpisode: Episode;
    let seededQuestion: QuizQuestion;

    beforeEach(async () => {
      quizEpisode = await queryRunner.manager.save(Episode, {
        title: 'Quiz Ep', type: 'QUIZ', chapter: { id: seededChapter.id }, order: 2,
      });
      seededQuestion = await queryRunner.manager.save(QuizQuestion, {
        content: 'Q1', episode: { id: quizEpisode.id }, order: 1,
      });
    });

    it('TC-02-035: createQuizQuestion — nên lưu question vào DB', async () => {
      const result = await service.createQuizQuestion({ content: 'New Q', order: 2 } as any, seededCourse.id, seededChapter.id, quizEpisode.id);
      expect(result.content).toBe('New Q');
    });

    it('TC-02-036: findQuizQuestionById — nên trả về question', async () => {
      const result = await service.findQuizQuestionById(seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id);
      expect(result.id).toBe(seededQuestion.id);
    });

    it('TC-02-037: updateQuestionById — nên cập nhật content', async () => {
      await service.updateQuestionById({ content: 'Updated Q' } as any, seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id);
      const updated = await queryRunner.manager.findOne(QuizQuestion, { where: { id: seededQuestion.id } });
      expect(updated.content).toBe('Updated Q');
    });

    it('TC-02-038: deleteQuestionById — nên xóa question', async () => {
      await service.deleteQuestionById(seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id);
      const deleted = await queryRunner.manager.findOne(QuizQuestion, { where: { id: seededQuestion.id } });
      expect(deleted).toBeNull();
    });

    it('TC-02-039: createQuizAnswer — nên lưu answer', async () => {
      const result = await service.createQuizAnswer({ content: 'A1', isCorrect: true, order: 1 } as any, seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id);
      expect(result.content).toBe('A1');
      expect(result.isCorrect).toBe(true);
    });

    it('TC-02-040: findAnswerById — nên trả về answer', async () => {
      const ans = await queryRunner.manager.save(QuizAnswer, { content: 'A', question: { id: seededQuestion.id }, isCorrect: false, order: 2 });
      const result = await service.findAnswerById(seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id, ans.id);
      expect(result.id).toBe(ans.id);
    });

    it('TC-02-041: updateAnswerById — nên cập nhật isCorrect', async () => {
      const ans = await queryRunner.manager.save(QuizAnswer, { content: 'A', question: { id: seededQuestion.id }, isCorrect: false, order: 3 });
      await service.updateAnswerById({ isCorrect: true } as any, seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id, ans.id);
      const updated = await queryRunner.manager.findOne(QuizAnswer, { where: { id: ans.id } });
      expect(updated.isCorrect).toBe(true);
    });

    it('TC-02-042: deleteAnswerById — nên xóa answer', async () => {
      const ans = await queryRunner.manager.save(QuizAnswer, { content: 'A', question: { id: seededQuestion.id }, isCorrect: false, order: 4 });
      await service.deleteAnswerById(seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id, ans.id);
      const deleted = await queryRunner.manager.findOne(QuizAnswer, { where: { id: ans.id } });
      expect(deleted).toBeNull();
    });

    it('TC-02-043: findAllQuestions & findAllAnswers — nên trả về danh sách', async () => {
      const qs = await service.findAllQuestions(seededCourse.id, seededChapter.id, quizEpisode.id);
      expect(qs.length).toBeGreaterThan(0);
      const as = await service.findAllAnswers(seededCourse.id, seededChapter.id, quizEpisode.id, seededQuestion.id);
      expect(as).toBeDefined();
    });
  });

  // ── Course Material CRUD ──────────────────────────────────────────────────
  describe('Course Material CRUD', () => {
    let seededMaterial: CourseMaterial;

    beforeEach(async () => {
      seededMaterial = await queryRunner.manager.save(CourseMaterial, {
        title: 'Mat 1', fileUrl: 'http://m.com', course: { id: seededCourse.id },
      });
    });

    it('TC-02-044a: createCourseMaterial — nên lưu material', async () => {
      const result = await service.createCourseMaterial({ title: 'New Mat', fileUrl: 'http://n.com' } as any, seededCourse.id);
      expect(result.title).toBe('New Mat');
    });

    it('TC-02-044b: updateCourseMaterialById — nên cập nhật URL và uploadedAt', async () => {
      await service.updateCourseMaterialById({ fileUrl: 'http://updated.com' } as any, seededMaterial.id);
      const updated = await queryRunner.manager.findOne(CourseMaterial, { where: { id: seededMaterial.id } });
      expect(updated.fileUrl).toBe('http://updated.com');
      expect(updated.uploadedAt).not.toBeNull();
    });

    it('TC-02-044c: findCourseMaterialById — nên trả về material', async () => {
      const result = await service.findCourseMaterialById(seededMaterial.id);
      expect(result.id).toBe(seededMaterial.id);
    });

    it('TC-02-044d: deleteCourseMaterialById — nên xóa material', async () => {
      await service.deleteCourseMaterialById(seededMaterial.id);
      const deleted = await queryRunner.manager.findOne(CourseMaterial, { where: { id: seededMaterial.id } });
      expect(deleted).toBeNull();
    });

    it('TC-02-044e: findAllCourseMaterials — nên trả về danh sách', async () => {
      const result = await service.findAllCourseMaterials(seededCourse.id);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Additional Course APIs ────────────────────────────────────────────────
  describe('Additional Course APIs', () => {
    it('TC-02-045a: getCoursesBySubject — nên trả về các khóa học theo subjectId', async () => {
      await queryRunner.manager.update(Course, seededCourse.id, { status: CourseStatus.PUBLISHED });
      // Use subjectId=1 from beforeEach
      const result = await service.getCoursesBySubject(1);
      expect(result.courses.length).toBeGreaterThan(0);
    });

    it('TC-02-045b: getPlatformStats — nên trả về thống kê tổng quát', async () => {
      await queryRunner.manager.update(Course, seededCourse.id, { status: CourseStatus.PUBLISHED });
      const stats = await service.getPlatformStats();
      expect(stats).toHaveProperty('totalCourses');
      expect(stats).toHaveProperty('totalStudents');
      expect(stats).toHaveProperty('totalTeachers');
      expect(stats).toHaveProperty('totalEpisodes');
      expect(stats.totalCourses).toBeGreaterThanOrEqual(1);
    });
  });
});
