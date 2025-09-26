import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Star, Leaf, Plus } from 'lucide-react-native';
import { Meal } from '@/types';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface MealGridCardProps {
  meal: Meal;
  onPress: () => void;
  onAddPress: () => void;
}

export default function MealGridCard({ meal, onPress, onAddPress }: MealGridCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
        <Text style={styles.name} numberOfLines={2}>
          {meal.name}
        </Text>
        
        {/* <View style={styles.rating}>
          <Star size={12} color="#FFB800" fill="#FFB800" />
          <Text style={styles.ratingText}>
            {meal.rating} ({meal.reviewCount})
          </Text>
        </View> */}
        <View style={styles.priceRow}>
            <Text style={styles.price}>₹{meal.price}</Text>
            {meal.originalPrice && (
              <Text style={styles.originalPrice}>₹{meal.originalPrice}</Text>
            )}
          </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Text style={[{color:'white'}]}>Try Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Text style={[{color:'white'}]}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: cardWidth,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 9
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48479B',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  addButton: {
    backgroundColor: '#48479B',
    borderRadius: 9,
    padding: 9,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#ffffff',
  },
});