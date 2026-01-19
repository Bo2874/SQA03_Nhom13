import {
    Controller,
    Post,
    Body,
    Res,
    HttpCode,
    HttpStatus,
    Req,
    Get,
    UseGuards,
    Param,
    Query,
    Put,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { ApiResponse } from "src/common/dto/api-response.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("api/v1/auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("sign-in")
    @HttpCode(HttpStatus.OK)
    async signIn(
        @Body() signInDto: SignInDto,
        @Res({ passthrough: true }) response: Response
    ) {
        const result = await this.authService.signIn(signInDto);
        const COOKIE_NAME = process.env.COOKIE_NAME;
        console.log(COOKIE_NAME);

        response.cookie(COOKIE_NAME || "ACCESS_TOKEN", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000, // 1 hour in milliseconds (3600000ms)
        });

        const { token, ...userInfo } = result;
        return ApiResponse.success(userInfo, "success");
    }

    @Post("register")
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.authService.register(registerDto);
        return ApiResponse.success({ user }, "success");
    }

    @Post("request-otp")
    @HttpCode(HttpStatus.OK)
    async requestOTP(
        @Body() email: { email: string },
        @Query("prefix") prefix: string
    ) {
        const { message } = await this.authService.requestOTP(
            email.email,
            prefix
        );
        return ApiResponse.success(null, message);
    }

    @Put("reset-password")
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        const result = await this.authService.resetPassword(resetPasswordDto);
        return ApiResponse.success(result, "success");
    }

    @Get("me")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@Req() req: Request) {
        const user = req["user"] as any;
        const userInfo = await this.authService.getUserById(user.userId);
        return ApiResponse.success(userInfo, "success");
    }

    @Get("logout")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @Res({ passthrough: true }) response: Response,
        @Req() req: Request
    ) {
        const COOKIE_NAME = process.env.COOKIE_NAME || "ACCESS_TOKEN";
        const cookie = req.cookies?.[COOKIE_NAME];
        const user = req["user"] as any;
        const logOutInfo = {
            email: user?.email,
            token: cookie,
            cookieName: COOKIE_NAME,
            exp: user?.exp,
        };

        await this.authService.logOut(logOutInfo);

        response.clearCookie(COOKIE_NAME);

        console.log("Logout success fully!");
    }
}
