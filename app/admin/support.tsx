import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MessageCircle, Clock, CheckCircle, XCircle, Filter } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { SupportTicket } from '@/types';
import db from '@/db';

const AdminSupportScreen: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    try {
      const allTickets = await db.getAllSupportTickets();
      setTickets(allTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (error) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await db.updateSupportTicket(ticketId, { 
        status: newStatus,
        assignedTo: user?.id 
      });
      await loadTickets();
      Alert.alert('Success', `Ticket status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock size={16} color="#f59e0b" />;
      case 'in_progress':
        return <MessageCircle size={16} color="#48479B" />;
      case 'resolved':
        return <CheckCircle size={16} color="#10b981" />;
      case 'closed':
        return <XCircle size={16} color="#6b7280" />;
      default:
        return <Clock size={16} color="#f59e0b" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#f59e0b';
      case 'in_progress':
        return '#48479B';
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  };

  const renderStatusActions = (ticket: SupportTicket) => (
    <View style={styles.statusActions}>
      {ticket.status !== 'in_progress' && (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: '#48479B' }]}
          onPress={() => handleStatusChange(ticket.id, 'in_progress')}
        >
          <Text style={styles.statusButtonText}>In Progress</Text>
        </TouchableOpacity>
      )}
      {ticket.status !== 'resolved' && (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: '#10b981' }]}
          onPress={() => handleStatusChange(ticket.id, 'resolved')}
        >
          <Text style={styles.statusButtonText}>Resolve</Text>
        </TouchableOpacity>
      )}
      {ticket.status !== 'closed' && (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: '#6b7280' }]}
          onPress={() => handleStatusChange(ticket.id, 'closed')}
        >
          <Text style={styles.statusButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTicketItem = (ticket: SupportTicket) => (
    <View key={ticket.id} style={styles.ticketItem}>
      <TouchableOpacity
        style={styles.ticketContent}
        onPress={() => router.push(`/support/ticket/${ticket.id}` as any)}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketTitleRow}>
            <Text style={styles.ticketSubject} numberOfLines={1}>
              {ticket.subject}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Text style={styles.priorityText}>{ticket.priority.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.ticketMeta}>
            <View style={styles.statusContainer}>
              {getStatusIcon(ticket.status)}
              <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(ticket.updatedAt)}</Text>
          </View>
        </View>
        <Text style={styles.ticketMessage} numberOfLines={2}>
          {ticket.message}
        </Text>
        <Text style={styles.ticketId}>Ticket ID: {ticket.id}</Text>
      </TouchableOpacity>
      {renderStatusActions(ticket)}
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Tickets</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    statusFilter === status && styles.filterOptionActive,
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      statusFilter === status && styles.filterOptionTextActive,
                    ]}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Priority</Text>
            <View style={styles.filterOptions}>
              {['all', 'low', 'medium', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterOption,
                    priorityFilter === priority && styles.filterOptionActive,
                  ]}
                  onPress={() => setPriorityFilter(priority)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      priorityFilter === priority && styles.filterOptionTextActive,
                    ]}
                  >
                    {priority === 'all' ? 'All' : priority.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Admin Support</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Access denied. Admin privileges required.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredTickets = getFilteredTickets();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Support</Text>
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterButton}
        >
          <Filter size={24} color="#48479B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Support Tickets</Text>
            <Text style={styles.emptyText}>
              {tickets.length === 0 
                ? 'No support tickets have been created yet.'
                : 'No tickets match the current filters.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'open').length}</Text>
                <Text style={styles.statLabel}>Open</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'in_progress').length}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'resolved').length}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'closed').length}</Text>
                <Text style={styles.statLabel}>Closed</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>
              Support Tickets ({filteredTickets.length})
            </Text>
            {filteredTickets.map(renderTicketItem)}
          </View>
        )}
      </ScrollView>

      {renderFilterModal()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  ticketsList: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  ticketItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketContent: {
    padding: 16,
  },
  ticketHeader: {
    marginBottom: 8,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  statusActions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterOptionActive: {
    backgroundColor: '#48479B',
    borderColor: '#48479B',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#48479B',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminSupportScreen;