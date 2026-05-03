import { DataSource, QueryRunner } from 'typeorm';
import { ExamsService } from '../../../../src_code/elearning-backend/src/modules/exams/exams.service';
import { Exam, ExamStatus } from '../../../../src_code/elearning-backend/src/entities/exam.entity';
import { ExamQuestion } from '../../../../src_code/elearning-backend/src/entities/exam-question.entity';
import { ExamAnswer } from '../../../../src_code/elearning-backend/src/entities/exam-answer.entity';
import { ExamAttempt } from '../../../../src_code/elearning-backend/src/entities/exam-attempt.entity';
import { Enrollment } from '../../../../src_code/elearning-backend/src/entities/enrollment.entity';
import { Course } from '../../../../src_code/elearning-backend/src/entities/course.entity';
import { Chapter } from '../../../../src_code/elearning-backend/src/entities/chapter.entity';
import { Episode } from '../../../../src_code/elearning-backend/src/entities/episode.entity';
import { EpisodeCompletion } from '../../../../src_code/elearning-backend/src/entities/episode-completion.entity';
import { QuizQuestion } from '../../../../src_code/elearning-backend/src/entities/quiz-question.entity';
import { QuizAnswer } from '../../../../src_code/elearning-backend/src/entities/quiz-answer.entity';
import { QuizAttempt } from '../../../../src_code/elearning-backend/src/entities/quiz-attempt.entity';
import { User } from '../../../../src_code/elearning-backend/src/entities/user.entity';
import { Subject } from '../../../../src_code/elearning-backend/src/entities/subject.entity';
import { GradeLevel } from '../../../../src_code/elearning-backend/src/entities/grade-level.entity';
import { CourseMaterial } from '../../../../src_code/elearning-backend/src/entities/course-material.entity';
import { TeacherProfile } from '../../../../src_code/elearning-backend/src/entities/teacher-profile.entity';
import { ZoomMeeting } from '../../../../src_code/elearning-backend/src/entities/zoom-meeting.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const REAL_EXAM_PENDING = { id: 1, title: 'Kiểm Tra Toán Lớp 6 - Đề 1', status: 'PENDING_REVIEW' };
const REAL_EXAM_CLOSED  = { id: 4, title: 'giua ky toan hoc',           status: 'CLOSED' };
const REAL_QUESTION_E1  = { id: 1, examId: 1, correctAnswerId: 1 };

describe('ExamsService', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let service: ExamsService;
  let seededExam: Exam;
  let seededQuestion: ExamQuestion;
  let seededAnswer: ExamAnswer;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST     || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'elearning',
      entities: [
        Exam, ExamQuestion, ExamAnswer, ExamAttempt,
        Enrollment, Course, Chapter, Episode, EpisodeCompletion,
        QuizQuestion, QuizAnswer, QuizAttempt,
        User, Subject, GradeLevel, CourseMaterial,
        TeacherProfile, ZoomMeeting,
      ],
      synchronize: false,
      logging: ['error', 'warn'],
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
    await queryRunner.manager.save(User, { id: 5, email: 'student5@test.com', role: 'STUDENT', fullName: 'Test Student 5', passwordHash: 'hash' });


    seededExam = await queryRunner.manager.save(Exam, {
      title: 'Đề thi seed', status: 'LIVE',
      teacherId: 1, durationMinutes: 45,
    });

    seededQuestion = await queryRunner.manager.save(ExamQuestion, {
      content: 'Câu hỏi 1', exam: { id: seededExam.id }, order: 1,
    });

    seededAnswer = await queryRunner.manager.save(ExamAnswer, {
      content: 'Đáp án đúng', isCorrect: true, question: { id: seededQuestion.id },
    });

    service = new ExamsService(
      queryRunner.manager.getRepository(Exam),
      queryRunner.manager.getRepository(ExamQuestion),
      queryRunner.manager.getRepository(ExamAnswer),
      queryRunner.manager.getRepository(ExamAttempt),
      queryRunner.manager.getRepository(Enrollment),
    );
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('createExam', () => {
    it('TC-04-001: createExam — row INSERT vào DB, submittedAt được set', async () => {
      const result = await service.createExam({
        title: 'Đề thi mới', teacherId: 1, durationMinutes: 45,
      } as any);

      const saved = await queryRunner.manager.findOne(Exam, { where: { id: result.id } });
      expect(saved).not.toBeNull();
      expect(saved.title).toBe('Đề thi mới');
      expect(result).toHaveProperty('submittedAt');
    });
  });

  describe('findExamById', () => {
    it('TC-04-002: trả về exam thực khi ID=1 (Kiểm Tra Toán Lớp 6)', async () => {
      const result = await service.findExamById(REAL_EXAM_PENDING.id);
      expect(result.id).toBe(REAL_EXAM_PENDING.id);
      expect(result.title).toBe(REAL_EXAM_PENDING.title);
    });

    it('TC-04-002b: trả về exam CLOSED khi ID=4', async () => {
      const result = await service.findExamById(REAL_EXAM_CLOSED.id);
      expect(result.status).toBe('CLOSED');
    });

    it('TC-04-003: ném NotFoundException khi không tồn tại', async () => {
      await expect(service.findExamById(999999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExams', () => {
    it('TC-04-004: với role TEACHER, chỉ nên trả về exam của giáo viên đó', async () => {
      const userPayload = { role: 'TEACHER', userId: 1 };
      const paginationDto = { page: 1, limit: 10, order: 'ASC', sortBy: 'id' };

      const result = await service.getExams(paginationDto, undefined, userPayload);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(e => e.teacherId === 1)).toBe(true);
    });

    it('TC-04-005: nên lọc exam theo status', async () => {
      const paginationDto = { page: 1, limit: 10, order: 'ASC', sortBy: 'id' };
      
      const result = await service.getExams(paginationDto, ExamStatus.LIVE);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(e => e.status === 'LIVE')).toBe(true);
    });
  });

  describe('startExamAttempt', () => {
    it('TC-04-006: startExamAttempt — attempt INSERT vào DB (exam LIVE)', async () => {
      // Create course and completed enrollment
      const course = await queryRunner.manager.save(Course, {
        title: 'Course for TC-04-006', status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      await queryRunner.manager.update(Exam, seededExam.id, { courseId: course.id });
      await queryRunner.manager.save(Enrollment, { course: { id: course.id }, student: { id: 5 }, status: 'COMPLETED', isCompleted: true });

      const result = await service.startExamAttempt({ examId: seededExam.id, studentId: 5 } as any);
      const saved = await queryRunner.manager.findOne(ExamAttempt, { where: { id: result.id } });
      expect(saved).not.toBeNull();
    });

    it('TC-04-007: ném BadRequestException khi exam DRAFT', async () => {
      const draftExam = await queryRunner.manager.save(Exam, {
        title: 'Draft', status: 'DRAFT', courseId: null, teacherId: 1, durationMinutes: 45,
      });
      await expect(service.startExamAttempt({ examId: draftExam.id, studentId: 5 } as any)).rejects.toThrow(BadRequestException);
    });

    it('TC-04-008: ném BadRequestException khi course chưa hoàn thành', async () => {
      const courseForExam = await queryRunner.manager.save(Course, {
        title: 'Course for exam', status: 'APPROVED', teacherId: 1, subjectId: 1, gradeLevelId: 1,
      });
      const examWithCourse = await queryRunner.manager.save(Exam, {
        title: 'With course', status: 'LIVE', courseId: courseForExam.id, teacherId: 1, durationMinutes: 45,
      });
      await queryRunner.manager.save(Enrollment, { course: { id: courseForExam.id }, student: { id: 5 }, status: 'ACTIVE' });
      await expect(service.startExamAttempt({ examId: examWithCourse.id, studentId: 5 } as any)).rejects.toThrow(BadRequestException);
    });

    it('TC-04-009: trả về attempt cũ nếu đã có IN_PROGRESS (idempotent)', async () => {
      const existingAttempt = await queryRunner.manager.save(ExamAttempt, {
        exam: { id: seededExam.id }, student: { id: 5 }, status: 'IN_PROGRESS', startedAt: new Date(),
      });
      const result = await service.startExamAttempt({ examId: seededExam.id, studentId: 5 } as any);
      expect(result.id).toBe(existingAttempt.id);
      const count = await queryRunner.manager.count(ExamAttempt, { where: { exam: { id: seededExam.id }, student: { id: 5 } } });
      expect(count).toBe(1);
    });
  });

  describe('submitExam', () => {
    it('TC-04-010: submitExam — status=SUBMITTED, score và timeSpentSeconds trong DB', async () => {
      let attempt = await queryRunner.manager.save(ExamAttempt, {
        exam: { id: seededExam.id }, student: { id: 5 }, startedAt: new Date(Date.now() - 60000),
      });
      attempt = await queryRunner.manager.findOne(ExamAttempt, {
        where: { id: attempt.id }, relations: ['exam', 'exam.questions', 'exam.questions.answers'],
      });
      const result = await service.submitExam(attempt.id, {
        responsesJson: { [seededQuestion.id]: seededAnswer.id },
      } as any);
      const updated = await queryRunner.manager.findOne(ExamAttempt, { where: { id: attempt.id } });
      expect(updated.submittedAt).not.toBeNull();
      expect(Number(updated.score)).toBe(100);
      expect(updated.timeSpentSeconds).toBeGreaterThan(0);
    });

    it('TC-04-011: ném NotFoundException khi attempt không tồn tại', async () => {
      await expect(service.submitExam(999999, { responsesJson: {} } as any)).rejects.toThrow(NotFoundException);
    });

    it('TC-04-012: ném BadRequestException khi đã submitted', async () => {
      let submitted = await queryRunner.manager.save(ExamAttempt, {
        exam: { id: seededExam.id }, student: { id: 5 }, status: 'SUBMITTED', startedAt: new Date(), submittedAt: new Date()
      });
      submitted = await queryRunner.manager.findOne(ExamAttempt, {
        where: { id: submitted.id }, relations: ['exam', 'exam.questions', 'exam.questions.answers'],
      });
      await expect(service.submitExam(submitted.id, { responsesJson: {} } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getExamLeaderboard', () => {
    it('TC-04-013: trả về leaderboard sorted by score DESC', async () => {
      await queryRunner.manager.save(ExamAttempt, [
        { exam: {id: seededExam.id}, student: { id: 1 }, status: 'SUBMITTED', score: 90, startedAt: new Date(), submittedAt: new Date() },
        { exam: {id: seededExam.id}, student: { id: 5 }, status: 'SUBMITTED', score: 70, startedAt: new Date(), submittedAt: new Date() },
      ]);
      const result = await service.getExamLeaderboard(seededExam.id);
      expect(result[0]).toHaveProperty('rank', 1);
      expect(Number(result[0].score)).toBeGreaterThanOrEqual(Number(result[1].score));
    });

    it('TC-04-014: trả về [] khi không có attempt (biên mảng rỗng)', async () => {
      const result = await service.getExamLeaderboard(seededExam.id);
      expect(result).toHaveLength(0);
    });
  });

  describe('deleteExam', () => {
    it('TC-04-015: nên xóa exam và các thực thể liên quan', async () => {
      const attempt = await queryRunner.manager.save(ExamAttempt, { 
          exam: { id: seededExam.id }, student: { id: 1 }, status: 'SUBMITTED', startedAt: new Date()
      });

      await service.deleteExam(seededExam.id);

      const exam = await queryRunner.manager.findOne(Exam, { where: { id: seededExam.id } });
      const question = await queryRunner.manager.findOne(ExamQuestion, { where: { id: seededQuestion.id } });
      const answer = await queryRunner.manager.findOne(ExamAnswer, { where: { id: seededAnswer.id } });
      const deletedAttempt = await queryRunner.manager.findOne(ExamAttempt, { where: { id: attempt.id } });

      expect(exam).toBeNull();
      expect(question).toBeNull();
      expect(answer).toBeNull();
      expect(deletedAttempt).toBeNull();
    });
  });

  describe('ExamQuestion Management', () => {
    it('TC-04-017: createExamQuestion - nên tạo câu hỏi thành công', async () => {
      const dto = { examId: seededExam.id, content: 'Câu hỏi mới?', order: 2, points: 10 };
      const question = await service.createExamQuestion(dto as any);
      
      const saved = await queryRunner.manager.findOne(ExamQuestion, { where: { id: question.id } });
      expect(saved).not.toBeNull();
      expect(saved.content).toBe('Câu hỏi mới?');
    });

    it('TC-04-016: deleteExamQuestion - nên xóa câu hỏi thành công', async () => {
      await service.deleteExamQuestion(seededExam.id, seededQuestion.id);
      
      const deleted = await queryRunner.manager.findOne(ExamQuestion, { where: { id: seededQuestion.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateExam', () => {
    it('TC-04-018: cập nhật thông tin exam', async () => {
      const dto = { title: 'Updated Exam Title', durationMinutes: 60 };
      await service.updateExam(seededExam.id, dto);
      const updated = await queryRunner.manager.findOne(Exam, { where: { id: seededExam.id } });
      expect(updated.title).toBe('Updated Exam Title');
      expect(updated.durationMinutes).toBe(60);
    });
  });

  describe('ExamAnswer Management', () => {
    it('TC-04-019: createExamAnswer - nên tạo câu trả lời thành công', async () => {
      const dto = { questionId: seededQuestion.id, content: 'Ans B', isCorrect: false };
      const answer = await service.createExamAnswer(dto as any);
      expect(answer.content).toBe('Ans B');
    });

    it('TC-04-020: updateExamAnswer - nên cập nhật câu trả lời', async () => {
      await service.updateExamAnswer(seededExam.id, seededQuestion.id, seededAnswer.id, { content: 'Updated Ans' });
      const updated = await queryRunner.manager.findOne(ExamAnswer, { where: { id: seededAnswer.id } });
      expect(updated.content).toBe('Updated Ans');
    });

    it('TC-04-021: deleteExamAnswer - nên xóa câu trả lời', async () => {
      await service.deleteExamAnswer(seededExam.id, seededQuestion.id, seededAnswer.id);
      const deleted = await queryRunner.manager.findOne(ExamAnswer, { where: { id: seededAnswer.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('Exam Retrieval', () => {
    it('TC-04-022: getExamAttempt - nên trả về attempt của student', async () => {
      await queryRunner.manager.save(ExamAttempt, { exam: { id: seededExam.id }, student: { id: 5 }, startedAt: new Date() });
      const result = await service.getExamAttempt(seededExam.id, 5);
      expect(result).not.toBeNull();
      expect(result.exam.id).toBe(seededExam.id);
    });

    it('TC-04-023: getExamQuestions - nên trả về danh sách câu hỏi', async () => {
      const result = await service.getExamQuestions(seededExam.id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe(seededQuestion.id);
    });
  });
});
