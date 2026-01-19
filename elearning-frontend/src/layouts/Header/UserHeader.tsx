"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { getCookie } from "@/utils/cookies";
import { ACCESS_TOKEN } from "@/constants";
import { PATH } from "@/constants/paths";
import { User } from "@/components/icons";

const UserHeader = () => {
  const { profile } = useAppStore();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getCookie(ACCESS_TOKEN) ?? null);
  }, []);

  return (
    <div className="flex text-sm">
      {token ? (
        <Link
          href={PATH.MY_ACCOUNT}
          className="flex cursor-pointer gap-2 rounded-md p-2 hover:text-primary-350 transition-colors duration-300"
        >
          <User className="w-5 h-5" />
          <span className="text-sm">
            {profile.firstName} {profile.lastName}
          </span>
        </Link>
      ) : (
        <div className="flex gap-1 p-2">
          <Link href={PATH.LOGIN} className="hover:underline">
            Đăng nhập
          </Link>
          <div>/</div>
          <Link href={PATH.REGISTER} className="hover:underline">
            Đăng ký
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserHeader;
