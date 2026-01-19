import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { Request } from "express";
import { redisClient } from "src/common/utils/redis.client";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    const token = request?.cookies?.ACCESS_TOKEN;
                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || "your secret key",
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: any) {
        try {
            const COOKIE_NAME = process.env.COOKIE_NAME || "ACCESS_TOKEN";
            const token = req.cookies?.[COOKIE_NAME];

            if (!token) {
                this.logger.warn("Token not found in cookies");
                throw new UnauthorizedException("Token not found");
            }

            const email = payload?.email;
            if (!email) {
                this.logger.warn("Invalid token payload - missing email");
                throw new UnauthorizedException("Invalid token payload");
            }

            const redisKey = `${email}:${COOKIE_NAME}:${token}`;

            const exists = await redisClient.get(redisKey);

            if (exists) {
                this.logger.warn(`Token has been revoked for user: ${email}`);
                throw new UnauthorizedException("Token has been revoked");
            }

            const user = {
                sub: payload.sub,  // Keep sub for compatibility
                id: payload.sub,
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
                status: payload.status,
                exp: payload.exp,
            };

            return user;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`JWT validation error: ${error.message}`);
            throw new UnauthorizedException("Token validation failed");
        }
    }
}
