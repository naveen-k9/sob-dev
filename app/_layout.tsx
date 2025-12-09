import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ActiveAddressProvider } from "@/contexts/ActiveAddressContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import SplashScreenComponent from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import OTAUpdater from "@/components/OTAUpdater";
import { seedIfEmpty } from "@/services/firebase";
import { StyleSheet } from "react-native";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getColors } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Theme-aware styling handled dynamically in components

function RootLayoutNav() {
  const { user, isLoading, isGuest } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasRedirected) {
      if (!user && !isGuest) {
        router.replace('/auth/login');
        setHasRedirected(true);
      } else if (user) {
        // Redirect to role-specific dashboard only once
        switch (user.role) {
          case 'admin':
            router.replace('/admin/dashboard');
            setHasRedirected(true);
            break;
          case 'kitchen':
            router.replace('/kitchen/dashboard');
            setHasRedirected(true);
            break;
          case 'delivery':
            router.replace('/delivery/dashboard');
            setHasRedirected(true);
            break;
          case 'customer':
            // Customer goes to main tabs - no redirect needed
            setHasRedirected(true);
            break;
        }
      }
    }
  }, [user, isGuest, isLoading, hasRedirected]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.primary },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.surface,
        headerTitleStyle: { color: colors.primary },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      {/* <Stack.Screen name="auth/role-selection" options={{ headerShown: false }} /> */}
      <Stack.Screen name="location/select" options={{ headerShown: false }} />
      <Stack.Screen name="meal/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin/subscriptions" options={{ headerShown: false }} />
      <Stack.Screen name="kitchen/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="delivery/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="support/ticket/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="support/create" options={{ headerShown: false }} />
      <Stack.Screen name="admin/support" options={{ headerShown: false }} />
      <Stack.Screen name="faqs" options={{ headerShown: false }} />
      <Stack.Screen name="corporate-catering" options={{ headerShown: false }} />
      <Stack.Screen name="nutritionist" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="acknowledgment/[orderId]" options={{ title: 'Delivery Acknowledgment' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const applySystemUI = async () => {
      try {
        console.log('[SystemUI] Setting transparent status bar background');
        await SystemUI.setBackgroundColorAsync('transparent');
      } catch (e) {
        console.log('[SystemUI] Failed to set background color', e);
      }
    };
    applySystemUI();
  }, []);

  useEffect(() => {
    seedIfEmpty().then((results) => {
      console.log('[seed] done', results);
    }).catch((e) => {
      console.log('[seed] failed', e);
    });
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp showSplash={showSplash} handleSplashFinish={handleSplashFinish} />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function ThemedApp({ showSplash, handleSplashFinish }: { showSplash: boolean; handleSplashFinish: () => void }) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  if (showSplash) {
    return <SplashScreenComponent onFinish={handleSplashFinish} />;
  }

  return (
    <>
      {/* 
        CENTRALIZED STATUS BAR STRATEGY:
        - Global StatusBar is set dynamically based on theme
        - This provides consistent behavior across all pages during navigation
        - Individual pages can override the StatusBar style if needed (like index page with focus isolation)
        - The translucent prop allows content to extend behind the status bar
        - SafeAreaProvider ensures all child components respect device safe areas
        
        SPECIAL CASES:
        - Index page: Uses translucent StatusBar with dynamic style (light/dark) based on scroll, only when focused
        - Other pages: Inherit the global StatusBar style based on theme
        - Focus isolation prevents index page StatusBar changes from affecting other pages
      */}
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <ActiveAddressProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
                <OTAUpdater />
                <RootLayoutNav />
              </GestureHandlerRootView>
            </ActiveAddressProvider>
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}