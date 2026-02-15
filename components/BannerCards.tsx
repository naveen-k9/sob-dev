import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Banner } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 16;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - CARD_MARGIN * 2, 320);
const CARD_HEIGHT = 88;
const IMAGE_WIDTH = 72;
const AUTO_SLIDE_INTERVAL = 3000;

interface BannerCardsProps {
  banners: Banner[];
  onBannerPress: (banner: Banner) => void;
  /** When true, card is not absolutely positioned (e.g. stacked above status cards) */
  embedded?: boolean;
}

export default function BannerCards({ banners, onBannerPress, embedded }: BannerCardsProps) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    autoSlideTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, AUTO_SLIDE_INTERVAL);
    return () => {
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    flatListRef.current?.scrollToIndex({
      index: activeIndex,
      animated: true,
    });
  }, [activeIndex, banners.length]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  if (!banners.length) return null;

  const renderCard = ({ item: banner }: { item: Banner }) => (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={() => onBannerPress(banner)}
      activeOpacity={0.92}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={["#FFFFFF", "#FAFAFA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardInner}>
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: banner.image }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {banner.title}
              </Text>
              {banner.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {banner.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const isMulti = banners.length > 1;

  return (
    <View style={[styles.container, embedded && styles.containerEmbedded]}>
      {isMulti ? (
        <>
          <FlatList
            ref={flatListRef}
            data={banners}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 8}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={styles.sliderContent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: CARD_WIDTH + 8,
              offset: CARD_MARGIN + (CARD_WIDTH + 8) * index,
              index,
            })}
            onScrollToIndexFailed={() => {}}
          />
          <View style={styles.dots}>
            {banners.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </>
      ) : (
        renderCard({ item: banners[0] })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
  },
  containerEmbedded: {
    position: "relative",
    bottom: undefined,
    marginBottom: 8,
  },
  sliderContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 6,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    paddingRight: 16,
  },
  imageWrap: {
    width: IMAGE_WIDTH,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  bannerImage: {
    width: IMAGE_WIDTH,
    height: "100%",
  },
  textWrap: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 14,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
    lineHeight: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    letterSpacing: 0.15,
    lineHeight: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
  },
  dotActive: {
    backgroundColor: "#0F172A",
    width: 18,
    borderRadius: 3,
  },
});
