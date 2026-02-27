import React, { useEffect, useState, useRef, useMemo } from "react";
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
import { Subscription, Meal, AddOn, Banner } from "@/types";
import db from "@/db";
import { router } from "expo-router";

type SlideItem =
  | { type: "status"; id: string; data: NotificationMealItem }
  | { type: "banner"; id: string; data: Banner };

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 16;
const ITEM_WIDTH = SCREEN_WIDTH;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const AUTO_SLIDE_INTERVAL = 5000;
const AUTO_RESUME_IDLE_MS = 6000;

interface NotificationMealItem {
  id: string;
  subscriptionId: string;
  mealName: string;
  deliveryTime: string;
  status: "scheduled" | "cooking" | "ready" | "out_for_delivery" | "delivered";
}

interface SubscriptionNotificationCardsProps {
  userId: string;
  subscriptions: Subscription[];
  banners?: Banner[];
  onBannerPress?: (banner: Banner) => void;
}

const STATUS_CONFIG: Record<
  NotificationMealItem["status"],
  { label: string; accent: string; pillBg: string; pillText: string }
> = {
  scheduled: { label: "Scheduled", accent: "#3B82F6", pillBg: "rgba(59, 130, 246, 0.12)", pillText: "#2563EB" },
  cooking: { label: "Cooking", accent: "#F59E0B", pillBg: "rgba(245, 158, 11, 0.12)", pillText: "#D97706" },
  ready: { label: "Ready", accent: "#8B5CF6", pillBg: "rgba(139, 92, 246, 0.12)", pillText: "#7C3AED" },
  out_for_delivery: { label: "On the way", accent: "#EC4899", pillBg: "rgba(236, 72, 153, 0.12)", pillText: "#DB2777" },
  delivered: { label: "Delivered", accent: "#10B981", pillBg: "rgba(16, 185, 129, 0.12)", pillText: "#059669" },
};

const CARD_HEIGHT = 57;
const IMAGE_WIDTH =99;

export default function SubscriptionNotificationCards({
  userId,
  subscriptions,
  banners = [],
  onBannerPress,
}: SubscriptionNotificationCardsProps) {
  const [items, setItems] = useState<NotificationMealItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const allMeals = await db.getMeals();
        const mMap: Record<string, Meal> = {};
        allMeals.forEach((m) => {
          mMap[m.id] = m;
        });
        const addOnsData = await db.getAddOns();
        const aMap: Record<string, AddOn> = {};
        addOnsData.forEach((a) => {
          aMap[a.id] = a;
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];
        const currentHour = new Date().getHours();
        const list: NotificationMealItem[] = [];

        for (const subscription of subscriptions) {
          if (subscription.status !== "active") continue;
          const subStart = new Date(subscription.startDate);
          const subEnd = new Date(subscription.endDate);
          subStart.setHours(0, 0, 0, 0);
          subEnd.setHours(0, 0, 0, 0);
          if (today < subStart || today > subEnd) continue;
          if (subscription.skippedDates?.includes(todayString)) continue;
          const day = today.getDay();
          const weekendExclusion = subscription.weekendExclusion || "none";
          if (
            (weekendExclusion === "both" && (day === 0 || day === 6)) ||
            (weekendExclusion === "saturday" && day === 6) ||
            (weekendExclusion === "sunday" && day === 0)
          ) {
            continue;
          }
          const meal = mMap[subscription.mealId];
          if (!meal) continue;

          let status: NotificationMealItem["status"] = "scheduled";
          if (currentHour >= 8 && currentHour < 11) status = "cooking";
          else if (currentHour >= 11 && currentHour < 12) status = "ready";
          else if (currentHour >= 12 && currentHour < 14)
            status = "out_for_delivery";
          else if (currentHour >= 14) status = "delivered";

          list.push({
            id: `notif-${subscription.id}-${todayString}`,
            subscriptionId: subscription.id,
            mealName: meal.name,
            deliveryTime:
              subscription.deliveryTimeSlot ||
              subscription.deliveryTime ||
              "12:00 PM",
            status,
          });
        }
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [subscriptions, userId]);

  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePress = (item: NotificationMealItem) => {
    router.push("/(tabs)/orders");
  };

  const slides = useMemo<SlideItem[]>(() => {
    const s = items.map((d) => ({ type: "status" as const, id: d.id, data: d }));
    const b = (banners || []).map((d) => ({ type: "banner" as const, id: `banner-${d.id}`, data: d }));
    return [...s, ...b];
  }, [banners, items]);

  const autoPausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slidesLengthRef = useRef(slides.length);
  slidesLengthRef.current = slides.length;

  // Auto-loop: only advances when not paused (user not interacting)
  useEffect(() => {
    if (slides.length <= 1) return;
    const tick = () => {
      if (autoPausedRef.current) return;
      const len = slidesLengthRef.current;
      if (len <= 1) return;
      setActiveIndex((prev) => (prev + 1) % len);
    };
    autoSlideTimerRef.current = setInterval(tick, AUTO_SLIDE_INTERVAL);
    return () => {
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    flatListRef.current?.scrollToIndex({
      index: activeIndex,
      animated: true,
    });
  }, [activeIndex, slides.length]);

  const handleScrollBegin = () => {
    autoPausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleScrollEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      resumeTimeoutRef.current = null;
      autoPausedRef.current = false;
    }, AUTO_RESUME_IDLE_MS);
  };

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

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

  if (loading && slides.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.cardSingle]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (slides.length === 0) return null;

  const renderSlide = ({ item: slide }: { item: SlideItem }) => {
    if (slide.type === "banner") {
      const banner = slide.data;
      return (
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => onBannerPress?.(banner)}
          activeOpacity={0.92}
        >
          <View style={[styles.card, styles.cardBanner]}>
            <LinearGradient
              colors={["#FFFFFF", "#FAFAFA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.bannerCardInner}>
                <View style={styles.bannerImageWrap}>
                  <Image
                    source={{ uri: banner.image }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.bannerTextWrap}>
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
    }
    const item = slide.data;
    const config = STATUS_CONFIG[item.status];
    const showTime = item.status !== "delivered";
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => handlePress(item)}
        activeOpacity={0.92}
      >
        <View style={[styles.card, { borderLeftColor: config.accent }]}>
          <LinearGradient
            colors={["#FFFFFF", "#FAFAFA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardInner}>
              <View style={styles.cardMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.mealName}
                </Text>
                <View style={[styles.pill, { backgroundColor: config.pillBg }]}>
                  <View style={[styles.pillDot, { backgroundColor: config.accent }]} />
                  <Text style={[styles.pillText, { color: config.pillText }]} numberOfLines={1}>
                    {config.label}
                  </Text>
                </View>
              </View>
              {showTime && (
                <Text style={styles.time} numberOfLines={1}>
                  {item.deliveryTime}
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  const isMulti = slides.length > 1;

  return (
    <View style={styles.container}>
      {isMulti ? (
        <>
          <FlatList
            ref={flatListRef}
            data={slides}
            style={styles.flatList}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            bounces={false}
            contentContainerStyle={styles.sliderContent}
            onScrollBeginDrag={handleScrollBegin}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleScrollEnd}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            onScrollToIndexFailed={() => {}}
          />
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </>
      ) : (
        renderSlide({ item: slides[0] })
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
  flatList: {
    width: ITEM_WIDTH,
  },
  sliderContent: {
    paddingBottom: 6,
  },
  cardWrapper: {
    width: ITEM_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    borderRadius: 9,
    overflow: "hidden",
    borderLeftWidth: 4,
    borderLeftColor: "#E2E8F0",
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
  cardBanner: {
    borderLeftWidth: 0,
  },
  cardSingle: {
    alignSelf: "center",
  },
  cardGradient: {
    flex: 1,
    borderRadius: 9,
    overflow: "hidden",
    minHeight: CARD_HEIGHT,
  },
  cardInner: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    paddingLeft: 16,
  },
  bannerCardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: CARD_HEIGHT,
  },
  bannerImageWrap: {
    width: IMAGE_WIDTH,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  bannerImage: {
    width: IMAGE_WIDTH,
    height: "100%",
    minHeight: CARD_HEIGHT,
  },
  bannerTextWrap: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 14,
    paddingRight: 16,
    minWidth: 0,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 0,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 5,
    maxWidth: "48%",
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    letterSpacing: 0.15,
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
  loadingText: {
    color: "#64748B",
    fontSize: 13,
    padding: 16,
  },
});
