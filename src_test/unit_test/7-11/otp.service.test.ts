jest.mock("../../../../src_code/elearning-backend/src/common/utils/redis.client", () => ({
    redisClient: {
        setEx: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
    },
}));

import { OtpService } from "../../../../src_code/elearning-backend/src/common/utils/otp.service";
import { redisClient } from "../../../../src_code/elearning-backend/src/common/utils/redis.client";

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

describe("OtpService (STT10)", () => {
    let service: OtpService;

    beforeEach(() => {
        service = new OtpService();
        jest.clearAllMocks();
        process.env.OTP_EXPIRATION = "300";
    });

    // Rollback for unit tests: reset mocks and env state after each test case.
    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.OTP_EXPIRATION;
    });

    describe("generateOTP()", () => {
        // TC_STT10_GENERATE_01
        // Objective: OTP duoc tao ra co do dai dung 6 ky tu.
        it("TC_STT10_GENERATE_01 should return OTP with 6 digits", () => {
            const otp = (service as any).generateOTP() as string;
            expect(otp).toHaveLength(6);
        });

        // TC_STT10_GENERATE_02
        // Objective: OTP chi gom cac chu so 0-9.
        it("TC_STT10_GENERATE_02 should return numeric OTP only", () => {
            const otp = (service as any).generateOTP() as string;
            expect(otp).toMatch(/^\d{6}$/);
        });

        // TC_STT10_GENERATE_03
        // Objective: OTP nam trong khoang 100000 den 999999.
        it("TC_STT10_GENERATE_03 should return OTP in valid range", () => {
            const otp = Number((service as any).generateOTP());
            expect(otp).toBeGreaterThanOrEqual(100000);
            expect(otp).toBeLessThanOrEqual(999999);
        });

        // TC_STT10_GENERATE_04
        // Objective: Hai lan tao OTP voi random khac nhau se cho ket qua khac nhau.
        it("TC_STT10_GENERATE_04 should generate different OTP values for different random seeds", () => {
            const randomSpy = jest.spyOn(Math, "random");
            randomSpy.mockReturnValueOnce(0.111111).mockReturnValueOnce(0.222222);

            const otp1 = (service as any).generateOTP() as string;
            const otp2 = (service as any).generateOTP() as string;

            expect(otp1).not.toBe(otp2);
            randomSpy.mockRestore();
        });
    });

    describe("createOTP(email, prefix)", () => {
        // TC_STT10_CREATE_01
        // Objective: Tao OTP thanh cong va tra ve chuoi OTP.
        it("TC_STT10_CREATE_01 should create OTP and return generated value", async () => {
            mockRedisClient.setEx.mockResolvedValue("OK" as never);
            const otp = await service.createOTP("user@test.com", "otp");

            expect(otp).toMatch(/^\d{6}$/);
        });

        // TC_STT10_CREATE_02
        // Objective: CheckDB - xac minh key Redis duoc tao theo format prefix:email.
        it("TC_STT10_CREATE_02 should call setEx with key format prefix:email", async () => {
            mockRedisClient.setEx.mockResolvedValue("OK" as never);

            await service.createOTP("user@test.com", "otp");

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                "otp:user@test.com",
                expect.any(Number),
                expect.any(String),
            );
        });

        // TC_STT10_CREATE_03
        // Objective: CheckDB - xac minh TTL duoc lay tu env OTP_EXPIRATION.
        it("TC_STT10_CREATE_03 should use OTP_EXPIRATION env as ttl", async () => {
            process.env.OTP_EXPIRATION = "600";
            mockRedisClient.setEx.mockResolvedValue("OK" as never);

            await service.createOTP("user@test.com", "otp");

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                "otp:user@test.com",
                600,
                expect.any(String),
            );
        });

        // TC_STT10_CREATE_04
        // Objective: TTL mac dinh la 300 khi khong co OTP_EXPIRATION.
        it("TC_STT10_CREATE_04 should fallback to default ttl=300", async () => {
            delete process.env.OTP_EXPIRATION;
            mockRedisClient.setEx.mockResolvedValue("OK" as never);

            await service.createOTP("default@test.com", "otp");

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                "otp:default@test.com",
                300,
                expect.any(String),
            );
        });

        // TC_STT10_CREATE_05
        // Objective: Nem loi khi Redis setEx that bai.
        it("TC_STT10_CREATE_05 should throw when redis setEx fails", async () => {
            mockRedisClient.setEx.mockRejectedValue(new Error("Redis down") as never);

            await expect(service.createOTP("user@test.com", "otp")).rejects.toThrow(
                "Redis down",
            );
        });
    });

    describe("verifyOTP(email, prefix, otp)", () => {
        // TC_STT10_VERIFY_01
        // Objective: Tra ve true va xoa key khi OTP hop le.
        it("TC_STT10_VERIFY_01 should return true and delete key for valid OTP", async () => {
            mockRedisClient.get.mockResolvedValue("123456" as never);
            mockRedisClient.del.mockResolvedValue(1 as never);

            const result = await service.verifyOTP("user@test.com", "otp", "123456");

            expect(result).toBe(true);
            expect(mockRedisClient.del).toHaveBeenCalledWith("otp:user@test.com");
        });

        // TC_STT10_VERIFY_02
        // Objective: Tra ve false khi OTP sai va khong xoa key.
        it("TC_STT10_VERIFY_02 should return false and not delete key for invalid OTP", async () => {
            mockRedisClient.get.mockResolvedValue("123456" as never);

            const result = await service.verifyOTP("user@test.com", "otp", "000000");

            expect(result).toBe(false);
            expect(mockRedisClient.del).not.toHaveBeenCalled();
        });

        // TC_STT10_VERIFY_03
        // Objective: Tra ve false khi OTP het han hoac khong ton tai trong Redis.
        it("TC_STT10_VERIFY_03 should return false when stored OTP is null", async () => {
            mockRedisClient.get.mockResolvedValue(null as never);

            const result = await service.verifyOTP("user@test.com", "otp", "123456");

            expect(result).toBe(false);
            expect(mockRedisClient.del).not.toHaveBeenCalled();
        });

        // TC_STT10_VERIFY_04
        // Objective: CheckDB - xac minh get su dung dung key format prefix:email.
        it("TC_STT10_VERIFY_04 should call redis get with key format prefix:email", async () => {
            mockRedisClient.get.mockResolvedValue("222222" as never);
            mockRedisClient.del.mockResolvedValue(1 as never);

            await service.verifyOTP("verify@test.com", "reset", "222222");

            expect(mockRedisClient.get).toHaveBeenCalledWith("reset:verify@test.com");
        });

        // TC_STT10_VERIFY_05
        // Objective: CheckDB - otp chi dung duoc 1 lan do key bi xoa sau lan verify dung.
        it("TC_STT10_VERIFY_05 should enforce one-time OTP usage", async () => {
            mockRedisClient.get
                .mockResolvedValueOnce("654321" as never)
                .mockResolvedValueOnce(null as never);
            mockRedisClient.del.mockResolvedValue(1 as never);

            const firstTry = await service.verifyOTP("once@test.com", "otp", "654321");
            const secondTry = await service.verifyOTP("once@test.com", "otp", "654321");

            expect(firstTry).toBe(true);
            expect(secondTry).toBe(false);
            expect(mockRedisClient.del).toHaveBeenCalledTimes(1);
        });

        // TC_STT10_VERIFY_06
        // Objective: Nem loi khi Redis get loi trong qua trinh verify.
        it("TC_STT10_VERIFY_06 should throw when redis get fails", async () => {
            mockRedisClient.get.mockRejectedValue(new Error("Redis get error") as never);

            await expect(
                service.verifyOTP("error@test.com", "otp", "123456"),
            ).rejects.toThrow("Redis get error");
        });
    });
});
