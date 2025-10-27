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
import { Copy } from "lucide-react-native";
import { Colors } from "@/constants/colors";

const { width } = Dimensions.get("window");

const offers = [
  {
    id: "1",
    code: "FIRSTMEAL",
    title: "Get your first meal free",
    subText: "Try us — first meal is on the house. No strings attached.",
  },
  {
    id: "2",
    code: "SAVE100",
    title: "Save ₹100 instantly",
    subText: "Use this coupon for a quick ₹100 discount on checkout.",
  },
  {
    id: "3",
    code: "SAVE500",
    title: "Big Savings: ₹500 OFF",
    subText: "Great for subscriptions — big discount on your next plan.",
  },
];

const SPACING = 12;
const CARD_WIDTH = Math.min(320, width * 0.78);
const CARD_HEIGHT = 88;

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
        onPress={() => {}}
        style={styles.cardWrapper}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <View style={styles.card}>
          <View style={styles.leftBadge}>
            <Text style={styles.codeText}>{item.code}</Text>
          </View>

          <View style={styles.rightContent}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={styles.subText} numberOfLines={2} ellipsizeMode="tail">
              {item.subText}
            </Text>
          </View>

          <Pressable
            style={styles.copyBtn}
            onPress={() => handleCopy(item.code)}
            android_ripple={{ color: Colors.accent }}
            accessibilityLabel={`Copy ${item.code}`}
          >
            <Copy color="#fff" size={16} />
          </Pressable>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  leftBadge: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  codeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1.5,
  },
  rightContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  subText: {
    fontSize: 12,
    color: "#444",
  },
  copyBtn: {
    marginLeft: 12,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
