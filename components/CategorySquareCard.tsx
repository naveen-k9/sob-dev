import React, { memo, useMemo } from "react";
import {
  TouchableOpacity,
  ImageBackground,
  Text,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Category } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/src/ui/layout";
import { FONT_SIZE } from "@/src/ui/typography";

interface CategorySquareCardProps {
  category: Category;
  onPress: () => void;
  /**
   * Optional explicit size for the square tile (width/height).
   * If omitted, defaults to a 2-column grid size based on window width.
   */
  size?: number;
}

function CategorySquareCard({
  category,
  onPress,
  size,
}: CategorySquareCardProps) {
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const tileSize = useMemo(() => {
    if (typeof size === "number") return size;

    // Default: 2 columns, with a single gap between columns.
    const horizontalPadding = 18 * 2; // matches `styles.mealGrid` paddingHorizontal in home screen
    const gap = 27; // space between the two tiles
    const computed = Math.floor((width - horizontalPadding - gap) / 2);
    return Math.max(132, computed); // sensible minimum for small screens
  }, [size, width]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: tileSize,
          backgroundColor: colors.surfaceSecondary,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={onPress}
      testID={`cat-rect-${category.id}`}
      // activeOpacity={0.85}
    >
      <ImageBackground
        source={{ uri: category.image }}
        style={styles.image}
        imageStyle={styles.imageRadius}
      >
        {/* Subtle dark overlay for readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.65)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.25 }}
          end={{ x: 0.5, y: 1.0 }}
        />

        <View style={styles.labelWrap}>
          <Text style={styles.name} numberOfLines={2}>
            {category.name}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default memo(CategorySquareCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.xl,

    // Shadow (iOS) + elevation (Android) like the screenshot tiles
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    aspectRatio: 126 / 108,
    justifyContent: "flex-end",
    alignItems: "stretch",
  },
  imageRadius: {
    borderRadius: RADIUS.lg,
  },
  labelWrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "flex-start",
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
