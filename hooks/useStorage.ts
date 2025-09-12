import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValue();
  }, []);

  const loadValue = async () => {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error loading value:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateValue = async (newValue: T) => {
    try {
      setValue(newValue);
      await AsyncStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving value:', error);
    }
  };

  return [value, updateValue, loading] as const;
}