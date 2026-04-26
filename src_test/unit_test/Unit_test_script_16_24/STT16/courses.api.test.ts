/**
 * STT 17 — Unit tests for elearning-frontend/src/apis/courses.ts
 * 55 test cases covering all API wrapper functions
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
  getPendingCourses,
  getApprovedCourses,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseByAdmin,
  deleteCourse,
  addCourseMaterial,
  getCourseMaterials,
  getCourseMaterialById,
  updateCourseMaterial,
  deleteCourseMaterial,
  addChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  addEpisode,
  getAllEpisodes,
  getEpisodeById,
  updateEpisode,
  deleteEpisode,
  addQuizQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  addQuizAnswer,
  getAllAnswers,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
  getSubjects,
  getGradeLevels,
  getFeaturedCourses,
  getCoursesBySubject,
  getPlatformStats,
} from '@/apis/courses';

const mockAxios = axiosRequest as jest.Mocked<typeof axiosRequest>;

beforeEach(() => jest.clearAllMocks());

// ==================== NHÓM A — COURSES CRUD ====================

describe('Nhóm A — Courses CRUD', () => {
  // TC_COURSES_API_01
  it('TC_COURSES_API_01: getPendingCourses gọi GET /courses/pending', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getPendingCourses();

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/pending');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_02
  it('TC_COURSES_API_02: getApprovedCourses không params → GET /courses/approved với params=undefined', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getApprovedCourses();

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/approved', { params: undefined });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_03
  it('TC_COURSES_API_03: getApprovedCourses truyền đủ 6 params → build query đúng', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 1, limit: 10, totalPages: 1 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'DESC' as const,
      subjectId: 5,
      gradeLevelId: 2,
    };

    const result = await getApprovedCourses(params);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/approved', { params });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_04
  it('TC_COURSES_API_04: getApprovedCourses không mutate input params', async () => {
    mockAxios.get.mockResolvedValue({});

    const params = { page: 1, limit: 5 };
    const paramsClone = { ...params };

    await getApprovedCourses(params);

    expect(params).toEqual(paramsClone);
  });

  // TC_COURSES_API_05
  it('TC_COURSES_API_05: getCourses filter theo teacherId', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getCourses({ teacherId: 7 });

    expect(mockAxios.get).toHaveBeenCalledWith('/courses', { params: { teacherId: 7 } });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_06
  it('TC_COURSES_API_06: getCourseById encode id trong URL', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getCourseById(123);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/123');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_07
  it('TC_COURSES_API_07: getCourseById id=0 → URL "/courses/0" không rơi default', async () => {
    mockAxios.get.mockResolvedValue({});

    await getCourseById(0);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/0');
  });

  // TC_COURSES_API_08
  it('TC_COURSES_API_08: createCourse POST /courses body nguyên vẹn', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.post.mockResolvedValue(mockResponse);

    const body = { title: 'Toán 10', description: 'Môn Toán lớp 10', price: 100000, subjectId: 1, gradeLevelId: 1 };
    const result = await createCourse(body as any);

    expect(mockAxios.post).toHaveBeenCalledWith('/courses', body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_09
  it('TC_COURSES_API_09: createCourse không mutate input object', async () => {
    mockAxios.post.mockResolvedValue({});

    const body = { title: 'Toán 10' } as any;
    const clone = { ...body };

    await createCourse(body);

    expect(body).toEqual(clone);
  });

  // TC_COURSES_API_10
  it('TC_COURSES_API_10: updateCourse PUT /courses/:id với body đúng', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateCourse(5, { title: 'new' } as any);

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5', { title: 'new' });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_11
  it('TC_COURSES_API_11: updateCourseByAdmin dùng endpoint khác updateCourse', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateCourseByAdmin(5, { status: 'APPROVED' });

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/by-admin', { status: 'APPROVED' });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_12
  it('TC_COURSES_API_12: updateCourseByAdmin truyền đủ rejectionReason', async () => {
    mockAxios.put.mockResolvedValue({});

    await updateCourseByAdmin(5, { status: 'REJECTED', rejectionReason: 'Nội dung không phù hợp' });

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/by-admin', {
      status: 'REJECTED',
      rejectionReason: 'Nội dung không phù hợp',
    });
  });

  // TC_COURSES_API_13
  it('TC_COURSES_API_13: deleteCourse gọi DELETE /courses/:id', async () => {
    const mockResponse = { message: 'ok', result: { message: 'deleted' } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteCourse(5);

    expect(mockAxios.delete).toHaveBeenCalledWith('/courses/5');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_14
  it('TC_COURSES_API_14: deleteCourse server 404 → reject propagate', async () => {
    const error404 = { status: 404, message: 'Not Found' };
    mockAxios.delete.mockRejectedValue(error404);

    await expect(deleteCourse(999)).rejects.toEqual(error404);
  });
});

// ==================== NHÓM B — COURSE MATERIALS ====================

describe('Nhóm B — Course Materials', () => {
  // TC_COURSES_API_15
  it('TC_COURSES_API_15: addCourseMaterial POST /courses/:cid/materials body đúng', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.post.mockResolvedValue(mockResponse);

    const body = { title: 'Slide', fileUrl: 'https://example.com/slide.pdf', fileSizeKb: 200 };
    const result = await addCourseMaterial(5, body);

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/materials', body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_16
  it('TC_COURSES_API_16: getCourseMaterials GET danh sách materials', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getCourseMaterials(5);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/materials');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_17
  it('TC_COURSES_API_17: getCourseMaterialById GET path 2 cấp đúng', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getCourseMaterialById(5, 9);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/materials/9');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_18
  it('TC_COURSES_API_18: updateCourseMaterial PUT với partial body', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateCourseMaterial(5, 9, { title: 'x' });

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/materials/9', { title: 'x' });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_19
  it('TC_COURSES_API_19: deleteCourseMaterial DELETE đúng path', async () => {
    const mockResponse = { message: 'ok', result: { message: 'deleted' } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteCourseMaterial(5, 9);

    expect(mockAxios.delete).toHaveBeenCalledWith('/courses/5/materials/9');
    expect(result).toBe(mockResponse);
  });
});

// ==================== NHÓM C — CHAPTERS ====================

describe('Nhóm C — Chapters', () => {
  // TC_COURSES_API_20
  it('TC_COURSES_API_20: addChapter POST /courses/:cid/chapters', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.post.mockResolvedValue(mockResponse);

    const body = { title: 'Chương 1', order: 1 } as any;
    const result = await addChapter(5, body);

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/chapters', body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_21
  it('TC_COURSES_API_21: getAllChapters GET /courses/:cid/chapters', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAllChapters(5);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/chapters');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_22
  it('TC_COURSES_API_22: getChapterById GET /courses/:cid/chapters/:chid', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getChapterById(5, 10);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/chapters/10');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_23
  it('TC_COURSES_API_23: updateChapter PUT nested path đúng', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.put.mockResolvedValue(mockResponse);

    const body = { title: 'Chương 1 - Updated' } as any;
    const result = await updateChapter(5, 10, body);

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/chapters/10', body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_24
  it('TC_COURSES_API_24: deleteChapter KHÔNG tự gọi cascade episodes', async () => {
    mockAxios.delete.mockResolvedValue({});

    await deleteChapter(5, 10);

    expect(mockAxios.delete).toHaveBeenCalledTimes(1);
    expect(mockAxios.delete).toHaveBeenCalledWith('/courses/5/chapters/10');
    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(mockAxios.post).not.toHaveBeenCalled();
  });
});

// ==================== NHÓM D — EPISODES ====================

describe('Nhóm D — Episodes', () => {
  // TC_COURSES_API_25
  it('TC_COURSES_API_25: addEpisode POST 3-level nested path', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.post.mockResolvedValue(mockResponse);

    const body = { title: 'Bài 1', videoUrl: 'https://example.com/video.mp4' } as any;
    const result = await addEpisode(5, 10, body);

    expect(mockAxios.post).toHaveBeenCalledWith('/courses/5/chapters/10/episodes', body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_26
  it('TC_COURSES_API_26: addEpisode thứ tự param đúng (swap test → URL sai)', async () => {
    mockAxios.post.mockResolvedValue({});

    const body = { title: 'Bài 1' } as any;
    // Swap courseId(5) và chapterId(10)
    await addEpisode(10, 5, body);

    // URL phải sai so với URL đúng
    const calledUrl = (mockAxios.post as jest.Mock).mock.calls[0][0];
    expect(calledUrl).not.toBe('/courses/5/chapters/10/episodes');
    expect(calledUrl).toBe('/courses/10/chapters/5/episodes');
  });

  // TC_COURSES_API_27
  it('TC_COURSES_API_27: getAllEpisodes GET /courses/:cid/chapters/:chid/episodes', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAllEpisodes(5, 10);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/chapters/10/episodes');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_28
  it('TC_COURSES_API_28: getEpisodeById GET /courses/:cid/chapters/:chid/episodes/:eid', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getEpisodeById(5, 10, 50);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/5/chapters/10/episodes/50');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_29
  it('TC_COURSES_API_29: updateEpisode PUT /courses/:cid/chapters/:chid/episodes/:eid', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.put.mockResolvedValue(mockResponse);

    const body = { title: 'Bài 1 Updated' } as any;
    const result = await updateEpisode(5, 10, 50, body);

    expect(mockAxios.put).toHaveBeenCalledWith('/courses/5/chapters/10/episodes/50', body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_30
  it('TC_COURSES_API_30: deleteEpisode DELETE đúng path', async () => {
    const mockResponse = { message: 'ok', result: { message: 'deleted' } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteEpisode(5, 10, 50);

    expect(mockAxios.delete).toHaveBeenCalledWith('/courses/5/chapters/10/episodes/50');
    expect(result).toBe(mockResponse);
  });
});

// ==================== NHÓM E — QUIZ QUESTIONS ====================

describe('Nhóm E — Quiz Questions', () => {
  const BASE = '/courses/5/chapters/10/episodes/50/questions';

  // TC_COURSES_API_31
  it('TC_COURSES_API_31: addQuizQuestion POST 4-level nested path', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.post.mockResolvedValue(mockResponse);

    const body = { content: '1+1=?', order: 1 } as any;
    const result = await addQuizQuestion(5, 10, 50, body);

    expect(mockAxios.post).toHaveBeenCalledWith(BASE, body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_32
  it('TC_COURSES_API_32: getAllQuestions GET 4-level path', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAllQuestions(5, 10, 50);

    expect(mockAxios.get).toHaveBeenCalledWith(BASE);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_33
  it('TC_COURSES_API_33: getQuestionById GET /.../questions/:qid', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getQuestionById(5, 10, 50, 100);

    expect(mockAxios.get).toHaveBeenCalledWith(`${BASE}/100`);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_34
  it('TC_COURSES_API_34: updateQuestion PUT với body đúng', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.put.mockResolvedValue(mockResponse);

    const body = { content: '2+2=?' } as any;
    const result = await updateQuestion(5, 10, 50, 100, body);

    expect(mockAxios.put).toHaveBeenCalledWith(`${BASE}/100`, body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_35
  it('TC_COURSES_API_35: deleteQuestion DELETE đúng path', async () => {
    const mockResponse = { message: 'ok', result: { message: 'deleted' } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteQuestion(5, 10, 50, 100);

    expect(mockAxios.delete).toHaveBeenCalledWith(`${BASE}/100`);
    expect(result).toBe(mockResponse);
  });
});

// ==================== NHÓM F — QUIZ ANSWERS ====================

describe('Nhóm F — Quiz Answers', () => {
  const BASE = '/courses/5/chapters/10/episodes/50/questions/100/answers';

  // TC_COURSES_API_36
  it('TC_COURSES_API_36: addQuizAnswer POST 5-level nested path', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.post.mockResolvedValue(mockResponse);

    const body = { content: 'A', isCorrect: true } as any;
    const result = await addQuizAnswer(5, 10, 50, 100, body);

    expect(mockAxios.post).toHaveBeenCalledWith(BASE, body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_37
  it('TC_COURSES_API_37: getAllAnswers GET 5-level path', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAllAnswers(5, 10, 50, 100);

    expect(mockAxios.get).toHaveBeenCalledWith(BASE);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_38
  it('TC_COURSES_API_38: getAnswerById GET /.../answers/:aid', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAnswerById(5, 10, 50, 100, 200);

    expect(mockAxios.get).toHaveBeenCalledWith(`${BASE}/200`);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_39
  it('TC_COURSES_API_39: updateAnswer PUT với body đúng', async () => {
    const mockResponse = { message: 'ok', result: {} };
    mockAxios.put.mockResolvedValue(mockResponse);

    const body = { content: 'B', isCorrect: false } as any;
    const result = await updateAnswer(5, 10, 50, 100, 200, body);

    expect(mockAxios.put).toHaveBeenCalledWith(`${BASE}/200`, body);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_40
  it('TC_COURSES_API_40: deleteAnswer DELETE đúng path', async () => {
    const mockResponse = { message: 'ok', result: { message: 'deleted' } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteAnswer(5, 10, 50, 100, 200);

    expect(mockAxios.delete).toHaveBeenCalledWith(`${BASE}/200`);
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_41
  it('TC_COURSES_API_41: QuizAnswer swap questionId và answerId → URL sai (guard test)', async () => {
    mockAxios.delete.mockResolvedValue({});

    // Swap questionId(100) và answerId(200)
    await deleteAnswer(5, 10, 50, 200, 100);

    const calledUrl = (mockAxios.delete as jest.Mock).mock.calls[0][0];
    // URL phải sai (questionId=200, answerId=100 thay vì 100/200)
    expect(calledUrl).not.toBe(`${BASE}/200`);
    expect(calledUrl).toBe('/courses/5/chapters/10/episodes/50/questions/200/answers/100');
  });
});

// ==================== NHÓM G — SUBJECTS / GRADE LEVELS / HOME ====================

describe('Nhóm G — Subjects / Grade Levels / Home', () => {
  // TC_COURSES_API_42
  it('TC_COURSES_API_42: getSubjects GET /subjects', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getSubjects();

    expect(mockAxios.get).toHaveBeenCalledWith('/subjects');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_43
  it('TC_COURSES_API_43: getGradeLevels GET /grade-levels', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getGradeLevels();

    expect(mockAxios.get).toHaveBeenCalledWith('/grade-levels');
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_44
  it('TC_COURSES_API_44: getFeaturedCourses default limit=8', async () => {
    const mockResponse = { message: 'ok', result: { courses: [] } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getFeaturedCourses();

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/featured/courses', { params: { limit: 8 } });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_45
  it('TC_COURSES_API_45: getFeaturedCourses custom limit=15', async () => {
    mockAxios.get.mockResolvedValue({});

    await getFeaturedCourses(15);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/featured/courses', { params: { limit: 15 } });
  });

  // TC_COURSES_API_46
  it('TC_COURSES_API_46: getCoursesBySubject GET /courses/subject/:subjectId với limit', async () => {
    const mockResponse = { message: 'ok', result: { courses: [] } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getCoursesBySubject(3, 10);

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/subject/3', { params: { limit: 10 } });
    expect(result).toBe(mockResponse);
  });

  // TC_COURSES_API_47
  it('TC_COURSES_API_47: getPlatformStats GET /courses/stats/platform', async () => {
    const mockResponse = { message: 'ok', result: { totalCourses: 10, totalStudents: 100, totalTeachers: 5, totalEpisodes: 200 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getPlatformStats();

    expect(mockAxios.get).toHaveBeenCalledWith('/courses/stats/platform');
    expect(result).toBe(mockResponse);
  });
});

// ==================== NHÓM H — ERROR PROPAGATION ====================

describe('Nhóm H — Error Propagation', () => {
  // TC_COURSES_API_48
  it('TC_COURSES_API_48: 401 Unauthorized propagate nguyên vẹn', async () => {
    const error401 = { status: 401, message: 'Unauthorized' };
    mockAxios.get.mockRejectedValue(error401);

    await expect(getPendingCourses()).rejects.toEqual(error401);
  });

  // TC_COURSES_API_49
  it('TC_COURSES_API_49: 403 Forbidden (Student gọi createCourse)', async () => {
    const error403 = { status: 403, message: 'Forbidden' };
    mockAxios.post.mockRejectedValue(error403);

    await expect(createCourse({} as any)).rejects.toEqual(error403);
  });

  // TC_COURSES_API_50
  it('TC_COURSES_API_50: 404 Not Found (getCourseById id không tồn tại)', async () => {
    const error404 = { status: 404, message: 'Not Found' };
    mockAxios.get.mockRejectedValue(error404);

    await expect(getCourseById(9999)).rejects.toEqual(error404);
  });

  // TC_COURSES_API_51
  it('TC_COURSES_API_51: 500 Server Error không bị swallow', async () => {
    const error500 = { status: 500, message: 'Internal Server Error' };
    mockAxios.get.mockRejectedValue(error500);

    await expect(getApprovedCourses()).rejects.toEqual(error500);
  });

  // TC_COURSES_API_52
  it('TC_COURSES_API_52: Network error (ECONNREFUSED) reject với message', async () => {
    const networkError = new Error('Network error. Please check your connection.');
    mockAxios.get.mockRejectedValue(networkError);

    await expect(getSubjects()).rejects.toThrow('Network error');
  });
});

// ==================== NHÓM I — BEHAVIORAL CONTRACT ====================

describe('Nhóm I — Behavioral Contract', () => {
  // TC_COURSES_API_53
  it('TC_COURSES_API_53: wrapper KHÔNG transform response (passthrough)', async () => {
    const rawResponse = { message: 'success', result: [{ id: 1 }] };
    mockAxios.get.mockResolvedValue(rawResponse);

    const result = await getPendingCourses();

    expect(result).toBe(rawResponse);
  });

  // TC_COURSES_API_54
  it('TC_COURSES_API_54: wrapper KHÔNG retry tự động — gọi đúng 1 lần', async () => {
    const error = { status: 500 };
    mockAxios.get.mockRejectedValue(error);

    await expect(getCourseById(1)).rejects.toEqual(error);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  // TC_COURSES_API_55
  it('TC_COURSES_API_55: getApprovedCourses truyền params object đúng cho axios serialize', async () => {
    const mockResponse = { message: 'ok', result: { courses: [], total: 0, page: 2, limit: 5, totalPages: 1 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const params = { page: 2, limit: 5, sortBy: 'title', order: 'ASC' as const };
    await getApprovedCourses(params);

    const [, config] = (mockAxios.get as jest.Mock).mock.calls[0];
    expect(config).toEqual({ params });
    expect(config.params.page).toBe(2);
    expect(config.params.limit).toBe(5);
    expect(config.params.sortBy).toBe('title');
    expect(config.params.order).toBe('ASC');
  });
});
