import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface QuickCategory {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

interface QuickCategoriesProps {
  categories: QuickCategory[];
  onCategoryPress: (categoryId: string) => void;
}

export default function QuickCategories({ categories, onCategoryPress }: QuickCategoriesProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              category.selected && styles.selectedCategory
            ]}
            onPress={() => onCategoryPress(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              category.selected && styles.selectedCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    minWidth: 70,
  },
  selectedCategory: {
    backgroundColor: '#FF6B35',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: 'white',
  },
});