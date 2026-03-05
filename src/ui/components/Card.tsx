import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/colors";
import { CARD_WIDTH } from "@/src/ui/grid";
import { RADIUS, SPACING } from "@/src/ui/layout";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  fullWidth?: boolean;
}

export default function Card({ children, style, fullWidth = false }: CardProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View
      style={[
        styles.card,
        {
          width: fullWidth ? "100%" : CARD_WIDTH,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
});
