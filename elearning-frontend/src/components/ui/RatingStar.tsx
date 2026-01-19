import { memo } from "react";
import { Star } from "@/components/icons";
import { cn } from "@/config/utils";

type RatingStarProps = {
  rating?: number;
  classStar?: string;
};

const RatingStar = ({ rating, classStar }: RatingStarProps) => {
  const widthPercentage = rating ? `${(rating / 5) * 100}%` : "0";

  return (
    <div className="relative w-fit group">
      <span
        className="flex gap-1 absolute flex-shrink-0 top-0 left-0 z-10 whitespace-nowrap overflow-hidden"
        style={{ width: widthPercentage }}
      >
        <StarList
          colorClass="text-yellow-900 group-hover:text-yellow-600"
          className={cn(
            classStar,
            "transition-transform duration-300 group-hover:scale-110"
          )}
        />
      </span>

      <span className="flex gap-1">
        <StarList
          colorClass="text-dark-100 group-hover:text-yellow-400"
          className={cn(
            classStar,
            "transition-transform duration-300 group-hover:scale-110"
          )}
        />
      </span>
    </div>
  );
};

export default memo(RatingStar);

type StarListProps = {
  colorClass: string;
  className?: string;
};

const StarList = ({ colorClass, className }: StarListProps) => {
  const LIST = [1, 2, 3, 4, 5];

  return (
    <>
      {LIST.map((i) => (
        <Star
          key={i}
          className={cn(
            "flex-shrink-0 cursor-default transition-all duration-300 ease-out",
            colorClass,
            className
          )}
        />
      ))}
    </>
  );
};
