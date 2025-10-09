import { Tabs, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Home, ShoppingBag, Gift, SquareMenu, MapPin } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { FlipCircle } from "@/components/FlipCircle";

const styles = StyleSheet.create({
  scene: { backgroundColor: '#FFFFFF' },
  tabBar: { backgroundColor: '#FFFFFF', borderTopWidth: 0, height: 72, paddingTop: 9, paddingBottom: 9 },
  tabLabel: { fontSize: 12, fontWeight: '500' as const },
  centerTabButton: {
    top: -18, // makes it float above tab bar
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function TabLayout() {
  const { isAdmin, isKitchen, isDelivery } = useAuth();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor:  Colors.primary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* Left Tab 1 */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin() ? "Dashboard" : isKitchen() ? "Kitchen" : isDelivery() ? "Delivery" : "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      {/* Left Tab 2 */}
      {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color, size }) => <SquareMenu color={color} size={size} />,
          }}
        />
      )}

      {/* Center Tab (FlipCircle) */}
      {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="profile"
          options={{
            title: "",
            tabBarIcon: () => <FlipCircle />,
            tabBarButton: (props) => {
              const { style, ...rest } = props;

              // Remove problematic props like delayLongPress if null
              const safeProps = { ...rest } as any;

              return (
                <TouchableOpacity
                  {...safeProps}
                  style={[style, { top: 9, justifyContent: 'center', alignItems: 'center' }]}
                  onPress={() => router.push("/profile")}
                />
              );
            },
          }}
        />

      )}

      {/* Right Tab 1 */}
       {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="refer"
          options={{
            title: "Refer",
            tabBarIcon: ({ color, size }) => <Gift color={color} size={size} />,
          }}
        />
      )}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />

      {/* Detection Tab */}
      {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="detection"
          options={{
            title: "Detection",
            tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
          }}
        />
      )}

      {/* Addresses Tab */}
      {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="addresses"
          options={{
            title: "Addresses",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
      )}

      {/* Right Tab 2 */}
     
    </Tabs>
  );
}
