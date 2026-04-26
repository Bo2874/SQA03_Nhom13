import { RefObject, useEffect } from "react";

/**
 * Hook to handle click outside of the provided refs
 */
const useClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: () => void
): void => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, handler]);
};

export default useClickOutside;
