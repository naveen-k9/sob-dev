import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
  FlatList,
  ListRenderItemInfo,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/colors";
import db from "@/db";
import { Offer } from "@/types";

const { width } = Dimensions.get("window");

function mapOfferToDisplay(o: Offer): { id: string; code: string; discount: string; minOrder: string } {
  const code = (o.promoCode ?? o.code ?? o.id).toString();
  let discount = o.discount ?? "";
  if (!discount) {
    if (o.discountType === "fixed") discount = `₹${o.discountValue}`;
    else if (o.discountType === "percentage") discount = `${o.discountValue}%`;
    else if (o.discountType === "cashback") discount = `₹${o.discountValue} cashback`;
    else discount = `₹${o.discountValue}`;
  }
  const minOrder = o.minOrderAmount != null ? `₹${o.minOrderAmount}` : "any order";
  return { id: o.id, code, discount, minOrder };
}

const HORIZONTAL_PADDING = 16;
const SPACING = 10;
// Calculate card width so all 3 cards fit perfectly
const CARD_WIDTH = (width - (2 * HORIZONTAL_PADDING) - (2 * SPACING)) / 3;
const CARD_HEIGHT = 72;
const NOTCH_SIZE = 14;

export default function MenuOffers() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);

  useEffect(() => {
    let cancelled = false;
    db.getActiveOffers().then((list) => {
      if (!cancelled) setActiveOffers(list ?? []);
    });
    return () => { cancelled = true; };
  }, []);

  const displayOffers = useMemo(
    () => activeOffers.filter((o) => (o.promoCode ?? o.code) && o.offerType !== "deal").slice(0, 5).map(mapOfferToDisplay),
    [activeOffers]
  );

  const handleCopy = async (code: string) => {
    try {
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(code);
      } else {
        await Clipboard.setStringAsync(code);
      }
      alert("Coupon copied: " + code);
    } catch (e) {
      alert("Copied: " + code);
    }
  };

  // Theme-aware gradient colors
  const gradientColors = isDark 
    ? ["#1a1a2e", "#252540", "#1a1a2e"] as const
    : ["#f8f0ff", "#ece4f8", "#f0e8fc"] as const;

  const notchBgColor = isDark ? "#252540" : "#f0e8fc";
  const cardBgColor = isDark ? colors.surface : "#fff";
  const discountTextColor = isDark ? "#a78bfa" : "#5b21b6";
  const dashColor = isDark ? "#6366f1" : "#c4b5fd";

  const renderItem = ({ item, index }: ListRenderItemInfo<{ id: string; code: string; discount: string; minOrder: string }>) => {
    const isLast = index === displayOffers.length - 1;
    return (
      <Pressable
        onPress={() => handleCopy(item.code)}
        style={[styles.cardWrapper, isLast && { marginRight: 0 }]}
      >
        <View style={[styles.card, { backgroundColor: cardBgColor }]}>
          {/* Left notch cutout */}
          <View style={[styles.leftNotch, { backgroundColor: notchBgColor }]} />
          
          {/* Right notch cutout */}
          <View style={[styles.rightNotch, { backgroundColor: notchBgColor }]} />

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Discount text */}
            <Text style={[styles.discountText, { color: discountTextColor }]}>{item.discount} off</Text>
            
            {/* Horizontal dashed line */}
            <View style={styles.dashedLineContainer}>
              {[...Array(12)].map((_, i) => (
                <View key={i} style={[styles.dash, { backgroundColor: dashColor }]} />
              ))}
            </View>
            
            {/* Minimum order text */}
            <Text style={[styles.minOrderText, { color: colors.mutedText }]}>
              on {item.minOrder} & above
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (displayOffers.length === 0) return null;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <FlatList
        data={displayOffers}
        keyExtractor={(i) => String(i.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={displayOffers.length > 3}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: SPACING,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 12,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "visible",
    position: "relative",
  },
  leftNotch: {
    position: "absolute",
    left: -NOTCH_SIZE / 2,
    top: "50%",
    marginTop: -NOTCH_SIZE / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    zIndex: 10,
  },
  rightNotch: {
    position: "absolute",
    right: -NOTCH_SIZE / 2,
    top: "50%",
    marginTop: -NOTCH_SIZE / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  discountText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 1,
  },
  dashedLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginVertical: 4,
    width: "80%",
  },
  dash: {
    width: 5,
    height: 0.9,
    borderRadius: 1,
  },
  minOrderText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
});
