import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { GradeLevelsService } from "../../../../src_code/elearning-backend/src/modules/grade-levels/grade-levels.service";
import { GradeLevel } from "../../../../src_code/elearning-backend/src/entities/grade-level.entity";
import { CreateGradeLevelDto } from "../../../../src_code/elearning-backend/src/modules/grade-levels/dto/create-grade-level.dto";
import { UpdateGradeLevelDto } from "../../../../src_code/elearning-backend/src/modules/grade-levels/dto/update-grade-level.dto";

type GradeLevelRepositoryMock = Pick<
    Repository<GradeLevel>,
    "findOne" | "create" | "save" | "find" | "remove"
>;

const buildGradeLevel = (overrides: Partial<GradeLevel> = {}): GradeLevel =>
    ({
        id: 1,
        name: "Grade 10",
        courses: [],
        ...overrides,
    }) as GradeLevel;

describe("GradeLevelsService (STT8)", () => {
    let service: GradeLevelsService;
    let mockGradeLevelRepository: jest.Mocked<GradeLevelRepositoryMock>;

    beforeEach(() => {
        mockGradeLevelRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
        } as unknown as jest.Mocked<GradeLevelRepositoryMock>;

        service = new GradeLevelsService(
            mockGradeLevelRepository as unknown as Repository<GradeLevel>,
        );
    });

    // Rollback for unit tests: reset mock states after each test case.
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe("create()", () => {
        // TC_STT08_CREATE_01
        // Objective: Tao grade level thanh cong khi ten grade level chua ton tai.
        it("TC_STT08_CREATE_01 should create and return a new grade level", async () => {
            const createDto: CreateGradeLevelDto = { name: "Grade 6" };
            const createdEntity = buildGradeLevel({ id: 10, name: "Grade 6" });

            mockGradeLevelRepository.findOne.mockResolvedValue(null);
            mockGradeLevelRepository.create.mockReturnValue(createdEntity);
            mockGradeLevelRepository.save.mockResolvedValue(createdEntity);

            const result = await service.create(createDto);

            expect(result).toEqual(createdEntity);
            expect(mockGradeLevelRepository.create).toHaveBeenCalledWith(createDto);
            expect(mockGradeLevelRepository.save).toHaveBeenCalledWith(createdEntity);
        });

        // TC_STT08_CREATE_02
        // Objective: Nem BadRequestException khi grade level da ton tai.
        it("TC_STT08_CREATE_02 should throw BadRequestException for duplicate grade level name", async () => {
            const createDto: CreateGradeLevelDto = { name: "Grade 10" };

            mockGradeLevelRepository.findOne.mockResolvedValue(buildGradeLevel());

            await expect(service.create(createDto)).rejects.toBeInstanceOf(
                BadRequestException,
            );
            expect(mockGradeLevelRepository.create).not.toHaveBeenCalled();
            expect(mockGradeLevelRepository.save).not.toHaveBeenCalled();
        });

        // TC_STT08_CREATE_03
        // Objective: CheckDB - xac minh service check uniqueness dung where name.
        it("TC_STT08_CREATE_03 should check duplicate by where name before creating", async () => {
            const createDto: CreateGradeLevelDto = { name: "Grade 11" };
            const createdEntity = buildGradeLevel({ id: 11, name: "Grade 11" });

            mockGradeLevelRepository.findOne.mockResolvedValue(null);
            mockGradeLevelRepository.create.mockReturnValue(createdEntity);
            mockGradeLevelRepository.save.mockResolvedValue(createdEntity);

            await service.create(createDto);

            expect(mockGradeLevelRepository.findOne).toHaveBeenCalledWith({
                where: { name: "Grade 11" },
            });
        });
    });

    describe("findAll()", () => {
        // TC_STT08_FINDALL_01
        // Objective: Tra ve danh sach grade level khi repository co du lieu.
        it("TC_STT08_FINDALL_01 should return all grade levels", async () => {
            const gradeLevels = [
                buildGradeLevel({ id: 1, name: "Grade 6" }),
                buildGradeLevel({ id: 2, name: "Grade 7" }),
            ];
            mockGradeLevelRepository.find.mockResolvedValue(gradeLevels);

            const result = await service.findAll();

            expect(result).toEqual(gradeLevels);
            expect(result).toHaveLength(2);
        });

        // TC_STT08_FINDALL_02
        // Objective: CheckDB - xac minh repository.find duoc goi voi order name ASC.
        it("TC_STT08_FINDALL_02 should call repository.find with order name ASC", async () => {
            mockGradeLevelRepository.find.mockResolvedValue([]);

            await service.findAll();

            expect(mockGradeLevelRepository.find).toHaveBeenCalledWith({
                order: { name: "ASC" },
            });
        });

        // TC_STT08_FINDALL_03
        // Objective: Tra ve mang rong neu khong co grade level nao.
        it("TC_STT08_FINDALL_03 should return empty array when repository has no data", async () => {
            mockGradeLevelRepository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe("findOne()", () => {
        // TC_STT08_FINDONE_01
        // Objective: Tra ve grade level theo id va bao gom relation courses.
        it("TC_STT08_FINDONE_01 should return a grade level by id", async () => {
            const gradeLevel = buildGradeLevel({ id: 20, name: "Grade 8" });
            mockGradeLevelRepository.findOne.mockResolvedValue(gradeLevel);

            const result = await service.findOne(20);

            expect(result).toEqual(gradeLevel);
        });

        // TC_STT08_FINDONE_02
        // Objective: Nem NotFoundException neu id khong ton tai.
        it("TC_STT08_FINDONE_02 should throw NotFoundException when grade level is not found", async () => {
            mockGradeLevelRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(404)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        // TC_STT08_FINDONE_03
        // Objective: CheckDB - xac minh query where id va relations courses.
        it("TC_STT08_FINDONE_03 should call repository.findOne with id and courses relation", async () => {
            mockGradeLevelRepository.findOne.mockResolvedValue(buildGradeLevel({ id: 1 }));

            await service.findOne(1);

            expect(mockGradeLevelRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ["courses"],
            });
        });
    });

    describe("update()", () => {
        // TC_STT08_UPDATE_01
        // Objective: Cap nhat thanh cong va tra ve ban ghi sau cap nhat.
        it("TC_STT08_UPDATE_01 should update and return the grade level", async () => {
            const existingGradeLevel = buildGradeLevel({ id: 5, name: "Grade 9" });
            const updateDto: UpdateGradeLevelDto = { name: "Grade 9 Advanced" };
            const savedGradeLevel = buildGradeLevel({
                id: 5,
                name: "Grade 9 Advanced",
            });

            mockGradeLevelRepository.findOne.mockResolvedValue(existingGradeLevel);
            mockGradeLevelRepository.save.mockResolvedValue(savedGradeLevel);

            const result = await service.update(5, updateDto);

            expect(result).toEqual(savedGradeLevel);
            expect(mockGradeLevelRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ id: 5, name: "Grade 9 Advanced" }),
            );
        });

        // TC_STT08_UPDATE_02
        // Objective: Nem NotFoundException neu grade level can update khong ton tai.
        it("TC_STT08_UPDATE_02 should throw NotFoundException when updating non-existing grade level", async () => {
            const updateDto: UpdateGradeLevelDto = { name: "New Grade" };
            mockGradeLevelRepository.findOne.mockResolvedValue(null);

            await expect(service.update(999, updateDto)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockGradeLevelRepository.save).not.toHaveBeenCalled();
        });

        // TC_STT08_UPDATE_03
        // Objective: CheckDB - xac minh save goi dung du lieu da merge tu existing + dto.
        it("TC_STT08_UPDATE_03 should persist merged data through repository.save", async () => {
            const existingGradeLevel = buildGradeLevel({ id: 30, name: "Grade 10" });
            const updateDto: UpdateGradeLevelDto = { name: "Grade 10 Honors" };

            mockGradeLevelRepository.findOne.mockResolvedValue(existingGradeLevel);
            mockGradeLevelRepository.save.mockResolvedValue(
                buildGradeLevel({ id: 30, name: "Grade 10 Honors" }),
            );

            await service.update(30, updateDto);

            expect(mockGradeLevelRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 30,
                    name: "Grade 10 Honors",
                }),
            );
        });
    });

    describe("remove()", () => {
        // TC_STT08_REMOVE_01
        // Objective: Xoa thanh cong grade level ton tai.
        it("TC_STT08_REMOVE_01 should remove an existing grade level", async () => {
            const existingGradeLevel = buildGradeLevel({ id: 9, name: "Grade 12" });
            mockGradeLevelRepository.findOne.mockResolvedValue(existingGradeLevel);
            mockGradeLevelRepository.remove.mockResolvedValue(existingGradeLevel);

            await service.remove(9);

            expect(mockGradeLevelRepository.remove).toHaveBeenCalledWith(
                existingGradeLevel,
            );
        });

        // TC_STT08_REMOVE_02
        // Objective: Nem NotFoundException neu grade level can xoa khong ton tai.
        it("TC_STT08_REMOVE_02 should throw NotFoundException when removing non-existing grade level", async () => {
            mockGradeLevelRepository.findOne.mockResolvedValue(null);

            await expect(service.remove(1234)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockGradeLevelRepository.remove).not.toHaveBeenCalled();
        });

        // TC_STT08_REMOVE_03
        // Objective: CheckDB - xac minh remove duoc goi dung 1 lan voi entity tim thay.
        it("TC_STT08_REMOVE_03 should call repository.remove exactly once with found entity", async () => {
            const existingGradeLevel = buildGradeLevel({ id: 31, name: "Grade 5" });
            mockGradeLevelRepository.findOne.mockResolvedValue(existingGradeLevel);
            mockGradeLevelRepository.remove.mockResolvedValue(existingGradeLevel);

            await service.remove(31);

            expect(mockGradeLevelRepository.remove).toHaveBeenCalledTimes(1);
            expect(mockGradeLevelRepository.remove).toHaveBeenCalledWith(
                existingGradeLevel,
            );
        });
    });
});
