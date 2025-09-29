import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,

  TouchableOpacity,
  FlatList,

  Image,
} from 'react-native';
import { Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MapPin, ChevronDown, Calendar, Clock, Package, User, User2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import CategoryCard from '@/components/CategoryCard';
import TestimonialCard from '@/components/TestimonialCard';
import OfferCard from '@/components/OfferCard';
import OfferDetailModal from '@/components/OfferDetailModal';
import FilterModal from '@/components/FilterModal';
import { offers, PromotionalItem } from '@/constants/data';
import { Banner, Offer, Subscription, Category, Meal, Testimonial } from '@/types';
import { router } from 'expo-router';
import db from '@/db';
import { useQuery } from '@tanstack/react-query';
import { fetchBanners, fetchCategories, fetchMeals, fetchTestimonials } from '@/services/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MealCard from '@/components/MealCard';
import CategorySquareCard from '@/components/CategorySquareCard';

const TOP_BG_HEIGHT = Math.round(Dimensions.get('window').height * 0.36);

export default function HomeScreen() {
  const { user, isGuest, isAdmin, isKitchen, isDelivery } = useAuth();

  const [barStyle, setBarStyle] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [mySubscriptions, setMySubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [filterSections, setFilterSections] = useState([
    {
      id: 'dietary',
      title: 'Dietary Preferences',
      options: [
        { id: 'veg', label: 'Vegetarian', selected: false },
        { id: 'non-veg', label: 'Non-Vegetarian', selected: false },
        { id: 'vegan', label: 'Vegan', selected: false },
        { id: 'gluten-free', label: 'Gluten Free', selected: false },
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
      console.log('loadSubscriptions error', e);
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
      router.replace('/admin/dashboard');
    } else if (isKitchen()) {
      router.replace('/kitchen/dashboard');
    } else if (isDelivery()) {
      router.replace('/delivery/dashboard');
    }
  }, [isAdmin, isKitchen, isDelivery]);

  if (isAdmin() || isKitchen() || isDelivery()) {
    return null;
  }

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/menu?categoryId=${encodeURIComponent(categoryId)}`);
  };

  const handleMealPress = (mealId: string) => {
    router.push(`/meal/${mealId}`);
  };

  const handleOfferPress = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
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
      case 'category':
        router.push(`/menu?categoryId=${encodeURIComponent(String(banner.actionValue))}`);
        break;
      case 'meal':
        router.push(`/meal/${banner.actionValue}`);
        break;
      case 'external':
        router.push(`/webview?url=${encodeURIComponent(banner.actionValue)}&title=${encodeURIComponent(banner.title)}`);
        break;
      case 'offer':
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
      <StatusBar translucent backgroundColor="transparent" style={barStyle} />
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
        onScrollStatusChange={(next: 'light' | 'dark') => setBarStyle(next)}
      />
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
  barStyle: 'light' | 'dark';
  onScrollStatusChange: (next: 'light' | 'dark') => void;
}) {
  const { locationState } = useLocation();
  const insets = useSafeAreaInsets();

  const bannersQuery = useQuery({ queryKey: ['banners'], queryFn: fetchBanners });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const mealsQuery = useQuery({ queryKey: ['meals'], queryFn: fetchMeals });
  const testimonialsQuery = useQuery({ queryKey: ['testimonials'], queryFn: fetchTestimonials });

  const featuredMeals: Meal[] = useMemo(() => {
    const meals: Meal[] = mealsQuery.data ?? [];
    return meals.filter((m: Meal) => m.isFeatured === true);
  }, [mealsQuery.data]);

  const categories: Category[] = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const mealTimeCategories: Category[] = useMemo(() => categories.filter((c) => c.group === 'meal-time'), [categories]);
  const collectionCategories: Category[] = useMemo(() => categories.filter((c) => c.group === 'collection'), [categories]);

  const displayedMeals: Meal[] = useMemo(() => {
    const meals: Meal[] = mealsQuery.data ?? [];
    if (!selectedCategoryId) return featuredMeals;
    return meals.filter((m) => {
      const ids = (m.categoryIds ?? []).concat(m.categoryId ? [m.categoryId] : []);
      return ids.includes(selectedCategoryId);
    });
  }, [mealsQuery.data, featuredMeals, selectedCategoryId]);
  const banners: Banner[] = useMemo(() => bannersQuery.data ?? [], [bannersQuery.data]);
  const testimonials: Testimonial[] = useMemo(() => testimonialsQuery.data ?? [], [testimonialsQuery.data]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset?.y ?? 0;
          const threshold = TOP_BG_HEIGHT * 0.6;
          const next: 'light' | 'dark' = y < threshold ? 'light' : 'dark';
          if (next !== barStyle) onScrollStatusChange(next);
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.topBg, { height: TOP_BG_HEIGHT }]}>
          <ExpoImage
            source={{ uri: 'https://i0.wp.com/bestgrafix.com/wp-content/uploads/2024/09/Halloween-GIF-7.gif' }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            testID="bg-image"
          />
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.location} onPress={() => router.push('/location/select')} testID="select-location">
              <MapPin size={16} color="#A3D397" />
              <Text style={styles.locationText}>
                {locationState.selectedLocation?.name || user?.addresses?.[0]?.city || 'Select Location'}
              </Text>
              <ChevronDown size={16} color="#A3D397" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <View style={styles.walletPill} testID="wallet-pill">
                <View style={styles.walletIcon} />
                <Text style={styles.walletText}>Rs 0</Text>
              </View>
              <TouchableOpacity style={styles.profileCircle} onPress={() => router.push('/profile')} testID="profile-button">
                <User2 size={27} color="#48479B" />
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
                    <Image source={{ uri: banner.image }} style={styles.bannerImage} />
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
          <Text style={styles.sectionTitle}>Meal Time</Text>
          {categoriesQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={styles.whiteText}>Loading categories...</Text>
            </View>
          ) : categoriesQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load categories</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {mealTimeCategories.map((category: Category) => (
                <CategoryCard key={category.id} category={category} onPress={() => handleCategoryPress(category.id)} />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collections</Text>
          {categoriesQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={styles.whiteText}>Loading categories...</Text>
            </View>
          ) : categoriesQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load categories</Text>
            </View>
          ) : (
            // <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            //   {collectionCategories.map((category: Category) => (
            //     <CategoryCard key={category.id} category={category} onPress={() => handleCategoryPress(category.id)} />
            //   ))}
            // </ScrollView>
            <View style={styles.mealGrid}>
              <FlatList
                data={collectionCategories}
                renderItem={renderCollectionsGrid}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{selectedCategoryId ? 'Meals' : 'Popular Meals'}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu')} testID="see-all-meals">
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
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
            <View style={styles.mealGrid}>
              <FlatList
                data={displayedMeals}
                renderItem={renderMealGrid}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onPress={() => handleOfferPress(offer.id)} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Our Customers Say</Text>
          {testimonialsQuery.isLoading ? (
            <View style={styles.pad20}>
              <Text style={styles.whiteText}>Loading testimonials...</Text>
            </View>
          ) : testimonialsQuery.isError ? (
            <View style={styles.pad20}>
              <Text style={styles.errorText}>Failed to load testimonials</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {testimonials.map((testimonial: Testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
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
          setFilterSections((prev: any[]) => prev.map((section: any) => section.id === sectionId ? { ...section, options: section.options.map((o: any) => o.id === optionId ? { ...o, selected: !o.selected } : o) } : section));
        }}
        onApply={() => setShowFilterModal(false)}
        onClear={() => setFilterSections((prev: any[]) => prev.map((s: any) => ({ ...s, options: s.options.map((o: any) => ({ ...o, selected: false })) })))}
      />

      <OfferDetailModal visible={showOfferModal} offer={selectedOffer} onClose={handleCloseOfferModal} onUseOffer={handleUseOffer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBg: { width: '100%', paddingTop: 9, position: 'relative', overflow: 'hidden' },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bgImage: { resizeMode: 'cover' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 9, backgroundColor: 'transparent' },
  location: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 9, marginRight: 3, fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(163, 211, 151, 0.27)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginRight: 8 },
  walletIcon: { width: 18, height: 18, backgroundColor: '#A3D397', borderRadius: 4, marginRight: 6 },
  walletText: { color: '#FFFFFF', fontWeight: '700' },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    backgroundColor: '#ffffff'
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  section: { marginBottom: 9, marginTop: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000000', paddingHorizontal: 18, paddingBottom: 9 },
  seeAll: { fontSize: 14, color: '#A3D397', fontWeight: '700' },
  horizontalScroll: { paddingLeft: 18 },
  mealGrid: { paddingHorizontal: 18 },
  gridRow: { justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMB6: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  textLeft: { textAlign: 'left' as const },
  pad20v24: { paddingHorizontal: 20, paddingVertical: 24 },
  pad20: { paddingHorizontal: 20 },
  textMuted: { color: '#E9EAF6' },
  whiteText: { color: '#FFFFFF' },
  errorText: { color: '#EF4444' },
  mt8: { marginTop: 8 },
  bannersRow: { paddingRight: 20 },
  bannersContainer: { position: 'absolute', left: 0, right: 0, bottom: 18 },
  bannerCard: { width: 117, height: 108, marginRight: 18, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.27)' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(72,72,135,0.27)' },
  bannerTitle: { position: 'absolute', bottom: 9, left: 9, right: 9, color: '#fff', fontWeight: '900', fontSize: 14 },
  bottomSpacing: { height: 18 },
  subscriptionCard: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(163,211,151,0.35)' },
  subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subscriptionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  subscriptionStatus: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#A3D397', color: '#1B1B1B' },
  subscriptionDetails: { fontSize: 14, color: '#E9EAF6', marginBottom: 4 },
});