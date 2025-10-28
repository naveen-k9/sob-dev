import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ActiveAddressProvider } from "@/contexts/ActiveAddressContext";
import SplashScreenComponent from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import OTAUpdater from "@/components/OTAUpdater";
import { seedIfEmpty } from "@/services/firebase";
import { StyleSheet } from "react-native";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const APP_BG = '#FFFFFF' as const;
const ACCENT = '#48489B' as const;

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: APP_BG },
  headerTitle: { color: ACCENT },
});

function RootLayoutNav() {
  const { user, isLoading, isGuest } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasRedirected) {
      if (!user && !isGuest) {
        router.replace('/auth/role-selection');
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
        contentStyle: { backgroundColor: ACCENT },
        headerStyle: { backgroundColor: APP_BG },
        headerTintColor: APP_BG,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/role-selection" options={{ headerShown: false }} />
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

  if (showSplash) {
    return <SplashScreenComponent onFinish={handleSplashFinish} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* 
          CENTRALIZED STATUS BAR STRATEGY:
          - Global StatusBar is set to 'dark' style by default with transparent background
          - This provides consistent behavior across all pages during navigation
          - Individual pages can override the StatusBar style if needed (like index page with focus isolation)
          - The translucent prop allows content to extend behind the status bar
          - SafeAreaProvider ensures all child components respect device safe areas
          
          SPECIAL CASES:
          - Index page: Uses translucent StatusBar with dynamic style (light/dark) based on scroll, only when focused
          - Other pages: Inherit the global dark StatusBar style for consistency
          - Focus isolation prevents index page StatusBar changes from affecting other pages
        */}
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        {/* <StatusBar style="auto"  /> */}
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <LocationProvider>
                <ActiveAddressProvider>
                  <GestureHandlerRootView style={styles.flex1}>
                    <OTAUpdater />
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </ActiveAddressProvider>
              </LocationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}