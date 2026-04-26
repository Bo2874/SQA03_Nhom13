"use client";

import { forwardRef, useEffect, useState } from "react";
import "./InputRadio.scss";
import { cn } from "@/config/utils";

interface Option<T> {
  label: string;
  value: T;
  isDisabled?: boolean;
}

interface InputRadioProps<T extends BaseValueInputType> {
  title?: string;
  options: Option<T>[];
  isVertical?: boolean;
  className?: string;
  value?: T;
  defaultValue?: T;
  onChange?: (selectedValue: T) => void;
  name?: string;
  disabled?: boolean;
}

const InputRadio = forwardRef(
  <T extends BaseValueInputType>(
    {
      title,
      options,
      isVertical = false,
      className,
      value,
      defaultValue,
      onChange,
      name = "radio-group",
      disabled = false,
    }: InputRadioProps<T>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    const [selectedValue, setSelectedValue] = useState<T | undefined>(
      defaultValue
    );
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : selectedValue;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const option = options.find(
        (opt) => String(opt.value) === event.target.value
      );
      if (!option || option.isDisabled) return;

      const newValue = option.value;

      if (!isControlled) {
        setSelectedValue(newValue);
      }
      onChange?.(newValue);
    };

    return (
      <div className={cn("relative w-fit h-fit", className)}>
        <h2 className="text-lg mb-3">{title}</h2>
        <div className={cn("flex gap-4", isVertical ? "flex-col" : "flex-row")}>
          {options.map((option) => (
            <label
              key={`${name}-${String(option.value)}`}
              className={cn("custom-radio", {
                "disabled-option": option.isDisabled,
              })}
            >
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={currentValue === option.value}
                onChange={handleChange}
                disabled={disabled || option.isDisabled}
                className="mr-2"
                ref={options[0] === option ? ref : undefined}
                aria-label={option.label}
              />
              <span className="radio-circle"></span>
              <span className="ml-2 font-light">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }
);

export default InputRadio;
