import { DataSource, QueryRunner } from 'typeorm';
import { AuthService } from '../../../src_code/elearning-backend/src/modules/auth/auth.service';
import { User } from '../../../src_code/elearning-backend/src/entities/user.entity';
import { Course } from '../../../src_code/elearning-backend/src/entities/course.entity';
import { Chapter } from '../../../src_code/elearning-backend/src/entities/chapter.entity';
import { Episode } from '../../../src_code/elearning-backend/src/entities/episode.entity';
import { EpisodeCompletion } from '../../../src_code/elearning-backend/src/entities/episode-completion.entity';
import { QuizQuestion } from '../../../src_code/elearning-backend/src/entities/quiz-question.entity';
import { QuizAnswer } from '../../../src_code/elearning-backend/src/entities/quiz-answer.entity';
import { QuizAttempt } from '../../../src_code/elearning-backend/src/entities/quiz-attempt.entity';
import { Enrollment } from '../../../src_code/elearning-backend/src/entities/enrollment.entity';
import { Subject } from '../../../src_code/elearning-backend/src/entities/subject.entity';
import { GradeLevel } from '../../../src_code/elearning-backend/src/entities/grade-level.entity';
import { CourseMaterial } from '../../../src_code/elearning-backend/src/entities/course-material.entity';
import { Exam } from '../../../src_code/elearning-backend/src/entities/exam.entity';
import { ExamAttempt } from '../../../src_code/elearning-backend/src/entities/exam-attempt.entity';
import { ExamQuestion } from '../../../src_code/elearning-backend/src/entities/exam-question.entity';
import { ExamAnswer } from '../../../src_code/elearning-backend/src/entities/exam-answer.entity';
import { TeacherProfile } from '../../../src_code/elearning-backend/src/entities/teacher-profile.entity';
import { ZoomMeeting } from '../../../src_code/elearning-backend/src/entities/zoom-meeting.entity';
import * as bcrypt from 'bcrypt';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

// Mock redisClient vì nó là singleton
jest.mock('../../../src_code/elearning-backend/src/common/utils/redis.client', () => ({
  redisClient: {
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn(),
  },
}));
import { redisClient } from '../../../src_code/elearning-backend/src/common/utils/redis.client';


// ── User thực từ DB export — không cần seed ─────────────────────────────────
const REAL_STUDENT = { id: 2,  email: 'dugnam18@gmail.com',   password: 'vinh1950' };
const REAL_TEACHER = { id: 14, email: 'tuanbip2@outlook.com', password: '123456'   };
const REAL_ADMIN   = { id: 1,  email: 'admin@elearning.com',  password: '123456'   };

// ── Non-DB dependencies vẫn mock ────────────────────────────────────────────
const mockJwtService  = { sign: jest.fn().mockReturnValue('mock-token') };
const mockOtpService  = { verifyOTP: jest.fn() };
const mockMailService = { sendMail: jest.fn() };

describe('AuthService', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let service: AuthService;
  let seededUser: User;   // user tạm cho test ghi (resetPassword)

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST     || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'elearning',
      entities: [
        User, Course, Chapter, Episode, EpisodeCompletion,
        QuizQuestion, QuizAnswer, QuizAttempt,
        Enrollment,
        Exam, ExamQuestion, ExamAnswer, ExamAttempt,
        Subject, GradeLevel, CourseMaterial,
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

    // Seed user TẠM cho test resetPassword (dùng email không trùng DB)
    const hashed = await bcrypt.hash('TempPass1', 10);
    seededUser = await queryRunner.manager.save(User, {
      email: 'temp_test@unit.com', passwordHash: hashed,
      fullName: 'Temp Test', role: 'STUDENT', status: 'ACTIVE',
    });

    service = new AuthService(
      queryRunner.manager.getRepository(User),
      mockJwtService as any,
      mockOtpService as any,
      mockMailService as any
    );
    jest.clearAllMocks();
    (redisClient.set as jest.Mock).mockClear();
    mockJwtService.sign.mockReturnValue('mock-token');
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  // ── validateUser — dùng user thực DB ────────────────────────────────────
  describe('validateUser', () => {
    it('TC-01-001: trả về AuthenticatedUser khi credentials hợp lệ (student thực)', async () => {
      const result = await service.validateUser(REAL_STUDENT.email, REAL_STUDENT.password);
      expect(result).not.toBeNull();
      expect(result.id).toBe(REAL_STUDENT.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('TC-01-002: trả về null khi password sai', async () => {
      expect(await service.validateUser(REAL_STUDENT.email, 'wrong')).toBeNull();
    });

    it('TC-01-003: trả về null khi email không tồn tại', async () => {
      expect(await service.validateUser('nobody_xyz@t.com', 'Abc')).toBeNull();
    });

    it('TC-01-004: trả về null khi email rỗng (biên)', async () => {
      expect(await service.validateUser('', 'Abc')).toBeNull();
    });

    it('TC-01-005: trả về null khi password rỗng (biên)', async () => {
      expect(await service.validateUser(REAL_STUDENT.email, '')).toBeNull();
    });
  });

  // ── signIn — dùng credentials thực ──────────────────────────────────────
  describe('signIn', () => {
    it('TC-01-006: trả về token khi credentials hợp lệ (student id=2)', async () => {
      const result = await service.signIn({
        email: REAL_STUDENT.email, password: REAL_STUDENT.password,
      } as any);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('userId', REAL_STUDENT.id);
    });

    it('TC-01-006b: trả về token cho teacher thực (id=14)', async () => {
      const result = await service.signIn({
        email: REAL_TEACHER.email, password: REAL_TEACHER.password,
      } as any);
      expect(result.userId).toBe(REAL_TEACHER.id);
    });

    it('TC-01-007: ném UnauthorizedException khi password sai', async () => {
      await expect(service.signIn({
        email: REAL_STUDENT.email, password: 'wrong',
      } as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── register — duplicate dùng email thực, create dùng email tạm ──────────
  describe('register', () => {
    it('TC-01-008: register thành công — INSERT + hash password', async () => {
      mockOtpService.verifyOTP.mockResolvedValue(true);

      await service.register({
        email: 'new_register@unit.com', password: '123456', otp: '654321',
        role: 'STUDENT', fullName: 'Test',
      } as any);

      const saved = await queryRunner.manager.findOne(User, { where: { email: 'new_register@unit.com' } });
      expect(saved).not.toBeNull();
      expect(saved.passwordHash).not.toBe('123456');  // đã hash
    });

    it('TC-01-009: ném BadRequestException khi OTP sai — không INSERT', async () => {
      mockOtpService.verifyOTP.mockResolvedValue(false);
      await expect(service.register({
        email: 'otp_fail@unit.com', otp: '000000', password: '123',
      } as any)).rejects.toThrow(BadRequestException);
      const notSaved = await queryRunner.manager.findOne(User, { where: { email: 'otp_fail@unit.com' } });
      expect(notSaved).toBeNull();
    });

    it('TC-01-010: ném ConflictException khi email đã có (dùng email thực DB)', async () => {
      mockOtpService.verifyOTP.mockResolvedValue(true);
      await expect(service.register({
        email: REAL_STUDENT.email,
        otp: '654321', password: '123',
      } as any)).rejects.toThrow(ConflictException);
    });

    it('TC-01-011: ném BadRequestException khi role=ADMIN', async () => {
      mockOtpService.verifyOTP.mockResolvedValue(true);
      await expect(service.register({
        email: 'admin_try@unit.com', role: 'ADMIN', otp: '654321', password: '123',
      } as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ── getUserById — dùng id thực ──────────────────────────────────────────
  describe('getUserById', () => {
    it('TC-01-013: trả về user khi ID=2 tồn tại (student thực)', async () => {
      const result = await service.getUserById(REAL_STUDENT.id);
      expect(result.id).toBe(REAL_STUDENT.id);
      expect(result.email).toBe(REAL_STUDENT.email);
    });

    it('TC-01-013b: trả về user TEACHER khi ID=14', async () => {
      const result = await service.getUserById(REAL_TEACHER.id);
      expect(result.role).toBe('TEACHER');
    });

    it('TC-01-014: ném NotFoundException khi ID không tồn tại', async () => {
      await expect(service.getUserById(999999)).rejects.toThrow(NotFoundException);
    });

    it('TC-01-015: ném NotFoundException khi ID = 0 (biên)', async () => {
      await expect(service.getUserById(0)).rejects.toThrow(NotFoundException);
    });
  });
  
  // ── logOut ──────────────────────────────────────────────────────────────
  describe('logOut', () => {
    it('TC-01-017: nên gọi redisClient.set khi token còn hạn (TTL > 0)', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // còn hạn 1 giờ
      const userPayload = { email: 'test@test.com', cookieName: 'access_token', token: 'valid-token', exp: futureExp };

      await service.logOut(userPayload as any);

      expect(redisClient.set).toHaveBeenCalledTimes(1);
      const actualTTL = (redisClient.set as jest.Mock).mock.calls[0][1];
      expect(actualTTL).toBeGreaterThan(0);
    });

    it('TC-01-018: không nên gọi redisClient.set khi token đã hết hạn (TTL <= 0)', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60; // đã hết hạn 1 phút
      const userPayload = { email: 'test@test.com', cookieName: 'access_token', token: 'expired-token', exp: pastExp };

      await service.logOut(userPayload as any);

      expect(redisClient.set).not.toHaveBeenCalled();
    });
  });

  // ── resetPassword — dùng user TẠM (rollback an toàn) ────────────────────
  describe('resetPassword', () => {
    it('TC-01-020: resetPassword — passwordHash UPDATE trong DB', async () => {
      mockOtpService.verifyOTP.mockResolvedValue(true);
      const oldHash = seededUser.passwordHash;

      await service.resetPassword({
        email: 'temp_test@unit.com', otp: '654321', newPassword: 'NewPass999',
      } as any);

      const updated = await queryRunner.manager.findOne(User, { where: { email: 'temp_test@unit.com' } });
      expect(updated.passwordHash).not.toBe(oldHash);
      expect(updated.passwordHash).not.toBe('NewPass999');
    });

    it('TC-01-021: ném NotFoundException khi email không tồn tại', async () => {
      await expect(service.resetPassword({
        email: 'ghost_xyz@t.com', otp: '654321', newPassword: 'X',
      } as any)).rejects.toThrow(NotFoundException);
    });

    it('TC-01-022: ném UnauthorizedException khi OTP sai', async () => {
      mockOtpService.verifyOTP.mockResolvedValue(false);
      await expect(service.resetPassword({
        email: 'temp_test@unit.com', otp: '000000', newPassword: 'X',
      } as any)).rejects.toThrow(UnauthorizedException);
    });
  });
});
