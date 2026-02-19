import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import {
  ArrowLeft,
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Search,
  Calendar,
  DollarSign,
  Gift,
  ShoppingBag,
  RefreshCw,
  X,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { WalletTransaction } from "@/types";
import db from "@/db";
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

type TransactionFilter = "all" | "credit" | "debit";
type DateFilter = "all" | "today" | "week" | "month" | "custom";

export default function WalletScreen() {
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<TransactionFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const txns = await db.getWalletTransactions(user.id);
        setTransactions(txns || []);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      Alert.alert("Error", "Failed to load wallet transactions");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((txn) => txn.type === filterType);
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === "today") {
      filtered = filtered.filter((txn) => {
        const txnDate = new Date(txn.createdAt);
        return txnDate >= today;
      });
    } else if (dateFilter === "week") {
      filtered = filtered.filter((txn) => {
        const txnDate = new Date(txn.createdAt);
        return txnDate >= weekAgo;
      });
    } else if (dateFilter === "month") {
      filtered = filtered.filter((txn) => {
        const txnDate = new Date(txn.createdAt);
        return txnDate >= monthAgo;
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (txn) =>
          txn.description.toLowerCase().includes(query) ||
          txn.id.toLowerCase().includes(query) ||
          txn.referenceId?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [transactions, filterType, dateFilter, searchQuery]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalCredit = transactions
      .filter((txn) => txn.type === "credit")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalDebit = transactions
      .filter((txn) => txn.type === "debit")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const thisMonthTransactions = transactions.filter((txn) => {
      const txnDate = new Date(txn.createdAt);
      const now = new Date();
      return (
        txnDate.getMonth() === now.getMonth() &&
        txnDate.getFullYear() === now.getFullYear()
      );
    });

    const monthlySpent = thisMonthTransactions
      .filter((txn) => txn.type === "debit")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const monthlyReceived = thisMonthTransactions
      .filter((txn) => txn.type === "credit")
      .reduce((sum, txn) => sum + txn.amount, 0);

    return {
      totalCredit,
      totalDebit,
      monthlySpent,
      monthlyReceived,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  const getTransactionIcon = (type: string, description: string) => {
    if (type === "credit") {
      if (description.toLowerCase().includes("referral")) {
        return <Gift size={20} color={Colors.primary} />;
      }
      if (description.toLowerCase().includes("refund")) {
        return <RefreshCw size={20} color={Colors.primary} />;
      }
      return <TrendingUp size={20} color={Colors.primary} />;
    }
    if (description.toLowerCase().includes("subscription")) {
      return <Calendar size={20} color={Colors.error} />;
    }
    if (description.toLowerCase().includes("order")) {
      return <ShoppingBag size={20} color={Colors.error} />;
    }
    return <TrendingDown size={20} color={Colors.error} />;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTransaction = (transaction: WalletTransaction) => {
    const isCredit = transaction.type === "credit";

    return (
      <TouchableOpacity
        key={transaction.id}
        style={styles.transactionCard}
        onPress={() => {
          Alert.alert(
            "Transaction Details",
            `ID: ${transaction.id}\n` +
              `Type: ${transaction.type.toUpperCase()}\n` +
              `Amount: ₹${transaction.amount.toFixed(2)}\n` +
              `Description: ${transaction.description}\n` +
              `Date: ${formatDate(transaction.createdAt)}\n` +
              `${
                transaction.referenceId
                  ? `Reference: ${transaction.referenceId}`
                  : ""
              }` +
              `${
                transaction.orderId ? `\nOrder ID: ${transaction.orderId}` : ""
              }`
          );
        }}
      >
        <View style={styles.transactionIconContainer}>
          {getTransactionIcon(transaction.type, transaction.description)}
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.createdAt)}
          </Text>
          {transaction.referenceId && (
            <Text style={styles.transactionReference} numberOfLines={1}>
              Ref: {transaction.referenceId}
            </Text>
          )}
        </View>

        <View style={styles.transactionAmountContainer}>
          <Text
            style={[
              styles.transactionAmount,
              { color: isCredit ? Colors.success : Colors.error },
            ]}
          >
            {isCredit ? "+" : "-"}₹{transaction.amount.toFixed(2)}
          </Text>
          <ChevronRight size={16} color={Colors.mutedText} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}> 
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={styles.filterButton}
        >
          <Filter size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Wallet Balance Card */}
        <LinearGradient
          colors={[Colors.primary, "#3a3982"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <WalletIcon size={32} color="#fff" />
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            ₹{(user?.walletBalance || 0).toFixed(2)}
          </Text>

          <View style={styles.walletInfoBox}>
            <Text style={styles.walletInfoText}>
              💰 Earn wallet credits through referrals and order streaks!
            </Text>
          </View>
        </LinearGradient>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color={Colors.success} />
            <Text style={styles.statValue}>
              ₹{statistics.totalCredit.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Received</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingDown size={24} color={Colors.error} />
            <Text style={styles.statValue}>
              ₹{statistics.totalDebit.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={24} color={Colors.primary} />
            <Text style={styles.statValue}>
              ₹{statistics.monthlyReceived.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>This Month Received</Text>
          </View>

          <View style={styles.statCard}>
            <ShoppingBag size={24} color={Colors.accent} />
            <Text style={styles.statValue}>
              ₹{statistics.monthlySpent.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>This Month Spent</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={Colors.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={20} color={Colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Active Filters Display */}
        {(filterType !== "all" || dateFilter !== "all") && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersLabel}>Active Filters:</Text>
            {filterType !== "all" && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {filterType === "credit" ? "Credits" : "Debits"}
                </Text>
                <TouchableOpacity onPress={() => setFilterType("all")}>
                  <X size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {dateFilter !== "all" && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {dateFilter === "today"
                    ? "Today"
                    : dateFilter === "week"
                    ? "This Week"
                    : dateFilter === "month"
                    ? "This Month"
                    : "Custom"}
                </Text>
                <TouchableOpacity onPress={() => setDateFilter("all")}>
                  <X size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Transaction List Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Transaction History ({filteredTransactions.length})
          </Text>
        </View>

        {/* Transaction List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <WalletIcon size={64} color={Colors.border} />
            <Text style={styles.emptyText}>
              {searchQuery || filterType !== "all" || dateFilter !== "all"
                ? "No transactions found matching your filters"
                : "No transactions yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filterType !== "all" || dateFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Your wallet transactions will appear here"}
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) =>
              renderTransaction(transaction)
            )}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Transaction Type</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterType === "all" && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterType("all")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterType === "all" && styles.filterOptionTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterType === "credit" && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterType("credit")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterType === "credit" && styles.filterOptionTextActive,
                    ]}
                  >
                    Credits
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterType === "debit" && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterType("debit")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterType === "debit" && styles.filterOptionTextActive,
                    ]}
                  >
                    Debits
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    dateFilter === "all" && styles.filterOptionActive,
                  ]}
                  onPress={() => setDateFilter("all")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      dateFilter === "all" && styles.filterOptionTextActive,
                    ]}
                  >
                    All Time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    dateFilter === "today" && styles.filterOptionActive,
                  ]}
                  onPress={() => setDateFilter("today")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      dateFilter === "today" && styles.filterOptionTextActive,
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    dateFilter === "week" && styles.filterOptionActive,
                  ]}
                  onPress={() => setDateFilter("week")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      dateFilter === "week" && styles.filterOptionTextActive,
                    ]}
                  >
                    This Week
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    dateFilter === "month" && styles.filterOptionActive,
                  ]}
                  onPress={() => setDateFilter("month")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      dateFilter === "month" && styles.filterOptionTextActive,
                    ]}
                  >
                    This Month
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setFilterType("all");
                  setDateFilter("all");
                  setSearchQuery("");
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  filterButton: {
    padding: 8,
    width: 40,
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: "#48479B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginLeft: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 16,
    letterSpacing: -1,
  },
  walletInfoBox: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  walletInfoText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  statValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  activeFiltersLabel: {
    fontSize: 14,
    color: Colors.mutedText,
    marginRight: 8,
    fontWeight: "600",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(163, 211, 151, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.mutedText,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.mutedText,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.mutedText,
    marginTop: 8,
    textAlign: "center",
  },
  transactionsList: {
    gap: 10,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  transactionReference: {
    fontSize: 11,
    color: "#D1D5DB",
    marginTop: 2,
  },
  transactionAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  filterOptionTextActive: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
