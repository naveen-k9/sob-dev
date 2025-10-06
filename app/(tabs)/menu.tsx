import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchMeals } from '@/services/firebase';
import { Category, Meal, Offer } from '@/types';
import CategoryCard from '@/components/CategoryCard';
import OfferCard from '@/components/OfferCard';
import OfferDetailModal from '@/components/OfferDetailModal';
import FilterChips from '@/components/FilterChips';
import FilterModal from '@/components/FilterModal';
import { LayoutGrid, Rows } from 'lucide-react-native';

import { offers as offersSeed } from '@/constants/data';
import { Colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import MealCard from '@/components/MealCard';
import MenuOffers from '@/components/MenuOffers';

export default function CategoryBrowserScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const initial = typeof params.categoryId === 'string' ? params.categoryId : null;
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(initial);
  const [activeCategoryName, setActiveCategoryName] = useState<string>('');
  const [gridCols, setGridCols] = useState<number>(2);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState<boolean>(false);
  const [filterChips, setFilterChips] = useState<{ id: string; label: string; selected: boolean; }[]>([
    { id: 'veg', label: 'Veg', selected: false },
    { id: 'non-veg', label: 'Non-Veg', selected: false },
    { id: 'under-300', label: 'Under ₹300', selected: false },
  ]);
  const [filterSections, setFilterSections] = useState<{ id: string; title: string; options: { id: string; label: string; selected: boolean; }[]; }[]>([
    {
      id: 'diet', title: 'Diet', options: [
        { id: 'veg', label: 'Vegetarian', selected: false },
        { id: 'non-veg', label: 'Non-Vegetarian', selected: false },
        { id: 'vegan', label: 'Vegan', selected: false },
      ]
    },
    {
      id: 'price', title: 'Price', options: [
        { id: 'under-200', label: 'Under ₹200', selected: false },
        { id: '200-400', label: '₹200–₹400', selected: false },
        { id: 'above-400', label: 'Above ₹400', selected: false },
      ]
    },
  ]);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const activeOffers: Offer[] = useMemo(() => (offersSeed ?? []).filter(o => o.isActive), []);
  const mealsQuery = useQuery({ queryKey: ['meals'], queryFn: fetchMeals });

  useEffect(() => {
    if (!activeCategoryId && typeof initial === 'string') {
      setActiveCategoryId(initial);
    }
  }, [initial, activeCategoryId]);
  // ...existing code...
  // Move activeCategoryName effect below allCategories declaration

  const isLoading = categoriesQuery.isLoading || mealsQuery.isLoading;
  const hasError = categoriesQuery.isError || mealsQuery.isError;

  const categories: Category[] = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const mealTimeCategories = useMemo(() => categories.filter(c => c.group === 'meal-time'), [categories]);
  const collectionCategories = useMemo(() => categories.filter(c => c.group === 'collection'), [categories]);
  const allCategories: Category[] = useMemo(() => [...mealTimeCategories, ...collectionCategories], [mealTimeCategories, collectionCategories]);

  useEffect(() => {
    if (activeCategoryId) {
      const found = allCategories.find(c => c.id === activeCategoryId);
      setActiveCategoryName(found ? found.name : '');
    } else {
      setActiveCategoryName('');
    }
  }, [activeCategoryId, allCategories]);

  const displayedMeals: Meal[] = useMemo(() => {
    const all: Meal[] = mealsQuery.data ?? [];
    let list = activeCategoryId
      ? all.filter(m => {
        const ids = (m.categoryIds ?? []).concat(m.categoryId ? [m.categoryId] : []);
        return ids.includes(activeCategoryId);
      })
      : [];
    const chipFilters = new Set(filterChips.filter(c => c.selected).map(c => c.id));
    if (chipFilters.has('veg')) list = list.filter(m => m.isVeg === true);
    if (chipFilters.has('non-veg')) list = list.filter(m => m.isVeg === false);
    if (chipFilters.has('under-300')) list = list.filter(m => (m.price ?? 0) < 300);
    return list;
  }, [mealsQuery.data, activeCategoryId, filterChips]);

  const handleMealPress = useCallback((mealId: string) => {
    router.push(`/meal/${mealId}`);
  }, []);

  const handleAdd = useCallback((mealId: string) => {
    router.push(`/meal/${mealId}`);
  }, []);

  const handleFilterToggle = useCallback((id: string) => {
    setFilterChips(prev => prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c)));
  }, []);

  const handleFilterOptionToggle = useCallback((sectionId: string, optionId: string) => {
    setFilterSections(prev => prev.map(s => s.id === sectionId ? { ...s, options: s.options.map(o => o.id === optionId ? { ...o, selected: !o.selected } : o) } : s));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterChips(prev => prev.map(c => ({ ...c, selected: false })));
    setFilterSections(prev => prev.map(s => ({ ...s, options: s.options.map(o => ({ ...o, selected: false })) })));
  }, []);

  // Horizontal categories measurements for autoscroll
  const scrollRef = useRef<ScrollView | null>(null);
  const itemLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const screenWidth = Dimensions.get('window').width;

  const scrollToCategory = useCallback((id: string) => {
    const layout = itemLayoutsRef.current[id];
    if (!layout || !scrollRef.current) {
      console.log('Auto-scroll skipped, missing layout or ref', { id, hasLayout: !!layout, hasRef: !!scrollRef.current });
      return;
    }
    const target = Math.max(0, layout.x - (screenWidth - layout.width) / 2);
    try {
      console.log('Auto-scroll to category', id, layout, { target });
      scrollRef.current.scrollTo({ x: target, y: 0, animated: false });
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: target, y: 0, animated: true }));
    } catch (e) {
      console.log('Scroll error', e);
    }
  }, [screenWidth]);

  const onCategoryLayout = useCallback((id: string, x: number, width: number) => {
    itemLayoutsRef.current[id] = { x, width };
    if (id === activeCategoryId) {
      requestAnimationFrame(() => scrollToCategory(id));
    }
  }, [activeCategoryId, scrollToCategory]);

  useEffect(() => {
    if (activeCategoryId) {
      if (itemLayoutsRef.current[activeCategoryId]) {
        scrollToCategory(activeCategoryId);
        return;
      }
      const t = setTimeout(() => scrollToCategory(activeCategoryId), 60);
      return () => clearTimeout(t);
    }
  }, [activeCategoryId, scrollToCategory]);

  const handleOfferPress = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    setOfferModalVisible(true);
  }, []);

  const handleUseOffer = useCallback((offer: Offer) => {
    console.log('Use offer', offer?.code ?? offer?.promoCode);
    setOfferModalVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar light style */}
      <StatusBar style="light" />

      <Stack.Screen
        options={{
          title: 'Menu',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: { color: Colors.background, fontSize: 22, fontWeight: '700' },
          headerRight: () => (
            <View style={styles.filtersBar}>
              <Text style={styles.filtersLabel}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(true)} testID="open-filter">
                <Text style={styles.filterAction}>Open</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

     

      <View style={[styles.sectionMain, { marginTop: 0 }]}> 
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.horizontalContent}
          onContentSizeChange={() => {
            if (activeCategoryId) {
              requestAnimationFrame(() => scrollToCategory(activeCategoryId));
            }
          }}
        >
          {allCategories.map(c => (
            <View
              key={c.id}
              testID={`category-item-${c.id}`}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                console.log('Category item layout', c.id, { x, width });
                onCategoryLayout(c.id, x, width);
              }}
            >
              <CategoryCard
                category={c}
                isActive={c.id === activeCategoryId}
                onPress={() => {
                  setActiveCategoryId(prev => (prev === c.id ? null : c.id));
                  requestAnimationFrame(() => scrollToCategory(c.id));
                }}
              />
            </View>
          ))}
        </ScrollView>
        {/* Active Category Name below ScrollView */}
        {/* {activeCategoryName ? (
          <View style={styles.activeCategoryNameWrap}>
            <Text style={styles.activeCategoryNameText}>{activeCategoryName} Products</Text>
          </View>
        ) : null} */}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap} testID="categories-loading">
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.loadingWrap} testID="categories-error">
          <Text style={styles.errorText}>Failed to load. Please check your connection or Firebase keys.</Text>
          <TouchableOpacity onPress={() => { categoriesQuery.refetch(); mealsQuery.refetch(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* OFFERS SECTION */}

          {/* <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleSmall}>Offers & Coupons</Text>
            <TouchableOpacity onPress={() => console.log('View all offers')}>
              <Text style={styles.clearText}>View all</Text>
            </TouchableOpacity>
          </View> */}
          {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersRow}>
            {activeOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={{
                  ...offer,
                  discount: offer.discount ?? (offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : offer.discountType === 'cashback' ? `₹${offer.discountValue} Cashback` : `₹${offer.discountValue} OFF`),
                  code: offer.code ?? offer.promoCode,
                  validUntil: offer.validUntil ?? new Date(offer.validTo).toDateString(),
                }}
                onPress={() => handleOfferPress(offer)}
              />
            ))}

          </ScrollView> */}
          <MenuOffers />
{/* 
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleSmall}>{activeCategoryId ? 'Products' : 'Pick a category'}</Text>
            {activeCategoryId && (
              <TouchableOpacity onPress={() => setActiveCategoryId(null)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View> */}

          <View style={styles.mealGrid}>
            <FlatList
              data={displayedMeals}
              renderItem={({ item }) => (
                <MealCard meal={item} onPress={() => handleMealPress(item.id)} onTryNow={() => handleAdd(item.id)} />
              )}
              keyExtractor={(item) => item.id}
              numColumns={gridCols}
              columnWrapperStyle={gridCols > 1 ? styles.gridRow : undefined}
              scrollEnabled={false}
              ListEmptyComponent={activeCategoryId ? <Text style={styles.empty}>No items</Text> : null}
            />
          </View>
        </ScrollView>
      )}

      <FilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} sections={filterSections} onOptionToggle={handleFilterOptionToggle} onApply={handleApplyFilters} onClear={handleClearFilters} />

      <OfferDetailModal
        visible={offerModalVisible}
        offer={selectedOffer}
        onClose={() => setOfferModalVisible(false)}
        onUseOffer={handleUseOffer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  menuTextWrap: { alignItems: 'center', marginTop: 12 },
  menuText: { backgroundColor: '#A3D397', color: '#111827', fontSize: 22, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  sectionTitleSmall: { fontSize: 16, fontWeight: '700', color: '#333' },
  horizontalScroll: { paddingVertical: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  sectionMain: { marginTop: 20 },
  clearText: { color: '#48479B', fontWeight: '600' },
  mealGrid: { paddingHorizontal: 20, marginTop: 12 },
  gridRow: { justifyContent: 'space-between' },
  empty: { color: '#666', paddingHorizontal: 20, paddingVertical: 12 },
  filtersBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  filtersLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  filterAction: { color: '#111', fontWeight: '600' },
  headerIconBtn: { padding: 8 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { color: '#666' },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 8 },
  retryBtn: { backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: 'white', fontWeight: '600' },
  offersRow: { paddingLeft: 20, paddingVertical: 8 },
  horizontalContent: { paddingHorizontal: 20 },
  activeCategoryNameWrap: { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  activeCategoryNameText: { fontSize: 16, fontWeight: '700', color: '#000' },
});