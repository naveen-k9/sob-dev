import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Testimonial } from '@/types';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: testimonial.image }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{testimonial.name}</Text>
          <Text style={styles.location}>{testimonial.location}</Text>
        </View>
        <View style={styles.rating}>
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} size={14} color="#FFB800" fill="#FFB800" />
          ))}
        </View>
      </View>
      <Text style={styles.comment}>{testimonial.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  rating: {
    flexDirection: 'row',
  },
  comment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});