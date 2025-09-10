import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Play } from 'lucide-react-native';
import { Banner } from '@/types';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.28;

interface HeroBannerProps {
  banners: Banner[];
  onBannerPress?: (banner: Banner) => void;
}

export default function HeroBanner({ banners, onBannerPress }: HeroBannerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      if (banners.length > 1) {
        const nextIndex = (currentIndex + 1) % banners.length;
        
        // Animate transition
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, banners.length, fadeAnim]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, scaleAnim]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleBannerPress = (banner: Banner) => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onBannerPress?.(banner);
  };

  if (!banners.length) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        style={styles.scrollView}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity 
            key={banner.id} 
            style={styles.bannerContainer}
            onPress={() => handleBannerPress(banner)}
            activeOpacity={0.95}
          >
            <Image 
              source={{ uri: banner.image }} 
              style={styles.bannerImage}
              resizeMode="cover"
            />
            
            {/* Gradient Overlay */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(0,0,0,0.3)',
                'rgba(0,0,0,0.7)',
              ]}
              style={styles.gradientOverlay}
            />
            
            {/* Content */}
            <View style={styles.contentContainer}>
              <View style={styles.textContent}>
                <Text style={styles.title} numberOfLines={2}>
                  {banner.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {banner.subtitle}
                </Text>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleBannerPress(banner)}
                >
                  <Text style={styles.actionText}>Explore Now</Text>
                  <ChevronRight size={16} color="#FF6B35" />
                </TouchableOpacity>
              </View>
              
              {/* Play button for video banners */}
              {banner.actionType === 'external' && (
                <TouchableOpacity style={styles.playButton}>
                  <Play size={24} color="white" fill="white" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Enhanced Pagination */}
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  x: index * width,
                  animated: true,
                });
                setCurrentIndex(index);
              }}
            />
          ))}
        </View>
        
        {/* Banner counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {banners.length}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    marginBottom: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    width: width - 32,
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  textContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeDot: {
    backgroundColor: 'white',
    width: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  counter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});