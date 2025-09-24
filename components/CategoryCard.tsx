import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { Category } from '@/types';
import { Colors } from '@/constants/colors';

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  isActive?: boolean;
}

export default function CategoryCard({ category, onPress, isActive = false }: CategoryCardProps) {
  return (
    <TouchableOpacity style={[styles.container, isActive && styles.activeContainer]} onPress={onPress} testID={`cat-${category.id}`}>
      <View style={[styles.imageWrap, isActive && styles.imageWrapActive]}>
        <Image source={{ uri: category.image }} style={styles.image} />
      </View>
      <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>{category.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 110,
    marginRight: 12,
    alignItems: 'center',
  },
  activeContainer: {
    transform: [{ scale: 1.02 }],
  },
  imageWrap: {
    padding: 4,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.surface,
    marginBottom: 6,
  },
  imageWrapActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F7FF',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  nameActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});