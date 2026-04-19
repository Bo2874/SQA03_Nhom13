/**
 * Unit Test Script: mail.service.ts
 * Tệp kiểm thử: elearning-backend/src/common/mail/mail.service.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. sendMail(to, prefix) - Gửi email chứa OTP
 */

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(
    '<mjml><mj-body><mj-section><mj-column><mj-text>Mã OTP: {{ OTP }}</mj-text></mj-column></mj-section></mj-body></mjml>'
  ),
}));

jest.mock('mjml', () =>
  jest.fn().mockReturnValue({ html: '<html><body>Mã OTP: PLACEHOLDER</body></html>' })
);

import { readFile } from 'fs/promises';
import mjml2html    from 'mjml';
import { MailService } from '../../../elearning-backend/src/common/mail/mail.service';

const mockMailerService = { sendMail: jest.fn().mockResolvedValue({}) };
const mockOtpService    = { createOTP: jest.fn().mockResolvedValue('123456') };

let service: MailService;

beforeEach(() => {
  service = new MailService(mockMailerService as any, mockOtpService as any);
  jest.clearAllMocks();
  (readFile as jest.Mock).mockResolvedValue(
    '<mjml><mj-body>{{ OTP }}</mj-body></mjml>'
  );
  (mjml2html as jest.Mock).mockReturnValue({ html: '<html>Mã OTP: 123456</html>' });
  mockMailerService.sendMail.mockResolvedValue({});
  mockOtpService.createOTP.mockResolvedValue('123456');
  process.env.EMAIL_USERNAME = 'noreply@elearning.com';
});

// =============================================================================
// sendMail(to, prefix)
// =============================================================================
describe('sendMail(to, prefix)', () => {

  // TC_MAIL_01
  it('[TC_MAIL_01] nên gửi email thành công khi tất cả dependencies hoạt động', async () => {
    await expect(service.sendMail('user@test.com', 'otp')).resolves.toBeUndefined();
    expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
  });

  // TC_MAIL_02
  it('[TC_MAIL_02] CheckDB: otpService.createOTP được gọi với (to, prefix)', async () => {
    await service.sendMail('a@b.com', 'reset-password:otp');
    expect(mockOtpService.createOTP).toHaveBeenCalledWith('a@b.com', 'reset-password:otp');
  });

  // TC_MAIL_03
  it('[TC_MAIL_03] Placeholder {{ OTP }} được thay thế bằng OTP thực tế', async () => {
    mockOtpService.createOTP.mockResolvedValue('654321');
    (readFile as jest.Mock).mockResolvedValue('<mjml><mj-body>Code: {{ OTP }}</mj-body></mjml>');
    (mjml2html as jest.Mock).mockImplementation((content: string) => ({
      html: content.replace('{{ OTP }}', '654321'),
    }));

    await service.sendMail('test@test.com', 'otp');
    const callArgs = (mjml2html as jest.Mock).mock.calls[0][0] as string;
    expect(callArgs).toContain('654321');
    expect(callArgs).not.toContain('{{ OTP }}');
  });

  // TC_MAIL_04
  it('[TC_MAIL_04] CheckDB: mailService.sendMail được gọi với đúng to và subject', async () => {
    await service.sendMail('target@mail.com', 'otp');
    expect(mockMailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to:      'target@mail.com',
        subject: 'Mã OTP của bạn',
      })
    );
  });

  // TC_MAIL_05
  it('[TC_MAIL_05] from address dùng EMAIL_USERNAME từ env', async () => {
    process.env.EMAIL_USERNAME = 'noreply@elearning.com';
    await service.sendMail('u@u.com', 'otp');
    expect(mockMailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('noreply@elearning.com'),
      })
    );
  });

  // TC_MAIL_06
  it('[TC_MAIL_06] nên ném lỗi khi file template MJML không đọc được', async () => {
    (readFile as jest.Mock).mockRejectedValue(new Error('ENOENT: no such file or directory'));
    await expect(service.sendMail('x@x.com', 'otp')).rejects.toThrow('ENOENT');
  });

  // TC_MAIL_07
  it('[TC_MAIL_07] nên ném lỗi khi MailerService.sendMail thất bại (SMTP error)', async () => {
    mockMailerService.sendMail.mockRejectedValue(new Error('SMTP connection failed'));
    await expect(service.sendMail('x@x.com', 'otp')).rejects.toThrow('SMTP connection failed');
  });

  // TC_MAIL_08
  it('[TC_MAIL_08] HTML được tạo ra từ MJML conversion', async () => {
    const generatedHtml = '<html><body>Final HTML</body></html>';
    (mjml2html as jest.Mock).mockReturnValue({ html: generatedHtml });

    await service.sendMail('u@u.com', 'otp');
    expect(mockMailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ html: generatedHtml })
    );
  });
});
