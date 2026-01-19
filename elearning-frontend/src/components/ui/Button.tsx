import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/config/utils";

const buttonVariants = cva(
  "inline-flex px-2 items-center justify-center h-12 font-medium rounded-[5px] gap-2 focus:outline-none transition disabled:pointer-events-none disabled:opacity-70",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        outlined:
          "bg-white border border-solid border-primary text-primary hover:bg-primary hover:text-white",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // additional props here if needed...
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(buttonVariants({ variant, className }))}
      aria-label={props["aria-label"]}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";

export default Button;
