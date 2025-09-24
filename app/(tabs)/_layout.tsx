import { Tabs } from "expo-router";
import { StyleSheet } from 'react-native';
import { Home, Grid3X3, ShoppingBag, User, Settings, ChefHat, Truck, BarChart3, Gift } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";

const styles = StyleSheet.create({
  scene: { backgroundColor: '#FFFFFF' },
  tabBar: { backgroundColor: '#FFFFFF', borderTopWidth: 0, height: 81, paddingTop: 8, paddingBottom: 18 },
  tabLabel: { fontSize: 12, fontWeight: '500' as const },
});

export default function TabLayout() {
  const { user, isAdmin, isKitchen, isDelivery } = useAuth();

  const getTabColor = () => {
    if (isAdmin()) return Colors.primary;
    if (isKitchen()) return Colors.primary;
    if (isDelivery()) return Colors.primary;
    return Colors.primary;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: '#A3D397',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin() ? "Dashboard" : isKitchen() ? "Kitchen" : isDelivery() ? "Delivery" : "Home",
          tabBarIcon: ({ color, size }) => {
            if (isAdmin()) return <BarChart3 color={color} size={size} />;
            if (isKitchen()) return <ChefHat color={color} size={size} />;
            if (isDelivery()) return <Truck color={color} size={size} />;
            return <Home color={color} size={size} />;
          },
        }}
      />
      
      
      <Tabs.Screen
        name="orders"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      
      {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="refer"
          options={{
            title: "Refer",
            tabBarIcon: ({ color, size }) => <Gift color={color} size={size} />,
          }}
        />
      )}
      
      {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      )}
    </Tabs>
  );
}