/**
 * STT 19 — Unit tests for elearning-frontend/src/apis/exams.ts
 * 39 test cases covering CRUD operations, nested resources, and error handling
 */

// ── Mock phải đứng TRÊN tất cả import ─────────────────────────
jest.mock("@/config/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────
import axiosRequest from "@/config/axios";
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  createExamQuestion,
  getExamQuestions,
  updateExamQuestion,
  deleteExamQuestion,
  createExamAnswer,
  getQuestionAnswers,
  updateExamAnswer,
  deleteExamAnswer,
  getExamLeaderboard,
  startExamAttempt,
  submitExamAttempt,
  getMyExamAttempt,
} from "@/apis/exams";

const mockAxios = axiosRequest as jest.Mocked<typeof axiosRequest>;

beforeEach(() => jest.clearAllMocks());

// ── Nhóm A — EXAMS CRUD ────────────────────────────────────────
describe("Nhóm A — EXAMS CRUD", () => {
  it("TC_EXAMS_API_01: getExams không params → GET /exams", async () => {
    const mockResponse = { message: "ok", result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getExams();

    expect(mockAxios.get).toHaveBeenCalledWith("/exams", { params: undefined });
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_02: getExams params đủ 3 (page, limit, status)", async () => {
    const params = { page: 1, limit: 10, status: "LIVE" as any };
    const mockResponse = { message: "ok", result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getExams(params);

    expect(mockAxios.get).toHaveBeenCalledWith("/exams", { params });
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_03: getExamById encode id đúng", async () => {
    const mockResponse = { message: "ok", result: { id: 42 } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getExamById(42);

    expect(mockAxios.get).toHaveBeenCalledWith("/exams/42");
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_04: getExamById id=0 → URL /exams/0 không fallback", async () => {
    const mockResponse = { message: "ok", result: null };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getExamById(0);

    expect(mockAxios.get).toHaveBeenCalledWith("/exams/0");
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_05: createExam POST /exams body đúng", async () => {
    const body = {
      title: "Thi HK1",
      description: "Kỳ thi học kỳ 1",
      duration: 60,
    };
    const mockResponse = { message: "ok", result: { id: 42, ...body } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createExam(body as any);

    expect(mockAxios.post).toHaveBeenCalledWith("/exams", body);
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_06: createExam input không bị mutate", async () => {
    const body = {
      title: "Thi HK1",
      description: "Test",
      duration: 60,
    };
    const bodyCopy = JSON.parse(JSON.stringify(body));
    mockAxios.post.mockResolvedValue({ message: "ok", result: { id: 42 } });

    await createExam(body as any);

    expect(body).toEqual(bodyCopy);
  });

  it("TC_EXAMS_API_07: updateExam PUT /exams/:id", async () => {
    const updateData = { title: "new title" };
    const mockResponse = { message: "ok", result: { id: 42, title: "new title" } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateExam(42, updateData as any);

    expect(mockAxios.put).toHaveBeenCalledWith("/exams/42", updateData);
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_08: deleteExam DELETE /exams/:id", async () => {
    const mockResponse = { message: "ok", result: { message: "Deleted" } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteExam(42);

    expect(mockAxios.delete).toHaveBeenCalledWith("/exams/42");
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_09: deleteExam 409 khi đã có attempt → propagate", async () => {
    const error = { response: { status: 409 } };
    mockAxios.delete.mockRejectedValue(error);

    await expect(deleteExam(42)).rejects.toEqual(error);
    expect(mockAxios.delete).toHaveBeenCalledWith("/exams/42");
  });
});

// ── Nhóm B — EXAM QUESTIONS ────────────────────────────────────
describe("Nhóm B — EXAM QUESTIONS", () => {
  it("TC_EXAMS_API_10: createExamQuestion POST URL đúng, body KHÔNG chứa examId", async () => {
    const data = {
      examId: 42,
      content: "1+1?",
      order: 1,
    };
    const mockResponse = { message: "ok", result: { id: 100, content: "1+1?" } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createExamQuestion(data);

    expect(mockAxios.post).toHaveBeenCalledWith("/exams/42/questions", {
      content: "1+1?",
      order: 1,
    });
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_11: createExamQuestion destructure loại bỏ examId, các field khác giữ nguyên", async () => {
    const data = {
      examId: 42,
      content: "x",
      imageUrl: "u",
      order: 1,
    };
    const mockResponse = { message: "ok", result: {} };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createExamQuestion(data);

    const callArgs = mockAxios.post.mock.calls[0];
    expect(callArgs[0]).toBe("/exams/42/questions");
    expect(callArgs[1]).toHaveProperty("content", "x");
    expect(callArgs[1]).toHaveProperty("imageUrl", "u");
    expect(callArgs[1]).toHaveProperty("order", 1);
    expect(callArgs[1]).not.toHaveProperty("examId");
  });

  it("TC_EXAMS_API_12: getExamQuestions gọi getExamById rồi extract .result.questions", async () => {
    const questions = [{ id: 100, content: "Q1" }];
    const mockExamResponse = {
      message: "ok",
      result: { id: 42, questions },
    };
    mockAxios.get.mockResolvedValue(mockExamResponse);

    const result = await getExamQuestions(42);

    expect(mockAxios.get).toHaveBeenCalledWith("/exams/42");
    expect(result.result).toEqual(questions);
  });

  it("TC_EXAMS_API_13: getExamQuestions exam không có questions → trả []", async () => {
    const mockExamResponse = {
      message: "ok",
      result: {},
    };
    mockAxios.get.mockResolvedValue(mockExamResponse);

    const result = await getExamQuestions(42);

    expect(result.result).toEqual([]);
  });

  it("TC_EXAMS_API_14: updateExamQuestion PUT nested 2 cấp", async () => {
    const updateData = { content: "new" };
    const mockResponse = { message: "ok", result: { id: 100, content: "new" } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateExamQuestion(42, 100, updateData);

    expect(mockAxios.put).toHaveBeenCalledWith(
      "/exams/42/questions/100",
      updateData
    );
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_15: deleteExamQuestion DELETE nested", async () => {
    const mockResponse = { message: "ok", result: { message: "Deleted" } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteExamQuestion(42, 100);

    expect(mockAxios.delete).toHaveBeenCalledWith("/exams/42/questions/100");
    expect(result).toEqual(mockResponse);
  });
});

// ── Nhóm C — EXAM ANSWERS (3 cấp nested) ───────────────────────
describe("Nhóm C — EXAM ANSWERS (3 cấp nested)", () => {
  it("TC_EXAMS_API_16: createExamAnswer body loại bỏ examId VÀ questionId", async () => {
    const data = {
      examId: 42,
      questionId: 100,
      content: "A",
      isCorrect: true,
    };
    const mockResponse = { message: "ok", result: { id: 200 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createExamAnswer(data);

    expect(mockAxios.post).toHaveBeenCalledWith(
      "/exams/42/questions/100/answers",
      {
        content: "A",
        isCorrect: true,
      }
    );
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_17: createExamAnswer isCorrect=false vẫn được gửi đúng type", async () => {
    const data = {
      examId: 42,
      questionId: 100,
      content: "B",
      isCorrect: false,
    };
    const mockResponse = { message: "ok", result: { id: 201 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createExamAnswer(data);

    const callArgs = mockAxios.post.mock.calls[0];
    expect((callArgs[1] as any).isCorrect).toBe(false);
    expect(typeof (callArgs[1] as any).isCorrect).toBe("boolean");
    expect((callArgs[1] as any).isCorrect).not.toBeTruthy();
  });

  it("TC_EXAMS_API_18: getQuestionAnswers tìm đúng question rồi trả answers", async () => {
    const answers = [
      { id: 200, content: "A" },
      { id: 201, content: "B" },
    ];
    const mockExamResponse = {
      message: "ok",
      result: {
        id: 42,
        questions: [
          { id: 100, answers },
          { id: 101, answers: [] },
        ],
      },
    };
    mockAxios.get.mockResolvedValue(mockExamResponse);

    const result = await getQuestionAnswers(42, 100);

    expect(result.result).toEqual(answers);
  });

  it("TC_EXAMS_API_19: getQuestionAnswers question không tồn tại → trả []", async () => {
    const mockExamResponse = {
      message: "ok",
      result: {
        id: 42,
        questions: [{ id: 999, answers: [] }],
      },
    };
    mockAxios.get.mockResolvedValue(mockExamResponse);

    const result = await getQuestionAnswers(42, 100);

    expect(result.result).toEqual([]);
  });

  it("TC_EXAMS_API_20: updateExamAnswer URL 3 cấp đúng", async () => {
    const updateData = { content: "B" };
    const mockResponse = { message: "ok", result: { id: 200, content: "B" } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateExamAnswer(42, 100, 200, updateData);

    expect(mockAxios.put).toHaveBeenCalledWith(
      "/exams/42/questions/100/answers/200",
      updateData
    );
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_21: deleteExamAnswer URL 3 cấp đúng", async () => {
    const mockResponse = { message: "ok", result: { message: "Deleted" } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteExamAnswer(42, 100, 200);

    expect(mockAxios.delete).toHaveBeenCalledWith(
      "/exams/42/questions/100/answers/200"
    );
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_22: Nested swap guard swap examId ↔ questionId", async () => {
    const mockResponse = { message: "ok", result: { message: "Deleted" } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    // Gọi với exam=100, question=42, answer=200 (swapped)
    await deleteExamAnswer(100, 42, 200);

    const callUrl = mockAxios.delete.mock.calls[0][0];
    expect(callUrl).toBe("/exams/100/questions/42/answers/200");
  });
});

// ── Nhóm D — EXAM LEADERBOARD ──────────────────────────────────
describe("Nhóm D — EXAM LEADERBOARD", () => {
  it("TC_EXAMS_API_23: getExamLeaderboard GET /exams/:id/leaderboard", async () => {
    const mockResponse = {
      message: "ok",
      result: [
        { userId: 1, score: 100 },
        { userId: 2, score: 95 },
      ],
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getExamLeaderboard(42);

    expect(mockAxios.get).toHaveBeenCalledWith("/exams/42/leaderboard");
    expect(result).toEqual(mockResponse);
  });

  it("TC_EXAMS_API_24: getExamLeaderboard rỗng (chưa ai làm) → []", async () => {
    const mockResponse = { message: "ok", result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getExamLeaderboard(42);

    expect(result.result).toEqual([]);
    expect(result.result).not.toBeNull();
  });

  it("TC_EXAMS_API_25: getExamLeaderboard KHÔNG cache — gọi 2 lần → 2 request", async () => {
    const mockResponse = { message: "ok", result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    await getExamLeaderboard(42);
    await getExamLeaderboard(42);

    expect(mockAxios.get).toHaveBeenCalledTimes(2);
    expect(mockAxios.get).toHaveBeenCalledWith("/exams/42/leaderboard");
  });
});

// ── Nhóm E — EXAM ATTEMPTS (Student lifecycle) ─────────────────
describe("Nhóm E — EXAM ATTEMPTS (Student lifecycle)", () => {
  describe("startExamAttempt", () => {
    it("TC_EXAMS_API_26: startExamAttempt POST không body", async () => {
      const mockResponse = {
        message: "ok",
        result: { attemptId: 999, startedAt: "2026-04-19" },
      };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await startExamAttempt(42);

      expect(mockAxios.post).toHaveBeenCalledWith("/exams/42/attempts/start");
      expect(mockAxios.post).toHaveBeenCalledWith("/exams/42/attempts/start");
      expect(result).toEqual(mockResponse);
    });

    it("TC_EXAMS_API_27: startExamAttempt response attemptId được preserve", async () => {
      const mockResponse = {
        message: "ok",
        result: { attemptId: 999, startedAt: "2026-04-19" },
      };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await startExamAttempt(42);

      expect(result.result.attemptId).toBe(999);
      expect(result.result.startedAt).toBe("2026-04-19");
    });

    it("TC_EXAMS_API_28: startExamAttempt 409 khi exam CLOSED → propagate", async () => {
      const error = { response: { status: 409 } };
      mockAxios.post.mockRejectedValue(error);

      await expect(startExamAttempt(42)).rejects.toEqual(error);
    });
  });

  describe("submitExamAttempt", () => {
    it("TC_EXAMS_API_29: submitExamAttempt URL đúng format /attempts/:attemptId/submit", async () => {
      const answers = { 1: 10 };
      const mockResponse = { message: "ok", result: { score: 100 } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await submitExamAttempt(42, 999, answers);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/exams/42/attempts/999/submit",
        { responsesJson: answers }
      );
      expect(result).toEqual(mockResponse);
    });

    it("TC_EXAMS_API_30: submitExamAttempt body wrap answers trong key responsesJson", async () => {
      const answers = { 1: 10, 2: 20 };
      const mockResponse = { message: "ok", result: {} };
      mockAxios.post.mockResolvedValue(mockResponse);

      await submitExamAttempt(42, 999, answers);

      const callArgs = mockAxios.post.mock.calls[0];
      expect(callArgs[1]).toEqual({ responsesJson: answers });
    });

    it("TC_EXAMS_API_31: submitExamAttempt answers nguyên vẹn, KHÔNG re-order key", async () => {
      const answers = { 3: 30, 1: 10, 2: 20 };
      const mockResponse = { message: "ok", result: {} };
      mockAxios.post.mockResolvedValue(mockResponse);

      await submitExamAttempt(42, 999, answers);

      const callArgs = mockAxios.post.mock.calls[0];
      expect((callArgs[1] as any).responsesJson).toEqual(answers);
    });

    it("TC_EXAMS_API_32: submitExamAttempt answers rỗng {} vẫn gửi", async () => {
      const answers = {};
      const mockResponse = { message: "ok", result: {} };
      mockAxios.post.mockResolvedValue(mockResponse);

      await submitExamAttempt(42, 999, answers);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/exams/42/attempts/999/submit",
        { responsesJson: {} }
      );
    });

    it("TC_EXAMS_API_33: submitExamAttempt 400 exam CLOSED → propagate", async () => {
      const error = { response: { status: 400 } };
      mockAxios.post.mockRejectedValue(error);

      await expect(submitExamAttempt(42, 999, { 1: 10 })).rejects.toEqual(error);
    });

    it("TC_EXAMS_API_34: submitExamAttempt gọi 2 lần KHÔNG dedupe", async () => {
      const mockResponse = { message: "ok", result: {} };
      mockAxios.post.mockResolvedValue(mockResponse);

      await submitExamAttempt(42, 999, { 1: 10 });
      await submitExamAttempt(42, 999, { 1: 10 });

      expect(mockAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe("getMyExamAttempt", () => {
    it("TC_EXAMS_API_35: getMyExamAttempt GET /exams/:id/attempts/my-attempt", async () => {
      const mockResponse = {
        message: "ok",
        result: { attemptId: 999, status: "in-progress" },
      };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getMyExamAttempt(42);

      expect(mockAxios.get).toHaveBeenCalledWith("/exams/42/attempts/my-attempt");
      expect(result).toEqual(mockResponse);
    });

    it("TC_EXAMS_API_36: getMyExamAttempt 404 khi chưa bắt đầu → propagate", async () => {
      const error = { response: { status: 404 } };
      mockAxios.get.mockRejectedValue(error);

      await expect(getMyExamAttempt(42)).rejects.toEqual(error);
    });
  });
});

// ── Nhóm F — ERROR & BEHAVIORAL CONTRACT ───────────────────────
describe("Nhóm F — ERROR & BEHAVIORAL CONTRACT", () => {
  it("TC_EXAMS_API_37: 401 Unauthorized propagate chung", async () => {
    const error = {
      response: { status: 401, data: { message: "Unauthorized" } },
    };
    mockAxios.get.mockRejectedValue(error);

    await expect(getExams()).rejects.toEqual(error);
    expect(mockAxios.get).toHaveBeenCalledWith("/exams", { params: undefined });
  });

  it("TC_EXAMS_API_38: Network error (ECONNREFUSED) propagate", async () => {
    const error = new Error("ECONNREFUSED");
    mockAxios.post.mockRejectedValue(error);

    await expect(startExamAttempt(42)).rejects.toEqual(error);
  });

  it("TC_EXAMS_API_39: getExamQuestions depends on getExamById — nếu BE trả 500 thì chain reject", async () => {
    const error = { response: { status: 500 } };
    mockAxios.get.mockRejectedValue(error);

    await expect(getExamQuestions(42)).rejects.toEqual(error);
  });
});
