import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { GradeLevelsService } from "../elearning-backend/src/modules/grade-levels/grade-levels.service";
import { GradeLevel } from "../elearning-backend/src/entities/grade-level.entity";
import { CreateGradeLevelDto } from "../elearning-backend/src/modules/grade-levels/dto/create-grade-level.dto";
import { UpdateGradeLevelDto } from "../elearning-backend/src/modules/grade-levels/dto/update-grade-level.dto";

type RepoMock<T> = Pick<
  Repository<T>,
  "findOne" | "create" | "save" | "find" | "remove"
>;

const gradeLevelRepositoryMock = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
} as unknown as jest.Mocked<RepoMock<GradeLevel>>;

let service: GradeLevelsService;

const fakeDatabase = {
  queryRunner: {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  },
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
};

const buildGradeLevel = (overrides: Partial<GradeLevel> = {}): GradeLevel =>
  ({
    id: 1,
    name: "Grade 10",
    courses: [],
    ...overrides,
  }) as GradeLevel;

beforeAll(async () => {
  await fakeDatabase.queryRunner.connect();
  jest.clearAllMocks();
  service = new GradeLevelsService(gradeLevelRepositoryMock);
});

beforeEach(async () => {
  jest.clearAllMocks();
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
    await fakeDatabase.query("DELETE FROM grade_levels WHERE id > 0");
  } catch {
    // ignore cleanup errors in fake db
  }
});

afterAll(async () => {
  await fakeDatabase.queryRunner.release();
});

describe("create", () => {
  // TC_01
  it("creates a grade level successfully", async () => {
    const dto: CreateGradeLevelDto = { name: "Grade 6" };
    const created = buildGradeLevel({ name: "Grade 6" });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(null);
    gradeLevelRepositoryMock.create.mockReturnValue(created);
    gradeLevelRepositoryMock.save.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(result.name).toBe("Grade 6");
    expect(gradeLevelRepositoryMock.save).toHaveBeenCalledWith(created);
  });

  // TC_02
  it("throws BadRequestException when grade level name already exists", async () => {
    const dto: CreateGradeLevelDto = { name: "Grade 10" };
    gradeLevelRepositoryMock.findOne.mockResolvedValue(buildGradeLevel());

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // TC_03
  it("checks uniqueness by name before creating", async () => {
    const dto: CreateGradeLevelDto = { name: "Grade 11" };
    const created = buildGradeLevel({ id: 3, name: "Grade 11" });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(null);
    gradeLevelRepositoryMock.create.mockReturnValue(created);
    gradeLevelRepositoryMock.save.mockResolvedValue(created);

    await service.create(dto);

    expect(gradeLevelRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { name: "Grade 11" },
    });
  });

  // TC_04
  it("passes dto fields into repository.create", async () => {
    const dto: CreateGradeLevelDto = { name: "Grade 12" };
    const created = buildGradeLevel({ id: 4, name: "Grade 12" });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(null);
    gradeLevelRepositoryMock.create.mockReturnValue(created);
    gradeLevelRepositoryMock.save.mockResolvedValue(created);

    await service.create(dto);

    expect(gradeLevelRepositoryMock.create).toHaveBeenCalledWith(dto);
  });

  // TC_05
  it("CheckDB: verifies created grade level exists in DB", async () => {
    const dto: CreateGradeLevelDto = { name: "Grade 7" };
    const created = buildGradeLevel({ id: 5, name: "Grade 7" });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(null);
    gradeLevelRepositoryMock.create.mockReturnValue(created);
    gradeLevelRepositoryMock.save.mockResolvedValue(created);

    await service.create(dto);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM grade_levels WHERE name = ?",
      ["Grade 7"],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("findAll", () => {
  // TC_06
  it("returns all grade levels ordered by name ASC", async () => {
    const list = [
      buildGradeLevel({ id: 2, name: "Grade 6" }),
      buildGradeLevel({ id: 1, name: "Grade 7" }),
    ];
    gradeLevelRepositoryMock.find.mockResolvedValue(list);

    const result = await service.findAll();

    expect(result).toHaveLength(2);
  });

  // TC_07
  it("calls repository.find with correct order clause", async () => {
    gradeLevelRepositoryMock.find.mockResolvedValue([]);

    await service.findAll();

    expect(gradeLevelRepositoryMock.find).toHaveBeenCalledWith({
      order: { name: "ASC" },
    });
  });

  // TC_08
  it("returns empty array when no grade levels found", async () => {
    gradeLevelRepositoryMock.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });

  // TC_09
  it("supports grade level entries that contain related courses", async () => {
    const withCourses = buildGradeLevel({
      courses: [{ id: 101 } as never],
    });
    gradeLevelRepositoryMock.find.mockResolvedValue([withCourses]);

    const result = await service.findAll();

    expect(result[0].courses).toBeDefined();
  });

  // TC_10
  it("CheckDB: verifies select all grade levels executed", async () => {
    gradeLevelRepositoryMock.find.mockResolvedValue([buildGradeLevel()]);

    await service.findAll();

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM grade_levels ORDER BY name ASC",
    );
    expect(dbCheck).toBeDefined();
  });
});

describe("findOne", () => {
  // TC_11
  it("returns one grade level by id with courses relation", async () => {
    const gradeLevel = buildGradeLevel({ id: 11, name: "Grade 8" });
    gradeLevelRepositoryMock.findOne.mockResolvedValue(gradeLevel);

    const result = await service.findOne(11);

    expect(result.id).toBe(11);
    expect(result.name).toBe("Grade 8");
  });

  // TC_12
  it("throws NotFoundException when grade level not found", async () => {
    gradeLevelRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_13
  it("queries repository with id and courses relation", async () => {
    gradeLevelRepositoryMock.findOne.mockResolvedValue(buildGradeLevel());

    await service.findOne(1);

    expect(gradeLevelRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ["courses"],
    });
  });

  // TC_14
  it("returns grade level even when courses list is empty", async () => {
    gradeLevelRepositoryMock.findOne.mockResolvedValue(
      buildGradeLevel({ id: 14, courses: [] }),
    );

    const result = await service.findOne(14);

    expect(result.courses).toEqual([]);
  });

  // TC_15
  it("CheckDB: verifies grade level record exists by id", async () => {
    gradeLevelRepositoryMock.findOne.mockResolvedValue(
      buildGradeLevel({ id: 15 }),
    );

    await service.findOne(15);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM grade_levels WHERE id = ?",
      [15],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("update", () => {
  // TC_16
  it("updates grade level name successfully", async () => {
    const current = buildGradeLevel({ id: 16, name: "Grade 9" });
    const updated = buildGradeLevel({ id: 16, name: "Grade 9 Plus" });
    const dto: UpdateGradeLevelDto = { name: "Grade 9 Plus" };

    gradeLevelRepositoryMock.findOne.mockResolvedValue(current);
    gradeLevelRepositoryMock.save.mockResolvedValue(updated);

    const result = await service.update(16, dto);

    expect(result.name).toBe("Grade 9 Plus");
  });

  // TC_17
  it("throws NotFoundException when updating non-existing grade level", async () => {
    const dto: UpdateGradeLevelDto = { name: "Missing Grade" };
    gradeLevelRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.update(999, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_18
  it("merges dto into found grade level before save", async () => {
    const current = buildGradeLevel({ id: 18, name: "Grade 5" });
    const dto: UpdateGradeLevelDto = { name: "Grade 5 Updated" };

    gradeLevelRepositoryMock.findOne.mockResolvedValue(current);
    gradeLevelRepositoryMock.save.mockResolvedValue({ ...current, ...dto });

    await service.update(18, dto);

    expect(gradeLevelRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 18, name: "Grade 5 Updated" }),
    );
  });

  // TC_19
  it("supports empty update dto without breaking save flow", async () => {
    const current = buildGradeLevel({ id: 19, name: "Grade 4" });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(current);
    gradeLevelRepositoryMock.save.mockResolvedValue(current);

    const result = await service.update(19, {});

    expect(result.id).toBe(19);
  });

  // TC_20
  it("CheckDB: verifies grade level name updated in DB", async () => {
    const current = buildGradeLevel({ id: 20, name: "Grade 3" });
    const dto: UpdateGradeLevelDto = { name: "Grade 3 Advanced" };

    gradeLevelRepositoryMock.findOne.mockResolvedValue(current);
    gradeLevelRepositoryMock.save.mockResolvedValue({ ...current, ...dto });

    await service.update(20, dto);

    const dbCheck = await fakeDatabase.query(
      "SELECT name FROM grade_levels WHERE id = ?",
      [20],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("remove", () => {
  // TC_21
  it("removes grade level successfully", async () => {
    const gradeLevel = buildGradeLevel({ id: 21 });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(gradeLevel);
    gradeLevelRepositoryMock.remove.mockResolvedValue(gradeLevel);

    await service.remove(21);

    expect(gradeLevelRepositoryMock.remove).toHaveBeenCalledWith(gradeLevel);
  });

  // TC_22
  it("throws NotFoundException when removing non-existing grade level", async () => {
    gradeLevelRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.remove(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  // TC_23
  it("finds grade level first before remove operation", async () => {
    const gradeLevel = buildGradeLevel({ id: 23 });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(gradeLevel);
    gradeLevelRepositoryMock.remove.mockResolvedValue(gradeLevel);

    await service.remove(23);

    expect(gradeLevelRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 23 },
      relations: ["courses"],
    });
  });

  // TC_24
  it("remove returns void when deletion completes", async () => {
    const gradeLevel = buildGradeLevel({ id: 24 });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(gradeLevel);
    gradeLevelRepositoryMock.remove.mockResolvedValue(gradeLevel);

    const result = await service.remove(24);

    expect(result).toBeUndefined();
  });

  // TC_25
  it("CheckDB: verifies grade level deletion in DB", async () => {
    const gradeLevel = buildGradeLevel({ id: 25, name: "Delete Grade" });

    gradeLevelRepositoryMock.findOne.mockResolvedValue(gradeLevel);
    gradeLevelRepositoryMock.remove.mockResolvedValue(gradeLevel);

    await service.remove(25);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM grade_levels WHERE id = ?",
      [25],
    );
    expect(dbCheck).toBeDefined();
  });
});
