/**
 * STT 18 — Unit tests for elearning-frontend/src/apis/enrollments.ts
 * 27 test cases covering enrollment lifecycle (subscribe → learn → complete → reset)
 */

jest.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import axiosRequest from '@/config/axios';
import {
  createEnrollment,
  getSubscribedCourses,
  getEnrollmentById,
  updateEnrollmentStatus,
  markEpisodeComplete,
  updateLastEpisode,
  completeCourse,
  resetCourse,
} from '@/apis/enrollments';
import { EnrollmentStatus } from '@/@types/Course.type';

const mockAxios = axiosRequest as jest.Mocked<typeof axiosRequest>;

beforeEach(() => jest.clearAllMocks());

// ==================== NHÓM A — createEnrollment ====================

describe('Nhóm A — createEnrollment', () => {
  // TC_ENROLL_API_01
  it('TC_ENROLL_API_01: POST đúng URL với courseId', async () => {
    const mockResponse = { message: 'ok', result: { id: 1, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 0 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createEnrollment(5, { studentId: 1 });

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/enrollments', { studentId: 1 });
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_02
  it('TC_ENROLL_API_02: Body nguyên vẹn từ CreateEnrollmentRequest', async () => {
    const mockResponse = { message: 'ok', result: { id: 1, course_id: 5, student_id: 2, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 0 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const requestData = { studentId: 2 };
    const result = await createEnrollment(5, requestData);

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/enrollments', { studentId: 2 });
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_03
  it('TC_ENROLL_API_03: courseId=0 → URL /courses/0/enrollments (không undefined)', async () => {
    const mockResponse = { message: 'ok', result: { id: 1, course_id: 0, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 0 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createEnrollment(0, { studentId: 1 });

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/0/enrollments', { studentId: 1 });
    expect(mockAxios.post.mock.calls[0][0]).not.toContain('undefined');
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_04
  it('TC_ENROLL_API_04: Server 409 (đã đăng ký) → propagate error', async () => {
    const error = new Error('Conflict');
    (error as any).response = { status: 409, data: { message: 'Already enrolled' } };
    mockAxios.post.mockRejectedValue(error);

    await expect(createEnrollment(5, { studentId: 1 })).rejects.toEqual(error);
    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/enrollments', { studentId: 1 });
  });
});

// ==================== NHÓM B — getSubscribedCourses ====================

describe('Nhóm B — getSubscribedCourses', () => {
  // TC_ENROLL_API_05
  it('TC_ENROLL_API_05: Không param → params=undefined', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getSubscribedCourses();

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/students/enrollments', { params: undefined });
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_06
  it('TC_ENROLL_API_06: Có param subscribed:true → map đúng', async () => {
    const mockResponse = { message: 'ok', result: [{ id: 1, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 100 }] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getSubscribedCourses({ subscribed: true });

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/students/enrollments', {
      params: { subscribed: true, 'student-id': undefined },
    });
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_07
  it('TC_ENROLL_API_07: Có studentId → rename key thành student-id', async () => {
    const mockResponse = { message: 'ok', result: [{ id: 1, course_id: 5, student_id: 10, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 50 }] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getSubscribedCourses({ studentId: 10 });

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/students/enrollments', {
      params: { subscribed: undefined, 'student-id': 10 },
    });
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_08
  it('TC_ENROLL_API_08: Trả array rỗng khi user chưa enroll', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getSubscribedCourses();

    expect(mockAxios.get).toHaveBeenCalled();
    expect(result.result).toHaveLength(0);
  });

  // TC_ENROLL_API_09
  it('TC_ENROLL_API_09: Response shape đầy đủ (progress_percentage, completed_at) được preserve', async () => {
    const complexFixture = [
      {
        id: 1,
        course_id: 5,
        student_id: 10,
        progress_percentage: 45.5,
        status: EnrollmentStatus.ACTIVE,
        enrolled_at: '2025-01-10T10:00:00Z',
      },
      {
        id: 2,
        course_id: 6,
        student_id: 10,
        progress_percentage: 100,
        status: EnrollmentStatus.COMPLETED,
        enrolled_at: '2024-12-01T08:00:00Z',
        completed_at: '2025-01-15T10:00:00Z',
      },
    ];
    const mockResponse = { message: 'ok', result: complexFixture };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getSubscribedCourses({ studentId: 10 });

    expect(result.result).toEqual(complexFixture);
    expect(result.result[0].progress_percentage).toBe(45.5);
    expect(result.result[0].status).toBe(EnrollmentStatus.ACTIVE);
    expect(result.result[1].progress_percentage).toBe(100);
    expect(result.result[1].completed_at).toBe('2025-01-15T10:00:00Z');
  });
});

// ==================== NHÓM C — getEnrollmentById ====================

describe('Nhóm C — getEnrollmentById', () => {
  // TC_ENROLL_API_10
  it('TC_ENROLL_API_10: Đúng path 2 cấp /courses/:courseId/enrollments/:id', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 50 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getEnrollmentById(5, 10);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/enrollments/10');
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_11
  it('TC_ENROLL_API_11: 404 (enrollment không tồn tại) propagate', async () => {
    const error = new Error('Not Found');
    (error as any).response = { status: 404, data: { message: 'Enrollment not found' } };
    mockAxios.get.mockRejectedValue(error);

    await expect(getEnrollmentById(5, 999)).rejects.toEqual(error);
    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/enrollments/999');
  });
});

// ==================== NHÓM D — updateEnrollmentStatus ====================

describe('Nhóm D — updateEnrollmentStatus', () => {
  // TC_ENROLL_API_12
  it('TC_ENROLL_API_12: PUT đúng URL có suffix /status', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.CANCELED, enrolled_at: '', progress_percentage: 50 } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateEnrollmentStatus(5, 10, { status: EnrollmentStatus.CANCELED });

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/enrollments/10/status', { status: EnrollmentStatus.CANCELED });
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_13
  it('TC_ENROLL_API_13: Body UpdateEnrollmentStatusRequest nguyên vẹn deep-equal', async () => {
    const updateRequest = { status: EnrollmentStatus.ACTIVE };
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 50 } };
    mockAxios.put.mockResolvedValue(mockResponse);

    await updateEnrollmentStatus(5, 10, updateRequest);

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/enrollments/10/status', { status: EnrollmentStatus.ACTIVE });
    expect(mockAxios.put.mock.calls[0][1]).toEqual(updateRequest);
  });
});

// ==================== NHÓM E — markEpisodeComplete ====================

describe('Nhóm E — markEpisodeComplete', () => {
  // TC_ENROLL_API_14
  it('TC_ENROLL_API_14: POST đúng URL 3 cấp', async () => {
    const mockResponse = { message: 'ok', result: { message: 'marked', enrollment: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 50 } } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await markEpisodeComplete(5, 10, 50);

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/enrollments/10/episodes/50/complete');
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_15
  it('TC_ENROLL_API_15: KHÔNG truyền body (gọi không arg thứ 2)', async () => {
    const mockResponse = { message: 'ok', result: { message: 'marked' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await markEpisodeComplete(5, 10, 50);

    const calls = mockAxios.post.mock.calls;
    expect(calls[0].length).toBe(1); // Chỉ 1 argument: URL
    expect(calls[0][0]).toBe('/courses/5/enrollments/10/episodes/50/complete');
  });

  // TC_ENROLL_API_16
  it('TC_ENROLL_API_16: Gọi 2 lần liên tiếp — wrapper KHÔNG dedupe', async () => {
    const mockResponse = { message: 'ok', result: { message: 'marked' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await markEpisodeComplete(5, 10, 50);
    await markEpisodeComplete(5, 10, 50);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  // TC_ENROLL_API_17
  it('TC_ENROLL_API_17: episodeId không thuộc course → 400 propagate', async () => {
    const error = new Error('Bad Request');
    (error as any).response = { status: 400, data: { message: 'Episode does not belong to course' } };
    mockAxios.post.mockRejectedValue(error);

    await expect(markEpisodeComplete(5, 10, 999)).rejects.toEqual(error);
    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/enrollments/10/episodes/999/complete');
  });
});

// ==================== NHÓM F — updateLastEpisode ====================

describe('Nhóm F — updateLastEpisode', () => {
  // TC_ENROLL_API_18
  it('TC_ENROLL_API_18: PUT đúng URL có suffix /last-episode', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 60 } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateLastEpisode(5, 10, 50);

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/enrollments/10/last-episode', { episodeId: 50 });
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_19
  it('TC_ENROLL_API_19: Body KHÔNG chứa courseId/enrollmentId (đã có trong URL)', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 60 } };
    mockAxios.put.mockResolvedValue(mockResponse);

    await updateLastEpisode(5, 10, 50);

    const callArgs = mockAxios.put.mock.calls[0][1] as any;
    expect(Object.keys(callArgs)).toEqual(['episodeId']);
    expect(callArgs).toEqual({ episodeId: 50 });
    expect(callArgs.courseId).toBeUndefined();
    expect(callArgs.enrollmentId).toBeUndefined();
  });
});

// ==================== NHÓM G — completeCourse ====================

describe('Nhóm G — completeCourse', () => {
  // TC_ENROLL_API_20
  it('TC_ENROLL_API_20: POST đúng URL /complete', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.COMPLETED, enrolled_at: '2024-12-01T08:00:00Z', progress_percentage: 100, completed_at: '2025-01-15T10:00:00Z' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await completeCourse(5, 10);

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/enrollments/10/complete');
    expect(result).toBe(mockResponse);
  });

  // TC_ENROLL_API_21
  it('TC_ENROLL_API_21: 400 khi chưa hoàn thành hết episodes → propagate', async () => {
    const error = new Error('Bad Request');
    (error as any).response = {
      status: 400,
      data: { message: 'not_finished', detail: 'Student has not completed all episodes' },
    };
    mockAxios.post.mockRejectedValue(error);

    await expect(completeCourse(5, 10)).rejects.toEqual(error);
  });

  // TC_ENROLL_API_22
  it('TC_ENROLL_API_22: Response chứa completed_at ISO string — preserve', async () => {
    const isoString = '2025-01-15T14:30:45.123Z';
    const mockResponse = {
      message: 'ok',
      result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.COMPLETED, enrolled_at: '2024-12-01T08:00:00Z', progress_percentage: 100, completed_at: isoString },
    };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await completeCourse(5, 10);

    expect(result.result.completed_at).toBe(isoString);
    expect(typeof result.result.completed_at).toBe('string');
  });
});

// ==================== NHÓM H — resetCourse ====================

describe('Nhóm H — resetCourse', () => {
  // TC_ENROLL_API_23
  it('TC_ENROLL_API_23: Method là POST chứ KHÔNG phải DELETE', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 0 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await resetCourse(5, 10);

    expect(mockAxios.post).toHaveBeenCalled();
    expect(mockAxios.delete).not.toHaveBeenCalled();
  });

  // TC_ENROLL_API_24
  it('TC_ENROLL_API_24: URL kết thúc bằng /reset', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 0 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await resetCourse(5, 10);

    const url = mockAxios.post.mock.calls[0][0] as string;
    expect(url).toMatch(/\/reset$/);
    expect(url).toBe('/courses/5/enrollments/10/reset');
  });

  // TC_ENROLL_API_25
  it('TC_ENROLL_API_25: Progress reset về 0 (backend trả) — wrapper preserve', async () => {
    const mockResponse = { message: 'ok', result: { id: 10, course_id: 5, student_id: 1, status: EnrollmentStatus.ACTIVE, enrolled_at: '', progress_percentage: 0 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await resetCourse(5, 10);

    expect(result.result.progress_percentage).toBe(0);
    expect(result.result.status).toBe(EnrollmentStatus.ACTIVE);
  });
});

// ==================== NHÓM I — ERROR PROPAGATION ====================

describe('Nhóm I — ERROR PROPAGATION', () => {
  // TC_ENROLL_API_26
  it('TC_ENROLL_API_26: 401 Unauthorized (chưa login) propagate', async () => {
    const error = new Error('Unauthorized');
    (error as any).response = { status: 401, data: { message: 'Token expired or invalid' } };
    mockAxios.get.mockRejectedValue(error);

    await expect(getSubscribedCourses()).rejects.toEqual(error);
    expect((await getSubscribedCourses().catch((e) => e)).response.status).toBe(401);
  });

  // TC_ENROLL_API_27
  it('TC_ENROLL_API_27: Network error propagate với message hợp lý', async () => {
    const error = new Error('Network Error: ECONNREFUSED');
    (error as any).code = 'ECONNREFUSED';
    mockAxios.get.mockRejectedValue(error);

    await expect(getSubscribedCourses()).rejects.toEqual(error);
    const rejectedError = await getSubscribedCourses().catch((e) => e);
    expect(rejectedError.message).toContain('Network Error');
  });
});
