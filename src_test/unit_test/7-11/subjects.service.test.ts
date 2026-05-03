import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { SubjectsService } from "../../../../src_code/elearning-backend/src/modules/subjects/subjects.service";
import { Subject } from "../../../../src_code/elearning-backend/src/entities/subject.entity";
import { CreateSubjectDto } from "../../../../src_code/elearning-backend/src/modules/subjects/dto/create-subject.dto";
import { UpdateSubjectDto } from "../../../../src_code/elearning-backend/src/modules/subjects/dto/update-subject.dto";

type SubjectRepositoryMock = Pick<
    Repository<Subject>,
    "findOne" | "create" | "save" | "find" | "remove"
>;

const buildSubject = (overrides: Partial<Subject> = {}): Subject =>
    ({
        id: 1,
        name: "Mathematics",
        courses: [],
        ...overrides,
    }) as Subject;

describe("SubjectsService (STT7)", () => {
    let service: SubjectsService;
    let mockSubjectRepository: jest.Mocked<SubjectRepositoryMock>;

    beforeEach(() => {
        mockSubjectRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
        } as unknown as jest.Mocked<SubjectRepositoryMock>;

        service = new SubjectsService(
            mockSubjectRepository as unknown as Repository<Subject>,
        );
    });

    // Rollback for unit tests: reset mock states after each test case.
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe("create()", () => {
        // TC_STT07_CREATE_01
        // Objective: Tao mon hoc thanh cong khi ten mon hoc chua ton tai.
        it("TC_STT07_CREATE_01 should create and return a new subject", async () => {
            const createDto: CreateSubjectDto = { name: "Physics" };
            const createdEntity = buildSubject({ id: 10, name: "Physics" });

            mockSubjectRepository.findOne.mockResolvedValue(null);
            mockSubjectRepository.create.mockReturnValue(createdEntity);
            mockSubjectRepository.save.mockResolvedValue(createdEntity);

            const result = await service.create(createDto);

            expect(result).toEqual(createdEntity);
            expect(mockSubjectRepository.create).toHaveBeenCalledWith(createDto);
            expect(mockSubjectRepository.save).toHaveBeenCalledWith(createdEntity);
        });

        // TC_STT07_CREATE_02
        // Objective: Nem BadRequestException khi ten mon hoc da ton tai.
        it("TC_STT07_CREATE_02 should throw BadRequestException for duplicate subject name", async () => {
            const createDto: CreateSubjectDto = { name: "Mathematics" };

            mockSubjectRepository.findOne.mockResolvedValue(buildSubject());

            await expect(service.create(createDto)).rejects.toBeInstanceOf(
                BadRequestException,
            );
            expect(mockSubjectRepository.create).not.toHaveBeenCalled();
            expect(mockSubjectRepository.save).not.toHaveBeenCalled();
        });

        // TC_STT07_CREATE_03
        // Objective: CheckDB - xac minh service check uniqueness dung query where name.
        it("TC_STT07_CREATE_03 should check duplicate by where name before creating", async () => {
            const createDto: CreateSubjectDto = { name: "History" };
            const createdEntity = buildSubject({ id: 11, name: "History" });

            mockSubjectRepository.findOne.mockResolvedValue(null);
            mockSubjectRepository.create.mockReturnValue(createdEntity);
            mockSubjectRepository.save.mockResolvedValue(createdEntity);

            await service.create(createDto);

            expect(mockSubjectRepository.findOne).toHaveBeenCalledWith({
                where: { name: "History" },
            });
        });
    });

    describe("findAll()", () => {
        // TC_STT07_FINDALL_01
        // Objective: Tra ve danh sach mon hoc khi repository co du lieu.
        it("TC_STT07_FINDALL_01 should return all subjects", async () => {
            const subjects = [
                buildSubject({ id: 1, name: "Biology" }),
                buildSubject({ id: 2, name: "Mathematics" }),
            ];
            mockSubjectRepository.find.mockResolvedValue(subjects);

            const result = await service.findAll();

            expect(result).toEqual(subjects);
            expect(result).toHaveLength(2);
        });

        // TC_STT07_FINDALL_02
        // Objective: CheckDB - xac minh repository.find duoc goi voi dieu kien order name ASC.
        it("TC_STT07_FINDALL_02 should call repository.find with order name ASC", async () => {
            mockSubjectRepository.find.mockResolvedValue([]);

            await service.findAll();

            expect(mockSubjectRepository.find).toHaveBeenCalledWith({
                order: { name: "ASC" },
            });
        });

        // TC_STT07_FINDALL_03
        // Objective: Tra ve mang rong neu khong co mon hoc nao.
        it("TC_STT07_FINDALL_03 should return empty array when repository has no data", async () => {
            mockSubjectRepository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe("findOne()", () => {
        // TC_STT07_FINDONE_01
        // Objective: Tra ve mon hoc theo id va bao gom relation courses.
        it("TC_STT07_FINDONE_01 should return a subject by id", async () => {
            const subject = buildSubject({ id: 20, name: "Chemistry" });
            mockSubjectRepository.findOne.mockResolvedValue(subject);

            const result = await service.findOne(20);

            expect(result).toEqual(subject);
        });

        // TC_STT07_FINDONE_02
        // Objective: Nem NotFoundException neu id khong ton tai.
        it("TC_STT07_FINDONE_02 should throw NotFoundException when subject is not found", async () => {
            mockSubjectRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(404)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        // TC_STT07_FINDONE_03
        // Objective: CheckDB - xac minh query where id va relations courses.
        it("TC_STT07_FINDONE_03 should call repository.findOne with id and courses relation", async () => {
            mockSubjectRepository.findOne.mockResolvedValue(buildSubject({ id: 1 }));

            await service.findOne(1);

            expect(mockSubjectRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ["courses"],
            });
        });
    });

    describe("update()", () => {
        // TC_STT07_UPDATE_01
        // Objective: Cap nhat thanh cong va tra ve ban ghi sau cap nhat.
        it("TC_STT07_UPDATE_01 should update and return the subject", async () => {
            const existingSubject = buildSubject({ id: 5, name: "Math" });
            const updateDto: UpdateSubjectDto = { name: "Advanced Math" };
            const savedSubject = buildSubject({ id: 5, name: "Advanced Math" });

            mockSubjectRepository.findOne.mockResolvedValue(existingSubject);
            mockSubjectRepository.save.mockResolvedValue(savedSubject);

            const result = await service.update(5, updateDto);

            expect(result).toEqual(savedSubject);
            expect(mockSubjectRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ id: 5, name: "Advanced Math" }),
            );
        });

        // TC_STT07_UPDATE_02
        // Objective: Nem NotFoundException neu subject can update khong ton tai.
        it("TC_STT07_UPDATE_02 should throw NotFoundException when updating non-existing subject", async () => {
            const updateDto: UpdateSubjectDto = { name: "New Name" };
            mockSubjectRepository.findOne.mockResolvedValue(null);

            await expect(service.update(999, updateDto)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockSubjectRepository.save).not.toHaveBeenCalled();
        });

        // TC_STT07_UPDATE_03
        // Objective: CheckDB - xac minh save goi dung du lieu da merge tu existing + dto.
        it("TC_STT07_UPDATE_03 should persist merged data through repository.save", async () => {
            const existingSubject = buildSubject({ id: 30, name: "Geography" });
            const updateDto: UpdateSubjectDto = { name: "World Geography" };

            mockSubjectRepository.findOne.mockResolvedValue(existingSubject);
            mockSubjectRepository.save.mockResolvedValue(
                buildSubject({ id: 30, name: "World Geography" }),
            );

            await service.update(30, updateDto);

            expect(mockSubjectRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 30,
                    name: "World Geography",
                }),
            );
        });
    });

    describe("remove()", () => {
        // TC_STT07_REMOVE_01
        // Objective: Xoa thanh cong subject ton tai.
        it("TC_STT07_REMOVE_01 should remove an existing subject", async () => {
            const existingSubject = buildSubject({ id: 9, name: "Music" });
            mockSubjectRepository.findOne.mockResolvedValue(existingSubject);
            mockSubjectRepository.remove.mockResolvedValue(existingSubject);

            await service.remove(9);

            expect(mockSubjectRepository.remove).toHaveBeenCalledWith(
                existingSubject,
            );
        });

        // TC_STT07_REMOVE_02
        // Objective: Nem NotFoundException neu subject can xoa khong ton tai.
        it("TC_STT07_REMOVE_02 should throw NotFoundException when removing non-existing subject", async () => {
            mockSubjectRepository.findOne.mockResolvedValue(null);

            await expect(service.remove(1234)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockSubjectRepository.remove).not.toHaveBeenCalled();
        });

        // TC_STT07_REMOVE_03
        // Objective: CheckDB - xac minh remove duoc goi dung 1 lan voi entity tim thay.
        it("TC_STT07_REMOVE_03 should call repository.remove exactly once with found entity", async () => {
            const existingSubject = buildSubject({ id: 31, name: "Literature" });
            mockSubjectRepository.findOne.mockResolvedValue(existingSubject);
            mockSubjectRepository.remove.mockResolvedValue(existingSubject);

            await service.remove(31);

            expect(mockSubjectRepository.remove).toHaveBeenCalledTimes(1);
            expect(mockSubjectRepository.remove).toHaveBeenCalledWith(
                existingSubject,
            );
        });
    });
});