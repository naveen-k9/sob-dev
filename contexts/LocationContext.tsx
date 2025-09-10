import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ServiceableLocation, LocationState } from '@/types';
import * as Location from 'expo-location';
import db from '@/db';

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

  // TODO: Implement polygon-based location checking when native maps are available
  // const isPointInPolygon = useCallback((point: { latitude: number; longitude: number }, polygon: { latitude: number; longitude: number }[]) => {
  //   const x = point.longitude;
  //   const y = point.latitude;
  //   let inside = false;

  //   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
  //     const xi = polygon[i].longitude;
  //     const yi = polygon[i].latitude;
  //     const xj = polygon[j].longitude;
  //     const yj = polygon[j].latitude;

  //     if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
  //       inside = !inside;
  //     }
  //   }

  //   return inside;
  // }, []);

  const loadServiceableLocations = useCallback(async () => {
    try {
      setError(null);
      const locations = await db.getActiveServiceableLocations();
      setServiceableLocations(locations);
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
      const locations = await db.getActiveServiceableLocations();
      
      for (const location of locations) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.coordinates.latitude,
          location.coordinates.longitude
        );

        if (distance <= location.radius) {
          setLocationState(prev => ({
            ...prev,
            selectedLocation: location,
            isLocationServiceable: true,
          }));
          return true;
        }
      }

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
    // isPointInPolygon, // TODO: Uncomment when native maps are available
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
    // isPointInPolygon, // TODO: Uncomment when native maps are available
  ]);
});