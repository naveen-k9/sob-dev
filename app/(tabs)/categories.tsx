import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ArrowLeft, Grid3X3, List } from 'lucide-react-native';
import { router } from 'expo-router';
import { categories, featuredMeals } from '@/constants/data';
import { Category, Meal } from '@/types';
import SearchBar from '@/components/SearchBar';
import FilterChips from '@/components/FilterChips';
import FilterModal from '@/components/FilterModal';
import MealGridCard from '@/components/MealGridCard';
import MealCard from '@/components/MealCard';

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [filterChips, setFilterChips] = useState([
    { id: 'veg', label: 'Veg Only', selected: false },
    { id: 'high-protein', label: 'High Protein', selected: false },
    { id: 'under-300', label: 'Under ₹300', selected: false },
    { id: 'rating-4', label: '4.0+ Rating', selected: false },
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
    {
      id: 'sort',
      title: 'Sort By',
      options: [
        { id: 'popularity', label: 'Popularity', selected: false },
        { id: 'price-low', label: 'Price: Low to High', selected: false },
        { id: 'price-high', label: 'Price: High to Low', selected: false },
        { id: 'rating', label: 'Rating', selected: false },
      ],
    },
  ]);

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category.id);
    console.log('Category pressed:', category.name);
  };

  const handleMealPress = (mealId: string) => {
    router.push(`/meal/${mealId}`);
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
    setFilterSections(prev => 
      prev.map(section => ({
        ...section,
        options: section.options.map(option => ({ ...option, selected: false }))
      }))
    );
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
    // Sync filter chips with modal selections
    const updatedChips = filterChips.map(chip => {
      const dietarySection = filterSections.find(s => s.id === 'dietary');
      const priceSection = filterSections.find(s => s.id === 'price');
      const ratingSection = filterSections.find(s => s.id === 'rating');
      
      switch (chip.id) {
        case 'veg':
          return { ...chip, selected: dietarySection?.options.find(o => o.id === 'veg')?.selected || false };
        case 'high-protein':
          // Check if any meal in current category has high protein tag
          const hasHighProteinMeals = featuredMeals.some(meal => 
            meal.categoryId === selectedCategory && 
            meal.tags.some(tag => tag.toLowerCase().includes('protein'))
          );
          return { ...chip, selected: hasHighProteinMeals && chip.selected };
        case 'under-300':
          return { ...chip, selected: priceSection?.options.find(o => o.id === 'under-200' || o.id === '200-400')?.selected || false };
        case 'rating-4':
          return { ...chip, selected: ratingSection?.options.find(o => o.id === '4-plus')?.selected || false };
        default:
          return chip;
      }
    });
    
    setFilterChips(updatedChips);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setFilterSections(prev => 
      prev.map(section => ({
        ...section,
        options: section.options.map(option => ({ ...option, selected: false }))
      }))
    );
  };

  // Filter and sort meals based on selected criteria
  const filteredAndSortedMeals = useMemo(() => {
    if (!selectedCategory) return [];
    
    let meals = featuredMeals.filter(meal => meal.categoryId === selectedCategory);
    
    // Apply search filter
    if (searchQuery.trim()) {
      meals = meals.filter(meal => 
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply dietary filters
    const dietarySection = filterSections.find(s => s.id === 'dietary');
    if (dietarySection) {
      const vegSelected = dietarySection.options.find(o => o.id === 'veg')?.selected;
      const nonVegSelected = dietarySection.options.find(o => o.id === 'non-veg')?.selected;
      const veganSelected = dietarySection.options.find(o => o.id === 'vegan')?.selected;
      const glutenFreeSelected = dietarySection.options.find(o => o.id === 'gluten-free')?.selected;
      
      if (vegSelected) {
        meals = meals.filter(meal => meal.isVeg);
      }
      if (nonVegSelected) {
        meals = meals.filter(meal => !meal.isVeg);
      }
      if (veganSelected) {
        meals = meals.filter(meal => meal.tags.some(tag => tag.toLowerCase().includes('vegan')));
      }
      if (glutenFreeSelected) {
        meals = meals.filter(meal => meal.tags.some(tag => tag.toLowerCase().includes('gluten')));
      }
    }
    
    // Apply filter chips
    const vegChip = filterChips.find(c => c.id === 'veg')?.selected;
    const highProteinChip = filterChips.find(c => c.id === 'high-protein')?.selected;
    const under300Chip = filterChips.find(c => c.id === 'under-300')?.selected;
    const rating4Chip = filterChips.find(c => c.id === 'rating-4')?.selected;
    
    if (vegChip) {
      meals = meals.filter(meal => meal.isVeg);
    }
    if (highProteinChip) {
      meals = meals.filter(meal => meal.tags.some(tag => tag.toLowerCase().includes('protein')));
    }
    if (under300Chip) {
      meals = meals.filter(meal => meal.price < 300);
    }
    if (rating4Chip) {
      meals = meals.filter(meal => meal.rating >= 4.0);
    }
    
    // Apply price filters
    const priceSection = filterSections.find(s => s.id === 'price');
    if (priceSection) {
      const under200 = priceSection.options.find(o => o.id === 'under-200')?.selected;
      const range200400 = priceSection.options.find(o => o.id === '200-400')?.selected;
      const above400 = priceSection.options.find(o => o.id === 'above-400')?.selected;
      
      if (under200) {
        meals = meals.filter(meal => meal.price < 200);
      }
      if (range200400) {
        meals = meals.filter(meal => meal.price >= 200 && meal.price <= 400);
      }
      if (above400) {
        meals = meals.filter(meal => meal.price > 400);
      }
    }
    
    // Apply rating filters
    const ratingSection = filterSections.find(s => s.id === 'rating');
    if (ratingSection) {
      const rating4Plus = ratingSection.options.find(o => o.id === '4-plus')?.selected;
      const rating45Plus = ratingSection.options.find(o => o.id === '4.5-plus')?.selected;
      
      if (rating45Plus) {
        meals = meals.filter(meal => meal.rating >= 4.5);
      } else if (rating4Plus) {
        meals = meals.filter(meal => meal.rating >= 4.0);
      }
    }
    
    // Apply sorting
    const sortSection = filterSections.find(s => s.id === 'sort');
    if (sortSection) {
      const popularitySort = sortSection.options.find(o => o.id === 'popularity')?.selected;
      const priceLowSort = sortSection.options.find(o => o.id === 'price-low')?.selected;
      const priceHighSort = sortSection.options.find(o => o.id === 'price-high')?.selected;
      const ratingSort = sortSection.options.find(o => o.id === 'rating')?.selected;
      
      if (popularitySort) {
        meals = meals.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      } else if (priceLowSort) {
        meals = meals.sort((a, b) => a.price - b.price);
      } else if (priceHighSort) {
        meals = meals.sort((a, b) => b.price - a.price);
      } else if (ratingSort) {
        meals = meals.sort((a, b) => b.rating - a.rating);
      }
    }
    
    return meals;
  }, [selectedCategory, searchQuery, filterSections, filterChips]);

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.categoryImage} />
      <View style={styles.categoryContent}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMealGrid = ({ item }: { item: Meal }) => (
    <MealGridCard
      meal={item}
      onPress={() => handleMealPress(item.id)}
      onAddPress={() => handleAddMeal(item.id)}
    />
  );

  const renderMealList = ({ item }: { item: Meal }) => (
    <View style={styles.mealListItem}>
      <MealCard
        meal={item}
        onPress={() => handleMealPress(item.id)}
      />
    </View>
  );

  if (selectedCategory) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedCategory(null)}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {categories.find(c => c.id === selectedCategory)?.name}
          </Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
              onPress={() => setViewMode('grid')}
            >
              <Grid3X3 size={20} color={viewMode === 'grid' ? '#FF6B35' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              onPress={() => setViewMode('list')}
            >
              <List size={20} color={viewMode === 'list' ? '#FF6B35' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setShowFilterModal(true)}
          placeholder="Search meals..."
        />

        {/* Filter Chips */}
        <FilterChips
          filters={filterChips}
          onFilterToggle={handleFilterToggle}
          onClearAll={handleClearAllFilters}
        />

        {/* Meals List/Grid */}
        <FlatList
          data={filteredAndSortedMeals}
          renderItem={viewMode === 'grid' ? renderMealGrid : renderMealList}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.mealsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No meals found matching your criteria</Text>
            </View>
          }
        />

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          sections={filterSections}
          onOptionToggle={handleFilterOptionToggle}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.simpleHeader}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
        placeholder="Search categories..."
      />

      {/* Categories List */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        sections={filterSections}
        onOptionToggle={handleFilterOptionToggle}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
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
  simpleHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: 'white',
  },
  list: {
    padding: 20,
  },
  categoryItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  categoryContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  mealsList: {
    padding: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  mealListItem: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});