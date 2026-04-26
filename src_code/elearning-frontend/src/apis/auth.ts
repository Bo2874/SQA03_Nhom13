import axiosRequest from "@/config/axios";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  User,
  ApiResponse,
  RequestOtpRequest,
  ResetPasswordRequest,
} from "@/@types/User.type";

// ==================== AUTHENTICATION ====================

// POST /api/v1/auth/sign-in
// Login with email and password
// Token is automatically set in httpOnly cookie by backend
export const login = async (
  data: LoginRequest
): Promise<ApiResponse<AuthResponse>> => {
  return axiosRequest.post("/auth/sign-in", data);
};

// POST /api/v1/auth/register
// Register new user (requires OTP verification first)
export const register = async (
  data: RegisterRequest
): Promise<ApiResponse<{ user: User }>> => {
  return axiosRequest.post("/auth/register", data);
};

// GET /api/v1/auth/me
// Get current user info from token (requires authentication)
// This is the MAIN way to get user data - backend validates token from cookie
export const getCurrentUserFromToken = async (): Promise<ApiResponse<User>> => {
  return axiosRequest.get("/auth/me");
};

// GET /api/v1/auth/logout
// Logout and clear httpOnly cookie
export const logout = async (): Promise<void> => {
  return axiosRequest.get("/auth/logout");
};

// ==================== OTP & PASSWORD RESET ====================

// POST /api/v1/auth/request-otp
// Request OTP for registration or password reset
// Query param: ?prefix=otp (for registration) or ?prefix=reset-password:otp (for reset)
export const requestOtp = async (
  email: string,
  prefix: "otp" | "reset-password:otp" = "otp"
): Promise<ApiResponse<null>> => {
  return axiosRequest.post(
    `/auth/request-otp?prefix=${prefix}`,
    { email }
  );
};

// PUT /api/v1/auth/reset-password
// Reset password with OTP verification
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ApiResponse<User>> => {
  return axiosRequest.put("/auth/reset-password", data);
};

// ==================== HELPERS (DEPRECATED - Use Zustand store instead) ====================

/**
 * DEPRECATED: These localStorage helpers are kept for backward compatibility
 * New code should use:
 * 1. getCurrentUserFromToken() to fetch from backend
 * 2. useAppStore() to manage user state
 */

// Get current user from localStorage (DEPRECATED)
export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Save user to localStorage (DEPRECATED)
export const saveCurrentUser = (user: Partial<User>): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
    console.error("Error saving current user:", error);
  }
};

// Clear user from localStorage (DEPRECATED)
export const clearCurrentUser = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Error clearing current user:", error);
  }
};

// ==================== EXPORTS ====================

const authAPI = {
  // Main auth operations
  login,
  register,
  logout,
  getCurrentUserFromToken,

  // OTP & password reset
  requestOtp,
  resetPassword,

  // Deprecated localStorage helpers (use Zustand store instead)
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
};

export default authAPI;
