import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Home, ShoppingBag, Gift, SquareMenu } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/colors";
import { FlipCircle } from "@/components/FlipCircle";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 72;
const CENTER_BUTTON_RAISE = 18;

export default function TabLayout() {
  const { isAdmin, isKitchen, isDelivery } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
          paddingHorizontal: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.35 : 0.9,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarItemStyle: { paddingVertical: 6 },
        tabBarShowLabel: true,
      }}
    >
      {/* Always render all screens to avoid Android "addViewAt: child already has a parent" when auth toggles. Hide customer-only tabs via tabBarButton when not customer. */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin() ? "Dashboard" : isKitchen() ? "Kitchen" : isDelivery() ? "Delivery" : "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={focused ? 24 : 22} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, focused }) => (
            <SquareMenu color={color} size={focused ? 24 : 22} strokeWidth={2} />
          ),
          tabBarButton: isAdmin() || isKitchen() || isDelivery() ? () => null : undefined,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: () => <FlipCircle />,
          tabBarButton: (props) => {
            if (isAdmin() || isKitchen() || isDelivery()) return null;
            const { style, ...rest } = props;
            const safeProps = { ...rest } as any;
            return (
              <TouchableOpacity
                {...safeProps}
                style={[
                  style,
                  {
                    top: -CENTER_BUTTON_RAISE,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
                onPress={() => router.push("/help")}
                activeOpacity={0.8}
              />
            );
          },
        }}
      />

      <Tabs.Screen
        name="refer"
        options={{
          title: "Refer",
          tabBarIcon: ({ color, focused }) => (
            <Gift color={color} size={focused ? 24 : 22} strokeWidth={2} />
          ),
          tabBarButton: isAdmin() || isKitchen() || isDelivery() ? () => null : undefined,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag color={color} size={focused ? 24 : 22} strokeWidth={2} />
          ),
        }}
      />

      {/* Detection Tab */}
      {/* {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="detection"
          options={{
            title: "Detection",
            tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
          }}
        />
      )} */}

      {/* Addresses Tab */}
      {/* {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="addresses"
          options={{
            title: "Addresses",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
      )} */}

      {/* Right Tab 2 */}
     
    </Tabs>
  );
}
