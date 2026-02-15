import React, { useCallback, useMemo } from "react";
import {
  View,
  Pressable,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import { router } from "expo-router";

import { Meal } from "@/types";
import { Colors, getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { setMealOpenInTrialMode } from "@/lib/mealNavigationIntent";
import { LinearGradient } from "expo-linear-gradient";

export type MealCardVariant = "carousel" | "grid" | "list";

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
  onTryNow?: (meal: Meal) => void;
  onSubscribe?: (meal: Meal) => void;

  /**
   * - carousel: big hero card for horizontal carousels
   * - grid: 2-column menu/grid layout (default)
   * - list: 1-column menu/list layout
   */
  variant?: MealCardVariant;
  /** Used to compute sane widths for grid/list. */
  columns?: 1 | 2;
  /** Optional override for outer container (width, margins, etc). */
  containerStyle?: StyleProp<ViewStyle>;
}

const { width: screenWidth } = Dimensions.get("window");
const DEFAULT_GRID_CARD_WIDTH = (screenWidth - 48) / 2; // legacy layout fallback

export default function MealCard({
  meal,
  onPress,
  onTryNow,
  onSubscribe,
  variant = "grid",
  columns = 2,
  containerStyle,
}: MealCardProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const sizing = useMemo(() => {
    if (variant === "carousel") {
      return {
        imageHeight: 144,
        cardPadding: 0,
        imageRadius: 12,
        contentPadTop: 9,
        contentPadBottom: 9,
        titleSize: 14,
        titleLines: 2,
        ctaHeight: 36,
        ctaMarginTop: 9,
        cardWidth: 171,
        cardMarginBottom: 0,
      };
    }

    if (variant === "list" || columns === 1) {
      return {
        imageHeight: 140,
        cardPadding: 14,
        imageRadius: 12,
        contentPadTop: 14,
        contentPadBottom: 14,
        titleSize: 22,
        titleLines: 2,
        ctaHeight: 46,
        ctaMarginTop: 14,
        cardWidth: screenWidth - 32,
        cardMarginBottom: 14,
      };
    }

    return {
      imageHeight: 144,
        cardPadding: 0,
        imageRadius: 12,
        contentPadTop: 9,
        contentPadBottom: 9,
        titleSize: 14,
        titleLines: 2,
        ctaHeight: 36,
        ctaMarginTop: 9,
        cardWidth: 171,
        cardMarginBottom: 0,
    };
  }, [columns, variant]);

  const mealImage = meal?.images?.[0];

  const handleTryNow = useCallback(() => {
    try {
      setMealOpenInTrialMode(true);
      const mealId = typeof meal.id === "string" ? meal.id : String(meal.id);
      router.push(`/meal/${mealId}`);
    } catch (e) {
      console.error("[MealCard] Navigation error (Try Now):", e);
    }
  }, [meal]);

  const handleSubscribe = useCallback(() => {
    if (onSubscribe) {
      onSubscribe(meal);
      return;
    }
    try {
      router.push({
        pathname: "/meal/[id]",
        params: { mode: "subscribe", id: meal.id },
      });
    } catch (e) {
      console.error("[MealCard] Navigation error (Subscribe):", e);
    }
  }, [meal, onSubscribe]);

  const handleCardPress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/meal/${meal.id}`);
  }, [meal.id, onPress]);

  const cardGlowColor = colors.mealCardGlow;
  const cardShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: cardGlowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
        }
      : { elevation: 10 };

  const cardContainerStyle = [
    styles.card,
    {
      // backgroundColor: colors.mealCardSurface,
      width: sizing.cardWidth,
      marginBottom: sizing.cardMarginBottom,
      padding: sizing.cardPadding,
      // borderWidth: 1.5,
      // borderColor: cardGlowColor,
      // ...cardShadow,
    },
    containerStyle,
  ];

  return (
    <View style={cardContainerStyle}>
      {/* Pressable only for image + title + price - so buttons get their own touches */}
      <Pressable
        onPress={handleCardPress}
        testID={`meal-card-${meal.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Open ${meal.name}`}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed ? { opacity: 0.9 } : undefined,
        ]}
      >
        <View
          style={[
            styles.imageWrap,
            {
              height: sizing.imageHeight,
              borderRadius: sizing.imageRadius,
              backgroundColor: isDark ? "#121225" : "#EBEBEB",
            },
          ]}
        >
          {mealImage ? (
            <Image source={{ uri: mealImage }} style={[styles.image, { borderRadius: sizing.imageRadius }]} resizeMode="cover" />
          ) : null}
        </View>

        <View
          style={[
            styles.content,
            {
              paddingTop: sizing.contentPadTop,
              paddingBottom: 0,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                color: colors.mealCardTitle,
                fontSize: sizing.titleSize,
              },
            ]}
            numberOfLines={sizing.titleLines}
          >
            {meal.name}
          </Text>

          <Text style={[styles.startingFrom, { color: colors.mealCardPrice }]}>
            Starting from: ₹{meal.price}/day
          </Text>
        </View>
      </Pressable>

      {/* Buttons outside the card Pressable so they always receive touches */}
      <View
        style={[
          styles.ctaRowWrap,
          {
            paddingTop: sizing.ctaMarginTop,
            paddingBottom: sizing.contentPadBottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.secondaryBtn, { height: sizing.ctaHeight }]}
          onPress={handleTryNow}
          testID={`try-now-${meal.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Try ${meal.name} for 2 days`}
          // activeOpacity={0.82}
        >
          
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
              2-Day Trial
            </Text>
          
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor: colors.primary,
              height: sizing.ctaHeight,
            },
          ]}
          onPress={handleSubscribe}
          testID={`subscribe-${meal.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Subscribe to ${meal.name}`}
          activeOpacity={0.82}
        >
          <Text style={[styles.primaryBtnText, { color: colors.mealCardSubscribeText }]}>
            Subscribe
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
  cardPressable: {
    flex: 0,
  },
  imageWrap: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {},
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    lineHeight: 18,
    padding: 3,
  },
  startingFrom: {
    padding: 3,
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 0.15,
  },
  ctaRowWrap: {
    flexDirection: "row",
    gap: 6,
    padding: 3,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 9,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    minHeight: 36,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    // ...(Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.06,
    //     shadowRadius: 6,
    //   },
    //   android: { elevation: 2 },
    //   default: {},
    // }) as object),
  },
  secondaryBtnText: {
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  primaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    minHeight: 36,
    // ...(Platform.select({
    //   ios: {
    //     shadowColor: "#8A2BE2",
    //     shadowOffset: { width: 0, height: 4 },
    //     shadowOpacity: 0.4,
    //     shadowRadius: 10,
    //   },
    //   android: { elevation: 5 },
    //   default: {},
    // }) as object),
  },
  primaryBtnText: {
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.35,
  },
});


