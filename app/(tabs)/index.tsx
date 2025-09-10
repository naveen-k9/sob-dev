import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MapPin, Bell, ChevronDown, Calendar, Clock, Package } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import HeroBanner from '@/components/HeroBanner';
import CategoryCard from '@/components/CategoryCard';
import MealCard from '@/components/MealCard';
import MealGridCard from '@/components/MealGridCard';
import TestimonialCard from '@/components/TestimonialCard';
import OfferCard from '@/components/OfferCard';
import OfferDetailModal from '@/components/OfferDetailModal';
import SearchBar from '@/components/SearchBar';
import FilterChips from '@/components/FilterChips';
import FilterModal from '@/components/FilterModal';
import QuickCategories from '@/components/QuickCategories';
import PromotionalSection from '@/components/PromotionalSection';
import { offers, subscriptionPlans, getActivePromotionalSection, PromotionalItem } from '@/constants/data';
import { Banner, Offer, Subscription, Category, Meal, Testimonial } from '@/types';
import { router } from 'expo-router';
import db from '@/db';
import { useQuery } from '@tanstack/react-query';
import { fetchBanners, fetchCategories, fetchMeals, fetchTestimonials } from '@/services/firebase';
import RoleSelector from '@/components/RoleSelector';

export default function HomeScreen() {
  const { user, isGuest, isAdmin, isKitchen, isDelivery } = useAuth();
  
  // Always initialize all hooks first
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('all');
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [mySubscriptions, setMySubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [filterChips, setFilterChips] = useState([
    { id: 'veg', label: 'Veg Only', selected: false },
    { id: 'high-protein', label: 'High Protein', selected: false },
    { id: 'under-300', label: 'Under ₹300', selected: false },
    { id: 'quick-delivery', label: 'Quick Delivery', selected: false },
  ]);

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
    {
      id: 'price',
      title: 'Price Range',
      options: [
        { id: 'under-200', label: 'Under ₹200', selected: false },
        { id: '200-400', label: '₹200 - ₹400', selected: false },
        { id: 'above-400', label: 'Above ₹400', selected: false },
      ],
    },
    {
      id: 'rating',
      title: 'Rating',
      options: [
        { id: '4-plus', label: '4.0+', selected: false },
        { id: '4.5-plus', label: '4.5+', selected: false },
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

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (isAdmin()) {
      router.replace('/admin/dashboard');
    } else if (isKitchen()) {
      router.replace('/kitchen/dashboard');
    } else if (isDelivery()) {
      router.replace('/delivery/dashboard');
    }
  }, [isAdmin, isKitchen, isDelivery]);
  
  // Don't render anything for admin/kitchen/delivery users as they will be redirected
  if (isAdmin() || isKitchen() || isDelivery()) {
    return null;
  }

  const quickCategories = [
    { id: 'all', name: 'All', icon: '🍽️', selected: selectedQuickCategory === 'all' },
    { id: 'lunch', name: 'Lunch', icon: '🥗', selected: selectedQuickCategory === 'lunch' },
    { id: 'dinner', name: 'Dinner', icon: '🍛', selected: selectedQuickCategory === 'dinner' },
    { id: 'protein', name: 'Protein', icon: '🥩', selected: selectedQuickCategory === 'protein' },
    { id: 'vegan', name: 'Vegan', icon: '🌱', selected: selectedQuickCategory === 'vegan' },
    { id: 'dessert', name: 'Dessert', icon: '🍰', selected: selectedQuickCategory === 'dessert' },
  ];


  const handleCategoryPress = (categoryId: string) => {
    console.log('Category pressed:', categoryId);
  };

  const handleMealPress = (mealId: string) => {
    router.push(`/meal/${mealId}`);
  };

  const handleOfferPress = (offerId: string) => {
    console.log('Offer pressed:', offerId);
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setSelectedOffer(offer);
      setShowOfferModal(true);
    }
  };

  const handleUseOffer = (offer: Offer) => {
    console.log('Using offer:', offer.id);
    // Navigate to subscription with offer applied
    router.push(`/subscription?offerId=${offer.id}&promoCode=${offer.code}`);
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setSelectedOffer(null);
  };

  const handleBannerPress = (banner: Banner) => {
    console.log('Banner pressed:', banner.id, banner.actionType, banner.actionValue);
    
    switch (banner.actionType) {
      case 'category':
        // Navigate to categories screen with specific category selected
        router.push(`/categories?categoryId=${banner.actionValue}`);
        break;
      case 'meal':
        // Navigate directly to meal detail screen
        router.push(`/meal/${banner.actionValue}`);
        break;
      case 'external':
        // Open external link in WebView
        const encodedUrl = encodeURIComponent(banner.actionValue);
        const encodedTitle = encodeURIComponent(banner.title);
        router.push(`/webview?url=${encodedUrl}&title=${encodedTitle}`);
        break;
      case 'offer':
        router.push(`/subscription?offerId=${banner.actionValue}`);
        break;
      default:
        router.push('/categories');
    }
  };

  const handlePromotionalItemPress = (item: PromotionalItem) => {
    console.log('Promotional item pressed:', item.id, item.actionType, item.actionValue);
    
    switch (item.actionType) {
      case 'category':
        router.push(`/categories?categoryId=${item.actionValue}`);
        break;
      case 'meal':
        router.push(`/meal/${item.actionValue}`);
        break;
      case 'external':
        // Open external link in WebView
        const encodedUrl = encodeURIComponent(item.actionValue);
        const encodedTitle = encodeURIComponent(item.title);
        router.push(`/webview?url=${encodedUrl}&title=${encodedTitle}`);
        break;
      case 'offer':
        router.push(`/subscription?offerId=${item.actionValue}`);
        break;
      default:
        router.push('/categories');
    }
  };

  const handleAddMeal = (mealId: string) => {
    router.push(`/meal/${mealId}`);
  };

  const handleFilterToggle = (filterId: string) => {
    setFilterChips(prev => 
      prev.map(chip => 
        chip.id === filterId ? { ...chip, selected: !chip.selected } : chip
      )
    );
  };

  const handleClearAllFilters = () => {
    setFilterChips(prev => prev.map(chip => ({ ...chip, selected: false })));
  };

  const handleFilterOptionToggle = (sectionId: string, optionId: string) => {
    setFilterSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              options: section.options.map(option => 
                option.id === optionId 
                  ? { ...option, selected: !option.selected }
                  : option
              )
            }
          : section
      )
    );
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    console.log('Apply filters');
  };

  const handleClearFilters = () => {
    setFilterSections(prev => 
      prev.map(section => ({
        ...section,
        options: section.options.map(option => ({ ...option, selected: false }))
      }))
    );
  };

  const handleQuickCategoryPress = (categoryId: string) => {
    setSelectedQuickCategory(categoryId);
    console.log('Quick category pressed:', categoryId);
  };

  const renderMealGrid = ({ item }: { item: any }) => (
    <MealGridCard
      meal={item}
      onPress={() => handleMealPress(item.id)}
      onAddPress={() => handleAddMeal(item.id)}
    />
  );

  return (
    <CustomerHomeScreen 
      user={user}
      isGuest={isGuest}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showFilterModal={showFilterModal}
      setShowFilterModal={setShowFilterModal}
      selectedQuickCategory={selectedQuickCategory}
      filterChips={filterChips}
      setFilterChips={setFilterChips}
      filterSections={filterSections}
      setFilterSections={setFilterSections}
      quickCategories={quickCategories}
      handleCategoryPress={handleCategoryPress}
      handleMealPress={handleMealPress}
      handleOfferPress={handleOfferPress}
      handleBannerPress={handleBannerPress}
      handleAddMeal={handleAddMeal}
      handleFilterToggle={handleFilterToggle}
      handleClearAllFilters={handleClearAllFilters}
      handleFilterOptionToggle={handleFilterOptionToggle}
      handleApplyFilters={handleApplyFilters}
      handleClearFilters={handleClearFilters}
      handleQuickCategoryPress={handleQuickCategoryPress}
      handlePromotionalItemPress={handlePromotionalItemPress}
      renderMealGrid={renderMealGrid}
      showOfferModal={showOfferModal}
      selectedOffer={selectedOffer}
      handleUseOffer={handleUseOffer}
      handleCloseOfferModal={handleCloseOfferModal}
      mySubscriptions={mySubscriptions}
      subsLoading={subsLoading}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

// Customer Home Screen Component
function CustomerHomeScreen({
  user,
  isGuest,
  searchQuery,
  setSearchQuery,
  showFilterModal,
  setShowFilterModal,
  selectedQuickCategory,
  filterChips,
  setFilterChips,
  filterSections,
  setFilterSections,
  quickCategories,
  handleCategoryPress,
  handleMealPress,
  handleOfferPress,
  handleBannerPress,
  handleAddMeal,
  handleFilterToggle,
  handleClearAllFilters,
  handleFilterOptionToggle,
  handleApplyFilters,
  handleClearFilters,
  handleQuickCategoryPress,
  handlePromotionalItemPress,
  renderMealGrid,
  showOfferModal,
  selectedOffer,
  handleUseOffer,
  handleCloseOfferModal,
  mySubscriptions,
  subsLoading,
  refreshing,
  onRefresh,
}: any) {
  const { locationState } = useLocation();

  const bannersQuery = useQuery({
    queryKey: ['banners'],
    queryFn: fetchBanners,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const mealsQuery = useQuery({
    queryKey: ['meals'],
    queryFn: fetchMeals,
  });
  const testimonialsQuery = useQuery({
    queryKey: ['testimonials'],
    queryFn: fetchTestimonials,
  });

  const featuredMeals: Meal[] = useMemo(() => {
    const meals: Meal[] = mealsQuery.data ?? [];
    return meals.filter((m: Meal) => m.isFeatured === true);
  }, [mealsQuery.data]);

  const categories: Category[] = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const banners: Banner[] = useMemo(() => bannersQuery.data ?? [], [bannersQuery.data]);
  const testimonials: Testimonial[] = useMemo(() => testimonialsQuery.data ?? [], [testimonialsQuery.data]);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.location}
          onPress={() => router.push('/location/select')}
        >
          <MapPin size={16} color="#FF6B35" />
          <Text style={styles.locationText}>
            {locationState.selectedLocation?.name || user?.addresses?.[0]?.city || 'Select Location'}
          </Text>
          <ChevronDown size={16} color="#666" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <RoleSelector currentRole="user" />
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
      />


      {/* Filter Chips */}
      <FilterChips
        filters={filterChips}
        onFilterToggle={handleFilterToggle}
        onClearAll={handleClearAllFilters}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* My Subscriptions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Subscriptions</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.seeAll}>{subsLoading ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>
          {subsLoading ? (
            <View style={styles.subscriptionCard}>
              <Text style={{ color: '#666' }}>Loading your subscriptions...</Text>
            </View>
          ) : mySubscriptions && mySubscriptions.length > 0 ? (
            mySubscriptions
              .sort((a: Subscription, b: Subscription) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .slice(0, 3)
              .map((sub: Subscription) => {
                const delivered = (sub.totalDeliveries ?? 0) - (sub.remainingDeliveries ?? 0);
                const statusBg = '#10B981';
                const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                return (
                  <View key={sub.id} style={styles.subscriptionCard} testID={`user-sub-${sub.id}`}>
                    <View style={styles.subscriptionHeader}>
                      <Text style={styles.subscriptionTitle}>{sub.planName || `${sub.totalDeliveries ?? 0} Day Plan`}</Text>
                      <Text style={styles.subscriptionStatus}>{(sub.status || 'active').toUpperCase()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Calendar size={14} color="#666" />
                      <Text style={styles.subscriptionDetails}>
                        {' '}{formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Clock size={14} color="#666" />
                      <Text style={styles.subscriptionDetails}> {' '}{sub.deliveryTime || sub.deliveryTimeSlot || '—'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Package size={14} color="#666" />
                      <Text style={styles.subscriptionDetails}> {' '}{delivered}/{sub.totalDeliveries ?? 0} meals delivered</Text>
                    </View>
                  </View>
                );
              })
          ) : (
            <View style={styles.subscriptionCard}>
              <Text style={{ color: '#666' }}>No active subscriptions yet.</Text>
              <TouchableOpacity onPress={() => router.push('/subscription')} style={{ marginTop: 8 }}>
                <Text style={[styles.seeAll, { textAlign: 'left' }]}>Explore Plans</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Hero Banner */}
        {bannersQuery.isLoading ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
            <Text style={{ color: '#666' }}>Loading banners...</Text>
          </View>
        ) : bannersQuery.isError ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
            <Text style={{ color: '#EF4444' }}>Failed to load banners</Text>
          </View>
        ) : (
          <HeroBanner banners={banners} onBannerPress={handleBannerPress} />
        )}

        {/* Promotional Section (Admin Controllable) */}
        <PromotionalSection
          title={getActivePromotionalSection().title}
          items={getActivePromotionalSection().items}
          onItemPress={handlePromotionalItemPress}
          backgroundColor={getActivePromotionalSection().backgroundColor}
        />

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          {categoriesQuery.isLoading ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: '#666' }}>Loading categories...</Text>
            </View>
          ) : categoriesQuery.isError ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: '#EF4444' }}>Failed to load categories</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {categories.map((category: Category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onPress={() => handleCategoryPress(category.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Featured Meals Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Meals</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {mealsQuery.isLoading ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: '#666' }}>Loading meals...</Text>
            </View>
          ) : mealsQuery.isError ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: '#EF4444' }}>Failed to load meals</Text>
            </View>
          ) : (
            <View style={styles.mealGrid}>
              <FlatList
                data={featuredMeals}
                renderItem={renderMealGrid}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        {/* Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onPress={() => handleOfferPress(offer.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Our Customers Say</Text>
          {testimonialsQuery.isLoading ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: '#666' }}>Loading testimonials...</Text>
            </View>
          ) : testimonialsQuery.isError ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: '#EF4444' }}>Failed to load testimonials</Text>
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

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        sections={filterSections}
        onOptionToggle={handleFilterOptionToggle}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Offer Detail Modal */}
      <OfferDetailModal
        visible={showOfferModal}
        offer={selectedOffer}
        onClose={handleCloseOfferModal}
        onUseOffer={handleUseOffer}
      />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingLeft: 20,
  },
  mealGrid: {
    paddingHorizontal: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  bottomSpacing: {
    height: 20,
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  kitchenStats: {
    paddingHorizontal: 20,
  },
  deliveryStats: {
    paddingHorizontal: 20,
  },
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '48%',
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subscriptionStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#10B981',
    color: 'white',
  },
  subscriptionDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assignButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});