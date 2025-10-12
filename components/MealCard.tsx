import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Leaf } from 'lucide-react-native';
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

        {/* {meal.isVeg && (
          <View style={styles.vegBadge}>
            <Leaf size={12} color="#4CAF50" />
          </View>
        )} */}

        {/* {meal.originalPrice && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((meal.originalPrice - meal.price) / meal.originalPrice) * 100)}% OFF
            </Text>
          </View>
        )} */}

        {/* Floating Try Now button inside image */}
        <TouchableOpacity
          style={styles.tryNowInside}
          onPress={handleTryNow}
          testID={`try-now-${meal.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Try ${meal.name} now`}
        >
          <Text style={styles.tryNowInsideText}>2-Day Trial</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.name}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.startingFrom}>Starting from</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {meal.originalPrice && (
              <Text style={styles.originalPrice}>₹{meal.originalPrice}</Text>
            )}
            <Text style={styles.price}> ₹{meal.price}</Text>
          </View>
        </View>

        {/* Subscribe button below */}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  startingFrom: {
    fontSize: 12,
    color: Colors.mutedText,
    marginRight: 4,
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.mutedText,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  subscribeBtn: {
    backgroundColor: 'rgba(72, 72, 144, 1)',
    borderWidth: 2,
    borderColor: Colors.accent,
    paddingVertical: 9,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,

  },
  subscribeText: {
    color:'#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  vegBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
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
  tryNowInside: {
    position: 'absolute',
    top: 9,
    right: 9,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  tryNowInsideText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
