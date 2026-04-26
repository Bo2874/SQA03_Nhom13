"use client";

import {
  ChangeEvent,
  forwardRef,
  InputHTMLAttributes,
  KeyboardEvent,
  useEffect,
  useState,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, truncateLeadingZeros } from "@/config/utils";
import { NUMBER_REGEX } from "@/constants";

const inputVariants = cva(
  "w-full py-3 text-dark-800 placeholder-dark-400 outline-none disabled:pointer-events-none disabled:cursor-none disabled:opacity-70",
  {
    variants: {
      variant: {
        outlined:
          "border px-3 focus-visible:border-primary border-dark-300 focus-outline:border-primary hover:border-primary",
        standard:
          "border-b-[1px] border-b-dark-300 py-2 focus:border-b-primary hover:border-b-primary focus-outline:border-b-primary",
      },
    },
    defaultVariants: {
      variant: "outlined",
    },
  }
);

interface InputNumberProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  value?: number;
  defaultValue?: number;
  isSpinButton?: boolean;
  onChange?: (value: number) => void;
}

const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      className,
      error,
      variant = "outlined",
      value,
      defaultValue,
      isSpinButton = true,
      onChange,
      ...props
    },
    ref
  ) => {
    const [valueInput, setValueInput] = useState<string | number>(
      defaultValue ?? ""
    );

    useEffect(() => {
      if ((value === 0 && valueInput === "") || value === undefined) return;
      setValueInput(value);
    }, [value, valueInput]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    const formatMessage = () => {
      if (props.min !== undefined && props.max !== undefined)
        return `Giá trị phải nhỏ hơn ${props.max} và lớn hơn ${props.min}`;
      if (props.min !== undefined) return `Giá trị phải lớn hơn ${props.min}`;
      if (props.max !== undefined) return `Giá trị phải nhỏ hơn ${props.max}`;
      return "";
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      e.target.setCustomValidity("");
      let inputValue = e.target.value;

      if (!NUMBER_REGEX.test(inputValue)) return;

      const valid = e.target.reportValidity();
      if (!valid) e.target.setCustomValidity(formatMessage());

      if (inputValue !== "") {
        onChange?.(Number(inputValue));
        inputValue = truncateLeadingZeros(inputValue);
      } else {
        onChange?.(0);
      }

      setValueInput(inputValue);
    };

    return (
      <div>
        <div className="w-full">
          <input
            type="number"
            className={cn(inputVariants({ variant, className }), {
              "input-number": !isSpinButton,
            })}
            ref={ref}
            value={valueInput}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            {...props}
          />
        </div>
      </div>
    );
  }
);

export default InputNumber;
