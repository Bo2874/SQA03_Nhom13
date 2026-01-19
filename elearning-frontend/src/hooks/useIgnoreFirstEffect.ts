import { useEffect, useRef } from "react";

const useIgnoreFirstEffect = (effect: () => void, deps: any[]) => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    effect();
  }, [effect]);
};

export default useIgnoreFirstEffect;
