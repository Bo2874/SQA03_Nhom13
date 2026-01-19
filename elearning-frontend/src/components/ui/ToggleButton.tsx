"use client";

import { cn } from "@/config/utils";
import { useState } from "react";

interface ToggleButtonProps {
  onChange?: (isToggle: boolean) => void;
  value?: boolean;
  defaultToggle?: boolean;
  disabled?: boolean;
  className?: string;
}

const ToggleButton = ({
  onChange,
  value,
  defaultToggle,
  disabled = false,
  className,
}: ToggleButtonProps) => {
  const [isToggle, setIsToggle] = useState(!!defaultToggle);
  const isControlled = value !== undefined;
  const currentToggle = isControlled ? value : isToggle;

  const handleToggle = () => {
    if (disabled) return;

    const newToggle = !currentToggle;
    if (!isControlled) {
      setIsToggle(newToggle);
    }
    onChange?.(newToggle);
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-6 w-11 rounded-full p-1 ring-1 ring-inset transition duration-200 ease-in-out ring-black/20",
        currentToggle ? "bg-primary-900" : "bg-white",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:opacity-80",
        className
      )}
      onClick={handleToggle}
      disabled={disabled}
      role="switch"
      aria-checked={currentToggle}
      aria-disabled={disabled}
    >
      <div
        className={cn(
          "h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-slate-700/10 transition duration-200 ease-in-out",
          currentToggle ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
};

export default ToggleButton;
