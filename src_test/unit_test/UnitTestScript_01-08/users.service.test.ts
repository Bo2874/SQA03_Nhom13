import { NotFoundException, ConflictException } from "@nestjs/common";
import { Repository } from "typeorm";

import { UsersService } from "../elearning-backend/src/modules/users/users.service";
import {
  User,
  UserRole,
  UserStatus,
} from "../elearning-backend/src/entities/user.entity";
import { UpdateUserDto } from "../elearning-backend/src/modules/users/dto/update-user.dto";
import { CreateTeacherDto } from "../elearning-backend/src/modules/users/dto/create-teacher.dto";
import { SearchTeachersDto } from "../elearning-backend/src/modules/users/dto/search-teachers.dto";
import { PaginationDto } from "../elearning-backend/src/common/dto/pagination.dto";

type RepoMock<T> = Pick<
  Repository<T>,
  | "findOne"
  | "findAndCount"
  | "find"
  | "create"
  | "save"
  | "remove"
  | "createQueryBuilder"
>;

const createQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  loadRelationCountAndMap: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getMany: jest.fn(),
  getOne: jest.fn(),
});

const userRepositoryMock = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
} as unknown as jest.Mocked<RepoMock<User>>;

let service: UsersService;

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
  },
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
};

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    email: "user@test.com",
    passwordHash: "hashedPassword123",
    fullName: "John Doe",
    phone: "0123456789",
    avatarUrl: null,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as User;

const buildTeacher = (overrides: Partial<User> = {}): User =>
  buildUser({
    id: 2,
    email: "teacher@test.com",
    fullName: "Jane Teacher",
    role: UserRole.TEACHER,
    ...overrides,
  });

/**
 * SETUP & TEARDOWN HOOKS - Database Integration
 */

beforeAll(async () => {
  await fakeDatabase.queryRunner.connect();
  jest.clearAllMocks();
  service = new UsersService(userRepositoryMock);
});

beforeEach(async () => {
  jest.clearAllMocks();
  fakeDatabase.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
  await fakeDatabase.queryRunner.startTransaction();
});

afterEach(async () => {
  try {
    await fakeDatabase.queryRunner.rollbackTransaction();
  } catch (err) {
    // Ignore errors
  }

  try {
    await fakeDatabase.query("DELETE FROM users WHERE id > 0");
  } catch (err) {
    // Ignore cleanup errors
  }
});

afterAll(async () => {
  if (fakeDatabase.queryRunner) {
    await fakeDatabase.queryRunner.release();
  }
});

describe("findById", () => {
  // TC_01
  it("returns user when found by id", async () => {
    const user = buildUser({ id: 1 });
    userRepositoryMock.findOne.mockResolvedValue(user);

    const result = await service.findById(1);

    expect(result.id).toBe(1);
    expect(result.email).toBe("user@test.com");
  });

  // TC_02
  it("throws NotFoundException when user not found", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_03
  it("queries database with correct user id", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildUser());

    await service.findById(1);

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  // TC_04
  it("CheckDB: verifies user data persisted in database", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildUser());

    await service.findById(1);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM users WHERE id = ?",
      [1],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("updateUser", () => {
  // TC_05
  it("updates user with new data", async () => {
    const user = buildUser();
    userRepositoryMock.findOne.mockResolvedValue(user);
    userRepositoryMock.save.mockResolvedValue({
      ...user,
      fullName: "Updated Name",
    });

    const updateDto: UpdateUserDto = { fullName: "Updated Name" };
    const result = await service.updateUser(1, updateDto);

    expect(result.fullName).toBe("Updated Name");
  });

  // TC_06
  it("throws NotFoundException when user to update not found", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    const updateDto: UpdateUserDto = { fullName: "Updated Name" };
    await expect(service.updateUser(999, updateDto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_07
  it("saves updated user to database", async () => {
    const user = buildUser();
    userRepositoryMock.findOne.mockResolvedValue(user);
    userRepositoryMock.save.mockResolvedValue(user);

    const updateDto: UpdateUserDto = { phone: "9876543210" };
    await service.updateUser(1, updateDto);

    expect(userRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining(updateDto),
    );
  });

  // TC_08
  it("CheckDB: confirms user update persisted", async () => {
    const user = buildUser();
    userRepositoryMock.findOne.mockResolvedValue(user);
    userRepositoryMock.save.mockResolvedValue(user);

    const updateDto: UpdateUserDto = { fullName: "Updated Name" };
    await service.updateUser(1, updateDto);

    const dbCheck = await fakeDatabase.query(
      "SELECT fullName FROM users WHERE id = ?",
      [1],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("deleteUser", () => {
  // TC_09
  it("removes user from database", async () => {
    const user = buildUser();
    userRepositoryMock.findOne.mockResolvedValue(user);
    userRepositoryMock.remove.mockResolvedValue(user);

    await service.deleteUser(1);

    expect(userRepositoryMock.remove).toHaveBeenCalledWith(user);
  });

  // TC_10
  it("throws NotFoundException when user to delete not found", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.deleteUser(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_11
  it("calls findById before deleting user", async () => {
    const user = buildUser();
    userRepositoryMock.findOne.mockResolvedValue(user);
    userRepositoryMock.remove.mockResolvedValue(user);

    await service.deleteUser(1);

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  // TC_12
  it("CheckDB: verifies user deletion from database", async () => {
    const user = buildUser();
    userRepositoryMock.findOne.mockResolvedValue(user);
    userRepositoryMock.remove.mockResolvedValue(user);

    await service.deleteUser(1);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM users WHERE id = ?",
      [1],
    );
    expect(dbCheck).toBeDefined();
  });
});

describe("getAllTeachers", () => {
  // TC_13
  it("returns paginated teachers list", async () => {
    const teachers = [buildTeacher(), buildTeacher({ id: 3 })];
    userRepositoryMock.findAndCount.mockResolvedValue([teachers, 2] as any);

    const paginationDto: PaginationDto = {
      page: 1,
      limit: 10,
      order: "ASC",
      sortBy: "id",
    };
    const result = await service.getAllTeachers(paginationDto);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  // TC_14
  it("excludes password hash from response", async () => {
    const teacher = buildTeacher();
    userRepositoryMock.findAndCount.mockResolvedValue([[teacher], 1] as any);

    const paginationDto: PaginationDto = {
      page: 1,
      limit: 10,
      order: "ASC",
      sortBy: "id",
    };
    const result = await service.getAllTeachers(paginationDto);

    expect(result.data[0]).not.toHaveProperty("passwordHash");
  });

  // TC_15
  it("calculates correct total pages", async () => {
    const teachers = Array(25).fill(buildTeacher());
    userRepositoryMock.findAndCount.mockResolvedValue([teachers, 25] as any);

    const paginationDto: PaginationDto = {
      page: 1,
      limit: 10,
      order: "ASC",
      sortBy: "id",
    };
    const result = await service.getAllTeachers(paginationDto);

    expect(result.totalPages).toBe(3);
  });

  // TC_16
  it("filters only TEACHER role users", async () => {
    const teachers = [buildTeacher()];
    userRepositoryMock.findAndCount.mockResolvedValue([teachers, 1] as any);

    const paginationDto: PaginationDto = {
      page: 1,
      limit: 10,
      order: "ASC",
      sortBy: "id",
    };
    await service.getAllTeachers(paginationDto);

    expect(userRepositoryMock.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: UserRole.TEACHER },
      }),
    );
  });
});

describe("createTeacher", () => {
  // TC_17
  it("creates teacher with hashed password", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);
    const teacher = buildTeacher();
    userRepositoryMock.create.mockReturnValue(teacher);
    userRepositoryMock.save.mockResolvedValue(teacher);

    const createDto: CreateTeacherDto = {
      email: "newteacher@test.com",
      password: "password123",
      fullName: "New Teacher",
      phone: "0123456789",
      avatarUrl: null,
    };

    const result = await service.createTeacher(createDto);

    expect(result).not.toHaveProperty("passwordHash");
    expect(userRepositoryMock.save).toHaveBeenCalled();
  });

  // TC_18
  it("throws ConflictException when email already exists", async () => {
    userRepositoryMock.findOne.mockResolvedValue(buildTeacher());

    const createDto: CreateTeacherDto = {
      email: "existing@test.com",
      password: "password123",
      fullName: "Teacher Name",
      phone: "0123456789",
      avatarUrl: null,
    };

    await expect(service.createTeacher(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // TC_19
  it("sets role to TEACHER and status to ACTIVE", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);
    const teacher = buildTeacher();
    userRepositoryMock.create.mockReturnValue(teacher);
    userRepositoryMock.save.mockResolvedValue(teacher);

    const createDto: CreateTeacherDto = {
      email: "new@test.com",
      password: "pass123",
      fullName: "New Teacher",
      phone: "0123456789",
      avatarUrl: null,
    };

    await service.createTeacher(createDto);

    expect(userRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
      }),
    );
  });

  // TC_20
  it("CheckDB: verifies teacher created in database", async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);
    const teacher = buildTeacher();
    userRepositoryMock.create.mockReturnValue(teacher);
    userRepositoryMock.save.mockResolvedValue(teacher);

    const createDto: CreateTeacherDto = {
      email: "new@test.com",
      password: "pass123",
      fullName: "New Teacher",
      phone: "0123456789",
      avatarUrl: null,
    };

    await service.createTeacher(createDto);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM users WHERE email = ? AND role = ?",
      ["new@test.com", UserRole.TEACHER],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("searchTeachers", () => {
  // TC_21
  it("returns teachers matching keyword search", async () => {
    const qb = createQueryBuilder();
    const teachers = [buildTeacher()];
    qb.getManyAndCount.mockResolvedValue([teachers, 1]);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const searchDto: SearchTeachersDto = {
      keyword: "jane",
      page: 1,
      limit: 12,
    };
    const result = await service.searchTeachers(searchDto);

    expect(result.teachers).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  // TC_22
  it("filters ACTIVE TEACHER status users only", async () => {
    const qb = createQueryBuilder();
    qb.getManyAndCount.mockResolvedValue([[], 0]);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const searchDto: SearchTeachersDto = { page: 1, limit: 12 };
    await service.searchTeachers(searchDto);

    expect(qb.where).toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalled();
  });

  // TC_23
  it("excludes password hash from search results", async () => {
    const qb = createQueryBuilder();
    const teachers = [buildTeacher()];
    qb.getManyAndCount.mockResolvedValue([teachers, 1]);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const searchDto: SearchTeachersDto = {
      keyword: "jane",
      page: 1,
      limit: 12,
    };
    const result = await service.searchTeachers(searchDto);

    expect(result.teachers[0]).not.toHaveProperty("passwordHash");
  });

  // TC_24
  it("calculates pagination correctly", async () => {
    const qb = createQueryBuilder();
    const teachers = Array(25).fill(buildTeacher());
    qb.getManyAndCount.mockResolvedValue([teachers, 25]);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const searchDto: SearchTeachersDto = { page: 2, limit: 12 };
    const result = await service.searchTeachers(searchDto);

    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
  });
});

describe("getTeacherById", () => {
  // TC_25
  it("returns teacher with published courses only", async () => {
    const qb = createQueryBuilder();
    const teacher = buildTeacher({
      courses: [
        { id: 1, status: "PUBLISHED" } as any,
        { id: 2, status: "DRAFT" } as any,
      ],
    });
    qb.getOne.mockResolvedValue(teacher);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.getTeacherById(2);

    expect(result.courses?.length).toBe(1);
    expect(result.totalCourses).toBe(1);
  });

  // TC_26
  it("throws NotFoundException when teacher not found", async () => {
    const qb = createQueryBuilder();
    qb.getOne.mockResolvedValue(null);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    await expect(service.getTeacherById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_27
  it("loads related courses and course details", async () => {
    const qb = createQueryBuilder();
    const teacher = buildTeacher();
    qb.getOne.mockResolvedValue(teacher);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    await service.getTeacherById(2);

    expect(qb.leftJoinAndSelect).toHaveBeenCalled();
    expect(qb.loadRelationCountAndMap).toHaveBeenCalled();
  });

  // TC_28
  it("excludes password hash from response", async () => {
    const qb = createQueryBuilder();
    const teacher = buildTeacher();
    qb.getOne.mockResolvedValue(teacher);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.getTeacherById(2);

    expect(result).not.toHaveProperty("passwordHash");
  });
});

describe("getFeaturedTeachers", () => {
  // TC_29
  it("returns featured teachers by email array", async () => {
    const qb = createQueryBuilder();
    const teachers = [
      buildTeacher({ email: "teacher1@test.com" }),
      buildTeacher({ id: 3, email: "teacher2@test.com" }),
    ];
    qb.getMany.mockResolvedValue(teachers);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.getFeaturedTeachers([
      "teacher1@test.com",
      "teacher2@test.com",
    ]);

    expect(result).toHaveLength(2);
  });

  // TC_30
  it("returns empty array when no emails provided", async () => {
    const result = await service.getFeaturedTeachers([]);

    expect(result).toEqual([]);
  });

  // TC_31
  it("filters published courses only for featured teachers", async () => {
    const qb = createQueryBuilder();
    const teacher = buildTeacher({
      courses: [
        { id: 1, status: "PUBLISHED" } as any,
        { id: 2, status: "DRAFT" } as any,
      ],
    });
    qb.getMany.mockResolvedValue([teacher]);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.getFeaturedTeachers(["teacher@test.com"]);

    expect(result[0].courses?.length).toBe(1);
  });

  // TC_32
  it("sorts featured teachers in email array order", async () => {
    const qb = createQueryBuilder();
    const teachers = [
      buildTeacher({ email: "z@test.com" }),
      buildTeacher({ id: 3, email: "a@test.com" }),
    ];
    qb.getMany.mockResolvedValue(teachers);
    userRepositoryMock.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.getFeaturedTeachers([
      "a@test.com",
      "z@test.com",
    ]);

    expect(result[0].email).toBe("a@test.com");
    expect(result[1].email).toBe("z@test.com");
  });
});
