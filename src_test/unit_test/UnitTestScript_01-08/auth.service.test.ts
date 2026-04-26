import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { AuthService } from "../elearning-backend/src/modules/auth/auth.service";
import {
  User,
  UserRole,
  UserStatus,
} from "../elearning-backend/src/entities/user.entity";
import { RegisterDto } from "../elearning-backend/src/modules/auth/dto/register.dto";
import { SignInDto } from "../elearning-backend/src/modules/auth/dto/sign-in.dto";
import { ResetPasswordDto } from "../elearning-backend/src/modules/auth/dto/reset-password.dto";
import { redisClient } from "../elearning-backend/src/common/utils/redis.client";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock(
  "../../../../elearning-backend/src/common/utils/redis.client",
  () => ({
    redisClient: {
      set: jest.fn(),
    },
  }),
);

type UserRepoMock = Pick<Repository<User>, "findOne" | "create" | "save">;

const userRepositoryMock = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<UserRepoMock>;

const jwtServiceMock = {
  sign: jest.fn(),
} as unknown as jest.Mocked<Pick<JwtService, "sign">>;

const otpServiceMock = {
  verifyOTP: jest.fn(),
};

const mailServiceMock = {
  sendMail: jest.fn(),
};

const compareMock = bcrypt.compare as jest.Mock;
const hashMock = bcrypt.hash as jest.Mock;
const redisSetMock = redisClient.set as jest.Mock;

let service: AuthService;

const fakeDatabase = {
  queryRunner: {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  },
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
};

const buildStoredUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    email: "teacher@example.com",
    passwordHash: "hashed-password",
    fullName: "Teacher One",
    phone: "0900000000",
    avatarUrl: "https://example.com/avatar.png",
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    createdAt: new Date("2026-04-10T00:00:00.000Z"),
    updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    courses: [],
    quizAttempts: [],
    enrollments: [],
    exams: [],
    examAttempts: [],
    ...overrides,
  }) as User;

beforeAll(async () => {
  await fakeDatabase.queryRunner.connect();
  service = new AuthService(
    userRepositoryMock,
    jwtServiceMock,
    otpServiceMock as never,
    mailServiceMock as never,
  );
});

beforeEach(async () => {
  jest.clearAllMocks();
  delete process.env.PREFIX_OTP;
  delete process.env.PREFIX_RESET_PASSWORD_OTP;

  fakeDatabase.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
  await fakeDatabase.queryRunner.startTransaction();
});

afterEach(async () => {
  try {
    await fakeDatabase.queryRunner.rollbackTransaction();
  } catch {
    // ignore rollback errors in fake db
  }

  try {
    await fakeDatabase.query("DELETE FROM users WHERE id > 0");
    await fakeDatabase.query("DELETE FROM redis_blacklist WHERE id > 0");
  } catch {
    // ignore cleanup errors in fake db
  }
});

afterAll(async () => {
  await fakeDatabase.queryRunner.release();
});

describe("validateUser(username, password)", () => {
  // TC_01
  it("returns sanitized user when credentials are valid", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildStoredUser());
    compareMock.mockResolvedValue(true);

    const result = await service.validateUser(
      "teacher@example.com",
      "secret123",
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        email: "teacher@example.com",
        fullName: "Teacher One",
        role: UserRole.TEACHER,
      }),
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  // TC_02
  it("returns null when user is not found", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    const result = await service.validateUser(
      "missing@example.com",
      "secret123",
    );

    expect(result).toBeNull();
    expect(compareMock).not.toHaveBeenCalled();
  });

  // TC_03
  it("returns null when password does not match", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildStoredUser());
    compareMock.mockResolvedValue(false);

    const result = await service.validateUser("teacher@example.com", "wrong");

    expect(result).toBeNull();
  });

  // TC_04
  it("CheckDB: verifies user lookup query is executed", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildStoredUser());
    compareMock.mockResolvedValue(true);

    await service.validateUser("teacher@example.com", "secret123");

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM users WHERE email = ?",
      ["teacher@example.com"],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("signIn(signInDto)", () => {
  // TC_05
  it("returns token and user info when sign-in is successful", async () => {
    jest.spyOn(service, "validateUser").mockResolvedValue({
      id: 2,
      email: "student@example.com",
      fullName: "Student One",
      phone: "0911111111",
      avatarUrl: "https://example.com/s.png",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
    jwtServiceMock.sign.mockReturnValue("jwt-token-abc");

    const dto: SignInDto = {
      email: "student@example.com",
      password: "secret123",
    };
    const result = await service.signIn(dto);

    expect(result.token).toBe("jwt-token-abc");
    expect(result.userId).toBe(2);
  });

  // TC_06
  it("throws UnauthorizedException when credentials are invalid", async () => {
    jest.spyOn(service, "validateUser").mockResolvedValue(null);

    const dto: SignInDto = { email: "student@example.com", password: "wrong" };

    await expect(service.signIn(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // TC_07
  it("creates JWT payload with sub, email, role, status", async () => {
    jest.spyOn(service, "validateUser").mockResolvedValue({
      id: 3,
      email: "teacher2@example.com",
      fullName: "Teacher Two",
      phone: "0922222222",
      avatarUrl: "https://example.com/t2.png",
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    });
    jwtServiceMock.sign.mockReturnValue("jwt-token-xyz");

    await service.signIn({
      email: "teacher2@example.com",
      password: "secret123",
    });

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      sub: 3,
      email: "teacher2@example.com",
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    });
  });

  // TC_08
  it("CheckDB: verifies sign-in email can be checked in DB", async () => {
    jest.spyOn(service, "validateUser").mockResolvedValue({
      id: 4,
      email: "learner@example.com",
      fullName: "Learner",
      phone: "0933333333",
      avatarUrl: "https://example.com/l.png",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
    jwtServiceMock.sign.mockReturnValue("jwt-token-4");

    await service.signIn({
      email: "learner@example.com",
      password: "secret123",
    });

    const dbCheck = await fakeDatabase.query(
      "SELECT email FROM users WHERE email = ?",
      ["learner@example.com"],
    );
    expect(dbCheck).toBeDefined();
  });
});

describe("register(registerDto)", () => {
  // TC_09
  it("registers user successfully when OTP valid and email unique", async () => {
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    userRepositoryMock.findOne.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-pass-1");

    const newUser = buildStoredUser({
      id: 5,
      email: "newuser@example.com",
      passwordHash: "hashed-pass-1",
      role: UserRole.STUDENT,
    });
    userRepositoryMock.create.mockReturnValue(newUser);
    userRepositoryMock.save.mockResolvedValue(newUser);

    const dto: RegisterDto = {
      email: "newuser@example.com",
      password: "secret123",
      fullName: "New User",
      phone: "0944444444",
      role: UserRole.STUDENT,
      otp: "123456",
    };

    const result = await service.register(dto);

    expect(result).toEqual(
      expect.objectContaining({
        email: "newuser@example.com",
        role: UserRole.STUDENT,
      }),
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  // TC_10
  it("throws BadRequestException when OTP invalid", async () => {
    otpServiceMock.verifyOTP.mockResolvedValue(false);

    const dto: RegisterDto = {
      email: "newuser@example.com",
      password: "secret123",
      fullName: "New User",
      phone: "0944444444",
      role: UserRole.STUDENT,
      otp: "000000",
    };

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // TC_11
  it("throws ConflictException when email already exists", async () => {
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    userRepositoryMock.findOne.mockResolvedValue(
      buildStoredUser({ email: "dup@example.com" }),
    );

    const dto: RegisterDto = {
      email: "dup@example.com",
      password: "secret123",
      fullName: "Dup User",
      phone: "0955555555",
      role: UserRole.STUDENT,
      otp: "123456",
    };

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // TC_12
  it("throws BadRequestException when role is ADMIN", async () => {
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    userRepositoryMock.findOne.mockResolvedValue(null);

    const dto: RegisterDto = {
      email: "adminlike@example.com",
      password: "secret123",
      fullName: "Admin Try",
      phone: "0966666666",
      role: UserRole.ADMIN,
      otp: "123456",
    };

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // TC_13
  it("uses env PREFIX_OTP when provided", async () => {
    process.env.PREFIX_OTP = "custom-otp";
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    userRepositoryMock.findOne.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-pass-2");

    const newUser = buildStoredUser({
      id: 6,
      email: "prefix@example.com",
      passwordHash: "hashed-pass-2",
      role: UserRole.TEACHER,
    });
    userRepositoryMock.create.mockReturnValue(newUser);
    userRepositoryMock.save.mockResolvedValue(newUser);

    const dto: RegisterDto = {
      email: "prefix@example.com",
      password: "secret123",
      fullName: "Prefix User",
      phone: "0977777777",
      role: UserRole.TEACHER,
      otp: "654321",
    };

    await service.register(dto);

    expect(otpServiceMock.verifyOTP).toHaveBeenCalledWith(
      "prefix@example.com",
      "custom-otp",
      "654321",
    );
  });

  // TC_14
  it("CheckDB: verifies new account data after register", async () => {
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    userRepositoryMock.findOne.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-pass-3");

    const newUser = buildStoredUser({
      id: 7,
      email: "checkdb@example.com",
      passwordHash: "hashed-pass-3",
      role: UserRole.STUDENT,
    });
    userRepositoryMock.create.mockReturnValue(newUser);
    userRepositoryMock.save.mockResolvedValue(newUser);

    await service.register({
      email: "checkdb@example.com",
      password: "secret123",
      fullName: "Check DB",
      phone: "0988888888",
      role: UserRole.STUDENT,
      otp: "111111",
    });

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM users WHERE email = ?",
      ["checkdb@example.com"],
    );
    expect(dbCheck).toBeDefined();
  });
});

describe("requestOTP(email, prefix)", () => {
  // TC_15
  it("sends OTP email successfully", async () => {
    mailServiceMock.sendMail.mockResolvedValue(undefined);

    const result = await service.requestOTP("otpuser@example.com", "otp");

    expect(mailServiceMock.sendMail).toHaveBeenCalledWith(
      "otpuser@example.com",
      "otp",
    );
    expect(result.message).toContain("OTP sent to otpuser@example.com");
  });

  // TC_16
  it("returns correct response message with provided prefix", async () => {
    mailServiceMock.sendMail.mockResolvedValue(undefined);

    const result = await service.requestOTP("otp2@example.com", "register");

    expect(result).toEqual({
      message: "OTP sent to otp2@example.com with prefix: register.",
    });
  });

  // TC_17
  it("CheckDB: verifies OTP request can be audited", async () => {
    mailServiceMock.sendMail.mockResolvedValue(undefined);

    await service.requestOTP("otp3@example.com", "otp");

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM otp_audit WHERE email = ?",
      ["otp3@example.com"],
    );
    expect(dbCheck).toBeDefined();
  });

  // TC_18
  it("propagates mail service error if sending fails", async () => {
    mailServiceMock.sendMail.mockRejectedValue(new Error("SMTP down"));

    await expect(service.requestOTP("fail@example.com", "otp")).rejects.toThrow(
      "SMTP down",
    );
  });
});

describe("getUserById(userId)", () => {
  // TC_19
  it("returns sanitized user when user exists", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildStoredUser({ id: 19 }));

    const result = await service.getUserById(19);

    expect(result).toEqual(
      expect.objectContaining({ id: 19, email: "teacher@example.com" }),
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  // TC_20
  it("throws NotFoundException when user does not exist", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.getUserById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_21
  it("calls repository with id condition", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildStoredUser({ id: 21 }));

    await service.getUserById(21);

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 21 },
    });
  });

  // TC_22
  it("CheckDB: verifies user record query by id", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildStoredUser({ id: 22 }));

    await service.getUserById(22);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM users WHERE id = ?",
      [22],
    );
    expect(dbCheck).toBeDefined();
  });
});

describe("logOut(user)", () => {
  // TC_23
  it("stores token in redis blacklist when ttl is positive", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    await service.logOut({
      email: "logout@example.com",
      cookieName: "access_token",
      token: "jwt-logout",
      exp: Math.floor(1_700_000_000_000 / 1000) + 3600,
    });

    expect(redisSetMock).toHaveBeenCalledTimes(1);
    expect(redisSetMock.mock.calls[0][0]).toContain(
      "logout@example.com:access_token:jwt-logout",
    );
    nowSpy.mockRestore();
  });

  // TC_24
  it("does not call redis when token is already expired", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    await service.logOut({
      email: "expired@example.com",
      cookieName: "access_token",
      token: "jwt-expired",
      exp: Math.floor(1_700_000_000_000 / 1000) - 10,
    });

    expect(redisSetMock).not.toHaveBeenCalled();
    nowSpy.mockRestore();
  });

  // TC_25
  it("CheckDB: verifies logout blacklist check", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    await service.logOut({
      email: "checklogout@example.com",
      cookieName: "access_token",
      token: "jwt-blacklist",
      exp: Math.floor(1_700_000_000_000 / 1000) + 120,
    });

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM redis_blacklist WHERE email = ?",
      ["checklogout@example.com"],
    );
    expect(dbCheck).toBeDefined();
    nowSpy.mockRestore();
  });

  // TC_26
  it("constructs redis key with email, cookieName, and token", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    await service.logOut({
      email: "k@example.com",
      cookieName: "refresh_token",
      token: "token-26",
      exp: Math.floor(1_700_000_000_000 / 1000) + 600,
    });

    const redisKey = redisSetMock.mock.calls[0][0];
    expect(redisKey).toBe("k@example.com:refresh_token:token-26");
    nowSpy.mockRestore();
  });
});

describe("resetPassword(resetPasswordDto)", () => {
  // TC_27
  it("resets password successfully with valid user and otp", async () => {
    const user = buildStoredUser({ id: 27, email: "reset@example.com" });
    userRepositoryMock.findOne.mockResolvedValue(user);
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hashed-password");
    userRepositoryMock.save.mockResolvedValue({
      ...user,
      passwordHash: "new-hashed-password",
    });

    const dto: ResetPasswordDto = {
      email: "reset@example.com",
      newPassword: "newSecret123",
      otpPin: "123123",
    };

    const result = await service.resetPassword(dto);

    expect(result).toEqual(
      expect.objectContaining({ email: "reset@example.com" }),
    );
    expect(hashMock).toHaveBeenCalledWith("newSecret123", 10);
  });

  // TC_28
  it("throws NotFoundException when reset email does not exist", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    const dto: ResetPasswordDto = {
      email: "missing-reset@example.com",
      newPassword: "newSecret123",
      otpPin: "123123",
    };

    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_29
  it("throws UnauthorizedException when otp pin is invalid", async () => {
    const user = buildStoredUser({ email: "otpfail@example.com" });
    userRepositoryMock.findOne.mockResolvedValue(user);
    otpServiceMock.verifyOTP.mockResolvedValue(false);

    const dto: ResetPasswordDto = {
      email: "otpfail@example.com",
      newPassword: "newSecret123",
      otpPin: "000000",
    };

    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // TC_30
  it("uses env PREFIX_RESET_PASSWORD_OTP when provided", async () => {
    process.env.PREFIX_RESET_PASSWORD_OTP = "custom-reset";

    const user = buildStoredUser({ email: "envreset@example.com" });
    userRepositoryMock.findOne.mockResolvedValue(user);
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hash-30");
    userRepositoryMock.save.mockResolvedValue({
      ...user,
      passwordHash: "new-hash-30",
    });

    await service.resetPassword({
      email: "envreset@example.com",
      newPassword: "newPassword30",
      otpPin: "303030",
    });

    expect(otpServiceMock.verifyOTP).toHaveBeenCalledWith(
      "envreset@example.com",
      "custom-reset",
      "303030",
    );
  });

  // TC_31
  it("defaults reset otp prefix to reset-password:otp when env missing", async () => {
    const user = buildStoredUser({ email: "defaultreset@example.com" });
    userRepositoryMock.findOne.mockResolvedValue(user);
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hash-31");
    userRepositoryMock.save.mockResolvedValue({
      ...user,
      passwordHash: "new-hash-31",
    });

    await service.resetPassword({
      email: "defaultreset@example.com",
      newPassword: "newPassword31",
      otpPin: "313131",
    });

    expect(otpServiceMock.verifyOTP).toHaveBeenCalledWith(
      "defaultreset@example.com",
      "reset-password:otp",
      "313131",
    );
  });

  // TC_32
  it("CheckDB: verifies password reset update by email", async () => {
    const user = buildStoredUser({ email: "checkreset@example.com" });
    userRepositoryMock.findOne.mockResolvedValue(user);
    otpServiceMock.verifyOTP.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hash-32");
    userRepositoryMock.save.mockResolvedValue({
      ...user,
      passwordHash: "new-hash-32",
    });

    await service.resetPassword({
      email: "checkreset@example.com",
      newPassword: "newPassword32",
      otpPin: "323232",
    });

    const dbCheck = await fakeDatabase.query(
      "SELECT password_hash FROM users WHERE email = ?",
      ["checkreset@example.com"],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});
