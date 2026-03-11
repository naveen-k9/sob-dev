import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Testimonial } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/colors';
import { RADIUS, SPACING } from '@/src/ui/layout';
import { FONT_SIZE } from '@/src/ui/typography';
import { scale } from '@/src/ui/responsive';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <View style={styles.header}>
        <Image source={{ uri: testimonial.userImage }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{testimonial.userName}</Text>
          {/* <Text style={styles.location}>{testimonial.}</Text> */}
        </View>
        <View style={styles.rating}>
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} size={14} color="#FFB800" fill="#FFB800" />
          ))}
        </View>
      </View>
      <Text style={[styles.comment, { color: colors.mutedText }]}>{testimonial.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.lg,
    width: scale(300),
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: scale(40),
    aspectRatio: 1,
    borderRadius: scale(20),
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  rating: {
    flexDirection: 'row',
  },
  comment: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
});