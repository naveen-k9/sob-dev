// Light theme colors
export const LightColors = {
  primary: '#48479B',
  accent: '#A3D397',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',
  text: '#111827',
  textSecondary: '#374151',
  mutedText: '#6B7280',
  border: '#E5E7EB',
  tabBarBg: '#FFFFFF',
  tabBarInactive: '#9CA3AF',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  card: '#FFFFFF',
  cardBorder: 'rgba(72, 72, 144, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',
} as const;

// Dark theme colors
export const DarkColors = {
  primary: '#7B7AD4',
  accent: '#A3D397',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceSecondary: '#252540',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  mutedText: '#9CA3AF',
  border: '#374151',
  tabBarBg: '#1A1A2E',
  tabBarInactive: '#6B7280',
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#EF4444',
  card: '#1A1A2E',
  cardBorder: 'rgba(123, 122, 212, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',
} as const;

// Default export for backwards compatibility
export const Colors = LightColors;

// Helper function to get colors based on theme
export const getColors = (isDark: boolean) => isDark ? DarkColors : LightColors;

export type AppColors = typeof LightColors;
