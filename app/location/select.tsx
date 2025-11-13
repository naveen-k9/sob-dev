import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import LocationFlow from "@/components/LocationFlow";
import { Address } from "@/types";
import { useActiveAddress } from "@/contexts/ActiveAddressContext";

export default function LocationSelectScreen() {
  const { setActiveAddress } = useActiveAddress();
  const [showLocationFlow, setShowLocationFlow] = useState(true);

  const handleLocationSelected = (address: Address) => {
    setActiveAddress(address);
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LocationFlow
        visible={showLocationFlow}
        onClose={handleClose}
        onLocationSelected={handleLocationSelected}
        initialStep="select"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
