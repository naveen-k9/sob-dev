import React, { useEffect, useRef, useState } from "react";
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
import { Percent } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

const offers = [
  {
    id: "1",
    code: "FIRSTMEAL",
    title: "Get your first meal free",
    subText: "Try us — first meal is on the house. No strings attached.",
    discount: "100%",
  },
  {
    id: "2",
    code: "SAVE100",
    title: "Save ₹100 instantly",
    subText: "Use this coupon for a quick ₹100 discount on checkout.",
    discount: "₹100",
  },
  {
    id: "3",
    code: "SAVE500",
    title: "Big Savings: ₹500 OFF",
    subText: "Great for subscriptions — big discount on your next plan.",
    discount: "₹500",
  },
];

const SPACING = 12;
const CARD_WIDTH = Math.min(340, width * 0.50);
const CARD_HEIGHT = 72;
const NOTCH_SIZE = 18;

export default function MenuOffers() {
  const listRef = useRef<FlatList<any> | null>(null);
  const indexRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

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
      // lightweight feedback; host app can replace with toast
      alert("Coupon copied: " + code);
    } catch (e) {
      alert("Copied: " + code);
    }
  };

  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(() => {
      if (isPaused) return;
      indexRef.current = (indexRef.current + 1) % offers.length;
      const offset = indexRef.current * (CARD_WIDTH + SPACING);
      listRef.current?.scrollToOffset({ offset, animated: true });
    }, 3400);
    return () => clearInterval(interval);
  }, [isPaused]);

  const renderItem = ({ item }: ListRenderItemInfo<any>) => {
    return (
      <Pressable
        onPress={() => handleCopy(item.code)}
        style={styles.cardWrapper}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <View style={styles.card}>
          {/* Left notch cutout */}
          <View style={styles.leftNotch} />
          
          {/* Right notch cutout */}
          <View style={styles.rightNotch} />

          {/* Left section with icon */}
          <View style={styles.leftSection}>
            <View style={styles.iconCircle}>
              <Percent color="#fff" size={32} strokeWidth={3} />
            </View>
          </View>

          {/* Dashed divider */}
          <View style={styles.dashedDivider}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>

          {/* Right section with content */}
          <View style={styles.rightSection}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{item.discount} off</Text>
            </View>
            <Text style={styles.codeLabel}>Use Code : <Text style={styles.codeValue}>{item.code}</Text></Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={offers}
        keyExtractor={(i) => String(i.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        onScrollBeginDrag={() => setIsPaused(true)}
        onScrollEndDrag={() => setIsPaused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: SPACING,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: SPACING,
  },
  card: {
    height: CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    zIndex: 10,
  },
  leftSection: {
    width: 90,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dashedDivider: {
    width: 1,
    height: "80%",
    alignItems: "center",
    justifyContent: "space-evenly",
    marginHorizontal: 0,
  },
  dash: {
    width: 2,
    height: 6,
    backgroundColor: "#d0d0d0",
    borderRadius: 1,
  },
  rightSection: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    justifyContent: "center",
  },
  discountBadge: {
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  discountText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    letterSpacing: 0.5,
  },
  codeLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "400",
  },
  codeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4CAF50",
    letterSpacing: 1,
  },
});
