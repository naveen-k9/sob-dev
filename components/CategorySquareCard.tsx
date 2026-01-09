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
      style={[styles.container, { width: tileSize, height: 108 }]}
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
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginBottom: 21,

    // Shadow (iOS) + elevation (Android) like the screenshot tiles
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "stretch",
  },
  imageRadius: {
    borderRadius: 18,
  },
  labelWrap: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "flex-start",
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
