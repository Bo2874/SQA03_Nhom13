import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { readFile } from "fs/promises";
import mjml2html from "mjml";
import { join } from "path";
import { OtpService } from "../utils/otp.service";

@Injectable()
export class MailService {
    constructor(
        private readonly mailService: MailerService,
        private readonly otpService: OtpService
    ) {}

    async sendMail(to: string, prefix: string) {
        const templatePath = join(
            process.cwd(),
            "src/common/mail/templates/template.mjml"
        );

        const mjmlContent = await readFile(templatePath, "utf8");
        const otpPin = await this.otpService.createOTP(to, prefix);
        const mjmlFilled = mjmlContent.replace("{{ OTP }}", otpPin);
        const { html } = mjml2html(mjmlFilled);
        await this.mailService.sendMail({
            from: `Elearning system <${process.env.EMAIL_USERNAME}>`,
            to,
            subject: "Mã OTP của bạn",
            html,
        });
    }
}
