import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Copy,
  Gift,
  Wallet,
  Percent,
  Clock,
  ShieldCheck,
  Tag,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react-native';
import { Offer } from '@/types';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/colors';
import { FONT_SIZE } from '@/src/ui/typography';
import { RADIUS, SCREEN_PADDING, SPACING } from '@/src/ui/layout';
import { scale } from '@/src/ui/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OfferDetailModalProps {
  visible: boolean;
  offer: Offer | null;
  onClose: () => void;
  onUseOffer: (offer: Offer) => void;
}

export default function OfferDetailModal({ visible, offer, onClose, onUseOffer }: OfferDetailModalProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [copied, setCopied] = useState(false);
  const insets = useSafeAreaInsets();

  if (!offer) return null;

  /* ── helpers ── */
  const getBadgeGradient = (): [string, string] => {
    switch (offer.offerType) {
      case 'cashback': return ['#059669', '#047857'];
      case 'deal':     return [colors.primary, '#3730a3'];
      default:         return ['#E85D04', '#c2410c'];
    }
  };

  const getOfferIcon = (size = 18) => {
    switch (offer.offerType) {
      case 'cashback': return <Wallet size={size} color="#fff" />;
      case 'deal':     return <Gift size={size} color="#fff" />;
      default:         return <Percent size={size} color="#fff" />;
    }
  };

  const getOfferTypeName = () => {
    switch (offer.offerType) {
      case 'cashback': return 'Wallet Cashback';
      case 'deal':     return 'Special Deal';
      default:         return 'Discount Offer';
    }
  };

  const getDiscountLabel = () => {
    if (offer.discountType === 'percentage') return `${offer.discountValue}% OFF`;
    if (offer.discountType === 'cashback')   return `₹${offer.discountValue} Cashback`;
    return `₹${offer.discountValue} OFF`;
  };

  const copyPromoCode = async () => {
    if (!offer.code) return;
    try {
      if (Platform.OS !== 'web') {
        await Clipboard.setStringAsync(offer.code);
      } else {
        navigator.clipboard?.writeText(offer.code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copied!', `Code: ${offer.code}`);
    }
  };

  const badgeGradient = getBadgeGradient();
  const imageOverlay: [string, string, string] = isDark
    ? ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(15,15,26,0.92)']
    : ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.22)', 'rgba(255,255,255,0.96)'];

  const detailItems = [
    offer.validUntil && { icon: <Clock size={15} color={isDark ? '#a5b4fc' : colors.primary} />, label: 'Valid until', value: offer.validUntil },
    offer.minOrderAmount && { icon: <Tag size={15} color={isDark ? '#a5b4fc' : colors.primary} />, label: 'Min order', value: `₹${offer.minOrderAmount}` },
    offer.maxDiscount && { icon: <ShieldCheck size={15} color={isDark ? '#a5b4fc' : colors.primary} />, label: 'Max discount', value: `₹${offer.maxDiscount}` },
    offer.isNewUsersOnly && { icon: <CheckCircle2 size={15} color={isDark ? '#a5b4fc' : colors.primary} />, label: 'Eligibility', value: 'New users only' },
    offer.isOnePerUser && { icon: <CheckCircle2 size={15} color={isDark ? '#a5b4fc' : colors.primary} />, label: 'Usage', value: 'Once per user' },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>

        {/* ── Hero image ── */}
        <View style={styles.heroWrap}>
          <Image
            source={offer.image ? { uri: offer.image } : require('../assets/images/k.jpeg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient colors={imageOverlay} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

          {/* close btn */}
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.30)' }]}>
            <X size={18} color="#fff" />
          </TouchableOpacity>

          {/* type badge */}
          {/* <LinearGradient colors={badgeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.typeBadge}>
            {getOfferIcon(13)}
            <Text style={styles.typeBadgeText}>{getOfferTypeName().toUpperCase()}</Text>
          </LinearGradient> */}

          {/* discount label bottom-left */}
          <View style={styles.heroBottom}>
            <Text style={styles.discountHero}>{offer.discount ?? getDiscountLabel()}</Text>
          </View>
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* title */}
          <Text style={[styles.title, { color: colors.text }]}>{offer.title}</Text>

          {/* description */}
          {offer.description ? (
            <Text style={[styles.description, { color: colors.mutedText }]}>{offer.description}</Text>
          ) : null}

          {/* long description */}
          {offer.longDescription ? (
            <View style={[styles.infoBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#f8f7ff', borderColor: isDark ? 'rgba(123,122,212,0.2)' : 'rgba(72,71,155,0.10)' }]}>
              <Text style={[styles.infoBoxText, { color: colors.mutedText }]}>{offer.longDescription}</Text>
            </View>
          ) : null}

          {/* ── Coupon code section ── */}
          {offer.code ? (
            <>
              {/* perforated separator */}
              <View style={styles.perforated}>
                <View style={[styles.notch, styles.notchL, { backgroundColor: colors.background }]} />
                <View style={styles.dashedLine}>
                  {Array.from({ length: 22 }).map((_, i) => (
                    <View key={i} style={[styles.dash, { backgroundColor: isDark ? 'rgba(123,122,212,0.25)' : 'rgba(72,71,155,0.15)' }]} />
                  ))}
                </View>
                <View style={[styles.notch, styles.notchR, { backgroundColor: colors.background }]} />
              </View>

              <View style={styles.codeSection}>
                <Text style={[styles.codeSectionLabel, { color: colors.mutedText }]}>PROMO CODE</Text>
                <TouchableOpacity
                  onPress={copyPromoCode}
                  activeOpacity={0.8}
                  style={[
                    styles.codePill,
                    {
                      borderColor: isDark ? 'rgba(123,122,212,0.5)' : 'rgba(72,71,155,0.35)',
                      backgroundColor: isDark ? 'rgba(123,122,212,0.10)' : 'rgba(72,71,155,0.06)',
                    },
                  ]}
                >
                  <Text style={[styles.codeText, { color: isDark ? '#a5b4fc' : colors.primary }]}>
                    {offer.code}
                  </Text>
                  <LinearGradient
                    colors={badgeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.copyBtn}
                  >
                    {copied
                      ? <CheckCircle2 size={14} color="#fff" />
                      : <Copy size={14} color="#fff" />
                    }
                    <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={[styles.noCodeBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#f0fdf4', borderColor: colors.success }]}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={[styles.noCodeText, { color: colors.success }]}>No code needed — discount applied automatically</Text>
            </View>
          )}

          {/* ── Offer details ── */}
          {detailItems.length > 0 && (
            <View style={[styles.detailsCard, { backgroundColor: isDark ? colors.surfaceSecondary : colors.surface, borderColor: isDark ? 'rgba(123,122,212,0.15)' : colors.border }]}>
              {detailItems.map((item, i) => (
                <View key={i} style={[styles.detailRow, i < detailItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(123,122,212,0.10)' : colors.border }]}>
                  <View style={styles.detailLeft}>
                    {item.icon}
                    <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{item.label}</Text>
                  </View>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Terms ── */}
          {offer.terms && offer.terms.length > 0 && (
            <View style={styles.termsSection}>
              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>Terms & Conditions</Text>
              {offer.terms.map((term, i) => (
                <View key={i} style={styles.termRow}>
                  <View style={[styles.termDot, { backgroundColor: isDark ? '#a5b4fc' : colors.primary }]} />
                  <Text style={[styles.termText, { color: colors.mutedText }]}>{term}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* ── Fixed CTA ── */}
        <View style={[styles.ctaBar, { backgroundColor: colors.background, borderTopColor: isDark ? 'rgba(123,122,212,0.15)' : colors.border, paddingBottom: insets.bottom || SPACING.xl }]}>
          <TouchableOpacity
            onPress={offer.code ? copyPromoCode : () => { onUseOffer(offer); onClose(); }}
            activeOpacity={0.88}
            style={styles.ctaBtn}
          >
            <LinearGradient
              colors={badgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtnInner}
            >
              {offer.code
                ? <><Copy size={17} color="#fff" /><Text style={styles.ctaBtnText}>{copied ? 'Code Copied!' : 'Copy Code'}</Text></>
                : <><ChevronRight size={17} color="#fff" /><Text style={styles.ctaBtnText}>Use This Offer</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  /* hero */
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 16,
    left: SCREEN_PADDING,
  },
  discountHero: {
    color: '#fff',
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* body */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  description: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoBoxText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },

  /* perforated */
  perforated: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -SCREEN_PADDING,
    marginBottom: SPACING.md,
  },
  notch: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
  },
  notchL: { marginLeft: -scale(7) },
  notchR: { marginRight: -scale(7) },
  dashedLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  dash: {
    width: scale(7),
    height: 1.5,
    borderRadius: 1,
  },

  /* coupon code */
  codeSection: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  codeSectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    paddingLeft: SPACING.lg,
    paddingRight: 4,
    paddingVertical: 4,
    gap: SPACING.md,
    width: '100%',
    justifyContent: 'space-between',
  },
  codeText: {
    fontWeight: '800',
    fontSize: FONT_SIZE.xl,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  noCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  noCodeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  /* details card */
  detailsCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  /* terms */
  termsSection: {
    marginBottom: SPACING.xl,
  },
  termsSectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
    gap: 8,
  },
  termDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
  },
  termText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
    flex: 1,
  },

  /* CTA */
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
  ctaBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  ctaBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
