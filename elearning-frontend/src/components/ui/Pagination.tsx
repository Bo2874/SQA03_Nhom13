"use client";

import { memo, Fragment, useMemo } from "react";
import { cn } from "@/config/utils";
import { ChevronDown } from "@/components/icons";
import { useIsTablet } from "@/hooks/useMediaQuery";

export interface PaginationProps {
  total: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
  numberPage?: number;
}

const PAGINATION_SIZE = 5;

const classArrow =
  "w-[36px] h-[36px] flex justify-center items-center rounded-md border border-gray-300 text-gray-500 shadow-sm transition duration-200 hover:bg-primary-100 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed";

const Pagination = ({
  total,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  className,
  numberPage,
}: PaginationProps) => {
  const isTablet = useIsTablet();

  const { totalPages, pages } = useMemo(
    () =>
      getPageInfo(
        total,
        currentPage,
        pageSize,
        numberPage || isTablet ? 3 : PAGINATION_SIZE
      ),
    [total, currentPage, pageSize, numberPage, isTablet]
  );

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center mt-6", className)}>
      <div className="flex items-center gap-2 select-none">
        <ButtonArrow
          isLeftButton
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {pages.map((number, index) => (
          <Fragment key={index}>
            {number === -1 ? (
              <span className="mx-2 text-base text-gray-400">…</span>
            ) : (
              <button
                onClick={() => onPageChange(number)}
                className={cn(
                  "w-[36px] h-[36px] rounded-md flex items-center justify-center text-sm font-medium transition duration-200",
                  number === currentPage
                    ? "bg-primary-600 text-white shadow-md scale-105"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:scale-105"
                )}
              >
                {number}
              </button>
            )}
          </Fragment>
        ))}

        <ButtonArrow
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </div>
    </div>
  );
};

type ButtonArrowProps = {
  isLeftButton?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

const ButtonArrow = ({ isLeftButton, disabled, onClick }: ButtonArrowProps) => {
  return (
    <button className={classArrow} disabled={disabled} onClick={onClick}>
      <ChevronDown
        width="12"
        height="12"
        className={cn(
          "transform transition-transform duration-200",
          isLeftButton ? "rotate-90" : "rotate-[270deg]"
        )}
      />
    </button>
  );
};

const getPageInfo = (
  total: number,
  currentPage: number,
  pageSize: number,
  paginationSize: number = PAGINATION_SIZE
) => {
  const distance = Math.floor(paginationSize / 2);
  const totalPages = Math.ceil(total / pageSize);
  let startPage, endPage;

  if (totalPages <= paginationSize) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= Math.ceil(paginationSize / 2)) {
      startPage = 1;
      endPage = paginationSize;
    } else if (currentPage + distance >= totalPages) {
      startPage = totalPages - (paginationSize - 1);
      endPage = totalPages;
    } else {
      startPage = currentPage - distance;
      endPage = currentPage + distance;
    }
  }

  let pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  if (startPage > 1) {
    pages.unshift(1);
    if (startPage > 2) pages.splice(1, 0, -1);
  }
  if (endPage < totalPages - 1) pages.push(-1);
  if (endPage < totalPages) pages.push(totalPages);

  return { totalPages, pages };
};

export default memo(Pagination);
