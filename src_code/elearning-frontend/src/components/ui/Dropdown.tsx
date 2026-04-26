"use client";

import { ChevronDown } from "@/components/icons";
import { cn } from "@/config/utils";
import useClickOutside from "@/hooks/useClickOutside";
import { useState, useRef, useMemo, useEffect } from "react";
import ErrorMessage from "./ErrorMessage";

interface IDropdownItem {
  label: string;
  value: BaseValueInputType;
}

interface DropdownProps<T extends BaseValueType> {
  size?: "sm" | "lg";
  placeholder?: string;
  options: IDropdownItem[];
  disabled?: boolean;
  className?: string;
  isShowSearch?: boolean;
  value?: T;
  defaultValue?: T;
  error?: string;
  noResultsText?: string;
  onChange?: (selectedValue: T, selectedItem: IDropdownItem) => void;
  onSearchChange?: (searchValue: string) => void;
}

const Dropdown = <T extends BaseValueType>({
  size = "sm",
  placeholder = "Select an option",
  options,
  value,
  defaultValue,
  className,
  error,
  disabled = false,
  isShowSearch = false,
  noResultsText = "No results found",
  onChange,
  onSearchChange,
}: DropdownProps<T>) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownTop, setIsDropdownTop] = useState(false);
  const [selectedValue, setSelectedValue] =
    useState<BaseValueType>(defaultValue);
  const [searchTerm, setSearchTerm] = useState("");

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : selectedValue;

  // Sync selected value with options when they change
  useEffect(() => {
    if (
      currentValue !== undefined &&
      !options.find((option) => option.value === currentValue)
    ) {
      if (!isControlled) {
        setSelectedValue(defaultValue);
      }
    }
  }, [options, currentValue, defaultValue, isControlled]);

  const selectedItem = useMemo(
    () => options.find((option) => option.value === currentValue),
    [options, currentValue]
  );

  const filteredOptions = useMemo(() => {
    return isShowSearch
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;
  }, [searchTerm, options, isShowSearch]);

  const toggleDropdown = (forceOpen?: boolean) => {
    if (disabled) return;

    const newIsOpen = forceOpen !== undefined ? forceOpen : !isOpen;

    if (newIsOpen && !isOpen) {
      // Calculate position for dropdown
      const dropdownEl = dropdownRef.current;
      if (dropdownEl) {
        const rect = dropdownEl.getBoundingClientRect();
        setIsDropdownTop(window.innerHeight - rect.bottom < 300);
      }
    }

    setIsOpen(newIsOpen);
  };

  const handleSelectItem = (item: IDropdownItem) => {
    if (!isControlled) {
      setSelectedValue(item.value);
    }

    // Call onChange callback
    onChange?.(item.value as T, item);

    // Clear search and close dropdown
    setSearchTerm("");
    onSearchChange?.("");
    setIsOpen(false);
  };

  const onChangeSearch = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  useClickOutside(dropdownRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  useEffect(() => {
    if (isOpen && isShowSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isShowSearch]);

  return (
    <div className={cn("relative w-fit h-fit", className)} ref={dropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between select-none border border-dark-300 transition-colors h-full",
          {
            "px-2 py-0.5 rounded": size === "sm",
            "px-3.5 py-3 rounded-xl": size === "lg",
            "cursor-pointer hover:border-primary": !disabled,
            "text-dark-400": (!currentValue && !searchTerm) || disabled,
            "opacity-75 cursor-not-allowed": disabled,
            "border-red-500": error,
          }
        )}
        onClick={() => toggleDropdown()}
      >
        <div className="flex-1 min-w-0">
          {isShowSearch && isOpen ? (
            <input
              ref={inputRef}
              placeholder={selectedItem?.label || placeholder}
              value={searchTerm}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="w-full border-none outline-none focus:ring-0 bg-transparent placeholder:text-dark-400"
              disabled={disabled}
            />
          ) : (
            <span
              className={cn(
                "block truncate text-lg",
                !currentValue ? "text-dark-400" : "text-dark"
              )}
            >
              {selectedItem?.label || placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            "ml-2 w-4 h-4 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </div>
      {error && <ErrorMessage message={error} className="mt-1" />}

      {isOpen && (
        <div
          className={cn(
            "absolute w-full py-1 z-50 rounded-md bg-white shadow-lg border border-dark-300 max-h-64 overflow-auto scrollbarStyle",
            isDropdownTop
              ? "bottom-full mb-1 animate-[fadeInUp_0.15s]"
              : "top-full mt-1 animate-[fadeInDown_0.15s]"
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-dark-400">{noResultsText}</div>
          ) : (
            filteredOptions.map((item, index) => (
              <div
                key={`dropdown-${String(item.value)}-${index}`}
                onClick={() => handleSelectItem(item)}
                className={cn(
                  "cursor-pointer transition-colors",
                  {
                    "px-3 py-1": size === "sm",
                    "px-4 py-3": size === "lg",
                  },
                  item.value === currentValue
                    ? "bg-white-200 font-medium text-primary"
                    : "text-dark hover:bg-gray-100"
                )}
              >
                {item.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = "Dropdown";

export default Dropdown;
