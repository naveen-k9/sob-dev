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
import { getColors } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, SPACING } from '@/src/ui/layout';
import { FONT_SIZE } from '@/src/ui/typography';
import { scale } from '@/src/ui/responsive';

interface OfferCardProps extends AccessibilityProps {
  offer: Offer;
  onPress?: () => void;
  onApply?: (code?: string) => void;
}

export default function OfferCard({ offer, onPress, onApply, accessibilityLabel }: OfferCardProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const getOfferIcon = () => {
    switch (offer.offerType) {
      case 'cashback':
        return <Wallet size={14} color={colors.surface} />;
      case 'deal':
        return <Gift size={14} color={colors.surface} />;
      default:
        return <Percent size={14} color={colors.surface} />;
    }
  };

  const getBadgeColor = () => {
    switch (offer.offerType) {
      case 'cashback':
        return colors.accent;
      case 'deal':
        return colors.primary;
      default:
        return colors.accent || colors.primary;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        pressed && styles.pressed,
      ]}
      accessibilityLabel={accessibilityLabel || `Offer: ${offer.title}`}
      accessibilityRole="button"
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.surfaceSecondary }]}>
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

        <Text numberOfLines={3} style={[styles.description, { color: colors.mutedText }]}>{offer.description}</Text>

        <View style={styles.bottomRow}>
          {offer.code ? (
            <View style={[styles.codePill, { backgroundColor: colors.accent || colors.primary }]}>
              <Text style={[styles.codeText, { color: colors.surface }]}>{offer.code}</Text>
            </View>
          ) : (
            <View style={[styles.infoPill, { borderColor: colors.border }]}>
              <Text style={[styles.infoText, { color: colors.mutedText }]}>No code needed</Text>
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
          <Text style={[styles.validity, { color: colors.mutedText }]}>Valid until {offer.validUntil}</Text>
        )}
        </View>

        
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    marginRight: SPACING.lg,
    width: scale(280),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
  },
  pressed: {
    transform: [{ scale: 0.998 }],
    opacity: 0.98,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 280 / 120,
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
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginLeft: 6,
  },
  content: {
    padding: SPACING.md,
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
    color: '#111827',
    marginRight: 8,
  },
  savingsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    marginLeft: 4,
    color: '#48479B',
    fontWeight: '700',
    fontSize: 12,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    fontWeight: '700',
    fontSize: FONT_SIZE.xs,
  },
  infoPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoText: {
    fontSize: FONT_SIZE.xs,
  },
  applyBtn: {
    backgroundColor: '#48479B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  validity: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
  },
});