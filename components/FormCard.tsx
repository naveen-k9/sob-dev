import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { FONT_SIZE } from "@/src/ui/typography";
import { RADIUS, SCREEN_PADDING, SPACING } from "@/src/ui/layout";
import { scale } from "@/src/ui/responsive";

interface FormCardProps {
  title: string;
  description: string;
  subtitle?: string;
  gradientColors: [string, string, ...string[]];
  onPress: () => void;
}

export default function FormCard({
  title,
  description,
  subtitle,
  gradientColors,
  onPress,
}: FormCardProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.95 }}
        style={styles.gradient}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.header}>
            {subtitle ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            ) : (
              <View />
            )}
            {/* <View style={styles.iconCapsule}>
              <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.6} />
            </View> */}
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Explore</Text>
              <ArrowRight size={16} color={colors.primary} strokeWidth={2.7} />
            </View>
          </View>
        </View>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN_PADDING,
    marginVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  gradient: {
    minHeight: scale(128),
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: scale(128),
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: "68%",
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  iconCapsule: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: scale(18),
    lineHeight: scale(22),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: FONT_SIZE.xs,
    color: "rgba(255, 255, 255, 0.92)",
    lineHeight: scale(16),
    fontWeight: "500",
  },
  footer: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ctaText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: "#24245E",
    letterSpacing: 0.2,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -44,
    right: -28,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -18,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  decorativeCircle3: {
    position: "absolute",
    top: scale(42),
    right: scale(22),
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
});

