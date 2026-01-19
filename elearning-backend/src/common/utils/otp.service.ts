import { Injectable } from "@nestjs/common";
import { redisClient } from "./redis.client";

@Injectable()
export class OtpService {
    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async createOTP(email: string, prefix: string): Promise<string> {
        const otp = this.generateOTP();
        const key = `${prefix}:${email}`;
        const otpExp = parseInt(process.env.OTP_EXPIRATION || "300", 10);
        await redisClient.setEx(key, otpExp, otp);
        return otp;
    }

    async verifyOTP(
        email: string,
        prefix: string,
        otp: string
    ): Promise<boolean> {
        const key = `${prefix}:${email}`;
        const storedOtp = await redisClient.get(key);
        if (storedOtp === otp) {
            await redisClient.del(key);
            return true;
        }
        return false;
    }
}
