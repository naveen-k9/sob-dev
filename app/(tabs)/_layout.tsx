import { Tabs } from "expo-router";
import { Home, Grid3X3, ShoppingBag, User, Settings, ChefHat, Truck, BarChart3, Gift } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { user, isAdmin, isKitchen, isDelivery } = useAuth();

  const getTabColor = () => {
    if (isAdmin()) return '#8B5CF6';
    if (isKitchen()) return '#10B981';
    if (isDelivery()) return '#3B82F6';
    return '#FF6B35';
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: getTabColor(),
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
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
      
      {!isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="categories"
          options={{
            title: isAdmin() ? "Menu" : "Categories",
            tabBarIcon: ({ color, size }) => <Grid3X3 color={color} size={size} />,
          }}
        />
      )}
      
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
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