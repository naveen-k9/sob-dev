export const Colors = {
  primary: '#48479B',
  accent: '#A3D397',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111827',
  mutedText: '#6B7280',
  border: '#E5E7EB',
  tabBarBg: '#FFFFFF',
  tabBarInactive: '#9CA3AF',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
} as const;

export type AppColors = typeof Colors;
