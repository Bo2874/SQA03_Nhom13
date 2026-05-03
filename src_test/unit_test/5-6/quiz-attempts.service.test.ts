import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { QuizAttemptsService } from "../../../../src_code/elearning-backend/src/modules/quiz-attempts/quiz-attempts.service";
import * as Entities from "../../../../src_code/elearning-backend/src/entities";
import { CreateQuizAttemptDto } from "../../../../src_code/elearning-backend/src/modules/quiz-attempts/dto/create-quiz-attempt.dto";
import { EpisodeType } from "../../../../src_code/elearning-backend/src/entities/episode.entity";
import { EnrollmentStatus } from "../../../../src_code/elearning-backend/src/entities/enrollment.entity";
import { UserRole } from "../../../../src_code/elearning-backend/src/entities/user.entity";
import { CourseStatus } from "../../../../src_code/elearning-backend/src/entities/course.entity";

describe("Kiểm thử tích hợp QuizAttemptsService (STT05) - Kết nối Database thực tế", () => {
  let service: QuizAttemptsService;
  let dataSource: DataSource;
  // Khai báo các Repository để thao tác trực tiếp với Database trong quá trình test
  let quizAttemptRepo: Repository<Entities.QuizAttempt>;
  let episodeRepo: Repository<Entities.Episode>;
  let enrollmentRepo: Repository<Entities.Enrollment>;
  let questionRepo: Repository<Entities.QuizQuestion>;
  let answerRepo: Repository<Entities.QuizAnswer>;
  let userRepo: Repository<Entities.User>;
  let courseRepo: Repository<Entities.Course>;
  let chapterRepo: Repository<Entities.Chapter>;

  // Khởi tạo môi trường kiểm thử tích hợp (Integration Test) trước khi thực thi toàn bộ suite
  beforeAll(async () => {
    // Khởi tạo module kiểm thử của NestJS với các cấu hình cần thiết
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // Thiết lập kết nối cơ sở dữ liệu MySQL thực tế chạy trên môi trường Docker (port 3307)
        TypeOrmModule.forRoot({
          type: "mysql",
          host: "127.0.0.1",
          port: 3307,
          username: "root",
          password: "1234",
          database: "elearning",
          // Đăng ký toàn bộ danh sách Entity vào TypeORM
          entities: Object.values(Entities),
          // Vô hiệu hóa synchronize để tránh thay đổi schema tự động
          synchronize: false,
        }),
        // Đăng ký các Repository của Entity vào module để inject vào service
        TypeOrmModule.forFeature(Object.values(Entities)),
      ],
      // Khai báo service cần kiểm thử chính
      providers: [QuizAttemptsService],
    }).compile();

    // Lấy instance của QuizAttemptsService từ module đã biên dịch
    service = module.get<QuizAttemptsService>(QuizAttemptsService);
    // Lấy instance của DataSource để thực thi các câu lệnh SQL trực tiếp
    dataSource = module.get<DataSource>(DataSource);
    // Khởi tạo các Repository tương ứng với từng bảng trong database để thao tác dữ liệu
    quizAttemptRepo = module.get<Repository<Entities.QuizAttempt>>(
      getRepositoryToken(Entities.QuizAttempt),
    );
    episodeRepo = module.get<Repository<Entities.Episode>>(
      getRepositoryToken(Entities.Episode),
    );
    enrollmentRepo = module.get<Repository<Entities.Enrollment>>(
      getRepositoryToken(Entities.Enrollment),
    );
    questionRepo = module.get<Repository<Entities.QuizQuestion>>(
      getRepositoryToken(Entities.QuizQuestion),
    );
    answerRepo = module.get<Repository<Entities.QuizAnswer>>(
      getRepositoryToken(Entities.QuizAnswer),
    );
    userRepo = module.get<Repository<Entities.User>>(
      getRepositoryToken(Entities.User),
    );
    courseRepo = module.get<Repository<Entities.Course>>(
      getRepositoryToken(Entities.Course),
    );
    chapterRepo = module.get<Repository<Entities.Chapter>>(
      getRepositoryToken(Entities.Chapter),
    );

    // Khởi tạo Virtual Column 'courseId' trong bảng chapters để hỗ trợ logic truy vấn của service
    try {
      await dataSource.query(
        "ALTER TABLE chapters ADD COLUMN courseId INT AS (course_id) VIRTUAL",
      );
    } catch (e) {}
    // Khởi tạo Virtual Column 'episodeId' trong bảng quiz_attempts để hỗ trợ mapping quan hệ
    try {
      await dataSource.query(
        "ALTER TABLE quiz_attempts ADD COLUMN episodeId INT AS (episode_id) VIRTUAL",
      );
    } catch (e) {}

    // Mock phương thức log của Logger để không in log nghiệp vụ ra terminal trong quá trình test
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    // Mock phương thức warn của Logger để giữ terminal sạch sẽ
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
  });

  // Giải phóng tài nguyên và dọn dẹp cấu trúc sau khi hoàn thành suite
  afterAll(async () => {
    // Xóa Virtual Column courseId để trả schema về trạng thái ban đầu
    try {
      await dataSource.query("ALTER TABLE chapters DROP COLUMN courseId");
    } catch (e) {}
    // Xóa Virtual Column episodeId để đảm bảo tính toàn vẹn của database
    try {
      await dataSource.query("ALTER TABLE quiz_attempts DROP COLUMN episodeId");
    } catch (e) {}
    // Ngắt kết nối với cơ sở dữ liệu
    if (dataSource) await dataSource.destroy();
  });

  // Hàm thực hiện dọn dẹp dữ liệu (Truncate) trong các bảng liên quan để đảm bảo tính độc lập giữa các ca kiểm thử
  async function cleanUp() {
    // Vô hiệu hóa kiểm tra ràng buộc khóa ngoại để cho phép thực hiện TRUNCATE
    await dataSource.query("SET FOREIGN_KEY_CHECKS = 0");
    // Xóa sạch dữ liệu trong bảng quiz_attempts
    await quizAttemptRepo.query("TRUNCATE TABLE quiz_attempts");
    // Xóa sạch dữ liệu trong bảng enrollments
    await enrollmentRepo.query("TRUNCATE TABLE enrollments");
    // Xóa sạch dữ liệu trong bảng quiz_answers
    await answerRepo.query("TRUNCATE TABLE quiz_answers");
    // Xóa sạch dữ liệu trong bảng quiz_questions
    await questionRepo.query("TRUNCATE TABLE quiz_questions");
    // Xóa sạch dữ liệu trong bảng episodes
    await episodeRepo.query("TRUNCATE TABLE episodes");
    // Xóa sạch dữ liệu trong bảng chapters
    await chapterRepo.query("TRUNCATE TABLE chapters");
    // Xóa sạch dữ liệu trong bảng courses
    await courseRepo.query("TRUNCATE TABLE courses");
    // Xóa các bản ghi người dùng được tạo trong quá trình test (dựa trên email pattern)
    await userRepo.query("DELETE FROM users WHERE email LIKE 'test_%'");
    // Tái kích hoạt kiểm tra ràng buộc khóa ngoại
    await dataSource.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  // Thực hiện dọn dẹp database trước mỗi ca kiểm thử đơn lẻ
  beforeEach(async () => {
    await cleanUp();
  });

  // Hàm khởi tạo dữ liệu nền (Seeding) cần thiết cho các nghiệp vụ kiểm thử
  async function seedBaseData() {
    // Tạo bản ghi người dùng với vai trò TEACHER
    const teacher = await userRepo.save(
      userRepo.create({
        fullName: "Test Teacher",
        email: "test_t@x.com",
        passwordHash: "h",
        role: UserRole.TEACHER,
      } as any),
    );
    // Tạo bản ghi người dùng với vai trò STUDENT
    const student = await userRepo.save(
      userRepo.create({
        fullName: "Test Student",
        email: "test_s@x.com",
        passwordHash: "h",
        role: UserRole.STUDENT,
      } as any),
    );

    // Cập nhật lại trường full_name cho Student bằng SQL trực tiếp để tránh lỗi đồng bộ của TypeORM
    await userRepo.query(
      "UPDATE users SET full_name = 'Test Student' WHERE email = 'test_s@x.com'",
    );
    // Cập nhật lại trường full_name cho Teacher đảm bảo dữ liệu khớp với logic kiểm tra
    await userRepo.query(
      "UPDATE users SET full_name = 'Test Teacher' WHERE email = 'test_t@x.com'",
    );

    // Tạo bản ghi khóa học (Course) liên kết với giáo viên vừa tạo
    const course = await courseRepo.save(
      courseRepo.create({
        title: "C",
        status: CourseStatus.PUBLISHED,
        teacher,
      }),
    );
    // Tạo chương (Chapter) thuộc khóa học
    const chapter = await chapterRepo.save(
      chapterRepo.create({ title: "Ch", course, order: 1 }),
    );
    // Tạo bài học dạng bài kiểm tra (Episode type QUIZ) thuộc chương vừa tạo
    const episode = await episodeRepo.save(
      episodeRepo.create({
        title: "Q",
        type: EpisodeType.QUIZ,
        chapter,
        order: 1,
      }),
    );

    // Tạo bản ghi đăng ký khóa học (Enrollment) cho sinh viên với trạng thái ACTIVE
    await enrollmentRepo.save(
      enrollmentRepo.create({
        student,
        course,
        status: EnrollmentStatus.ACTIVE,
      }),
    );
    // Trả về đối tượng chứa thông tin dữ liệu đã tạo để các TC sử dụng
    return { student, course, episode, chapter };
  }

  describe("Kiểm thử chức năng nộp bài (submitQuiz)", () => {
    // NHÓM TEST: Kiểm tra các ràng buộc đầu vào (Validation & Guards)

    // TC_STT05_SUBMIT_01: Kiểm tra ID bài học không tồn tại
    // Mục tiêu: Đảm bảo phương thức submitQuiz trả về lỗi 404 khi episodeId không tồn tại trong database
    // Input: studentId=1, episodeId=999 (giả định không tồn tại), responsesJson={}
    // Expected: Ném ngoại lệ NotFoundException từ service
    it("TC_STT05_SUBMIT_01: Kiểm tra trường hợp bài học không tồn tại trong hệ thống", async () => {
      // Gọi phương thức submitQuiz với episodeId giả định là 999 và kiểm tra ngoại lệ NotFoundException được ném ra từ Promise
      await expect(
        service.submitQuiz({ studentId: 1, episodeId: 999, responsesJson: {} }),
      ).rejects.toThrow(NotFoundException);
    });

    // TC_STT05_SUBMIT_02: Kiểm tra ràng buộc về loại nội dung (EpisodeType)
    // Mục tiêu: Chỉ cho phép thực hiện nộp bài đối với các Episode có kiểu là QUIZ
    // Input: Episode được chuyển đổi type từ QUIZ sang VIDEO bằng lệnh update trực tiếp
    // Expected: Ném ngoại lệ BadRequestException do loại nội dung không hợp lệ cho nghiệp vụ nộp bài
    it("TC_STT05_SUBMIT_02: Ngăn chặn nộp bài nếu bài học không phải là dạng bài kiểm tra (Quiz)", async () => {
      // Thực hiện hàm seedBaseData để khởi tạo các thực thể student, course, chapter, episode và enrollment vào cơ sở dữ liệu
      const { student, episode } = await seedBaseData();
      // Sử dụng episodeRepo để thực hiện lệnh SQL UPDATE cập nhật trường type của bản ghi episode sang VIDEO
      await episodeRepo.update(episode.id, { type: EpisodeType.VIDEO });
      // Gọi phương thức submitQuiz và kiểm chứng việc ném ngoại lệ BadRequestException do vi phạm ràng buộc về loại bài học
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // TC_STT05_SUBMIT_03: Kiểm tra ràng buộc về quyền truy cập (Enrollment Guard)
    // Mục tiêu: Đảm bảo sinh viên phải có bản ghi ghi danh (Enrollment) hợp lệ mới được thực hiện nộp bài
    // Input: Xóa toàn bộ bản ghi trong bảng enrollments sau khi đã seed dữ liệu
    // Expected: Ném ngoại lệ ForbiddenException do vi phạm quyền truy cập
    it("TC_STT05_SUBMIT_03: Kiểm tra quyền làm bài của sinh viên chưa đăng ký khóa học", async () => {
      // Khởi tạo dữ liệu nền bao gồm đầy đủ các thực thể quan hệ thông qua hàm seedBaseData
      const { student, episode } = await seedBaseData();
      // Thực hiện lệnh SQL DELETE trực tiếp thông qua enrollmentRepo để xóa toàn bộ dữ liệu trong bảng enrollments
      await enrollmentRepo.query("DELETE FROM enrollments");
      // Gọi phương thức submitQuiz và kiểm chứng ngoại lệ ForbiddenException được ném ra do thiếu bản ghi Enrollment hợp lệ
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: {},
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    // TC_STT05_SUBMIT_04: Kiểm tra ràng buộc về số lần thực hiện (Single Attempt Limit)
    // Mục tiêu: Hệ thống chỉ cho phép mỗi sinh viên nộp bài tối đa một lần cho mỗi Episode
    it("TC_STT05_SUBMIT_04: Ngăn chặn sinh viên làm lại bài kiểm tra đã hoàn thành trước đó", async () => {
      // Khởi tạo dữ liệu cơ bản cần thiết cho quy trình kiểm thử thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Sử dụng quizAttemptRepo để khởi tạo và lưu một bản ghi QuizAttempt giả lập sinh viên đã hoàn thành bài thi
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 0 }),
      );
      // Thực hiện gọi phương thức submitQuiz và kiểm chứng ngoại lệ BadRequestException được ném ra do đã tồn tại bản ghi lượt làm bài
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // TC_STT05_SUBMIT_05: Kiểm tra ràng buộc về nội dung Quiz (Empty Quiz Guard)
    // Mục tiêu: Đảm bảo hệ thống không cho phép nộp bài nếu Quiz chưa được cấu hình câu hỏi
    // Input: Episode hợp lệ, Enrollment hợp lệ nhưng bảng quiz_questions trống
    // Expected: Ném ngoại lệ BadRequestException
    it("TC_STT05_SUBMIT_05: Kiểm tra trường hợp bài kiểm tra không có câu hỏi nào", async () => {
      // Khởi tạo thực thể student, course, chapter và episode bằng hàm seedBaseData
      const { student, episode } = await seedBaseData();
      // Gọi trực tiếp phương thức submitQuiz khi chưa thực hiện lưu bất kỳ bản ghi nào vào bảng quiz_questions
      // Kiểm chứng việc ném ngoại lệ BadRequestException từ service do danh sách câu hỏi rỗng
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // TC_STT05_SUBMIT_06: Kiểm tra tính đầy đủ của tập dữ liệu câu trả lời (Data Integrity Guard)
    // Mục tiêu: Đảm bảo sinh viên không được để trống bất kỳ câu hỏi nào có trong Quiz
    // Input: Quiz có 2 câu hỏi nhưng responsesJson chỉ chứa 1 câu trả lời
    // Expected: Ném ngoại lệ BadRequestException kèm thông báo 'Missing answers'
    it("TC_STT05_SUBMIT_06: Kiểm tra trường hợp sinh viên nộp bài nhưng thiếu câu trả lời", async () => {
      // Khởi tạo dữ liệu nền thông qua phương thức seedBaseData
      const { student, episode } = await seedBaseData();
      // Lưu thực thể câu hỏi thứ nhất (Q1) vào cơ sở dữ liệu thông qua questionRepo
      await questionRepo.save(
        questionRepo.create({ content: "Q1", episode, order: 1 }),
      );
      // Lưu thực thể câu hỏi thứ hai (Q2) vào cơ sở dữ liệu thông qua questionRepo
      await questionRepo.save(
        questionRepo.create({ content: "Q2", episode, order: 2 }),
      );
      // Thực hiện gọi hàm submitQuiz với responsesJson chỉ chứa đáp án cho 1 câu hỏi và kiểm tra lỗi ném ra khớp với chuỗi 'Missing answers'
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: { 1: 1 },
        }),
      ).rejects.toThrow(/Missing answers/);
    });

    // TC_STT05_SUBMIT_07: Kiểm tra tính hợp lệ của mã định danh câu hỏi (Foreign Key Validation)
    // Mục tiêu: Ngăn chặn việc gửi lên các ID câu hỏi không thuộc về Episode đang thực hiện
    // Input: responsesJson chứa một mã câu hỏi rác (ID=999)
    // Expected: Ném ngoại lệ BadRequestException kèm thông báo 'Invalid question IDs'
    it("TC_STT05_SUBMIT_07: Kiểm tra tính hợp lệ của các mã câu hỏi gửi lên hệ thống", async () => {
      // Khởi tạo dữ liệu cơ bản thông qua phương thức seedBaseData
      const { student, episode } = await seedBaseData();
      // Lưu một thực thể câu hỏi hợp lệ vào bảng quiz_questions
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu một thực thể đáp án hợp lệ liên kết với câu hỏi vừa tạo vào bảng quiz_answers
      const a = await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Gọi hàm submitQuiz với responsesJson chứa một ID câu hỏi không tồn tại (999) và xác nhận ngoại lệ khớp với chuỗi 'Invalid question IDs'
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: { [q.id]: a.id, 999: 1 },
        }),
      ).rejects.toThrow(/Invalid question IDs/);
    });

    // TC_STT05_SUBMIT_08: Kiểm tra cấu hình logic nghiệp vụ của hệ thống (Business Rule Validation)
    // Mục tiêu: Đảm bảo Quiz không thể tính điểm nếu hệ thống chưa thiết lập ít nhất một đáp án đúng
    // Input: Câu hỏi chỉ chứa các đáp án có thuộc tính isCorrect = false
    // Expected: Ném ngoại lệ BadRequestException kèm thông báo 'no correct answer'
    it("TC_STT05_SUBMIT_08: Kiểm tra trường hợp câu hỏi chưa được cấu hình đáp án đúng", async () => {
      // Khởi tạo dữ liệu nền (student, course, episode) vào database
      const { student, episode } = await seedBaseData();
      // Tạo thực thể câu hỏi mẫu gán cho episode hiện tại
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu thực thể đáp án vào DB nhưng đặt thuộc tính isCorrect là false để tạo điều kiện lỗi nghiệp vụ
      await answerRepo.save(
        answerRepo.create({
          content: "W",
          isCorrect: false,
          question: q,
          order: 1,
        }),
      );
      // Thực hiện nộp bài và kiểm chứng hệ thống ném ngoại lệ BadRequestException kèm thông báo 'no correct answer'
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: { [q.id]: 1 },
        }),
      ).rejects.toThrow(/no correct answer/);
    });

    // TC_STT05_SUBMIT_09: Kiểm tra tính xác thực của mã định danh đáp án (Reference Validation)
    // Mục tiêu: Đảm bảo sinh viên chỉ được chọn các đáp án tồn tại trong cơ sở dữ liệu
    // Input: studentAnswerId = 999 (Giả định không tồn tại)
    // Expected: Ném ngoại lệ BadRequestException kèm thông báo 'Invalid answer ID'
    it("TC_STT05_SUBMIT_09: Kiểm tra tính hợp lệ của mã câu trả lời mà sinh viên lựa chọn", async () => {
      // Khởi tạo dữ liệu người dùng và khóa học mẫu thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Lưu thực thể câu hỏi hợp lệ vào cơ sở dữ liệu
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu thực thể đáp án hợp lệ vào bảng quiz_answers để hoàn tất cấu hình câu hỏi
      await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Gọi phương thức submitQuiz với mã đáp án giả định là 999 và kiểm tra lỗi ném ra khớp với chuỗi 'Invalid answer ID'
      await expect(
        service.submitQuiz({
          studentId: student.id,
          episodeId: episode.id,
          responsesJson: { [q.id]: 999 },
        }),
      ).rejects.toThrow(/Invalid answer ID/);
    });

    // TC_STT05_SUBMIT_10: Kiểm tra logic tính điểm tối đa (Full Score Calculation)
    // Mục tiêu: Xác nhận hệ thống tính điểm 100 khi sinh viên chọn đúng tất cả đáp án
    // Expected: score = 100 trong kết quả trả về và bản ghi database
    it("TC_STT05_SUBMIT_10: Kiểm tra trường hợp sinh viên trả lời đúng tất cả các câu hỏi", async () => {
      // Khởi tạo dữ liệu môi trường (student, episode) vào hệ thống database
      const { student, episode } = await seedBaseData();
      // Lưu thực thể câu hỏi vào bảng quiz_questions thông qua repository
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu thực thể đáp án đúng (isCorrect=true) vào bảng quiz_answers
      const a = await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Thực hiện nộp bài với đáp án đúng và nhận về đối tượng QuizResultDto từ service
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: { [q.id]: a.id },
      });
      // Kiểm tra giá trị thuộc tính score trong kết quả trả về từ bộ nhớ phải bằng 100
      expect(res.score).toBe(100);
      // Sử dụng quizAttemptRepo để truy vấn lại bản ghi vừa được lưu trong cơ sở dữ liệu dựa trên studentId và episodeId
      const saved = await quizAttemptRepo.findOne({
        where: { studentId: student.id, episodeId: episode.id } as any,
      });
      // Kiểm tra giá trị cột score trong bản ghi database thực tế phải bằng 100
      expect(saved.score).toBe(100);
    });

    // TC_STT05_SUBMIT_11: Kiểm tra logic tính điểm tối thiểu (Zero Score Calculation)
    // Mục tiêu: Xác nhận hệ thống tính điểm 0 khi sinh viên chọn sai tất cả đáp án
    // Expected: score = 0
    it("TC_STT05_SUBMIT_11: Kiểm tra trường hợp sinh viên trả lời sai toàn bộ bài kiểm tra", async () => {
      // Khởi tạo dữ liệu người dùng và khóa học mẫu
      const { student, episode } = await seedBaseData();
      // Lưu thực thể câu hỏi mẫu vào cơ sở dữ liệu
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu một đáp án đúng cho câu hỏi nhưng không được sinh viên chọn
      await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Lưu một đáp án sai (isCorrect=false) và gán ID cho biến a2 để giả lập lựa chọn sai của sinh viên
      const a2 = await answerRepo.save(
        answerRepo.create({
          content: "W",
          isCorrect: false,
          question: q,
          order: 2,
        }),
      );
      // Thực hiện nộp bài với đáp án sai và nhận về kết quả tính điểm từ service
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: { [q.id]: a2.id },
      });
      // Kiểm tra điểm số trả về trong đối tượng kết quả phải bằng 0
      expect(res.score).toBe(0);
      // Truy vấn lại bản ghi vừa tạo trong database thông qua repository
      const saved = await quizAttemptRepo.findOne({
        where: { studentId: student.id, episodeId: episode.id } as any,
      });
      // Kiểm tra cột score lưu trữ trong database thực tế phải bằng 0
      expect(saved.score).toBe(0);
    });

    // TC_STT05_SUBMIT_12: Kiểm tra ngưỡng điểm Đạt (Passing Threshold Validation)
    // Mục tiêu: Xác nhận hệ thống tính toán chính xác điểm số 60% khi sinh viên trả lời đúng 3/5 câu hỏi
    // Expected: score = 60
    it("TC_STT05_SUBMIT_12: Kiểm tra ngưỡng điểm đạt (60%) của bài kiểm tra", async () => {
      // Khởi tạo dữ liệu môi trường (student, course, episode)
      const { student, episode } = await seedBaseData();
      // Sử dụng vòng lặp for để khởi tạo 5 câu hỏi mẫu cho bài tập hiện tại
      for (let i = 0; i < 5; i++) {
        // Lưu từng câu hỏi vào bảng quiz_questions
        const q = await questionRepo.save(
          questionRepo.create({ content: "Q" + i, episode, order: i }),
        );
        // Lưu một đáp án đúng cho mỗi câu hỏi
        await answerRepo.save(
          answerRepo.create({
            content: "Correct",
            isCorrect: true,
            question: q,
            order: 1,
          }),
        );
        // Lưu một đáp án sai cho mỗi câu hỏi
        await answerRepo.save(
          answerRepo.create({
            content: "Wrong",
            isCorrect: false,
            question: q,
            order: 2,
          }),
        );
      }
      // Truy vấn danh sách toàn bộ câu hỏi kèm các đáp án của episode này từ cơ sở dữ liệu
      const qs = await questionRepo.find({
        where: { episodeId: episode.id } as any,
        relations: ["answers"],
      });
      // Khởi tạo đối tượng responsesJson rỗng để lưu trữ các lựa chọn trả lời
      const resp: any = {};
      // Duyệt danh sách câu hỏi để chọn ra 3 câu đúng và 2 câu sai
      qs.forEach((q, i) => {
        // Nếu là 3 câu đầu tiên thì chọn đáp án đúng, các câu sau chọn đáp án sai
        if (i < 3) resp[q.id] = q.answers.find((a) => a.isCorrect === true).id;
        else resp[q.id] = q.answers.find((a) => a.isCorrect === false).id;
      });
      // Thực hiện nộp bài và nhận kết quả tính toán điểm số từ service
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: resp,
      });
      // Kiểm tra điểm số cuối cùng (3/5 câu đúng) phải đạt giá trị 60
      expect(res.score).toBe(60);
    });

    // TC_STT05_SUBMIT_13: Kiểm tra ngưỡng điểm Trượt (Failing Threshold Validation)
    // Mục tiêu: Xác nhận hệ thống tính toán chính xác 59% khi sinh viên trả lời đúng 59/100 câu hỏi
    // Expected: score = 59
    it("TC_STT05_SUBMIT_13: Kiểm tra trường hợp sinh viên không đạt với số điểm sát nút (59%)", async () => {
      // Khởi tạo dữ liệu cơ bản cho quy trình kiểm thử
      const { student, episode } = await seedBaseData();
      // Khởi tạo 100 thực thể câu hỏi thông qua vòng lặp for để kiểm tra khả năng xử lý mảng lớn
      for (let i = 0; i < 100; i++) {
        // Lưu từng câu hỏi vào database thông qua questionRepo
        const q = await questionRepo.save(
          questionRepo.create({ content: "Q" + i, episode, order: i }),
        );
        // Lưu đáp án đúng cho từng câu hỏi
        await answerRepo.save(
          answerRepo.create({
            content: "C",
            isCorrect: true,
            question: q,
            order: 1,
          }),
        );
        // Lưu đáp án sai cho từng câu hỏi
        await answerRepo.save(
          answerRepo.create({
            content: "W",
            isCorrect: false,
            question: q,
            order: 2,
          }),
        );
      }
      // Lấy toàn bộ danh sách 100 câu hỏi đã tạo kèm thông tin đáp án liên kết
      const qs = await questionRepo.find({
        where: { episodeId: episode.id } as any,
        relations: ["answers"],
      });
      // Khởi tạo tập hợp câu trả lời của sinh viên dưới dạng Object
      const resp: any = {};
      // Duyệt danh sách để tạo ra 59 câu trả lời đúng và 41 câu trả lời sai
      qs.forEach((q, i) => {
        // Nếu chỉ số < 59 thì chọn ID đáp án có isCorrect là true, ngược lại chọn đáp án false
        if (i < 59) resp[q.id] = q.answers.find((a) => a.isCorrect).id;
        else resp[q.id] = q.answers.find((a) => !a.isCorrect).id;
      });
      // Thực hiện nộp bài và kiểm tra giá trị score trả về từ service
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: resp,
      });
      // Kiểm chứng điểm số cuối cùng phải bằng chính xác 59
      expect(res.score).toBe(59);
    });

    // TC_STT05_SUBMIT_14: Kiểm tra tính năng làm tròn điểm (Rounding Logic)
    // Mục tiêu: Xác nhận điểm số được làm tròn chính xác tới 2 chữ số thập phân khi kết quả là số vô hạn tuần hoàn
    // Input: 1/3 câu đúng (~33.3333%)
    // Expected: score = 33.33
    it("TC_STT05_SUBMIT_14: Kiểm tra việc tính toán và làm tròn điểm số theo chuẩn thập phân", async () => {
      // Khởi tạo dữ liệu người dùng và bài tập thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Khởi tạo 3 câu hỏi cho bài Quiz hiện tại
      for (let i = 0; i < 3; i++) {
        // Lưu thực thể câu hỏi vào cơ sở dữ liệu
        const q = await questionRepo.save(
          questionRepo.create({ content: "Q" + i, episode, order: i }),
        );
        // Thiết lập đáp án đúng vào DB
        await answerRepo.save(
          answerRepo.create({
            content: "C",
            isCorrect: true,
            question: q,
            order: 1,
          }),
        );
        // Thiết lập đáp án sai vào DB
        await answerRepo.save(
          answerRepo.create({
            content: "W",
            isCorrect: false,
            question: q,
            order: 2,
          }),
        );
      }
      // Truy vấn mảng câu hỏi đã được lưu kèm thông tin đáp án để lấy các ID hợp lệ
      const qs = await questionRepo.find({
        where: { episodeId: episode.id } as any,
        relations: ["answers"],
      });
      // Tạo đối tượng JSON nộp bài với 1 câu đúng và 2 câu sai để tạo ra kết quả 33.333...
      const resp = {
        [qs[0].id]: qs[0].answers.find((a) => a.isCorrect).id,
        [qs[1].id]: qs[1].answers.find((a) => !a.isCorrect).id,
        [qs[2].id]: qs[2].answers.find((a) => !a.isCorrect).id,
      };
      // Thực hiện nộp bài thông qua service và nhận về điểm số đã được xử lý
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: resp,
      });
      // Kiểm chứng điểm số nhận về phải là 33.33 (đã làm tròn 2 chữ số sau dấu phẩy)
      expect(res.score).toBe(33.33);
    });

    // TC_STT05_SUBMIT_15: Kiểm tra cấu trúc dữ liệu phản hồi chi tiết sau khi nộp bài
    // Mục tiêu: Xác nhận hệ thống trả về đầy đủ và chính xác thông tin chi tiết từng câu hỏi trong mảng details
    // Input: 1 câu hỏi có nội dung "Question Content" và 1 đáp án đúng
    // Expected: res.details[0].questionContent === "Question Content"
    it("TC_STT05_SUBMIT_15: Kiểm tra tính chính xác của dữ liệu phản hồi chi tiết", async () => {
      // Khởi tạo dữ liệu người dùng và bài tập thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Lưu thực thể câu hỏi với nội dung cụ thể vào cơ sở dữ liệu
      const q = await questionRepo.save(
        questionRepo.create({ content: "Question Content", episode, order: 1 }),
      );
      // Lưu thực thể đáp án đúng cho câu hỏi vừa tạo
      const a = await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Thực hiện nộp bài thông qua service và nhận về đối tượng kết quả
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: { [q.id]: a.id },
      });
      // Kiểm tra xem nội dung câu hỏi trong mảng chi tiết có khớp với nội dung đã tạo hay không
      expect(res.details[0].questionContent).toBe("Question Content");
    });

    // TC_STT05_SUBMIT_16: Kiểm tra tính chính xác của bộ đếm số câu trả lời sai
    // Mục tiêu: Xác nhận thuộc tính 'incorrectAnswers' phản ánh đúng số lượng câu hỏi sinh viên đã chọn sai
    // Input: 1 câu hỏi có 2 đáp án (1 đúng, 1 sai), sinh viên nộp bài với mã đáp án sai
    // Expected: res.incorrectAnswers = 1
    it("TC_STT05_SUBMIT_16: Kiểm tra khả năng đếm số lượng câu trả lời sai của hệ thống", async () => {
      // Khởi tạo thực thể sinh viên và bài tập mẫu
      const { student, episode } = await seedBaseData();
      // Lưu một thực thể câu hỏi vào bảng quiz_questions
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu đáp án đúng vào DB
      await answerRepo.save(
        answerRepo.create({
          content: "Correct",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Lưu đáp án sai và gán ID vào biến a2 để giả lập lựa chọn sai của sinh viên
      const a2 = await answerRepo.save(
        answerRepo.create({
          content: "Wrong",
          isCorrect: false,
          question: q,
          order: 2,
        }),
      );
      // Thực hiện nộp bài với đáp án sai thông qua service
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: { [q.id]: a2.id },
      });
      // Kiểm tra xem thuộc tính incorrectAnswers trong kết quả trả về có bằng 1 hay không
      expect(res.incorrectAnswers).toBe(1);
    });

    // TC_STT05_SUBMIT_17: Kiểm tra tính hoàn thiện của quy trình thực thi (Logging Execution)
    // Mục tiêu: Xác nhận luồng xử lý không bị ngắt quãng và thực hiện đến câu lệnh cuối cùng (Logger.log)
    // Kết quả mong đợi của Test: Trả về res hợp lệ
    it("TC_STT05_SUBMIT_17: Kiểm tra hệ thống ghi nhận lịch sử và nhật ký thực thi (Logging)", async () => {
      // Khởi tạo thực thể sinh viên và bài tập mẫu vào cơ sở dữ liệu
      const { student, episode } = await seedBaseData();
      // Lưu một câu hỏi vào bảng quiz_questions cho bài tập hiện tại
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu một đáp án đúng liên kết với câu hỏi vừa tạo
      const a = await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Thực hiện nộp bài thông qua service và gán kết quả vào biến res
      const res = await service.submitQuiz({
        studentId: student.id,
        episodeId: episode.id,
        responsesJson: { [q.id]: a.id },
      });
      // Kiểm tra xem đối tượng kết quả có được định nghĩa (không null/undefined) hay không
      expect(res).toBeDefined();
    });
  });

  describe("Kiểm thử các chức năng truy vấn dữ liệu (Queries)", () => {
    // TC_STT05_FINDBYSTD_19: Truy vấn lịch sử làm bài theo mã sinh viên (Filter by Student)
    // Mục tiêu: Xác nhận phương thức findByStudent trả về danh sách chính xác các bản ghi QuizAttempt liên kết với studentId cụ thể
    // Input: studentId hợp lệ đã thực hiện 1 lượt làm bài trong DB
    // Expected: Mảng trả về có độ dài bằng 1
    it("TC_STT05_FINDBYSTD_19: Lấy danh sách lịch sử làm bài theo mã số sinh viên", async () => {
      // Khởi tạo dữ liệu môi trường kiểm thử
      const { student, episode } = await seedBaseData();
      // Sử dụng repository để lưu trực tiếp một bản ghi QuizAttempt cho sinh viên hiện tại vào database
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Thực hiện truy vấn qua service theo student.id và kiểm tra số lượng phần tử trả về trong mảng phải là 1
      expect(await service.findByStudent(student.id)).toHaveLength(1);
    });

    // TC_STT05_FINDBYSTD_20: Truy vấn sinh viên không có dữ liệu (Empty Result Logic)
    // Mục tiêu: Đảm bảo hệ thống trả về mảng rỗng thay vì lỗi khi studentId chưa từng thực hiện bài kiểm tra nào
    // Input: studentId = 99 (giả định không tồn tại lượt làm bài)
    // Expected: Trả về mảng rỗng (length = 0)
    it("TC_STT05_FINDBYSTD_20: Trả về danh sách trống nếu sinh viên chưa thực hiện bài kiểm tra nào", async () => {
      // Gọi phương thức findByStudent với một mã ID không tồn tại dữ liệu (99) và kiểm tra độ dài mảng kết quả phải bằng 0
      expect(await service.findByStudent(99)).toHaveLength(0);
    });

    // TC_STT05_FINDBYEP_21: Truy vấn danh sách làm bài theo Episode (Filter by Episode)
    // Mục tiêu: Xác nhận hệ thống trả về toàn bộ danh sách sinh viên đã tham gia bài kiểm tra cụ thể
    // Input: episodeId hợp lệ đã có 1 lượt làm bài của 1 sinh viên
    // Expected: Mảng kết quả có length = 1
    it("TC_STT05_FINDBYEP_21: Lấy danh sách kết quả làm bài của tất cả sinh viên theo mã bài học", async () => {
      // Khởi tạo dữ liệu người dùng và bài tập mẫu
      const { student, episode } = await seedBaseData();
      // Tạo và lưu bản ghi lượt làm bài (QuizAttempt) liên kết với episode hiện tại vào database
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Thực hiện gọi phương thức findByEpisode và kiểm tra độ dài danh sách kết quả trả về phải bằng 1
      expect(await service.findByEpisode(episode.id)).toHaveLength(1);
    });

    // TC_STT05_FINDBYEP_22: Episode chưa có dữ liệu tham gia (Empty Episode Result)
    // Mục tiêu: Hệ thống trả về mảng rỗng khi bài học chưa có bất kỳ sinh viên nào thực hiện nộp bài
    // Expected: Trả về mảng có length = 0
    it("TC_STT05_FINDBYEP_22: Trả về danh sách rỗng nếu bài học chưa có bất kỳ sinh viên nào tham gia", async () => {
      // Gọi hàm findByEpisode với một mã ID ảo (99) và kiểm chứng độ dài mảng kết quả trả về là 0
      expect(await service.findByEpisode(99)).toHaveLength(0);
    });

    // TC_STT05_FINDONE_23: Truy vấn chi tiết một bản ghi cụ thể (Find by PK)
    // Mục tiêu: Xác nhận phương thức findOne trả về đúng thực thể QuizAttempt tương ứng với Primary Key (ID)
    // Input: attemptId của bản ghi vừa được lưu vào database
    // Expected: Đối tượng trả về có thuộc tính id khớp hoàn toàn với giá trị truyền vào
    it("TC_STT05_FINDONE_23: Truy vấn thông tin chi tiết của một lượt thực hiện bài kiểm tra cụ thể", async () => {
      // Khởi tạo thực thể student và episode mẫu
      const { student, episode } = await seedBaseData();
      // Lưu bản ghi lượt làm bài vào DB và nhận về đối tượng chứa mã ID đã sinh ra
      const att = await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Truy vấn service bằng att.id và kiểm tra mã ID của đối tượng trả về phải khớp hoàn toàn với att.id ban đầu
      expect((await service.findOne(att.id)).id).toBe(att.id);
    });

    // TC_STT05_FINDONE_24: Truy vấn bản ghi không tồn tại (Exception Guard)
    // Mục tiêu: Hệ thống phải ném lỗi NotFoundException khi tìm kiếm bản ghi theo ID không có trong database
    // Expected: Throws NotFoundException
    it("TC_STT05_FINDONE_24: Báo lỗi nếu mã lượt làm bài không tồn tại trong cơ sở dữ liệu", async () => {
      // Gọi phương thức findOne với tham số ID là 99 và kiểm tra ngoại lệ NotFoundException được ném ra từ Promise
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    // TC_STT05_CHECK_25: Kiểm tra trạng thái hoàn thành bài thi (Boolean Flag - True)
    // Mục tiêu: Xác nhận hệ thống trả về thông tin bản ghi khi sinh viên đã thực hiện bài kiểm tra
    // Input: Cặp (studentId, episodeId) đã tồn tại bản ghi tương ứng trong bảng quiz_attempts
    // Expected: Kết quả trả về khác null (Defined)
    it("TC_STT05_CHECK_25: Xác nhận sinh viên đã hoàn thành bài kiểm tra này hay chưa (Kết quả: Có)", async () => {
      // Khởi tạo dữ liệu người dùng và khóa học mẫu
      const { student, episode } = await seedBaseData();
      // Lưu một bản ghi QuizAttempt vào database để xác lập trạng thái 'đã làm bài' cho sinh viên hiện tại
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Gọi hàm checkAttempt và kiểm chứng kết quả trả về được xác định (không null/undefined)
      expect(await service.checkAttempt(student.id, episode.id)).toBeDefined();
    });

    // TC_STT05_CHECK_26: Kiểm tra trạng thái chưa hoàn thành (Boolean Flag - False)
    // Mục tiêu: Đảm bảo hệ thống trả về null khi sinh viên chưa tham gia thực hiện bài kiểm tra cụ thể
    // Expected: Trả về giá trị null
    it("TC_STT05_CHECK_26: Xác nhận sinh viên đã hoàn thành bài kiểm tra này hay chưa (Kết quả: Chưa)", async () => {
      // Gọi phương thức checkAttempt với mã số sinh viên và mã bài học không có liên kết và kiểm chứng giá trị trả về là null
      expect(await service.checkAttempt(1, 1)).toBeNull();
    });
  });

  describe("Kiểm thử chức năng thống kê và xếp hạng (Results & Stats)", () => {
    // TC_STT05_DETAILED_27: Truy vấn kết quả chi tiết cho ID ảo (Exception Guard)
    // Mục tiêu: Đảm bảo hệ thống ném lỗi NotFound khi yêu cầu xem chi tiết lượt làm bài không tồn tại
    // Expected: Throws NotFoundException
    it("TC_STT05_DETAILED_27: Ngăn chặn việc truy cập kết quả chi tiết của lượt làm bài không tồn tại", async () => {
      // Gọi phương thức getDetailedResult với mã ID giả định là 99 và kiểm tra lỗi NotFoundException ném ra từ Promise
      await expect(service.getDetailedResult(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    // TC_STT05_DETAILED_28: Kiểm tra ánh xạ dữ liệu đúng 100% (Correct Mapping)
    // Mục tiêu: Xác nhận hệ thống trả về đúng số lượng câu hỏi đúng khi sinh viên đạt điểm tuyệt đối
    // Input: 1 câu hỏi, responsesJson khớp hoàn toàn với answerId đúng
    // Expected: correctAnswers = 1
    it("TC_STT05_DETAILED_28: Kiểm tra thông tin phản hồi chi tiết khi sinh viên trả lời đúng hết", async () => {
      // Khởi tạo thực thể student và episode thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Lưu thực thể câu hỏi mẫu liên kết với episode đang test
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Thiết lập thực thể đáp án đúng cho câu hỏi đó
      const a = await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Khởi tạo bản ghi QuizAttempt chứa JSON responsesJson ánh xạ ID câu hỏi sang ID đáp án đúng
      const att = await quizAttemptRepo.save(
        quizAttemptRepo.create({
          student,
          episode,
          score: 100,
          responsesJson: { [q.id]: a.id },
        }),
      );
      // Gọi service lấy chi tiết kết quả và kiểm tra giá trị correctAnswers phải bằng 1
      expect((await service.getDetailedResult(att.id)).correctAnswers).toBe(1);
    });

    // TC_STT05_DETAILED_29: Kiểm tra ánh xạ dữ liệu sai hoàn toàn (Wrong Mapping)
    // Mục tiêu: Xác nhận hệ thống trả về correctAnswers = 0 khi sinh viên trả lời sai tất cả các câu hỏi
    // Input: 1 câu hỏi, responsesJson chứa answerId của đáp án sai
    // Expected: correctAnswers = 0
    it("TC_STT05_DETAILED_29: Kiểm tra thông tin phản hồi chi tiết khi sinh viên trả lời sai hết", async () => {
      // Khởi tạo dữ liệu nền cho quy trình kiểm thử
      const { student, episode } = await seedBaseData();
      // Tạo một thực thể câu hỏi Quiz
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Lưu đáp án đúng vào DB nhưng không được sinh viên sử dụng trong responsesJson
      await answerRepo.save(
        answerRepo.create({
          content: "A",
          isCorrect: true,
          question: q,
          order: 1,
        }),
      );
      // Lưu đáp án sai và gán ID cho biến a2 để giả lập lựa chọn của sinh viên
      const a2 = await answerRepo.save(
        answerRepo.create({
          content: "W",
          isCorrect: false,
          question: q,
          order: 2,
        }),
      );
      // Tạo bản ghi lượt làm bài với điểm số 0 và JSON chứa mã đáp án sai (a2)
      const att = await quizAttemptRepo.save(
        quizAttemptRepo.create({
          student,
          episode,
          score: 0,
          responsesJson: { [q.id]: a2.id },
        }),
      );
      // Thực hiện truy vấn chi tiết kết quả và kiểm chứng giá trị correctAnswers phải là 0
      expect((await service.getDetailedResult(att.id)).correctAnswers).toBe(0);
    });

    // TC_STT05_DETAILED_30: Kiểm tra cờ trạng thái vượt qua (Passed Flag - True)
    // Mục tiêu: Xác nhận thuộc tính 'passed' trả về true khi điểm số của sinh viên đạt ngưỡng >= 60
    // Expected: passed = true
    it("TC_STT05_DETAILED_30: Xác nhận hệ thống phân loại trạng thái 'Đạt' cho sinh viên có điểm >= 60", async () => {
      // Khởi tạo thực thể người dùng và bài tập mẫu
      const { student, episode } = await seedBaseData();
      // Lưu trực tiếp một bản ghi QuizAttempt với giá trị cột score bằng 60 vào database
      const att = await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 60 }),
      );
      // Truy vấn thông tin chi tiết thông qua service và kiểm chứng giá trị boolean của thuộc tính passed là true
      expect((await service.getDetailedResult(att.id)).passed).toBe(true);
    });

    // TC_STT05_DETAILED_31: Kiểm tra cờ trạng thái chưa đạt (Passed Flag - False)
    // Mục tiêu: Xác nhận thuộc tính 'passed' trả về false khi điểm số của sinh viên dưới ngưỡng 60
    // Expected: passed = false
    it("TC_STT05_DETAILED_31: Xác nhận hệ thống phân loại trạng thái 'Không đạt' cho sinh viên dưới 60 điểm", async () => {
      // Khởi tạo dữ liệu người dùng và khóa học mẫu thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Sử dụng repository để lưu bản ghi lượt làm bài với điểm số thực tế là 59 vào database
      const att = await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 59 }),
      );
      // Thực hiện lấy báo cáo chi tiết từ service và kiểm chứng flag 'passed' phải mang giá trị false
      expect((await service.getDetailedResult(att.id)).passed).toBe(false);
    });

    // TC_STT05_DETAILED_32: Kiểm tra logic xử lý an toàn khi thiếu đáp án đúng (Null Safety)
    // Mục tiêu: Đảm bảo trường isCorrect trả về false khi hệ thống không tìm thấy bất kỳ đáp án đúng nào cho câu hỏi đó trong database
    // Expected: details[0].isCorrect = false
    it("TC_STT05_DETAILED_32: Xử lý dữ liệu an toàn khi câu hỏi chưa được thiết lập đáp án đúng trong hệ thống", async () => {
      // Khởi tạo dữ liệu sinh viên và bài học cơ bản
      const { student, episode } = await seedBaseData();
      // Tạo một thực thể câu hỏi Quiz mới
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Chỉ lưu một thực thể đáp án và đặt thuộc tính isCorrect thành false cho toàn bộ tập đáp án của câu hỏi
      await answerRepo.save(
        answerRepo.create({
          content: "W",
          isCorrect: false,
          question: q,
          order: 1,
        }),
      );
      // Lưu bản ghi lượt làm bài với responsesJson chứa một mã lựa chọn (ID=1) để kích hoạt logic so khớp
      const att = await quizAttemptRepo.save(
        quizAttemptRepo.create({
          student,
          episode,
          responsesJson: { [q.id]: 1 },
        }),
      );
      // Truy vấn mảng chi tiết từ báo cáo và kiểm tra giá trị isCorrect cho câu hỏi này phải là false
      expect(
        (await service.getDetailedResult(att.id)).details[0].isCorrect,
      ).toBe(false);
    });

    // TC_STT05_DETAILED_33: Kiểm tra logic hiển thị khi đáp án bị xóa (Dangling Reference Handling)
    // Mục tiêu: Đảm bảo hệ thống hiển thị chuỗi mặc định "N/A" thay vì gây lỗi crash khi mã answerId trong lịch sử đã bị xóa khỏi bảng answers
    // Expected: studentAnswerContent = "N/A"
    it("TC_STT05_DETAILED_33: Đảm bảo hệ thống vẫn hiển thị ổn định nếu mã đáp án của sinh viên đã bị xóa", async () => {
      // Khởi tạo thực thể người dùng và bài tập thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Lưu thực thể câu hỏi mới vào bảng quiz_questions
      const q = await questionRepo.save(
        questionRepo.create({ content: "Q", episode, order: 1 }),
      );
      // Tạo một bản ghi nộp bài chứa mã answerId giả lập là 999 (không có thực trong DB) cho câu hỏi vừa tạo
      const att = await quizAttemptRepo.save(
        quizAttemptRepo.create({
          student,
          episode,
          responsesJson: { [q.id]: 999 },
        }),
      );
      // Gọi hàm getDetailedResult và kiểm chứng thuộc tính studentAnswerContent trong mảng details phải mang giá trị chuỗi "N/A"
      expect(
        (await service.getDetailedResult(att.id)).details[0]
          .studentAnswerContent,
      ).toBe("N/A");
    });

    // TC_STT05_STATS_34: Thống kê khóa học không có Quiz (Edge Case)
    // Mục tiêu: Xác nhận hệ thống trả về bộ đếm bằng 0 khi yêu cầu thống kê cho khóa học chưa có bài tập nào
    // Expected: totalQuizzes = 0
    it("TC_STT05_STATS_34: Kiểm tra tính toán thống kê cho khóa học chưa được gán bài kiểm tra nào", async () => {
      // Gọi phương thức getStatisticsByCourse với một mã ID khóa học không tồn tại (1)
      // Kiểm chứng thuộc tính totalQuizzes trong đối tượng kết quả trả về phải bằng 0
      expect((await service.getStatisticsByCourse(1)).totalQuizzes).toBe(0);
    });

    // TC_STT05_STATS_35: Thống kê khóa học chưa có dữ liệu nộp bài (Initial State)
    // Mục tiêu: Đảm bảo điểm trung bình (averageScore) được khởi tạo là 0 khi khóa học đã có Quiz nhưng chưa có sinh viên nộp bài
    // Expected: averageScore = 0
    it("TC_STT05_STATS_35: Kiểm tra các chỉ số thống kê của khóa học khi chưa có lượt làm bài nào", async () => {
      // Khởi tạo dữ liệu khóa học thông qua seedBaseData
      const { course } = await seedBaseData();
      // Truy vấn thống kê cho khóa học vừa tạo và kiểm tra thuộc tính averageScore mang giá trị 0
      expect(
        (await service.getStatisticsByCourse(course.id)).averageScore,
      ).toBe(0);
    });

    // TC_STT05_STATS_36: Kiểm tra công thức tính điểm trung bình (GPA Calculation)
    // Mục tiêu: Xác nhận hệ thống tính toán chính xác trung bình cộng điểm số của tất cả sinh viên trong khóa học
    // Input: Sinh viên 1 (100đ), Sinh viên 2 (50đ)
    // Expected: averageScore = 75
    it("TC_STT05_STATS_36: Kiểm tra độ chính xác của công thức tính điểm trung bình trên toàn khóa học", async () => {
      // Khởi tạo dữ liệu người dùng thứ nhất và khóa học mẫu
      const { student, episode, course } = await seedBaseData();
      // Tạo thêm thực thể người dùng thứ hai (student 2) vào database thông qua repository
      const s2 = await userRepo.save(
        userRepo.create({
          email: "test_s2@x.com",
          role: UserRole.STUDENT,
          passwordHash: "h",
          fullName: "Student 2",
        } as any),
      );
      // Thực thi lệnh SQL UPDATE trực tiếp để đồng bộ cột full_name cho sinh viên thứ hai
      await userRepo.query(
        "UPDATE users SET full_name = 'Student 2' WHERE email = 'test_s2@x.com'",
      );
      // Lưu bản ghi lượt làm bài 100 điểm cho sinh viên thứ nhất
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Lưu bản ghi lượt làm bài 50 điểm cho sinh viên thứ hai
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student: s2, episode, score: 50 }),
      );
      // Gọi hàm thống kê và kiểm tra xem averageScore có khớp với giá trị trung bình cộng (75) hay không
      expect(
        (await service.getStatisticsByCourse(course.id)).averageScore,
      ).toBe(75);
    });

    // TC_STT05_STATS_37: Kiểm tra bộ đếm phân loại kết quả (Aggregation Logic)
    // Mục tiêu: Xác nhận hệ thống đếm đúng số lượng các bản ghi Đạt (>=60) và Không đạt (<60) trong phạm vi khóa học
    // Input: 1 bản ghi 60đ và 1 bản ghi 40đ
    // Expected: passedAttempts = 1, failedAttempts = 1
    it("TC_STT05_STATS_37: Kiểm tra việc phân loại và đếm số lượng các lượt làm bài Đạt và Không Đạt", async () => {
      // Khởi tạo dữ liệu nền mẫu
      const { student, episode, course } = await seedBaseData();
      // Lưu bản ghi lượt làm bài đạt ngưỡng (60đ) vào database
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 60 }),
      );
      // Lưu bản ghi lượt làm bài không đạt ngưỡng (40đ) vào database
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 40 }),
      );
      // Truy vấn đối tượng thống kê tổng hợp từ service dựa trên course.id
      const res = await service.getStatisticsByCourse(course.id);
      // Kiểm tra chỉ số passedAttempts phải bằng 1
      expect(res.passedAttempts).toBe(1);
      // Kiểm tra chỉ số failedAttempts phải bằng 1
      expect(res.failedAttempts).toBe(1);
    });

    // TC_STT05_STATS_38: Kiểm tra tỷ lệ vượt qua (Pass Rate Calculation)
    // Mục tiêu: Xác nhận hệ thống tính toán tỷ lệ phần trăm vượt qua chính xác theo số lượng lượt làm bài
    // Input: 1 lượt đạt (100đ) và 1 lượt trượt (0đ) tương ứng tỷ lệ 50%
    // Expected: passRate = 50
    it("TC_STT05_STATS_38: Kiểm tra tính chính xác của tỷ lệ sinh viên hoàn thành khóa học (Pass Rate)", async () => {
      // Khởi tạo dữ liệu người dùng và khóa học mẫu
      const { student, episode, course } = await seedBaseData();
      // Tạo lượt nộp bài đạt (100đ)
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Tạo lượt nộp bài trượt (0đ)
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 0 }),
      );
      // Kiểm chứng thuộc tính passRate trả về từ service phải mang giá trị 50 (50%)
      expect((await service.getStatisticsByCourse(course.id)).passRate).toBe(
        50,
      );
    });

    // TC_STT05_LEADER_39: Kiểm tra thứ tự xếp hạng trên bảng tổng sắp (Ranking Logic)
    // Mục tiêu: Xác nhận hệ thống sắp xếp danh sách theo điểm số giảm dần và gán đúng vị trí hạng (rank) cho sinh viên cao nhất
    // Input: Sinh viên A (90đ), Sinh viên B (100đ)
    // Expected: Sinh viên B đứng vị trí đầu tiên với rank = 1
    it("TC_STT05_LEADER_39: Kiểm tra thứ tự và vị trí xếp hạng của sinh viên trên bảng tổng sắp", async () => {
      // Khởi tạo dữ liệu cho sinh viên thứ nhất thông qua seedBaseData
      const { student, episode } = await seedBaseData();
      // Lưu thực thể sinh viên thứ hai (B) vào bảng users thông qua repository
      const s2 = await userRepo.save(
        userRepo.create({
          email: "test_s2@x.com",
          role: UserRole.STUDENT,
          passwordHash: "h",
          fullName: "B",
        } as any),
      );
      // Sử dụng SQL query để đồng bộ thuộc tính full_name cho sinh viên thứ hai
      await userRepo.query(
        "UPDATE users SET full_name = 'B' WHERE email = 'test_s2@x.com'",
      );
      // Lưu lượt làm bài 90 điểm cho sinh viên thứ nhất vào database
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 90 }),
      );
      // Lưu lượt làm bài 100 điểm cho sinh viên thứ hai vào database
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student: s2, episode, score: 100 }),
      );
      // Gọi phương thức lấy bảng xếp hạng và kiểm tra phần tử đầu tiên (điểm cao nhất) phải có giá trị rank là 1
      expect((await service.getQuizLeaderboard(episode.id))[0].rank).toBe(1);
    });

    // TC_STT05_LEADER_40: Bảng xếp hạng không có dữ liệu (Empty Leaderboard)
    // Mục tiêu: Đảm bảo hệ thống trả về mảng rỗng khi yêu cầu bảng xếp hạng của một Episode chưa ai tham gia
    // Expected: length = 0
    it("TC_STT05_LEADER_40: Đảm bảo bảng xếp hạng hiển thị danh sách rỗng nếu chưa có ai tham gia", async () => {
      // Gọi phương thức getQuizLeaderboard với mã ID ảo (999) và kiểm chứng độ dài mảng trả về phải bằng 0
      expect(await service.getQuizLeaderboard(999)).toHaveLength(0);
    });

    // TC_STT05_FINDCOURSE_41: Tìm lịch sử theo khóa học không có dữ liệu (Empty Course Filtering)
    // Mục tiêu: Đảm bảo phương thức trả về mảng rỗng khi khóa học yêu cầu chưa chứa bất kỳ dữ liệu nộp bài nào
    // Expected: length = 0
    it("TC_STT05_FINDCOURSE_41: Trả về danh sách trống khi khóa học không chứa bất kỳ bài kiểm tra nào", async () => {
      // Thực hiện gọi hàm findByCourse với mã số 999 và kiểm tra độ dài danh sách kết quả trả về là 0
      expect(await service.findByCourse(999)).toHaveLength(0);
    });

    // TC_STT05_FINDCOURSE_42: Truy vấn lịch sử bài thi theo phạm vi khóa học (Course-wide Filter)
    // Mục tiêu: Xác nhận hệ thống thu thập được toàn bộ lịch sử làm bài của tất cả các Episode thuộc về một Course cụ thể
    // Input: 1 khóa học đã có 1 bài tập được sinh viên hoàn thành
    // Expected: Trả về mảng chứa đúng 1 thực thể QuizAttempt
    it("TC_STT05_FINDCOURSE_42: Truy vấn thành công danh sách bài kiểm tra thuộc về một khóa học cụ thể", async () => {
      // Khởi tạo dữ liệu nền mẫu bao gồm khóa học và bài học liên kết
      const { student, episode, course } = await seedBaseData();
      // Lưu bản ghi lượt làm bài vào bảng quiz_attempts cho tập dữ liệu vừa tạo
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Gọi phương thức findByCourse thông qua service và kiểm chứng mảng trả về có độ dài bằng 1
      expect(await service.findByCourse(course.id)).toHaveLength(1);
    });

    // TC_STT05_FINDCOURSE_43: Kiểm tra lỗi truy vấn thiếu dữ liệu
    // Mục tiêu: Khẳng định sự tồn tại của Bug trong source code: hệ thống chỉ lấy được lịch sử của Episode đầu tiên, bỏ qua các bài tập khác trong cùng khóa học
    // Cách test: Tạo 2 Episode (Ep1, Ep2) trong 1 Khóa học, mỗi Episode có 1 lượt nộp bài.
    // Expected: Trả về 2 bản ghi. Nếu chỉ trả về 1
    it("TC_STT05_FINDCOURSE_43: Xác minh lỗi logic trong source code khi chỉ truy vấn được bài tập đầu tiên", async () => {
      // Khởi tạo dữ liệu nền (đã bao gồm Episode 1 mặc định)
      const { student, episode, course, chapter } = await seedBaseData();
      // Khởi tạo thêm Episode thứ hai (ep2) cùng thuộc Chapter và Course hiện tại để kiểm tra khả năng gộp dữ liệu
      const ep2 = await episodeRepo.save(
        episodeRepo.create({
          title: "Ep 2",
          chapter,
          type: EpisodeType.QUIZ,
          order: 2,
        }),
      );
      // Lưu lượt làm bài 100 điểm cho Episode thứ nhất
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode, score: 100 }),
      );
      // Lưu lượt làm bài 90 điểm cho Episode thứ hai
      await quizAttemptRepo.save(
        quizAttemptRepo.create({ student, episode: ep2, score: 90 }),
      );
      // Thực hiện truy vấn theo Course ID và kiểm tra số lượng bản ghi
      expect(await service.findByCourse(course.id)).toHaveLength(2);
    });
  });
});
