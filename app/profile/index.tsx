import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddressBookModal from "@/components/AddressBookModal";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  MessageSquare,
  UserPlus,
  Calendar,
  Package,
  Wallet,
  Clock,
  Edit,
  Heart,
  ArrowLeft,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router, Stack } from "expo-router";
import db from "@/db";
import { Subscription } from "@/types";
import { Colors } from "@/constants/colors";

export default function ProfileScreen() {
  const { user, isGuest, logout } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressBook, setShowAddressBook] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanName, setEditingPlanName] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadUserSubscriptions();
    }
  }, [user]);

  const loadUserSubscriptions = async () => {
    if (!user) return;
    try {
      const userSubs = await db.getUserSubscriptions(user.id);
      setSubscriptions(userSubs);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const isProfileIncomplete =
    !user?.name || user.name.trim() === "" || user.addresses.length === 0;

  const menuItems = [
    ...(isProfileIncomplete
      ? [
          {
            icon: Edit,
            title: "Complete Profile",
            onPress: () => router.push("/auth/basic-info"),
            highlight: true,
          },
        ]
      : []),
    {
      icon: User,
      title: "Personal Information",
      onPress: () => router.push("/auth/basic-info"),
    },
    {
      icon: MapPin,
      title: "Address Book",
      onPress: () => setShowAddressBook(true),
    },
    {
      icon: Wallet,
      title: "My Wallet",
      onPress: () => router.push("/wallet" as any),
      badge: user?.walletBalance
        ? `₹${user.walletBalance.toFixed(2)}`
        : undefined,
    },
    {
      icon: Heart,
      title: "Nutritionist Consultation",
      onPress: () => router.push("/nutritionist-contact" as any),
    },
    {
      icon: Package,
      title: "Corporate Catering",
      onPress: () => router.push("/corporate-catering" as any),
    },
    { icon: CreditCard, title: "Payment Methods", onPress: () => {} },
    {
      icon: Bell,
      title: "Notifications",
      onPress: () => router.push("/notifications" as any),
    },
    {
      icon: HelpCircle,
      title: "FAQs",
      onPress: () => router.push("/faqs" as any),
    },
    {
      icon: MessageSquare,
      title: "Support Tickets",
      onPress: () => router.push("/support" as any),
    },
  ];

  const handleEditPlanName = (subscription: Subscription) => {
    setEditingPlanId(subscription.id);
    setEditingPlanName(subscription.planName || `Plan ${subscription.planId}`);
  };

  const savePlanName = async (subscriptionId: string) => {
    if (!editingPlanName.trim()) {
      Alert.alert("Error", "Plan name cannot be empty");
      return;
    }

    try {
      await db.updateSubscription(subscriptionId, {
        planName: editingPlanName.trim(),
      });
      setEditingPlanId(null);
      setEditingPlanName("");
      await loadUserSubscriptions(); // Reload to show updated name
    } catch (error) {
      console.error("Error updating plan name:", error);
      Alert.alert("Error", "Failed to update plan name");
    }
  };

  const cancelEditPlanName = () => {
    setEditingPlanId(null);
    setEditingPlanName("");
  };

  const renderSubscriptionCard = ({ item }: { item: Subscription }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "active":
          return "#10B981";
        case "paused":
          return "#F59E0B";
        case "cancelled":
          return "#EF4444";
        case "completed":
          return "#6B7280";
        default:
          return "#6B7280";
      }
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const deliveredMeals =
      (item.totalDeliveries || 0) - (item.remainingDeliveries || 0);
    const isEditing = editingPlanId === item.id;

    return (
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionInfo}>
            {isEditing ? (
              <View style={styles.editPlanContainer}>
                <TextInput
                  style={styles.editPlanInput}
                  value={editingPlanName}
                  onChangeText={setEditingPlanName}
                  placeholder="Enter plan name"
                  autoFocus
                />
                <View style={styles.editPlanButtons}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => savePlanName(item.id)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEditPlanName}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => handleEditPlanName(item)}>
                <View style={styles.planNameContainer}>
                  <Text style={styles.subscriptionMeal}>
                    {item.planName || `Plan ${item.planId}`}
                  </Text>
                  <Edit size={14} color="#48479B" style={styles.editIcon} />
                </View>
                <Text style={styles.subscriptionPlan}>
                  Subscription #{item.id.slice(-6)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.subscriptionDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Package size={16} color="#666" />
            <Text style={styles.detailText}>
              {deliveredMeals}/{item.totalDeliveries || 0} meals delivered
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color="#666" />
            <Text style={styles.detailText}>Delivery: {item.deliveryTime}</Text>
          </View>
        </View>

        <View style={styles.subscriptionFooter}>
          <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
          {item.status === "active" && (
            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <UserPlus size={64} color="#DDD" />
          <Text style={styles.guestTitle}>Sign In to Your Account</Text>
          <Text style={styles.guestDescription}>
            Access your profile, orders, and personalized recommendations
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Profile",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: {
            color: Colors.background,
            fontSize: 18,
            fontWeight: "700",
          },
          headerLeft: () => (
            <View style={{ marginLeft: 18, marginRight: 9 }}>
              <TouchableOpacity
                onPress={() => router.push("/")}
                testID="open-filter"
              >
                <ArrowLeft size={24} color={Colors.background} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={32} color="#48479B" />
          </View>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>

        {/* Wallet Balance */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Wallet size={24} color="#48479B" />
            <Text style={styles.walletTitle}>Wallet Balance</Text>
          </View>
          <Text style={styles.walletBalance}>₹{user?.walletBalance || 0}</Text>
        </View>

        {/* My Subscriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Subscriptions</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading subscriptions...</Text>
            </View>
          ) : subscriptions.length > 0 ? (
            <FlatList
              data={subscriptions}
              renderItem={renderSubscriptionCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Package size={48} color="#DDD" />
              <Text style={styles.emptyTitle}>No Active Subscriptions</Text>
              <Text style={styles.emptyDescription}>
                Start your healthy meal journey today!
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/(tabs)")}
              >
                <Text style={styles.browseButtonText}>Browse Meals</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.highlight && styles.highlightMenuItem,
              ]}
              onPress={item.onPress}
            >
              <item.icon
                size={20}
                color={item.highlight ? "#48479B" : "#666"}
              />
              <Text
                style={[
                  styles.menuText,
                  item.highlight && styles.highlightMenuText,
                ]}
              >
                {item.title}
              </Text>
              {(item as any).badge && (
                <View style={styles.balanceBadge}>
                  <Text style={styles.balanceBadgeText}>
                    {(item as any).badge}
                  </Text>
                </View>
              )}
              {item.highlight ? (
                <View style={styles.highlightBadge}>
                  <Text style={styles.highlightBadgeText}>!</Text>
                </View>
              ) : (
                <ChevronRight size={16} color="#D1D5DB" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddressBookModal
        visible={showAddressBook}
        onClose={() => setShowAddressBook(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  guestDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: "white",
    marginBottom: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 3,
    borderColor: "#FECACA",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  menu: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  menuText: {
    fontSize: 15,
    color: "#111",
    marginLeft: 14,
    flex: 1,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 32,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    color: "#E53935",
    fontWeight: "700",
  },
  walletCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 10,
  },
  walletBalance: {
    fontSize: 22,
    fontWeight: "900",
    color: "#48479B",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  subscriptionCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionMeal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  subscriptionPlan: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  subscriptionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  subscriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#48479B",
  },
  manageButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  manageButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  highlightMenuItem: {
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  highlightMenuText: {
    color: "#48479B",
    fontWeight: "600",
  },
  highlightBadge: {
    backgroundColor: "#48479B",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  highlightBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  balanceBadge: {
    backgroundColor: "rgba(163, 211, 151, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: "auto",
  },
  balanceBadgeText: {
    color: "#48479B",
    fontSize: 13,
    fontWeight: "700",
  },
  planNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  editIcon: {
    marginLeft: 8,
  },
  editPlanContainer: {
    flex: 1,
  },
  editPlanInput: {
    borderWidth: 1,
    borderColor: "#48479B",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  editPlanButtons: {
    flexDirection: "row",
    gap: 8,
  },
  saveButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
  },
  saveButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
