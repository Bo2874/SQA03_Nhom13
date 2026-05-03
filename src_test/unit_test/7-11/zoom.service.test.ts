import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { ZoomService } from "../../../../src_code/elearning-backend/src/modules/zoom/zoom.service";
import { ZoomMeeting } from "../../../../src_code/elearning-backend/src/entities/zoom-meeting.entity";
import { CreateZoomMeetingDto } from "../../../../src_code/elearning-backend/src/modules/zoom/dto/create-zoom-meeting.dto";
import { UpdateZoomMeetingDto } from "../../../../src_code/elearning-backend/src/modules/zoom/dto/update-zoom-meeting.dto";

type ZoomRepositoryMock = Pick<
    Repository<ZoomMeeting>,
    "findOne" | "create" | "save" | "remove" | "createQueryBuilder"
>;

type QueryBuilderMock = {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
};

const buildMeeting = (overrides: Partial<ZoomMeeting> = {}): ZoomMeeting =>
    ({
        id: 1,
        courseId: 100,
        teacherId: 200,
        title: "Math Live Session",
        description: "Chapter 1 review",
        zoomMeetingId: "123456789",
        joinUrl: "https://zoom.us/j/123456789",
        startUrl: "https://zoom.us/s/123456789",
        meetingPassword: "abc123",
        scheduledTime: new Date("2026-04-27T10:00:00.000Z"),
        durationMinutes: 60,
        status: "scheduled",
        createdAt: new Date("2026-04-27T08:00:00.000Z"),
        course: {} as never,
        teacher: {} as never,
        ...overrides,
    }) as ZoomMeeting;

const buildCreateDto = (
    overrides: Partial<CreateZoomMeetingDto> = {},
): CreateZoomMeetingDto => ({
    courseId: 100,
    teacherId: 200,
    title: "Math Live Session",
    description: "Chapter 1 review",
    joinUrl: "https://zoom.us/j/123456789",
    zoomMeetingId: "123456789",
    meetingPassword: "abc123",
    scheduledTime: "2026-04-27T10:00:00.000Z",
    durationMinutes: 60,
    ...overrides,
});

describe("ZoomService (STT9)", () => {
    let service: ZoomService;
    let mockZoomRepository: jest.Mocked<ZoomRepositoryMock>;
    let queryBuilder: QueryBuilderMock;

    beforeEach(() => {
        queryBuilder = {
            leftJoinAndSelect: jest.fn(),
            where: jest.fn(),
            orderBy: jest.fn(),
            getMany: jest.fn(),
        };

        queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
        queryBuilder.where.mockReturnValue(queryBuilder);
        queryBuilder.orderBy.mockReturnValue(queryBuilder);

        mockZoomRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as unknown as jest.Mocked<ZoomRepositoryMock>;

        service = new ZoomService(
            mockZoomRepository as unknown as Repository<ZoomMeeting>,
        );
    });

    // Rollback for unit tests: reset mock states after each test case.
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe("createMeeting()", () => {
        // TC_STT09_CREATE_01
        // Objective: Tao zoom meeting thanh cong va luu voi status mac dinh la scheduled.
        it("TC_STT09_CREATE_01 should create meeting with default status scheduled", async () => {
            const createDto = buildCreateDto();
            const createdMeeting = buildMeeting({ status: "scheduled" });

            mockZoomRepository.create.mockReturnValue(createdMeeting);
            mockZoomRepository.save.mockResolvedValue(createdMeeting);

            const result = await service.createMeeting(createDto);

            expect(result).toEqual(createdMeeting);
            expect(mockZoomRepository.create).toHaveBeenCalledWith({
                ...createDto,
                status: "scheduled",
            });
            expect(mockZoomRepository.save).toHaveBeenCalledWith(createdMeeting);
        });

        // TC_STT09_CREATE_02
        // Objective: CheckDB - xac minh repository.save duoc goi 1 lan khi tao meeting.
        it("TC_STT09_CREATE_02 should call repository.save exactly once", async () => {
            const createDto = buildCreateDto({ title: "Physics Session" });
            const createdMeeting = buildMeeting({ title: "Physics Session" });

            mockZoomRepository.create.mockReturnValue(createdMeeting);
            mockZoomRepository.save.mockResolvedValue(createdMeeting);

            await service.createMeeting(createDto);

            expect(mockZoomRepository.save).toHaveBeenCalledTimes(1);
            expect(mockZoomRepository.save).toHaveBeenCalledWith(createdMeeting);
        });

        // TC_STT09_CREATE_03
        // Objective: Luu duoc cac truong meeting tu dto vao entity khi tao.
        it("TC_STT09_CREATE_03 should persist dto fields when creating a meeting", async () => {
            const createDto = buildCreateDto({
                title: "Chemistry Session",
                durationMinutes: 90,
            });
            const createdMeeting = buildMeeting({
                title: "Chemistry Session",
                durationMinutes: 90,
            });

            mockZoomRepository.create.mockReturnValue(createdMeeting);
            mockZoomRepository.save.mockResolvedValue(createdMeeting);

            const result = await service.createMeeting(createDto);

            expect(result.title).toBe("Chemistry Session");
            expect(result.durationMinutes).toBe(90);
        });
    });

    describe("findAll()", () => {
        // TC_STT09_FINDALL_01
        // Objective: Tra ve danh sach meeting khi khong truyen courseId.
        it("TC_STT09_FINDALL_01 should return all meetings without course filter", async () => {
            const meetings = [
                buildMeeting({ id: 1, title: "Math Session" }),
                buildMeeting({ id: 2, title: "Physics Session" }),
            ];
            queryBuilder.getMany.mockResolvedValue(meetings);

            const result = await service.findAll();

            expect(result).toEqual(meetings);
            expect(queryBuilder.where).not.toHaveBeenCalled();
        });

        // TC_STT09_FINDALL_02
        // Objective: CheckDB - xac minh filter theo courseId duoc ap dung khi co tham so.
        it("TC_STT09_FINDALL_02 should apply where clause when courseId is provided", async () => {
            queryBuilder.getMany.mockResolvedValue([buildMeeting({ id: 3 })]);

            await service.findAll(100);

            expect(queryBuilder.where).toHaveBeenCalledWith(
                "meeting.courseId = :courseId",
                { courseId: 100 },
            );
        });

        // TC_STT09_FINDALL_03
        // Objective: CheckDB - xac minh truy van sap xep theo scheduledTime DESC.
        it("TC_STT09_FINDALL_03 should order meetings by scheduledTime DESC", async () => {
            queryBuilder.getMany.mockResolvedValue([]);

            await service.findAll();

            expect(mockZoomRepository.createQueryBuilder).toHaveBeenCalledWith(
                "meeting",
            );
            expect(queryBuilder.orderBy).toHaveBeenCalledWith(
                "meeting.scheduledTime",
                "DESC",
            );
        });
    });

    describe("findOne()", () => {
        // TC_STT09_FINDONE_01
        // Objective: Tra ve meeting theo id khi ton tai.
        it("TC_STT09_FINDONE_01 should return meeting by id", async () => {
            const meeting = buildMeeting({ id: 10, title: "English Session" });
            mockZoomRepository.findOne.mockResolvedValue(meeting);

            const result = await service.findOne(10);

            expect(result).toEqual(meeting);
        });

        // TC_STT09_FINDONE_02
        // Objective: Nem NotFoundException khi khong tim thay meeting.
        it("TC_STT09_FINDONE_02 should throw NotFoundException when meeting is not found", async () => {
            mockZoomRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(404)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        // TC_STT09_FINDONE_03
        // Objective: CheckDB - xac minh query findOne co where id va relations course/teacher.
        it("TC_STT09_FINDONE_03 should query with id and relations", async () => {
            mockZoomRepository.findOne.mockResolvedValue(buildMeeting({ id: 1 }));

            await service.findOne(1);

            expect(mockZoomRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ["course", "teacher"],
            });
        });
    });

    describe("update()", () => {
        // TC_STT09_UPDATE_01
        // Objective: Cap nhat meeting thanh cong va tra ve du lieu moi.
        it("TC_STT09_UPDATE_01 should update and return meeting", async () => {
            const existingMeeting = buildMeeting({ id: 20, title: "Old Title" });
            const updateDto: UpdateZoomMeetingDto = {
                title: "Updated Title",
                status: "live",
            };
            const updatedMeeting = buildMeeting({
                id: 20,
                title: "Updated Title",
                status: "live",
            });

            mockZoomRepository.findOne.mockResolvedValue(existingMeeting);
            mockZoomRepository.save.mockResolvedValue(updatedMeeting);

            const result = await service.update(20, updateDto);

            expect(result).toEqual(updatedMeeting);
            expect(mockZoomRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 20,
                    title: "Updated Title",
                    status: "live",
                }),
            );
        });

        // TC_STT09_UPDATE_02
        // Objective: Nem NotFoundException neu meeting can update khong ton tai.
        it("TC_STT09_UPDATE_02 should throw NotFoundException when updating non-existing meeting", async () => {
            const updateDto: UpdateZoomMeetingDto = { title: "New Title" };
            mockZoomRepository.findOne.mockResolvedValue(null);

            await expect(service.update(999, updateDto)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockZoomRepository.save).not.toHaveBeenCalled();
        });

        // TC_STT09_UPDATE_03
        // Objective: CheckDB - xac minh save duoc goi voi entity da merge tu existing + update dto.
        it("TC_STT09_UPDATE_03 should persist merged meeting data through save", async () => {
            const existingMeeting = buildMeeting({ id: 30, title: "Session A" });
            const updateDto: UpdateZoomMeetingDto = {
                title: "Session B",
                status: "completed",
            };

            mockZoomRepository.findOne.mockResolvedValue(existingMeeting);
            mockZoomRepository.save.mockResolvedValue(
                buildMeeting({ id: 30, title: "Session B", status: "completed" }),
            );

            await service.update(30, updateDto);

            expect(mockZoomRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 30,
                    title: "Session B",
                    status: "completed",
                }),
            );
        });
    });

    describe("delete()", () => {
        // TC_STT09_DELETE_01
        // Objective: Xoa meeting thanh cong khi meeting ton tai.
        it("TC_STT09_DELETE_01 should remove existing meeting", async () => {
            const existingMeeting = buildMeeting({ id: 40 });
            mockZoomRepository.findOne.mockResolvedValue(existingMeeting);
            mockZoomRepository.remove.mockResolvedValue(existingMeeting);

            await service.delete(40);

            expect(mockZoomRepository.remove).toHaveBeenCalledWith(existingMeeting);
        });

        // TC_STT09_DELETE_02
        // Objective: Nem NotFoundException neu meeting can xoa khong ton tai.
        it("TC_STT09_DELETE_02 should throw NotFoundException when removing non-existing meeting", async () => {
            mockZoomRepository.findOne.mockResolvedValue(null);

            await expect(service.delete(1234)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockZoomRepository.remove).not.toHaveBeenCalled();
        });

        // TC_STT09_DELETE_03
        // Objective: CheckDB - xac minh remove duoc goi dung 1 lan voi entity tim thay.
        it("TC_STT09_DELETE_03 should call remove exactly once with found meeting", async () => {
            const existingMeeting = buildMeeting({ id: 41 });
            mockZoomRepository.findOne.mockResolvedValue(existingMeeting);
            mockZoomRepository.remove.mockResolvedValue(existingMeeting);

            await service.delete(41);

            expect(mockZoomRepository.remove).toHaveBeenCalledTimes(1);
            expect(mockZoomRepository.remove).toHaveBeenCalledWith(existingMeeting);
        });
    });
});
