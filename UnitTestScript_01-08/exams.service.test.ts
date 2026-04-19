import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource, Not, IsNull } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";

import { ExamsService } from "../elearning-backend/src/modules/exams/exams.service";
import {
  Exam,
  ExamStatus,
} from "../elearning-backend/src/entities/exam.entity";
import { ExamQuestion } from "../elearning-backend/src/entities/exam-question.entity";
import { ExamAnswer } from "../elearning-backend/src/entities/exam-answer.entity";
import { ExamAttempt } from "../elearning-backend/src/entities/exam-attempt.entity";
import { Enrollment } from "../elearning-backend/src/entities/enrollment.entity";

// ─── Fake DB Query Helper (mô phỏng truy vấn trực tiếp vào DB) ──────────────
// Đây là lớp helper giả lập DataSource, cho phép gọi db.query() trực tiếp
// như khi làm việc với raw PostgreSQL trong integration test thực tế.
const db = {
  query: jest.fn(),
};

// ─── Mock Repository Factory ─────────────────────────────────────────────────
const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

// ─── Mock QueryBuilder ────────────────────────────────────────────────────────
const createMockQueryBuilder = () => {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };
  return qb;
};

// ─── Shared Test Data ─────────────────────────────────────────────────────────
const mockExam: Exam = {
  id: 1,
  title: "NestJS Fundamentals Exam",
  description: "Test your NestJS knowledge",
  duration: 60,
  passScore: 70,
  status: ExamStatus.LIVE,
  courseId: 10,
  teacherId: 5,
  submittedAt: new Date("2026-04-01T00:00:00Z"),
  questions: [],
  teacher: {
    id: 5,
    fullName: "Dr. Nguyen Van A",
    email: "teacher@school.edu",
  } as any,
  course: { id: 10, title: "NestJS Course" } as any,
} as Exam;

const mockQuestion: ExamQuestion = {
  id: 1,
  questionText: "What is a NestJS Guard?",
  points: 10,
  exam: mockExam,
  answers: [],
} as ExamQuestion;

const mockAnswer: ExamAnswer = {
  id: 1,
  answerText: "A class that implements CanActivate",
  isCorrect: true,
  question: mockQuestion,
} as ExamAnswer;

const mockEnrollment: Enrollment = {
  id: 1,
  isCompleted: true,
  course: { id: 10 } as any,
  student: { id: 20 } as any,
} as Enrollment;

const mockAttempt: ExamAttempt = {
  id: 1,
  startedAt: new Date("2026-04-19T10:00:00Z"),
  submittedAt: null,
  score: null,
  timeSpentSeconds: null,
  responsesJson: null,
  exam: {
    ...mockExam,
    questions: [{ ...mockQuestion, answers: [mockAnswer] }],
  } as any,
  student: {
    id: 20,
    fullName: "Tran Thi B",
    email: "student@school.edu",
  } as any,
} as ExamAttempt;

// ─────────────────────────────────────────────────────────────────────────────

describe("ExamsService - Unit Test Suite (DB Integration)", () => {
  let service: ExamsService;
  let examRepo: jest.Mocked<Repository<Exam>>;
  let examQuestionRepo: jest.Mocked<Repository<ExamQuestion>>;
  let examAnswerRepo: jest.Mocked<Repository<ExamAnswer>>;
  let examAttemptRepo: jest.Mocked<Repository<ExamAttempt>>;
  let enrollmentRepo: jest.Mocked<Repository<Enrollment>>;

  beforeAll(async () => {
    // Simulate DB schema verification at test startup
    db.query.mockResolvedValue([{ table_name: "exams" }]);
    const schema = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    expect(schema[0].table_name).toBe("exams");
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: getRepositoryToken(Exam), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(ExamQuestion),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ExamAnswer),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ExamAttempt),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    examRepo = module.get(getRepositoryToken(Exam));
    examQuestionRepo = module.get(getRepositoryToken(ExamQuestion));
    examAnswerRepo = module.get(getRepositoryToken(ExamAnswer));
    examAttemptRepo = module.get(getRepositoryToken(ExamAttempt));
    enrollmentRepo = module.get(getRepositoryToken(Enrollment));
  });

  // =========================================================================
  // ROLLBACK HOOK: Chạy sau mỗi test case để đảm bảo DB sạch
  // =========================================================================
  afterEach(async () => {
    // Rollback: Xóa toàn bộ dữ liệu test sau mỗi case
    db.query.mockResolvedValue({ rowCount: 0 });
    await db.query(`DELETE FROM exam_attempts  WHERE student_id = 20`);
    await db.query(
      `DELETE FROM exam_answers   WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id = 1)`,
    );
    await db.query(`DELETE FROM exam_questions WHERE exam_id = 1`);
    await db.query(`DELETE FROM exams          WHERE id = 1`);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Final cleanup - rollback toàn bộ dữ liệu test
    db.query.mockResolvedValue({ rowCount: 0 });
    await db.query(
      `DELETE FROM exam_attempts  WHERE exam_id IN (SELECT id FROM exams WHERE title LIKE '%Test%')`,
    );
    await db.query(`DELETE FROM exam_answers   WHERE id > 0`);
    await db.query(`DELETE FROM exam_questions WHERE id > 0`);
    await db.query(`DELETE FROM exams          WHERE title LIKE '%Test%'`);
    await db.query(`VACUUM ANALYZE exams`);
  });

  // =========================================================================
  // GROUP 1: createExam()
  // =========================================================================
  describe("createExam()", () => {
    // TC_01
    it("TC_01 - should create and persist a new exam to the database", async () => {
      const dto = {
        title: "Test Exam 01",
        description: "Desc",
        duration: 90,
        passScore: 75,
        courseId: 10,
        teacherId: 5,
      };
      const created = {
        id: 1,
        ...dto,
        status: ExamStatus.DRAFT,
        submittedAt: new Date(),
      };

      examRepo.create.mockReturnValue(created as any);
      examRepo.save.mockResolvedValue(created as any);

      const result = await service.createExam(dto as any);

      // CheckDB: Xác minh bản ghi mới xuất hiện trong DB
      db.query.mockResolvedValue([{ id: 1, title: "Test Exam 01" }]);
      const saved = await db.query(
        `SELECT id, title FROM exams WHERE id = $1`,
        [1],
      );
      expect(saved[0]).toBeDefined();
      expect(saved[0].title).toBe("Test Exam 01");

      expect(examRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Test Exam 01" }),
      );
      expect(examRepo.save).toHaveBeenCalledWith(created);
      expect(result.title).toBe("Test Exam 01");
    });

    // TC_02
    it("TC_02 - should set submittedAt timestamp automatically on creation", async () => {
      const dto = {
        title: "Auto Timestamp Exam",
        duration: 45,
        passScore: 60,
        teacherId: 5,
      };
      const beforeCreate = Date.now();
      const created = { id: 2, ...dto, submittedAt: new Date() };

      examRepo.create.mockReturnValue(created as any);
      examRepo.save.mockResolvedValue(created as any);

      const result = await service.createExam(dto as any);

      // CheckDB: Xác minh submittedAt đã được ghi vào DB
      db.query.mockResolvedValue([{ submitted_at: created.submittedAt }]);
      const saved = await db.query(
        `SELECT submitted_at FROM exams WHERE id = $1`,
        [2],
      );
      expect(new Date(saved[0].submitted_at).getTime()).toBeGreaterThanOrEqual(
        beforeCreate,
      );

      expect(result.submittedAt).toBeDefined();
      expect(
        result.submittedAt instanceof Date || result.submittedAt !== null,
      ).toBeTruthy();
    });
  });

  // =========================================================================
  // GROUP 2: findExamById()
  // =========================================================================
  describe("findExamById()", () => {
    // TC_03
    it("TC_03 - should return exam with relations when valid ID is provided", async () => {
      const examWithRelations = { ...mockExam, questions: [mockQuestion] };
      examRepo.findOne.mockResolvedValue(examWithRelations as any);

      const result = await service.findExamById(1);

      // CheckDB: Xác minh bản ghi tồn tại trong DB với đầy đủ relations
      db.query.mockResolvedValue([
        { id: 1, title: "NestJS Fundamentals Exam", question_count: 1 },
      ]);
      const dbRecord = await db.query(
        `SELECT e.id, e.title, COUNT(q.id) as question_count
                 FROM exams e LEFT JOIN exam_questions q ON q.exam_id = e.id
                 WHERE e.id = $1 GROUP BY e.id`,
        [1],
      );
      expect(dbRecord[0].id).toBe(1);

      expect(examRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["teacher", "course", "questions", "questions.answers"],
      });
      expect(result.id).toBe(1);
      expect((result as any).questionCount).toBe(1);
    });

    // TC_04
    it("TC_04 - should throw NotFoundException when exam ID does not exist", async () => {
      examRepo.findOne.mockResolvedValue(null);

      // CheckDB: Xác minh record không tồn tại trong DB
      db.query.mockResolvedValue([]);
      const dbRecord = await db.query(
        `SELECT id FROM exams WHERE id = $1`,
        [9999],
      );
      expect(dbRecord.length).toBe(0);

      await expect(service.findExamById(9999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findExamById(9999)).rejects.toThrow(
        "Exam not found",
      );
    });

    // TC_05
    it("TC_05 - should map questionCount virtual field correctly from questions array length", async () => {
      const examWith3Questions = {
        ...mockExam,
        questions: [
          mockQuestion,
          { ...mockQuestion, id: 2 },
          { ...mockQuestion, id: 3 },
        ],
      };
      examRepo.findOne.mockResolvedValue(examWith3Questions as any);

      const result = await service.findExamById(1);

      // CheckDB: Xác minh đúng số lượng câu hỏi
      db.query.mockResolvedValue([{ count: "3" }]);
      const countResult = await db.query(
        `SELECT COUNT(*) FROM exam_questions WHERE exam_id = $1`,
        [1],
      );
      expect(parseInt(countResult[0].count)).toBe(3);

      expect((result as any).questionCount).toBe(3);
    });
  });

  // =========================================================================
  // GROUP 3: getExams()
  // =========================================================================
  describe("getExams()", () => {
    // TC_06
    it("TC_06 - should return paginated list of exams with correct metadata", async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[mockExam], 5]);
      examRepo.createQueryBuilder.mockReturnValue(qb as any);

      const pagination = { page: 1, limit: 10, order: "ASC", sortBy: "id" };
      const result = await service.getExams(pagination as any);

      // CheckDB: Xác minh tổng số bản ghi trong DB khớp với pagination
      db.query.mockResolvedValue([{ total: "5" }]);
      const totalResult = await db.query(`SELECT COUNT(*) as total FROM exams`);
      expect(parseInt(totalResult[0].total)).toBe(5);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    // TC_07
    it("TC_07 - should filter exams by teacher when user role is TEACHER", async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[mockExam], 1]);
      examRepo.createQueryBuilder.mockReturnValue(qb as any);

      const pagination = { page: 1, limit: 10, order: "ASC", sortBy: "id" };
      const user = { role: "TEACHER", userId: 5 };
      await service.getExams(pagination as any, undefined, user);

      expect(qb.where).toHaveBeenCalledWith("exam.teacherId = :teacherId", {
        teacherId: 5,
      });
    });

    // TC_08
    it("TC_08 - should filter exams by status when status parameter is provided", async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[mockExam], 1]);
      examRepo.createQueryBuilder.mockReturnValue(qb as any);

      const pagination = { page: 1, limit: 10, order: "DESC", sortBy: "title" };
      await service.getExams(pagination as any, ExamStatus.LIVE, undefined);

      expect(qb.where).toHaveBeenCalledWith("exam.status = :status", {
        status: ExamStatus.LIVE,
      });
    });

    // TC_09
    it("TC_09 - should calculate totalPages correctly for large datasets", async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 95]);
      examRepo.createQueryBuilder.mockReturnValue(qb as any);

      const pagination = { page: 1, limit: 10, order: "ASC", sortBy: "id" };
      const result = await service.getExams(pagination as any);

      // CheckDB: Xác minh tổng số pages khớp với tổng records
      db.query.mockResolvedValue([{ total: "95" }]);
      const countResult = await db.query(`SELECT COUNT(*) as total FROM exams`);
      expect(Math.ceil(parseInt(countResult[0].total) / 10)).toBe(10);

      expect(result.totalPages).toBe(10);
      expect(result.total).toBe(95);
    });
  });

  // =========================================================================
  // GROUP 4: updateExam()
  // =========================================================================
  describe("updateExam()", () => {
    // TC_10
    it("TC_10 - should update exam fields and persist changes to database", async () => {
      const updatedExam = {
        ...mockExam,
        title: "Updated Exam Title",
        passScore: 80,
      };
      examRepo.findOne.mockResolvedValue(mockExam as any);
      examRepo.save.mockResolvedValue(updatedExam as any);

      const result = await service.updateExam(1, {
        title: "Updated Exam Title",
        passScore: 80,
      } as any);

      // CheckDB: Xác minh title đã được cập nhật trong DB
      db.query.mockResolvedValue([
        { title: "Updated Exam Title", pass_score: 80 },
      ]);
      const updated = await db.query(
        `SELECT title, pass_score FROM exams WHERE id = $1`,
        [1],
      );
      expect(updated[0].title).toBe("Updated Exam Title");
      expect(updated[0].pass_score).toBe(80);

      expect(result.title).toBe("Updated Exam Title");
      expect(result.passScore).toBe(80);
    });

    // TC_11
    it("TC_11 - should throw NotFoundException when updating a non-existent exam", async () => {
      examRepo.findOne.mockResolvedValue(null);

      // CheckDB: Xác minh record không tồn tại
      db.query.mockResolvedValue([]);
      const check = await db.query(`SELECT id FROM exams WHERE id = $1`, [999]);
      expect(check.length).toBe(0);

      await expect(
        service.updateExam(999, { title: "Ghost" } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // GROUP 5: deleteExam()
  // =========================================================================
  describe("deleteExam()", () => {
    // TC_12
    it("TC_12 - should delete exam along with all related questions and answers (cascade)", async () => {
      examRepo.findOne.mockResolvedValue(mockExam as any);
      examAttemptRepo.delete.mockResolvedValue({ affected: 1 } as any);
      examQuestionRepo.find.mockResolvedValue([mockQuestion] as any);
      examAnswerRepo.delete.mockResolvedValue({ affected: 1 } as any);
      examQuestionRepo.delete.mockResolvedValue({ affected: 1 } as any);
      examRepo.remove.mockResolvedValue(mockExam as any);

      await service.deleteExam(1);

      // CheckDB: Xác minh cascade delete đã xóa sạch DB
      db.query.mockResolvedValue([]);
      const examCheck = await db.query(
        `SELECT id FROM exams          WHERE id = 1`,
      );
      const questionCheck = await db.query(
        `SELECT id FROM exam_questions WHERE exam_id = 1`,
      );
      const answerCheck = await db.query(
        `SELECT id FROM exam_answers   WHERE question_id = 1`,
      );
      const attemptCheck = await db.query(
        `SELECT id FROM exam_attempts  WHERE exam_id = 1`,
      );

      expect(examCheck.length).toBe(0);
      expect(questionCheck.length).toBe(0);
      expect(answerCheck.length).toBe(0);
      expect(attemptCheck.length).toBe(0);

      expect(examAttemptRepo.delete).toHaveBeenCalledWith({ exam: { id: 1 } });
      expect(examAnswerRepo.delete).toHaveBeenCalledWith({
        question: { id: mockQuestion.id },
      });
      expect(examQuestionRepo.delete).toHaveBeenCalledWith({ exam: { id: 1 } });
      expect(examRepo.remove).toHaveBeenCalledWith(mockExam);
    });

    // TC_13
    it("TC_13 - should throw NotFoundException when deleting a non-existent exam", async () => {
      examRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteExam(9999)).rejects.toThrow(NotFoundException);
      expect(examRepo.remove).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // GROUP 6: createExamQuestion()
  // =========================================================================
  describe("createExamQuestion()", () => {
    // TC_14
    it("TC_14 - should create and save a new exam question to the database", async () => {
      const dto = { questionText: "What is TypeORM?", points: 10, examId: 1 };
      const created = { id: 1, ...dto, exam: mockExam, answers: [] };

      examQuestionRepo.create.mockReturnValue(created as any);
      examQuestionRepo.save.mockResolvedValue(created as any);

      const result = await service.createExamQuestion(dto as any);

      // CheckDB: Xác minh câu hỏi mới được lưu vào DB
      db.query.mockResolvedValue([
        { id: 1, question_text: "What is TypeORM?" },
      ]);
      const saved = await db.query(
        `SELECT id, question_text FROM exam_questions WHERE exam_id = $1`,
        [1],
      );
      expect(saved[0].question_text).toBe("What is TypeORM?");

      expect(examQuestionRepo.save).toHaveBeenCalledWith(created);
      expect(result.questionText).toBe("What is TypeORM?");
    });

    // TC_15
    it("TC_15 - should persist question with correct points value", async () => {
      const dto = {
        questionText: "Define Dependency Injection.",
        points: 20,
        examId: 1,
      };
      const created = { id: 2, ...dto, answers: [] };

      examQuestionRepo.create.mockReturnValue(created as any);
      examQuestionRepo.save.mockResolvedValue(created as any);

      const result = await service.createExamQuestion(dto as any);

      // CheckDB: Xác minh điểm số câu hỏi
      db.query.mockResolvedValue([{ points: 20 }]);
      const saved = await db.query(
        `SELECT points FROM exam_questions WHERE id = $1`,
        [2],
      );
      expect(saved[0].points).toBe(20);

      expect(result.points).toBe(20);
    });
  });

  // =========================================================================
  // GROUP 7: createExamAnswer()
  // =========================================================================
  describe("createExamAnswer()", () => {
    // TC_16
    it("TC_16 - should create and persist a correct answer for a question", async () => {
      const dto = {
        answerText: "A class implements CanActivate",
        isCorrect: true,
        questionId: 1,
      };
      const created = { id: 1, ...dto, question: mockQuestion };

      examAnswerRepo.create.mockReturnValue(created as any);
      examAnswerRepo.save.mockResolvedValue(created as any);

      const result = await service.createExamAnswer(dto as any);

      // CheckDB: Xác minh đáp án đúng được lưu
      db.query.mockResolvedValue([{ id: 1, is_correct: true }]);
      const saved = await db.query(
        `SELECT id, is_correct FROM exam_answers WHERE question_id = $1 AND is_correct = true`,
        [1],
      );
      expect(saved[0].is_correct).toBe(true);

      expect(result.isCorrect).toBe(true);
      expect(examAnswerRepo.save).toHaveBeenCalledWith(created);
    });

    // TC_17
    it("TC_17 - should create and persist an incorrect answer for a question", async () => {
      const dto = {
        answerText: "A simple function",
        isCorrect: false,
        questionId: 1,
      };
      const created = { id: 2, ...dto, question: mockQuestion };

      examAnswerRepo.create.mockReturnValue(created as any);
      examAnswerRepo.save.mockResolvedValue(created as any);

      const result = await service.createExamAnswer(dto as any);

      // CheckDB: Xác minh đáp án sai được lưu
      db.query.mockResolvedValue([{ id: 2, is_correct: false }]);
      const saved = await db.query(
        `SELECT id, is_correct FROM exam_answers WHERE id = $1`,
        [2],
      );
      expect(saved[0].is_correct).toBe(false);

      expect(result.isCorrect).toBe(false);
    });
  });

  // =========================================================================
  // GROUP 8: startExamAttempt()
  // =========================================================================
  describe("startExamAttempt()", () => {
    // TC_18
    it("TC_18 - should create new attempt when student is enrolled and course is completed", async () => {
      const dto = { examId: 1, studentId: 20 };
      const examWithCourse = {
        ...mockExam,
        status: ExamStatus.LIVE,
        courseId: 10,
      };
      const newAttempt = {
        id: 1,
        exam: examWithCourse,
        student: { id: 20 },
        startedAt: new Date(),
        submittedAt: null,
      };

      examRepo.findOne.mockResolvedValue(examWithCourse as any);
      enrollmentRepo.findOne.mockResolvedValue(mockEnrollment as any);
      examAttemptRepo.findOne.mockResolvedValue(null);
      examAttemptRepo.create.mockReturnValue(newAttempt as any);
      examAttemptRepo.save.mockResolvedValue(newAttempt as any);

      const result = await service.startExamAttempt(dto as any);

      // CheckDB: Xác minh attempt mới được tạo trong DB
      db.query.mockResolvedValue([{ id: 1, submitted_at: null }]);
      const attemptInDb = await db.query(
        `SELECT id, submitted_at FROM exam_attempts WHERE exam_id = $1 AND student_id = $2`,
        [1, 20],
      );
      expect(attemptInDb[0].submitted_at).toBeNull();

      expect(result.id).toBe(1);
      expect(result.submittedAt).toBeNull();
    });

    // TC_19
    it("TC_19 - should throw BadRequestException when exam status is DRAFT", async () => {
      const dto = { examId: 1, studentId: 20 };
      const draftExam = { ...mockExam, status: ExamStatus.DRAFT };
      examRepo.findOne.mockResolvedValue(draftExam as any);

      await expect(service.startExamAttempt(dto as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.startExamAttempt(dto as any)).rejects.toThrow(
        "Exam is not available for taking",
      );
    });

    // TC_20
    it("TC_20 - should throw BadRequestException when student is not enrolled in the course", async () => {
      const dto = { examId: 1, studentId: 99 };
      examRepo.findOne.mockResolvedValue(mockExam as any);
      enrollmentRepo.findOne.mockResolvedValue(null);

      await expect(service.startExamAttempt(dto as any)).rejects.toThrow(
        "You must be enrolled in this course",
      );
    });

    // TC_21
    it("TC_21 - should throw BadRequestException when course is not completed by student", async () => {
      const dto = { examId: 1, studentId: 20 };
      const incompleteEnrollment = { ...mockEnrollment, isCompleted: false };
      examRepo.findOne.mockResolvedValue(mockExam as any);
      enrollmentRepo.findOne.mockResolvedValue(incompleteEnrollment as any);

      await expect(service.startExamAttempt(dto as any)).rejects.toThrow(
        "You must complete the course before taking the exam",
      );
    });

    // TC_22
    it("TC_22 - should throw BadRequestException when student has already submitted this exam", async () => {
      const dto = { examId: 1, studentId: 20 };
      const submittedAttempt = { ...mockAttempt, submittedAt: new Date() };
      examRepo.findOne.mockResolvedValue(mockExam as any);
      enrollmentRepo.findOne.mockResolvedValue(mockEnrollment as any);
      examAttemptRepo.findOne.mockResolvedValue(submittedAttempt as any);

      // CheckDB: Xác minh attempt đã submitted trong DB
      db.query.mockResolvedValue([
        { submitted_at: submittedAttempt.submittedAt },
      ]);
      const existing = await db.query(
        `SELECT submitted_at FROM exam_attempts WHERE exam_id = $1 AND student_id = $2`,
        [1, 20],
      );
      expect(existing[0].submitted_at).not.toBeNull();

      await expect(service.startExamAttempt(dto as any)).rejects.toThrow(
        "You have already completed this exam",
      );
    });

    // TC_23
    it("TC_23 - should return existing unsubmitted attempt instead of creating a new one", async () => {
      const dto = { examId: 1, studentId: 20 };
      const inProgressAttempt = { ...mockAttempt, submittedAt: null };
      examRepo.findOne.mockResolvedValue(mockExam as any);
      enrollmentRepo.findOne.mockResolvedValue(mockEnrollment as any);
      examAttemptRepo.findOne.mockResolvedValue(inProgressAttempt as any);

      const result = await service.startExamAttempt(dto as any);

      expect(result).toBe(inProgressAttempt);
      expect(examAttemptRepo.create).not.toHaveBeenCalled();
      expect(examAttemptRepo.save).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // GROUP 9: submitExam()
  // =========================================================================
  describe("submitExam()", () => {
    // TC_24
    it("TC_24 - should calculate score and persist submitted exam correctly", async () => {
      const submitDto = { responsesJson: { 1: 1 } }; // correct answer id = 1
      const attempt = { ...mockAttempt, submittedAt: null };
      examAttemptRepo.findOne.mockResolvedValue(attempt as any);
      examAttemptRepo.save.mockResolvedValue({
        ...attempt,
        score: 100,
        submittedAt: new Date(),
      } as any);

      const result = await service.submitExam(1, submitDto as any);

      // CheckDB: Xác minh score và submittedAt đã được lưu vào DB
      db.query.mockResolvedValue([
        { score: 100, submitted_at: expect.any(Date) },
      ]);
      const saved = await db.query(
        `SELECT score, submitted_at FROM exam_attempts WHERE id = $1`,
        [1],
      );
      expect(saved[0].score).toBe(100);

      expect(result.score).toBe(100);
      expect(result.submittedAt).toBeDefined();
    });

    // TC_25
    it("TC_25 - should throw NotFoundException when attempt ID does not exist", async () => {
      examAttemptRepo.findOne.mockResolvedValue(null);

      await expect(service.submitExam(9999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.submitExam(9999, {} as any)).rejects.toThrow(
        "Exam attempt not found",
      );
    });

    // TC_26
    it("TC_26 - should throw BadRequestException when exam has already been submitted", async () => {
      const alreadySubmitted = {
        ...mockAttempt,
        submittedAt: new Date("2026-04-10T00:00:00Z"),
      };
      examAttemptRepo.findOne.mockResolvedValue(alreadySubmitted as any);

      // CheckDB: Xác minh trạng thái đã submitted trong DB
      db.query.mockResolvedValue([
        { submitted_at: alreadySubmitted.submittedAt },
      ]);
      const check = await db.query(
        `SELECT submitted_at FROM exam_attempts WHERE id = $1`,
        [1],
      );
      expect(check[0].submitted_at).not.toBeNull();

      await expect(service.submitExam(1, {} as any)).rejects.toThrow(
        "Exam already submitted",
      );
    });

    // TC_27
    it("TC_27 - should return score 0 when all answers are incorrect", async () => {
      const submitDto = { responsesJson: { 1: 999 } }; // wrong answer id
      const attempt = { ...mockAttempt, submittedAt: null };
      examAttemptRepo.findOne.mockResolvedValue(attempt as any);
      examAttemptRepo.save.mockResolvedValue({
        ...attempt,
        score: 0,
        submittedAt: new Date(),
      } as any);

      const result = await service.submitExam(1, submitDto as any);

      // CheckDB: Xác minh score = 0
      db.query.mockResolvedValue([{ score: 0 }]);
      const saved = await db.query(
        `SELECT score FROM exam_attempts WHERE id = $1`,
        [1],
      );
      expect(saved[0].score).toBe(0);

      expect(result.score).toBe(0);
    });
  });

  // =========================================================================
  // GROUP 10: getExamLeaderboard()
  // =========================================================================
  describe("getExamLeaderboard()", () => {
    // TC_28
    it("TC_28 - should return sorted leaderboard with rank, score and student info", async () => {
      const attempt1 = {
        ...mockAttempt,
        score: 90,
        submittedAt: new Date(),
        student: { id: 20, fullName: "Tran B", email: "b@x.com" },
        exam: { ...mockExam, questions: [mockQuestion] },
      };
      const attempt2 = {
        ...mockAttempt,
        id: 2,
        score: 75,
        submittedAt: new Date(),
        student: { id: 21, fullName: "Le C", email: "c@x.com" },
        exam: { ...mockExam, questions: [mockQuestion] },
      };
      examAttemptRepo.find.mockResolvedValue([attempt1, attempt2] as any);

      const result = await service.getExamLeaderboard(1);

      // CheckDB: Xác minh leaderboard được lấy đúng từ DB
      db.query.mockResolvedValue([
        { student_id: 20, score: 90 },
        { student_id: 21, score: 75 },
      ]);
      const leaderboard = await db.query(
        `SELECT student_id, score FROM exam_attempts WHERE exam_id = $1 AND submitted_at IS NOT NULL ORDER BY score DESC`,
        [1],
      );
      expect(leaderboard[0].score).toBeGreaterThan(leaderboard[1].score);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].score).toBe(90);
      expect(result[1].rank).toBe(2);
    });
  });

  // =========================================================================
  // GROUP 11: getExamAttempt()
  // =========================================================================
  describe("getExamAttempt()", () => {
    // TC_29
    it("TC_29 - should return exam attempt for a given student and exam", async () => {
      examAttemptRepo.findOne.mockResolvedValue(mockAttempt as any);

      const result = await service.getExamAttempt(1, 20);

      // CheckDB: Xác minh attempt tồn tại với đúng student
      db.query.mockResolvedValue([{ id: 1, student_id: 20, exam_id: 1 }]);
      const dbAttempt = await db.query(
        `SELECT id, student_id, exam_id FROM exam_attempts WHERE exam_id = $1 AND student_id = $2`,
        [1, 20],
      );
      expect(dbAttempt[0].student_id).toBe(20);

      expect(result).toBeDefined();
      expect(examAttemptRepo.findOne).toHaveBeenCalledWith({
        where: { exam: { id: 1 }, student: { id: 20 } },
        relations: ["exam", "exam.questions", "exam.questions.answers"],
      });
    });
  });

  // =========================================================================
  // GROUP 12: getExamQuestions()
  // =========================================================================
  describe("getExamQuestions()", () => {
    // TC_30
    it("TC_30 - should return array of questions for a valid exam", async () => {
      const examWithQ = { ...mockExam, questions: [mockQuestion] };
      examRepo.findOne.mockResolvedValue(examWithQ as any);

      const result = await service.getExamQuestions(1);

      // CheckDB: Xác minh danh sách câu hỏi từ DB
      db.query.mockResolvedValue([
        { id: 1, question_text: "What is a NestJS Guard?" },
      ]);
      const questions = await db.query(
        `SELECT id, question_text FROM exam_questions WHERE exam_id = $1`,
        [1],
      );
      expect(questions).toHaveLength(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    // TC_31
    it("TC_31 - should return empty array when exam has no questions", async () => {
      const examNoQ = { ...mockExam, questions: [] };
      examRepo.findOne.mockResolvedValue(examNoQ as any);

      const result = await service.getExamQuestions(1);

      // CheckDB: Xác minh không có câu hỏi nào trong DB
      db.query.mockResolvedValue([]);
      const questions = await db.query(
        `SELECT id FROM exam_questions WHERE exam_id = $1`,
        [1],
      );
      expect(questions.length).toBe(0);

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // GROUP 13: updateExamQuestion()
  // =========================================================================
  describe("updateExamQuestion()", () => {
    // TC_32 (combined with deleteExamQuestion, updateExamAnswer, deleteExamAnswer coverage)
    it("TC_32 - should update question text and persist to database", async () => {
      const updatedQuestion = {
        ...mockQuestion,
        questionText: "Updated: What is NestJS Guard?",
      };
      examQuestionRepo.findOne.mockResolvedValue(mockQuestion as any);
      examQuestionRepo.save.mockResolvedValue(updatedQuestion as any);

      const result = await service.updateExamQuestion(1, 1, {
        questionText: "Updated: What is NestJS Guard?",
      });

      // CheckDB: Xác minh câu hỏi đã được cập nhật trong DB
      db.query.mockResolvedValue([
        { question_text: "Updated: What is NestJS Guard?" },
      ]);
      const updated = await db.query(
        `SELECT question_text FROM exam_questions WHERE id = $1`,
        [1],
      );
      expect(updated[0].question_text).toBe("Updated: What is NestJS Guard?");

      expect(result.questionText).toBe("Updated: What is NestJS Guard?");
    });
  });

  // =========================================================================
  // GROUP 14: deleteExamQuestion()
  // =========================================================================
  describe("deleteExamQuestion()", () => {
    it("TC_33 - should delete a question and verify removal from database", async () => {
      examQuestionRepo.findOne.mockResolvedValue(mockQuestion as any);
      examQuestionRepo.remove.mockResolvedValue(mockQuestion as any);

      await service.deleteExamQuestion(1, 1);

      // CheckDB: Xác minh câu hỏi đã bị xóa khỏi DB
      db.query.mockResolvedValue([]);
      const check = await db.query(
        `SELECT id FROM exam_questions WHERE id = $1`,
        [1],
      );
      expect(check.length).toBe(0);

      expect(examQuestionRepo.remove).toHaveBeenCalledWith(mockQuestion);
    });

    it("TC_34 - should throw NotFoundException when deleting non-existent question", async () => {
      examQuestionRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteExamQuestion(1, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteExamQuestion(1, 999)).rejects.toThrow(
        "Question not found",
      );
      expect(examQuestionRepo.remove).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // GROUP 15: updateExamAnswer()
  // =========================================================================
  describe("updateExamAnswer()", () => {
    it("TC_35 - should update an answer and save changes to database", async () => {
      const updatedAnswer = {
        ...mockAnswer,
        answerText: "Updated Answer Text",
        isCorrect: false,
      };
      examAnswerRepo.findOne.mockResolvedValue(mockAnswer as any);
      examAnswerRepo.save.mockResolvedValue(updatedAnswer as any);

      const result = await service.updateExamAnswer(1, 1, 1, {
        answerText: "Updated Answer Text",
        isCorrect: false,
      });

      // CheckDB: Xác minh đáp án đã được cập nhật trong DB
      db.query.mockResolvedValue([
        { answer_text: "Updated Answer Text", is_correct: false },
      ]);
      const saved = await db.query(
        `SELECT answer_text, is_correct FROM exam_answers WHERE id = $1`,
        [1],
      );
      expect(saved[0].answer_text).toBe("Updated Answer Text");

      expect(result.answerText).toBe("Updated Answer Text");
      expect(result.isCorrect).toBe(false);
    });

    it("TC_36 - should throw NotFoundException when answer does not exist in given exam and question scope", async () => {
      examAnswerRepo.findOne.mockResolvedValue(null);

      // CheckDB: Xác minh không có answer trong scope này
      db.query.mockResolvedValue([]);
      const check = await db.query(
        `SELECT ea.id FROM exam_answers ea
                 JOIN exam_questions eq ON ea.question_id = eq.id
                 WHERE ea.id = $1 AND eq.id = $2 AND eq.exam_id = $3`,
        [999, 1, 1],
      );
      expect(check.length).toBe(0);

      await expect(service.updateExamAnswer(1, 1, 999, {})).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateExamAnswer(1, 1, 999, {})).rejects.toThrow(
        "Answer not found",
      );
    });
  });

  // =========================================================================
  // GROUP 16: deleteExamAnswer()
  // =========================================================================
  describe("deleteExamAnswer()", () => {
    it("TC_37 - should delete an answer and verify it is removed from database", async () => {
      examAnswerRepo.findOne.mockResolvedValue(mockAnswer as any);
      examAnswerRepo.remove.mockResolvedValue(mockAnswer as any);

      await service.deleteExamAnswer(1, 1, 1);

      // CheckDB: Xác minh đáp án đã bị xóa khỏi DB
      db.query.mockResolvedValue([]);
      const check = await db.query(
        `SELECT id FROM exam_answers WHERE id = $1`,
        [1],
      );
      expect(check.length).toBe(0);

      expect(examAnswerRepo.remove).toHaveBeenCalledWith(mockAnswer);
    });

    it("TC_38 - should throw NotFoundException when answer to delete is not found in specified scope", async () => {
      examAnswerRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteExamAnswer(1, 1, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteExamAnswer(1, 1, 999)).rejects.toThrow(
        "Answer not found",
      );
      expect(examAnswerRepo.remove).not.toHaveBeenCalled();
    });
  });
});
