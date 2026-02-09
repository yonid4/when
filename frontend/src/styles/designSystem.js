// Design System for When Application
// Centralized color palette, spacing, and design tokens

export const colors = {
  // Primary colors
  primary: "#6B7C98",
  primaryLight: "#8B9BB2",
  primaryDark: "#546175",
  primaryHover: "#5E6E88",
  primarySoft: "#E8EBF0",

  // Secondary colors
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Accent colors
  accent: "#F59E0B",
  accentLight: "#FCD34D",
  accentDark: "#D97706",

  // Status colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Neutral colors
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Background colors
  bgPrimary: "#FFFFFF",
  bgSecondary: "#F9FAFB",
  bgTertiary: "#F3F4F6",
  bgPage: "#F8FAFC",

  // Surface colors (refined)
  surface: "#FFFFFF",
  surfaceHover: "#F8FAFC",

  // Text colors (refined)
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textInverse: "#FFFFFF",
  textHeading: "#1E293B",
  textBody: "#475569",
  textMuted: "#64748B",
  textFaint: "#94A3B8",

  // Border colors (refined)
  borderLight: "#E5E7EB",
  borderMedium: "#D1D5DB",
  borderDark: "#9CA3AF",
  borderSubtle: "#E2E8F0",
  borderHover: "#CBD5E1"
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px"
};

export const borderRadius = {
  none: "0",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  full: "9999px"
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  none: "none",
  // New refined shadows
  card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
  cardHover: "0 4px 12px rgba(0,0,0,0.08)",
  sidebar: "1px 0 3px rgba(0,0,0,0.05)"
};

export const typography = {
  fontFamily: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
    heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
    mono: "'Menlo', 'Monaco', 'Courier New', monospace"
  },
  fontSize: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
    "6xl": "64px"
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  }
};

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};

export const transitions = {
  fast: "150ms ease-in-out",
  base: "200ms ease-in-out",
  slow: "300ms ease-in-out",
  slower: "500ms ease-in-out"
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070
};

// Animation presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  }
};

// Common gradient combinations
export const gradients = {
  primary: colors.primary,
  secondary: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryLight} 100%)`,
  accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
  sunset: "linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #EC4899 100%)",
  ocean: "#6B7C98",
  forest: "linear-gradient(135deg, #10B981 0%, #059669 100%)"
};

// Component-specific design tokens
export const components = {
  card: {
    borderRadius: "12px",
    padding: "16px",
    paddingLg: "20px"
  },
  button: {
    borderRadius: "8px"
  },
  badge: {
    borderRadius: "6px"
  },
  sidebar: {
    width: "320px"
  }
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  breakpoints,
  transitions,
  zIndex,
  animations,
  gradients,
  components
};

