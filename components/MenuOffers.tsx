// OfferCoupons.tsx
import { Colors } from "@/constants/colors";
import { Copy } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";

const { width } = Dimensions.get("window");

const offers = [
  {
    id: 1,
    code: "FIRSTMEAL",
    title: "Get your first meal free!",
    subText: "Use this code to enjoy your first meal on us.",
  },
  {
    id: 2,
    code: "SAVE100",
    title: "Save ₹100 instantly!",
    subText: "Apply this coupon and get ₹100 off your order.",
  },
  {
    id: 3,
    code: "SAVE500",
    title: "Big Savings: ₹500 OFF",
    subText: "Unlock ₹500 discount on your next subscription.",
  },
];

const CARD_WIDTH = Math.min(340, width * 0.45);
const HOLE_SIZE = 18;

export default function OfferCoupons() {
  // Clipboard support for both web and native
  const handleCopy = (code: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      alert('Coupon code copied!');
    } else {
      // Use react-native Clipboard
      try {
        // Dynamically import Clipboard to avoid issues on web
        import('react-native').then(RN => {
          if (RN.Clipboard && RN.Clipboard.setString) {
            RN.Clipboard.setString(code);
            alert('Coupon code copied!');
          }
        });
      } catch (e) { }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {offers.map((offer) => (
          <View key={offer.id} style={styles.couponModernWrap}>
            <View style={styles.couponModernCard}>
              {/* Coupon top: code area */}


              <View style={styles.couponCodePill}>
                <Text style={styles.couponCodeModern}>{offer.code}</Text>
                  <Text
                    style={styles.couponModernSubText}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {offer.subText}
                  </Text>
              </View>
              <Pressable
                style={styles.couponCopyBtnModern}
                onPress={() => handleCopy(offer.code)}
                android_ripple={{ color: Colors.accent }}
                accessibilityLabel={`Copy ${offer.code}`}
              >
                <Copy color="#fff" size={18} />
              </Pressable>


            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  couponModernWrap: {
    marginRight: 16,
    marginBottom: 8,
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  couponModernCard: {
    backgroundColor: '#fff',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    paddingVertical: 3,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    // minHeight: 63,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  couponCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  couponIconModern: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#59c3c3',
    backgroundColor: '#eaf4fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  couponIconInnerModern: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  couponCodePill: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    // backgroundColor:Colors.primary,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 9,
    color: Colors.primary,
    // marginRight: 8,
    // shadowColor: Colors.primary,
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.10,
    // shadowRadius: 2,
    // elevation: 2,
  },
  couponCodeModern: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
    marginRight: 8,
  },
  couponCopyBtnModern: {
    padding: 9,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: '#fff',
    marginLeft: 2,
  },
  couponModernTextBlock: {
    marginTop: 2,
    marginLeft: 2,
  },
  couponModernTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
    letterSpacing: 1.1,
  },
  couponModernSubText: {
    fontSize: 11,
    color: '#222',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    width: 120, // restrict width to force early break
    flexShrink: 1,
    flexWrap: 'wrap',
    // For web, force word-break
    ...(Platform.OS === 'web' ? { wordBreak: 'break-word' } : {}),
    },
  couponModernBtnWrap: {
    alignItems: 'flex-start',
  },
  couponModernBtn: {
    backgroundColor: '#59c3c3',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 2,
    shadowColor: '#59c3c3',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  couponModernBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1.1,
  },
  handDrawnCardWrap: {
    marginRight: 16,
    marginBottom: 8,
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  handDrawnCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    minHeight: 90,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  handDrawnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  handDrawnCode: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'cursive',
    marginRight: 8,
  },
  handDrawnIconWrap: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handDrawnIconOuter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handDrawnIconInner: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#59c3c3',
    backgroundColor: '#fff',
  },
  handDrawnCopyBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#eaf4fb',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginLeft: 2,
  },
  handDrawnTextBlock: {
    marginTop: 2,
    marginLeft: 2,
  },
  handDrawnSubText: {
    fontSize: 15,
    color: '#222',
    fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'cursive',
    marginBottom: 2,
  },
  couponCardWrap: {
    marginRight: 16,
    marginBottom: 8,
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#457b9d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
    paddingVertical: 16,
    paddingHorizontal: 18,
    width: '100%',
    minHeight: 110,
    justifyContent: 'center',
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  couponIconWrap: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#457b9d',
    backgroundColor: '#eaf4fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCodeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#457b9d',
    letterSpacing: 2,
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
  },
  copyBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#eaf4fb',
    borderWidth: 1,
    borderColor: '#457b9d',
    marginLeft: 2,
  },
  couponBody: {
    marginLeft: 42,
    marginTop: 2,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
    letterSpacing: 1.1,
  },
  couponSubText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  container: {
    backgroundColor: "#fff", // app bg
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  cardWrapper: {
    marginRight: 12,
    width: CARD_WIDTH,
    overflow: "visible",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff", // white coupon
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 90,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
  },
  leftSection: {
    width: "32%",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  couponCode: {
    fontSize: 26,
    fontWeight: "900",
    color: "#e63946",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-condensed",
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  copyIconBtn: {
    marginTop: 2,
    alignSelf: 'center',
    backgroundColor: '#f1faee',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e63946',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  copyIcon: {
    fontSize: 20,
    color: '#e63946',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
    letterSpacing: 1.1,
  },
  ctaBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#457b9d',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1.1,
  },
  perforationColumn: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  perforation: {
    width: 1,
    height: "70%",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 1,
  },
  rightSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  subText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  arrow: {
    fontSize: 22,
    color: "#333",
    marginRight: 12,
    fontWeight: "600",
  },

  hole: {
    position: "absolute",
    backgroundColor: "#f8f8f8", // match screen bg
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    zIndex: 2,
  },
  holeLeft: {
    left: -HOLE_SIZE / 2,
    top: "50%",
    marginTop: -HOLE_SIZE / 2,
  },
  holeRight: {
    right: -HOLE_SIZE / 2,
    top: "50%",
    marginTop: -HOLE_SIZE / 2,
  },
});
