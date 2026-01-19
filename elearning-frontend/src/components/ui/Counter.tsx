"use client";

import { useState } from "react";
import { cn } from "@/config/utils";
import InputNumber from "@/components/ui/InputNumber";
import { Plus, Minus } from "@/components/icons";

interface CounterProps {
  defaultValue?: number;
  min?: number;
  max?: number;
  onChangeCount?: (count: number) => void;
  disabled?: boolean;
  className?: string;
}

const Counter = ({
  defaultValue = 0,
  onChangeCount,
  min = -Infinity,
  max = Infinity,
  disabled = false,
  className,
}: CounterProps) => {
  const [count, setCount] = useState<number>(defaultValue);

  const handleIncrement = () => {
    if (disabled || count >= max) return;
    const newCount = count + 1;
    handleChange(newCount);
  };

  const handleDecrement = () => {
    if (disabled || count <= min) return;
    const newCount = count - 1;
    handleChange(newCount);
  };

  const handleChange = (value: number) => {
    if (disabled || value < min || value > max) return;
    setCount(value);
    onChangeCount?.(value);
  };

  return (
    <div className={cn("flex items-center", className)}>
      <ButtonCounter
        onClick={handleDecrement}
        isDisabled={disabled || count <= min}
      />
      <InputNumber
        className="border border-gray-300 border-r-0 border-l-0 text-center h-10 w-12 outline-none focus:ring-0"
        value={count}
        onChange={handleChange}
        isSpinButton={false}
        min={min}
        max={max}
        disabled={disabled}
      />
      <ButtonCounter
        isIncreaseButton
        onClick={handleIncrement}
        isDisabled={disabled || count >= max}
      />
    </div>
  );
};

export default Counter;

interface ButtonCounterProps {
  onClick: () => void;
  isDisabled?: boolean;
  isIncreaseButton?: boolean;
}

const ButtonCounter = ({
  onClick,
  isIncreaseButton,
  isDisabled,
}: ButtonCounterProps) => {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center h-10 w-10 text-center border bg-white border-gray-300 transition-colors",
        isIncreaseButton ? "rounded-r-md" : "rounded-l-md",
        isDisabled
          ? "cursor-not-allowed text-gray-400 opacity-50"
          : "cursor-pointer hover:bg-gray-50 hover:border-primary"
      )}
      onClick={onClick}
      disabled={isDisabled}
    >
      {isIncreaseButton ? <Plus /> : <Minus />}
    </button>
  );
};
