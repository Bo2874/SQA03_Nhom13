export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// Backend response wrapper (all APIs return this format)
export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string; // Backend uses camelCase
  phone?: string;
  role?: UserRole; // Default to STUDENT if not provided
  otp: string; // Required for registration
}

export interface RequestOtpRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  otpPin: string;
}

export interface LoginRequest {
  email: string; // Backend expects 'email' field
  password: string;
}

export interface AuthResponse {
  userId: number;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  // Token is set in httpOnly cookie, not returned in response
}
