import { moderateScale } from "@/src/ui/responsive";

export const FONT_SIZE = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(18),
  xxl: moderateScale(22),
  display: moderateScale(28),
} as const;
