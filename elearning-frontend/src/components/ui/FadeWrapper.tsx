"use client";

import { ReactNode, useEffect, useRef, useState, memo } from "react";
import { cn } from "@/config/utils";

interface FadeWrapperProps {
  isVisible: boolean;
  timeAnimation?: number;
  children: ReactNode;
  className?: string;
}

const FadeWrapper = ({
  isVisible,
  children,
  className,
  timeAnimation = 300,
}: FadeWrapperProps) => {
  return (
    <div
      className={cn(
        className,
        "grid overflow-hidden",
        isVisible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
      style={{
        transition: `all ${timeAnimation}ms ease-in-out`,
      }}
    >
      <div className="overflow-hidden flex flex-col gap-1 py-3">{children}</div>
    </div>
  );
};

export default memo(FadeWrapper);
