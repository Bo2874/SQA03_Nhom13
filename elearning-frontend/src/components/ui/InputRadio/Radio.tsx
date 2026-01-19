"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/config/utils";
import "./InputRadio.scss";

interface RadioProps<T> {
  checked?: boolean;
  onChange?: (value: T) => void;
  id?: string;
  className?: string;
  label?: string;
  value?: T;
  disabled?: boolean;
  name?: string;
}

const Radio = forwardRef(
  <T,>(
    {
      checked,
      onChange,
      id,
      className,
      label,
      value,
      disabled,
      name,
    }: RadioProps<T>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    return (
      <label
        className={cn("custom-radio", className, {
          "disabled-option": disabled,
        })}
      >
        <input
          type="radio"
          id={id}
          name={name}
          checked={checked}
          onChange={() => onChange?.(value as T)}
          value={String(value)}
          disabled={disabled}
          ref={ref}
        />
        <span className="radio-circle"></span>
        {label && <span className="radio-label">{label}</span>}
      </label>
    );
  }
);

interface Option<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

interface RadioGroupProps<T extends BaseValueInputType> {
  options: Option<T>[];
  value?: T;
  onChange?: (selectedValue: BaseValueType) => void;
  className?: string;
  defaultValue?: T;
  name?: string;
}

const RadioGroup = forwardRef(
  <T extends BaseValueInputType>(
    {
      options,
      value,
      onChange,
      className,
      defaultValue,
      name = "radio-group",
    }: RadioGroupProps<T>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [selectedValue, setSelectedValue] = useState<T | undefined>(
      defaultValue
    );
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : selectedValue;

    const handleChange = (newValue: T) => {
      if (!isControlled) {
        setSelectedValue(newValue);
      }
      onChange?.(newValue);
    };

    return (
      <div className={cn("flex flex-col space-y-2", className)} ref={ref}>
        {options.map((option) => (
          <Radio
            key={`${name}-${String(option.value)}`}
            checked={currentValue === option.value}
            onChange={() => handleChange(option.value)}
            name={name}
            {...option}
          />
        ))}
      </div>
    );
  }
);

export { Radio, RadioGroup };
