import React from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { X, Copy, Gift, Wallet, Percent, Clock, Users, CheckCircle } from 'lucide-react-native';
import { Offer } from '@/types';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/colors';
import { FONT_SIZE } from '@/src/ui/typography';
import { RADIUS, SCREEN_PADDING, SPACING } from '@/src/ui/layout';

interface OfferDetailModalProps {
  visible: boolean;
  offer: Offer | null;
  onClose: () => void;
  onUseOffer: (offer: Offer) => void;
}

export default function OfferDetailModal({ visible, offer, onClose, onUseOffer }: OfferDetailModalProps) {
  if (!offer) return null;
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const getOfferIcon = () => {
    switch (offer.offerType) {
      case 'cashback':
        return <Wallet size={24} color={colors.success} />;
      case 'deal':
        return <Gift size={24} color={colors.primary} />;
      default:
        return <Percent size={24} color={colors.primary} />;
    }
  };

  const getOfferTypeColor = () => {
    switch (offer.offerType) {
      case 'cashback':
        return colors.success;
      case 'deal':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const getOfferTypeName = () => {
    switch (offer.offerType) {
      case 'cashback':
        return 'Wallet Cashback';
      case 'deal':
        return 'Special Deal';
      default:
        return 'Discount Offer';
    }
  };

  const copyPromoCode = async () => {
    if (offer.code) {
      if (Platform.OS !== 'web') {
        await Clipboard.setStringAsync(offer.code);
      } else {
        // Web fallback
        navigator.clipboard?.writeText(offer.code);
      }
      Alert.alert('Copied!', `Promo code ${offer.code} copied to clipboard`);
    }
  };

  const handleUseOffer = () => {
    onUseOffer(offer);
    onClose();
  };

  const usagePercentage = offer.usageLimit ? (offer.usedCount / offer.usageLimit) * 100 : 0;
  const remainingUses = offer.usageLimit ? offer.usageLimit - offer.usedCount : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            {getOfferIcon()}
            <Text style={[styles.headerTitle, { color: colors.text }]}>{getOfferTypeName()}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Offer Image */}
          <Image source={{ uri: offer.image }} style={styles.offerImage} />

          {/* Discount Badge */}
          <View style={[styles.discountBadge, { backgroundColor: getOfferTypeColor() }]}>
            <Text style={styles.discountText}>{offer.discount}</Text>
          </View>

          {/* Title and Description */}
          <Text style={[styles.title, { color: colors.text }]}>{offer.title}</Text>
          <Text style={[styles.description, { color: colors.mutedText }]}>{offer.description}</Text>

          {/* Long Description */}
          {offer.longDescription && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Offer</Text>
              <Text style={[styles.longDescription, { color: colors.mutedText }]}>{offer.longDescription}</Text>
            </View>
          )}

          {/* Promo Code */}
          {offer.code && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Promo Code</Text>
              <View style={styles.promoCodeContainer}>
                <View style={[styles.promoCodeBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.promoCode, { color: colors.text }]}>{offer.code}</Text>
                </View>
                <TouchableOpacity onPress={copyPromoCode} style={[styles.copyButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
                  <Copy size={16} color={colors.primary} />
                  <Text style={[styles.copyText, { color: colors.primary }]}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Offer Stats */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Offer Details</Text>
            <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.statItem}>
                <Clock size={16} color={colors.mutedText} />
                <Text style={[styles.statLabel, { color: colors.mutedText }]}>Valid Until</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{offer.validUntil}</Text>
              </View>
              {/* {offer.usageLimit && (
                <View style={styles.statItem}>
                  <Users size={16} color="#666" />
                  <Text style={styles.statLabel}>Remaining Uses</Text>
                  <Text style={styles.statValue}>{remainingUses} left</Text>
                </View>
              )} */}
              {offer.minOrderAmount && (
                <View style={styles.statItem}>
                  <CheckCircle size={16} color={colors.mutedText} />
                  <Text style={[styles.statLabel, { color: colors.mutedText }]}>Min Order</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>₹{offer.minOrderAmount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Usage Progress */}
          {/* {offer.usageLimit && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offer Usage</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(usagePercentage, 100)}%`,
                        backgroundColor: getOfferTypeColor()
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {offer.usedCount} of {offer.usageLimit} used
                </Text>
              </View>
            </View>
          )} */}

          {/* Terms and Conditions */}
          {offer.terms && offer.terms.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Terms & Conditions</Text>
              {offer.terms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <Text style={[styles.termBullet, { color: colors.mutedText }]}>•</Text>
                  <Text style={[styles.termText, { color: colors.mutedText }]}>{term}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.cancelButtonText, { color: colors.mutedText }]}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={copyPromoCode} 
            style={[styles.useButton, { backgroundColor: getOfferTypeColor() }]}
          >
            <Text style={styles.useButtonText}>{offer.code ? 'Copy Code' : 'Use Offer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
  },
  offerImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  discountText: {
    color: 'white',
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZE.display,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  longDescription: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCodeBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  promoCode: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  copyText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    borderRadius: RADIUS.md,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: FONT_SIZE.md,
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  termBullet: {
    fontSize: FONT_SIZE.md,
    marginRight: 8,
    marginTop: 2,
  },
  termText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  useButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: 'white',
  },
});