"use client";

import { ReactNode, useState, memo } from "react";
import { ChevronDown } from "@/components/icons";
import { cn } from "@/config/utils";
import FadeWrapper from "./FadeWrapper";

interface AccordionProps {
  headerTitle: string;
  children: ReactNode;
  className?: string;
}

const Accordion = ({ headerTitle, children, className }: AccordionProps) => {
  const [isCollapse, setIsCollapse] = useState(true);

  return (
    <div className={cn("mb-7", className)}>
      <div
        className="flex justify-between items-center select-none"
        onClick={() => setIsCollapse(!isCollapse)}
      >
        <span className="font-medium text-xl cursor-pointer">
          {headerTitle}
        </span>
        <ChevronDown
          width="10"
          height="8"
          className={cn(
            "transform duration-100 text-primary",
            isCollapse ? "rotate-180" : "rotate-0"
          )}
        />
      </div>

      <FadeWrapper isVisible={isCollapse} className="flex flex-col">
        {children}
      </FadeWrapper>
    </div>
  );
};

export default memo(Accordion);
