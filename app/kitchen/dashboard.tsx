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
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import RoleSelector from '@/components/RoleSelector';
import db from '@/db';
import { Subscription, User, Meal, AddOn } from '@/types';
import { isActivePlanDate } from '@/utils/subscriptionDateUtils';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Package,
  Download,
  Plus,
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
    totalMeals: 0,
    totalAddons: 0,
  });
  const [addOnsById, setAddOnsById] = useState<Map<string, AddOn>>(new Map());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadFromFirestore = useCallback(async () => {
    try {
      setRefreshing(true);
      const [subs, users, meals, addOnsData] = await Promise.all([
        db.getSubscriptions(),
        db.getUsers(),
        db.getMeals(),
        db.getAddOns(),
      ]);

      const addOnsMap = new Map<string, AddOn>();
      addOnsData.forEach((a) => addOnsMap.set(a.id, a));
      setAddOnsById(addOnsMap);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const mealsById = new Map<string, Meal>();
      meals.forEach((m) => mealsById.set(m.id, m));

      const validKitchenStatuses = ['pending', 'cooking_started', 'cooking_done', 'ready_for_delivery'];
      const list: CookingItem[] = subs
        .filter((s: Subscription) => s.status === 'active' && isActivePlanDate(today, s))
        .map((s: Subscription) => {
          const u: User | undefined = users.find((us) => us.id === s.userId);
          const m = mealsById.get(s.mealId);
          const addOnIds = (s.additionalAddOns?.[todayStr] ?? []) as string[];
          const storedKitchenStatus = s.kitchenStatusByDate?.[todayStr];
          const status =
            storedKitchenStatus && validKitchenStatuses.includes(storedKitchenStatus)
              ? (storedKitchenStatus as CookingItem['status'])
              : 'pending';
          return {
            id: s.id,
            mealName: m?.name ?? `Meal #${s.mealId}`,
            quantity: 1,
            customerName: u?.name ?? 'Customer',
            deliveryTime: s.deliveryTime || s.deliveryTimeSlot || '—',
            status,
            addOns: addOnIds,
          };
        });

      setCookingList(list);
      setInitialSnapshot(prev => (prev.length === 0 ? list : prev));
      const totalMeals = list.reduce((sum, i) => sum + i.quantity, 0);
      const totalAddons = list.reduce((sum, i) => sum + i.addOns.length, 0);
      setStats({ totalMeals, totalAddons });
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

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'cooking_started' | 'cooking_done' | 'ready_for_delivery') => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await db.updateSubscriptionKitchenStatus(orderId, todayStr, newStatus);
    } catch (e) {
      console.warn('[kitchen] Failed to persist status', e);
      Alert.alert('Sync failed', 'Status could not be saved. Check connection and try again.');
      return;
    }
    setCookingList(prev =>
      prev.map(item =>
        item.id === orderId ? { ...item, status: newStatus } : item
      )
    );
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
          onPress: async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const ids = cookingList.map((i) => i.id);
            try {
              await Promise.all(
                ids.map((id) =>
                  db.updateSubscriptionKitchenStatus(id, todayStr, newStatus)
                )
              );
            } catch (e) {
              console.warn('[kitchen] Bulk persist failed', e);
              Alert.alert('Sync failed', 'Some statuses could not be saved.');
              return;
            }
            setCookingList(prev =>
              prev.map(item => ({ ...item, status: newStatus }))
            );
          },
        },
      ]
    );
  };

  /** Resolve an add-on ID to its display name */
  const resolveAddonName = useCallback((id: string) => {
    return addOnsById.get(id)?.name ?? id;
  }, [addOnsById]);

  /**
   * Build the full "what to cook" list:
   * - Main meals aggregated by name with quantity
   * - Add-ons aggregated separately by name with quantity (each addon counts as its own cook item)
   */
  type CookRow = { name: string; type: 'Meal' | 'Add-on'; quantity: number };

  const buildCookSummary = useCallback((list: CookingItem[]): CookRow[] => {
    const mealCounts = new Map<string, number>();
    const addonCounts = new Map<string, number>();

    list.forEach((item) => {
      mealCounts.set(item.mealName, (mealCounts.get(item.mealName) ?? 0) + item.quantity);
      item.addOns.forEach((id) => {
        const name = resolveAddonName(id);
        addonCounts.set(name, (addonCounts.get(name) ?? 0) + 1);
      });
    });

    const rows: CookRow[] = [];
    mealCounts.forEach((qty, name) => rows.push({ name, type: 'Meal', quantity: qty }));
    addonCounts.forEach((qty, name) => rows.push({ name, type: 'Add-on', quantity: qty }));
    return rows;
  }, [resolveAddonName]);

  /** Build a CSV string for the cook sheet */
  const buildCSV = useCallback((
    list: CookingItem[],
    label: string,
  ): string => {
    const summary = buildCookSummary(list);
    const dateStr = new Date().toLocaleDateString('en-IN');
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const lines: string[] = [
      `Same Old Box – Kitchen Sheet`,
      `Date,${dateStr}`,
      `Time,${timeStr}`,
      `List,${label}`,
      ``,
      `Type,Item,Quantity`,
      ...summary.map(r => `${r.type},"${r.name}",${r.quantity}`),
    ];
    return lines.join('\n');
  }, [buildCookSummary]);


  /**
   * Generates a CSV, saves it to the device, and opens it immediately.
   *
   * Android: SAF folder picker → file saved to chosen folder → opened instantly
   *          via Linking with the SAF content:// URI (opens Google Sheets / any CSV app).
   * iOS:     file written to Documents → Share sheet appears;
   *          "Open in Numbers / Excel" opens it instantly, "Save to Files" saves it.
   */
  const exportCSV = useCallback(async (list: CookingItem[], label: string) => {
    try {
      const csv = buildCSV(list, label);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `${timestamp}_${label}_sheet.csv`;

      if (Platform.OS === 'android') {
        const perms = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perms.granted) return;

        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perms.directoryUri,
          fileName,
          'text/csv',
        );
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });

        // Open the saved file immediately in whatever CSV app the user has (e.g. Google Sheets)
        // The SAF content:// URI is safe to pass via Linking – no FileUriExposedException
        try {
          await Linking.openURL(fileUri);
        } catch {
          Alert.alert('Downloaded ✓', `${fileName} saved. Open it from your chosen folder.`);
        }
      } else {
        // iOS: write locally, then show share sheet
        // "Open in Numbers / Excel" → instant view; "Save to Files" → saved
        const filePath = (FileSystem.documentDirectory ?? '') + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: 'utf8' });
        await Share.share({ url: filePath, title: fileName });
      }
    } catch (e: any) {
      if (e?.message?.includes('cancelled') || e?.message?.includes('dismiss')) return;
      console.log('[kitchen] CSV export error', e);
      Alert.alert('Export failed', 'Could not save the CSV. Please try again.');
    }
  }, [buildCSV]);

  const exportInitialCSV = useCallback(() => {
    const list = initialSnapshot.length ? initialSnapshot : cookingList;
    exportCSV(list, 'Initial Requirements');
  }, [exportCSV, initialSnapshot, cookingList]);

  const exportFinalCSV = useCallback(() => {
    exportCSV(cookingList, 'Final Revised List');
  }, [exportCSV, cookingList]);

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
            router.replace('/auth/login');
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
              {/* <Text style={styles.currentTime}>{formatTime(currentTime)}</Text> */}
            </View>
            <View style={styles.headerActions}>
              <RoleSelector currentRole="kitchen" />
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

           {/* Stats Cards */}
           <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#48479B', '#2563EB']}
                style={styles.statGradient}
              >
                <ChefHat size={24} color="white" />
                <Text style={styles.statValue}>{stats.totalMeals}</Text>
                <Text style={styles.statTitle}>Total Meals</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.statGradient}
              >
                <Plus size={24} color="white" />
                <Text style={styles.statValue}>{stats.totalAddons}</Text>
                <Text style={styles.statTitle}>Total Add-ons</Text>
              </LinearGradient>
            </View>
          </View>

           {/* Export CSV Buttons */}
           <View style={styles.exportContainer}>
            <TouchableOpacity
              style={[styles.exportButton, styles.exportInitial]}
              onPress={exportInitialCSV}
            >
              <Download size={16} color="white" />
              <Text style={styles.exportText}>Initial CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, styles.exportFinal]}
              onPress={exportFinalCSV}
            >
              <CheckCircle size={16} color="white" />
              <Text style={styles.exportText}>Final CSV</Text>
            </TouchableOpacity>
          </View>

           {/* Bulk Action Buttons */}
           {/* <View style={styles.bulkActionsContainer}>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkStartButton]}
              onPress={() => bulkUpdateStatus('cooking_started')}
            >
              <ChefHat size={16} color="white" />
              <Text style={styles.bulkActionText}>Start Cooking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkReadyButton]}
              onPress={() => bulkUpdateStatus('ready_for_delivery')}
            >
              <Package size={16} color="white" />
              <Text style={styles.bulkActionText}>Ready for Packaging</Text>
            </TouchableOpacity>
          </View> */}

         

          

         



          {/* Cook Summary — Meals + Add-ons */}
          {cookingList.length > 0 && (() => {
            const summary = buildCookSummary(cookingList);
            const meals = summary.filter((r) => r.type === 'Meal');
            const addons = summary.filter((r) => r.type === 'Add-on');
            return (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>What to Cook Today</Text>
                </View>

                {/* Meals */}
                {meals.length > 0 && (
                  <>
                    <Text style={styles.cookSubHeader}>🍽️ Meals</Text>
                    {meals.map((row) => (
                      <View key={row.name} style={styles.aggCard}>
                        <View style={styles.aggLeft}>
                          <ChefHat size={18} color="#F59E0B" />
                          <Text style={styles.aggMeal}>{row.name}</Text>
                        </View>
                        <View style={styles.aggQtyBadge}>
                          <Text style={styles.aggQtyText}>×{row.quantity}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {/* Add-ons as separate cook items */}
                {addons.length > 0 && (
                  <>
                    <Text style={[styles.cookSubHeader, { marginTop: 14 }]}>🥗 Add-ons to Prepare</Text>
                    {addons.map((row) => (
                      <View key={row.name} style={[styles.aggCard, styles.aggCardAddon]}>
                        <View style={styles.aggLeft}>
                          <Package size={16} color="#10B981" />
                          <Text style={[styles.aggMeal, { color: '#10B981' }]}>{row.name}</Text>
                        </View>
                        <View style={[styles.aggQtyBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.aggQtyText}>×{row.quantity}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            );
          })()}

          {/* Cooking List */}
          {/* <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today&apos;s Cooking List</Text>
              <TouchableOpacity onPress={onRefresh}>
                <RefreshCw size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {cookingList.map((item) => {
              const StatusIcon = getStatusIcon(item.status);
              const statusColor = getStatusColor(item.status);
              return (
                <View key={item.id} style={[styles.orderCard, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.mealName}>{item.mealName}</Text>
                      <Text style={styles.customerName}>For: {item.customerName}</Text>
                      <Text style={styles.deliveryTime}>Delivery: {item.deliveryTime}</Text>
                    </View>
                    <View style={styles.orderStatus}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
                        <StatusIcon size={14} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {item.status.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.qtyBadge}>
                        <Text style={styles.quantity}>×{item.quantity}</Text>
                      </View>
                    </View>
                  </View>

                  {item.addOns.length > 0 && (
                    <View style={styles.addOnsContainer}>
                      <Text style={styles.addOnsTitle}>Add-ons:</Text>
                      <Text style={styles.addOnsList}>
                        {item.addOns.map((id) => resolveAddonName(id)).join(', ')}
                      </Text>
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
          </View> */}
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
    paddingTop: 18,
    paddingBottom: 12,
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
    marginBottom: 9,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  quantity: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '900',
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
  aggCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aggLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aggMeal: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  aggRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  aggQtyBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aggQtyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  aggAddOns: {
    color: '#9CA3AF',
    fontSize: 11,
    maxWidth: 140,
    textAlign: 'right',
  },
  aggCardAddon: {
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.07)',
  },
  cookSubHeader: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  qtyBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
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
    paddingVertical: 18,
    paddingHorizontal: 9,
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
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: 6,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 9,
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