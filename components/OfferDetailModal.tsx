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

interface OfferDetailModalProps {
  visible: boolean;
  offer: Offer | null;
  onClose: () => void;
  onUseOffer: (offer: Offer) => void;
}

export default function OfferDetailModal({ visible, offer, onClose, onUseOffer }: OfferDetailModalProps) {
  if (!offer) return null;

  const getOfferIcon = () => {
    switch (offer.offerType) {
      case 'cashback':
        return <Wallet size={24} color="#10B981" />;
      case 'deal':
        return <Gift size={24} color="#8B5CF6" />;
      default:
        return <Percent size={24} color="#FF6B35" />;
    }
  };

  const getOfferTypeColor = () => {
    switch (offer.offerType) {
      case 'cashback':
        return '#10B981';
      case 'deal':
        return '#8B5CF6';
      default:
        return '#FF6B35';
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {getOfferIcon()}
            <Text style={styles.headerTitle}>{getOfferTypeName()}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
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
          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.description}>{offer.description}</Text>

          {/* Long Description */}
          {offer.longDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Offer</Text>
              <Text style={styles.longDescription}>{offer.longDescription}</Text>
            </View>
          )}

          {/* Promo Code */}
          {offer.code && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Promo Code</Text>
              <View style={styles.promoCodeContainer}>
                <View style={styles.promoCodeBox}>
                  <Text style={styles.promoCode}>{offer.code}</Text>
                </View>
                <TouchableOpacity onPress={copyPromoCode} style={styles.copyButton}>
                  <Copy size={16} color="#FF6B35" />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Offer Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offer Details</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Clock size={16} color="#666" />
                <Text style={styles.statLabel}>Valid Until</Text>
                <Text style={styles.statValue}>{offer.validUntil}</Text>
              </View>
              {offer.usageLimit && (
                <View style={styles.statItem}>
                  <Users size={16} color="#666" />
                  <Text style={styles.statLabel}>Remaining Uses</Text>
                  <Text style={styles.statValue}>{remainingUses} left</Text>
                </View>
              )}
              {offer.minOrderAmount && (
                <View style={styles.statItem}>
                  <CheckCircle size={16} color="#666" />
                  <Text style={styles.statLabel}>Min Order</Text>
                  <Text style={styles.statValue}>₹{offer.minOrderAmount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Usage Progress */}
          {offer.usageLimit && (
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
          )}

          {/* Terms and Conditions */}
          {offer.terms && offer.terms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              {offer.terms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <Text style={styles.termBullet}>•</Text>
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleUseOffer} 
            style={[styles.useButton, { backgroundColor: getOfferTypeColor() }]}
          >
            <Text style={styles.useButtonText}>Use This Offer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  offerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  discountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  longDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCodeBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  promoCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  copyText: {
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    marginTop: 2,
  },
  termText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  useButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});