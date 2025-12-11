import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Dimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";
import {
  MapPin,
  ChevronDown,
  Calendar,
  Clock,
  Package,
  User,
  User2,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/colors";
import CategoryCard from "@/components/CategoryCardMealTime";
import TestimonialCard from "@/components/TestimonialCard";
import OfferCard from "@/components/OfferCard";
import OfferDetailModal from "@/components/OfferDetailModal";
import FilterModal from "@/components/FilterModal";
import LocationService from "@/components/LocationService";
import FormCard from "@/components/FormCard";
import ThemeToggle from "@/components/ThemeToggle";
import { offers, PromotionalItem } from "@/constants/data";
import { useAsyncStorage } from "@/hooks/useStorage";
import {
  Banner,
  Offer,
  Subscription,
  Category,
  Meal,
  Testimonial,
  Polygon,
} from "@/types";
import { router, useFocusEffect } from "expo-router";
import db from "@/db";
import { useQuery } from "@tanstack/react-query";
import {
  fetchBanners,
  fetchCategories,
  fetchMeals,
  fetchTestimonials,
} from "@/services/firebase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MealCard from "@/components/MealCard";
import CategorySquareCard from "@/components/CategorySquareCard";
import RoleSelector from "@/components/RoleSelector";
import { Ionicons } from "@expo/vector-icons";

const TOP_BG_HEIGHT = Math.round(Dimensions.get("window").height * 0.38);

export default function HomeScreen() {
  const { user, isGuest, isAdmin, isKitchen, isDelivery } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [polygons] = useAsyncStorage<Polygon[]>("polygons", []);

  const [barStyle, setBarStyle] = useState<"light" | "dark">("dark"); // Start with light for banner
  const [isScrolled, setIsScrolled] = useState(false); // Track if user has scrolled past banner
  const [isFocused, setIsFocused] = useState(true); // Track if page is focused
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedQuickCategory, setSelectedQuickCategory] =
    useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [mySubscriptions, setMySubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Handle StatusBar changes only when this screen is focused
  useFocusEffect(
    useCallback(() => {
      // This will run when screen comes into focus
      console.log("[HomeScreen] Focused - enabling dynamic StatusBar");
      setIsFocused(true);

      return () => {
        // This cleanup will run when screen loses focus
        console.log("[HomeScreen] Unfocused - resetting StatusBar to dark");
        setIsFocused(false);
        setBarStyle("dark"); // Reset to dark when leaving
      };
    }, [])
  );

  const [filterSections, setFilterSections] = useState([
    {
      id: "dietary",
      title: "Dietary Preferences",
      options: [
        { id: "veg", label: "Vegetarian", selected: false },
        { id: "non-veg", label: "Non-Vegetarian", selected: false },
        { id: "vegan", label: "Vegan", selected: false },
        { id: "gluten-free", label: "Gluten Free", selected: false },
      ],
    },
  ]);

  const loadSubscriptions = useCallback(async () => {
    try {
      if (!user?.id) return;
      setSubsLoading(true);
      const subs = await db.getUserSubscriptions(user.id);
      setMySubscriptions(subs);
    } catch (e) {
      console.log("loadSubscriptions error", e);
    } finally {
      setSubsLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadSubscriptions();
    } finally {
      setRefreshing(false);
    }
  }, [loadSubscriptions]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    if (isAdmin()) {
      router.replace("/admin/dashboard");
    } else if (isKitchen()) {
      router.replace("/kitchen/dashboard");
    } else if (isDelivery()) {
      router.replace("/delivery/dashboard");
    }
  }, [isAdmin, isKitchen, isDelivery]);

  if (isAdmin() || isKitchen() || isDelivery()) {
    return null;
  }

  const handleCategoryPress = (categoryId: string) => {
    console.log(
      "[index] Category clicked, navigating to menu with categoryId:",
      categoryId
    );
    // Use router.push with proper query params to navigate to menu tab with selected category
    router.push({
      pathname: "/(tabs)/menu",
      params: { categoryId: categoryId },
    });
  };

  const handleMealPress = (mealId: string) => {
    router.push(`/meal/${mealId}`);
  };

  const handleOfferPress = (offerId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    if (offer) {
      setSelectedOffer(offer);
      setShowOfferModal(true);
    }
  };

  const handleUseOffer = (offer: Offer) => {
    router.push(`/subscription?offerId=${offer.id}&promoCode=${offer.code}`);
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setSelectedOffer(null);
  };

  const handleBannerPress = (banner: Banner) => {
    switch (banner.actionType) {
      case "category":
        router.push(
          `/menu?categoryId=${encodeURIComponent(String(banner.actionValue))}`
        );
        break;
      case "meal":
        router.push(`/meal/${banner.actionValue}`);
        break;
      case "external":
        router.push(
          `/webview?url=${encodeURIComponent(
            banner.actionValue
          )}&title=${encodeURIComponent(banner.title)}`
        );
        break;
      case "offer":
        router.push(`/subscription?offerId=${banner.actionValue}`);
        break;
      default:
    }
  };

  const renderMealGrid = ({ item }: { item: any }) => (
    <MealCard
      meal={item}
      onPress={() => handleMealPress(item.id)}
      onSubscribe={() => handleMealPress(item.id)}
      onTryNow={() => handleMealPress(item.id)}
    />
  );

  const renderCollectionsGrid = ({ item }: { item: any }) => (
    <CategorySquareCard
      category={item}
      onPress={() => handleCategoryPress(item.id)}
    />
  );

  return (
    <>
      {/* 
        SPECIAL STATUS BAR HANDLING FOR INDEX PAGE:
        - Override global StatusBar to allow banner image behind status bar
        - Dynamic style changes based on scroll position (light when banner visible, dark when scrolled)
        - Translucent background allows hero image to extend behind status bar cameras
        - This creates an immersive experience for the main landing page
      */}
      {/* {isFocused && (
        <StatusBar style={barStyle} backgroundColor="transparent" translucent />
      )} */}

      <CustomerHomeScreen
        user={user}
        isGuest={isGuest}
        showFilterModal={showFilterModal}
        setShowFilterModal={setShowFilterModal}
        filterSections={filterSections}
        setFilterSections={setFilterSections}
        handleCategoryPress={handleCategoryPress}
        handleMealPress={handleMealPress}
        handleOfferPress={handleOfferPress}
        handleBannerPress={handleBannerPress}
        renderMealGrid={renderMealGrid}
        renderCollectionsGrid={renderCollectionsGrid}
        showOfferModal={showOfferModal}
        selectedOffer={selectedOffer}
        handleUseOffer={handleUseOffer}
        handleCloseOfferModal={handleCloseOfferModal}
        mySubscriptions={mySubscriptions}
        subsLoading={subsLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        selectedCategoryId={selectedCategoryId}
        barStyle={barStyle}
        onScrollStatusChange={(next: "light" | "dark", scrolled: boolean) => {
          if (isFocused) {
            // Only update if page is focused
            setBarStyle(next);
            setIsScrolled(scrolled);
          }
        }}
        polygons={polygons.filter((p) => p.completed)}
        isDark={isDark}
        colors={colors}
      />
      {/* <RoleSelector currentRole="admin" /> */}
      {/* <TouchableOpacity
        onPress={() => router.push("/admin/test-notifications")}
        style={{
          position: "absolute",
          bottom: 50,
          right: 20,
          backgroundColor: "#007AFF",
          padding: 10,
          borderRadius: 5,
        }}
      >
        <Text>Switch to Admin</Text>
      </TouchableOpacity> */}
    </>
  );
}

function CustomerHomeScreen({
  user,
  isGuest,
  showFilterModal,
  setShowFilterModal,
  filterSections,
  setFilterSections,
  handleCategoryPress,
  handleMealPress,
  handleOfferPress,
  handleBannerPress,
  renderMealGrid,
  showOfferModal,
  selectedOffer,
  handleUseOffer,
  handleCloseOfferModal,
  renderCollectionsGrid,
  mySubscriptions,
  subsLoading,
  refreshing,
  onRefresh,
  selectedCategoryId,
  barStyle,
  onScrollStatusChange,
  polygons,
  isDark,
  colors,
}: {
  user: any;
  isGuest: boolean;
  showFilterModal: boolean;
  setShowFilterModal: (v: boolean) => void;
  filterSections: any[];
  setFilterSections: (v: any) => void;
  handleCategoryPress: (id: string) => void;
  handleMealPress: (id: string) => void;
  handleOfferPress: (id: string) => void;
  handleBannerPress: (b: Banner) => void;
  renderMealGrid: ({ item }: { item: any }) => React.ReactElement;
  renderCollectionsGrid: ({ item }: { item: any }) => React.ReactElement;
  showOfferModal: boolean;
  selectedOffer: Offer | null;
  handleUseOffer: (offer: Offer) => void;
  handleCloseOfferModal: () => void;
  mySubscriptions: Subscription[];
  subsLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  selectedCategoryId: string | null;
  barStyle: "light" | "dark";
  onScrollStatusChange: (next: "light" | "dark", scrolled: boolean) => void;
  polygons: Polygon[];
  isDark: boolean;
  colors: ReturnType<typeof getColors>;
}) {
  const { locationState } = useLocation();
  const insets = useSafeAreaInsets();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false); // Track active scrolling
  const [hasLocationBeenDetected, setHasLocationBeenDetected] = useState(false); // Track if location was already detected
  const [locationDetectionSession] = useAsyncStorage<boolean>(
    "locationDetectionSession",
    false
  );
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bannersQuery = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const mealsQuery = useQuery({ queryKey: ["meals"], queryFn: fetchMeals });
  const testimonialsQuery = useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
  });

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Initialize location detection state from storage
  useEffect(() => {
    if (locationDetectionSession) {
      setHasLocationBeenDetected(true);
    }
  }, [locationDetectionSession]);

  // Function to handle location detection and update storage
  const handleLocationSet = useCallback(async (location: any) => {
    console.log("Location set:", location);
    setHasLocationBeenDetected(true);
    // Update storage to remember that location was detected in this session
    try {
      await import("@react-native-async-storage/async-storage").then(
        ({ default: AsyncStorage }) =>
          AsyncStorage.setItem("locationDetectionSession", "true")
      );
    } catch (error) {
      console.log("Failed to save location detection session:", error);
    }
  }, []);

  const featuredMeals: Meal[] = useMemo(() => {
    const meals: Meal[] = mealsQuery.data ?? [];
    return meals.filter((m: Meal) => m.isFeatured === true);
  }, [mealsQuery.data]);

  const categories: Category[] = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  );
  const mealTimeCategories: Category[] = useMemo(
    () => categories.filter((c) => c.group === "meal-time"),
    [categories]
  );
  const collectionCategories: Category[] = useMemo(
    () => categories.filter((c) => c.group === "collection"),
    [categories]
  );

  const displayedMeals: Meal[] = useMemo(() => {
    const meals: Meal[] = mealsQuery.data ?? [];
    if (!selectedCategoryId) return featuredMeals;
    return meals.filter((m) => {
      const ids = (m.categoryIds ?? []).concat(
        m.categoryId ? [m.categoryId] : []
      );
      return ids.includes(selectedCategoryId);
    });
  }, [mealsQuery.data, featuredMeals, selectedCategoryId]);
  const banners: Banner[] = useMemo(
    () => bannersQuery.data ?? [],
    [bannersQuery.data]
  );
  const testimonials: Testimonial[] = useMemo(
    () => testimonialsQuery.data ?? [],
    [testimonialsQuery.data]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Header - appears on top when scrolled */}
      {/* {isScrolled && (
        <View
          style={[
            styles.stickyHeader,
            {
              paddingTop: insets.top,
              paddingBottom: 12,
            },
          ]}
        >
          <LocationService
            polygons={polygons}
            onLocationSet={handleLocationSet}
            disableAutoDetection={isScrolling || hasLocationBeenDetected} // Disable if scrolling OR already detected
          />
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.profileCircleSticky}
              onPress={() => router.push("/wallet")}
              testID="profile-button-sticky"
            >
              <View style={styles.walletPillSticky} testID="wallet-pill-sticky">
                <View style={styles.walletIconSticky} />
                <Text style={styles.walletTextSticky}>Rs 0</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileCircleSticky}
              onPress={() => router.push("/profile")}
              testID="profile-button-sticky"
            >
              <User2 size={24} color="#48489B" />
            </TouchableOpacity>
          </View>
        </View>
      )} */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset?.y ?? 0;
          const threshold = TOP_BG_HEIGHT * 0.6;
          const next: "light" | "dark" = y < threshold ? "light" : "dark";
          const currentlyScrolled = y > TOP_BG_HEIGHT - 60; // Show sticky header when banner is mostly scrolled out

          // Track scrolling state to prevent location detection during scroll
          setIsScrolling(true);

          // Clear existing timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          // Set timeout to detect when scrolling stops
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, 300); // 300ms after scroll stops

          // Update local scroll state
          if (currentlyScrolled !== isScrolled) {
            setIsScrolled(currentlyScrolled);
          }

          // Update parent's StatusBar style
          if (next !== barStyle) {
            onScrollStatusChange(next, currentlyScrolled);
          }
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.topBg, { height: TOP_BG_HEIGHT }]}>
          <ExpoImage
            source={{
              uri: "https://i0.wp.com/bestgrafix.com/wp-content/uploads/2024/09/Halloween-GIF-7.gif",
            }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            testID="bg-image"
          />
          <View
            style={[
              styles.header,
              {
                paddingTop: insets.top, // Always maintain safe area + small padding for header content
                paddingBottom: 18,
              },
            ]}
          >
            <LocationService
              polygons={polygons}
              onLocationSet={handleLocationSet}
              disableAutoDetection={
                isScrolled || isScrolling || hasLocationBeenDetected
              } // Disable if scrolled, scrolling, OR alr
            />
            <View style={styles.headerActions}>
              {/* DARK/LIGHT MODE SWITCH */}
              <ThemeToggle size={18} variant="pill" />
              <TouchableOpacity
                onPress={() => router.push("/wallet")}
                testID="profile-button-sticky"
              >
                <View style={styles.walletPill} testID="wallet-pill">
                  <Ionicons name="card-outline" size={27} color="#FFFFFF" />
                  <Text style={styles.walletText}>0</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileCircle}
                onPress={() => router.push("/profile")}
                testID="profile-button"
              >
                <User2 size={24} color="#48479B" />
              </TouchableOpacity>
            </View>
          </View>

          {bannersQuery.isLoading ? (
            <View style={[styles.bannersContainer, styles.pad20v24]}>
              <Text style={styles.whiteText}>Loading banners...</Text>
            </View>
          ) : bannersQuery.isError ? (
            <View style={[styles.bannersContainer, styles.pad20v24]}>
              <Text style={styles.errorText}>Failed to load banners</Text>
            </View>
          ) : (
            <View style={styles.bannersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.bannersRow}
              >
                {banners.map((banner) => (
                  <TouchableOpacity
                    key={banner.id}
                    onPress={() => handleBannerPress(banner)}
                    style={styles.bannerCard}
                    testID={`banner-${banner.id}`}
                  >
                    <Image
                      source={{ uri: banner.image }}
                      style={styles.bannerImage}
                    />
                    <View style={styles.bannerOverlay} />
                    <Text numberOfLines={1} style={styles.bannerTitle}>
                      {banner.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[styles.section]}>
          <View style={styles.centeredSectionHeader}>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.centeredSectionTitle, { color: colors.primary }]}
            >
              MEAL TIME
            </Text>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
          </View>
          {categoriesQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={styles.whiteText}>Loading categories...</Text>
            </View>
          ) : categoriesQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load categories</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {mealTimeCategories.map((category: Category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onPress={() => handleCategoryPress(category.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.centeredSectionTitle, { color: colors.primary }]}
            >
              COLLECTIONS
            </Text>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
          </View>
          {categoriesQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={styles.whiteText}>Loading collections...</Text>
            </View>
          ) : categoriesQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load collections</Text>
            </View>
          ) : (
            <View style={styles.mealGrid}>
              <FlatList
                data={collectionCategories.slice(0, 4)}
                renderItem={renderCollectionsGrid}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        {/* Form Cards Section */}
        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.centeredSectionTitle, { color: colors.primary }]}
            >
              SPECIAL SERVICES
            </Text>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
          </View>
          <View style={styles.formCardsColumn}>
            <FormCard
              title="Bulk Food Delivery"
              subtitle="Order before 7 days"
              description="Hassle-free food for office parties & more!"
              icon="📦"
              gradientColors={[colors.primary, "#6366F1"]}
              features={["No Cooking", "No Cleaning", "No Hassle"]}
              badge="Service & Live Cooking Available"
              onPress={() => router.push("/corporate-form")}
            />
            <FormCard
              title="Catering Service"
              subtitle="Order before 2 days"
              description="Suitable for small to large gatherings"
              icon="🍽️"
              gradientColors={["#EC4899", "#F97316"]}
              features={["Live Plating", "Service Available"]}
              badge="Service & Live Cooking Available"
              onPress={() => router.push("/nutrition-form")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.centeredSectionTitle, { color: colors.primary }]}
            >
              {selectedCategoryId ? "MEALS" : "POPULAR MEALS"}
            </Text>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
          </View>
          {mealsQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={styles.whiteText}>Loading meals...</Text>
            </View>
          ) : mealsQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load meals</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.collectionScrollContent}
            >
              {displayedMeals.map((meal: Meal, index) => (
                <View
                  key={meal.id}
                  style={[
                    styles.mealCardWrapper,
                    index !== displayedMeals.length - 1 && styles.mealCardGap,
                  ]}
                >
                  <MealCard
                    meal={meal}
                    variant="carousel"
                    onPress={() => handleMealPress(meal.id)}
                    onSubscribe={() => handleMealPress(meal.id)}
                    onTryNow={() => handleMealPress(meal.id)}
                  />
                </View>
              ))}
              {/* See All Button */}
              {/* <TouchableOpacity
                style={[styles.seeAllCard, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/menu")}
              >
                <View style={styles.seeAllCardContent}>
                  <Text style={styles.seeAllCardText}>See All</Text>
                  <Text style={styles.seeAllCardArrow}>→</Text>
                </View>
              </TouchableOpacity> */}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          {categoriesQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={[styles.whiteText, { color: colors.text }]}>
                Loading collections...
              </Text>
            </View>
          ) : categoriesQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load collections</Text>
            </View>
          ) : (
            <>
              {collectionCategories.slice(0, 3).map((collection: Category) => {
                const collectionMeals = (mealsQuery.data ?? [])
                  .filter(
                    (m: Meal) =>
                      (m.categoryIds ?? []).includes(collection.id) ||
                      m.categoryId === collection.id
                  )
                  .slice(0, 6);

                if (collectionMeals.length === 0) return null;

                return (
                  <View key={collection.id} style={styles.collectionSlider}>
                    <View style={styles.centeredSectionHeader}>
                      <View
                        style={[
                          styles.headerLine,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                      <Text
                        style={[
                          styles.centeredSectionTitle,
                          { color: colors.primary },
                        ]}
                      >
                        {collection.name.toUpperCase()}
                      </Text>
                      <View
                        style={[
                          styles.headerLine,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.horizontalScroll}
                      contentContainerStyle={styles.collectionScrollContent}
                    >
                      {collectionMeals.map((meal: Meal, index) => (
                        <View
                          key={meal.id}
                          style={[
                            styles.mealCardWrapper,
                            index !== collectionMeals.length - 1 &&
                              styles.mealCardGap,
                          ]}
                        >
                          <MealCard
                            meal={meal}
                            variant="carousel"
                            onPress={() => handleMealPress(meal.id)}
                            onSubscribe={() => handleMealPress(meal.id)}
                            onTryNow={() => handleMealPress(meal.id)}
                          />
                        </View>
                      ))}
                      {/* See All Button */}
                      <TouchableOpacity
                        style={[
                          styles.seeAllCard,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => handleCategoryPress(collection.id)}
                      >
                        <View style={styles.seeAllCardContent}>
                          <Text style={styles.seeAllCardText}>See All</Text>
                          <Text style={styles.seeAllCardArrow}>→</Text>
                        </View>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                );
              })}
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.centeredSectionTitle, { color: colors.primary }]}
            >
              SPECIAL OFFERS
            </Text>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onPress={() => handleOfferPress(offer.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.centeredSectionTitle, { color: colors.primary }]}
            >
              WHAT OUR CUSTOMERS SAY
            </Text>
            <View
              style={[styles.headerLine, { backgroundColor: colors.primary }]}
            />
          </View>
          {testimonialsQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={styles.whiteText}>Loading testimonials...</Text>
            </View>
          ) : testimonialsQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load testimonials</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {testimonials.map((testimonial: Testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        sections={filterSections}
        onOptionToggle={(sectionId: string, optionId: string) => {
          setFilterSections((prev: any[]) =>
            prev.map((section: any) =>
              section.id === sectionId
                ? {
                    ...section,
                    options: section.options.map((o: any) =>
                      o.id === optionId ? { ...o, selected: !o.selected } : o
                    ),
                  }
                : section
            )
          );
        }}
        onApply={() => setShowFilterModal(false)}
        onClear={() =>
          setFilterSections((prev: any[]) =>
            prev.map((s: any) => ({
              ...s,
              options: s.options.map((o: any) => ({ ...o, selected: false })),
            }))
          )
        }
      />

      <OfferDetailModal
        visible={showOfferModal}
        offer={selectedOffer}
        onClose={handleCloseOfferModal}
        onUseOffer={handleUseOffer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  topBg: {
    width: "100%",
    paddingTop: 9,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  popularMealsSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  horizontalMealScroll: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  popularMealWrapper: {
    marginRight: 16,
    width: 280,
  },
  bgImage: { resizeMode: "cover" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingRight: 18,
    // paddingVertical: 9,
    backgroundColor: "transparent",
  },

  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(72, 72, 144, 0.09)",
    // Add subtle shadow for elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  location: { flexDirection: "row", alignItems: "center" },
  locationText: {
    marginLeft: 9,
    marginRight: 3,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  walletIcon: {
    width: 16,
    height: 16,
    backgroundColor: "transparent",
    borderRadius: 4,
    marginRight: 6,
  },
  walletText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  walletPillSticky: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#48489B",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: "#48489B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  walletIconSticky: {
    width: 16,
    height: 16,
    backgroundColor: "#A3D397",
    borderRadius: 4,
    marginRight: 6,
  },
  walletTextSticky: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  profileCircleSticky: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(163, 211, 151, 0.3)",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  section: { marginBottom: 9, marginTop: 18 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    paddingHorizontal: 18,
    paddingBottom: 9,
  },
  centeredSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginBottom: 20,
    gap: 12,
  },
  centeredSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.5,
    paddingHorizontal: 12,
  },
  headerLine: {
    flex: 1,
    height: 2,
    opacity: 0.2,
  },
  seeAll: { fontSize: 14, color: "#A3D397", fontWeight: "700" },
  horizontalScroll: { paddingLeft: 18 },
  mealGrid: { paddingHorizontal: 25 },
  gridRow: { justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center" },
  rowMB6: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  textLeft: { textAlign: "left" as const },
  pad20v24: { paddingHorizontal: 20, paddingVertical: 24 },
  pad20: { paddingHorizontal: 20 },
  textMuted: { color: "#E9EAF6" },
  whiteText: { color: "#FFFFFF" },
  errorText: { color: "#EF4444" },
  mt8: { marginTop: 8 },
  bannersRow: { paddingRight: 20 },
  bannersContainer: { position: "absolute", left: 0, right: 0, bottom: 18 },
  bannerCard: {
    width: 132,
    height: 108,
    marginRight: 18,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.27)",
  },
  bannerImage: { width: "100%", height: "100%" },
  bannerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(72,72,135,0.27)",
  },
  bannerTitle: {
    position: "absolute",
    bottom: 9,
    left: 9,
    right: 9,
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  bottomSpacing: { height: 18 },
  subscriptionCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(163,211,151,0.35)",
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subscriptionTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  subscriptionStatus: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#A3D397",
    color: "#1B1B1B",
  },
  subscriptionDetails: { fontSize: 14, color: "#E9EAF6", marginBottom: 4 },
  formCardsColumn: {
    gap: 0,
  },
  collectionSlider: {
    marginBottom: 24,
  },
  collectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  mealCardWrapper: {
    width: 306,
  },
  mealCardGap: {
    marginRight: 9,
  },
  collectionScrollContent: {
    paddingRight: 18,
    gap: 9,
    alignItems: "center",
  },
  seeAllCard: {
    width: 90,
    height: 90,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
 
    marginRight: 18,
    marginLeft: 9,
  },
  seeAllCardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  seeAllCardText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    marginRight: 6,
  },
  seeAllCardArrow: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: -1,
  },
  categoriesScrollContent: {
    paddingRight: 18,
  },
});
