import { useColorModeValue } from "@chakra-ui/react";

export function useColorScheme() {
  // Page and container backgrounds
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const bgPage = useColorModeValue("gray.50", "gray.900");

  // Card and surface backgrounds
  const cardBg = useColorModeValue("white", "gray.800");
  const surfaceBg = useColorModeValue("white", "gray.800");
  const heroBg = useColorModeValue("white", "gray.800");

  // Borders
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const borderSubtle = useColorModeValue("gray.100", "gray.600");

  // Text colors
  const textPrimary = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.700", "gray.200");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const textSubtle = useColorModeValue("gray.500", "gray.500");

  // Interactive elements
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const activeBg = useColorModeValue("gray.100", "gray.600");
  const selectedBg = useColorModeValue("brand.50", "brand.900");

  // Status colors
  const successBg = useColorModeValue("green.50", "green.900");
  const errorBg = useColorModeValue("red.50", "red.900");
  const warningBg = useColorModeValue("yellow.50", "yellow.900");
  const infoBg = useColorModeValue("blue.50", "blue.900");

  // Input and form elements
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorder = useColorModeValue("gray.300", "gray.600");
  const inputFocusBorder = useColorModeValue("brand.500", "brand.300");

  // Shadow variants
  const shadowLight = useColorModeValue("0 1px 3px rgba(0,0,0,0.12)", "0 1px 3px rgba(0,0,0,0.3)");
  const shadowMedium = useColorModeValue("0 4px 6px rgba(0,0,0,0.1)", "0 4px 6px rgba(0,0,0,0.25)");

  return {
    bgColor,
    bgPage,
    cardBg,
    surfaceBg,
    heroBg,
    borderColor,
    borderSubtle,
    textPrimary,
    textSecondary,
    textMuted,
    textSubtle,
    hoverBg,
    activeBg,
    selectedBg,
    successBg,
    errorBg,
    warningBg,
    infoBg,
    inputBg,
    inputBorder,
    inputFocusBorder,
    shadowLight,
    shadowMedium,
  };
}

export default useColorScheme;
