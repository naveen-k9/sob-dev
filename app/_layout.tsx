import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import SplashScreenComponent from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import OTAUpdater from "@/components/OTAUpdater";
import { seedIfEmpty } from "@/services/firebase";
import { StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  flex1: { flex: 1 },
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
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      contentStyle: { paddingTop: 44 } // Add space at top for camera/status bar
    }}>
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
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
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
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              <GestureHandlerRootView style={styles.flex1}>
                <OTAUpdater />
                <RootLayoutNav />
              </GestureHandlerRootView>
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}