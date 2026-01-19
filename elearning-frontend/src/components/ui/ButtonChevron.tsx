import { cn } from "@/config/utils";
import { ChevronLeft } from "@/components/icons";

interface ButtonChevronProps {
  isRightButton?: boolean;
  className?: string;
  onClick?: () => void;
}

const ButtonChevron = ({
  className,
  onClick,
  isRightButton,
}: ButtonChevronProps) => {
  return (
    <button
      className={cn(
        "absolute z-10 top-1/2 transform -translate-y-1/2 md:p-4 p-3 bg-white rounded-full border transition-all duration-300 opacity-0 pointer-events-none",
        isRightButton
          ? "translate-x-4 group-hover:translate-x-0 right-2"
          : "-translate-x-4 group-hover:translate-x-0 left-2",
        "group-hover:opacity-100 group-hover:pointer-events-auto",
        "hover:border-primary-600 hover:shadow-lg",
        className
      )}
      aria-label={isRightButton ? "Next slide" : "Previous slide"}
      onClick={onClick}
    >
      <ChevronLeft
        className={cn(
          "w-5 h-5 xl:w-6 xl:h-6 transition-all duration-200 group-hover:text-primary-600",
          isRightButton && "rotate-180"
        )}
      />
    </button>
  );
};

export default ButtonChevron;
