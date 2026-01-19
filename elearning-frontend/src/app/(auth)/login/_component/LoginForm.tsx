"use client";

import { useState } from "react";
import Link from "next/link";
import * as yup from "yup";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import Input from "@/components/ui/Input";
import { Google } from "@/components/icons";
import ToggleButton from "@/components/ui/ToggleButton";
import Button from "@/components/ui/Button";
import { PATH } from "@/constants/paths";
import { login, getCurrentUserFromToken } from "@/apis/auth";
import { EMAIL_REGEX } from "@/constants";
import {
  EMAIL_REQUIRED_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_MIN_LENGTH_MESSAGE,
  MIN_PASSWORD_LENGTH,
} from "@/constants/validate";
import { successToast, errorToast } from "@/utils/toast";
import InputPassword from "@/components/ui/InputPassword";
import { UserRole } from "@/@types/User.type";

const schema = yup
  .object({
    email: yup
      .string()
      .required(EMAIL_REQUIRED_MESSAGE)
      .matches(EMAIL_REGEX, EMAIL_INVALID_MESSAGE),
    password: yup
      .string()
      .required(PASSWORD_REQUIRED_MESSAGE)
      .min(MIN_PASSWORD_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE),
  })
  .required();

interface IFormInput {
  email: string;
  password: string;
}

const LoginForm = () => {
  const [isRememberAccount, setIsRememberAccount] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const methods = useForm<IFormInput>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });

  const { handleSubmit } = methods;

  const onSubmit: SubmitHandler<IFormInput> = async (dataLogin) => {
    setIsLoading(true);
    setMessage("");

    try {
      const { email, password } = dataLogin;

      // Step 1: Call login API - backend sets httpOnly cookie with JWT token
      const loginResponse = await login({ email, password });
      const { role } = loginResponse.result;

      // Step 2: Get FULL user info from backend using the token (cookie)
      // This ensures we have all user data (email, phone, avatar_url, etc.)
      const userResponse = await getCurrentUserFromToken();
      const userData = userResponse.result;

      // Step 3: Save to localStorage with key "user"
      // This ensures session persists on page reload
      localStorage.setItem("user", JSON.stringify(userData));

      successToast("Đăng nhập thành công!");

      // Redirect based on role
      if (role === UserRole.ADMIN) {
        // Admin should go to separate admin panel
        window.location.href = "http://localhost:5173"; // elearning-admin runs on port 5173
      } else if (role === UserRole.TEACHER) {
        router.push("/teacher/dashboard");
      } else {
        router.push(PATH.HOME);
      }

    } catch (error: any) {
      console.error("Login error:", error);
      const errorMsg = "Tài khoản hoặc mật khẩu không đúng.";
      setMessage(errorMsg);
      errorToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              name="email"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <InputPassword
              name="password"
              placeholder="Nhập mật khẩu"
            />
          </div>
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center">
            <ToggleButton
              defaultToggle={false}
              onChange={() => setIsRememberAccount(!isRememberAccount)}
            />
            <span className="text-sm ml-2 text-gray-700">Lưu đăng nhập</span>
          </div>
          <Link
            href={PATH.FORGET_PASSWORD}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Error Message */}
        {message && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{message}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <Button
            type="submit"
            className="w-full !bg-primary-500 hover:!bg-primary-600 !text-white"
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </div>

        {/* Register Link */}
        <p className="text-center text-gray-600 text-sm mt-4">
          Bạn chưa có tài khoản?{" "}
          <Link
            href={PATH.REGISTER}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </FormProvider>
  );
};

export default LoginForm;
