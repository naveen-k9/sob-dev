import { StyleSheet } from 'react-native';

/**
 * Common layout styles for consistent safe area and spacing
 * across all screens in the app
 */
export const LayoutStyles = StyleSheet.create({
  // Main container with white background and safe area
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Container for screens that need primary color background
  safeContainerPrimary: {
    flex: 1,
    backgroundColor: '#48489B', // Colors.primary
  },
  
  // Full screen container without safe area (for screens with custom header handling)
  fullContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Content wrapper with horizontal padding
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Content wrapper with all-around padding
  contentWrapperPadded: {
    flex: 1,
    padding: 20,
  },
  
  // Header styles for consistent spacing
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  
  screenHeaderPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#48489B',
  },
});

/**
 * Constants for consistent spacing and dimensions
 */
export const LayoutConstants = {
  // Standard spacing values
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  
  // Standard border radius values
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  // Standard elevation/shadow values for cards
  elevation: {
    low: 2,
    medium: 4,
    high: 8,
  },
} as const;