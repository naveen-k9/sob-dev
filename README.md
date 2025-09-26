# npx expo start --dev-client

# npx eas build -p android --profile preview --local

 {!isAdmin() && !isKitchen() && !isDelivery() && (
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      )}