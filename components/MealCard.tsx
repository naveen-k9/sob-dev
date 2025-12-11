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
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Sparkles, Star } from "lucide-react-native";
import { router } from "expo-router";

import { Meal } from "@/types";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

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
        imageHeight: 196,
        contentPad: 14,
        titleSize: 18,
        titleLines: 2,
        subtitleLines: 2,
        ctaHeight: 44,
        ctaRadius: 16,
        showMetaRow: true,
        cardWidth: undefined as number | undefined,
        cardMarginBottom: 0,
      };
    }

    if (variant === "list" || columns === 1) {
      return {
        imageHeight: 130,
        contentPad: 12,
        titleSize: 16,
        titleLines: 2,
        subtitleLines: 2,
        ctaHeight: 40,
        ctaRadius: 14,
        showMetaRow: true,
        cardWidth: screenWidth - 32, // menu paddingHorizontal: 16
        cardMarginBottom: 14,
      };
    }

    return {
      imageHeight: 132,
      contentPad: 12,
      titleSize: 15,
      titleLines: 1,
      subtitleLines: 1,
      ctaHeight: 36,
      ctaRadius: 14,
      showMetaRow: false,
      cardWidth: DEFAULT_GRID_CARD_WIDTH,
      cardMarginBottom: 16,
    };
  }, [columns, variant]);

  const mealImage = meal?.images?.[0];

  const discountPercentage = meal.originalPrice
    ? Math.round(((meal.originalPrice - meal.price) / meal.originalPrice) * 100)
    : 0;

  const foodTypeLabel = meal.isVeg ? "Veg" : meal.hasEgg ? "Egg" : "Non-Veg";
  const foodTypeColor = meal.isVeg
    ? colors.success
    : meal.hasEgg
      ? colors.warning
      : colors.error;

  const ratingText =
    typeof meal.rating === "number" && meal.rating > 0
      ? meal.rating.toFixed(1)
      : null;

  const handleTryNow = useCallback(() => {
    if (onTryNow) {
      onTryNow(meal);
      return;
    }
    try {
      router.push({
        pathname: "/meal/[id]",
        params: { mode: "trial", planId: "1", id: meal.id },
      });
    } catch (e) {
      console.error("[MealCard] Navigation error (Try Now):", e);
    }
  }, [meal, onTryNow]);

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

  return (
    <Pressable
      onPress={handleCardPress}
      testID={`meal-card-${meal.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${meal.name}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
          width: sizing.cardWidth,
          marginBottom: sizing.cardMarginBottom,
          opacity: pressed ? 0.98 : 1,
        },
        // IMPORTANT: never set `transform` to undefined/null; RN's validator expects an array.
        pressed ? styles.pressed : undefined,
        containerStyle,
      ]}
    >
      {/* IMAGE */}
      <View
        style={[
          styles.imageWrap,
          {
            height: sizing.imageHeight,
            backgroundColor: isDark ? "#121225" : "#F3F4F6",
          },
        ]}
      >
        {mealImage ? (
          <Image source={{ uri: mealImage }} style={styles.image} resizeMode="cover" />
        ) : null}

        {/* Top overlay badges */}
        <View style={styles.topBadgesRow}>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: "rgba(0,0,0,0.55)",
                borderColor: "rgba(255,255,255,0.25)",
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: foodTypeColor }]} />
            <Text style={styles.pillText}>{foodTypeLabel}</Text>
          </View>

          <View style={styles.topBadgesRight}>
            {meal.isFeatured ? (
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor: "rgba(72, 72, 155, 0.85)",
                    borderColor: "rgba(255,255,255,0.22)",
                  },
                ]}
              >
                <Text style={styles.pillText}>Featured</Text>
              </View>
            ) : null}

            {discountPercentage > 0 ? (
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor: "rgba(163, 211, 151, 0.92)",
                    borderColor: "rgba(255,255,255,0.25)",
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: "#111827" }]}>
                  {discountPercentage}% OFF
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* gradient for readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.74)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.imageGradient}
        />

        {/* bottom meta row */}
        {sizing.showMetaRow ? (
          <View style={styles.metaRow}>
            {ratingText ? (
              <View style={styles.metaPill}>
                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                <Text style={styles.metaText}>
                  {ratingText}
                  {meal.reviewCount ? ` (${meal.reviewCount})` : ""}
                </Text>
              </View>
            ) : null}

            {typeof meal.preparationTime === "number" && meal.preparationTime > 0 ? (
              <View style={styles.metaPill}>
                <Clock size={14} color="#FFFFFF" />
                <Text style={styles.metaText}>{meal.preparationTime} min</Text>
              </View>
            ) : null}

            {typeof meal.nutritionInfo?.calories === "number" &&
            meal.nutritionInfo.calories > 0 ? (
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>{meal.nutritionInfo.calories} cal</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* CONTENT */}
      <View style={[styles.content, { padding: sizing.contentPad }]}>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: sizing.titleSize },
          ]}
          numberOfLines={sizing.titleLines}
        >
          {meal.name}
        </Text>

        {meal.description ? (
          <Text
            style={[styles.subtitle, { color: colors.mutedText }]}
            numberOfLines={sizing.subtitleLines}
          >
            {meal.description}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={[styles.startingFrom, { color: colors.mutedText }]}>
              Starting from
            </Text>
            <View style={styles.priceInline}>
              {meal.originalPrice ? (
                <Text style={[styles.originalPrice, { color: colors.mutedText }]}>
                  ₹{meal.originalPrice}
                </Text>
              ) : null}
              <Text style={[styles.price, { color: colors.primary }]}>₹{meal.price}</Text>
            </View>
          </View>

          {variant === "carousel" ? (
            <View style={styles.macroPills}>
              {typeof meal.nutritionInfo?.protein === "number" &&
              meal.nutritionInfo.protein > 0 ? (
                <View style={[styles.macroPill, { borderColor: colors.cardBorder }]}>
                  <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                    {meal.nutritionInfo.protein}g protein
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                borderColor: colors.primary,
                height: sizing.ctaHeight,
                borderRadius: sizing.ctaRadius,
              },
            ]}
            onPress={handleTryNow}
            testID={`try-now-${meal.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Try ${meal.name} for 2 days`}
            activeOpacity={0.85}
          >
            <Sparkles size={14} color={colors.primary} strokeWidth={2.5} />
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
                borderRadius: sizing.ctaRadius,
              },
            ]}
            onPress={handleSubscribe}
            testID={`subscribe-${meal.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Subscribe to ${meal.name}`}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    ...(Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }) as object),
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  imageWrap: { width: "100%", position: "relative" },
  image: { width: "100%", height: "100%" },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
  },
  topBadgesRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  topBadgesRight: { flexDirection: "row", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 999 },
  metaRow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 2,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  metaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  content: {},
  title: {
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  priceRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  priceLeft: { flex: 1 },
  startingFrom: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  priceInline: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  price: { fontSize: 20, fontWeight: "900", letterSpacing: -0.6 },
  originalPrice: {
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "line-through",
    paddingBottom: 2,
  },
  macroPills: { flexDirection: "row" },
  macroPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  macroText: { fontSize: 12, fontWeight: "700" },
  ctaRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1.6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryBtnText: { fontWeight: "900", fontSize: 12, letterSpacing: 0.2 },
  primaryBtn: { flex: 1, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12, letterSpacing: 0.25 },
});


