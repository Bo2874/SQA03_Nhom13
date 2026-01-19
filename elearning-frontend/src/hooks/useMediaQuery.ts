import { useEffect, useState } from "react";

const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
};

const useMediaQuery = (width?: number, query?: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query || `(max-width: ${width}px)`);
    const handleChange = () => setMatches(mediaQuery.matches);
    handleChange();

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query, width]);

  return matches;
};

const useIsMobile = () => {
  return useMediaQuery(BREAKPOINTS.SM);
};

const useIsTablet = () => {
  return useMediaQuery(BREAKPOINTS.LG);
};

const useIsPc = () => {
  return useMediaQuery(undefined, `(min-width: ${BREAKPOINTS.LG}px)`);
};

export { useMediaQuery, useIsMobile, useIsTablet, useIsPc };
