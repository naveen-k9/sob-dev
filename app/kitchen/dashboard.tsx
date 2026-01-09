import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import RoleSelector from '@/components/RoleSelector';
import db from '@/db';
import { Subscription, User, Meal } from '@/types';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Package,
  Download,
} from 'lucide-react-native';

interface CookingItem {
  id: string;
  mealName: string;
  quantity: number;
  customerName: string;
  deliveryTime: string;
  specialInstructions?: string;
  status: 'pending' | 'cooking_started' | 'cooking_done' | 'ready_for_delivery';
  addOns: string[];
}

export default function KitchenDashboard() {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [cookingList, setCookingList] = useState<CookingItem[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<CookingItem[]>([]);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    cookingOrders: 0,
  });

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
      today.setHours(0,0,0,0);
      const todayStr = today.toISOString().split('T')[0];

      const mealsById = new Map<string, Meal>();
      meals.forEach((m) => mealsById.set(m.id, m));

      const list: CookingItem[] = subs
        .filter((s: Subscription) => s.status === 'active')
        .map((s: Subscription) => {
          const u: User | undefined = users.find((us) => us.id === s.userId);
          const m = mealsById.get(s.mealId);
          const addOnIds = (s.additionalAddOns?.[todayStr] ?? []) as string[];
          return {
            id: s.id,
            mealName: m?.name ?? `Meal #${s.mealId}`,
            quantity: 1,
            customerName: u?.name ?? 'Customer',
            deliveryTime: s.deliveryTime || s.deliveryTimeSlot || '—',
            status: 'pending',
            addOns: addOnIds,
          };
        });

      setCookingList(list);
      setInitialSnapshot(prev => (prev.length === 0 ? list : prev));
      const pending = list.filter((i) => i.status === 'pending').length;
      const cooking = list.filter((i) => i.status === 'cooking_started' || i.status === 'cooking_done').length;
      const ready = list.filter((i) => i.status === 'ready_for_delivery').length;
      setStats({ totalOrders: list.length, pendingOrders: pending, cookingOrders: cooking, readyOrders: ready });
    } catch (e) {
      console.log('[kitchen] loadFromFirestore error', e);
      Alert.alert('Error', 'Failed to load kitchen data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]);

  const onRefresh = async () => {
    await loadFromFirestore();
  };

  const updateOrderStatus = (orderId: string, newStatus: 'pending' | 'cooking_started' | 'cooking_done' | 'ready_for_delivery') => {
    setCookingList(prev => 
      prev.map(item => 
        item.id === orderId ? { ...item, status: newStatus } : item
      )
    );
    
    // Update stats
    const updatedStats = { ...stats };
    if (newStatus === 'cooking_started') {
      updatedStats.pendingOrders -= 1;
      updatedStats.cookingOrders += 1;
    } else if (newStatus === 'ready_for_delivery') {
      updatedStats.cookingOrders -= 1;
      updatedStats.readyOrders += 1;
    }
    setStats(updatedStats);
  };

  const markAsReadyForDelivery = (orderId: string) => {
    Alert.alert(
      'Mark as Ready for Delivery',
      'Is this order ready for delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ready',
          onPress: () => updateOrderStatus(orderId, 'ready_for_delivery'),
        },
      ]
    );
  };

  const bulkUpdateStatus = (newStatus: 'cooking_started' | 'cooking_done' | 'ready_for_delivery') => {
    const statusText = newStatus === 'cooking_started' ? 'Cooking Started' : 
                      newStatus === 'cooking_done' ? 'Cooking Done' : 'Ready for Delivery';
    
    Alert.alert(
      `Mark All as ${statusText}`,
      `Are you sure you want to mark all today's orders as ${statusText.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setCookingList(prev => 
              prev.map(item => ({ ...item, status: newStatus }))
            );
            
            // Update stats based on new status
            const totalOrders = cookingList.length;
            if (newStatus === 'cooking_started') {
              setStats(prev => ({
                ...prev,
                pendingOrders: 0,
                cookingOrders: totalOrders,
                readyOrders: 0
              }));
            } else if (newStatus === 'cooking_done') {
              setStats(prev => ({
                ...prev,
                pendingOrders: 0,
                cookingOrders: totalOrders,
                readyOrders: 0
              }));
            } else if (newStatus === 'ready_for_delivery') {
              setStats(prev => ({
                ...prev,
                pendingOrders: 0,
                cookingOrders: 0,
                readyOrders: totalOrders
              }));
            }
          },
        },
      ]
    );
  };

  const aggregateForCSV = useCallback((list: CookingItem[]) => {
    const mealMap = new Map<string, { mealName: string; totalQty: number; addOnCounts: Record<string, number> }>();

    list.forEach((item) => {
      const key = item.mealName;
      const entry = mealMap.get(key) ?? { mealName: item.mealName, totalQty: 0, addOnCounts: {} };
      entry.totalQty += item.quantity;
      item.addOns.forEach((a) => {
        if (!entry.addOnCounts[a]) entry.addOnCounts[a] = 0;
        entry.addOnCounts[a] += 1;
      });
      mealMap.set(key, entry);
    });

    const rows: Array<{ Meal: string; Quantity: number; AddOns: string }> = [];
    mealMap.forEach((v) => {
      const addOnsText = Object.keys(v.addOnCounts).length
        ? Object.entries(v.addOnCounts)
            .map(([name, cnt]) => `${name} x${cnt}`)
            .join('; ')
        : '';
      rows.push({ Meal: v.mealName, Quantity: v.totalQty, AddOns: addOnsText });
    });

    return rows;
  }, []);

  const toCSV = useCallback((rows: Array<Record<string, string | number>>) => {
    if (rows.length === 0) return 'Meal,Quantity,AddOns\n';
    const headers = Object.keys(rows[0]);
    const escape = (val: string | number) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      lines.push(headers.map((h) => escape(r[h] ?? '')).join(','));
    });
    return lines.join('\n');
  }, []);

  const downloadCSV = useCallback(async (csvText: string, fileName: string) => {
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: csvText, title: fileName });
      }
    } catch (e) {
      console.log('[kitchen] CSV export error', e);
      Alert.alert('Export failed', 'Could not export CSV. Please try again.');
    }
  }, []);

  const exportInitialCSV = useCallback(() => {
    const rows = aggregateForCSV(initialSnapshot.length ? initialSnapshot : cookingList);
    const csv = toCSV(rows);
    downloadCSV(csv, 'initial_requirements.csv');
  }, [aggregateForCSV, downloadCSV, initialSnapshot, cookingList, toCSV]);

  const exportFinalCSV = useCallback(() => {
    const rows = aggregateForCSV(cookingList);
    const csv = toCSV(rows);
    downloadCSV(csv, 'final_revised_list.csv');
  }, [aggregateForCSV, downloadCSV, cookingList, toCSV]);

  const startCooking = (orderId: string) => {
    updateOrderStatus(orderId, 'cooking_started');
  };

  const markCookingDone = (orderId: string) => {
    updateOrderStatus(orderId, 'cooking_done');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/role-selection');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'cooking_started': return '#48479B';
      case 'cooking_done': return '#8B5CF6';
      case 'ready_for_delivery': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'cooking_started': return Clock;
      case 'cooking_done': return ChefHat;
      case 'ready_for_delivery': return Package;
      default: return Clock;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
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
              <Text style={styles.greeting}>Kitchen Dashboard</Text>
              <Text style={styles.userName}>{user?.name || 'Chef'}</Text>
              <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
            </View>
            <View style={styles.headerActions}>
              <RoleSelector currentRole="kitchen" />
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Export CSV Buttons */}
          <View style={styles.exportContainer}>
            <TouchableOpacity
              testID="export-initial-csv"
              accessibilityLabel="Export initial requirements CSV"
              style={[styles.exportButton, styles.exportInitial]}
              onPress={exportInitialCSV}
            >
              <Download size={16} color="white" />
              <Text style={styles.exportText}>Initial Requirements</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="export-final-csv"
              accessibilityLabel="Export final revised list CSV"
              style={[styles.exportButton, styles.exportFinal]}
              onPress={exportFinalCSV}
            >
              <CheckCircle size={16} color="white" />
              <Text style={styles.exportText}>Final Revised List</Text>
            </TouchableOpacity>
          </View>

          {/* Bulk Action Buttons */}
          <View style={styles.bulkActionsContainer}>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkStartButton]}
              onPress={() => bulkUpdateStatus('cooking_started')}
            >
              <ChefHat size={16} color="white" />
              <Text style={styles.bulkActionText}>Start All Cooking</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkDoneButton]}
              onPress={() => bulkUpdateStatus('cooking_done')}
            >
              <Clock size={16} color="white" />
              <Text style={styles.bulkActionText}>Mark All Done</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkReadyButton]}
              onPress={() => bulkUpdateStatus('ready_for_delivery')}
            >
              <Package size={16} color="white" />
              <Text style={styles.bulkActionText}>Ready for Delivery</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#48479B', '#2563EB']}
                style={styles.statGradient}
              >
                <Package size={24} color="white" />
                <Text style={styles.statValue}>{stats.totalOrders}</Text>
                <Text style={styles.statTitle}>Total Orders</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.statGradient}
              >
                <AlertCircle size={24} color="white" />
                <Text style={styles.statValue}>{stats.pendingOrders}</Text>
                <Text style={styles.statTitle}>Pending</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.statGradient}
              >
                <Clock size={24} color="white" />
                <Text style={styles.statValue}>{stats.cookingOrders}</Text>
                <Text style={styles.statTitle}>Cooking</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.statGradient}
              >
                <CheckCircle size={24} color="white" />
                <Text style={styles.statValue}>{stats.readyOrders}</Text>
                <Text style={styles.statTitle}>Ready</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Cooking List */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today&apos;s Cooking List</Text>
              <TouchableOpacity onPress={onRefresh}>
                <RefreshCw size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            {cookingList.map((item) => {
              const StatusIcon = getStatusIcon(item.status);
              return (
                <View key={item.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.mealName}>{item.mealName}</Text>
                      <Text style={styles.customerName}>For: {item.customerName}</Text>
                      <Text style={styles.deliveryTime}>Delivery: {item.deliveryTime}</Text>
                    </View>
                    <View style={styles.orderStatus}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <StatusIcon size={16} color="white" />
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.quantity}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                  
                  {item.addOns.length > 0 && (
                    <View style={styles.addOnsContainer}>
                      <Text style={styles.addOnsTitle}>Add-ons:</Text>
                      <Text style={styles.addOnsList}>{item.addOns.join(', ')}</Text>
                    </View>
                  )}
                  
                  <View style={styles.orderActions}>
                    {item.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.startButton]}
                        onPress={() => startCooking(item.id)}
                      >
                        <ChefHat size={16} color="white" />
                        <Text style={styles.actionButtonText}>Start Cooking</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'cooking_started' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cookingDoneButton]}
                        onPress={() => markCookingDone(item.id)}
                      >
                        <ChefHat size={16} color="white" />
                        <Text style={styles.actionButtonText}>Cooking Done</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'cooking_done' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.doneButton]}
                        onPress={() => markAsReadyForDelivery(item.id)}
                      >
                        <Package size={16} color="white" />
                        <Text style={styles.actionButtonText}>Ready for Delivery</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'ready_for_delivery' && (
                      <View style={styles.readyIndicator}>
                        <Package size={16} color="#10B981" />
                        <Text style={styles.readyText}>Ready for Delivery</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  currentTime: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  orderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  deliveryTime: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  quantity: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  addOnsContainer: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  addOnsTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  addOnsList: {
    fontSize: 14,
    color: 'white',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#48479B',
  },
  cookingDoneButton: {
    backgroundColor: '#8B5CF6',
  },
  doneButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  readyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  exportContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  exportInitial: {
    backgroundColor: '#374151',
  },
  exportFinal: {
    backgroundColor: '#2563EB',
  },
  exportText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: 6,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  bulkStartButton: {
    backgroundColor: '#48479B',
  },
  bulkDoneButton: {
    backgroundColor: '#8B5CF6',
  },
  bulkReadyButton: {
    backgroundColor: '#10B981',
  },
  bulkActionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});