import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import db from "@/db";
import { Notification } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  registerForPushNotificationsAsync,
  setupNotificationCategories,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from "@/services/pushNotifications";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [NotificationsProvider, useNotifications] = createContextHook(
  () => {
    const { user, updateUser } = useAuth();
    const [items, setItems] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [expoPushToken, setExpoPushToken] = useState<string>("");
    const [notificationPermission, setNotificationPermission] =
      useState<string>("");
    const lastShownRef = useRef<string>("0");
    const pollerRef = useRef<NodeJS.Timer | null>(null);
    const notificationListener = useRef<Notifications.Subscription | undefined>(
      undefined
    );
    const responseListener = useRef<Notifications.Subscription | undefined>(
      undefined
    );

    const load = useCallback(async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const list = await db.getNotifications(user.id);
        setItems(
          list.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (e) {
        console.log("Notifications load error", e);
      } finally {
        setIsLoading(false);
      }
    }, [user]);

    const maybeShowWebPush = useCallback((n: Notification) => {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        "Notification" in window
      ) {
        try {
          if (window.Notification.permission === "granted") {
            // eslint-disable-next-line no-new
            new window.Notification(n.title, { body: n.message });
          }
        } catch (err) {
          console.log("Web Notification failed", err);
        }
      }
    }, []);

    const checkNew = useCallback(async () => {
      if (!user) return;
      const list = await db.getNotifications(user.id);
      const sorted = list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      if (sorted.length === 0) return;
      const latest = sorted[sorted.length - 1];
      const lastId = lastShownRef.current;
      if (latest.id !== lastId) {
        lastShownRef.current = latest.id;
        setItems(sorted.reverse());
        maybeShowWebPush(latest);
        if (Platform.OS !== "web") {
          Alert.alert(latest.title, latest.message);
        }
      }
    }, [user, maybeShowWebPush]);

    const requestWebPermission = useCallback(async () => {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        "Notification" in window
      ) {
        try {
          if (window.Notification.permission === "default") {
            await window.Notification.requestPermission();
          }
        } catch (err) {
          console.log("Request permission failed", err);
        }
      }
    }, []);

    /**
     * Initialize push notifications
     */
    const initializePushNotifications = useCallback(async () => {
      if (Platform.OS === "web") {
        await requestWebPermission();
        return;
      }

      try {
        // Setup notification categories (iOS actions)
        await setupNotificationCategories();

        // Register for push notifications
        const token = await registerForPushNotificationsAsync();

        if (token) {
          setExpoPushToken(token);

          // Always save token if missing or changed
          if (user && (!user.pushToken || token !== user.pushToken)) {
            try {
              await updateUser({ pushToken: token });
              console.log("[PushNotif] Token saved for user:", user.id);
            } catch (e) {
              console.log("[PushNotif] Failed to save push token:", e);
            }
          }
        } else if (user && !user.pushToken) {
          // No token received – likely no permission. Request explicitly.
          try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === "granted") {
              const retryToken = await registerForPushNotificationsAsync();
              if (retryToken) {
                setExpoPushToken(retryToken);
                await updateUser({ pushToken: retryToken });
                console.log("[PushNotif] Token saved on retry for user:", user.id);
              }
            }
          } catch (e) {
            console.log("[PushNotif] Token retry failed:", e);
          }
        }

        // Get current permission status
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationPermission(status);

        // Listen for notifications received while app is open
        notificationListener.current = addNotificationReceivedListener(
          (notification) => {
            console.log("Notification received:", notification);
            // Reload notifications list
            load();
          }
        );

        // Listen for user tapping on notifications
        responseListener.current = addNotificationResponseListener(
          (response) => {
            console.log("Notification tapped:", response);

            const data = response.notification.request.content.data;

            if (data?.screen) {
              try {
                router.push(data.screen as any);
              } catch (navErr) {
                console.log("Push notification nav error:", navErr);
              }
            }
          }
        );
      } catch (error) {
        console.error("Push notification initialization error:", error);
      }
    }, [user, updateUser, load]);

    /**
     * Request notification permissions
     */
    const requestPermissions = useCallback(async () => {
      if (Platform.OS === "web") {
        return await requestWebPermission();
      }

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationPermission(status);

        if (status === "granted") {
          await initializePushNotifications();
        }

        return status;
      } catch (error) {
        console.error("Request permissions error:", error);
        return "error";
      }
    }, [initializePushNotifications, requestWebPermission]);

    useEffect(() => {
      if (!user) return;

      // Initialize push notifications
      initializePushNotifications();

      // Load notifications
      load();

      // Poll for new notifications
      if (pollerRef.current)
        clearInterval(pollerRef.current as unknown as number);
      pollerRef.current = setInterval(
        checkNew,
        15000
      ) as unknown as NodeJS.Timer;

      return () => {
        if (pollerRef.current)
          clearInterval(pollerRef.current as unknown as number);

        // Cleanup notification listeners
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }, [user, load, checkNew, initializePushNotifications]);

    const checkAckReminders = useCallback(async () => {
      if (!user) return;
      try {
        await db.checkAndFireDueReminders(user.id);
        await load();
      } catch (e) {
        console.log("checkAckReminders error", e);
      }
    }, [user, load]);

    useEffect(() => {
      if (!user) return;
      const t = setInterval(checkAckReminders, 30000);
      return () => clearInterval(t as unknown as number);
    }, [user, checkAckReminders]);

    const value = useMemo(
      () => ({
        items,
        isLoading,
        expoPushToken,
        notificationPermission,
        reload: load,
        requestPermissions,
        deleteOne: async (id: string) => {
          await db.deleteNotification(id);
          setItems((prev) => prev.filter((i) => i.id !== id));
        },
        clearAll: async () => {
          if (!user) return;
          await db.clearUserNotifications(user.id);
          setItems([]);
        },
      }),
      [
        items,
        isLoading,
        expoPushToken,
        notificationPermission,
        load,
        requestPermissions,
        user,
      ]
    );

    return value;
  }
);
