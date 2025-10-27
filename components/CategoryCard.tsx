import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View, Animated } from 'react-native';
import { Category } from '@/types';
import { Colors } from '@/constants/colors';

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  isActive?: boolean;
}

export default function CategoryCard({ category, onPress, isActive = false }: CategoryCardProps) {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.05 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.7)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.05 : 1,
        useNativeDriver: true,
        friction: 6,
        tension: 40,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scaleAnim, opacityAnim]);
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      testID={`cat-${category.id}`}
      activeOpacity={0.7}
    >
      <Animated.View 
        style={[
          styles.imageWrap,
          isActive && styles.imageWrapActive,
          { 
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <Image source={{ uri: category.image }} style={styles.image} />
      </Animated.View>
      <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>{category.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 117,
    marginRight: 12,
    alignItems: 'center',
  },
  imageWrap: {
    padding: 4,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.surface,
    marginBottom: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F7FF',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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