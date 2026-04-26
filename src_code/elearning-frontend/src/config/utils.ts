import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateLeadingZeros(str: string) {
  if (str === "0") return str;

  let startIndex = 0;

  // Remove leading '0's
  while (startIndex < str.length && str[startIndex] === "0") {
    startIndex++;
  }

  // If all characters are '0', return '0'
  if (startIndex === str.length) {
    return "0";
  }

  return str.slice(startIndex);
}
