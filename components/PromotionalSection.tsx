import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Star, Clock, Truck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PromotionalItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  backgroundColor: string;
  textColor: string;
  icon?: string;
  actionType: 'category' | 'offer' | 'external' | 'meal';
  actionValue: string;
  size: 'large' | 'medium' | 'small';
  position: number;
}

interface PromotionalSectionProps {
  title: string;
  items: PromotionalItem[];
  onItemPress: (item: PromotionalItem) => void;
  backgroundColor?: string;
}

export default function PromotionalSection({
  title,
  items,
  onItemPress,
  backgroundColor = '#FFF8E1',
}: PromotionalSectionProps) {
  if (!items.length) return null;

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'gift':
        return <Gift size={20} color="#48479B" />;
      case 'star':
        return <Star size={20} color="#FFD700" />;
      case 'clock':
        return <Clock size={20} color="#10B981" />;
      case 'truck':
        return <Truck size={20} color="#8B5CF6" />;
      default:
        return null;
    }
  };

  const renderLargeItem = (item: PromotionalItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.largeItem, { backgroundColor: item.backgroundColor }]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[item.backgroundColor, `${item.backgroundColor}CC`]}
        style={styles.largeItemGradient}
      >
        <View style={styles.largeItemContent}>
          <View style={styles.largeItemText}>
            {item.icon && (
              <View style={styles.iconContainer}>
                {renderIcon(item.icon)}
              </View>
            )}
            <Text style={[styles.largeItemTitle, { color: item.textColor }]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.largeItemSubtitle, { color: item.textColor }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
          <Image source={{ uri: item.image }} style={styles.largeItemImage} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderMediumItem = (item: PromotionalItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.mediumItem, { backgroundColor: item.backgroundColor }]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.mediumItemImage} />
      <View style={styles.mediumItemOverlay}>
        <Text style={[styles.mediumItemTitle, { color: item.textColor }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.mediumItemSubtitle, { color: item.textColor }]}>
            {item.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSmallItem = (item: PromotionalItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.smallItem, { backgroundColor: item.backgroundColor }]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.smallItemImage} />
      <View style={styles.smallItemContent}>
        <Text style={[styles.smallItemTitle, { color: item.textColor }]}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const sortedItems = items.sort((a, b) => a.position - b.position);
  const largeItems = sortedItems.filter(item => item.size === 'large');
  const mediumItems = sortedItems.filter(item => item.size === 'medium');
  const smallItems = sortedItems.filter(item => item.size === 'small');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Large promotional banner */}
        {largeItems.length > 0 && (
          <View style={styles.largeItemContainer}>
            {largeItems[0] && renderLargeItem(largeItems[0])}
          </View>
        )}

        {/* Grid of medium and small items */}
        <View style={styles.gridContainer}>
          <View style={styles.topRow}>
            {mediumItems.slice(0, 2).map(renderMediumItem)}
          </View>
          <View style={styles.bottomRow}>
            {smallItems.slice(0, 3).map(renderSmallItem)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  largeItemContainer: {
    marginRight: 16,
  },
  largeItem: {
    width: width * 0.7,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  largeItemGradient: {
    flex: 1,
    padding: 16,
  },
  largeItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeItemText: {
    flex: 1,
  },
  iconContainer: {
    marginBottom: 8,
  },
  largeItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  largeItemSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  largeItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  gridContainer: {
    width: width * 0.6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediumItem: {
    width: (width * 0.6 - 8) / 2,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mediumItemImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mediumItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
  },
  mediumItemTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  mediumItemSubtitle: {
    fontSize: 10,
    opacity: 0.9,
  },
  smallItem: {
    width: (width * 0.6 - 16) / 3,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  smallItemImage: {
    width: '100%',
    height: '60%',
  },
  smallItemContent: {
    flex: 1,
    padding: 6,
    justifyContent: 'center',
  },
  smallItemTitle: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});