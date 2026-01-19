"use client";

import { ReactNode, useRef, useState, useMemo, forwardRef } from "react";
import { cn } from "@/config/utils";

interface Item {
  key: string;
  label?: string;
  children?: ReactNode;
  disabled?: boolean;
}

interface ITabsProps {
  className?: string;
  tabItems: Item[];
  onChange?: (key: BaseValueType) => void;
  activeKey?: BaseValueType;
  defaultActiveKey?: BaseValueType;
}

const Tabs = forwardRef<HTMLDivElement, ITabsProps>(
  ({ className, tabItems, onChange, activeKey, defaultActiveKey }, ref) => {
    const [currentKeySelected, setCurrentKeySelected] = useState<BaseValueType>(
      defaultActiveKey ?? tabItems[0]?.key
    );
    const mainValue = activeKey ?? currentKeySelected;
    const currentTab = useMemo(() => {
      return tabItems.find((tab) => tab.key === mainValue);
    }, [mainValue, tabItems]);
    const tabContainerRef = useRef<HTMLDivElement>(null);

    const handleChange = (key: BaseValueType) => {
      const selectedTab = tabItems.find((tab) => tab.key === key);
      if (selectedTab?.disabled) return;

      if (!activeKey) setCurrentKeySelected(key);
      onChange?.(key);
    };

    const handleKeyDown = (event: React.KeyboardEvent, key: BaseValueType) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleChange(key);
      }
    };

    return (
      <div ref={ref} className={cn("w-fit", className)}>
        <div
          ref={tabContainerRef}
          className="w-full flex bg-gray-100 rounded-sm overflow-x-auto scrollbarStyle"
          role="tablist"
          aria-label="Tab navigation"
        >
          {tabItems.map((tab, index) => (
            <button
              key={tab.key}
              data-key={tab.key}
              onClick={() => handleChange(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, tab.key)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={mainValue === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              tabIndex={mainValue === tab.key ? 0 : -1}
              className={cn(
                "flex-1 p-3 text-center transition-colors border-b-2 whitespace-nowrap",
                mainValue === tab.key
                  ? "border-primary text-primary font-semibold bg-white"
                  : "border-transparent text-gray-600 hover:text-primary hover:bg-gray-50",
                tab.disabled &&
                  "opacity-50 cursor-not-allowed hover:text-gray-600 hover:bg-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="p-4 bg-white border border-gray-200 rounded-b-sm"
          role="tabpanel"
          id={`tabpanel-${mainValue}`}
          aria-labelledby={`tab-${mainValue}`}
        >
          {currentTab?.children}
        </div>
      </div>
    );
  }
);

Tabs.displayName = "Tabs";

export default Tabs;
