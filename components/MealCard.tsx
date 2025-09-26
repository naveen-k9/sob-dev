import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Star, Leaf } from 'lucide-react-native';
import { Meal } from '@/types';
import { Colors } from '@/constants/colors';
import { router } from 'expo-router';

interface MealCardProps {
  meal: Meal;
  onPress: () => void;
  onTryNow?: (meal: Meal) => void;
  onSubscribe?: (meal: Meal) => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 50) / 2;

export default function MealCard({ meal, onPress, onTryNow, onSubscribe }: MealCardProps) {
  const handleTryNow = useCallback(() => {
    console.log('[MealCard] Try Now pressed', { mealId: meal.id });
    if (onTryNow) {
      onTryNow(meal);
      return;
    }
    try {
      router.push({
        pathname: '/meal/[id]',
        params: { mode: 'trial', planId: '1', id: meal.id },
      });
    } catch (e) {
      console.error('[MealCard] Navigation error (Try Now):', e);
    }
  }, [meal, onTryNow]);

  const handleSubscribe = useCallback(() => {
    console.log('[MealCard] Subscribe pressed', { mealId: meal.id });
    if (onSubscribe) {
      onSubscribe(meal);
      return;
    }
    try {
      router.push({
        pathname: '/meal/[id]',
        params: { mode: 'subscribe', planId: '2', id: meal.id },
      });
    } catch (e) {
      console.error('[MealCard] Navigation error (Subscribe):', e);
    }
  }, [meal, onSubscribe]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      testID={`meal-card-${meal.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${meal.name}`}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.images[0] }} style={styles.image} />
        {meal.isVeg && (
          <View style={styles.vegBadge}>
            <Leaf size={12} color="#4CAF50" />
          </View>
        )}
        {meal.originalPrice && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((meal.originalPrice - meal.price) / meal.originalPrice) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {meal.name}
          </Text>
          
        </View>

        {/* <Text style={styles.description} numberOfLines={2}>
          {meal.description}
        </Text> */}

        {/* <View style={styles.rating}>
          <Star size={14} color={Colors.primary} fill={Colors.primary} />
          <Text style={styles.ratingText}>
            {meal.rating} ({meal.reviewCount})
          </Text>
        </View> */}

        {/* <View style={styles.tags}>
          {meal.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View> */}

        <View style={styles.priceContainer}>
          <Text style={styles.startingFrom}>Starting from</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {meal.originalPrice && (
              <Text style={styles.originalPrice}>₹{meal.originalPrice}</Text>
            )}
            <Text style={styles.price}> ₹{meal.price}</Text>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.tryNowBtn}
            onPress={handleTryNow}
            testID={`try-now-${meal.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Try ${meal.name} now`}
          >
            <Text style={styles.tryNowText}>Try Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={handleSubscribe}
            testID={`subscribe-${meal.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Subscribe to ${meal.name}`}
          >
            <Text style={styles.subscribeText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginRight: 16,
     marginBottom: 16,
    width: cardWidth,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 117,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  content: {
    padding: 9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20,
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.mutedText,
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startingFrom: {
    fontSize: 12,
    color: Colors.mutedText,
    marginRight: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.mutedText,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12 as unknown as number,
    marginTop: 12,
  },
  tryNowBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },

  vegBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#48479B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
});