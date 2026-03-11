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
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Wallet, Percent, Clock, Copy } from 'lucide-react-native';
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

  const getOfferIcon = (size = 13) => {
    switch (offer.offerType) {
      case 'cashback':
        return <Wallet size={size} color="#fff" />;
      case 'deal':
        return <Gift size={size} color="#fff" />;
      default:
        return <Percent size={size} color="#fff" />;
    }
  };

  const getBadgeColor = (): [string, string] => {
    switch (offer.offerType) {
      case 'cashback':
        return ['#059669', '#047857'];
      case 'deal':
        return [colors.primary, '#3730a3'];
      default:
        return ['#E85D04', '#c2410c'];
    }
  };

  const getDiscountLabel = () => {
    if (offer.discountType === 'percentage') return `${offer.discountValue}% OFF`;
    if (offer.discountType === 'cashback') return `₹${offer.discountValue} CASHBACK`;
    return `₹${offer.discountValue} OFF`;
  };

  const badgeGradient = getBadgeColor();

  const imageOverlayColors = isDark
    ? ['transparent', 'rgba(26,26,46,0.55)', colors.surface] as const
    : ['transparent', 'rgba(255,255,255,0.45)', colors.surface] as const;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(123,122,212,0.18)' : 'rgba(72,71,155,0.10)',
          shadowColor: isDark ? '#7B7AD4' : '#48479B',
        },
        pressed && styles.pressed,
      ]}
      accessibilityLabel={accessibilityLabel || `Offer: ${offer.title}`}
      accessibilityRole="button"
    >
      {/* ── Image + overlays ── */}
      <View style={styles.imageWrap}>
        <Image
          source={offer.image ? { uri: offer.image } : require('../assets/images/k.jpeg')}
          style={styles.image}
        />

        {/* gradient fade into card */}
        <LinearGradient
          colors={imageOverlayColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.45 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />

        {/* offer-type badge – top left */}
        <LinearGradient
          colors={badgeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.typeBadge}
        >
          {/* {getOfferIcon()} */}
          <Text style={styles.typeBadgeText}>{getDiscountLabel()}</Text>
        </LinearGradient>

        {/* discount bubble – top right */}
        {/* <LinearGradient
          colors={badgeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.discountBubble}
        >
          <Text style={styles.discountBubbleText}>{getDiscountLabel()}</Text>
        </LinearGradient> */}
      </View>

      {/* ── Text content ── */}
      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {offer.title}
        </Text>
        <Text numberOfLines={2} style={[styles.description, { color: colors.mutedText }]}>
          {offer.description}
        </Text>

        {/* ── Dashed separator ── */}
        <View style={styles.separatorRow}>
          <View style={[styles.notchLeft, { backgroundColor: colors.background }]} />
          <View style={styles.dashedLine}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View
                key={i}
                style={[styles.dashSegment, { backgroundColor: isDark ? 'rgba(123,122,212,0.3)' : 'rgba(72,71,155,0.18)' }]}
              />
            ))}
          </View>
          <View style={[styles.notchRight, { backgroundColor: colors.background }]} />
        </View>

        {/* ── Code row ── */}
        <View style={styles.codeRow}>
          {offer.code ? (
            <TouchableOpacity
              onPress={() => onApply?.(offer.code)}
              activeOpacity={0.75}
              style={[
                styles.codePill,
                {
                  borderColor: isDark ? 'rgba(123,122,212,0.45)' : 'rgba(72,71,155,0.30)',
                  backgroundColor: isDark ? 'rgba(123,122,212,0.10)' : 'rgba(72,71,155,0.06)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Copy code ${offer.code}`}
            >
              <Text style={[styles.codeText, { color: isDark ? '#a5b4fc' : colors.primary }]}>
                {offer.code}
              </Text>
              <Copy size={11} color={isDark ? '#a5b4fc' : colors.primary} style={styles.copyIcon} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.noCodePill, { borderColor: colors.border }]}>
              <Text style={[styles.noCodeText, { color: colors.mutedText }]}>No code needed</Text>
            </View>
          )}

          {offer.validUntil && (
            <View style={styles.validityRow}>
              <Clock size={10} color={colors.mutedText} />
              <Text style={[styles.validityText, { color: colors.mutedText }]}>
                {' '}{offer.validUntil}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    marginRight: SPACING.lg,
    width: scale(272),
    overflow: 'hidden',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.13,
    // shadowRadius: 14,
    // elevation: 6,
    borderWidth: 1,
  },
  pressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.95,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 272 / 90,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  typeBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  discountBubble: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: scale(90),
    height: scale(45),
    borderRadius: scale(23),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  discountBubbleText: {
    color: '#fff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: 6,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 16,
    marginBottom: 6,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -12,
    marginBottom: 5,
  },
  notchLeft: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    marginLeft: -scale(5),
  },
  notchRight: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    marginRight: -scale(5),
  },
  dashedLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  dashSegment: {
    width: scale(6),
    height: 1.5,
    borderRadius: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  codeText: {
    fontWeight: '800',
    fontSize: FONT_SIZE.sm,
    letterSpacing: 1.2,
  },
  copyIcon: {
    marginTop: 1,
  },
  noCodePill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noCodeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validityText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
