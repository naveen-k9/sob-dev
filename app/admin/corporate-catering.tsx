import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  FileText,
  X,
  Check,
  Send,
  Eye,
  Search,
} from 'lucide-react-native';
import { router } from 'expo-router';

interface CateringRequest {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  numberOfEmployees: string;
  mealType: string;
  frequency: string;
  startDate: string;
  specialRequirements: string;
  status: 'pending' | 'quotation_sent' | 'approved' | 'rejected';
  quotationAmount?: number;
  quotationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminCorporateCateringScreen() {
  const [requests, setRequests] = useState<CateringRequest[]>([
    {
      id: '1',
      companyName: 'Tech Solutions Pvt Ltd',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh@techsolutions.com',
      phone: '9876543210',
      numberOfEmployees: '50-75',
      mealType: 'Lunch',
      frequency: 'Daily',
      startDate: '15/01/2024',
      specialRequirements: 'Vegetarian options required for 30% of employees. No onion/garlic.',
      status: 'pending',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: '2',
      companyName: 'Marketing Hub',
      contactPerson: 'Priya Sharma',
      email: 'priya@marketinghub.in',
      phone: '9123456789',
      numberOfEmployees: '25-30',
      mealType: 'All Meals',
      frequency: 'Weekly (5 days)',
      startDate: '20/01/2024',
      specialRequirements: 'Healthy options preferred. Some employees have diabetes.',
      status: 'quotation_sent',
      quotationAmount: 45000,
      quotationNotes: 'Includes breakfast, lunch, and evening snacks for 25 employees.',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-12'),
    },
    {
      id: '3',
      companyName: 'Creative Agency',
      contactPerson: 'Amit Patel',
      email: 'amit@creativeagency.com',
      phone: '9988776655',
      numberOfEmployees: '15-20',
      mealType: 'Snacks',
      frequency: 'Event-based',
      startDate: '25/01/2024',
      specialRequirements: 'Client meeting catering. Premium presentation required.',
      status: 'approved',
      quotationAmount: 12000,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-14'),
    },
  ]);

  const [filteredRequests, setFilteredRequests] = useState<CateringRequest[]>(requests);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CateringRequest | null>(null);
  const [quotationAmount, setQuotationAmount] = useState<string>('');
  const [quotationNotes, setQuotationNotes] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    filterRequests();
  }, [selectedStatus, searchQuery, requests]);

  const filterRequests = () => {
    let filtered = requests;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(req => req.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(req => 
        req.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'quotation_sent': return '#3B82F6';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'quotation_sent': return 'Quotation Sent';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const handleSendQuotation = (request: CateringRequest) => {
    setSelectedRequest(request);
    setQuotationAmount(request.quotationAmount?.toString() || '');
    setQuotationNotes(request.quotationNotes || '');
    setShowQuotationModal(true);
  };

  const submitQuotation = async () => {
    if (!selectedRequest || !quotationAmount.trim()) {
      Alert.alert('Error', 'Please enter quotation amount');
      return;
    }

    try {
      const updatedRequests = requests.map(req => 
        req.id === selectedRequest.id 
          ? {
              ...req,
              status: 'quotation_sent' as const,
              quotationAmount: parseFloat(quotationAmount),
              quotationNotes: quotationNotes.trim(),
              updatedAt: new Date(),
            }
          : req
      );

      setRequests(updatedRequests);
      setShowQuotationModal(false);
      setSelectedRequest(null);
      setQuotationAmount('');
      setQuotationNotes('');

      Alert.alert('Success', 'Quotation sent successfully!');
      console.log('Quotation sent for request:', selectedRequest.id);
    } catch (error) {
      console.error('Error sending quotation:', error);
      Alert.alert('Error', 'Failed to send quotation');
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: CateringRequest['status']) => {
    try {
      const updatedRequests = requests.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus, updatedAt: new Date() }
          : req
      );

      setRequests(updatedRequests);
      
      Alert.alert('Success', `Request status updated to ${getStatusText(newStatus)}`);
      console.log(`Request ${requestId} status updated to:`, newStatus);
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const handleViewDetails = (request: CateringRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const renderRequestCard = ({ item }: { item: CateringRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.companyName}>{item.companyName}</Text>
          <Text style={styles.contactPerson}>{item.contactPerson}</Text>
          <Text style={styles.requestId}>ID: #{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Users size={16} color="#9CA3AF" />
          <Text style={styles.detailText}>{item.numberOfEmployees} employees</Text>
        </View>
        <View style={styles.detailRow}>
          <FileText size={16} color="#9CA3AF" />
          <Text style={styles.detailText}>{item.mealType} • {item.frequency}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#9CA3AF" />
          <Text style={styles.detailText}>Start: {item.startDate}</Text>
        </View>
        {item.quotationAmount && (
          <View style={styles.detailRow}>
            <Text style={styles.quotationAmount}>₹{item.quotationAmount.toLocaleString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewDetails(item)}
        >
          <Eye size={16} color="white" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>

        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.quotationButton}
            onPress={() => handleSendQuotation(item)}
          >
            <Send size={16} color="white" />
            <Text style={styles.quotationButtonText}>Send Quote</Text>
          </TouchableOpacity>
        )}

        {item.status === 'quotation_sent' && (
          <>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => updateRequestStatus(item.id, 'approved')}
            >
              <Check size={16} color="white" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => updateRequestStatus(item.id, 'rejected')}
            >
              <X size={16} color="white" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === 'approved' && (
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => {
              Alert.alert(
                'Move to Meal Scheduling',
                `Move ${item.companyName} to meal scheduling system?`,
                [
                  { text: 'Cancel' },
                  { 
                    text: 'Move', 
                    onPress: () => {
                      console.log('Moving to meal scheduling:', item.id);
                      Alert.alert('Success', 'Request moved to meal scheduling system');
                    }
                  }
                ]
              );
            }}
          >
            <Calendar size={16} color="white" />
            <Text style={styles.scheduleButtonText}>Schedule</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const statusFilters = [
    { key: 'all', label: 'All', count: requests.length },
    { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { key: 'quotation_sent', label: 'Quoted', count: requests.filter(r => r.status === 'quotation_sent').length },
    { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Corporate Catering</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{requests.length}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{requests.filter(r => r.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{requests.filter(r => r.status === 'approved').length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by company or contact..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilters}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedStatus === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedStatus(filter.key)}
            >
              <Text style={[
                styles.filterText,
                selectedStatus === filter.key && styles.filterTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequestCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Building2 size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptyDescription}>
              {selectedStatus === 'all' 
                ? 'No corporate catering requests yet.'
                : `No ${getStatusText(selectedStatus).toLowerCase()} requests found.`
              }
            </Text>
          </View>
        )}
      />

      {/* Quotation Modal */}
      <Modal
        visible={showQuotationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Quotation</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQuotationModal(false)}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.requestSummary}>
                  <Text style={styles.summaryTitle}>Request Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Company:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.companyName}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Contact:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.contactPerson}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Employees:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.numberOfEmployees}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Requirements:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.mealType} • {selectedRequest.frequency}</Text>
                  </View>
                </View>

                <View style={styles.quotationForm}>
                  <Text style={styles.formTitle}>Quotation Details</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Quotation Amount (₹) *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={quotationAmount}
                      onChangeText={setQuotationAmount}
                      placeholder="Enter quotation amount"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes & Details</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={quotationNotes}
                      onChangeText={setQuotationNotes}
                      placeholder="Add quotation details, terms, or special notes..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.sendQuotationButton}
                    onPress={submitQuotation}
                  >
                    <Send size={20} color="white" />
                    <Text style={styles.sendQuotationText}>Send Quotation</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Company Information</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Company Name</Text>
                      <Text style={styles.detailValue}>{selectedRequest.companyName}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Contact Person</Text>
                      <Text style={styles.detailValue}>{selectedRequest.contactPerson}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{selectedRequest.email}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{selectedRequest.phone}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Catering Requirements</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Number of Employees</Text>
                      <Text style={styles.detailValue}>{selectedRequest.numberOfEmployees}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Meal Type</Text>
                      <Text style={styles.detailValue}>{selectedRequest.mealType}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Frequency</Text>
                      <Text style={styles.detailValue}>{selectedRequest.frequency}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Start Date</Text>
                      <Text style={styles.detailValue}>{selectedRequest.startDate}</Text>
                    </View>
                  </View>
                  
                  {selectedRequest.specialRequirements && (
                    <View style={styles.specialRequirements}>
                      <Text style={styles.detailLabel}>Special Requirements</Text>
                      <Text style={styles.requirementsText}>{selectedRequest.specialRequirements}</Text>
                    </View>
                  )}
                </View>

                {selectedRequest.quotationAmount && (
                  <View style={styles.quotationSection}>
                    <Text style={styles.detailsSectionTitle}>Quotation Details</Text>
                    <View style={styles.quotationInfo}>
                      <Text style={styles.quotationAmountLarge}>₹{selectedRequest.quotationAmount.toLocaleString()}</Text>
                      {selectedRequest.quotationNotes && (
                        <Text style={styles.quotationNotesText}>{selectedRequest.quotationNotes}</Text>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.statusActions}>
                  <Text style={styles.statusActionsTitle}>Update Status</Text>
                  <View style={styles.statusButtons}>
                    {selectedRequest.status !== 'approved' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#10B981' }]}
                        onPress={() => {
                          updateRequestStatus(selectedRequest.id, 'approved');
                          setShowDetailsModal(false);
                        }}
                      >
                        <Check size={16} color="white" />
                        <Text style={styles.statusButtonText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    {selectedRequest.status !== 'rejected' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#EF4444' }]}
                        onPress={() => {
                          updateRequestStatus(selectedRequest.id, 'rejected');
                          setShowDetailsModal(false);
                        }}
                      >
                        <X size={16} color="white" />
                        <Text style={styles.statusButtonText}>Reject</Text>
                      </TouchableOpacity>
                    )}
                    {selectedRequest.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#3B82F6' }]}
                        onPress={() => {
                          setShowDetailsModal(false);
                          handleSendQuotation(selectedRequest);
                        }}
                      >
                        <Send size={16} color="white" />
                        <Text style={styles.statusButtonText}>Send Quote</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  statusFilters: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  contactPerson: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  requestId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  quotationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quotationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  quotationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  requestSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  quotationForm: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  sendQuotationButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  sendQuotationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  specialRequirements: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  requirementsText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  quotationSection: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quotationInfo: {
    alignItems: 'center',
  },
  quotationAmountLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  quotationNotesText: {
    fontSize: 14,
    color: '#4338CA',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusActions: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    minWidth: 100,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});