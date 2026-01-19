"use client";

import { forwardRef, ReactNode, InputHTMLAttributes, useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/config/utils";
import { useFormContext } from "react-hook-form";
import FieldController from "./FieldController";

const inputVariants = cva(
  "w-full py-3 text-dark-800 placeholder-dark-400 outline-none disabled:pointer-events-none disabled:cursor-none disabled:opacity-70 text-lg",
  {
    variants: {
      variant: {
        outlined:
          "border px-3 rounded-[10px] focus-visible:border-primary border-dark-300 focus-outline:border-primary hover:border-primary",
        standard:
          "border-b-[1px] border-b-dark-300  py-2 focus:border-b-primary hover:border-b-primary focus-outline:border-b-primary ",
        filled: "px-3 shadow-md rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "outlined",
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "required">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  name?: string;
  required?: string;
}

const InputElement = forwardRef<HTMLInputElement, InputProps>(
  ({ variant, className, icon, required, ...props }, ref) => (
    <div className="w-full relative">
      <input
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        required={!!required}
        {...props}
      />
      <div
        className={cn(
          "absolute right-3 top-[50%] translate-y-[-50%]",
          variant === "standard" && "right-0"
        )}
      >
        {icon}
      </div>
    </div>
  )
);

InputElement.displayName = "InputElement";

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, className, error, variant = "outlined", name, required, ...props },
    ref
  ) => {
    const form = useFormContext();
    const inputId = useId();

    if (form && name) {
      return (
        <FieldController
          name={name}
          required={required}
          title={label}
          {...props}
        >
          <InputElement
            variant={variant}
            className={className}
            ref={ref}
            {...props}
          />
        </FieldController>
      );
    }

    return (
      <div>
        {label && (
          <label className="block mb-1" htmlFor={inputId}>
            {label}
          </label>
        )}
        <InputElement
          id={inputId}
          variant={variant}
          className={className}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
