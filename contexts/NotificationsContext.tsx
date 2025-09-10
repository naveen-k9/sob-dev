import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Alert } from 'react-native';
import db from '@/db';
import { Notification } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const lastShownRef = useRef<string>('0');
  const pollerRef = useRef<NodeJS.Timer | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const list = await db.getNotifications(user.id);
      setItems(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.log('Notifications load error', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const maybeShowWebPush = useCallback((n: Notification) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (window.Notification.permission === 'granted') {
          // eslint-disable-next-line no-new
          new window.Notification(n.title, { body: n.message });
        }
      } catch (err) {
        console.log('Web Notification failed', err);
      }
    }
  }, []);

  const checkNew = useCallback(async () => {
    if (!user) return;
    const list = await db.getNotifications(user.id);
    const sorted = list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sorted.length === 0) return;
    const latest = sorted[sorted.length - 1];
    const lastId = lastShownRef.current;
    if (latest.id !== lastId) {
      lastShownRef.current = latest.id;
      setItems(sorted.reverse());
      maybeShowWebPush(latest);
      if (Platform.OS !== 'web') {
        Alert.alert(latest.title, latest.message);
      }
    }
  }, [user, maybeShowWebPush]);

  const requestWebPermission = useCallback(async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (window.Notification.permission === 'default') {
          await window.Notification.requestPermission();
        }
      } catch (err) {
        console.log('Request permission failed', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    requestWebPermission();
    load();
    if (pollerRef.current) clearInterval(pollerRef.current as unknown as number);
    pollerRef.current = setInterval(checkNew, 15000);
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current as unknown as number);
    };
  }, [user, load, checkNew, requestWebPermission]);

  const checkAckReminders = useCallback(async () => {
    if (!user) return;
    try {
      await db.checkAndFireDueReminders(user.id);
      await load();
    } catch (e) {
      console.log('checkAckReminders error', e);
    }
  }, [user, load]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(checkAckReminders, 30000);
    return () => clearInterval(t as unknown as number);
  }, [user, checkAckReminders]);

  const value = useMemo(() => ({
    items,
    isLoading,
    reload: load,
    deleteOne: async (id: string) => {
      await db.deleteNotification(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    clearAll: async () => {
      if (!user) return;
      await db.clearUserNotifications(user.id);
      setItems([]);
    },
  }), [items, isLoading, load, user]);

  return value;
});
