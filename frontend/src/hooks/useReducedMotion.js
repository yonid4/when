import { useState, useLayoutEffect } from "react";

/**
 * Hook to detect if the user prefers reduced motion.
 * Returns true if the user has enabled reduced motion in their OS settings.
 * Uses useLayoutEffect to prevent animation flicker on initial render.
 */
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (event) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
};

export default useReducedMotion;
