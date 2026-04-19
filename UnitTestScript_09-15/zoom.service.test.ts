/**
 * Unit Test Script: zoom.service.ts
 * Tệp kiểm thử: elearning-backend/src/modules/zoom/zoom.service.ts
 * Framework: Jest + @nestjs/testing
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. createMeeting(createDto)  - Tạo Zoom meeting mới
 * 2. findAll(courseId?)        - Lấy danh sách meetings (có thể filter)
 * 3. findOne(id)               - Tìm meeting theo id
 * 4. update(id, updateDto)     - Cập nhật meeting
 * 5. delete(id)                - Xóa meeting
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ZoomService } from '../../../elearning-backend/src/modules/zoom/zoom.service';
import { ZoomMeeting } from '../../../elearning-backend/src/entities/zoom-meeting.entity';

// ─── Mock QueryBuilder ───────────────────────────────────────────────────────
const mockGetMany = jest.fn().mockResolvedValue([]);
const mockQueryBuilder: any = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where:            jest.fn().mockReturnThis(),
  orderBy:          jest.fn().mockReturnThis(),
  getMany:          mockGetMany,
};

// ─── Mock Repository ─────────────────────────────────────────────────────────
const mockRepo = {
  create:             jest.fn(),
  save:               jest.fn(),
  findOne:            jest.fn(),
  remove:             jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

let service: ZoomService;

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ZoomService,
      { provide: getRepositoryToken(ZoomMeeting), useValue: mockRepo },
    ],
  }).compile();

  service = module.get<ZoomService>(ZoomService);
  jest.clearAllMocks();
  // Reset queryBuilder mock for each test
  mockRepo.createQueryBuilder.mockReturnValue({ ...mockQueryBuilder });
});

// =============================================================================
// 1. createMeeting(createDto)
// =============================================================================
describe('createMeeting(createDto)', () => {

  // TC_CREATE_01
  it('[TC_CREATE_01] nên tạo meeting thành công với đầy đủ thông tin hợp lệ', async () => {
    const dto = { meetingId: 'abc123', topic: 'Toán 10', startUrl: 'https://start', joinUrl: 'https://join', password: '123', courseId: 1, teacherId: 2 };
    const entity = { ...dto, status: 'scheduled', id: 1 };
    mockRepo.create.mockReturnValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    const result = await service.createMeeting(dto as any);
    expect(result).toEqual(entity);
    expect(result.status).toBe('scheduled');
  });

  // TC_CREATE_02
  it('[TC_CREATE_02] nên gán status mặc định là "scheduled" dù dto không truyền status', async () => {
    const dto = { meetingId: 'x', topic: 'y', courseId: 1, teacherId: 1 };
    const entity = { ...dto, status: 'scheduled' };
    mockRepo.create.mockReturnValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    const result = await service.createMeeting(dto as any);
    expect(result.status).toBe('scheduled');
  });

  // TC_CREATE_03
  it('[TC_CREATE_03] CheckDB: repository.create được gọi với {...dto, status:"scheduled"}', async () => {
    const dto = { meetingId: 'x', topic: 'y', courseId: 1, teacherId: 1 };
    mockRepo.create.mockReturnValue({ ...dto, status: 'scheduled' });
    mockRepo.save.mockResolvedValue({});

    await service.createMeeting(dto as any);
    expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, status: 'scheduled' });
  });

  // TC_CREATE_04
  it('[TC_CREATE_04] CheckDB: repository.save được gọi đúng 1 lần', async () => {
    const dto = { meetingId: 'x', topic: 'y', courseId: 1, teacherId: 1 };
    const entity = { ...dto, status: 'scheduled' };
    mockRepo.create.mockReturnValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    await service.createMeeting(dto as any);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  // TC_CREATE_05
  it('[TC_CREATE_05] nên ném lỗi khi repository.save thất bại (DB error)', async () => {
    const dto = { meetingId: 'x', topic: 'y', courseId: 1, teacherId: 1 };
    mockRepo.create.mockReturnValue({ ...dto, status: 'scheduled' });
    mockRepo.save.mockRejectedValue(new Error('DB connection failed'));

    await expect(service.createMeeting(dto as any)).rejects.toThrow('DB connection failed');
  });

  // TC_CREATE_06
  it('[TC_CREATE_06] nên trả về đúng object ZoomMeeting được save trả về', async () => {
    const dto = { meetingId: 'abc', topic: 'Meeting', courseId: 1, teacherId: 1 };
    const savedEntity = { id: 10, meetingId: 'abc', status: 'scheduled' };
    mockRepo.create.mockReturnValue(savedEntity);
    mockRepo.save.mockResolvedValue(savedEntity);

    const result = await service.createMeeting(dto as any);
    expect(result).toBe(savedEntity);
  });
});

// =============================================================================
// 2. findAll(courseId?)
// =============================================================================
describe('findAll(courseId?)', () => {
  let qb: any;
  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where:             jest.fn().mockReturnThis(),
      orderBy:           jest.fn().mockReturnThis(),
      getMany:           jest.fn().mockResolvedValue([]),
    };
    mockRepo.createQueryBuilder.mockReturnValue(qb);
  });

  // TC_FINDALL_01
  it('[TC_FINDALL_01] nên trả về tất cả meetings khi không truyền courseId', async () => {
    const meetings = [{ id: 1, topic: 'A' }, { id: 2, topic: 'B' }];
    qb.getMany.mockResolvedValue(meetings);

    const result = await service.findAll();
    expect(result).toHaveLength(2);
    expect(result).toEqual(meetings);
  });

  // TC_FINDALL_02
  it('[TC_FINDALL_02] nên lọc đúng meetings theo courseId khi có truyền', async () => {
    const meetings = [{ id: 1, courseId: 5 }];
    qb.getMany.mockResolvedValue(meetings);

    const result = await service.findAll(5);
    expect(qb.where).toHaveBeenCalledWith('meeting.courseId = :courseId', { courseId: 5 });
    expect(result).toEqual(meetings);
  });

  // TC_FINDALL_03
  it('[TC_FINDALL_03] nên trả về mảng rỗng khi không có meeting nào', async () => {
    qb.getMany.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
  });

  // TC_FINDALL_04
  it('[TC_FINDALL_04] CheckDB: leftJoinAndSelect được gọi cho "course" và "teacher"', async () => {
    qb.getMany.mockResolvedValue([]);
    await service.findAll();
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('meeting.course', 'course');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('meeting.teacher', 'teacher');
  });

  // TC_FINDALL_05
  it('[TC_FINDALL_05] nên orderBy scheduledTime DESC', async () => {
    qb.getMany.mockResolvedValue([]);
    await service.findAll();
    expect(qb.orderBy).toHaveBeenCalledWith('meeting.scheduledTime', 'DESC');
  });

  // TC_FINDALL_06
  it('[TC_FINDALL_06] nên KHÔNG gọi where khi courseId = undefined', async () => {
    qb.getMany.mockResolvedValue([]);
    await service.findAll(undefined);
    expect(qb.where).not.toHaveBeenCalled();
  });
});

// =============================================================================
// 3. findOne(id)
// =============================================================================
describe('findOne(id)', () => {

  // TC_FINDONE_01
  it('[TC_FINDONE_01] nên tìm thấy meeting tồn tại và trả về đúng object', async () => {
    const meeting = { id: 1, topic: 'Toán 10', course: { id: 1 }, teacher: { id: 2 } };
    mockRepo.findOne.mockResolvedValue(meeting);

    const result = await service.findOne(1);
    expect(result).toEqual(meeting);
  });

  // TC_FINDONE_02
  it('[TC_FINDONE_02] nên ném NotFoundException khi id không tồn tại', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(9999)).rejects.toThrow(NotFoundException);
  });

  // TC_FINDONE_03
  it('[TC_FINDONE_03] CheckDB: findOne được gọi với where:{id} và relations', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 3 });
    await service.findOne(3);
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      relations: ['course', 'teacher'],
    });
  });

  // TC_FINDONE_04
  it('[TC_FINDONE_04] nên trả về đúng meeting theo id khi có nhiều meetings', async () => {
    const meeting = { id: 2, topic: 'Lý 11' };
    mockRepo.findOne.mockResolvedValue(meeting);

    const result = await service.findOne(2);
    expect(result.id).toBe(2);
    expect(result.topic).toBe('Lý 11');
  });
});

// =============================================================================
// 4. update(id, updateDto)
// =============================================================================
describe('update(id, updateDto)', () => {

  // TC_UPDATE_01
  it('[TC_UPDATE_01] nên cập nhật topic thành công', async () => {
    const existing = { id: 1, topic: 'Toán 10', status: 'scheduled' };
    const updateDto = { topic: 'Toán 11 Nâng cao' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue({ ...existing, ...updateDto });

    const result = await service.update(1, updateDto as any);
    expect(result.topic).toBe('Toán 11 Nâng cao');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  // TC_UPDATE_02
  it('[TC_UPDATE_02] nên cập nhật nhiều fields cùng lúc', async () => {
    const existing = { id: 1, topic: 'A', password: 'old' };
    const updateDto = { topic: 'X', password: 'newpass', status: 'completed' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue({ ...existing, ...updateDto });

    const result = await service.update(1, updateDto as any);
    expect(result.topic).toBe('X');
    expect(result.password).toBe('newpass');
  });

  // TC_UPDATE_03
  it('[TC_UPDATE_03] nên ném NotFoundException khi id không tồn tại', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.update(9999, { topic: 'Y' } as any)).rejects.toThrow(NotFoundException);
  });

  // TC_UPDATE_04
  it('[TC_UPDATE_04] CheckDB: repository.save được gọi đúng 1 lần sau khi assign', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1, topic: 'Old' });
    mockRepo.save.mockResolvedValue({ id: 1, topic: 'Y' });

    await service.update(1, { topic: 'Y' } as any);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// 5. delete(id)
// =============================================================================
describe('delete(id)', () => {

  // TC_DELETE_01
  it('[TC_DELETE_01] nên xóa meeting tồn tại thành công và trả về void', async () => {
    const meeting = { id: 1, topic: 'Toán 10' };
    mockRepo.findOne.mockResolvedValue(meeting);
    mockRepo.remove.mockResolvedValue(meeting);

    await expect(service.delete(1)).resolves.toBeUndefined();
    expect(mockRepo.remove).toHaveBeenCalledTimes(1);
  });

  // TC_DELETE_02
  it('[TC_DELETE_02] nên ném NotFoundException khi id không tồn tại', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.delete(9999)).rejects.toThrow(NotFoundException);
  });

  // TC_DELETE_03
  it('[TC_DELETE_03] CheckDB: repository.remove được gọi với đúng entity', async () => {
    const meeting = { id: 2, topic: 'Lý 11' };
    mockRepo.findOne.mockResolvedValue(meeting);
    mockRepo.remove.mockResolvedValue(meeting);

    await service.delete(2);
    expect(mockRepo.remove).toHaveBeenCalledWith(meeting);
  });

  // TC_DELETE_04
  it('[TC_DELETE_04] nên ném lỗi khi repository.remove thất bại (FK constraint)', async () => {
    const meeting = { id: 1 };
    mockRepo.findOne.mockResolvedValue(meeting);
    mockRepo.remove.mockRejectedValue(new Error('FK constraint'));

    await expect(service.delete(1)).rejects.toThrow('FK constraint');
  });
});
