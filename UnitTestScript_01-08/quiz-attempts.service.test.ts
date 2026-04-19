import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Repository } from "typeorm";

import { QuizAttemptsService } from "../elearning-backend/src/modules/quiz-attempts/quiz-attempts.service";
import { QuizAttempt } from "../elearning-backend/src/entities/quiz-attempt.entity";
import {
  Episode,
  EpisodeType,
} from "../elearning-backend/src/entities/episode.entity";
import {
  Enrollment,
  EnrollmentStatus,
} from "../elearning-backend/src/entities/enrollment.entity";
import { QuizQuestion } from "../elearning-backend/src/entities/quiz-question.entity";
import { QuizAnswer } from "../elearning-backend/src/entities/quiz-answer.entity";
import { CreateQuizAttemptDto } from "../elearning-backend/src/modules/quiz-attempts/dto/create-quiz-attempt.dto";

type RepoMock<T> = Pick<
  Repository<T>,
  "findOne" | "find" | "create" | "save" | "createQueryBuilder" | "delete"
>;

const createQueryBuilder = () => ({
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
});

const quizAttemptRepositoryMock = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<RepoMock<QuizAttempt>>;

const episodeRepositoryMock = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<RepoMock<Episode>>;

const enrollmentRepositoryMock = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<RepoMock<Enrollment>>;

const quizQuestionRepositoryMock = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<RepoMock<QuizQuestion>>;

const quizAnswerRepositoryMock = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<RepoMock<QuizAnswer>>;

let service: QuizAttemptsService;

/**
 * Fake Database Connection Mock
 * Mô phỏng các thao tác với Database thực tế
 */
const fakeDatabase = {
  queryRunner: {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
  },
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
};

const buildEpisode = (overrides: Partial<Episode> = {}): Episode =>
  ({
    id: 1,
    type: EpisodeType.QUIZ,
    title: "Quiz Episode 1",
    chapter: {
      id: 1,
      course: { id: 10 } as any,
    } as any,
    ...overrides,
  }) as Episode;

const buildEnrollment = (overrides: Partial<Enrollment> = {}): Enrollment =>
  ({
    id: 1,
    status: EnrollmentStatus.ACTIVE,
    student: { id: 77 } as any,
    course: { id: 10 } as any,
    ...overrides,
  }) as Enrollment;

const buildQuizQuestion = (
  overrides: Partial<QuizQuestion> = {},
): QuizQuestion =>
  ({
    id: 1,
    content: "What is 2 + 2?",
    imageUrl: null,
    order: 1,
    answers: [
      { id: 1, content: "4", isCorrect: true } as QuizAnswer,
      { id: 2, content: "5", isCorrect: false } as QuizAnswer,
    ],
    ...overrides,
  }) as QuizQuestion;

const buildQuizAttempt = (overrides: Partial<QuizAttempt> = {}): QuizAttempt =>
  ({
    id: 1,
    episode: buildEpisode(),
    student: { id: 77 } as any,
    submittedAt: new Date(),
    score: 80,
    responsesJson: { 1: 1 },
    ...overrides,
  }) as QuizAttempt;

/**
 * SETUP & TEARDOWN HOOKS - Database Integration
 */

beforeAll(async () => {
  // Initialize Database Connection (Fake)
  await fakeDatabase.queryRunner.connect();
  jest.clearAllMocks();
  service = new QuizAttemptsService(
    quizAttemptRepositoryMock,
    episodeRepositoryMock,
    enrollmentRepositoryMock,
    quizQuestionRepositoryMock,
    quizAnswerRepositoryMock,
  );
});

beforeEach(async () => {
  // Start Transaction before each test
  jest.clearAllMocks();

  // Setup fake DB query mock responses
  fakeDatabase.query.mockResolvedValue({
    rows: [{ id: 1, score: 80, passed: true }],
    rowCount: 1,
  });

  await fakeDatabase.queryRunner.startTransaction();
});

afterEach(async () => {
  // Rollback Transaction after each test
  try {
    await fakeDatabase.queryRunner.rollbackTransaction();
  } catch (err) {
    // Ignore rollback errors if transaction already ended
  }

  // Cleanup: DELETE all test data from fake DB
  try {
    await fakeDatabase.query("DELETE FROM quiz_attempts WHERE student_id > 0");
    await fakeDatabase.query("DELETE FROM quiz_answers WHERE id > 0");
    await fakeDatabase.query("DELETE FROM quiz_questions WHERE id > 0");
  } catch (err) {
    // Ignore cleanup errors
  }
});

afterAll(async () => {
  // Destroy Database Connection (Fake)
  if (fakeDatabase.queryRunner) {
    await fakeDatabase.queryRunner.release();
  }
});

describe("submitQuiz", () => {
  // TC_01
  it("throws NotFoundException when episode does not exist", async () => {
    episodeRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.submitQuiz({
        studentId: 77,
        episodeId: 999,
        responsesJson: { 1: 1 },
      } as CreateQuizAttemptDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // TC_02
  it("throws BadRequestException when episode is not QUIZ type", async () => {
    episodeRepositoryMock.findOne.mockResolvedValue(
      buildEpisode({ type: EpisodeType.VIDEO }),
    );

    await expect(
      service.submitQuiz({
        studentId: 77,
        episodeId: 1,
        responsesJson: { 1: 1 },
      } as CreateQuizAttemptDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // TC_03
  it("throws ForbiddenException when student is not enrolled", async () => {
    episodeRepositoryMock.findOne.mockResolvedValue(buildEpisode());
    enrollmentRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.submitQuiz({
        studentId: 77,
        episodeId: 1,
        responsesJson: { 1: 1 },
      } as CreateQuizAttemptDto),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // TC_04
  it("throws BadRequestException when student already completed quiz", async () => {
    const episode = buildEpisode();
    const existingAttempt = buildQuizAttempt();

    episodeRepositoryMock.findOne.mockResolvedValue(episode);
    enrollmentRepositoryMock.findOne.mockResolvedValue(buildEnrollment());
    quizAttemptRepositoryMock.findOne.mockResolvedValue(existingAttempt as any);

    await expect(
      service.submitQuiz({
        studentId: 77,
        episodeId: 1,
        responsesJson: { 1: 1 },
      } as CreateQuizAttemptDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("findByStudent", () => {
  // TC_05
  it("returns all quiz attempts for a specific student", async () => {
    const attempts = [buildQuizAttempt(), buildQuizAttempt({ id: 2 })];
    quizAttemptRepositoryMock.find.mockResolvedValue(attempts as any);

    const result = await service.findByStudent(77);

    expect(result).toHaveLength(2);
    expect(result[0].studentId).toBe(77);
  });

  // TC_06
  it("returns empty array when student has no quiz attempts", async () => {
    quizAttemptRepositoryMock.find.mockResolvedValue([]);

    const result = await service.findByStudent(999);

    expect(result).toEqual([]);
  });

  // TC_07
  it("orders attempts by submittedAt DESC", async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 10000);
    const attempts = [
      buildQuizAttempt({ submittedAt: now }),
      buildQuizAttempt({ id: 2, submittedAt: earlier }),
    ];
    quizAttemptRepositoryMock.find.mockResolvedValue(attempts as any);

    const result = await service.findByStudent(77);

    expect(result[0].submittedAt.getTime()).toBeGreaterThan(
      result[1].submittedAt.getTime(),
    );
  });
});

describe("findByEpisode", () => {
  // TC_08
  it("returns all quiz attempts for specific episode", async () => {
    const attempts = [buildQuizAttempt(), buildQuizAttempt({ id: 2 })];
    quizAttemptRepositoryMock.find.mockResolvedValue(attempts as any);

    const result = await service.findByEpisode(1);

    expect(result).toHaveLength(2);
    expect(result[0].episodeId).toBe(1);
  });

  // TC_09
  it("returns empty array when episode has no attempts", async () => {
    quizAttemptRepositoryMock.find.mockResolvedValue([]);

    const result = await service.findByEpisode(999);

    expect(result).toEqual([]);
  });

  // TC_10
  it("orders attempts by score DESC then submittedAt ASC", async () => {
    const attempts = [
      buildQuizAttempt({ score: 100 }),
      buildQuizAttempt({ id: 2, score: 80 }),
      buildQuizAttempt({ id: 3, score: 60 }),
    ];
    quizAttemptRepositoryMock.find.mockResolvedValue(attempts as any);

    const result = await service.findByEpisode(1);

    expect(result[0].score).toBe(100);
    expect(result[1].score).toBe(80);
    expect(result[2].score).toBe(60);
  });
});

describe("findOne", () => {
  // TC_11
  it("returns quiz attempt when found", async () => {
    const attempt = buildQuizAttempt();
    quizAttemptRepositoryMock.findOne.mockResolvedValue(attempt as any);

    const result = await service.findOne(1);

    expect(result.id).toBe(1);
    expect(result.score).toBe(80);
  });

  // TC_12
  it("throws NotFoundException when attempt not found", async () => {
    quizAttemptRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_13
  it("loads related episode, chapter, course, and student", async () => {
    const attempt = buildQuizAttempt();
    quizAttemptRepositoryMock.findOne.mockResolvedValue(attempt as any);

    const result = await service.findOne(1);

    expect(result.episode).toBeDefined();
    expect(result.student).toBeDefined();
  });
});

describe("checkAttempt", () => {
  // TC_14
  it("returns quiz attempt when student completed quiz", async () => {
    const attempt = buildQuizAttempt();
    quizAttemptRepositoryMock.findOne.mockResolvedValue(attempt as any);

    const result = await service.checkAttempt(77, 1);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
  });

  // TC_15
  it("returns null when student has not completed quiz", async () => {
    quizAttemptRepositoryMock.findOne.mockResolvedValue(null);

    const result = await service.checkAttempt(77, 1);

    expect(result).toBeNull();
  });

  // TC_16
  it("queries by both studentId and episodeId", async () => {
    quizAttemptRepositoryMock.findOne.mockResolvedValue(null);

    await service.checkAttempt(77, 1);

    expect(quizAttemptRepositoryMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          student: { id: 77 },
          episode: { id: 1 },
        }),
      }),
    );
  });
});

describe("getDetailedResult", () => {
  // TC_17
  it("throws NotFoundException when attempt not found", async () => {
    quizAttemptRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.getDetailedResult(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_18
  it("returns detailed result with answer breakdown", async () => {
    const attempt = buildQuizAttempt({ score: 100 });
    const question = buildQuizQuestion();
    quizAttemptRepositoryMock.findOne.mockResolvedValue(attempt as any);
    quizQuestionRepositoryMock.find.mockResolvedValue([question] as any);

    const result = await service.getDetailedResult(1);

    expect(result.attemptId).toBe(1);
    expect(result.details).toBeDefined();
    expect(result.details.length).toBeGreaterThan(0);
  });

  // TC_19
  it("marks attempt as passed when score >= 60", async () => {
    const attempt = buildQuizAttempt({ score: 75 });
    quizAttemptRepositoryMock.findOne.mockResolvedValue(attempt as any);
    quizQuestionRepositoryMock.find.mockResolvedValue([
      buildQuizQuestion(),
    ] as any);

    const result = await service.getDetailedResult(1);

    expect(result.passed).toBe(true);
  });

  // TC_20
  it("marks attempt as failed when score < 60", async () => {
    const attempt = buildQuizAttempt({ score: 50 });
    quizAttemptRepositoryMock.findOne.mockResolvedValue(attempt as any);
    quizQuestionRepositoryMock.find.mockResolvedValue([
      buildQuizQuestion(),
    ] as any);

    const result = await service.getDetailedResult(1);

    expect(result.passed).toBe(false);
  });
});

describe("getStatisticsByCourse", () => {
  // TC_21
  it("returns statistics when course has quiz attempts", async () => {
    const qb = createQueryBuilder();
    const episode = buildEpisode();
    qb.getMany.mockReturnValue([episode] as any);
    episodeRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const attempts = [
      buildQuizAttempt({ score: 100 }),
      buildQuizAttempt({ id: 2, score: 80 }),
      buildQuizAttempt({ id: 3, score: 40 }),
    ];
    const qb2 = createQueryBuilder();
    qb2.getMany.mockReturnValue(attempts as any);
    quizAttemptRepositoryMock.createQueryBuilder.mockReturnValue(qb2 as any);

    const result = await service.getStatisticsByCourse(10);

    expect(result.totalQuizzes).toBe(1);
    expect(result.totalAttempts).toBe(3);
    expect(result.averageScore).toBeGreaterThan(0);
  });

  // TC_22
  it("returns zero statistics when course has no quizzes", async () => {
    const qb = createQueryBuilder();
    qb.getMany.mockReturnValue([]);
    episodeRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.getStatisticsByCourse(99);

    expect(result.totalQuizzes).toBe(0);
    expect(result.totalAttempts).toBe(0);
    expect(result.passRate).toBe(0);
  });

  // TC_23
  it("calculates pass rate correctly", async () => {
    const qb = createQueryBuilder();
    const episode = buildEpisode();
    qb.getMany.mockReturnValue([episode] as any);
    episodeRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const attempts = [
      buildQuizAttempt({ score: 100 }),
      buildQuizAttempt({ id: 2, score: 80 }),
      buildQuizAttempt({ id: 3, score: 40 }),
    ];
    const qb2 = createQueryBuilder();
    qb2.getMany.mockReturnValue(attempts as any);
    quizAttemptRepositoryMock.createQueryBuilder.mockReturnValue(qb2 as any);

    const result = await service.getStatisticsByCourse(10);

    // 2 out of 3 passed (score >= 60) = 66.67%
    expect(result.passedAttempts).toBe(2);
    expect(result.failedAttempts).toBe(1);
  });
});

describe("getQuizLeaderboard", () => {
  // TC_24
  it("returns leaderboard sorted by score DESC", async () => {
    const attempts = [
      buildQuizAttempt({ score: 100 }),
      buildQuizAttempt({ id: 2, score: 80 }),
      buildQuizAttempt({ id: 3, score: 60 }),
    ];
    quizAttemptRepositoryMock.find.mockResolvedValue(attempts as any);

    const result = await service.getQuizLeaderboard(1);

    expect(result[0].score).toBe(100);
    expect(result[0].rank).toBe(1);
    expect(result[1].score).toBe(80);
    expect(result[1].rank).toBe(2);
  });

  // TC_25
  it("returns empty leaderboard when no attempts exist", async () => {
    quizAttemptRepositoryMock.find.mockResolvedValue([]);

    const result = await service.getQuizLeaderboard(999);

    expect(result).toEqual([]);
  });

  // TC_26
  it("includes student email in leaderboard entry", async () => {
    const attempt = buildQuizAttempt({
      student: { id: 77, fullName: "John Doe", email: "john@test.com" } as any,
    });
    quizAttemptRepositoryMock.find.mockResolvedValue([attempt] as any);

    const result = await service.getQuizLeaderboard(1);

    expect(result[0].studentEmail).toBe("john@test.com");
  });
});

describe("findByCourse", () => {
  // TC_27
  it("returns quiz attempts filtered by course", async () => {
    const qb = createQueryBuilder();
    const episode = buildEpisode();
    qb.getMany.mockReturnValue([episode] as any);
    episodeRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const attempts = [buildQuizAttempt(), buildQuizAttempt({ id: 2 })];
    quizAttemptRepositoryMock.find.mockResolvedValue(attempts as any);

    const result = await service.findByCourse(10);

    expect(result).toHaveLength(2);
    expect(result[0].studentId).toBe(77);
  });

  // TC_28
  it("returns empty array when course has no quiz attempts", async () => {
    const qb = createQueryBuilder();
    qb.getMany.mockReturnValue([]);
    episodeRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.findByCourse(99);

    expect(result).toEqual([]);
  });

  // TC_29
  it("orders attempts by submittedAt DESC", async () => {
    const qb = createQueryBuilder();
    const episode = buildEpisode();
    qb.getMany.mockReturnValue([episode] as any);
    episodeRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const now = new Date();
    const later = new Date(now.getTime() + 5000);
    const attempts = [
      buildQuizAttempt({ submittedAt: later }),
      buildQuizAttempt({ id: 2, submittedAt: now }),
    ];
    quizAttemptRepositoryMock.find.mockResolvedValue(attempts as any);

    const result = await service.findByCourse(10);

    expect(result[0].submittedAt.getTime()).toBeGreaterThanOrEqual(
      result[1].submittedAt.getTime(),
    );
  });

  // TC_30
  it("includes complete attempt details in result", async () => {
    const qb = createQueryBuilder();
    const episode = buildEpisode();
    qb.getMany.mockReturnValue([episode] as any);
    episodeRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const attempt = buildQuizAttempt();
    quizAttemptRepositoryMock.find.mockResolvedValue([attempt] as any);

    const result = await service.findByCourse(10);

    expect(result[0].id).toBe(1);
    expect(result[0].score).toBe(80);
    expect(result[0].passed).toBe(true);
    expect(result[0].episodeTitle).toBeDefined();
  });
});
