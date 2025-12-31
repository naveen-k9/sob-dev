import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ServiceableLocation, LocationState } from '@/types';
import * as Location from 'expo-location';
import { fetchServiceableLocations as fbFetchServiceableLocations } from '@/services/firebase';
import { isPointInPolygon } from '@/utils/polygonUtils';

export const [LocationProvider, useLocation] = createContextHook(() => {
  const [locationState, setLocationState] = useState<LocationState>({
    selectedLocation: null,
    userLocation: null,
    isLocationServiceable: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceableLocations, setServiceableLocations] = useState<ServiceableLocation[]>([]);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const loadServiceableLocations = useCallback(async () => {
    try {
      setError(null);
      // Fetch from Firebase
      const locations = await fbFetchServiceableLocations();
      // Filter to only active locations
      const activeLocations = locations.filter(loc => loc.isActive);
      setServiceableLocations(activeLocations);
      console.log('[LocationContext] Loaded', activeLocations.length, 'active serviceable locations from Firebase');
    } catch (error) {
      console.error('Error loading serviceable locations:', error);
      setError('Failed to load serviceable locations');
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to request location permission');
      return false;
    }
  }, []);

  const checkLocationServiceability = useCallback(async (userLocation: { latitude: number; longitude: number }) => {
    try {
      setError(null);
      // Fetch from Firebase
      const locations = await fbFetchServiceableLocations();
      const activeLocations = locations.filter(loc => loc.isActive);
      
      console.log('[LocationContext] Checking serviceability for:', userLocation);
      console.log('[LocationContext] Against', activeLocations.length, 'active locations');
      
      for (const location of activeLocations) {
        let isWithinArea = false;
        
        // Check polygon first if it exists
        if (location.polygon && location.polygon.length >= 3) {
          isWithinArea = isPointInPolygon(userLocation, location.polygon);
          console.log('[LocationContext] Polygon check for', location.name, ':', isWithinArea);
        } else {
          // Fall back to radius-based check
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            location.coordinates.latitude,
            location.coordinates.longitude
          );
          isWithinArea = distance <= location.radius;
          console.log('[LocationContext] Radius check for', location.name, '- distance:', distance, 'km, radius:', location.radius, 'km, within:', isWithinArea);
        }

        if (isWithinArea) {
          console.log('[LocationContext] Location is serviceable:', location.name);
          setLocationState(prev => ({
            ...prev,
            selectedLocation: location,
            isLocationServiceable: true,
          }));
          return true;
        }
      }

      console.log('[LocationContext] Location is NOT serviceable');
      setLocationState(prev => ({
        ...prev,
        selectedLocation: null,
        isLocationServiceable: false,
      }));
      return false;
    } catch (error) {
      console.error('Error checking location serviceability:', error);
      setError('Failed to check location serviceability');
      return false;
    }
  }, [calculateDistance]);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setLocationState(prev => ({
        ...prev,
        userLocation,
      }));

      await checkLocationServiceability(userLocation);
      return userLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Failed to get current location');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [requestLocationPermission, checkLocationServiceability]);

  const selectLocation = useCallback(async (location: ServiceableLocation) => {
    try {
      setError(null);
      setLocationState(prev => ({
        ...prev,
        selectedLocation: location,
        isLocationServiceable: true,
      }));
    } catch (error) {
      console.error('Error selecting location:', error);
      setError('Failed to select location');
    }
  }, []);

  useEffect(() => {
    loadServiceableLocations();
  }, [loadServiceableLocations]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    locationState,
    serviceableLocations,
    isLoading,
    error,
    loadServiceableLocations,
    getCurrentLocation,
    checkLocationServiceability,
    selectLocation,
    requestLocationPermission,
    clearError,
  }), [
    locationState,
    serviceableLocations,
    isLoading,
    error,
    loadServiceableLocations,
    getCurrentLocation,
    checkLocationServiceability,
    selectLocation,
    requestLocationPermission,
    clearError,
  ]);
});