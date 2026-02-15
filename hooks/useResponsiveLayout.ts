import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

/**
 * Breakpoints (width) for responsive layout across mobile screen sizes.
 */
const WIDTH = {
  xs: 320,
  sm: 360,
  md: 400,
  lg: 480,
} as const;

/**
 * Returns responsive layout values based on current window dimensions.
 * Use in screens and components for consistent behavior across all mobile sizes.
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isSmallScreen = width < WIDTH.sm;
    const isMediumScreen = width >= WIDTH.sm && width < WIDTH.md;
    const isLargeScreen = width >= WIDTH.md;

    // Horizontal padding: scale between 16–24 based on width
    const horizontalPadding = Math.round(
      Math.min(24, Math.max(16, width * 0.045))
    );

    // Scale factor for fonts/sizes (1 at 400px width)
    const scale = Math.min(1.2, Math.max(0.85, width / 400));

    return {
      width,
      height,
      isSmallScreen,
      isMediumScreen,
      isLargeScreen,
      horizontalPadding,
      scale,
      /** Use for responsive font sizes: baseFontSize * scale */
      scaled: (n: number) => Math.round(n * scale),
    };
  }, [width, height]);
}
