import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ServiceAreaNotificationRequest } from '@/types';

export default function ServiceAreaRequestsScreen() {
  const [requests, setRequests] = useState<ServiceAreaNotificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    try {
      const { fetchServiceAreaRequests } = await import('@/services/firebase');
      const data = await fetchServiceAreaRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading service area requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleViewLocation = (latitude: number, longitude: number) => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const updateRequestStatus = async (requestId: string, newStatus: ServiceAreaNotificationRequest['status']) => {
    try {
      const { updateServiceAreaRequest } = await import('@/services/firebase');
      await updateServiceAreaRequest(requestId, { 
        status: newStatus, 
        ...(newStatus === 'contacted' ? { notifiedAt: new Date() } : {}) 
      });
      
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus, ...(newStatus === 'contacted' ? { notifiedAt: new Date() } : {}) }
            : req
        )
      );
      
      Alert.alert('Success', `Request marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const notifyUserServiceAvailable = async (request: ServiceAreaNotificationRequest) => {
    if (!request.email) {
      Alert.alert('No Email', 'This request does not have an email address for notification.');
      return;
    }

    Alert.alert(
      'Notify User',
      `Send notification to ${request.name} that delivery service is now available in their area?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Notification',
          onPress: async () => {
            try {
              const { notifyServiceAreaAvailable } = await import('@/services/firebase');
              await notifyServiceAreaAvailable(
                request.id,
                request.email!,
                request.phone,
                request.location.address
              );
              
              // Update local state
              setRequests(prev => 
                prev.map(req => 
                  req.id === request.id 
                    ? { ...req, status: 'resolved', notifiedAt: new Date() }
                    : req
                )
              );
              
              Alert.alert('Success', 'Notification sent successfully!');
            } catch (error) {
              console.error('Error sending notification:', error);
              Alert.alert('Error', 'Failed to send notification');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: ServiceAreaNotificationRequest['status']) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'contacted': return '#007AFF';
      case 'resolved': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: ServiceAreaNotificationRequest['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'contacted': return 'Contacted';
      case 'resolved': return 'Resolved';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Service Area Requests</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Service Area Requests</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Requests</Text>
            <Text style={styles.emptyDescription}>
              No service area notification requests have been submitted yet.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>{request.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                  </View>
                </View>
                <Text style={styles.requestDate}>
                  {request.createdAt.toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.contactInfo}>
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleCall(request.phone)}
                >
                  <Ionicons name="call" size={16} color="#007AFF" />
                  <Text style={styles.contactText}>{request.phone}</Text>
                </TouchableOpacity>
                
                {request.email && (
                  <TouchableOpacity 
                    style={styles.contactItem}
                    onPress={() => handleEmail(request.email!)}
                  >
                    <Ionicons name="mail" size={16} color="#007AFF" />
                    <Text style={styles.contactText}>{request.email}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={styles.locationInfo}
                onPress={() => handleViewLocation(request.location.latitude, request.location.longitude)}
              >
                <Ionicons name="location" size={16} color="#8E8E93" />
                <Text style={styles.locationText}>{request.location.address}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </TouchableOpacity>

              <View style={styles.actionButtons}>
                {request.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.contactButton]}
                    onPress={() => updateRequestStatus(request.id, 'contacted')}
                  >
                    <Text style={styles.actionButtonText}>Mark as Contacted</Text>
                  </TouchableOpacity>
                )}
                
                {request.status === 'contacted' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.resolveButton]}
                      onPress={() => updateRequestStatus(request.id, 'resolved')}
                    >
                      <Text style={styles.actionButtonText}>Mark as Resolved</Text>
                    </TouchableOpacity>
                    
                    {request.email && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.notifyButton]}
                        onPress={() => notifyUserServiceAvailable(request)}
                      >
                        <Text style={styles.actionButtonText}>Notify Service Available</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                
                {request.status === 'resolved' && request.notifiedAt && (
                  <View style={styles.notifiedInfo}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.notifiedText}>
                      Notified on {request.notifiedAt.toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: '#007AFF',
  },
  resolveButton: {
    backgroundColor: '#34C759',
  },
  notifyButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notifiedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  notifiedText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 6,
  },
});