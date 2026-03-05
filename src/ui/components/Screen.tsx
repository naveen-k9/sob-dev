import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/colors";
import { SCREEN_PADDING } from "@/src/ui/layout";

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  edges?: Edge[];
}

export default function Screen({
  children,
  style,
  edges = ["top", "left", "right"],
}: ScreenProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.base,
        { backgroundColor: colors.background, paddingHorizontal: SCREEN_PADDING },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
