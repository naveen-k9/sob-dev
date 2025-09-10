import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, Address } from '@/types';
import db from '@/db';
import { signInWithEmailPassword, signUpWithEmailPassword, getUserDoc, createUser as fbCreateUser } from '@/services/firebase';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const persistUserId = useCallback(async (id: string) => {
    await AsyncStorage.setItem('currentUser', JSON.stringify({ id }));
    await AsyncStorage.removeItem('guestMode');
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      const guestMode = await AsyncStorage.getItem('guestMode');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const dbUser = await db.getUserById(parsedUser.id);
        if (dbUser) {
          setUser(dbUser);
        } else {
          const remote = await getUserDoc(parsedUser.id);
          if (remote) setUser(remote);
        }
      } else if (guestMode === 'true') {
        setIsGuest(true);
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      await db.initialize();
      await loadUser();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setIsLoading(false);
    }
  }, [loadUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);





  const login = useCallback(async (phone: string, otp: string, role: UserRole = 'customer', referralCode?: string) => {
    try {
      if (otp === '1234') {
        let user = await db.getUserByPhone(phone);
        
        if (!user) {
          user = await db.createUser({
            name: '',
            email: '',
            phone,
            role,
            addresses: [],
            walletBalance: 500,
            isActive: true,
            referredBy: referralCode,
          });
        }
        
        await persistUserId(user.id);
        setUser(user);
        setIsGuest(false);
        return { success: true, user };
      }
      return { success: false, error: 'Invalid OTP' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const emailSignIn = useCallback(async (email: string, password: string) => {
    try {
      const { uid } = await signInWithEmailPassword(email, password);
      const remote = await getUserDoc(uid);
      let finalUser: User | null = remote;
      if (!finalUser) {
        finalUser = await db.createUser({
          name: '',
          email,
          phone: '',
          role: 'customer',
          addresses: [],
          walletBalance: 500,
          isActive: true,
        });
      }
      if (finalUser) {
        await persistUserId(finalUser.id);
        setUser(finalUser);
        setIsGuest(false);
        return { success: true, user: finalUser } as const;
      }
      return { success: false, error: 'User not found after sign in' } as const;
    } catch (e: any) {
      console.log('Email sign-in error', e);
      return { success: false, error: e?.message ?? 'Sign in failed' } as const;
    }
  }, [persistUserId]);

  const emailSignUp = useCallback(async (params: { email: string; password: string; name?: string; role?: UserRole }) => {
    try {
      const { uid } = await signUpWithEmailPassword(params);
      const created = await getUserDoc(uid);
      if (created) {
        await persistUserId(created.id);
        setUser(created);
        setIsGuest(false);
        return { success: true, user: created } as const;
      }
      const fallback = await db.getUserById(uid);
      if (fallback) {
        await persistUserId(fallback.id);
        setUser(fallback);
        setIsGuest(false);
        return { success: true, user: fallback } as const;
      }
      return { success: false, error: 'Failed to create user profile' } as const;
    } catch (e: any) {
      console.log('Email sign-up error', e);
      return { success: false, error: e?.message ?? 'Sign up failed' } as const;
    }
  }, [persistUserId]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return null;
    
    try {
      const updatedUser = await db.updateUser(user.id, userData);
      if (updatedUser) {
        setUser(updatedUser);
        await persistUserId(updatedUser.id);
      }
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }, [user]);

  const updateUserAddresses = useCallback(async (addresses: Address[]) => {
    if (!user) return null;
    
    try {
      const updatedUser = await db.updateUser(user.id, { addresses });
      if (updatedUser) {
        setUser(updatedUser);
        await persistUserId(updatedUser.id);
      }
      return updatedUser;
    } catch (error) {
      console.error('Error updating user addresses:', error);
      return null;
    }
  }, [user]);

  const continueAsGuest = useCallback(async () => {
    try {
      await AsyncStorage.setItem('guestMode', 'true');
      setIsGuest(true);
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('guestMode');
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear state even if AsyncStorage fails
      setUser(null);
      setIsGuest(false);
    }
  }, []);

  const promptLogin = useCallback(() => {
    return !user && isGuest;
  }, [user, isGuest]);

  const hasRole = useCallback((requiredRole: UserRole) => {
    return user?.role === requiredRole;
  }, [user?.role]);

  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isKitchen = useCallback(() => hasRole('kitchen'), [hasRole]);
  const isDelivery = useCallback(() => hasRole('delivery'), [hasRole]);
  const isCustomer = useCallback(() => hasRole('customer'), [hasRole]);

  return useMemo(() => ({
    user,
    isLoading,
    isGuest,
    isAuthenticated: !!user,
    login,
    emailSignIn,
    emailSignUp,
    validateReferralCode: db.getUserByReferralCode,
    updateUser,
    updateUserAddresses,
    continueAsGuest,
    logout,
    promptLogin,
    hasRole,
    isAdmin,
    isKitchen,
    isDelivery,
    isCustomer,
  }), [user, isLoading, isGuest, login, emailSignIn, emailSignUp, updateUser, updateUserAddresses, continueAsGuest, logout, promptLogin, hasRole, isAdmin, isKitchen, isDelivery, isCustomer]);
});

export const useUserRole = () => {
  const { user, hasRole, isAdmin, isKitchen, isDelivery, isCustomer } = useAuth();
  return {
    userRole: user?.role,
    hasRole,
    isAdmin,
    isKitchen,
    isDelivery,
    isCustomer,
  };
};