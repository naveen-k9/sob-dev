import { scale } from "@/src/ui/responsive";

export const SPACING = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
} as const;

export const RADIUS = {
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
} as const;

export const SCREEN_PADDING = scale(16);
