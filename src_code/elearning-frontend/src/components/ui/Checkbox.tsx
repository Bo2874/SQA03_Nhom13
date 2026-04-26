"use client";

import { cn } from "@/config/utils";
import {
  useState,
  forwardRef,
  InputHTMLAttributes,
  useId,
  ChangeEvent,
} from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  label?: string;
  className?: string;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      onChange,
      className,
      disabled = false,
      checked,
      defaultChecked,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = useState(!!defaultChecked);
    const isControlled = checked !== undefined;
    const formatChecked = isControlled ? checked : internalChecked;
    const checkboxId = useId();
    const finalId = providedId || checkboxId;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const newChecked = event.target.checked;

      if (!isControlled) {
        setInternalChecked(newChecked);
      }

      onChange?.(newChecked);
    };

    return (
      <label
        className={cn(
          "flex items-center w-fit select-none",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:cursor-pointer",
          className
        )}
        htmlFor={finalId}
      >
        <input
          {...props}
          ref={ref}
          id={finalId}
          type="checkbox"
          checked={formatChecked}
          onChange={handleChange}
          className={cn(
            "custom-checkbox",
            !disabled && !formatChecked && "hover:opacity-60"
          )}
          disabled={disabled}
          aria-checked={formatChecked}
          aria-disabled={disabled}
        />
        {label && (
          <span
            className={cn(
              "ml-2",
              disabled ? "text-gray-400" : "text-gray-700 text-lg font-medium"
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
