import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, ConflictException, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { UsersService } from "../../../../src_code/elearning-backend/src/modules/users/users.service";
import * as Entities from "../../../../src_code/elearning-backend/src/entities";
import {
  UserRole,
  UserStatus,
} from "../../../../src_code/elearning-backend/src/entities/user.entity";
import { CourseStatus } from "../../../../src_code/elearning-backend/src/entities/course.entity";
import * as bcrypt from "bcrypt";

describe("Kiểm thử tích hợp UsersService (STT06) - Kết nối Database thực tế", () => {
  let service: UsersService;
  let dataSource: DataSource;
  // Khai báo các Repository để thao tác trực tiếp với Database trong quá trình test
  let userRepo: Repository<Entities.User>;
  let courseRepo: Repository<Entities.Course>;
  let subjectRepo: Repository<Entities.Subject>;
  let gradeRepo: Repository<Entities.GradeLevel>;

  // Khởi tạo môi trường kiểm thử tích hợp trước khi thực thi toàn bộ suite
  beforeAll(async () => {
    // Thiết lập Module kiểm thử của NestJS với cấu hình cơ sở dữ liệu thực tế
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // Kết nối tới cơ sở dữ liệu MySQL chạy trên Docker (port 3307)
        TypeOrmModule.forRoot({
          type: "mysql",
          host: "127.0.0.1",
          port: 3307,
          username: "root",
          password: "1234",
          database: "elearning",
          // Đăng ký toàn bộ các Entity vào TypeORM
          entities: Object.values(Entities),
          // Vô hiệu hóa synchronize để tránh thay đổi schema tự động
          synchronize: false,
        }),
        // Đăng ký các Repository của Entity vào module để sử dụng trong service
        TypeOrmModule.forFeature(Object.values(Entities)),
      ],
      // Khai báo service cần kiểm thử
      providers: [UsersService],
    }).compile();

    // Lấy instance của UsersService từ module đã biên dịch
    service = module.get<UsersService>(UsersService);
    // Lấy instance của DataSource để thực thi SQL trực tiếp khi cần
    dataSource = module.get<DataSource>(DataSource);
    // Khởi tạo các Repository tương ứng để thao tác dữ liệu trong các bảng
    userRepo = module.get<Repository<Entities.User>>(
      getRepositoryToken(Entities.User),
    );
    courseRepo = module.get<Repository<Entities.Course>>(
      getRepositoryToken(Entities.Course),
    );
    subjectRepo = module.get<Repository<Entities.Subject>>(
      getRepositoryToken(Entities.Subject),
    );
    gradeRepo = module.get<Repository<Entities.GradeLevel>>(
      getRepositoryToken(Entities.GradeLevel),
    );

    // Mock phương thức log của Logger để giữ terminal sạch sẽ khi chạy test
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    // Mock phương thức warn của Logger để tránh in các cảnh báo nghiệp vụ
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
  });

  // Giải phóng kết nối cơ sở dữ liệu sau khi hoàn thành toàn bộ test case
  afterAll(async () => {
    // Đóng kết nối DataSource
    if (dataSource) await dataSource.destroy();
  });

  // Hàm thực hiện xóa sạch dữ liệu trong các bảng liên quan để đảm bảo tính độc lập giữa các test
  async function cleanUp() {
    // Vô hiệu hóa kiểm tra ràng buộc khóa ngoại để thực hiện TRUNCATE
    await dataSource.query("SET FOREIGN_KEY_CHECKS = 0");
    // Xóa dữ liệu bảng users
    await userRepo.query("TRUNCATE TABLE users");
    // Xóa dữ liệu bảng courses
    await courseRepo.query("TRUNCATE TABLE courses");
    // Xóa dữ liệu bảng subjects
    await subjectRepo.query("TRUNCATE TABLE subjects");
    // Xóa dữ liệu bảng grade_levels
    await gradeRepo.query("TRUNCATE TABLE grade_levels");
    // Xóa dữ liệu bảng exams thông qua query trực tiếp
    await dataSource.query("TRUNCATE TABLE exams");
    // Tái kích hoạt kiểm tra ràng buộc khóa ngoại
    await dataSource.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  // Thực hiện dọn dẹp cơ sở dữ liệu trước khi bắt đầu mỗi ca kiểm thử đơn lẻ
  beforeEach(async () => {
    await cleanUp();
  });

  // Cấu hình tham số phân trang mặc định cho các phương thức truy vấn danh sách
  const defaultPagination = {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    order: "DESC",
  };

  describe("Tìm kiếm người dùng (findById)", () => {
    // TC_STT06_FINDBYID_01: Kiểm tra tính chính xác của phương thức truy vấn người dùng theo mã định danh (ID)
    // Mục tiêu: Xác nhận hệ thống truy xuất và trả về đúng đối tượng User tương ứng với ID hợp lệ đã tồn tại
    // Input: Bản ghi User mới khởi tạo trong cơ sở dữ liệu
    // Expected: Đối tượng trả về có thuộc tính id khớp hoàn toàn với ID đầu vào
    it("TC_STT06_FINDBYID_01: Kiểm tra lấy thông tin người dùng bằng mã ID hợp lệ", async () => {
      // Khởi tạo và lưu một bản ghi User vào cơ sở dữ liệu để chuẩn bị dữ liệu kiểm thử
      const user = await userRepo.save(
        userRepo.create({
          fullName: "U",
          email: "test_find@x.com",
          role: UserRole.STUDENT,
          passwordHash: "h",
        }),
      );
      // Cập nhật trường full_name thông qua SQL trực tiếp để đồng bộ dữ liệu chính xác cho kiểm tra
      await userRepo.query(
        "UPDATE users SET full_name = 'U' WHERE id = " + user.id,
      );
      // Thực hiện truy vấn thông tin người dùng thông qua service và kiểm tra kết quả kỳ vọng
      expect((await service.findById(user.id)).id).toBe(user.id);
    });

    // TC_STT06_FINDBYID_02: Kiểm tra khả năng xử lý ngoại lệ khi truy vấn ID không tồn tại
    // Mục tiêu: Đảm bảo hệ thống ném ngoại lệ NotFoundException khi không tìm thấy bản ghi tương ứng trong bảng users
    // Input: ID = 999999 (Giả định không tồn tại trong hệ thống)
    // Expected: Ném ra lỗi NotFoundException
    it("TC_STT06_FINDBYID_02: Hệ thống báo lỗi khi truy vấn mã người dùng không tồn tại", async () => {
      // Thực thi phương thức findById với mã ID ảo và kiểm tra việc ném ngoại lệ đúng quy định
      await expect(service.findById(999999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("Cập nhật thông tin người dùng (updateUser)", () => {
    // TC_STT06_UPDATEUSER_01: Kiểm tra tính năng cập nhật từng trường thông tin đơn lẻ (Họ tên)
    // Mục tiêu: Xác thực logic sử dụng Object.assign và phương thức save của Repository hoạt động chính xác cho việc cập nhật dữ liệu
    // Input: Đối tượng User hiện có và DTO chứa thông tin fullName mới
    // Expected: Dữ liệu trả về từ service và dữ liệu lưu trong DB đều phải mang giá trị mới
    it("TC_STT06_UPDATEUSER_01: Kiểm tra việc cập nhật họ tên của người dùng trong hệ thống", async () => {
      // Tạo bản ghi người dùng ban đầu với tên "Old"
      const user = await userRepo.save(
        userRepo.create({
          fullName: "Old",
          email: "test_u@x.com",
          role: UserRole.STUDENT,
          passwordHash: "h",
        }),
      );
      // Đảm bảo dữ liệu trong DB được cập nhật chính xác trước khi thực hiện test
      await userRepo.query(
        "UPDATE users SET full_name = 'Old' WHERE id = " + user.id,
      );
      // Gọi phương thức updateUser của service để đổi tên thành "New"
      const result = await service.updateUser(user.id, { fullName: "New" });
      // Kiểm tra kết quả trả về từ service có mang tên mới hay không
      expect(result.fullName).toBe("New");
      // Truy vấn trực tiếp từ database để xác nhận việc lưu trữ dữ liệu đã thành công
      const updatedUser = await userRepo.findOne({ where: { id: user.id } });
      // Kỳ vọng giá trị trong database là "New"
      expect(updatedUser.fullName).toBe("New");
    });

    // TC_STT06_UPDATEUSER_02: Kiểm tra tính năng cập nhật đồng thời nhiều thuộc tính
    // Mục tiêu: Xác nhận hệ thống có khả năng xử lý payload chứa nhiều trường thông tin cùng lúc
    // Input: fullName mới và số điện thoại mới
    // Expected: Tất cả các trường thông tin trong cơ sở dữ liệu đều được cập nhật tương ứng
    it("TC_STT06_UPDATEUSER_02: Cập nhật đồng thời nhiều trường dữ liệu thông tin cá nhân", async () => {
      // Tạo người dùng mẫu ban đầu
      const user = await userRepo.save(
        userRepo.create({
          fullName: "A",
          email: "test_u2@x.com",
          role: UserRole.STUDENT,
          passwordHash: "h",
        }),
      );
      // Thực hiện cập nhật đồng thời cả tên và số điện thoại
      const result = await service.updateUser(user.id, {
        fullName: "Updated Name",
        phone: "0987654321",
      });
      // Kiểm tra thuộc tính fullName trong kết quả trả về
      expect(result.fullName).toBe("Updated Name");
      // Kiểm tra thuộc tính phone trong kết quả trả về
      expect(result.phone).toBe("0987654321");
      // Lấy lại bản ghi từ database để kiểm tra tính toàn vẹn của việc lưu trữ
      const updatedUser = await userRepo.findOne({ where: { id: user.id } });
      // Xác nhận tên mới đã lưu vào DB
      expect(updatedUser.fullName).toBe("Updated Name");
      // Xác nhận số điện thoại mới đã lưu vào DB
      expect(updatedUser.phone).toBe("0987654321");
    });

    // TC_STT06_UPDATEUSER_03: Kiểm tra xử lý lỗi khi cập nhật tài khoản không tồn tại
    // Mục tiêu: Đảm bảo tính bảo mật và logic bằng cách ném NotFoundException khi ID đầu vào không có trong DB
    // Input: ID = 999999
    // Expected: Ném lỗi NotFoundException
    it("TC_STT06_UPDATEUSER_03: Hệ thống báo lỗi khi yêu cầu cập nhật cho người dùng ảo", async () => {
      // Kiểm tra việc ném ngoại lệ khi thực hiện cập nhật trên một mã định danh rác
      await expect(
        service.updateUser(999999, { fullName: "X" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Xóa người dùng (deleteUser)", () => {
    // TC_STT06_DELETEUSER_01: Kiểm tra quy trình xóa vĩnh viễn tài khoản người dùng
    // Mục tiêu: Xác nhận bản ghi bị xóa hoàn toàn khỏi bảng users sau khi thực thi phương thức delete
    // Input: Một đối tượng User đã tồn tại trong DB
    // Expected: Truy vấn lại theo ID sau khi xóa phải trả về giá trị null
    it("TC_STT06_DELETEUSER_01: Thực hiện quy trình xóa tài khoản người dùng khỏi hệ thống", async () => {
      // Tạo bản ghi người dùng cần xóa
      const user = await userRepo.save(
        userRepo.create({
          fullName: "D",
          email: "test_d@x.com",
          role: UserRole.STUDENT,
          passwordHash: "h",
        }),
      );
      // Thực thi phương thức xóa người dùng thông qua service
      await service.deleteUser(user.id);
      // Thực hiện tìm kiếm lại theo mã ID vừa xóa trong database
      const check = await userRepo.findOne({ where: { id: user.id } });
      // Kỳ vọng kết quả là null để chứng minh dữ liệu đã bị loại bỏ
      expect(check).toBeNull();
    });

    // TC_STT06_DELETEUSER_02: Kiểm tra xử lý lỗi khi xóa mã người dùng không tồn tại
    // Mục tiêu: Đảm bảo hệ thống báo lỗi chính xác khi nhận yêu cầu xóa một thực thể không có thực
    // Input: ID = 999999
    // Expected: Ném lỗi NotFoundException
    it("TC_STT06_DELETEUSER_02: Báo lỗi khi cố gắng xóa một mã người dùng không có thực", async () => {
      // Kiểm tra việc ném ngoại lệ khi thực hiện hành động xóa trên ID không tồn tại
      await expect(service.deleteUser(999999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Danh sách giáo viên (getAllTeachers)", () => {
    // TC_STT06_GETALLTEACHERS_01: Kiểm tra tính chính xác của việc truy vấn danh sách giáo viên
    // Mục tiêu: Xác nhận hệ thống lọc đúng người dùng có vai trò TEACHER và trả về cấu trúc phân trang hợp lệ
    // Input: Một bản ghi User vai trò TEACHER
    // Expected: Thuộc tính total = 1 và mảng data chứa đúng đối tượng giáo viên
    it("TC_STT06_GETALLTEACHERS_01: Truy vấn danh sách giáo viên với đầy đủ thông tin phân trang", async () => {
      // Tạo một người dùng có vai trò giáo viên trong database
      await userRepo.save(
        userRepo.create({
          fullName: "T",
          email: "test_t@x.com",
          role: UserRole.TEACHER,
          passwordHash: "h",
        }),
      );
      // Gọi phương thức lấy toàn bộ giáo viên với tham số phân trang mặc định
      const result = await service.getAllTeachers(defaultPagination);
      // Kiểm tra số lượng phần tử trong mảng data trả về
      expect(result.data).toHaveLength(1);
      // Xác nhận tổng số lượng bản ghi đếm được trong database
      expect(result.total).toBe(1);
    });

    // TC_STT06_GETALLTEACHERS_02: Kiểm tra logic tính toán tổng số trang (Total Pages)
    // Mục tiêu: Xác nhận công thức ceil(total / limit) hoạt động chính xác khi số lượng bản ghi vượt quá kích thước một trang
    // Input: 11 giáo viên, Limit = 10
    // Expected: totalPages = 2
    it("TC_STT06_GETALLTEACHERS_02: Kiểm tra việc tính toán tổng số trang khi số lượng giáo viên lớn", async () => {
      // Thực hiện vòng lặp để tạo 11 bản ghi giáo viên
      for (let i = 0; i < 11; i++) {
        // Lưu từng bản ghi giáo viên vào database
        const u = await userRepo.save(
          userRepo.create({
            fullName: "T" + i,
            email: "test_t" + i + "@x.com",
            role: UserRole.TEACHER,
            passwordHash: "h",
          }),
        );
        // Cập nhật tên thông qua SQL trực tiếp để đảm bảo tính nhất quán của dữ liệu kiểm thử
        await userRepo.query(
          `UPDATE users SET full_name = 'T${i}' WHERE id = ${u.id}`,
        );
      }
      // Gọi service với limit mặc định là 10
      const result = await service.getAllTeachers(defaultPagination);
      // Kỳ vọng hệ thống tính toán ra 2 trang dữ liệu
      expect(result.totalPages).toBe(2);
    });

    // TC_STT06_GETALLTEACHERS_03: Kiểm tra tính năng bỏ qua bản ghi (Offset/Skip) trong phân trang
    // Mục tiêu: Xác nhận tham số page và limit được chuyển đổi thành OFFSET chính xác trong câu lệnh SQL
    // Input: 6 giáo viên, Page = 2, Limit = 5
    // Expected: data.length = 1 (Bản ghi thứ 6)
    it("TC_STT06_GETALLTEACHERS_03: Kiểm tra tính năng chuyển trang dữ liệu (Trang số 2)", async () => {
      // Tạo 6 bản ghi giáo viên mẫu
      for (let i = 0; i < 6; i++)
        await userRepo.save(
          userRepo.create({
            fullName: "T" + i,
            email: "test_t" + i + "@x.com",
            role: UserRole.TEACHER,
            passwordHash: "h",
          }),
        );
      // Yêu cầu lấy trang 2 với mỗi trang 5 bản ghi (Bỏ qua 5 bản ghi đầu)
      const result = await service.getAllTeachers({
        ...defaultPagination,
        page: 2,
        limit: 5,
      });
      // Kỳ vọng chỉ còn lại 1 bản ghi cuối cùng
      expect(result.data).toHaveLength(1);
    });

    // TC_STT06_GETALLTEACHERS_04: Kiểm tra tính bảo mật của dữ liệu trả về (Data Masking)
    // Mục tiêu: Đảm bảo thông tin nhạy cảm (passwordHash) bị loại bỏ khỏi đối tượng trước khi trả về client
    // Expected: Thuộc tính passwordHash mang giá trị undefined
    it("TC_STT06_GETALLTEACHERS_04: Đảm bảo thông tin mật khẩu (Hash) không bị lộ trong danh sách công khai", async () => {
      // Tạo giáo viên mẫu
      await userRepo.save(
        userRepo.create({
          fullName: "T",
          email: "test_t@x.com",
          role: UserRole.TEACHER,
          passwordHash: "h",
        }),
      );
      // Lấy danh sách giáo viên
      const result = await service.getAllTeachers(defaultPagination);
      // Xác nhận trường passwordHash đã được loại bỏ để đảm bảo an toàn thông tin
      expect(result.data[0].passwordHash).toBeUndefined();
    });

    // TC_STT06_GETALLTEACHERS_05: Kiểm tra trường hợp danh sách trống
    // Mục tiêu: Xác nhận hệ thống trả về mảng rỗng thay vì lỗi khi không có dữ liệu thỏa mãn điều kiện
    // Expected: data = []
    it("TC_STT06_GETALLTEACHERS_05: Trả về danh sách trống nếu hệ thống chưa có tài khoản giáo viên nào", async () => {
      // Thực hiện truy vấn khi database đã được dọn dẹp sạch sẽ (không có giáo viên)
      const result = await service.getAllTeachers(defaultPagination);
      // Kỳ vọng kết quả là mảng rỗng
      expect(result.data).toEqual([]);
    });
  });

  describe("Tạo tài khoản giáo viên (createTeacher)", () => {
    // Dữ liệu đầu vào mẫu cho hành động tạo giáo viên
    const dto = {
      email: "test_new_t@x.com",
      password: "p",
      fullName: "New Teacher",
    };

    // TC_STT06_CREATETEACHER_01: Kiểm tra quy trình đăng ký tài khoản giáo viên hợp lệ
    // Mục tiêu: Xác nhận thông tin được lưu trữ chính xác vào bảng users với email và họ tên cung cấp
    // Input: Email chưa tồn tại trong hệ thống
    // Expected: Bản ghi mới được tạo thành công trong DB
    it("TC_STT06_CREATETEACHER_01: Thực hiện đăng ký tài khoản giáo viên mới với thông tin hợp lệ", async () => {
      // Gọi phương thức tạo giáo viên từ service
      const result = await service.createTeacher(dto as any);
      // Kiểm tra email trong kết quả trả về
      expect(result.email).toBe(dto.email);
      // Truy vấn trực tiếp từ database để xác nhận sự tồn tại của bản ghi
      const createdUser = await userRepo.findOne({
        where: { email: dto.email },
      });
      // Kỳ vọng tìm thấy người dùng
      expect(createdUser).not.toBeNull();
      // Kiểm tra tính chính xác của họ tên trong DB
      expect(createdUser.fullName).toBe(dto.fullName);
    });

    // TC_STT06_CREATETEACHER_02: Kiểm tra logic mã hóa mật khẩu (Password Hashing)
    // Mục tiêu: Đảm bảo mật khẩu dạng text không được lưu trực tiếp mà phải thông qua thuật toán Bcrypt
    // Input: password = "p"
    // Expected: passwordHash trong DB khác "p" và bcrypt.compare trả về true
    it("TC_STT06_CREATETEACHER_02: Xác nhận mật khẩu đã được mã hóa an toàn trước khi lưu vào cơ sở dữ liệu", async () => {
      // Tạo giáo viên mới với email riêng để tránh trùng lặp
      const result = await service.createTeacher({
        ...dto,
        email: "test_hash@x.com",
      } as any);
      // Lấy thông tin bản ghi vừa tạo từ DB
      const user = await userRepo.findOne({
        where: { id: (result as any).id },
      });
      // Xác nhận mật khẩu lưu trữ không phải là chuỗi văn bản thuần túy
      expect(user.passwordHash).not.toBe("p");
      // Sử dụng thư viện bcrypt để kiểm tra tính tương thích giữa mật khẩu thuần và chuỗi hash
      expect(await bcrypt.compare("p", user.passwordHash)).toBe(true);
    });

    // TC_STT06_CREATETEACHER_03: Kiểm tra việc gán vai trò mặc định (Default Role)
    // Mục tiêu: Xác nhận phương thức createTeacher luôn gán vai trò TEACHER cho người dùng mới
    // Expected: Thuộc tính role = UserRole.TEACHER
    it("TC_STT06_CREATETEACHER_03: Kiểm tra quyền truy cập (Role) được gán mặc định là giáo viên", async () => {
      // Thực hiện tạo giáo viên mới
      const result = await service.createTeacher({
        ...dto,
        email: "test_role@x.com",
      } as any);
      // Kiểm tra giá trị của trường role trong đối tượng trả về
      expect(result.role).toBe(UserRole.TEACHER);
    });

    // TC_STT06_CREATETEACHER_04: Kiểm tra tính bảo mật của phản hồi ngay sau khi tạo (Post-creation Masking)
    // Mục tiêu: Đảm bảo đối tượng người dùng vừa tạo không chứa passwordHash khi trả về client
    // Expected: (result as any).passwordHash = undefined
    it("TC_STT06_CREATETEACHER_04: Kiểm tra dữ liệu phản hồi ngay sau khi tạo tài khoản không chứa mật khẩu", async () => {
      // Thực hiện tạo giáo viên mới
      const result = await service.createTeacher({
        ...dto,
        email: "test_hide@x.com",
      } as any);
      // Xác nhận trường passwordHash không tồn tại trong kết quả trả về của service
      expect((result as any).passwordHash).toBeUndefined();
    });

    // TC_STT06_CREATETEACHER_05: Kiểm tra ràng buộc duy nhất của Email (Unique Constraint)
    // Mục tiêu: Ngăn chặn việc đăng ký nhiều tài khoản trên cùng một địa chỉ email
    // Input: Email đã tồn tại trong database
    // Expected: Ném lỗi ConflictException
    it("TC_STT06_CREATETEACHER_05: Ngăn chặn việc đăng ký tài khoản với email đã tồn tại trong hệ thống", async () => {
      // Tạo giáo viên lần thứ nhất
      await service.createTeacher(dto as any);
      // Thực hiện tạo giáo viên lần thứ hai với cùng một email và kiểm tra việc ném ngoại lệ ConflictException
      await expect(service.createTeacher(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("Tìm kiếm giáo viên (searchTeachers)", () => {
    // TC_STT06_SEARCHTEACHERS_01: Kiểm tra tính năng tìm kiếm theo họ tên (Pattern Matching)
    // Mục tiêu: Xác nhận hệ thống sử dụng toán tử LIKE để tìm kiếm chuỗi ký tự trong cột full_name
    // Input: keyword = "Nguyen"
    // Expected: Trả về giáo viên có tên "Nguyen Van A"
    it("TC_STT06_SEARCHTEACHERS_01: Tìm kiếm giáo viên theo từ khóa tên (sử dụng cơ chế LIKE)", async () => {
      // Tạo giáo viên mẫu với tên đầy đủ
      const u = await userRepo.save(
        userRepo.create({
          fullName: "Nguyen Van A",
          email: "test_s1@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          passwordHash: "h",
        }),
      );
      // Cập nhật lại tên bằng SQL trực tiếp để đảm bảo tính nhất quán của dữ liệu
      await userRepo.query(
        "UPDATE users SET full_name = 'Nguyen Van A' WHERE id = " + u.id,
      );
      // Thực hiện tìm kiếm với từ khóa là một phần của họ tên
      const result = await service.searchTeachers({ keyword: "Nguyen" });
      // Kỳ vọng tìm thấy ít nhất 1 bản ghi khớp với từ khóa
      expect(result.teachers).toHaveLength(1);
    });

    // TC_STT06_SEARCHTEACHERS_02: Kiểm tra tính năng tìm kiếm theo địa chỉ email
    // Mục tiêu: Xác nhận hệ thống hỗ trợ tìm kiếm dựa trên một phần của chuỗi email
    // Input: keyword = "special"
    // Expected: Trả về giáo viên có email "special_t@x.com"
    it("TC_STT06_SEARCHTEACHERS_02: Tìm kiếm giáo viên dựa trên một phần địa chỉ email", async () => {
      // Tạo giáo viên mẫu với email đặc biệt
      await userRepo.save(
        userRepo.create({
          fullName: "B",
          email: "special_t@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          passwordHash: "h",
        }),
      );
      // Thực hiện tìm kiếm theo chuỗi ký tự có trong email
      const result = await service.searchTeachers({ keyword: "special" });
      // Kỳ vọng tìm thấy bản ghi tương ứng
      expect(result.teachers).toHaveLength(1);
    });

    // TC_STT06_SEARCHTEACHERS_03: Kiểm tra hành vi khi không cung cấp từ khóa (Default Search)
    // Mục tiêu: Đảm bảo hệ thống trả về danh sách đầy đủ khi tham số keyword bị khuyết thiếu
    // Expected: Danh sách teachers.length > 0
    it("TC_STT06_SEARCHTEACHERS_03: Trả về toàn bộ danh sách nếu không cung cấp từ khóa tìm kiếm", async () => {
      // Tạo giáo viên mẫu
      await userRepo.save(
        userRepo.create({
          fullName: "T",
          email: "test_t@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          passwordHash: "h",
        }),
      );
      // Gọi service tìm kiếm với đối tượng rỗng (không có keyword)
      const result = await service.searchTeachers({} as any);
      // Kỳ vọng hệ thống vẫn trả về dữ liệu (không lỗi)
      expect(result.teachers.length).toBeGreaterThan(0);
    });

    // TC_STT06_SEARCHTEACHERS_04: Kiểm tra hành vi với từ khóa rỗng (Empty String)
    // Mục tiêu: Đảm bảo tính ổn định của câu lệnh SQL khi giá trị LIKE là '%'
    // Expected: Trả về toàn bộ danh sách giáo viên hiện có
    it("TC_STT06_SEARCHTEACHERS_04: Xử lý tìm kiếm với từ khóa là chuỗi văn bản trống", async () => {
      // Tạo giáo viên mẫu
      await userRepo.save(
        userRepo.create({
          fullName: "T",
          email: "test_t@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          passwordHash: "h",
        }),
      );
      // Thực hiện tìm kiếm với keyword là chuỗi rỗng
      const result = await service.searchTeachers({ keyword: "" });
      // Kỳ vọng hệ thống trả về kết quả bình thường
      expect(result.teachers.length).toBeGreaterThan(0);
    });

    // TC_STT06_SEARCHTEACHERS_05: Kiểm tra cấu hình phân trang mặc định trong tìm kiếm
    // Mục tiêu: Xác nhận hằng số limit = 12 được áp dụng khi không có cấu hình phân trang cụ thể
    // Input: 15 giáo viên thỏa mãn điều kiện
    // Expected: teachers.length = 12, limit = 12
    it("TC_STT06_SEARCHTEACHERS_05: Kiểm tra số lượng kết quả hiển thị mặc định trên một trang (12)", async () => {
      // Tạo 15 bản ghi giáo viên phục vụ kiểm thử phân trang
      for (let i = 0; i < 15; i++)
        await userRepo.save(
          userRepo.create({
            fullName: "T" + i,
            email: "test_t" + i + "@x.com",
            role: UserRole.TEACHER,
            status: UserStatus.ACTIVE,
            passwordHash: "h",
          }),
        );
      // Tìm kiếm theo pattern chung
      const result = await service.searchTeachers({ keyword: "test_t" });
      // Xác nhận giá trị limit mặc định của hệ thống là 12
      expect(result.limit).toBe(12);
      // Kiểm tra số lượng bản ghi thực tế trả về trong trang đầu tiên
      expect(result.teachers).toHaveLength(12);
    });

    // TC_STT06_SEARCHTEACHERS_06: Xác thực cấu trúc dữ liệu của phản hồi tìm kiếm
    // Mục tiêu: Đảm bảo DTO trả về chứa đủ thông tin phân trang (totalPages) và mảng dữ liệu (teachers)
    it("TC_STT06_SEARCHTEACHERS_06: Kiểm tra tính đầy đủ và cấu trúc của dữ liệu phản hồi khi tìm kiếm", async () => {
      // Thực hiện tìm kiếm bất kỳ
      const result = await service.searchTeachers({ keyword: "x" });
      // Kiểm tra sự tồn tại của thuộc tính totalPages
      expect(result).toHaveProperty("totalPages");
      // Kiểm tra sự tồn tại của mảng teachers
      expect(result).toHaveProperty("teachers");
    });

    // TC_STT06_SEARCHTEACHERS_07: Kiểm tra tính bảo mật trong kết quả tìm kiếm
    // Mục tiêu: Ngăn chặn việc để lộ passwordHash trong mảng kết quả tìm kiếm công khai
    it("TC_STT06_SEARCHTEACHERS_07: Đảm bảo thông tin bảo mật không xuất hiện trong kết quả tìm kiếm công khai", async () => {
      // Tạo giáo viên mẫu
      await userRepo.save(
        userRepo.create({
          fullName: "T",
          email: "test_t@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          passwordHash: "h",
        }),
      );
      // Thực hiện tìm kiếm
      const result = await service.searchTeachers({ keyword: "test_t" });
      // Xác nhận trường passwordHash mang giá trị undefined để đảm bảo an toàn
      expect(result.teachers[0].passwordHash).toBeUndefined();
    });

    // TC_STT06_SEARCHTEACHERS_08: Kiểm tra trường hợp không có kết quả khớp (No results)
    // Mục tiêu: Xác nhận hệ thống trả về mảng rỗng thay vì ném lỗi khi keyword không khớp với bất kỳ bản ghi nào
    it("TC_STT06_SEARCHTEACHERS_08: Trả về mảng rỗng khi không tìm thấy giáo viên nào khớp với từ khóa", async () => {
      // Thực hiện tìm kiếm với từ khóa không có trong database
      const result = await service.searchTeachers({
        keyword: "non_existent_key",
      });
      // Kỳ vọng kết quả là mảng rỗng (length = 0)
      expect(result.teachers).toHaveLength(0);
    });
  });

  describe("Hồ sơ chi tiết giáo viên (getTeacherById)", () => {
    // Hàm bổ trợ: Khởi tạo dữ liệu mồi bao gồm giáo viên và các khóa học ở nhiều trạng thái khác nhau
    async function seedTeacherWithCourses() {
      // Tạo bản ghi giáo viên mẫu
      const t = await userRepo.save(
        userRepo.create({
          fullName: "Teacher",
          email: "test_t@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          passwordHash: "h",
        }),
      );
      // Tạo thực thể Subject (Môn học) để liên kết với khóa học
      const s = await subjectRepo.save(subjectRepo.create({ name: "Sub" }));
      // Tạo thực thể GradeLevel (Khối lớp) phục vụ ràng buộc dữ liệu khóa học
      const g = await gradeRepo.save(gradeRepo.create({ name: "G" }));
      // Tạo khóa học trạng thái APPROVED (Đã duyệt)
      const c1 = await courseRepo.save(
        courseRepo.create({
          title: "Approved",
          status: CourseStatus.APPROVED,
          teacher: t,
          subject: s,
          gradeLevel: g,
        }),
      );
      // Tạo khóa học trạng thái DRAFT (Bản nháp)
      const c2 = await courseRepo.save(
        courseRepo.create({
          title: "Draft",
          status: CourseStatus.DRAFT,
          teacher: t,
          subject: s,
          gradeLevel: g,
        }),
      );
      // Tạo khóa học trạng thái PUBLISHED (Đã xuất bản)
      const c3 = await courseRepo.save(
        courseRepo.create({
          title: "Pub",
          status: CourseStatus.PUBLISHED,
          teacher: t,
          subject: s,
          gradeLevel: g,
        }),
      );
      // Trả về metadata của các thực thể đã tạo
      return { t, c1, c2, c3 };
    }

    // TC_STT06_GETTEACHERBYID_01: Kiểm tra tính năng truy vấn hồ sơ chi tiết giáo viên
    // Mục tiêu: Xác nhận hệ thống trả về đầy đủ thông tin cá nhân của giáo viên dựa trên mã ID
    // Input: ID giáo viên hợp lệ
    // Expected: Đối tượng trả về có id khớp với yêu cầu
    it("TC_STT06_GETTEACHERBYID_01: Truy vấn thông tin chi tiết của một giáo viên bằng mã ID hợp lệ", async () => {
      // Khởi tạo dữ liệu mẫu
      const { t } = await seedTeacherWithCourses();
      // Gọi phương thức lấy chi tiết giáo viên theo ID
      const result = await service.getTeacherById(t.id);
      // Xác nhận ID trong kết quả trả về
      expect(result.id).toBe(t.id);
    });

    // TC_STT06_GETTEACHERBYID_02: Kiểm tra logic lọc khóa học trạng thái APPROVED
    // Mục tiêu: Đảm bảo các khóa học đã được phê duyệt (APPROVED) phải xuất hiện trong danh sách hiển thị của giáo viên
    // Expected: result.courses chứa ít nhất một khóa học có status = APPROVED
    it("TC_STT06_GETTEACHERBYID_02: Hiển thị các khóa học đã được phê duyệt (APPROVED) trong hồ sơ", async () => {
      // Khởi tạo giáo viên và tập hợp khóa học
      const { t } = await seedTeacherWithCourses();
      // Truy vấn hồ sơ chi tiết
      const result = await service.getTeacherById(t.id);
      // Kiểm tra sự tồn tại của khóa học APPROVED trong mảng courses
      expect(
        result.courses.some((c) => c.status === CourseStatus.APPROVED),
      ).toBe(true);
    });

    // TC_STT06_GETTEACHERBYID_03: Kiểm tra logic hiển thị khóa học trạng thái PUBLISHED
    // Mục tiêu: Xác nhận các khóa học đã được xuất bản (PUBLISHED) công khai phải có mặt trong hồ sơ giáo viên
    // Expected: result.courses chứa khóa học có status = PUBLISHED
    it("TC_STT06_GETTEACHERBYID_03: Hiển thị các khóa học đã được xuất bản (PUBLISHED) trong hồ sơ", async () => {
      // Khởi tạo dữ liệu
      const { t } = await seedTeacherWithCourses();
      // Lấy thông tin chi tiết
      const result = await service.getTeacherById(t.id);
      // Xác nhận khóa học PUBLISHED được hiển thị
      expect(
        result.courses.some((c) => c.status === CourseStatus.PUBLISHED),
      ).toBe(true);
    });

    // TC_STT06_GETTEACHERBYID_04: Kiểm tra logic ẩn khóa học trạng thái DRAFT (Privacy Guard)
    // Mục tiêu: Đảm bảo các khóa học đang trong quá trình biên soạn (DRAFT) không được hiển thị công khai trong hồ sơ
    // Expected: result.courses không chứa bất kỳ khóa học nào có status = DRAFT
    it("TC_STT06_GETTEACHERBYID_04: Ẩn các khóa học đang ở trạng thái bản nháp (DRAFT) khỏi hồ sơ công khai", async () => {
      // Khởi tạo dữ liệu có bao gồm 1 khóa học DRAFT
      const { t } = await seedTeacherWithCourses();
      // Truy vấn chi tiết giáo viên
      const result = await service.getTeacherById(t.id);
      // Kỳ vọng hệ thống đã lọc bỏ khóa học DRAFT ra khỏi danh sách trả về
      expect(result.courses.some((c) => c.status === CourseStatus.DRAFT)).toBe(
        false,
      );
    });

    // TC_STT06_GETTEACHERBYID_05: Kiểm tra tính toán tổng số lượng khóa học hiển thị (Aggregation)
    // Mục tiêu: Xác nhận thuộc tính totalCourses trả về đúng số lượng các khóa học sau khi đã lọc theo trạng thái
    // Expected: totalCourses = 2 (Do c1=APPROVED và c3=PUBLISHED thỏa mãn, c2=DRAFT bị loại)
    it("TC_STT06_GETTEACHERBYID_05: Kiểm tra việc đếm tổng số lượng khóa học đủ điều kiện hiển thị", async () => {
      // Khởi tạo dữ liệu mồi
      const { t } = await seedTeacherWithCourses();
      // Lấy hồ sơ chi tiết
      const result = await service.getTeacherById(t.id);
      // Xác nhận tổng số khóa học đếm được là 2
      expect(result.totalCourses).toBe(2);
    });

    // TC_STT06_GETTEACHERBYID_06: Kiểm tra hành vi khi giáo viên chưa sở hữu khóa học nào
    // Mục tiêu: Xác nhận hệ thống xử lý an toàn và trả về totalCourses = 0 thay vì lỗi null
    it("TC_STT06_GETTEACHERBYID_06: Kiểm tra hiển thị khi giáo viên chưa được gán bất kỳ khóa học nào", async () => {
      // Tạo một giáo viên mới hoàn toàn chưa có khóa học liên kết
      const t = await userRepo.save(
        userRepo.create({
          fullName: "T",
          email: "test_none@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          passwordHash: "h",
        }),
      );
      // Truy vấn hồ sơ
      const result = await service.getTeacherById(t.id);
      // Kỳ vọng bộ đếm khóa học bằng 0
      expect(result.totalCourses).toBe(0);
    });

    // TC_STT06_GETTEACHERBYID_07: Kiểm tra tính bảo mật thông tin trong hồ sơ chi tiết
    // Mục tiêu: Đảm bảo passwordHash không xuất hiện trong dữ liệu hồ sơ chi tiết của giáo viên
    it("TC_STT06_GETTEACHERBYID_07: Đảm bảo bảo mật thông tin mật khẩu ngay cả trong trang hồ sơ chi tiết", async () => {
      // Khởi tạo dữ liệu giáo viên
      const { t } = await seedTeacherWithCourses();
      // Lấy thông tin chi tiết
      const result = await service.getTeacherById(t.id);
      // Xác nhận trường passwordHash đã được loại bỏ
      expect((result as any).passwordHash).toBeUndefined();
    });

    // TC_STT06_GETTEACHERBYID_08: Kiểm tra xử lý lỗi khi truy vấn mã ID không tồn tại
    // Mục tiêu: Xác nhận hệ thống ném NotFoundException khi yêu cầu xem hồ sơ của một ID không có trong DB
    it("TC_STT06_GETTEACHERBYID_08: Hệ thống báo lỗi khi xem hồ sơ của một mã định danh giáo viên không tồn tại", async () => {
      // Thực thi với mã ID ảo và kiểm tra ngoại lệ
      await expect(service.getTeacherById(999999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Giáo viên tiêu biểu (getFeaturedTeachers)", () => {
    // TC_STT06_GETFEATUREDTEACHERS_01: Kiểm tra xử lý tham số đầu vào Null
    // Mục tiêu: Xác nhận hệ thống có cơ chế bảo vệ (Guard clause) để trả về mảng rỗng thay vì lỗi crash khi input là null
    it("TC_STT06_GETFEATUREDTEACHERS_01: Xử lý an toàn khi danh sách mã email đầu vào là giá trị Null", async () => {
      // Thực thi phương thức với giá trị null và kỳ vọng mảng rỗng
      expect(await service.getFeaturedTeachers(null)).toEqual([]);
    });

    // TC_STT06_GETFEATUREDTEACHERS_02: Kiểm tra xử lý mảng email đầu vào rỗng
    // Mục tiêu: Đảm bảo tính ổn định khi client gửi mảng không có phần tử
    it("TC_STT06_GETFEATUREDTEACHERS_02: Trả về mảng trống khi danh sách mã email đầu vào không có phần tử nào", async () => {
      // Thực thi với mảng rỗng []
      expect(await service.getFeaturedTeachers([])).toEqual([]);
    });

    // TC_STT06_GETFEATUREDTEACHERS_03: Kiểm tra tính bảo toàn thứ tự hiển thị (Manual Sorting)
    // Mục tiêu: Xác nhận danh sách trả về phải tuân thủ đúng thứ tự của mảng email được gửi lên (theo logic kinh doanh)
    // Input: ['email_B', 'email_A']
    // Expected: result[0].email = 'email_B'
    it("TC_STT06_GETFEATUREDTEACHERS_03: Đảm bảo danh sách giáo viên trả về đúng theo thứ tự ưu tiên của mảng email", async () => {
      // Tạo giáo viên A
      await userRepo.save(
        userRepo.create({
          email: "test_order1@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          fullName: "A",
          passwordHash: "h",
        }),
      );
      // Tạo giáo viên B
      await userRepo.save(
        userRepo.create({
          email: "test_order2@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          fullName: "B",
          passwordHash: "h",
        }),
      );
      // Yêu cầu lấy giáo viên B trước giáo viên A
      const res = await service.getFeaturedTeachers([
        "test_order2@x.com",
        "test_order1@x.com",
      ]);
      // Xác nhận phần tử đầu tiên là giáo viên B
      expect(res[0].email).toBe("test_order2@x.com");
      // Xác nhận phần tử thứ hai là giáo viên A
      expect(res[1].email).toBe("test_order1@x.com");
    });

    // TC_STT06_GETFEATUREDTEACHERS_04: Kiểm tra logic lọc bỏ dữ liệu không tồn tại
    // Mục tiêu: Đảm bảo hệ thống tự động loại trừ các email không có trong DB ra khỏi mảng kết quả cuối cùng
    it("TC_STT06_GETFEATUREDTEACHERS_04: Tự động loại bỏ các địa chỉ email không tồn tại trong cơ sở dữ liệu", async () => {
      // Tạo 1 giáo viên thực tế
      await userRepo.save(
        userRepo.create({
          email: "test_ex@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          fullName: "E",
          passwordHash: "h",
        }),
      );
      // Gửi yêu cầu bao gồm 1 email thật và 1 email ảo
      const res = await service.getFeaturedTeachers([
        "test_ex@x.com",
        "ghost@x.com",
      ]);
      // Kỳ vọng chỉ trả về 1 giáo viên thực tế
      expect(res).toHaveLength(1);
      // Xác nhận đúng email tồn tại
      expect(res[0].email).toBe("test_ex@x.com");
    });

    // TC_STT06_GETFEATUREDTEACHERS_05: Kiểm tra việc hiển thị khóa học APPROVED cho danh sách tiêu biểu
    // Mục tiêu: Xác nhận các khóa học đã duyệt của giáo viên tiêu biểu được đính kèm vào dữ liệu trả về
    it("TC_STT06_GETFEATUREDTEACHERS_05: Chỉ hiển thị các khóa học đã phê duyệt cho nhóm giáo viên tiêu biểu", async () => {
      // Tạo giáo viên tiêu biểu
      const t = await userRepo.save(
        userRepo.create({
          email: "test_appr@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          fullName: "T",
          passwordHash: "h",
        }),
      );
      // Tạo metadata môn học và khối lớp
      const s = await subjectRepo.save(subjectRepo.create({ name: "Sub" }));
      const g = await gradeRepo.save(gradeRepo.create({ name: "G" }));
      // Tạo khóa học APPROVED
      await courseRepo.save(
        courseRepo.create({
          title: "C",
          status: CourseStatus.APPROVED,
          teacher: t,
          subject: s,
          gradeLevel: g,
        }),
      );
      // Lấy danh sách tiêu biểu
      const res = await service.getFeaturedTeachers(["test_appr@x.com"]);
      // Xác nhận mảng courses của giáo viên có chứa 1 phần tử
      expect(res[0].courses).toHaveLength(1);
    });

    // TC_STT06_GETFEATUREDTEACHERS_06: Kiểm tra việc hiển thị khóa học PUBLISHED cho danh sách tiêu biểu
    // Mục tiêu: Xác nhận các khóa học đã xuất bản cũng được coi là hợp lệ để hiển thị trong hồ sơ tiêu biểu
    it("TC_STT06_GETFEATUREDTEACHERS_06: Chỉ hiển thị các khóa học đã xuất bản cho nhóm giáo viên tiêu biểu", async () => {
      // Tạo giáo viên tiêu biểu
      const t = await userRepo.save(
        userRepo.create({
          email: "test_pub@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          fullName: "T",
          passwordHash: "h",
        }),
      );
      // Tạo môn học và khối lớp
      const s = await subjectRepo.save(subjectRepo.create({ name: "Sub" }));
      const g = await gradeRepo.save(gradeRepo.create({ name: "G" }));
      // Tạo khóa học PUBLISHED
      await courseRepo.save(
        courseRepo.create({
          title: "C",
          status: CourseStatus.PUBLISHED,
          teacher: t,
          subject: s,
          gradeLevel: g,
        }),
      );
      // Truy vấn giáo viên tiêu biểu
      const res = await service.getFeaturedTeachers(["test_pub@x.com"]);
      // Xác nhận danh sách khóa học của giáo viên trả về có dữ liệu
      expect(res[0].courses).toHaveLength(1);
    });

    // TC_STT06_GETFEATUREDTEACHERS_07: Kiểm tra xử lý thống kê khóa học (totalCourses)
    // Mục tiêu: Xác nhận bộ đếm tổng số khóa học hiển thị hoạt động chính xác trong danh sách tiêu biểu
    it("TC_STT06_GETFEATUREDTEACHERS_07: Kiểm tra hiển thị thống kê khi giáo viên tiêu biểu chưa có khóa học nào", async () => {
      // Tạo giáo viên chưa có khóa học
      await userRepo.save(
        userRepo.create({
          email: "test_none@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          fullName: "T",
          passwordHash: "h",
        }),
      );
      // Gọi service
      const res = await service.getFeaturedTeachers(["test_none@x.com"]);
      // Kỳ vọng chỉ số totalCourses trả về bằng 0
      expect(res[0].totalCourses).toBe(0);
    });

    // TC_STT06_GETFEATUREDTEACHERS_08: Kiểm tra bảo mật dữ liệu nhạy cảm (passwordHash)
    // Mục tiêu: Đảm bảo mật khẩu không bao giờ bị lộ trong danh sách tiêu biểu công khai
    it("TC_STT06_GETFEATUREDTEACHERS_08: Đảm bảo thông tin mật khẩu luôn được bảo mật trong danh sách tiêu biểu", async () => {
      // Tạo giáo viên tiêu biểu mẫu
      await userRepo.save(
        userRepo.create({
          email: "test_sec@x.com",
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          fullName: "T",
          passwordHash: "h",
        }),
      );
      // Lấy danh sách tiêu biểu
      const res = await service.getFeaturedTeachers(["test_sec@x.com"]);
      // Xác nhận trường passwordHash mang giá trị undefined
      expect((res[0] as any).passwordHash).toBeUndefined();
    });
  });
});
