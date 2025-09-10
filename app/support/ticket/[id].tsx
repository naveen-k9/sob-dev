import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Clock, CheckCircle, Check, CheckCheck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { SupportTicket, SupportMessage, User } from '@/types';
import db from '@/db';

const TicketChatScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  const loadTicketData = useCallback(async () => {
    if (!id || !user) return;

    try {
      const [ticketData, messagesData] = await Promise.all([
        db.getSupportTicketById(id),
        db.getSupportMessages(id),
      ]);

      if (!ticketData) {
        Alert.alert('Error', 'Ticket not found');
        router.back();
        return;
      }

      // Check if user has access to this ticket
      if (ticketData.userId !== user.id && user.role !== 'admin') {
        Alert.alert('Error', 'You do not have access to this ticket');
        router.back();
        return;
      }

      setTicket(ticketData);
      setMessages(messagesData);

      // Load admin user for display
      if (ticketData.assignedTo) {
        const admin = await db.getUserById(ticketData.assignedTo);
        setAdminUser(admin);
      }

      // Mark messages as delivered for the current user
      await db.markSupportMessagesAsDelivered(id, user.id);
    } catch (error) {
      console.error('Error loading ticket data:', error);
      Alert.alert('Error', 'Failed to load ticket data');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  useEffect(() => {
    // Auto-refresh messages every 5 seconds
    const interval = setInterval(() => {
      if (id && user) {
        db.getSupportMessages(id).then((messagesData) => {
          setMessages(messagesData);
          db.markSupportMessagesAsDelivered(id, user.id);
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket || !user || sending) return;

    setSending(true);
    try {
      await db.createSupportMessage({
        ticketId: ticket.id,
        senderId: user.id,
        senderType: user.role === 'admin' ? 'admin' : 'user',
        message: newMessage.trim(),
        isRead: false,
      });

      // Update ticket status to in_progress if it was open
      if (ticket.status === 'open') {
        await db.updateSupportTicket(ticket.id, { status: 'in_progress' });
        setTicket({ ...ticket, status: 'in_progress' });
      }

      setNewMessage('');
      await loadTicketData();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#f59e0b';
      case 'in_progress':
        return '#3b82f6';
      case 'resolved':
        return '#10b981';
      case 'closed':
        return '#6b7280';
      default:
        return '#f59e0b';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getDeliveryStatusIcon = (message: SupportMessage) => {
    if (message.senderId !== user?.id) return null;

    switch (message.deliveryStatus) {
      case 'sent':
        return <Check size={12} color="#9ca3af" />;
      case 'delivered':
        return <CheckCheck size={12} color="#9ca3af" />;
      case 'read':
        return <CheckCheck size={12} color="#3b82f6" />;
      default:
        return <Clock size={12} color="#9ca3af" />;
    }
  };

  const renderMessage = (message: SupportMessage) => {
    const isOwnMessage = message.senderId === user?.id;
    const isAdmin = message.senderType === 'admin';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage
              ? styles.ownMessageBubble
              : isAdmin
              ? styles.adminMessageBubble
              : styles.otherMessageBubble,
          ]}
        >
          {!isOwnMessage && (
            <Text style={styles.senderName}>
              {isAdmin ? (adminUser?.name || 'Support Team') : 'You'}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatMessageTime(message.createdAt)}
            </Text>
            {getDeliveryStatusIcon(message)}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ticket...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Error</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {ticket.subject}
          </Text>
          <View style={styles.headerMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
              <Text style={styles.statusText}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Text style={styles.priorityText}>{ticket.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Initial ticket message */}
          <View style={styles.initialMessage}>
            <Text style={styles.initialMessageText}>{ticket.message}</Text>
            <Text style={styles.initialMessageTime}>
              {formatMessageTime(ticket.createdAt)}
            </Text>
          </View>

          {/* Chat messages */}
          {messages.map(renderMessage)}
        </ScrollView>

        {ticket.status !== 'closed' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    newMessage.trim() && !sending ? '#3b82f6' : '#d1d5db',
                },
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {ticket.status === 'closed' && (
          <View style={styles.closedNotice}>
            <Text style={styles.closedNoticeText}>
              This ticket has been closed. No further messages can be sent.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  initialMessage: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  initialMessageText: {
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 24,
    marginBottom: 8,
  },
  initialMessageTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  ownMessageBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  adminMessageBubble: {
    backgroundColor: '#10b981',
    borderBottomLeftRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#6b7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedNotice: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closedNoticeText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});

export default TicketChatScreen;