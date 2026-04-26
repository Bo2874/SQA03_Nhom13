"use client";

import { useState } from "react";
import { cn } from "@/config/utils";

interface SelectorItemProps {
  label: string;
  value: BaseValueInputType;
  isAvailable?: boolean | true;
}

interface SelectorProps<T extends BaseValueType> {
  options: SelectorItemProps[];
  value?: T;
  defaultValue?: T;
  onChange?: (selectedValue: T, selectedItem: SelectorItemProps) => void;
}

const Selector = <T extends BaseValueType>({
  options,
  value,
  defaultValue,
  onChange,
}: SelectorProps<T>) => {
  const [selectedValue, setSelectedValue] =
    useState<BaseValueType>(defaultValue);
  const isHaveValue = value !== undefined;
  const formatSelectedValue = isHaveValue ? value : selectedValue;

  const handleClick = (item: SelectorItemProps) => {
    onChange?.(item.value as T, item);
    setSelectedValue(item.value);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options?.map((item, index) => (
        <div
          key={index}
          className={cn(
            "cursor-pointer px-4 py-1 border rounded-sm select-none",
            item.value === formatSelectedValue
              ? "border-primary text-primary"
              : "hover:border-primary border-white-400",
            !item.isAvailable && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => handleClick(item)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default Selector;
