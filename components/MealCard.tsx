import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Leaf, Sparkles } from 'lucide-react-native';
import { Meal } from '@/types';
import { Colors } from '@/constants/colors';
import { router } from 'expo-router';

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
  onTryNow?: (meal: Meal) => void;
  onSubscribe?: (meal: Meal) => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function MealCard({ meal, onPress, onTryNow, onSubscribe }: MealCardProps) {
  const handleTryNow = useCallback(() => {
    if (onTryNow) {
      onTryNow(meal);
      return;
    }
    try {
      // Auto-select 2-day plan (planId: '1')
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
        params: { mode: 'subscribe', id: meal.id },
      });
    } catch (e) {
      console.error('[MealCard] Navigation error (Subscribe):', e);
    }
  }, [meal, onSubscribe]);

  const discountPercentage = meal.originalPrice 
    ? Math.round(((meal.originalPrice - meal.price) / meal.originalPrice) * 100)
    : 0;

  return (
    <View
      style={styles.container}
      testID={`meal-card-${meal.id}`}
    >
      {/* Image Container with Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.images[0] }} style={styles.image} />
        
        {/* Veg/Non-veg Badge */}
        <View style={styles.vegBadge}>
          <View style={[
            styles.vegIndicator,
            { borderColor: meal.isVeg ? '#16A34A' : '#DC2626' }
          ]}>
            <View style={[
              styles.vegDot,
              { backgroundColor: meal.isVeg ? '#16A34A' : '#DC2626' }
            ]} />
          </View>
        </View>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}

        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.name}
        </Text>

        {/* Price Container */}
        <View style={styles.priceRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.startingFrom}>Starting from</Text>
            <View style={styles.priceContainer}>
              
              {meal.originalPrice && (
                <Text style={styles.originalPrice}>₹{meal.originalPrice}</Text>
              )}
              <Text style={styles.price}>₹{meal.price}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.trialBtn}
            onPress={handleTryNow}
            testID={`try-now-${meal.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Try ${meal.name} for 2 days`}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.trialBtnText}>2-Day Trial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={handleSubscribe}
            testID={`subscribe-${meal.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Subscribe to ${meal.name}`}
            activeOpacity={0.8}
          >
            <Text style={styles.subscribeText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginRight: 16,
    marginBottom: 16,
    width: cardWidth,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  content: {
    padding: 10,
    paddingTop: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    marginBottom: 8,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startingFrom: {
    fontSize: 10,
    color: Colors.mutedText,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.mutedText,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  trialBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  trialBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 11,

  },
  subscribeBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  subscribeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  vegBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  discountText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
