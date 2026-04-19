/**
 * STT 20 — Unit tests for elearning-frontend/src/apis/search.ts
 * 27 test cases
 */

// ── Mock phải đứng TRÊN tất cả import ─────────────────────────
jest.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────
import axiosRequest from '@/config/axios';
import {
  searchCourses,
  searchTeachers,
  getTeacherById,
  SearchCoursesParams,
  SearchTeachersParams,
  CourseSearchResult,
  TeacherSearchResult,
} from '@/apis/search';

const mockAxios = axiosRequest as jest.Mocked<typeof axiosRequest>;

beforeEach(() => jest.clearAllMocks());

// ── Nhóm A — searchCourses ────────────────────────────────────
describe('Nhóm A — searchCourses', () => {
  // A.1 Query params construction
  it('TC_SEARCH_API_01: Params rỗng {} → gọi với params={}', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = {};
    const result = await searchCourses(params);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/search', { params: {} });
    expect(result).toEqual(mockResponse);
  });

  it('TC_SEARCH_API_02: Chỉ có keyword', async () => {
    const mockResponse = { message: 'ok', result: { courses: [{ id: 1, title: 'Test' }], total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'toán' };
    const result = await searchCourses(params);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/search', { params: { keyword: 'toán' } });
    expect(result).toEqual(mockResponse);
  });

  it('TC_SEARCH_API_03: Đủ 5 field (keyword, subjectId, gradeLevelId, page, limit)', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = {
      keyword: 'x',
      subjectId: 1,
      gradeLevelId: 2,
      page: 1,
      limit: 10,
    };
    const result = await searchCourses(params);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/search', { params });
    expect(result).toEqual(mockResponse);
  });

  it('TC_SEARCH_API_04: Input không bị mutate', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'test', page: 1 };
    const paramsCopy = { ...params };

    await searchCourses(params);

    expect(params).toEqual(paramsCopy);
  });

  it('TC_SEARCH_API_05: Params undefined key vẫn được giữ', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'x', subjectId: undefined };
    await searchCourses(params);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/search', { params });
    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.subjectId).toBeUndefined();
  });

  // A.2 Keyword encoding
  it('TC_SEARCH_API_06: Keyword có dấu cách', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'toán 10' };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.keyword).toBe('toán 10');
  });

  it('TC_SEARCH_API_07: Keyword tiếng Việt có dấu', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'lập trình' };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.keyword).toBe('lập trình');
  });

  it('TC_SEARCH_API_08: Keyword chứa &', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'A&B' };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.keyword).toBe('A&B');
  });

  it('TC_SEARCH_API_09: Keyword chứa #', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'C#' };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.keyword).toBe('C#');
  });

  it('TC_SEARCH_API_10: Keyword rỗng ""', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: '' };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.keyword).toBe('');
  });

  it('TC_SEARCH_API_11: Keyword rất dài (>500 ký tự)', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const longKeyword = 'a'.repeat(600);
    const params: SearchCoursesParams = { keyword: longKeyword };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.keyword).toBe(longKeyword);
  });

  // A.3 Pagination edge
  it('TC_SEARCH_API_12: page=0 passthrough', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 0, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { page: 0 };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.page).toBe(0);
  });

  it('TC_SEARCH_API_13: page âm passthrough', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: -1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { page: -1 };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.page).toBe(-1);
  });

  it('TC_SEARCH_API_14: limit rất lớn (1000)', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 1000, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { limit: 1000 };
    await searchCourses(params);

    const callParams = (mockAxios.get.mock.calls[0][1] as { params: any }).params;
    expect(callParams.limit).toBe(1000);
  });

  // A.4 Response shape
  it('TC_SEARCH_API_15: Có kết quả', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        courses: [{ id: 1, title: 'Course 1' } as any],
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = {};
    const result = await searchCourses(params);

    expect(result.result.courses).toHaveLength(1);
    expect(result.result.total).toBe(5);
    expect(result.result.page).toBe(1);
    expect(result.result.limit).toBe(10);
    expect(result.result.totalPages).toBe(1);
  });

  it('TC_SEARCH_API_16: 0 kết quả', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        courses: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'notfound' };
    const result = await searchCourses(params);

    expect(result.result.courses).toEqual([]);
  });
});

// ── Nhóm B — searchTeachers ───────────────────────────────────
describe('Nhóm B — searchTeachers', () => {
  it('TC_SEARCH_API_17: Params đủ 3 (keyword, page, limit)', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        teachers: [{ id: 1, fullName: 'Teacher 1', email: 'teacher@example.com', avatarUrl: 'url', phone: '123', totalCourses: 5, totalStudents: 100, createdAt: '2024-01-01' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchTeachersParams = { keyword: 'x', page: 1, limit: 10 };
    const result = await searchTeachers(params);

    expect(mockAxios.get).toHaveBeenCalledWith('/teachers/search', { params });
    expect(result).toEqual(mockResponse);
  });

  it('TC_SEARCH_API_18: Response teachers shape đầy đủ (totalCourses, totalStudents) preserve', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        teachers: [
          {
            id: 1,
            fullName: 'John Doe',
            email: 'john@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
            phone: '0123456789',
            totalCourses: 5,
            totalStudents: 150,
            createdAt: '2024-01-01',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchTeachersParams = { keyword: 'john' };
    const result = await searchTeachers(params);

    expect(result.result.teachers[0]).toEqual({
      id: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      phone: '0123456789',
      totalCourses: 5,
      totalStudents: 150,
      createdAt: '2024-01-01',
    });
  });

  it('TC_SEARCH_API_19: 0 kết quả → teachers=[]', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        teachers: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchTeachersParams = { keyword: 'notexist' };
    const result = await searchTeachers(params);

    expect(result.result.teachers).toEqual([]);
  });
});

// ── Nhóm C — getTeacherById ───────────────────────────────────
describe('Nhóm C — getTeacherById', () => {
  it('TC_SEARCH_API_20: GET /teachers/:id', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        id: 5,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        avatarUrl: 'https://example.com/jane.jpg',
        phone: '0987654321',
        createdAt: '2024-01-01',
        courses: [],
        totalCourses: 3,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getTeacherById(5);

    expect(mockAxios.get).toHaveBeenCalledWith('/teachers/5');
    expect(result).toEqual(mockResponse);
  });

  it('TC_SEARCH_API_21: id=0 → URL /teachers/0 không rơi default', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        id: 0,
        fullName: 'Test',
        email: 'test@example.com',
        avatarUrl: 'url',
        phone: '123',
        createdAt: '2024-01-01',
        courses: [],
        totalCourses: 0,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    await getTeacherById(0);

    expect(mockAxios.get).toHaveBeenCalledWith('/teachers/0');
  });

  it('TC_SEARCH_API_22: Response có courses array (nested) preserve nguyên vẹn', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        id: 5,
        fullName: 'Teacher',
        email: 'teacher@example.com',
        avatarUrl: 'url',
        phone: '123',
        createdAt: '2024-01-01',
        courses: [{ id: 1, title: 'Course 1' } as any, { id: 2, title: 'Course 2' } as any],
        totalCourses: 2,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getTeacherById(5);

    expect(result.result.courses).toHaveLength(2);
    expect(result.result.courses[0].id).toBe(1);
    expect(result.result.courses[1].id).toBe(2);
  });

  it('TC_SEARCH_API_23: 404 (teacher không tồn tại) → propagate', async () => {
    const error = new Error('404 Not Found');
    mockAxios.get.mockRejectedValue(error);

    await expect(getTeacherById(999)).rejects.toThrow('404 Not Found');
  });
});

// ── Nhóm D — ERROR & BEHAVIOR ──────────────────────────────────
describe('Nhóm D — ERROR & BEHAVIOR', () => {
  it('TC_SEARCH_API_24: Network error reject với message', async () => {
    const networkError = new Error('ECONNREFUSED');
    mockAxios.get.mockRejectedValue(networkError);

    await expect(searchCourses({})).rejects.toThrow('ECONNREFUSED');
  });

  it('TC_SEARCH_API_25: 500 Server Error propagate', async () => {
    const serverError = new Error('500 Internal Server Error');
    mockAxios.get.mockRejectedValue(serverError);

    await expect(searchCourses({})).rejects.toThrow('500 Internal Server Error');
  });

  it('TC_SEARCH_API_26: Wrapper KHÔNG debounce — gọi 5 lần → 5 request', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params: SearchCoursesParams = { keyword: 'test' };

    for (let i = 0; i < 5; i++) {
      await searchCourses(params);
    }

    expect(mockAxios.get).toHaveBeenCalledTimes(5);
  });

  it('TC_SEARCH_API_27: Wrapper KHÔNG cancel request cũ khi gọi mới', async () => {
    const mockResponse1 = { message: 'ok', result: { courses: [{ id: 1 }], total: 1, page: 1, limit: 10, totalPages: 1 } as any };
    const mockResponse2 = { message: 'ok', result: { courses: [{ id: 2 }], total: 1, page: 1, limit: 10, totalPages: 1 } as any };

    mockAxios.get
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const params1: SearchCoursesParams = { keyword: 'test1' };
    const params2: SearchCoursesParams = { keyword: 'test2' };

    const promise1 = searchCourses(params1);
    const promise2 = searchCourses(params2);

    const result1 = await promise1;
    const result2 = await promise2;

    expect(result1.result.courses[0].id).toBe(1);
    expect(result2.result.courses[0].id).toBe(2);
    expect(mockAxios.get).toHaveBeenCalledTimes(2);
  });
});
