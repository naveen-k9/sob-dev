import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Bell, Send, Users, Target, Loader2 } from 'lucide-react-native';
import db from '@/db';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export default function PushCenterScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [sending, setSending] = useState<boolean>(false);
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    setPreview(`${title || 'Title'}\n${message || 'Message body'}`);
  }, [title, message]);

  const onSend = useCallback(async () => {
    try {
      if (!user || user.role !== 'admin') {
        Alert.alert('Unauthorized', 'Only admin can send notifications');
        return;
      }
      if (!title.trim() || !message.trim()) {
        Alert.alert('Validation', 'Title and message are required');
        return;
      }
      setSending(true);
      const createdCount = await db.broadcastNotification({
        title,
        message,
        type: 'promotion',
        isRead: false,
        data: { via: 'admin_push_center' },
        ...(role === 'all' ? {} : { role }),
      } as any);
      Alert.alert('Sent', `Notification delivered to ${createdCount} users`);
      setTitle('');
      setMessage('');
      setRole('all');
    } catch (e) {
      console.log('Push center send error', e);
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setSending(false);
    }
  }, [title, message, role, user]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Push Center' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.previewCard}>
          <Bell color="#FF6B35" size={24} />
          <Text style={styles.previewTitle} numberOfLines={1}>{title || 'Notification Title'}</Text>
          <Text style={styles.previewBody} numberOfLines={2}>{message || 'Your message preview appears here.'}</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            testID="push-title"
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Enter message"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            testID="push-message"
          />

          <Text style={styles.label}>Audience</Text>
          <View style={styles.rolesRow}>
            {(['all','customer','admin','kitchen','delivery'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r as any)}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
                testID={`aud-${r}`}
              >
                <Users size={14} color={role === r ? 'white' : '#374151'} />
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r.toString().toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.sendBtn, sending && styles.sendBtnDisabled]} onPress={onSend} disabled={sending} testID="push-send">
            {sending ? <Loader2 size={18} color="white" /> : <Send size={18} color="white" />}
            <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send Notification'}</Text>
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <View style={styles.tipBox}>
              <Target size={16} color="#6B7280" />
              <Text style={styles.tipText}>
                Browser notifications require permission. We will request it on first load.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { padding: 16 },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  previewBody: { fontSize: 14, color: '#374151', marginTop: 4 },
  inputCard: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 16,
  },
  textarea: { height: 120, textAlignVertical: 'top' },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  roleChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  roleText: { color: '#374151', fontSize: 12, fontWeight: '700' },
  roleTextActive: { color: 'white' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 12 },
  sendBtnDisabled: { opacity: 0.7 },
  sendText: { color: 'white', fontSize: 16, fontWeight: '700' },
  tipBox: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { color: '#6B7280', fontSize: 12 },
});
