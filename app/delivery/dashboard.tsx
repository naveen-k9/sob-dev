import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  PanResponder,
  Animated,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import RoleSelector from "@/components/RoleSelector";
import db from "@/db";
import { Subscription, User, Meal, Address } from "@/types";
import { isActivePlanDate } from "@/utils/subscriptionDateUtils";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Package,
  Navigation,
  LogOut,
  RefreshCw,
  AlertCircle,
} from "lucide-react-native";

interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  mealName: string;
  quantity: number;
  deliveryTime: string;
  status:
    | "packaging"
    | "packaging_done"
    | "delivery_started"
    | "reached"
    | "delivery_done";
  specialInstructions?: string;
  orderValue: number;
  paymentStatus: "paid" | "pending";
}

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);

  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: "₹0",
  });

  const recalcStats = useCallback((orders: DeliveryOrder[]) => {
    const pending = orders.filter((o) => o.status !== "delivery_done").length;
    const completed = orders.filter((o) => o.status === "delivery_done").length;
    const total = orders.length;
    const earnings = orders.reduce(
      (sum, o) => sum + (typeof o.orderValue === "number" ? o.orderValue : 0),
      0
    );
    setStats({
      totalDeliveries: total,
      pendingDeliveries: pending,
      completedDeliveries: completed,
      totalEarnings: `₹${earnings}`,
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadFromFirestore = useCallback(async () => {
    try {
      setRefreshing(true);
      const [subs, users, meals] = await Promise.all([
        db.getSubscriptions(),
        db.getUsers(),
        db.getMeals(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const mealsById = new Map<string, Meal>();
      meals.forEach((m) => mealsById.set(m.id, m));

      const orders: DeliveryOrder[] = subs
        .filter((s: Subscription) => s.status === "active" && isActivePlanDate(today, s))
        .map((s: Subscription) => {
          const u: User | undefined = users.find((us) => us.id === s.userId);
          const m = mealsById.get(s.mealId);
          const addr =
            u?.addresses?.find?.((a: Address) => a.id === s.addressId) ||
            u?.addresses?.[0];
          const storedDeliveryStatus = s.deliveryStatusByDate?.[todayStr];
          const status =
            storedDeliveryStatus &&
            ["packaging", "packaging_done", "delivery_started", "reached", "delivery_done"].includes(
              storedDeliveryStatus
            )
              ? (storedDeliveryStatus as DeliveryOrder["status"])
              : "packaging";
          return {
            id: s.id,
            customerName: u?.name ?? "Customer",
            customerPhone: u?.phone ?? "",
            address: addr
              ? `${addr.addressLine}, ${addr.city} - ${addr.pincode}`
              : "N/A",
            mealName: m?.name ?? `Meal #${s.mealId}`,
            quantity: 1,
            deliveryTime: s.deliveryTime || s.deliveryTimeSlot || "—",
            status,
            specialInstructions: s.specialInstructions,
            orderValue: s.totalAmount / (s.totalDeliveries || 1),
            paymentStatus:
              (s.paidAmount ?? 0) >= s.totalAmount ? "paid" : "pending",
          };
        });

      setDeliveryOrders(orders);
      recalcStats(orders);
    } catch (e) {
      console.log("[delivery] loadFromFirestore error", e);
      Alert.alert("Error", "Failed to load delivery data");
    } finally {
      setRefreshing(false);
    }
  }, [recalcStats]);

  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]);

  const onRefresh = async () => {
    await loadFromFirestore();
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: DeliveryOrder["status"]
  ) => {
    setDeliveryOrders((prev) => {
      const next = prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      recalcStats(next);
      return next;
    });
  };

  const handleStatusUpdate = (
    orderId: string,
    currentStatus: DeliveryOrder["status"]
  ) => {
    console.log("[delivery] handleStatusUpdate", { orderId, currentStatus });
    let nextStatus: DeliveryOrder["status"] | undefined;
    let alertTitle = "";
    let alertMessage = "";

    switch (currentStatus) {
      case "packaging":
        nextStatus = "packaging_done";
        alertTitle = "Packaging Done";
        alertMessage = "Mark this order as packaging done?";
        break;
      case "packaging_done":
        nextStatus = "delivery_started";
        alertTitle = "Delivery Started";
        alertMessage = "Confirm that you have started delivery?";
        break;
      case "delivery_started":
        nextStatus = "reached";
        alertTitle = "Reached Destination";
        alertMessage = "Confirm that you have reached the customer location?";
        break;
      case "reached":
        nextStatus = "delivery_done";
        alertTitle = "Delivery Done";
        alertMessage = "Confirm delivery completion?";
        break;
      default:
        nextStatus = undefined;
    }

    if (!nextStatus) return;

    Alert.alert(alertTitle, alertMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          const todayStr = new Date().toISOString().split("T")[0];
          try {
            await db.updateSubscriptionDeliveryStatus(
              orderId,
              todayStr,
              nextStatus,
              user?.id
            );
            updateOrderStatus(orderId, nextStatus as DeliveryOrder["status"]);
          } catch (e) {
            console.warn("[delivery] Failed to persist status", e);
            Alert.alert(
              "Sync failed",
              "Status could not be saved. Check connection and try again."
            );
          }
        },
      },
    ]);
  };

  const makePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "packaging":
        return "#F59E0B";
      case "packaging_done":
        return "#8B5CF6";
      case "delivery_started":
        return "#48479B";
      case "reached":
        return "#06B6D4";
      case "delivery_done":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "packaging":
        return Package;
      case "packaging_done":
        return AlertCircle;
      case "delivery_started":
        return Truck;
      case "reached":
        return Navigation;
      case "delivery_done":
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getActionButtonText = (status: string) => {
    switch (status) {
      case "packaging":
        return "Packaging Done";
      case "packaging_done":
        return "Start Delivery";
      case "delivery_started":
        return "Reached";
      case "reached":
        return "Delivery Done";
      default:
        return "Update Status";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1F2937", "#111827"]} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Delivery Dashboard</Text>
              <Text style={styles.userName}>
                {user?.name || "Delivery Partner"}
              </Text>
              {/* <Text style={styles.currentTime}>{formatTime(currentTime)}</Text> */}
            </View>
            <View style={styles.headerActions}>
              <RoleSelector currentRole="delivery" />
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <LogOut size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#48479B", "#2563EB"]}
                style={styles.statGradient}
              >
                <Package size={18} color="white" />
                <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
                <Text style={styles.statTitle}>Total Orders</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                style={styles.statGradient}
              >
                <Clock size={18} color="white" />
                <Text style={styles.statValue}>{stats.pendingDeliveries}</Text>
                <Text style={styles.statTitle}>Pending</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.statGradient}
              >
                <CheckCircle size={18} color="white" />
                <Text style={styles.statValue}>
                  {stats.completedDeliveries}
                </Text>
                <Text style={styles.statTitle}>Completed</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Packaging done & Delivery started actions */}
          <View style={styles.bulkButtonsRow}>
            <TouchableOpacity
              style={styles.bulkButton}
              onPress={() => {
                const toUpdate = deliveryOrders.filter(
                  (o) => o.status === "packaging"
                );
                const count = toUpdate.length;
                if (count === 0) {
                  Alert.alert(
                    "Nothing to update",
                    "No orders in packaging state."
                  );
                  return;
                }
                Alert.alert(
                  "Mark all packaging done",
                  `Confirm marking ${count} order(s) as packaging done?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Confirm",
                      onPress: async () => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        try {
                          await Promise.all(
                            toUpdate.map((o) =>
                              db.updateSubscriptionDeliveryStatus(
                                o.id,
                                todayStr,
                                "packaging_done",
                                user?.id
                              )
                            )
                          );
                          setDeliveryOrders((prev) => {
                            const next = prev.map((order) =>
                              order.status === "packaging"
                                ? { ...order, status: "packaging_done" as const }
                                : order
                            );
                            recalcStats(next);
                            return next;
                          });
                        } catch (e) {
                          console.warn("[delivery] Bulk packaging-done failed", e);
                          Alert.alert(
                            "Sync failed",
                            "Could not save to server. Check connection and try again."
                          );
                          loadFromFirestore();
                        }
                      },
                    },
                  ]
                );
              }}
              testID="btn-bulk-packaging-done"
              accessibilityLabel="Mark all packaging done"
            >
              <Text style={styles.bulkButtonText}>Packaging Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkButtonSecondary]}
              onPress={() => {
                const toUpdate = deliveryOrders.filter(
                  (o) => o.status === "packaging_done"
                );
                const count = toUpdate.length;
                if (count === 0) {
                  Alert.alert(
                    "Nothing to update",
                    "No orders ready to start delivery."
                  );
                  return;
                }
                Alert.alert(
                  "Start delivery for all",
                  `Confirm starting delivery for ${count} order(s)?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Confirm",
                      onPress: async () => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        try {
                          await Promise.all(
                            toUpdate.map((o) =>
                              db.updateSubscriptionDeliveryStatus(
                                o.id,
                                todayStr,
                                "delivery_started",
                                user?.id
                              )
                            )
                          );
                          setDeliveryOrders((prev) => {
                            const next = prev.map((order) =>
                              order.status === "packaging_done"
                                ? {
                                    ...order,
                                    status: "delivery_started" as const,
                                  }
                                : order
                            );
                            recalcStats(next);
                            return next;
                          });
                        } catch (e) {
                          console.warn("[delivery] Bulk delivery-started failed", e);
                          Alert.alert(
                            "Sync failed",
                            "Could not save to server. Check connection and try again."
                          );
                          loadFromFirestore();
                        }
                      },
                    },
                  ]
                );
              }}
              testID="btn-bulk-delivery-started"
              accessibilityLabel="Mark all delivery started"
            >
              <Text style={styles.bulkButtonText}>Delivery Started</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Orders */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today&apos;s Deliveries</Text>
              <View style={styles.headerButtonsRow}>
                
                <TouchableOpacity
                  onPress={onRefresh}
                  style={styles.iconButton}
                  testID="btn-refresh"
                >
                  <RefreshCw size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {deliveryOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>
                        {order.customerName}
                      </Text>
                      <Text style={styles.mealName}>
                        {order.mealName} (x{order.quantity})
                      </Text>
                      <Text style={styles.deliveryTime}>
                        Delivery: {order.deliveryTime}
                      </Text>
                    </View>
                    <View style={styles.orderStatus}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(order.status) },
                        ]}
                      >
                        <StatusIcon size={16} color="white" />
                        <Text style={styles.statusText}>
                          {order.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.orderValue}>₹{order.orderValue}</Text>
                    </View>
                  </View>

                  <View style={styles.addressContainer}>
                    <MapPin size={16} color="#9CA3AF" />
                    <Text style={styles.address}>{order.address}</Text>
                  </View>

                  {order.specialInstructions && (
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsTitle}>
                        Special Instructions:
                      </Text>
                      <Text style={styles.instructions}>
                        {order.specialInstructions}
                      </Text>
                    </View>
                  )}

                  {order.status !== "delivery_done" ? (
                    <SwipeAdvance
                      key={`swipe-${order.id}-${order.status}`}
                      color={getStatusColor(order.status)}
                      icon={getStatusIcon(order.status)}
                      label={getActionButtonText(order.status)}
                      onComplete={() =>
                        handleStatusUpdate(order.id, order.status)
                      }
                      testID={`swipe-advance-${order.id}`}
                    />
                  ) : (
                    <View style={styles.deliveredIndicator}>
                      <CheckCircle size={16} color="#10B981" />
                      <Text style={styles.deliveredText}>Delivered</Text>
                    </View>
                  )}

                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      style={styles.phoneButton}
                      onPress={() => makePhoneCall(order.customerPhone)}
                    >
                      <Phone size={16} color="white" />
                      <Text style={styles.phoneButtonText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mapsButton}
                      onPress={() => openMaps(order.address)}
                    >
                      <Navigation size={16} color="white" />
                      <Text style={styles.mapsButtonText}>Navigate</Text>
                    </TouchableOpacity>

                    {order.status !== "delivery_done" && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: getStatusColor(order.status) },
                        ]}
                        onPress={() =>
                          handleStatusUpdate(order.id, order.status)
                        }
                      >
                        <StatusIcon size={16} color="white" />
                        <Text style={styles.actionButtonText}>
                          {getActionButtonText(order.status)}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {order.status === "delivery_done" && (
                      <View style={styles.deliveredIndicator}>
                        <CheckCircle size={16} color="#10B981" />
                        <Text style={styles.deliveredText}>Delivered</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function SwipeAdvance({
  color,
  icon: Icon,
  label,
  onComplete,
  testID,
}: {
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onComplete: () => void;
  testID?: string;
}) {
  const trackWidthRef = useRef<number>(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const knobSize = 44;
  const padding = 4;
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const maxX = useMemo(() => {
    const w = trackWidthRef.current;
    const v = Math.max(0, w - knobSize - padding * 2);
    return v;
  }, [knobSize, padding]);

  const reset = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 8,
      speed: 12,
    }).start();
  }, [translateX]);

  const complete = useCallback(() => {
    Animated.timing(translateX, {
      toValue: maxX,
      duration: 160,
      useNativeDriver: false,
    }).start(() => {
      try {
        onComplete();
      } catch (e) {
        console.log("[SwipeAdvance] onComplete error", e);
      } finally {
        setTimeout(() => {
          reset();
        }, 200);
      }
    });
  }, [maxX, onComplete, reset, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const should =
          Math.abs(gesture.dx) > 5 &&
          Math.abs(gesture.dy) < 20 &&
          gesture.dx > 0;
        return should;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        const w = trackWidthRef.current;
        if (!w) return;
        const next = Math.min(Math.max(0, gesture.dx), maxX);
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        setIsDragging(false);
        const w = trackWidthRef.current;
        if (!w) {
          reset();
          return;
        }
        const threshold = maxX * 0.65;
        if (gesture.dx >= threshold) {
          complete();
        } else {
          reset();
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        reset();
      },
    })
  ).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: 8,
          marginBottom: 12,
        },
        track: {
          position: "relative",
          height: 52,
          borderRadius: 26,
          borderWidth: 1,
          overflow: "hidden",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.04)",
          borderColor: color,
        },
        fill: {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          borderTopLeftRadius: 26,
          borderBottomLeftRadius: 26,
          backgroundColor: color,
        },
        label: {
          color: "white",
          fontSize: 13,
          fontWeight: "600",
          textAlign: "center",
        },
        knob: {
          position: "absolute",
          left: padding,
          width: knobSize,
          height: knobSize,
          borderRadius: knobSize / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color,
        },
      }),
    [color]
  );

  return (
    <View style={s.container} onLayout={onLayout} testID={testID}>
      <View
        style={s.track}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityHint="Drag right to confirm"
      >
        <Animated.View
          style={[
            s.fill,
            {
              width: Animated.add(
                translateX,
                new Animated.Value(knobSize + padding * 2)
              ),
              opacity: isDragging ? 0.9 : 0.8,
            },
          ]}
        />
        <Text style={s.label}>{label}</Text>
        <Animated.View
          style={[s.knob, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <Icon size={20} color={Platform.OS === "web" ? "white" : "#fff"} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  currentTime: {
    fontSize: 14,
    color: "#48479B",
    marginTop: 4,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "31%",
    borderRadius: 12,
    overflow: "hidden",
  },
  statGradient: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bulkButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  bulkButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bulkButtonSecondary: {
    backgroundColor: "#48479B",
  },
  bulkButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  orderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "800",
    color: "white",
    marginBottom: 4,
  },
  mealName: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  deliveryTime: {
    fontSize: 14,
    color: "#F59E0B",
    fontWeight: "500",
  },
  orderStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
    gap: 4,
  },
  statusText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  orderValue: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  instructionsContainer: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  instructionsTitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: "white",
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  phoneButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#48479B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  mapsButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  deliveredIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveredText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});
