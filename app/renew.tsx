import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import db from "@/db";

function getParamString(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

/**
 * Renew flow: open the meal page for the subscription's meal with sid in params.
 * The meal page will load the subscription and pre-fill plan, add-ons, weekType, and time slot.
 */
export default function RenewScreen() {
  const params = useLocalSearchParams<{ sid?: string }>();
  const sid = getParamString(params.sid);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    if (!sid) {
      setStatus("error");
      Alert.alert(
        "Invalid link",
        "Renew link is missing subscription ID.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const subscription = await db.getSubscriptionById(sid);
        if (cancelled) return;
        if (!subscription) {
          setStatus("error");
          Alert.alert(
            "Subscription not found",
            "This subscription could not be found. It may have been removed.",
            [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
          );
          return;
        }

        const meal = await db.getMealById(subscription.mealId);
        if (cancelled) return;
        if (!meal) {
          setStatus("error");
          Alert.alert(
            "Cannot renew",
            "This meal is no longer available.",
            [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
          );
          return;
        }

        if (cancelled) return;
        setStatus("done");
        router.replace({
          pathname: `/meal/${subscription.mealId}`,
          params: { sid },
        });
      } catch (e) {
        if (cancelled) return;
        console.error("Renew flow error:", e);
        setStatus("error");
        Alert.alert(
          "Error",
          "Something went wrong. Please try again.",
          [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sid]);

  return (
    <View style={styles.container}>
      {status === "loading" && (
        <>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.message}>Preparing renewal…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
});
