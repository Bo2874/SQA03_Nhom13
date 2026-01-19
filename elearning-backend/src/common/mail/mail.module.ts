import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { OtpService } from "../utils/otp.service";

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                service: "gmail",
                host: "smtp.gmail.com",
                secure: false,
                auth: {
                    user: "anhphuoc684@gmail.com",
                    pass: "ybep kkwk wfjw efpz",
                },
            },
        }),
    ],
    providers: [MailService, OtpService],
    exports: [MailService],
})
export class MailModule {}
