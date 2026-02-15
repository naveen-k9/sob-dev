import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View, Animated } from 'react-native';
import { Category } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/colors';

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  isActive?: boolean;
}

export default function CategoryCard({ category, onPress, isActive = false }: CategoryCardProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
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
    >
      <Animated.View 
        
      >
        <Image source={{ uri: category.image }} style={styles.image} />
      </Animated.View>
      <Text 
        style={[
          styles.name, 
          { color: colors.text },
          isActive && { color: colors.primary, fontWeight: '700' }
        ]} 
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 126,
    // marginRight: 9,
    marginLeft: 9,
    alignItems: 'center',
  },
  imageWrap: {
    padding: 0,
    borderRadius: 60,
    // marginBottom: 6,
  },
  imageWrapActive: {
    borderWidth: 3,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: 126,
    height: 90,
    borderRadius: 60,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
