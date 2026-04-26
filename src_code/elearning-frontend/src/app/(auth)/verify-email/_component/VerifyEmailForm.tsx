"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { verifyEmail, resendVerifyEmail } from "@/apis/auth";
import { getParams } from "@/utils/getParams";
import { successToast, errorToast } from "@/utils/toast";
import Spin from "@/components/ui/Spin";
import { useRouter } from "next/navigation";

const VerifyEmailForm = () => {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleVerify = async () => {
      const token = getParams("token");

      if (!token) {
        setMessage("Token không hợp lệ!");
        setIsLoading(false);
        return;
      }

      try {
        const res = await verifyEmail({ token });

        if (!res.data.success) {
          errorToast(res.data.message);
          setMessage(res.data.message);
          setEmail(res.data.email);
        } else {
          successToast(res.data.message);
          router.push("/login");
        }
      } catch (error: any) {
        setMessage(error || "Xác thực thất bại!");
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    handleVerify();
  }, [router]);

  const handleResendVerifyEmail = async () => {
    setIsLoading(true);

    try {
      const res = await resendVerifyEmail({ email });

      if (!res.data.success) {
        errorToast("Đã có lỗi xảy ra");
      } else {
        successToast(res.data.message);
        router.push("/login");
      }
    } catch (error: any) {
      setMessage(error || "Lỗi!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 pt-5">
      <Spin isLoading={isLoading} className="text-dark-200 fill-primary-900">
        {email && (
          <Button className="w-full" onClick={handleResendVerifyEmail}>
            Gửi lại email xác nhận
          </Button>
        )}
      </Spin>

      {message && <div className="text-sm text-red-500">{message}</div>}
    </div>
  );
};

export default VerifyEmailForm;
