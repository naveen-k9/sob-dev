import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAsyncStorage } from '@/hooks/useStorage';
import { Address } from '@/types';

interface ActiveAddressContextType {
  activeAddress: Address | null;
  currentLocationAddress: Address | null;
  setActiveAddress: (address: Address | null) => void;
  setCurrentLocationAddress: (address: Address | null) => void;
  getDisplayAddress: () => Address | null;
  isAddressActive: (addressId: string) => boolean;
}

const ActiveAddressContext = createContext<ActiveAddressContextType | undefined>(undefined);

interface ActiveAddressProviderProps {
  children: ReactNode;
}

export const ActiveAddressProvider: React.FC<ActiveAddressProviderProps> = ({ children }) => {
  const [activeAddress, setActiveAddressState] = useState<Address | null>(null);
  const [currentLocationAddress, setCurrentLocationAddressState] = useState<Address | null>(null);
  const [addresses] = useAsyncStorage<Address[]>('addresses', []);

  // Load active address from storage on mount
  useEffect(() => {
    const loadActiveAddress = async () => {
      try {
        const activeAddressId = await AsyncStorage.getItem('activeAddressId');
        if (activeAddressId && addresses.length > 0) {
          const foundAddress = addresses.find(addr => addr.id === activeAddressId);
          if (foundAddress) {
            setActiveAddressState(foundAddress);
          }
        }
      } catch (error) {
        console.error('Error loading active address:', error);
      }
    };

    loadActiveAddress();
  }, [addresses]);

  const setActiveAddress = async (address: Address | null) => {
    setActiveAddressState(address);
    try {
      if (address) {
        await AsyncStorage.setItem('activeAddressId', address.id);
      } else {
        await AsyncStorage.removeItem('activeAddressId');
      }
    } catch (error) {
      console.error('Error saving active address:', error);
    }
  };

  const setCurrentLocationAddress = (address: Address | null) => {
    setCurrentLocationAddressState(address);
  };

  const getDisplayAddress = (): Address | null => {
    // Priority: Active address > Current location address
    return activeAddress || currentLocationAddress;
  };

  const isAddressActive = (addressId: string): boolean => {
    return activeAddress?.id === addressId;
  };

  const value: ActiveAddressContextType = {
    activeAddress,
    currentLocationAddress,
    setActiveAddress,
    setCurrentLocationAddress,
    getDisplayAddress,
    isAddressActive,
  };

  return (
    <ActiveAddressContext.Provider value={value}>
      {children}
    </ActiveAddressContext.Provider>
  );
};

export const useActiveAddress = (): ActiveAddressContextType => {
  const context = useContext(ActiveAddressContext);
  if (context === undefined) {
    throw new Error('useActiveAddress must be used within an ActiveAddressProvider');
  }
  return context;
};