import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { User, UserRole, Address } from "@/types";
import db from "@/db";
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
  getUserDoc,
  signInWithCustomToken,
  clearAuthTokens,
} from "@/services/firebase";
import {
  sendWhatsAppOTPCallable,
  verifyWhatsAppOTPCallable,
  ensureUserProfileCallable,
} from "@/services/firebaseFunctions";
import { formatPhoneNumber } from "@/services/whatsappOTP";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const persistUserId = useCallback(async (id: string, phone?: string) => {
    await AsyncStorage.setItem("currentUser", JSON.stringify({ id, phone }));
    await AsyncStorage.removeItem("guestMode");
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("currentUser");
      const guestMode = await AsyncStorage.getItem("guestMode");

      if (userData) {
        const parsedUser = JSON.parse(userData);
        const dbUser = await db.getUserById(parsedUser.id);
        if (dbUser) {
          setUser(dbUser);
        } else {
          if (parsedUser.phone) {
            const byPhone = await db.getUserByPhone(parsedUser.phone);
            if (byPhone) {
              setUser(byPhone);
              await persistUserId(byPhone.id);
              return;
            }
          }
          const remote = await getUserDoc(parsedUser.id);
          if (remote) setUser(remote);
        }
      } else if (guestMode === "true") {
        setIsGuest(true);
      }
    } catch (error) {
      console.log("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }, [persistUserId]);

  const initializeAuth = useCallback(async () => {
    try {
      await db.initialize();
      await loadUser();
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      setIsLoading(false);
    }
  }, [loadUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = useCallback(
    async (
      phone: string,
      otp: string,
      role: UserRole = "customer",
      customToken?: string,
      userData?: any
    ) => {
      try {
        if (customToken && userData) {
          await signInWithCustomToken(customToken);

          const normalizedPhone =
            userData.phone || (phone.startsWith("+") ? phone : formatPhoneNumber(phone));
          const uid = userData.uid;

          // Ensure the canonical user profile exists (referralCode, wallet defaults, streak fields).
          await ensureUserProfileCallable({
            phone: normalizedPhone,
            role: userData.role || role,
          });

          // The backend already created users/{uid} in Firestore (awaited).
          // Use targeted single-doc fetch first, then local cache fallback.
          let user = await getUserDoc(uid);
          if (!user) {
            user = await db.getUserByPhone(normalizedPhone);
          }

          if (user) {
            // Doc exists in Firestore -- merge any updated fields
            const updatedUser = await db.updateUser(user.id, {
              name: userData.name || user.name,
              email: userData.email || user.email,
              phone: normalizedPhone,
              role: userData.role || user.role,
              addresses: userData.addresses ?? user.addresses,
              isActive: true,
            });
            if (updatedUser) user = updatedUser;
          } else {
            // Firestore doc not yet visible (unlikely since backend awaits set).
            // Create with the uid the backend chose so IDs stay in sync.
            user = await db.createUser({
              id: uid,
              name: userData.name || "",
              email: userData.email || "",
              phone: normalizedPhone,
              role: userData.role || role,
              addresses: userData.addresses || [],
              walletBalance: 500,
              isActive: true,
            });
          }

          await persistUserId(user.id, normalizedPhone);
          setUser(user);
          setIsGuest(false);
          return { success: true, user };
        }

        // Fallback to OTP verification (for testing)
        if (otp === "1234") {
          const normalizedPhone = phone.startsWith("+")
            ? phone
            : formatPhoneNumber(phone);
          let user = await db.getUserByPhone(normalizedPhone);

          if (!user) {
            user = await db.createUser({
              name: "",
              email: "",
              phone: normalizedPhone,
              role,
              addresses: [],
              walletBalance: 500,
              isActive: true,
            });
          }

          await persistUserId(user.id, normalizedPhone);
          setUser(user);
          setIsGuest(false);
          return { success: true, user };
        }
        return { success: false, error: "Invalid OTP" };
      } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Login failed" };
      }
    },
    [persistUserId]
  );

  /**
   * Send WhatsApp OTP for authentication (via Firebase callable; OTP generated server-side)
   */
  const sendWhatsAppOTPForAuth = useCallback(
    async (phone: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await sendWhatsAppOTPCallable(phone);
        if (result.success) return { success: true };
        return { success: false, error: result.error || "Failed to send OTP" };
      } catch (error: any) {
        console.error("Send WhatsApp OTP error:", error);
        return { success: false, error: error.message || "Failed to send OTP" };
      }
    },
    []
  );

  /**
   * Verify WhatsApp OTP and sign in with custom token (via Firebase callable).
   * Returns `isNewUser` so callers can decide whether to show onboarding.
   */
  const verifyWhatsAppOTP = useCallback(
    async (
      phone: string,
      otp: string,
      role: UserRole = "customer",
      _referralCode?: string
    ): Promise<{ success: boolean; user?: User; isNewUser?: boolean; error?: string }> => {
      try {
        const result = await verifyWhatsAppOTPCallable(phone, otp);
        if (!result.success || !result.verified) {
          return {
            success: false,
            error: result.error || "Verification failed",
          };
        }
        if (result.token && result.user) {
          const loginResult = await login(
            phone,
            otp,
            (result.user.role as UserRole) || role,
            result.token,
            result.user
          );
          return { ...loginResult, isNewUser: result.isNewUser };
        }
        return {
          success: false,
          error: result.error || "No token returned",
        };
      } catch (error: any) {
        console.error("Verify WhatsApp OTP error:", error);
        return {
          success: false,
          error: error.message || "Verification failed",
        };
      }
    },
    [login]
  );

  const emailSignIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { uid } = await signInWithEmailPassword(email, password);
        await ensureUserProfileCallable({ role: "customer" });
        const remote = await getUserDoc(uid);
        let finalUser: User | null = remote;
        if (!finalUser) {
          finalUser = await db.createUser({
            name: "",
            email,
            phone: "",
            role: "customer",
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
        return {
          success: false,
          error: "User not found after sign in",
        } as const;
      } catch (e: any) {
        console.log("Email sign-in error", e);
        return {
          success: false,
          error: e?.message ?? "Sign in failed",
        } as const;
      }
    },
    [persistUserId]
  );

  const emailSignUp = useCallback(
    async (params: {
      email: string;
      password: string;
      name?: string;
      role?: UserRole;
    }) => {
      try {
        const { uid } = await signUpWithEmailPassword(params);
        await ensureUserProfileCallable({ role: params.role ?? "customer" });
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
        return {
          success: false,
          error: "Failed to create user profile",
        } as const;
      } catch (e: any) {
        console.log("Email sign-up error", e);
        return {
          success: false,
          error: e?.message ?? "Sign up failed",
        } as const;
      }
    },
    [persistUserId]
  );

  const updateUser = useCallback(
    async (userData: Partial<User>) => {
      if (!user) return null;

      try {
        const updatedUser = await db.updateUser(user.id, userData);
        if (updatedUser) {
          setUser(updatedUser);
          await persistUserId(updatedUser.id);
        }
        return updatedUser;
      } catch (error) {
        console.error("Error updating user:", error);
        return null;
      }
    },
    [user, persistUserId]
  );

  const updateUserAddresses = useCallback(
    async (addresses: Address[]) => {
      if (!user) return null;

      try {
        const updatedUser = await db.updateUser(user.id, { addresses });
        if (updatedUser) {
          setUser(updatedUser);
          await persistUserId(updatedUser.id);
        }
        return updatedUser;
      } catch (error) {
        console.error("Error updating user addresses:", error);
        return null;
      }
    },
    [user, persistUserId]
  );

  const addAddress = useCallback(
    async (addressData: Omit<Address, "id" | "userId">) => {
      if (!user) {
        throw new Error("User must be logged in to add an address");
      }

      try {
        const newAddress = await db.addAddress(user.id, addressData);
        // Refresh user data to get updated addresses
        const updatedUser = await db.getUserById(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          await persistUserId(updatedUser.id);
        }
        return newAddress;
      } catch (error) {
        console.error("Error adding address:", error);
        throw error;
      }
    },
    [user, persistUserId]
  );

  const updateAddress = useCallback(
    async (addressId: string, updates: Partial<Address>) => {
      if (!user) {
        throw new Error("User must be logged in to update an address");
      }

      try {
        const updatedAddress = await db.updateAddress(
          user.id,
          addressId,
          updates
        );
        // Refresh user data
        const updatedUser = await db.getUserById(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          await persistUserId(updatedUser.id);
        }
        return updatedAddress;
      } catch (error) {
        console.error("Error updating address:", error);
        throw error;
      }
    },
    [user, persistUserId]
  );

  const deleteAddress = useCallback(
    async (addressId: string) => {
      if (!user) {
        throw new Error("User must be logged in to delete an address");
      }

      try {
        await db.deleteAddress(user.id, addressId);
        // Refresh user data
        const updatedUser = await db.getUserById(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          await persistUserId(updatedUser.id);
        }
      } catch (error) {
        console.error("Error deleting address:", error);
        throw error;
      }
    },
    [user, persistUserId]
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!user) {
        throw new Error("User must be logged in to set default address");
      }

      try {
        await db.setDefaultAddress(user.id, addressId);
        // Refresh user data
        const updatedUser = await db.getUserById(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          await persistUserId(updatedUser.id);
        }
      } catch (error) {
        console.error("Error setting default address:", error);
        throw error;
      }
    },
    [user, persistUserId]
  );

  const continueAsGuest = useCallback(async () => {
    try {
      await AsyncStorage.setItem("guestMode", "true");
      setIsGuest(true);
    } catch (error) {
      console.error("Error setting guest mode:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      clearAuthTokens();
      await AsyncStorage.removeItem("currentUser");
      await AsyncStorage.removeItem("guestMode");
      await AsyncStorage.removeItem("activeAddressId");
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error("Error during logout:", error);
      clearAuthTokens();
      setUser(null);
      setIsGuest(false);
    }
  }, []);

  const promptLogin = useCallback(() => {
    return !user && isGuest;
  }, [user, isGuest]);

  const hasRole = useCallback(
    (requiredRole: UserRole) => {
      return user?.role === requiredRole;
    },
    [user?.role]
  );

  const isAdmin = useCallback(() => hasRole("admin"), [hasRole]);
  const isKitchen = useCallback(() => hasRole("kitchen"), [hasRole]);
  const isDelivery = useCallback(() => hasRole("delivery"), [hasRole]);
  const isCustomer = useCallback(() => hasRole("customer"), [hasRole]);

  return useMemo(
    () => ({
      user,
      isLoading,
      isGuest,
      isAuthenticated: !!user,
      login,
      sendWhatsAppOTPForAuth,
      verifyWhatsAppOTP,
      emailSignIn,
      emailSignUp,
      validateReferralCode: db.getUserByReferralCode,
      updateUser,
      updateUserAddresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      continueAsGuest,
      logout,
      promptLogin,
      hasRole,
      isAdmin,
      isKitchen,
      isDelivery,
      isCustomer,
    }),
    [
      user,
      isLoading,
      isGuest,
      login,
      sendWhatsAppOTPForAuth,
      verifyWhatsAppOTP,
      emailSignIn,
      emailSignUp,
      updateUser,
      updateUserAddresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      continueAsGuest,
      logout,
      promptLogin,
      hasRole,
      isAdmin,
      isKitchen,
      isDelivery,
      isCustomer,
    ]
  );
});

export const useUserRole = () => {
  const { user, hasRole, isAdmin, isKitchen, isDelivery, isCustomer } =
    useAuth();
  return {
    userRole: user?.role,
    hasRole,
    isAdmin,
    isKitchen,
    isDelivery,
    isCustomer,
  };
};
