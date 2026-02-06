import { useLayoutEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    setReducedMotion(mediaQuery.matches);

    function handleChange(event) {
      setReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

export default useReducedMotion;
