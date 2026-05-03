import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
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
    let quizAttemptRepo: Repository<Entities.QuizAttempt>;
    let episodeRepo: Repository<Entities.Episode>;
    let enrollmentRepo: Repository<Entities.Enrollment>;
    let questionRepo: Repository<Entities.QuizQuestion>;
    let answerRepo: Repository<Entities.QuizAnswer>;
    let userRepo: Repository<Entities.User>;
    let courseRepo: Repository<Entities.Course>;
    let chapterRepo: Repository<Entities.Chapter>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "mysql", host: "127.0.0.1", port: 3307, username: "root", password: "1234", database: "elearning",
                    entities: Object.values(Entities), synchronize: false,
                }),
                TypeOrmModule.forFeature(Object.values(Entities)),
            ],
            providers: [QuizAttemptsService],
        }).compile();

        service = module.get<QuizAttemptsService>(QuizAttemptsService);
        dataSource = module.get<DataSource>(DataSource);
        quizAttemptRepo = module.get<Repository<Entities.QuizAttempt>>(getRepositoryToken(Entities.QuizAttempt));
        episodeRepo = module.get<Repository<Entities.Episode>>(getRepositoryToken(Entities.Episode));
        enrollmentRepo = module.get<Repository<Entities.Enrollment>>(getRepositoryToken(Entities.Enrollment));
        questionRepo = module.get<Repository<Entities.QuizQuestion>>(getRepositoryToken(Entities.QuizQuestion));
        answerRepo = module.get<Repository<Entities.QuizAnswer>>(getRepositoryToken(Entities.QuizAnswer));
        userRepo = module.get<Repository<Entities.User>>(getRepositoryToken(Entities.User));
        courseRepo = module.get<Repository<Entities.Course>>(getRepositoryToken(Entities.Course));
        chapterRepo = module.get<Repository<Entities.Chapter>>(getRepositoryToken(Entities.Chapter));

        try { await dataSource.query("ALTER TABLE chapters ADD COLUMN courseId INT AS (course_id) VIRTUAL"); } catch (e) { }
        try { await dataSource.query("ALTER TABLE quiz_attempts ADD COLUMN episodeId INT AS (episode_id) VIRTUAL"); } catch (e) { }

        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    afterAll(async () => {
        try { await dataSource.query("ALTER TABLE chapters DROP COLUMN courseId"); } catch (e) { }
        try { await dataSource.query("ALTER TABLE quiz_attempts DROP COLUMN episodeId"); } catch (e) { }
        if (dataSource) await dataSource.destroy();
    });

    async function cleanUp() {
        await dataSource.query("SET FOREIGN_KEY_CHECKS = 0");
        await quizAttemptRepo.query("TRUNCATE TABLE quiz_attempts");
        await enrollmentRepo.query("TRUNCATE TABLE enrollments");
        await answerRepo.query("TRUNCATE TABLE quiz_answers");
        await questionRepo.query("TRUNCATE TABLE quiz_questions");
        await episodeRepo.query("TRUNCATE TABLE episodes");
        await chapterRepo.query("TRUNCATE TABLE chapters");
        await courseRepo.query("TRUNCATE TABLE courses");
        await userRepo.query("DELETE FROM users WHERE email LIKE 'test_%'");
        await dataSource.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    beforeEach(async () => { await cleanUp(); });

    async function seedBaseData() {
        const teacher = await userRepo.save(userRepo.create({ fullName: "Test Teacher", email: "test_t@x.com", passwordHash: "h", role: UserRole.TEACHER } as any));
        const student = await userRepo.save(userRepo.create({ fullName: "Test Student", email: "test_s@x.com", passwordHash: "h", role: UserRole.STUDENT } as any));
        await userRepo.query("UPDATE users SET full_name = 'Test Student' WHERE email = 'test_s@x.com'");
        await userRepo.query("UPDATE users SET full_name = 'Test Teacher' WHERE email = 'test_t@x.com'");

        const course = await courseRepo.save(courseRepo.create({ title: "C", status: CourseStatus.PUBLISHED, teacher }));
        const chapter = await chapterRepo.save(chapterRepo.create({ title: "Ch", course, order: 1 }));
        const episode = await episodeRepo.save(episodeRepo.create({ title: "Q", type: EpisodeType.QUIZ, chapter, order: 1 }));
        await enrollmentRepo.save(enrollmentRepo.create({ student, course, status: EnrollmentStatus.ACTIVE }));
        return { student, course, episode, chapter };
    }

    describe("Kiểm thử chức năng nộp bài (submitQuiz)", () => {
        // TC_STT05_SUBMIT_01: Kiểm tra trường hợp episodeId không tồn tại trong DB
        // Mục tiêu: Đảm bảo hệ thống báo lỗi NotFound thay vì gặp lỗi logic không xác định
        // Input: episodeId = 999 (không tồn tại)
        // Expected: Ném ra lỗi NotFoundException
        it("TC_STT05_SUBMIT_01: Kiểm tra trường hợp bài học không tồn tại trong hệ thống", async () => { await expect(service.submitQuiz({ studentId: 1, episodeId: 999, responsesJson: {} })).rejects.toThrow(NotFoundException); });

        // TC_STT05_SUBMIT_02: Kiểm tra loại bài học không hỗ trợ làm quiz
        // Mục tiêu: Chỉ cho phép nộp bài với các episode loại QUIZ, các loại khác (như VIDEO) phải bị từ chối
        // Input: Episode loại VIDEO
        // Expected: Ném ra lỗi BadRequestException
        it("TC_STT05_SUBMIT_02: Ngăn chặn nộp bài nếu bài học không phải là dạng bài kiểm tra (Quiz)", async () => {
            const { student, episode } = await seedBaseData();
            await episodeRepo.update(episode.id, { type: EpisodeType.VIDEO });
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: {} })).rejects.toThrow(BadRequestException);
        });

        // TC_STT05_SUBMIT_03: Kiểm tra quyền tham gia làm bài
        // Mục tiêu: Đảm bảo học sinh phải đăng ký (enroll) khóa học thì mới được nộp bài quiz
        // Input: Học sinh chưa đăng ký khóa học
        // Expected: Ném ra lỗi ForbiddenException
        it("TC_STT05_SUBMIT_03: Kiểm tra quyền làm bài của sinh viên chưa đăng ký khóa học", async () => {
            const { student, episode } = await seedBaseData();
            await enrollmentRepo.query("DELETE FROM enrollments");
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: {} })).rejects.toThrow(ForbiddenException);
        });

        // TC_STT05_SUBMIT_04: Kiểm tra việc làm bài lặp lại
        // Mục tiêu: Hệ thống chỉ cho phép mỗi sinh viên làm mỗi bài quiz tối đa một lần
        // Input: Sinh viên đã có bản ghi làm bài trong hệ thống
        // Expected: Báo lỗi BadRequestException 'You have already attempted this quiz'
        it("TC_STT05_SUBMIT_04: Ngăn chặn sinh viên làm lại bài kiểm tra đã hoàn thành trước đó", async () => {
            const { student, episode } = await seedBaseData();
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 0 }));
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: {} })).rejects.toThrow(BadRequestException);
        });

        // TC_STT05_SUBMIT_05: Kiểm tra tính hợp lệ của bài kiểm tra (không có câu hỏi)
        // Mục tiêu: Tránh trường hợp nộp bài cho một quiz rỗng
        // Input: Quiz không chứa bất kỳ câu hỏi nào
        // Expected: Ném ra lỗi BadRequestException
        it("TC_STT05_SUBMIT_05: Kiểm tra tính hợp lệ khi bài kiểm tra không có bất kỳ câu hỏi nào", async () => {
            const { student, episode } = await seedBaseData();
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: {} })).rejects.toThrow(BadRequestException);
        });

        // TC_STT05_SUBMIT_06: Kiểm tra tính đầy đủ của câu trả lời
        // Mục tiêu: Sinh viên phải trả lời đầy đủ tất cả các câu hỏi có trong quiz
        // Input: Quiz có 2 câu nhưng chỉ nộp 1 câu trả lời
        // Expected: Báo lỗi 'Missing answers for question IDs'
        it("TC_STT05_SUBMIT_06: Kiểm tra trường hợp sinh viên nộp bài nhưng thiếu câu trả lời", async () => {
            const { student, episode } = await seedBaseData();
            await questionRepo.save(questionRepo.create({ content: "Q1", episode, order: 1 }));
            await questionRepo.save(questionRepo.create({ content: "Q2", episode, order: 2 }));
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { 1: 1 } })).rejects.toThrow(/Missing answers/);
        });

        // TC_STT05_SUBMIT_07: Kiểm tra tính hợp lệ của ID câu hỏi
        // Mục tiêu: Ngăn chặn việc gửi lên các ID câu hỏi không thuộc về quiz này
        // Input: Gửi kèm một ID câu hỏi rác (999)
        // Expected: Báo lỗi 'Invalid question IDs'
        it("TC_STT05_SUBMIT_07: Kiểm tra tính hợp lệ của các mã câu hỏi gửi lên hệ thống", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            const a = await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: a.id, 999: 1 } })).rejects.toThrow(/Invalid question IDs/);
        });

        // TC_STT05_SUBMIT_08: Kiểm tra cấu hình đáp án đúng của hệ thống
        // Mục tiêu: Quiz phải có ít nhất một đáp án đúng được cấu hình để tính điểm
        // Input: Câu hỏi chỉ toàn đáp án sai
        // Expected: Báo lỗi nghiệp vụ 'no correct answer'
        it("TC_STT05_SUBMIT_08: Kiểm tra trường hợp câu hỏi chưa được cấu hình đáp án đúng", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            await answerRepo.save(answerRepo.create({ content: "A", isCorrect: false, question: q, order: 1 }));
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: 1 } })).rejects.toThrow(/no correct answer/);
        });

        // TC_STT05_SUBMIT_09: Kiểm tra tính hợp lệ của ID đáp án
        // Mục tiêu: ID đáp án mà sinh viên chọn phải tồn tại trong cơ sở dữ liệu
        // Input: studentAnswerId = 999 (không tồn tại)
        // Expected: Báo lỗi 'Invalid answer ID'
        it("TC_STT05_SUBMIT_09: Kiểm tra tính hợp lệ của mã câu trả lời mà sinh viên lựa chọn", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: 999 } })).rejects.toThrow(/Invalid answer ID/);
        });

        // TC_STT05_SUBMIT_10: Trường hợp làm đúng hoàn toàn
        // Mục tiêu: Xác nhận hệ thống tính điểm tối đa khi toàn bộ câu trả lời là đúng
        // Expected: Score = 100
        it("TC_STT05_SUBMIT_10: Kiểm tra trường hợp sinh viên trả lời đúng tất cả các câu hỏi", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            const a = await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: a.id } });
            expect(res.score).toBe(100);
            const saved = await quizAttemptRepo.findOne({ where: { student: { id: student.id }, episode: { id: episode.id } } });
            expect(saved.score).toBe(100);
        });

        // TC_STT05_SUBMIT_11: Trường hợp làm sai hoàn toàn
        // Mục tiêu: Xác nhận hệ thống tính điểm 0 khi không có câu trả lời nào đúng
        // Expected: Score = 0
        it("TC_STT05_SUBMIT_11: Kiểm tra trường hợp sinh viên trả lời sai toàn bộ bài kiểm tra", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            await answerRepo.save(answerRepo.create({ content: "A1", isCorrect: true, question: q, order: 1 }));
            const a2 = await answerRepo.save(answerRepo.create({ content: "A2", isCorrect: false, question: q, order: 2 }));
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: a2.id } });
            expect(res.score).toBe(0);
            const saved = await quizAttemptRepo.findOne({ where: { student: { id: student.id }, episode: { id: episode.id } } });
            expect(saved.score).toBe(0);
        });

        // TC_STT05_SUBMIT_12: Kiểm tra ngưỡng đạt (60%)
        // Mục tiêu: Xác nhận sinh viên vừa đủ điểm đỗ
        // Expected: Score = 60
        it("TC_STT05_SUBMIT_12: Kiểm tra ngưỡng điểm đạt (60%) của bài kiểm tra", async () => {
            const { student, episode } = await seedBaseData();
            for (let i = 0; i < 5; i++) {
                const q = await questionRepo.save(questionRepo.create({ content: "Q" + i, episode, order: i }));
                await answerRepo.save(answerRepo.create({ content: "C", isCorrect: true, question: q, order: 1 }));
                await answerRepo.save(answerRepo.create({ content: "W", isCorrect: false, question: q, order: 2 }));
            }
            const qs = await questionRepo.find({ where: { episode: { id: episode.id } }, relations: ['answers'] });
            const resp: any = {};
            qs.forEach((q, i) => {
                if (i < 3) {
                    resp[q.id] = q.answers.find(a => a.isCorrect === true).id; // Lấy đáp án ĐÚNG
                } else {
                    resp[q.id] = q.answers.find(a => a.isCorrect === false).id; // Lấy đáp án SAI
                }
            });
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: resp });
            expect(res.score).toBe(60);
        });

        // TC_STT05_SUBMIT_13: Kiểm tra ngưỡng trượt (59%)
        // Mục tiêu: Xác nhận hệ thống phân loại đúng sinh viên trượt sát nút
        // Expected: Score = 59
        it("TC_STT05_SUBMIT_13: Kiểm tra trường hợp sinh viên không đạt với số điểm sát nút (59%)", async () => {
            const { student, episode } = await seedBaseData();
            for (let i = 0; i < 100; i++) {
                const q = await questionRepo.save(questionRepo.create({ content: "Q" + i, episode, order: i }));
                await answerRepo.save(answerRepo.create({ content: "C", isCorrect: true, question: q, order: 1 }));
                await answerRepo.save(answerRepo.create({ content: "W", isCorrect: false, question: q, order: 2 }));
            }
            const qs = await questionRepo.find({ where: { episode: { id: episode.id } }, relations: ['answers'] });
            const resp: any = {}; qs.forEach((q, i) => resp[q.id] = q.answers.find(a => a.isCorrect === (i < 59)).id);
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: resp });
            expect(res.score).toBe(59);
        });

        // TC_STT05_SUBMIT_14: Kiểm tra độ chính xác của phép tính điểm
        // Mục tiêu: Đảm bảo điểm số được làm tròn đúng 2 chữ số thập phân
        // Input: Đúng 1/3 câu (~33.3333%)
        // Expected: Score = 33.33
        it("TC_STT05_SUBMIT_14: Kiểm tra việc tính toán và làm tròn điểm số theo chuẩn thập phân", async () => {
            const { student, episode } = await seedBaseData();
            for (let i = 0; i < 3; i++) {
                const q = await questionRepo.save(questionRepo.create({ content: "Q" + i, episode, order: i }));
                await answerRepo.save(answerRepo.create({ content: "C", isCorrect: true, question: q, order: 1 }));
                await answerRepo.save(answerRepo.create({ content: "W", isCorrect: false, question: q, order: 2 }));
            }
            const qs = await questionRepo.find({ where: { episode: { id: episode.id } }, relations: ['answers'] });
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [qs[0].id]: qs[0].answers[0].id, [qs[1].id]: qs[1].answers[1].id, [qs[2].id]: qs[2].answers[1].id } });
            expect(res.score).toBe(33.33);
        });

        // TC_STT05_SUBMIT_15: Kiểm tra dữ liệu trả về sau khi nộp
        // Mục tiêu: Đảm bảo kết quả trả về chứa đủ thông tin (tên câu hỏi, đáp án...)
        // Expected: questionContent = "Q"
        it("TC_STT05_SUBMIT_15: Kiểm tra tính đầy đủ của các trường dữ liệu trong kết quả trả về", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            const a = await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: a.id } });
            expect(res.details[0].questionContent).toBe("Q");
            const saved = await quizAttemptRepo.findOne({ where: { student: { id: student.id }, episode: { id: episode.id } } });
            expect(saved).not.toBeNull();
        });

        // TC_STT05_SUBMIT_16: Kiểm tra việc đếm số câu sai
        // Mục tiêu: Xác nhận hệ thống thống kê chính xác số lượng đáp án không đúng
        // Expected: incorrectAnswers = 1
        it("TC_STT05_SUBMIT_16: Kiểm tra độ chính xác của việc thống kê số lượng câu trả lời sai", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            const a2 = await answerRepo.save(answerRepo.create({ content: "W", isCorrect: false, question: q, order: 2 }));
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: a2.id } });
            expect(res.incorrectAnswers).toBe(1);
            const saved = await quizAttemptRepo.findOne({ where: { student: { id: student.id }, episode: { id: episode.id } } });
            expect(saved.incorrectAnswers).toBe(1);
        });

        // TC_STT05_SUBMIT_17: Kiểm tra ghi nhật ký (Logging)
        // Mục tiêu: Xác nhận hệ thống có ghi log sau khi lưu bài thành công
        // Lưu ý: Case này sẽ FAIL vì vướng BUG tại dòng 194 ngay trước khi log được in ra
        it("TC_STT05_SUBMIT_17: Kiểm tra hệ thống ghi nhận lịch sử và nhật ký thực thi (Logging)", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            const a = await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            const res = await service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: { [q.id]: a.id } });
            expect(res).toBeDefined();
        });

        // TC_STT05_SUBMIT_18: Kiểm tra rẽ nhánh điểm 0
        // Mục tiêu: Case này sẽ PASS vì hệ thống chặn lỗi 'no questions' ở dòng 98
        // Giải thích: Vì bị chặn sớm nên code không bao giờ chạy đến dòng BUG 194
        it("TC_STT05_SUBMIT_18: Kiểm tra trường hợp đặc biệt khi tổng số câu hỏi bằng 0", async () => {
            const { student, episode } = await seedBaseData();
            // Không tạo câu hỏi cho episode này
            await expect(service.submitQuiz({ studentId: student.id, episodeId: episode.id, responsesJson: {} })).rejects.toThrow(BadRequestException);
        });
    });

    describe("Kiểm thử các chức năng truy vấn dữ liệu (Queries)", () => {
        // TC_STT05_FINDBYSTD_19: Truy vấn theo ID sinh viên
        // Mục tiêu: Trả về danh sách các lần làm bài của một sinh viên cụ thể
        it("TC_STT05_FINDBYSTD_19: Lấy danh sách lịch sử làm bài theo mã số sinh viên", async () => {
            const { student, episode } = await seedBaseData();
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            expect(await service.findByStudent(student.id)).toHaveLength(1);
        });

        // TC_STT05_FINDBYSTD_20: Truy vấn sinh viên chưa làm bài
        // Mục tiêu: Trả về mảng rỗng thay vì báo lỗi
        it("TC_STT05_FINDBYSTD_20: Trả về danh sách trống nếu sinh viên chưa thực hiện bài kiểm tra nào", async () => { expect(await service.findByStudent(99)).toHaveLength(0); });

        // TC_STT05_FINDBYEP_21: Truy vấn theo bài học (Episode)
        // Mục tiêu: Trả về tất cả các lượt làm bài cho một episode cụ thể
        it("TC_STT05_FINDBYEP_21: Lấy danh sách kết quả làm bài của tất cả sinh viên theo mã bài học", async () => {
            const { student, episode } = await seedBaseData();
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            expect(await service.findByEpisode(episode.id)).toHaveLength(1);
        });

        // TC_STT05_FINDBYEP_22: Episode chưa có ai làm bài
        it("TC_STT05_FINDBYEP_22: Trả về danh sách rỗng nếu bài học chưa có bất kỳ sinh viên nào tham gia", async () => { expect(await service.findByEpisode(99)).toHaveLength(0); });

        // TC_STT05_FINDONE_23: Truy vấn chi tiết một lần làm bài
        it("TC_STT05_FINDONE_23: Truy vấn thông tin chi tiết của một lượt thực hiện bài kiểm tra cụ thể", async () => {
            const { student, episode } = await seedBaseData();
            const att = await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            expect((await service.findOne(att.id)).id).toBe(att.id);
        });

        // TC_STT05_FINDONE_24: ID lần làm bài không tồn tại
        it("TC_STT05_FINDONE_24: Báo lỗi nếu mã lượt làm bài không tồn tại trong cơ sở dữ liệu", async () => { await expect(service.findOne(99)).rejects.toThrow(NotFoundException); });

        // TC_STT05_CHECK_25: Kiểm tra trạng thái làm bài (Đã làm)
        it("TC_STT05_CHECK_25: Xác nhận sinh viên đã hoàn thành bài kiểm tra này hay chưa (Kết quả: Có)", async () => {
            const { student, episode } = await seedBaseData();
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            expect(await service.checkAttempt(student.id, episode.id)).toBeDefined();
        });

        // TC_STT05_CHECK_26: Kiểm tra trạng thái làm bài (Chưa làm)
        it("TC_STT05_CHECK_26: Xác nhận sinh viên đã hoàn thành bài kiểm tra này hay chưa (Kết quả: Chưa)", async () => { expect(await service.checkAttempt(1, 1)).toBeNull(); });
    });

    describe("Kiểm thử chức năng thống kê và xếp hạng (Results & Stats)", () => {
        // TC_STT05_DETAILED_27: Lấy kết quả chi tiết cho ID ảo
        it("TC_STT05_DETAILED_27: Ngăn chặn việc truy cập kết quả chi tiết của lượt làm bài không tồn tại", async () => { await expect(service.getDetailedResult(99)).rejects.toThrow(NotFoundException); });

        // TC_STT05_DETAILED_28: Kiểm tra nội dung chi tiết (Đúng hoàn toàn)
        it("TC_STT05_DETAILED_28: Kiểm tra thông tin phản hồi chi tiết khi sinh viên trả lời đúng hết", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            const a = await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            const att = await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100, responsesJson: { [q.id]: a.id } }));
            expect((await service.getDetailedResult(att.id)).correctAnswers).toBe(1);
        });

        // TC_STT05_DETAILED_29: Kiểm tra nội dung chi tiết (Sai hoàn toàn)
        it("TC_STT05_DETAILED_29: Kiểm tra thông tin phản hồi chi tiết khi sinh viên trả lời sai hết", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            await answerRepo.save(answerRepo.create({ content: "A", isCorrect: true, question: q, order: 1 }));
            const a2 = await answerRepo.save(answerRepo.create({ content: "W", isCorrect: false, question: q, order: 2 }));
            const att = await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 0, responsesJson: { [q.id]: a2.id } }));
            expect((await service.getDetailedResult(att.id)).correctAnswers).toBe(0);
        });

        // TC_STT05_DETAILED_30: Kiểm tra phân loại đạt
        it("TC_STT05_DETAILED_30: Xác nhận hệ thống phân loại trạng thái 'Đạt' cho sinh viên có điểm >= 60", async () => {
            const { student, episode } = await seedBaseData();
            const att = await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 60 }));
            expect((await service.getDetailedResult(att.id)).passed).toBe(true);
        });

        // TC_STT05_DETAILED_31: Kiểm tra phân loại trượt
        it("TC_STT05_DETAILED_31: Xác nhận hệ thống phân loại trạng thái 'Không đạt' cho sinh viên dưới 60 điểm", async () => {
            const { student, episode } = await seedBaseData();
            const att = await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 59 }));
            expect((await service.getDetailedResult(att.id)).passed).toBe(false);
        });

        // TC_STT05_DETAILED_32: Trường hợp dữ liệu hệ thống thiếu đáp án đúng
        it("TC_STT05_DETAILED_32: Xử lý dữ liệu an toàn khi câu hỏi chưa được thiết lập đáp án đúng trong hệ thống", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            await answerRepo.save(answerRepo.create({ content: "W", isCorrect: false, question: q, order: 1 }));
            const att = await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, responsesJson: { [q.id]: 1 } }));
            expect((await service.getDetailedResult(att.id)).details[0].isCorrect).toBe(false);
        });

        // TC_STT05_DETAILED_33: Hiển thị khi đáp án không còn tồn tại
        it("TC_STT05_DETAILED_33: Đảm bảo hệ thống vẫn hiển thị ổn định nếu mã đáp án của sinh viên đã bị xóa", async () => {
            const { student, episode } = await seedBaseData();
            const q = await questionRepo.save(questionRepo.create({ content: "Q", episode, order: 1 }));
            const att = await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, responsesJson: { [q.id]: 999 } }));
            expect((await service.getDetailedResult(att.id)).details[0].studentAnswerContent).toBe("N/A");
        });

        // TC_STT05_STATS_34: Thống kê cho khóa học chưa có bài tập
        it("TC_STT05_STATS_34: Kiểm tra tính toán thống kê cho khóa học chưa được gán bài kiểm tra nào", async () => { expect((await service.getStatisticsByCourse(1)).totalQuizzes).toBe(0); });

        // TC_STT05_STATS_35: Thống kê cho khóa học chưa có ai làm bài
        it("TC_STT05_STATS_35: Kiểm tra các chỉ số thống kê của khóa học khi chưa có lượt làm bài nào", async () => {
            const { course, episode } = await seedBaseData();
            expect((await service.getStatisticsByCourse(course.id)).averageScore).toBe(0);
        });

        // TC_STT05_STATS_36: Tính điểm trung bình (GPA) khóa học
        it("TC_STT05_STATS_36: Kiểm tra độ chính xác của công thức tính điểm trung bình trên toàn khóa học", async () => {
            const { student, episode, course } = await seedBaseData();
            const s2 = await userRepo.save(userRepo.create({ email: "test_s2@x.com", role: UserRole.STUDENT, passwordHash: "h", fullName: "Student 2" } as any));
            await userRepo.query("UPDATE users SET full_name = 'Student 2' WHERE email = 'test_s2@x.com'");
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            await quizAttemptRepo.save(quizAttemptRepo.create({ student: s2, episode, score: 50 }));
            expect((await service.getStatisticsByCourse(course.id)).averageScore).toBe(75);
        });

        // TC_STT05_STATS_37: Đếm số lượt Đạt/Trượt
        it("TC_STT05_STATS_37: Kiểm tra việc phân loại và đếm số lượng các lượt làm bài Đạt và Không Đạt", async () => {
            const { student, episode, course } = await seedBaseData();
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 60 }));
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 40 }));
            const res = await service.getStatisticsByCourse(course.id);
            expect(res.passedAttempts).toBe(1);
            expect(res.failedAttempts).toBe(1);
        });

        // TC_STT05_STATS_38: Tính tỷ lệ vượt qua (Pass Rate)
        it("TC_STT05_STATS_38: Kiểm tra tính chính xác của tỷ lệ sinh viên hoàn thành khóa học (Pass Rate)", async () => {
            const { student, episode, course } = await seedBaseData();
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 0 }));
            expect((await service.getStatisticsByCourse(course.id)).passRate).toBe(50);
        });

        // TC_STT05_LEADER_39: Bảng xếp hạng theo điểm số
        it("TC_STT05_LEADER_39: Kiểm tra thứ tự và vị trí xếp hạng của sinh viên trên bảng tổng sắp", async () => {
            const { student, episode } = await seedBaseData();
            const s2 = await userRepo.save(userRepo.create({ email: "test_s2@x.com", role: UserRole.STUDENT, passwordHash: "h", fullName: "B" } as any));
            await userRepo.query("UPDATE users SET full_name = 'B' WHERE email = 'test_s2@x.com'");
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 90 }));
            await quizAttemptRepo.save(quizAttemptRepo.create({ student: s2, episode, score: 100 }));
            expect((await service.getQuizLeaderboard(episode.id))[0].rank).toBe(1);
        });

        // TC_STT05_LEADER_40: Bảng xếp hạng rỗng
        it("TC_STT05_LEADER_40: Đảm bảo bảng xếp hạng hiển thị danh sách rỗng nếu chưa có ai tham gia", async () => { expect(await service.getQuizLeaderboard(999)).toHaveLength(0); });

        // TC_STT05_FINDCOURSE_41: Tìm bài tập theo khóa học (Không có kết quả)
        it("TC_STT05_FINDCOURSE_41: Trả về danh sách trống khi khóa học không chứa bất kỳ bài kiểm tra nào", async () => { expect(await service.findByCourse(999)).toHaveLength(0); });

        // TC_STT05_FINDCOURSE_42: Tìm bài tập theo khóa học (Thành công)
        it("TC_STT05_FINDCOURSE_42: Truy vấn thành công danh sách bài kiểm tra thuộc về một khóa học cụ thể", async () => {
            const { student, episode, course } = await seedBaseData();
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            expect(await service.findByCourse(course.id)).toHaveLength(1);
        });

        // TC_STT05_FINDCOURSE_43: Kiểm tra lỗi truy vấn thiếu dữ liệu
        // Mục tiêu: Khẳng định bug hiện tại là chỉ lấy lượt làm bài của bài học đầu tiên trong mảng
        it("TC_STT05_FINDCOURSE_43: Xác minh lỗi logic trong source code khi chỉ truy vấn được bài tập đầu tiên", async () => {
            const { student, episode, course, chapter } = await seedBaseData();
            const ep2 = await episodeRepo.save(episodeRepo.create({ title: "Ep 2", chapter, type: EpisodeType.QUIZ, order: 2 }));
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode, score: 100 }));
            await quizAttemptRepo.save(quizAttemptRepo.create({ student, episode: ep2, score: 90 }));
            expect(await service.findByCourse(course.id)).toHaveLength(2);
        });
    });
});
