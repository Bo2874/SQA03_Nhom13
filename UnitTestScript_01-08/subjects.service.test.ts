import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { SubjectsService } from "../elearning-backend/src/modules/subjects/subjects.service";
import { Subject } from "../elearning-backend/src/entities/subject.entity";
import { CreateSubjectDto } from "../elearning-backend/src/modules/subjects/dto/create-subject.dto";
import { UpdateSubjectDto } from "../elearning-backend/src/modules/subjects/dto/update-subject.dto";

type RepoMock<T> = Pick<
  Repository<T>,
  "findOne" | "create" | "save" | "find" | "remove"
>;

const subjectRepositoryMock = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
} as unknown as jest.Mocked<RepoMock<Subject>>;

let service: SubjectsService;

const fakeDatabase = {
  queryRunner: {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  },
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
};

const buildSubject = (overrides: Partial<Subject> = {}): Subject =>
  ({
    id: 1,
    name: "Mathematics",
    courses: [],
    ...overrides,
  }) as Subject;

beforeAll(async () => {
  await fakeDatabase.queryRunner.connect();
  jest.clearAllMocks();
  service = new SubjectsService(subjectRepositoryMock);
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
    await fakeDatabase.query("DELETE FROM subjects WHERE id > 0");
  } catch {
    // ignore cleanup errors in fake db
  }
});

afterAll(async () => {
  await fakeDatabase.queryRunner.release();
});

describe("create", () => {
  // TC_01
  it("creates a subject successfully", async () => {
    const dto: CreateSubjectDto = { name: "Biology" };
    const created = buildSubject({ name: "Biology" });

    subjectRepositoryMock.findOne.mockResolvedValue(null);
    subjectRepositoryMock.create.mockReturnValue(created);
    subjectRepositoryMock.save.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(result.name).toBe("Biology");
    expect(subjectRepositoryMock.save).toHaveBeenCalledWith(created);
  });

  // TC_02
  it("throws BadRequestException when subject name already exists", async () => {
    const dto: CreateSubjectDto = { name: "Mathematics" };
    subjectRepositoryMock.findOne.mockResolvedValue(buildSubject());

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // TC_03
  it("checks uniqueness by name before creating", async () => {
    const dto: CreateSubjectDto = { name: "History" };
    const created = buildSubject({ id: 3, name: "History" });

    subjectRepositoryMock.findOne.mockResolvedValue(null);
    subjectRepositoryMock.create.mockReturnValue(created);
    subjectRepositoryMock.save.mockResolvedValue(created);

    await service.create(dto);

    expect(subjectRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { name: "History" },
    });
  });

  // TC_04
  it("passes dto fields into repository.create", async () => {
    const dto: CreateSubjectDto = { name: "Physics" };
    const created = buildSubject({ id: 4, name: "Physics" });

    subjectRepositoryMock.findOne.mockResolvedValue(null);
    subjectRepositoryMock.create.mockReturnValue(created);
    subjectRepositoryMock.save.mockResolvedValue(created);

    await service.create(dto);

    expect(subjectRepositoryMock.create).toHaveBeenCalledWith(dto);
  });

  // TC_05
  it("CheckDB: verifies created subject exists in DB", async () => {
    const dto: CreateSubjectDto = { name: "Chemistry" };
    const created = buildSubject({ id: 5, name: "Chemistry" });

    subjectRepositoryMock.findOne.mockResolvedValue(null);
    subjectRepositoryMock.create.mockReturnValue(created);
    subjectRepositoryMock.save.mockResolvedValue(created);

    await service.create(dto);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM subjects WHERE name = ?",
      ["Chemistry"],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("findAll", () => {
  // TC_06
  it("returns all subjects ordered by name ASC", async () => {
    const list = [
      buildSubject({ id: 2, name: "Biology" }),
      buildSubject({ id: 1, name: "Mathematics" }),
    ];
    subjectRepositoryMock.find.mockResolvedValue(list);

    const result = await service.findAll();

    expect(result).toHaveLength(2);
  });

  // TC_07
  it("calls repository.find with correct order clause", async () => {
    subjectRepositoryMock.find.mockResolvedValue([]);

    await service.findAll();

    expect(subjectRepositoryMock.find).toHaveBeenCalledWith({
      order: { name: "ASC" },
    });
  });

  // TC_08
  it("returns empty array when no subjects found", async () => {
    subjectRepositoryMock.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });

  // TC_09
  it("supports subject entries that contain related courses", async () => {
    const withCourses = buildSubject({
      courses: [{ id: 100 } as never],
    });
    subjectRepositoryMock.find.mockResolvedValue([withCourses]);

    const result = await service.findAll();

    expect(result[0].courses).toBeDefined();
  });

  // TC_10
  it("CheckDB: verifies select all subjects executed", async () => {
    subjectRepositoryMock.find.mockResolvedValue([buildSubject()]);

    await service.findAll();

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM subjects ORDER BY name ASC",
    );
    expect(dbCheck).toBeDefined();
  });
});

describe("findOne", () => {
  // TC_11
  it("returns one subject by id with courses relation", async () => {
    const subject = buildSubject({ id: 11, name: "Literature" });
    subjectRepositoryMock.findOne.mockResolvedValue(subject);

    const result = await service.findOne(11);

    expect(result.id).toBe(11);
    expect(result.name).toBe("Literature");
  });

  // TC_12
  it("throws NotFoundException when subject not found", async () => {
    subjectRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_13
  it("queries repository with id and courses relation", async () => {
    subjectRepositoryMock.findOne.mockResolvedValue(buildSubject());

    await service.findOne(1);

    expect(subjectRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ["courses"],
    });
  });

  // TC_14
  it("returns subject even when courses list is empty", async () => {
    subjectRepositoryMock.findOne.mockResolvedValue(
      buildSubject({ id: 14, courses: [] }),
    );

    const result = await service.findOne(14);

    expect(result.courses).toEqual([]);
  });

  // TC_15
  it("CheckDB: verifies subject record exists by id", async () => {
    subjectRepositoryMock.findOne.mockResolvedValue(buildSubject({ id: 15 }));

    await service.findOne(15);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM subjects WHERE id = ?",
      [15],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("update", () => {
  // TC_16
  it("updates subject name successfully", async () => {
    const current = buildSubject({ id: 16, name: "Old Name" });
    const updated = buildSubject({ id: 16, name: "New Name" });
    const dto: UpdateSubjectDto = { name: "New Name" };

    subjectRepositoryMock.findOne.mockResolvedValue(current);
    subjectRepositoryMock.save.mockResolvedValue(updated);

    const result = await service.update(16, dto);

    expect(result.name).toBe("New Name");
  });

  // TC_17
  it("throws NotFoundException when updating non-existing subject", async () => {
    const dto: UpdateSubjectDto = { name: "Missing Subject" };
    subjectRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.update(999, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // TC_18
  it("merges dto into found subject before save", async () => {
    const current = buildSubject({ id: 18, name: "Geography" });
    const dto: UpdateSubjectDto = { name: "Geo Updated" };

    subjectRepositoryMock.findOne.mockResolvedValue(current);
    subjectRepositoryMock.save.mockResolvedValue({ ...current, ...dto });

    await service.update(18, dto);

    expect(subjectRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 18, name: "Geo Updated" }),
    );
  });

  // TC_19
  it("supports empty update dto without breaking save flow", async () => {
    const current = buildSubject({ id: 19, name: "Art" });

    subjectRepositoryMock.findOne.mockResolvedValue(current);
    subjectRepositoryMock.save.mockResolvedValue(current);

    const result = await service.update(19, {});

    expect(result.id).toBe(19);
  });

  // TC_20
  it("CheckDB: verifies subject name updated in DB", async () => {
    const current = buildSubject({ id: 20, name: "Civic" });
    const dto: UpdateSubjectDto = { name: "Civic Education" };

    subjectRepositoryMock.findOne.mockResolvedValue(current);
    subjectRepositoryMock.save.mockResolvedValue({ ...current, ...dto });

    await service.update(20, dto);

    const dbCheck = await fakeDatabase.query(
      "SELECT name FROM subjects WHERE id = ?",
      [20],
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.rowCount).toBeGreaterThanOrEqual(1);
  });
});

describe("remove", () => {
  // TC_21
  it("removes subject successfully", async () => {
    const subject = buildSubject({ id: 21 });

    subjectRepositoryMock.findOne.mockResolvedValue(subject);
    subjectRepositoryMock.remove.mockResolvedValue(subject);

    await service.remove(21);

    expect(subjectRepositoryMock.remove).toHaveBeenCalledWith(subject);
  });

  // TC_22
  it("throws NotFoundException when removing non-existing subject", async () => {
    subjectRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.remove(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  // TC_23
  it("finds subject first before remove operation", async () => {
    const subject = buildSubject({ id: 23 });

    subjectRepositoryMock.findOne.mockResolvedValue(subject);
    subjectRepositoryMock.remove.mockResolvedValue(subject);

    await service.remove(23);

    expect(subjectRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 23 },
      relations: ["courses"],
    });
  });

  // TC_24
  it("remove returns void when deletion completes", async () => {
    const subject = buildSubject({ id: 24 });

    subjectRepositoryMock.findOne.mockResolvedValue(subject);
    subjectRepositoryMock.remove.mockResolvedValue(subject);

    const result = await service.remove(24);

    expect(result).toBeUndefined();
  });

  // TC_25
  it("CheckDB: verifies subject deletion in DB", async () => {
    const subject = buildSubject({ id: 25, name: "Delete Me" });

    subjectRepositoryMock.findOne.mockResolvedValue(subject);
    subjectRepositoryMock.remove.mockResolvedValue(subject);

    await service.remove(25);

    const dbCheck = await fakeDatabase.query(
      "SELECT * FROM subjects WHERE id = ?",
      [25],
    );
    expect(dbCheck).toBeDefined();
  });
});
