import React, { memo } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { Category } from '@/types';

interface CategorySquareCardProps {
  category: Category;
  onPress: () => void;
}

function CategorySquareCard({ category, onPress }: CategorySquareCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} testID={`cat-square-${category.id}`}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: category.image }} style={styles.image} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

export default memo(CategorySquareCard);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
});