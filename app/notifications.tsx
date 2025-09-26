import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Bell, X, Trash2, Clock, Package, Truck, Gift } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import db from '@/db';
import { Notification } from '@/types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const userNotifications = await db.getNotifications(user.id);
      setNotifications(userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createSampleNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const existingNotifications = await db.getNotifications(user.id);
      if (existingNotifications.length > 0) return; // Don't create duplicates

      const sampleNotifications = [
        {
          userId: user.id,
          title: 'Cooking Started!',
          message: 'Your Grilled Chicken Bowl is being prepared in our kitchen.',
          type: 'order' as const,
          isRead: false,
          data: { subscriptionId: '1', status: 'preparing' },
        },
        {
          userId: user.id,
          title: 'Out for Delivery',
          message: 'Your Paneer Tikka Bowl is on its way! Expected delivery in 20 minutes.',
          type: 'delivery' as const,
          isRead: false,
          data: { subscriptionId: '2', deliveryPersonId: '1' },
        },
        {
          userId: user.id,
          title: 'Meal Delivered',
          message: 'Your Vegan Buddha Bowl has been delivered successfully.',
          type: 'delivery' as const,
          isRead: true,
          data: { subscriptionId: '3', status: 'delivered' },
        },
        {
          userId: user.id,
          title: 'Special Offer!',
          message: 'Get 25% off on your next subscription. Limited time offer!',
          type: 'promotion' as const,
          isRead: false,
          data: { offerCode: 'SAVE25', validUntil: '2024-12-31' },
        },
        {
          userId: user.id,
          title: 'Streak Reward Earned!',
          message: 'Congratulations! You&apos;ve earned ₹50 for maintaining a 7-day streak.',
          type: 'system' as const,
          isRead: false,
          data: { rewardAmount: 50, streakCount: 7 },
        },
      ];

      for (const notification of sampleNotifications) {
        await db.createNotification(notification);
      }
      
      await loadNotifications();
    } catch (error) {
      console.error('Error creating sample notifications:', error);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Create some sample notifications for demo
      createSampleNotifications();
    }
  }, [user, loadNotifications, createSampleNotifications]);

  const dismissNotification = async (notificationId: string) => {
    try {
      await db.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.clearUserNotifications(user?.id ?? '');
              setNotifications([]);
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package size={20} color="#48479B" />;
      case 'delivery':
        return <Truck size={20} color="#10B981" />;
      case 'promotion':
        return <Gift size={20} color="#8B5CF6" />;
      case 'system':
        return <Bell size={20} color="#48479B" />;
      default:
        return <Bell size={20} color="#666" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const onPressNotification = async (item: Notification) => {
    try {
      if (!item.isRead) {
        await db.markNotificationAsRead(item.id);
        setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)));
      }
      const hasAck = item?.data?.status === 'waiting_for_ack' && typeof item?.data?.orderId === 'string';
      if (hasAck) {
        router.push({ pathname: '/acknowledgment/[orderId]', params: { orderId: item.data.orderId } });
      }
    } catch (e) {
      console.log('onPressNotification error', e);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      testID={`notification-${item.id}`}
      activeOpacity={0.8}
      onPress={() => onPressNotification(item)}
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#999" />
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity
          testID={`dismiss-${item.id}`}
          style={styles.dismissButton}
          onPress={() => dismissNotification(item.id)}
        >
          <X size={16} color="#999" />
        </TouchableOpacity>
      </View>
      {!item.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyDescription}>
        You&apos;re all caught up! We&apos;ll notify you about your orders and special offers.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: '#48479B' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            notifications.length > 0 ? (
              <TouchableOpacity
                onPress={clearAllNotifications}
                style={styles.clearAllButton}
              >
                <Trash2 size={20} color="white" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            ) : null
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#48479B',
    backgroundColor: '#FFFBF8',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  dismissButton: {
    padding: 4,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48479B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
});