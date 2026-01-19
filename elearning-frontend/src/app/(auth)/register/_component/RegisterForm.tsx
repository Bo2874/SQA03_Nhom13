"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as yup from "yup";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import Input from "@/components/ui/Input";
import { Eye, EyeInvisible } from "@/components/icons";
import Button from "@/components/ui/Button";
import { PATH } from "@/constants/paths";
import { register, requestOtp } from "@/apis/auth";
import { EMAIL_REGEX } from "@/constants";
import { successToast, errorToast } from "@/utils/toast";
import { UserRole } from "@/@types/User.type";

import {
  EMAIL_REQUIRED_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_MIN_LENGTH_MESSAGE,
  CONFIRM_PASSWORD_REQUIRED_MESSAGE,
  MIN_PASSWORD_LENGTH,
} from "@/constants/validate";

const schema = yup
  .object({
    email: yup
      .string()
      .required(EMAIL_REQUIRED_MESSAGE)
      .matches(EMAIL_REGEX, EMAIL_INVALID_MESSAGE),
    fullName: yup
      .string()
      .required("Họ và tên là bắt buộc")
      .min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    phone: yup
      .string()
      .matches(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ")
      .optional(),
    role: yup
      .string()
      .required("Vui lòng chọn vai trò")
      .oneOf(["STUDENT", "TEACHER"], "Vai trò không hợp lệ"),
    password: yup
      .string()
      .required(PASSWORD_REQUIRED_MESSAGE)
      .min(MIN_PASSWORD_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE),
    confirmPassword: yup
      .string()
      .required(CONFIRM_PASSWORD_REQUIRED_MESSAGE)
      .min(MIN_PASSWORD_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE)
      .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp"),
  })
  .required();

interface IFormInput {
  email: string;
  fullName: string;
  phone?: string;
  role: "STUDENT" | "TEACHER";
  password: string;
  confirmPassword: string;
}

const RegisterForm = () => {
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState<IFormInput | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();

  const methods = useForm<IFormInput>({
    resolver: yupResolver(schema),
    mode: "onBlur",
    defaultValues: {
      role: "STUDENT",
    },
  });

  const { handleSubmit } = methods;

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Step 1: Request OTP
  const onSubmit: SubmitHandler<IFormInput> = async (dataRegister) => {
    setIsLoading(true);
    setMessage("");

    try {
      const { email } = dataRegister;

      // Request OTP from backend
      await requestOtp(email, "otp");

      // Save form data for later use
      setFormData(dataRegister);

      // Move to OTP step
      setStep("otp");
      setResendTimer(60); // 60 seconds cooldown

      successToast("Mã OTP đã được gửi đến email của bạn!");

    } catch (error: any) {
      console.error("Request OTP error:", error);
      const errorMsg = error?.message || error || "Không thể gửi OTP. Vui lòng thử lại.";
      setMessage(errorMsg);
      errorToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Register
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setMessage("Vui lòng nhập mã OTP 6 số");
      return;
    }

    if (!formData) {
      setMessage("Dữ liệu form bị mất. Vui lòng thử lại.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const { email, fullName, phone, role, password } = formData;

      // Call register API with OTP
      await register({
        email,
        fullName,
        phone,
        role: role as UserRole,
        otp,
        password,
      });

      const roleText = role === "TEACHER" ? "giáo viên" : "học sinh";
      successToast(`Đăng ký tài khoản ${roleText} thành công! Vui lòng đăng nhập.`);

      router.push(PATH.LOGIN);

    } catch (error: any) {
      console.error("Register error:", error);
      const errorMsg = error?.message || error || "Đăng ký thất bại. Vui lòng kiểm tra OTP và thử lại.";
      setMessage(errorMsg);
      errorToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    if (!formData) return;

    setIsLoading(true);
    setMessage("");

    try {
      await requestOtp(formData.email, "otp");
      setResendTimer(60);
      successToast("Mã OTP mới đã được gửi!");
    } catch (error: any) {
      const errorMsg = error?.message || error || "Không thể gửi lại OTP.";
      errorToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Back to form
  const handleBackToForm = () => {
    setStep("form");
    setOtp("");
    setMessage("");
  };

  // Render OTP Step
  if (step === "otp") {
    return (
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Xác thực OTP</h2>
          <p className="text-sm text-gray-600 mt-2">
            Mã OTP đã được gửi đến email: <strong>{formData?.email}</strong>
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhập mã OTP (6 số)
          </label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Error Message */}
        {message && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{message}</p>
          </div>
        )}

        {/* Verify Button */}
        <Button
          type="button"
          onClick={handleVerifyOtp}
          className="w-full !bg-primary-500 hover:!bg-primary-600 !text-white mb-3"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? "Đang xác thực..." : "Xác thực và Đăng ký"}
        </Button>

        {/* Resend OTP */}
        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-600">
              Gửi lại mã sau <strong>{resendTimer}s</strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              disabled={isLoading}
            >
              Gửi lại mã OTP
            </button>
          )}
        </div>

        {/* Back to Form */}
        <button
          type="button"
          onClick={handleBackToForm}
          className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
        >
          ← Quay lại chỉnh sửa thông tin
        </button>
      </div>
    );
  }

  // Render Form Step
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
              Họ và tên
            </label>
            <Input
              name="fullName"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-gray-400 font-normal text-xs">(tùy chọn)</span>
            </label>
            <Input
              name="phone"
              placeholder="0123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <Input
              name="password"
              type={isShowPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              icon={
                <button
                  type="button"
                  onClick={() => setIsShowPassword(!isShowPassword)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isShowPassword ? <EyeInvisible /> : <Eye />}
                </button>
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <Input
              name="confirmPassword"
              type={isShowConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              icon={
                <button
                  type="button"
                  onClick={() => setIsShowConfirmPassword(!isShowConfirmPassword)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isShowConfirmPassword ? <EyeInvisible /> : <Eye />}
                </button>
              }
            />
          </div>
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
            {isLoading ? "Đang gửi OTP..." : "Tiếp tục"}
          </Button>
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-600 text-sm mt-4">
          Bạn đã có tài khoản?{" "}
          <Link href={PATH.LOGIN} className="text-orange-500 hover:text-orange-600 font-medium">
            Đăng nhập ngay
          </Link>
        </p>
      </form>
    </FormProvider>
  );
};

export default RegisterForm;
