"use client";

import { Spin } from "@/components/icons";
import { cn } from "@/config/utils";
import { ReactNode, memo } from "react";

interface LoadingProps {
  isLoading: boolean;
  children: ReactNode;
  className?: string;
}

const Loading = ({ isLoading, children, className }: LoadingProps) => {
  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div role="status" className="animate-spin">
            <Spin className={cn("animate-spin", className)} />
          </div>
        </div>
      )}
      <div className={cn(isLoading ? "opacity-20" : "")}>{children}</div>
    </div>
  );
};

export default memo(Loading);
