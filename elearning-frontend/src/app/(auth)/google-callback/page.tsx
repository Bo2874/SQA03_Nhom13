"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getParams } from "@/utils/getParams";
import { googleCallback, setTokenServer } from "@/apis/auth";
import { successToast, errorToast } from "@/utils/toast";
import { PATH } from "@/constants/paths";

const GoogleCallback = () => {
  const router = useRouter();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = getParams("code");
    if (!code) return;

    const handleGoogleCallback = async () => {
      try {
        const data = await googleCallback(code);
        successToast("Đăng nhập Google thành công");
        await setTokenServer(data.data);

        router.push(PATH.HOME);
      } catch {
        errorToast("Đăng nhập Google thất bại");
        router.push(PATH.LOGIN);
      }
    };

    handleGoogleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export default GoogleCallback;
