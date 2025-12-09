import React from 'react';
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  size?: number;
  variant?: 'pill' | 'circle';
  style?: any;
}

export default function ThemeToggle({ size = 20, variant = 'pill', style }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'circle') {
    return (
      <TouchableOpacity
        style={[
          styles.circleButton,
          isDark ? styles.circleButtonDark : styles.circleButtonLight,
          style,
        ]}
        onPress={toggleTheme}
        testID="theme-toggle"
        activeOpacity={0.7}
      >
        {isDark ? (
          <Sun size={size} color="#FBBF24" />
        ) : (
          <Moon size={size} color="#48479B" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.pillButton,
        isDark ? styles.pillButtonDark : styles.pillButtonLight,
        style,
      ]}
      onPress={toggleTheme}
      testID="theme-toggle"
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {isDark ? (
          <Sun size={size} color="#FBBF24" />
        ) : (
          <Moon size={size} color="#48479B" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillButtonLight: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillButtonDark: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  circleButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleButtonDark: {
    backgroundColor: '#1A1A2E',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

