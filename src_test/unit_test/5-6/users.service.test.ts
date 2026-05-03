import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, ConflictException, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { UsersService } from "../../../../src_code/elearning-backend/src/modules/users/users.service";
import * as Entities from "../../../../src_code/elearning-backend/src/entities";
import { UserRole, UserStatus } from "../../../../src_code/elearning-backend/src/entities/user.entity";
import { CourseStatus } from "../../../../src_code/elearning-backend/src/entities/course.entity";
import * as bcrypt from "bcrypt";

describe("Kiểm thử tích hợp UsersService (STT06) - Kết nối Database thực tế", () => {
    let service: UsersService;
    let dataSource: DataSource;
    let userRepo: Repository<Entities.User>;
    let courseRepo: Repository<Entities.Course>;
    let subjectRepo: Repository<Entities.Subject>;
    let gradeRepo: Repository<Entities.GradeLevel>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "mysql", host: "127.0.0.1", port: 3307, username: "root", password: "1234", database: "elearning",
                    entities: Object.values(Entities), synchronize: false,
                }),
                TypeOrmModule.forFeature(Object.values(Entities)),
            ],
            providers: [UsersService],
        }).compile();

        service = module.get<UsersService>(UsersService);
        dataSource = module.get<DataSource>(DataSource);
        userRepo = module.get<Repository<Entities.User>>(getRepositoryToken(Entities.User));
        courseRepo = module.get<Repository<Entities.Course>>(getRepositoryToken(Entities.Course));
        subjectRepo = module.get<Repository<Entities.Subject>>(getRepositoryToken(Entities.Subject));
        gradeRepo = module.get<Repository<Entities.GradeLevel>>(getRepositoryToken(Entities.GradeLevel));

        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    afterAll(async () => {
        if (dataSource) await dataSource.destroy();
    });

    async function cleanUp() {
        await dataSource.query("SET FOREIGN_KEY_CHECKS = 0");
        await userRepo.query("TRUNCATE TABLE users");
        await courseRepo.query("TRUNCATE TABLE courses");
        await subjectRepo.query("TRUNCATE TABLE subjects");
        await gradeRepo.query("TRUNCATE TABLE grade_levels");
        await dataSource.query("TRUNCATE TABLE exams");
        await dataSource.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    beforeEach(async () => { await cleanUp(); });

    const defaultPagination = { page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC' };

    describe("Tìm kiếm người dùng (findById)", () => {
        // TC_STT06_FINDBYID_01: Tìm User thành công khi ID có trong hệ thống
        // Mục tiêu: Xác nhận hệ thống trả về đúng đối tượng User tương ứng với ID
        // Input: ID của User vừa tạo
        // Expected: Đối tượng User không null và có ID khớp
        it("TC_STT06_FINDBYID_01: Kiểm tra lấy thông tin người dùng bằng mã ID hợp lệ", async () => {
            const user = await userRepo.save(userRepo.create({ fullName: "U", email: "test_find@x.com", role: UserRole.STUDENT, passwordHash: "h" }));
            await userRepo.query("UPDATE users SET full_name = 'U' WHERE id = " + user.id);
            expect((await service.findById(user.id)).id).toBe(user.id);
        });

        // TC_STT06_FINDBYID_02: Báo lỗi khi tìm User với ID không tồn tại
        // Mục tiêu: Đảm bảo hệ thống ném ra NotFoundException để phía client xử lý
        // Input: ID = 999999
        // Expected: Ném ra lỗi NotFoundException 'User not found'
        it("TC_STT06_FINDBYID_02: Hệ thống báo lỗi khi truy vấn mã người dùng không tồn tại", async () => {
            await expect(service.findById(999999)).rejects.toThrow(NotFoundException);
        });
    });

    describe("Cập nhật thông tin người dùng (updateUser)", () => {
        // TC_STT06_UPDATEUSER_01: Thay đổi họ tên thành công
        // Mục tiêu: Kiểm tra logic Object.assign và save hoạt động đúng
        it("TC_STT06_UPDATEUSER_01: Kiểm tra việc cập nhật họ tên của người dùng trong hệ thống", async () => {
            const user = await userRepo.save(userRepo.create({ fullName: "Old", email: "test_u@x.com", role: UserRole.STUDENT, passwordHash: "h" }));
            await userRepo.query("UPDATE users SET full_name = 'Old' WHERE id = " + user.id);
            const result = await service.updateUser(user.id, { fullName: 'New' });
            expect(result.fullName).toBe('New');
            const updatedUser = await userRepo.findOne({ where: { id: user.id } });
            expect(updatedUser.fullName).toBe('New');
        });

        // TC_STT06_UPDATEUSER_02: Cập nhật đồng thời nhiều trường thông tin
        it("TC_STT06_UPDATEUSER_02: Cập nhật đồng thời nhiều trường dữ liệu thông tin cá nhân", async () => {
            const user = await userRepo.save(userRepo.create({ fullName: "A", email: "test_u2@x.com", role: UserRole.STUDENT, passwordHash: "h" }));
            const result = await service.updateUser(user.id, { fullName: 'Updated Name', phone: '0987654321' });
            expect(result.fullName).toBe('Updated Name');
            expect(result.phone).toBe('0987654321');
            const updatedUser = await userRepo.findOne({ where: { id: user.id } });
            expect(updatedUser.fullName).toBe('Updated Name');
            expect(updatedUser.phone).toBe('0987654321');
        });

        // TC_STT06_UPDATEUSER_03: Cập nhật cho User không tồn tại
        it("TC_STT06_UPDATEUSER_03: Hệ thống báo lỗi khi yêu cầu cập nhật cho người dùng ảo", async () => {
            await expect(service.updateUser(999999, { fullName: 'X' })).rejects.toThrow(NotFoundException);
        });
    });

    describe("Xóa người dùng (deleteUser)", () => {
        // TC_STT06_DELETEUSER_01: Xóa tài khoản thành công
        it("TC_STT06_DELETEUSER_01: Thực hiện quy trình xóa tài khoản người dùng khỏi hệ thống", async () => {
            const user = await userRepo.save(userRepo.create({ fullName: "D", email: "test_d@x.com", role: UserRole.STUDENT, passwordHash: "h" }));
            await service.deleteUser(user.id);
            const check = await userRepo.findOne({ where: { id: user.id } });
            expect(check).toBeNull();
        });

        // TC_STT06_DELETEUSER_02: Xóa User không tồn tại
        it("TC_STT06_DELETEUSER_02: Báo lỗi khi cố gắng xóa một mã người dùng không có thực", async () => {
            await expect(service.deleteUser(999999)).rejects.toThrow(NotFoundException);
        });
    });

    describe("Danh sách giáo viên (getAllTeachers)", () => {
        // TC_STT06_GETALLTEACHERS_01: Lấy danh sách giáo viên hợp lệ
        it("TC_STT06_GETALLTEACHERS_01: Truy vấn danh sách giáo viên với đầy đủ thông tin phân trang", async () => {
            await userRepo.save(userRepo.create({ fullName: "T", email: "test_t@x.com", role: UserRole.TEACHER, passwordHash: "h" }));
            const result = await service.getAllTeachers(defaultPagination);
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        // TC_STT06_GETALLTEACHERS_02: Tính toán số trang (Total Pages)
        // Input: 11 giáo viên, Limit 10 -> Trang 2
        it("TC_STT06_GETALLTEACHERS_02: Kiểm tra việc tính toán tổng số trang khi số lượng giáo viên lớn", async () => {
            for(let i=0; i<11; i++) {
                const u = await userRepo.save(userRepo.create({ fullName: "T"+i, email: "test_t"+i+"@x.com", role: UserRole.TEACHER, passwordHash: "h" }));
                await userRepo.query(`UPDATE users SET full_name = 'T${i}' WHERE id = ${u.id}`);
            }
            const result = await service.getAllTeachers(defaultPagination);
            expect(result.totalPages).toBe(2);
        });

        // TC_STT06_GETALLTEACHERS_03: Kiểm tra Offset (Skip) của trang thứ 2
        it("TC_STT06_GETALLTEACHERS_03: Kiểm tra tính năng chuyển trang dữ liệu (Trang số 2)", async () => {
            for(let i=0; i<6; i++) await userRepo.save(userRepo.create({ fullName: "T"+i, email: "test_t"+i+"@x.com", role: UserRole.TEACHER, passwordHash: "h" }));
            const result = await service.getAllTeachers({ ...defaultPagination, page: 2, limit: 5 });
            expect(result.data).toHaveLength(1);
        });

        // TC_STT06_GETALLTEACHERS_04: Bảo mật thông tin (Ẩn mật khẩu)
        it("TC_STT06_GETALLTEACHERS_04: Đảm bảo thông tin mật khẩu (Hash) không bị lộ trong danh sách công khai", async () => {
            await userRepo.save(userRepo.create({ fullName: "T", email: "test_t@x.com", role: UserRole.TEACHER, passwordHash: "h" }));
            const result = await service.getAllTeachers(defaultPagination);
            expect(result.data[0].passwordHash).toBeUndefined();
        });

        // TC_STT06_GETALLTEACHERS_05: Danh sách rỗng khi không có giáo viên
        it("TC_STT06_GETALLTEACHERS_05: Trả về danh sách trống nếu hệ thống chưa có tài khoản giáo viên nào", async () => {
            const result = await service.getAllTeachers(defaultPagination);
            expect(result.data).toEqual([]);
        });
    });

    describe("Tạo tài khoản giáo viên (createTeacher)", () => {
        const dto = { email: 'test_new_t@x.com', password: 'p', fullName: 'New Teacher' };

        // TC_STT06_CREATETEACHER_01: Tạo thành công với email mới
        it("TC_STT06_CREATETEACHER_01: Thực hiện đăng ký tài khoản giáo viên mới với thông tin hợp lệ", async () => {
            const result = await service.createTeacher(dto as any);
            expect(result.email).toBe(dto.email);
            const createdUser = await userRepo.findOne({ where: { email: dto.email } });
            expect(createdUser).not.toBeNull();
            expect(createdUser.fullName).toBe(dto.fullName);
        });

        // TC_STT06_CREATETEACHER_02: Kiểm tra mã hóa Bcrypt (Salt=10)
        it("TC_STT06_CREATETEACHER_02: Xác nhận mật khẩu đã được mã hóa an toàn trước khi lưu vào cơ sở dữ liệu", async () => {
            const result = await service.createTeacher({ ...dto, email: 'test_hash@x.com' } as any);
            const user = await userRepo.findOne({ where: { id: (result as any).id } });
            expect(user.passwordHash).not.toBe('p');
            expect(await bcrypt.compare('p', user.passwordHash)).toBe(true);
        });

        // TC_STT06_CREATETEACHER_03: Gán quyền mặc định TEACHER
        it("TC_STT06_CREATETEACHER_03: Kiểm tra quyền truy cập (Role) được gán mặc định là giáo viên", async () => {
            const result = await service.createTeacher({ ...dto, email: 'test_role@x.com' } as any);
            expect(result.role).toBe(UserRole.TEACHER);
        });

        // TC_STT06_CREATETEACHER_04: Trả về đối tượng đã ẩn mật khẩu
        it("TC_STT06_CREATETEACHER_04: Kiểm tra dữ liệu phản hồi ngay sau khi tạo tài khoản không chứa mật khẩu", async () => {
            const result = await service.createTeacher({ ...dto, email: 'test_hide@x.com' } as any);
            expect((result as any).passwordHash).toBeUndefined();
        });

        // TC_STT06_CREATETEACHER_05: Ngăn chặn trùng lặp Email
        it("TC_STT06_CREATETEACHER_05: Ngăn chặn việc đăng ký tài khoản với email đã tồn tại trong hệ thống", async () => {
            await service.createTeacher(dto as any);
            await expect(service.createTeacher(dto as any)).rejects.toThrow(ConflictException);
        });
    });

    describe("Tìm kiếm giáo viên (searchTeachers)", () => {
        // TC_STT06_SEARCHTEACHERS_01: Tìm theo tên (LIKE)
        it("TC_STT06_SEARCHTEACHERS_01: Tìm kiếm giáo viên theo từ khóa tên (sử dụng cơ chế LIKE)", async () => {
            const u = await userRepo.save(userRepo.create({ fullName: "Nguyen Van A", email: "test_s1@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            await userRepo.query("UPDATE users SET full_name = 'Nguyen Van A' WHERE id = " + u.id);
            const result = await service.searchTeachers({ keyword: 'Nguyen' });
            expect(result.teachers).toHaveLength(1);
        });

        // TC_STT06_SEARCHTEACHERS_02: Tìm theo email
        it("TC_STT06_SEARCHTEACHERS_02: Tìm kiếm giáo viên dựa trên một phần địa chỉ email", async () => {
            await userRepo.save(userRepo.create({ fullName: "B", email: "special_t@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            const result = await service.searchTeachers({ keyword: 'special' });
            expect(result.teachers).toHaveLength(1);
        });

        // TC_STT06_SEARCHTEACHERS_03: Lấy tất cả khi không truyền keyword
        it("TC_STT06_SEARCHTEACHERS_03: Trả về toàn bộ danh sách nếu không cung cấp từ khóa tìm kiếm", async () => {
            await userRepo.save(userRepo.create({ fullName: "T", email: "test_t@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            const result = await service.searchTeachers({} as any);
            expect(result.teachers.length).toBeGreaterThan(0);
        });

        // TC_STT06_SEARCHTEACHERS_04: Keyword rỗng
        it("TC_STT06_SEARCHTEACHERS_04: Xử lý tìm kiếm với từ khóa là chuỗi văn bản trống", async () => {
            await userRepo.save(userRepo.create({ fullName: "T", email: "test_t@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            const result = await service.searchTeachers({ keyword: '' });
            expect(result.teachers.length).toBeGreaterThan(0);
        });

        // TC_STT06_SEARCHTEACHERS_05: Phân trang mặc định (Limit=12)
        it("TC_STT06_SEARCHTEACHERS_05: Kiểm tra số lượng kết quả hiển thị mặc định trên một trang (12)", async () => {
            for(let i=0; i<15; i++) await userRepo.save(userRepo.create({ fullName: "T"+i, email: "test_t"+i+"@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            const result = await service.searchTeachers({ keyword: 'test_t' });
            expect(result.limit).toBe(12);
            expect(result.teachers).toHaveLength(12);
        });

        // TC_STT06_SEARCHTEACHERS_06: Cấu trúc dữ liệu phản hồi
        it("TC_STT06_SEARCHTEACHERS_06: Kiểm tra tính đầy đủ và cấu trúc của dữ liệu phản hồi khi tìm kiếm", async () => {
            const result = await service.searchTeachers({ keyword: 'x' });
            expect(result).toHaveProperty('totalPages');
            expect(result).toHaveProperty('teachers');
        });

        // TC_STT06_SEARCHTEACHERS_07: Bảo mật trong tìm kiếm
        it("TC_STT06_SEARCHTEACHERS_07: Đảm bảo thông tin bảo mật không xuất hiện trong kết quả tìm kiếm công khai", async () => {
            await userRepo.save(userRepo.create({ fullName: "T", email: "test_t@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            const result = await service.searchTeachers({ keyword: 'test_t' });
            expect(result.teachers[0].passwordHash).toBeUndefined();
        });

        // TC_STT06_SEARCHTEACHERS_08: Kết quả không tìm thấy
        it("TC_STT06_SEARCHTEACHERS_08: Trả về mảng rỗng khi không tìm thấy giáo viên nào khớp với từ khóa", async () => {
            const result = await service.searchTeachers({ keyword: 'non_existent_key' });
            expect(result.teachers).toHaveLength(0);
        });
    });

    describe("Hồ sơ chi tiết giáo viên (getTeacherById)", () => {
        async function seedTeacherWithCourses() {
            const t = await userRepo.save(userRepo.create({ fullName: "Teacher", email: "test_t@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            const s = await subjectRepo.save(subjectRepo.create({ name: "Sub" }));
            const g = await gradeRepo.save(gradeRepo.create({ name: "G" }));
            const c1 = await courseRepo.save(courseRepo.create({ title: "Approved", status: CourseStatus.APPROVED, teacher: t, subject: s, gradeLevel: g }));
            const c2 = await courseRepo.save(courseRepo.create({ title: "Draft", status: CourseStatus.DRAFT, teacher: t, subject: s, gradeLevel: g }));
            const c3 = await courseRepo.save(courseRepo.create({ title: "Pub", status: CourseStatus.PUBLISHED, teacher: t, subject: s, gradeLevel: g }));
            return { t, c1, c2, c3 };
        }

        // TC_STT06_GETTEACHERBYID_01: Lấy thành công hồ sơ giáo viên
        it("TC_STT06_GETTEACHERBYID_01: Truy vấn thông tin chi tiết của một giáo viên bằng mã ID hợp lệ", async () => {
            const { t } = await seedTeacherWithCourses();
            const result = await service.getTeacherById(t.id);
            expect(result.id).toBe(t.id);
        });

        // TC_STT06_GETTEACHERBYID_02: Giữ lại khóa học Approved
        it("TC_STT06_GETTEACHERBYID_02: Hiển thị các khóa học đã được phê duyệt (APPROVED) trong hồ sơ", async () => {
            const { t } = await seedTeacherWithCourses();
            const result = await service.getTeacherById(t.id);
            expect(result.courses.some(c => c.status === CourseStatus.APPROVED)).toBe(true);
        });

        // TC_STT06_GETTEACHERBYID_03: Giữ lại khóa học Published
        it("TC_STT06_GETTEACHERBYID_03: Hiển thị các khóa học đã được xuất bản (PUBLISHED) trong hồ sơ", async () => {
            const { t } = await seedTeacherWithCourses();
            const result = await service.getTeacherById(t.id);
            expect(result.courses.some(c => c.status === CourseStatus.PUBLISHED)).toBe(true);
        });

        // TC_STT06_GETTEACHERBYID_04: Loại bỏ khóa học Draft
        it("TC_STT06_GETTEACHERBYID_04: Ẩn các khóa học đang ở trạng thái bản nháp (DRAFT) khỏi hồ sơ công khai", async () => {
            const { t } = await seedTeacherWithCourses();
            const result = await service.getTeacherById(t.id);
            expect(result.courses.some(c => c.status === CourseStatus.DRAFT)).toBe(false);
        });

        // TC_STT06_GETTEACHERBYID_05: Thống kê số lượng khóa học hiển thị (Total Courses)
        it("TC_STT06_GETTEACHERBYID_05: Kiểm tra việc đếm tổng số lượng khóa học đủ điều kiện hiển thị", async () => {
            const { t } = await seedTeacherWithCourses();
            const result = await service.getTeacherById(t.id);
            expect(result.totalCourses).toBe(2); // Approved + Published
        });

        // TC_STT06_GETTEACHERBYID_06: Xử lý khi giáo viên không có khóa học
        it("TC_STT06_GETTEACHERBYID_06: Kiểm tra hiển thị khi giáo viên chưa được gán bất kỳ khóa học nào", async () => {
            const t = await userRepo.save(userRepo.create({ fullName: "T", email: "test_none@x.com", role: UserRole.TEACHER, status: UserStatus.ACTIVE, passwordHash: "h" }));
            const result = await service.getTeacherById(t.id);
            expect(result.totalCourses).toBe(0);
        });

        // TC_STT06_GETTEACHERBYID_07: Ẩn mật khẩu trong hồ sơ chi tiết
        it("TC_STT06_GETTEACHERBYID_07: Đảm bảo bảo mật thông tin mật khẩu ngay cả trong trang hồ sơ chi tiết", async () => {
            const { t } = await seedTeacherWithCourses();
            const result = await service.getTeacherById(t.id);
            expect((result as any).passwordHash).toBeUndefined();
        });

        // TC_STT06_GETTEACHERBYID_08: ID không tồn tại
        it("TC_STT06_GETTEACHERBYID_08: Hệ thống báo lỗi khi xem hồ sơ của một mã định danh giáo viên không tồn tại", async () => {
            await expect(service.getTeacherById(999999)).rejects.toThrow(NotFoundException);
        });
    });

    describe("Giáo viên tiêu biểu (getFeaturedTeachers)", () => {
        // TC_STT06_GETFEATUREDTEACHERS_01: Danh sách email Null
        it("TC_STT06_GETFEATUREDTEACHERS_01: Xử lý an toàn khi danh sách mã email đầu vào là giá trị Null", async () => {
            expect(await service.getFeaturedTeachers(null)).toEqual([]);
        });

        // TC_STT06_GETFEATUREDTEACHERS_02: Danh sách email Rỗng
        it("TC_STT06_GETFEATUREDTEACHERS_02: Trả về mảng trống khi danh sách mã email đầu vào không có phần tử nào", async () => {
            expect(await service.getFeaturedTeachers([])).toEqual([]);
        });

        // TC_STT06_GETFEATUREDTEACHERS_03: Giữ đúng thứ tự email gửi lên
        it("TC_STT06_GETFEATUREDTEACHERS_03: Đảm bảo danh sách giáo viên trả về đúng theo thứ tự ưu tiên của mảng email", async () => {
            await userRepo.save(userRepo.create({ email: 'test_order1@x.com', role: UserRole.TEACHER, status: UserStatus.ACTIVE, fullName: 'A', passwordHash: 'h' }));
            await userRepo.save(userRepo.create({ email: 'test_order2@x.com', role: UserRole.TEACHER, status: UserStatus.ACTIVE, fullName: 'B', passwordHash: 'h' }));
            const res = await service.getFeaturedTeachers(['test_order2@x.com', 'test_order1@x.com']);
            expect(res[0].email).toBe('test_order2@x.com');
            expect(res[1].email).toBe('test_order1@x.com');
        });

        // TC_STT06_GETFEATUREDTEACHERS_04: Lọc bỏ Email không tồn tại
        it("TC_STT06_GETFEATUREDTEACHERS_04: Tự động loại bỏ các địa chỉ email không tồn tại trong cơ sở dữ liệu", async () => {
            await userRepo.save(userRepo.create({ email: 'test_ex@x.com', role: UserRole.TEACHER, status: UserStatus.ACTIVE, fullName: 'E', passwordHash: 'h' }));
            const res = await service.getFeaturedTeachers(['test_ex@x.com', 'ghost@x.com']);
            expect(res).toHaveLength(1);
            expect(res[0].email).toBe('test_ex@x.com');
        });

        // TC_STT06_GETFEATUREDTEACHERS_05: Chỉ hiển thị khóa học Approved
        it("TC_STT06_GETFEATUREDTEACHERS_05: Chỉ hiển thị các khóa học đã phê duyệt cho nhóm giáo viên tiêu biểu", async () => {
            const t = await userRepo.save(userRepo.create({ email: 'test_appr@x.com', role: UserRole.TEACHER, status: UserStatus.ACTIVE, fullName: 'T', passwordHash: 'h' }));
            const s = await subjectRepo.save(subjectRepo.create({ name: "Sub" }));
            const g = await gradeRepo.save(gradeRepo.create({ name: "G" }));
            await courseRepo.save(courseRepo.create({ title: "C", status: CourseStatus.APPROVED, teacher: t, subject: s, gradeLevel: g }));
            const res = await service.getFeaturedTeachers(['test_appr@x.com']);
            expect(res[0].courses).toHaveLength(1);
        });

        // TC_STT06_GETFEATUREDTEACHERS_06: Chỉ hiển thị khóa học Published
        it("TC_STT06_GETFEATUREDTEACHERS_06: Chỉ hiển thị các khóa học đã xuất bản cho nhóm giáo viên tiêu biểu", async () => {
            const t = await userRepo.save(userRepo.create({ email: 'test_pub@x.com', role: UserRole.TEACHER, status: UserStatus.ACTIVE, fullName: 'T', passwordHash: 'h' }));
            const s = await subjectRepo.save(subjectRepo.create({ name: "Sub" }));
            const g = await gradeRepo.save(gradeRepo.create({ name: "G" }));
            await courseRepo.save(courseRepo.create({ title: "C", status: CourseStatus.PUBLISHED, teacher: t, subject: s, gradeLevel: g }));
            const res = await service.getFeaturedTeachers(['test_pub@x.com']);
            expect(res[0].courses).toHaveLength(1);
        });

        // TC_STT06_GETFEATUREDTEACHERS_07: Xử lý giáo viên chưa có khóa học (totalCourses = 0)
        it("TC_STT06_GETFEATUREDTEACHERS_07: Kiểm tra hiển thị thống kê khi giáo viên tiêu biểu chưa có khóa học nào", async () => {
            await userRepo.save(userRepo.create({ email: 'test_none@x.com', role: UserRole.TEACHER, status: UserStatus.ACTIVE, fullName: 'T', passwordHash: 'h' }));
            const res = await service.getFeaturedTeachers(['test_none@x.com']);
            expect(res[0].totalCourses).toBe(0);
        });

        // TC_STT06_GETFEATUREDTEACHERS_08: Bảo mật danh sách tiêu biểu (Ẩn mật khẩu)
        it("TC_STT06_GETFEATUREDTEACHERS_08: Đảm bảo thông tin mật khẩu luôn được bảo mật trong danh sách tiêu biểu", async () => {
            await userRepo.save(userRepo.create({ email: 'test_sec@x.com', role: UserRole.TEACHER, status: UserStatus.ACTIVE, fullName: 'T', passwordHash: 'h' }));
            const res = await service.getFeaturedTeachers(['test_sec@x.com']);
            expect((res[0] as any).passwordHash).toBeUndefined();
        });
    });
});
