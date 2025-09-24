import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
} from 'react-native';
import { Gift, Wallet, Percent } from 'lucide-react-native';
import { Offer } from '@/types';
import { Colors } from '@/constants/colors';

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
}

export default function OfferCard({ offer, onPress }: OfferCardProps) {
  const getOfferIcon = () => {
    switch (offer.offerType) {
      case 'cashback':
        return <Wallet size={12} color={Colors.primary} />;
      case 'deal':
        return <Gift size={12} color={Colors.primary} />;
      default:
        return <Percent size={12} color={Colors.primary} />;
    }
  };

  const getOfferTypeColor = () => {
    switch (offer.offerType) {
      case 'cashback':
        return Colors.accent;
      case 'deal':
        return Colors.primary;
      default:
        return Colors.primary;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: offer.image }} style={styles.image} />
      <View style={styles.content}>
        <View style={[styles.discount, { backgroundColor: getOfferTypeColor() }]}>
          <Text style={styles.discountText}>{offer.discount}</Text>
        </View>
        <Text style={styles.title}>{offer.title}</Text>
        <Text style={styles.description}>{offer.description}</Text>
        {offer.code && (
          <View style={styles.codeContainer}>
            {getOfferIcon()}
            <Text style={styles.code}>{offer.code}</Text>
          </View>
        )}
        <Text style={styles.validity}>Valid until {offer.validUntil}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginRight: 16,
    width: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  discount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  code: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  validity: {
    fontSize: 10,
    color: Colors.mutedText,
  },
});