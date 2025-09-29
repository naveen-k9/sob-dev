import React, { memo } from 'react';
import { TouchableOpacity, ImageBackground, Text, StyleSheet } from 'react-native';
import { Category } from '@/types';

interface CategorySquareCardProps {
  category: Category;
  onPress: () => void;
}

function CategorySquareCard({ category, onPress }: CategorySquareCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      testID={`cat-rect-${category.id}`}
      activeOpacity={0.85}
    >
      <ImageBackground 
        source={{ uri: category.image }} 
        style={styles.image} 
        imageStyle={styles.imageRadius}
      >
        <Text style={styles.name} numberOfLines={2}>
          {category.name}
        </Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default memo(CategorySquareCard);

const styles = StyleSheet.create({
  container: {
    width: '48%',         // two cards per row
    height: 117,          // rectangle height
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
  },
  imageRadius: {
    borderRadius: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.4)', // makes text readable
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
});
