import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Bell, X, Trash2, Clock, Package, Truck, Gift, ChevronRight } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import db from "@/db";
import { Notification } from "@/types";

const TYPE_CONFIG: Record<string, { color: string; bg: string; Icon: any }> = {
  order:    { color: "#48479B", bg: "#EEF2FF", Icon: Package },
  delivery: { color: "#E53935", bg: "#FEF2F2", Icon: Truck },
  promotion:{ color: "#8B5CF6", bg: "#F5F3FF", Icon: Gift },
  system:   { color: "#F59E0B", bg: "#FFFBEB", Icon: Bell },
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const list = await db.getNotifications(user.id);
      setNotifications(
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } catch (e) {
      console.error("Error loading notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user, loadNotifications]);

  const dismiss = async (id: string) => {
    await db.deleteNotification(id);
    setNotifications((p) => p.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    Alert.alert("Clear all notifications?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await db.clearUserNotifications(user?.id ?? "");
          setNotifications([]);
        },
      },
    ]);
  };

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const onPress = async (item: Notification) => {
    if (!item.isRead) {
      await db.markNotificationAsRead(item.id);
      setNotifications((p) => p.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    }
    const d = item.data as any;
    if (d?.screen) {
      router.push(d.screen);
    } else if (d?.status === "waiting_for_ack" && d?.orderId) {
      router.push({ pathname: "/acknowledgment/[orderId]", params: { orderId: d.orderId } });
    } else if (d?.subscriptionId && d?.dateString && d?.status === "waiting_for_ack") {
      router.push({
        pathname: "/acknowledgment/subscription/[subscriptionId]",
        params: { subscriptionId: d.subscriptionId, date: d.dateString },
      });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    const Icon = cfg.Icon;
    const isActionable =
      (item.data as any)?.screen ||
      ((item.data as any)?.status === "waiting_for_ack");

    return (
      <TouchableOpacity
        testID={`notification-${item.id}`}
        activeOpacity={0.75}
        onPress={() => onPress(item)}
        style={[styles.card, !item.isRead && styles.cardUnread]}
      >
        {!item.isRead && <View style={[styles.unreadBar, { backgroundColor: cfg.color }]} />}

        <View style={styles.cardInner}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Icon size={20} color={cfg.color} />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleBold]} numberOfLines={2}>
                {item.title}
              </Text>
              {isActionable && <ChevronRight size={16} color="#9CA3AF" />}
            </View>
            <Text style={styles.cardMsg} numberOfLines={3}>{item.message}</Text>
            <View style={styles.cardMeta}>
              <Clock size={11} color="#9CA3AF" />
              <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
              {!item.isRead && (
                <View style={[styles.dot, { backgroundColor: cfg.color }]} />
              )}
            </View>
          </View>

          <TouchableOpacity
            testID={`dismiss-${item.id}`}
            onPress={() => dismiss(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Trash2 size={16} color="#E53935" />
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Bell size={36} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptySub}>
            We'll notify you about orders, deliveries, and special offers.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },
  headerSub: { fontSize: 13, color: "#E53935", fontWeight: "600", marginTop: 2 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 5, padding: 8 },
  clearText: { fontSize: 13, color: "#E53935", fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardUnread: {
    backgroundColor: "#FFFBF8",
    elevation: 2,
    shadowOpacity: 0.08,
  },
  unreadBar: { height: 3, width: "100%" },
  cardInner: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  cardContent: { flex: 1, gap: 4 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 4 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "500", color: "#374151", lineHeight: 20 },
  cardTitleBold: { fontWeight: "700", color: "#111" },
  cardMsg: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardTime: { fontSize: 11, color: "#9CA3AF" },
  dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#F3F4F6",
    justifyContent: "center", alignItems: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  emptySub: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
});
