import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { OtpService } from "../../common/utils/otp.service";
import { MailService } from "../../common/mail/mail.service";
import { redisClient } from "../../common/utils/redis.client";
import { ResetPasswordDto } from "./dto/reset-password.dto";

export interface AuthenticatedUser {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    avatarUrl: string;
    role: UserRole;
    status: UserStatus;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private otpService: OtpService,
        private mailService: MailService
    ) {}

    async validateUser(
        username: string,
        password: string
    ): Promise<AuthenticatedUser | null> {
        const user = await this.userRepository.findOne({
            where: { email: username },
        });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const {
                passwordHash,
                createdAt,
                updatedAt,
                quizAttempts,
                enrollments,
                exams,
                examAttempts,
                courses,
                ...result
            } = user;
            return result;
        }
        return null;
    }

    async signIn(signInDto: SignInDto) {
        const user = await this.validateUser(
            signInDto.email,
            signInDto.password
        );
        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        };

        return {
            userId: user.id,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
            token: this.jwtService.sign(payload),
        };
    }

    async register(registerDto: RegisterDto) {
        const prefixOtp = process.env.PREFIX_OTP || "otp";

        const otpValid = await this.otpService.verifyOTP(
            registerDto.email,
            prefixOtp,
            registerDto.otp
        );
        if (!otpValid) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        const existingUser = await this.userRepository.findOne({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new ConflictException("Email already exists");
        }

        if (registerDto.role === UserRole.ADMIN) {
            throw new BadRequestException("Cannot register as admin");
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const user = this.userRepository.create({
            email: registerDto.email,
            passwordHash: hashedPassword,
            fullName: registerDto.fullName,
            phone: registerDto.phone,
            role: registerDto.role,
            status: UserStatus.ACTIVE,
        });

        await this.userRepository.save(user);

        const {
            passwordHash,
            createdAt,
            updatedAt,
            quizAttempts,
            enrollments,
            exams,
            examAttempts,
            courses,
            ...result
        } = user;
        return result;
    }

    async requestOTP(email: string, prefix: string) {
        await this.mailService.sendMail(email, prefix);
        return { message: `OTP sent to ${email} with prefix: ${prefix}.` };
    }

    async getUserById(userId: number): Promise<AuthenticatedUser> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const {
            passwordHash,
            createdAt,
            updatedAt,
            quizAttempts,
            enrollments,
            exams,
            examAttempts,
            courses,
            ...result
        } = user;

        return result;
    }

    async logOut(user: {
        email: string | any;
        token: string | any;
        cookieName: string | any;
        exp?: number | any;
    }) {
        const { email, cookieName, token, exp } = user;
        const ttl = exp - Math.floor(Date.now() / 1000);
        if (ttl <= 0) return;

        const redisKey = `${email}:${cookieName}:${token}`;

        await redisClient.set(redisKey, ttl, token);
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const user = await this.userRepository.findOne({
            where: {
                email: resetPasswordDto.email,
            },
        });
        if (!user) {
            throw new NotFoundException("User doesn't exist!");
        }

        const prefixReset =
            process.env.PREFIX_RESET_PASSWORD_OTP || "reset-password:otp";
        const otpValid = await this.otpService.verifyOTP(
            resetPasswordDto.email,
            prefixReset,
            resetPasswordDto.otpPin
        );
        if (!otpValid) {
            throw new UnauthorizedException("Invalid otp pin or expired.");
        }
        const hashedPassword = await bcrypt.hash(
            resetPasswordDto.newPassword,
            10
        );
        const neededInfo = {
            email: resetPasswordDto.email,
            passwordHash: hashedPassword,
        };

        Object.assign(user, neededInfo);

        return await this.userRepository.save(user);
    }
}
