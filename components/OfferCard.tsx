import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Pressable,
  AccessibilityProps,
} from 'react-native';
import { Gift, Wallet, Percent, Tag } from 'lucide-react-native';
import { Offer } from '@/types';
import { Colors } from '@/constants/colors';

interface OfferCardProps extends AccessibilityProps {
  offer: Offer;
  onPress?: () => void;
  onApply?: (code?: string) => void;
}

export default function OfferCard({ offer, onPress, onApply, accessibilityLabel }: OfferCardProps) {
  const getOfferIcon = () => {
    switch (offer.offerType) {
      case 'cashback':
        return <Wallet size={14} color={Colors.surface} />;
      case 'deal':
        return <Gift size={14} color={Colors.surface} />;
      default:
        return <Percent size={14} color={Colors.surface} />;
    }
  };

  const getBadgeColor = () => {
    switch (offer.offerType) {
      case 'cashback':
        return Colors.accent;
      case 'deal':
        return Colors.primary;
      default:
        return Colors.accent || Colors.primary;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityLabel={accessibilityLabel || `Offer: ${offer.title}`}
      accessibilityRole="button"
    >
      <View style={styles.imageWrap}>
        <Image
          source={offer.image ? { uri: offer.image } : require('../assets/images/k.jpeg')}
          style={styles.image}
        />
        <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
          {getOfferIcon()}
          <Text style={styles.badgeText}>{offer.offerType?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* <View style={styles.headerRow}>
          <Text numberOfLines={2} style={styles.title}>{offer.title}</Text>
          {offer.savings && (
            <View style={styles.savingsWrap}>
              <Tag size={12} color={Colors.primary} />
              <Text style={styles.savingsText}>{offer.savings}</Text>
            </View>
          )}
        </View> */}

        <Text numberOfLines={3} style={styles.description}>{offer.description}</Text>

        <View style={styles.bottomRow}>
          {offer.code ? (
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{offer.code}</Text>
            </View>
          ) : (
            <View style={styles.infoPill}>
              <Text style={styles.infoText}>No code needed</Text>
            </View>
          )}

          {/* <TouchableOpacity
            onPress={() => onApply?.(offer.code)}
            style={styles.applyBtn}
            accessibilityRole="button"
            accessibilityLabel={offer.code ? `Apply code ${offer.code}` : 'Apply offer'}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity> */}
          {offer.validUntil && (
          <Text style={styles.validity}>Valid until {offer.validUntil}</Text>
        )}
        </View>

        
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginRight: 16,
    width: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.998 }],
    opacity: 0.98,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 120,
    backgroundColor: Colors.accent || '#f2f2f2',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 8,
  },
  savingsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    marginLeft: 4,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  description: {
    fontSize: 13,
    color: Colors.mutedText,
    lineHeight: 18,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    backgroundColor: Colors.accent || Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  infoPill: {
    borderColor: Colors.border || '#e6e6e6',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoText: {
    color: Colors.mutedText,
    fontSize: 12,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  validity: {
    marginTop: 10,
    fontSize: 11,
    color: Colors.mutedText,
  },
});