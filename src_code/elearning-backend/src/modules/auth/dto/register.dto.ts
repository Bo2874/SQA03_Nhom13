import {
    IsString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    MinLength,
    IsOptional,
} from "class-validator";
import { UserRole } from "../../../entities/user.entity";

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    fullName: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;

    @IsString()
    @IsNotEmpty()
    otp: string;
}
