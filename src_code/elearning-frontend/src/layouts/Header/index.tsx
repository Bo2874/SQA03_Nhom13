"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import {
  Envelope,
  Search,
  Favorite,
  CartShopping,
  DownAngle,
  LogoFurniture,
} from "@/components/icons";
import HeaderNav from "./HeaderNav";
import UserHeader from "./UserHeader";
import UserAction from "./UserAction";
import { PATH } from "@/constants/paths";
import { cn } from "@/config/utils";

const menus = [
  { name: "Trang chủ", link: "/" },
  { name: "Sản phẩm", link: "/collection", icon: <DownAngle /> },
  { name: "Tin tức", link: "#" },
  { name: "Liên hệ", link: "#" },
];

const SHOW_DELTA = -6;
const HIDE_DELTA = 6;
const PIN_AT_TOP = 64;

export default function Header() {
  const lastY = useRef(0);
  const ticking = useRef(false);

  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      setScrolled(y > 8);

      if (y <= PIN_AT_TOP) {
        setVisible(true);
        lastY.current = y;
        return;
      }

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          if (delta > HIDE_DELTA) setVisible(false);
          if (delta < SHOW_DELTA) setVisible(true);

          lastY.current = y;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 will-change-transform shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
          visible ? "translate-y-0" : "-translate-y-full",
          scrolled ? "bg-white/80" : "bg-white"
        )}
      >
        <div className="hidden py-4 xl:block">
          <div className="container-base flex justify-between items-center">
            <div className="hidden gap-5 xl:flex">
              {menus.map((item, index) => (
                <Link
                  key={index}
                  href={item.link}
                  className="flex gap-1 items-center hover:text-primary-600 transition-colors"
                >
                  {item.name}
                  {item.icon}
                </Link>
              ))}
            </div>

            <Link href={PATH.HOME} aria-label="Logo">
              <LogoFurniture />
            </Link>

            <div className="flex gap-5 items-center">
              <Input
                variant="standard"
                placeholder="Tìm kiếm sản phẩm"
                error=""
                icon={<Search className="text-primary-900" />}
                className="xl:w-[230px] xxl:w-[320px] bg-white/0"
              />
              {/* <Link className="flex flex-col items-center" href="#">
                <Favorite fill="none" className="text-white w-9 h-9" />
              </Link> */}
              <UserAction />
            </div>
          </div>
        </div>

        <div className="flex py-5 px-4 justify-between items-center xl:hidden">
          <HeaderNav menus={menus} />
          <Link href={PATH.HOME} aria-label="Logo">
            <LogoFurniture className="text-primary-600 ml-8" />
          </Link>
          <UserAction />
        </div>
      </header>
    </>
  );
}
