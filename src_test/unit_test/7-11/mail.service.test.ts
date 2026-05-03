jest.mock("fs/promises", () => ({
    readFile: jest.fn(),
}));

jest.mock("mjml", () => jest.fn());

import { readFile } from "fs/promises";
import mjml2html from "mjml";

import { MailService } from "../../../../src_code/elearning-backend/src/common/mail/mail.service";

type MailPayload = {
    from: string;
    to: string;
    subject: string;
    html: string;
};

describe("MailService (STT11)", () => {
    let service: MailService;

    const mockMailerService = {
        sendMail: jest.fn(),
    };

    const mockOtpService = {
        createOTP: jest.fn(),
    };

    const mockedReadFile = readFile as unknown as jest.Mock;
    const mockedMjml2html = mjml2html as unknown as jest.Mock;

    beforeEach(() => {
        service = new MailService(mockMailerService as never, mockOtpService as never);
        jest.clearAllMocks();

        process.env.EMAIL_USERNAME = "noreply@elearning.com";
        mockOtpService.createOTP.mockResolvedValue("123456");
        mockedReadFile.mockResolvedValue("<mjml><mj-body>{{ OTP }}</mj-body></mjml>");
        mockedMjml2html.mockReturnValue({ html: "<html><body>123456</body></html>" });
        mockMailerService.sendMail.mockResolvedValue(undefined);
    });

    // Rollback for unit tests: reset mocks and environment values after each test case.
    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.EMAIL_USERNAME;
    });

    describe("sendMail(to, prefix)", () => {
        // TC_STT11_SENDMAIL_01
        // Objective: Gui mail thanh cong khi tat ca dependency hoat dong binh thuong.
        it("TC_STT11_SENDMAIL_01 should send email successfully", async () => {
            await expect(service.sendMail("user@test.com", "otp")).resolves.toBeUndefined();

            expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
        });

        // TC_STT11_SENDMAIL_02
        // Objective: CheckDB - xac minh otpService.createOTP duoc goi voi (to, prefix).
        it("TC_STT11_SENDMAIL_02 should call createOTP with correct to and prefix", async () => {
            await service.sendMail("abc@test.com", "reset");

            expect(mockOtpService.createOTP).toHaveBeenCalledWith("abc@test.com", "reset");
        });

        // TC_STT11_SENDMAIL_03
        // Objective: Xac minh placeholder OTP trong template duoc thay bang OTP thuc te.
        it("TC_STT11_SENDMAIL_03 should replace OTP placeholder before mjml conversion", async () => {
            mockOtpService.createOTP.mockResolvedValue("654321");
            mockedReadFile.mockResolvedValue("<mjml><mj-body>OTP={{ OTP }}</mj-body></mjml>");
            mockedMjml2html.mockImplementation((input: string) => ({ html: `<html>${input}</html>` }));

            await service.sendMail("otp@test.com", "otp");

            const convertedInput = mockedMjml2html.mock.calls[0][0] as string;
            expect(convertedInput).toContain("654321");
            expect(convertedInput).not.toContain("{{ OTP }}");
        });

        // TC_STT11_SENDMAIL_04
        // Objective: CheckDB - xac minh payload gui mail co to, subject va html dung.
        it("TC_STT11_SENDMAIL_04 should call sendMail with expected payload", async () => {
            const generatedHtml = "<html><body>OTP template</body></html>";
            mockedMjml2html.mockReturnValue({ html: generatedHtml });

            await service.sendMail("target@test.com", "otp");

            expect(mockMailerService.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "target@test.com",
                    subject: "Mã OTP của bạn",
                    html: generatedHtml,
                }),
            );
        });

        // TC_STT11_SENDMAIL_05
        // Objective: from field phai su dung EMAIL_USERNAME tu env.
        it("TC_STT11_SENDMAIL_05 should set from address using EMAIL_USERNAME env", async () => {
            process.env.EMAIL_USERNAME = "support@elearning.com";

            await service.sendMail("from@test.com", "otp");

            const payload = mockMailerService.sendMail.mock.calls[0][0] as MailPayload;
            expect(payload.from).toContain("support@elearning.com");
        });

        // TC_STT11_SENDMAIL_06
        // Objective: Nem loi khi readFile template that bai.
        it("TC_STT11_SENDMAIL_06 should throw when template file read fails", async () => {
            mockedReadFile.mockRejectedValue(new Error("ENOENT template not found"));

            await expect(service.sendMail("error@test.com", "otp")).rejects.toThrow(
                "ENOENT template not found",
            );
            expect(mockMailerService.sendMail).not.toHaveBeenCalled();
        });

        // TC_STT11_SENDMAIL_07
        // Objective: Nem loi khi createOTP that bai.
        it("TC_STT11_SENDMAIL_07 should throw when createOTP fails", async () => {
            mockOtpService.createOTP.mockRejectedValue(new Error("OTP service error"));

            await expect(service.sendMail("error@test.com", "otp")).rejects.toThrow(
                "OTP service error",
            );
            expect(mockMailerService.sendMail).not.toHaveBeenCalled();
        });

        // TC_STT11_SENDMAIL_08
        // Objective: Nem loi khi chuyen MJML sang HTML that bai.
        it("TC_STT11_SENDMAIL_08 should throw when mjml conversion fails", async () => {
            mockedMjml2html.mockImplementation(() => {
                throw new Error("MJML conversion failed");
            });

            await expect(service.sendMail("error@test.com", "otp")).rejects.toThrow(
                "MJML conversion failed",
            );
            expect(mockMailerService.sendMail).not.toHaveBeenCalled();
        });

        // TC_STT11_SENDMAIL_09
        // Objective: Nem loi khi mailer sendMail that bai.
        it("TC_STT11_SENDMAIL_09 should throw when mailer sendMail fails", async () => {
            mockMailerService.sendMail.mockRejectedValue(new Error("SMTP failed"));

            await expect(service.sendMail("error@test.com", "otp")).rejects.toThrow(
                "SMTP failed",
            );
        });

        // TC_STT11_SENDMAIL_10
        // Objective: CheckDB - xac minh readFile goi dung encoding utf8.
        it("TC_STT11_SENDMAIL_10 should read template using utf8 encoding", async () => {
            await service.sendMail("encoding@test.com", "otp");

            expect(mockedReadFile).toHaveBeenCalledWith(expect.any(String), "utf8");
        });

        // TC_STT11_SENDMAIL_11
        // Objective: CheckDB - xac minh readFile goi dung duong dan template mjml.
        it("TC_STT11_SENDMAIL_11 should read template path ending with template.mjml", async () => {
            await service.sendMail("path@test.com", "otp");

            const templatePath = mockedReadFile.mock.calls[0][0] as string;
            expect(templatePath.replace(/\\/g, "/")).toContain(
                "src/common/mail/templates/template.mjml",
            );
        });

        // TC_STT11_SENDMAIL_12
        // Objective: Xac minh html gui di chinh la ket qua tra ve tu mjml2html.
        it("TC_STT11_SENDMAIL_12 should send HTML returned from mjml2html", async () => {
            mockedMjml2html.mockReturnValue({ html: "<html><body>Rendered</body></html>" });

            await service.sendMail("html@test.com", "otp");

            const payload = mockMailerService.sendMail.mock.calls[0][0] as MailPayload;
            expect(payload.html).toBe("<html><body>Rendered</body></html>");
        });

        // TC_STT11_SENDMAIL_13
        // Objective: Xac minh to field trong payload chinh la email nhan.
        it("TC_STT11_SENDMAIL_13 should keep recipient email in payload", async () => {
            await service.sendMail("receiver@test.com", "otp");

            const payload = mockMailerService.sendMail.mock.calls[0][0] as MailPayload;
            expect(payload.to).toBe("receiver@test.com");
        });

        // TC_STT11_SENDMAIL_14
        // Objective: Xac minh subject gui mail co gia tri mong doi.
        it("TC_STT11_SENDMAIL_14 should set expected OTP email subject", async () => {
            await service.sendMail("subject@test.com", "otp");

            const payload = mockMailerService.sendMail.mock.calls[0][0] as MailPayload;
            expect(payload.subject).toBe("Mã OTP của bạn");
        });

        // TC_STT11_SENDMAIL_15
        // Objective: CheckDB - xac minh luong xu ly goi dependency theo thu tu readFile -> createOTP -> mjml2html -> sendMail.
        it("TC_STT11_SENDMAIL_15 should execute dependencies in expected order", async () => {
            const executionOrder: string[] = [];

            mockedReadFile.mockImplementation(async () => {
                executionOrder.push("readFile");
                return "<mjml><mj-body>{{ OTP }}</mj-body></mjml>";
            });
            mockOtpService.createOTP.mockImplementation(async () => {
                executionOrder.push("createOTP");
                return "999999";
            });
            mockedMjml2html.mockImplementation(() => {
                executionOrder.push("mjml2html");
                return { html: "<html>ok</html>" };
            });
            mockMailerService.sendMail.mockImplementation(async () => {
                executionOrder.push("sendMail");
                return undefined;
            });

            await service.sendMail("order@test.com", "otp");

            expect(executionOrder).toEqual([
                "readFile",
                "createOTP",
                "mjml2html",
                "sendMail",
            ]);
        });
    });
});
