import {
  formatPrice,
  calculateCurrentPrice,
  calculateDiscountPrice,
} from "@/utils/formatPrice";
import { cn } from "@/config/utils";
import { memo } from "react";

type ItemPriceProps = {
  price: number;
  discount?: number;
  isShowDiscountPrice?: boolean;
  isVertical?: boolean;
  currentPriceClass?: string;
  priceClass?: string;
};

const ItemPrice = ({
  price,
  discount = 0,
  isShowDiscountPrice = false,
  isVertical = false,
  currentPriceClass,
  priceClass,
}: ItemPriceProps) => {
  const currentPrice = calculateCurrentPrice(price, discount);
  const discountAmount = calculateDiscountPrice(price, currentPrice);

  return (
    <div
      className={cn(
        "flex",
        isVertical ? "flex-col justify-between" : "justify-start"
      )}
    >
      <span
        className={cn(
          "text-primary-700 text-base mr-2 font-semibold",
          currentPriceClass
        )}
      >
        {formatPrice(currentPrice)}
      </span>
      {discount > 0 && (
        <span
          className={cn(
            "h-5 text-dark-300 text-sm w-20 mr-3 line-through",
            priceClass
          )}
        >
          {formatPrice(price)}
        </span>
      )}

      {isShowDiscountPrice && discount > 0 && (
        <p className={cn("text-red text-sm italic", priceClass)}>
          (Tiết kiệm {formatPrice(discountAmount)})
        </p>
      )}
    </div>
  );
};

export default memo(ItemPrice);
