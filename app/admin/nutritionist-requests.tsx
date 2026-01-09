import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  Phone,
  Mail,
  MessageSquare,
  Paperclip,
  Send,
  Filter,
} from 'lucide-react-native';

type RequestStatus = 'pending' | 'contacted' | 'completed';
type ContactMethod = 'phone' | 'email' | 'whatsapp';
type MealPreference = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'jain';
type HealthGoal = 'weight-loss' | 'weight-gain' | 'muscle-building' | 'diabetes-management' | 'heart-health' | 'general-wellness';

interface NutritionistRequest {
  id: string;
  name: string;
  age: string;
  weight: string;
  height: string;
  email: string;
  phone: string;
  mealPreference: MealPreference;
  healthGoals: HealthGoal[];
  contactMethod: ContactMethod;
  medicalConditions: string;
  currentDiet: string;
  additionalNotes: string;
  status: RequestStatus;
  assignedNutritionist?: string;
  createdAt: Date;
  contactedAt?: Date;
  completedAt?: Date;
  dietPlan?: string;
}

// Mock data
const mockRequests: NutritionistRequest[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    age: '28',
    weight: '65',
    height: '165',
    email: 'priya.sharma@email.com',
    phone: '+91 9876543210',
    mealPreference: 'vegetarian',
    healthGoals: ['weight-loss', 'general-wellness'],
    contactMethod: 'phone',
    medicalConditions: 'Thyroid, PCOD',
    currentDiet: 'Regular home food, occasional outside meals',
    additionalNotes: 'Looking for sustainable weight loss plan',
    status: 'pending',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    age: '35',
    weight: '80',
    height: '175',
    email: 'rahul.kumar@email.com',
    phone: '+91 9876543211',
    mealPreference: 'non-vegetarian',
    healthGoals: ['muscle-building', 'weight-gain'],
    contactMethod: 'whatsapp',
    medicalConditions: 'None',
    currentDiet: 'High protein diet with supplements',
    additionalNotes: 'Want to gain lean muscle mass',
    status: 'contacted',
    assignedNutritionist: 'Dr. Anjali Mehta',
    createdAt: new Date('2024-01-14'),
    contactedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'Sneha Patel',
    age: '42',
    weight: '70',
    height: '160',
    email: 'sneha.patel@email.com',
    phone: '+91 9876543212',
    mealPreference: 'vegan',
    healthGoals: ['diabetes-management', 'heart-health'],
    contactMethod: 'email',
    medicalConditions: 'Type 2 Diabetes, High BP',
    currentDiet: 'Strict vegan diet',
    additionalNotes: 'Need help managing blood sugar levels',
    status: 'completed',
    assignedNutritionist: 'Dr. Rajesh Singh',
    createdAt: new Date('2024-01-10'),
    contactedAt: new Date('2024-01-11'),
    completedAt: new Date('2024-01-13'),
    dietPlan: 'Custom diabetic-friendly vegan meal plan attached',
  },
];

const nutritionists = [
  'Dr. Anjali Mehta',
  'Dr. Rajesh Singh',
  'Dr. Kavita Sharma',
  'Dr. Amit Gupta',
  'Dr. Priya Jain',
];

export default function AdminNutritionistRequestsScreen() {
  const [requests, setRequests] = useState<NutritionistRequest[]>(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<NutritionistRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');

  const [dietPlanNotes, setDietPlanNotes] = useState('');

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'contacted': return '#48479B';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return Clock;
      case 'contacted': return UserCheck;
      case 'completed': return CheckCircle;
      default: return XCircle;
    }
  };

  const getContactMethodIcon = (method: ContactMethod) => {
    switch (method) {
      case 'phone': return Phone;
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      default: return Phone;
    }
  };

  const filteredRequests = requests.filter(request => 
    filterStatus === 'all' || request.status === filterStatus
  );

  const handleStatusUpdate = (requestId: string, newStatus: RequestStatus) => {
    setRequests(prev => prev.map(request => {
      if (request.id === requestId) {
        const updatedRequest = { ...request, status: newStatus };
        if (newStatus === 'contacted' && !request.contactedAt) {
          updatedRequest.contactedAt = new Date();
        }
        if (newStatus === 'completed' && !request.completedAt) {
          updatedRequest.completedAt = new Date();
        }
        return updatedRequest;
      }
      return request;
    }));
  };

  const handleAssignNutritionist = (requestId: string, nutritionist: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, assignedNutritionist: nutritionist }
        : request
    ));
  };

  const handleAddDietPlan = (requestId: string, notes: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, dietPlan: notes }
        : request
    ));
    setDietPlanNotes('');
    Alert.alert('Success', 'Diet plan notes added successfully');
  };

  const renderRequestCard = ({ item }: { item: NutritionistRequest }) => {
    const StatusIcon = getStatusIcon(item.status);
    const ContactIcon = getContactMethodIcon(item.contactMethod);

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{item.name}</Text>
            <Text style={styles.requestAge}>Age: {item.age} • Weight: {item.weight}kg</Text>
            <View style={styles.contactInfo}>
              <ContactIcon size={14} color="#666" />
              <Text style={styles.contactText}>{item.contactMethod}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <StatusIcon size={12} color="white" />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <Text style={styles.healthGoals}>
            Goals: {item.healthGoals.map(goal => goal.replace('-', ' ')).join(', ')}
          </Text>
          <Text style={styles.mealPreference}>
            Diet: {item.mealPreference.charAt(0).toUpperCase() + item.mealPreference.slice(1)}
          </Text>
          {item.assignedNutritionist && (
            <Text style={styles.assignedTo}>
              Assigned to: {item.assignedNutritionist}
            </Text>
          )}
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedRequest(item);
              setShowDetailModal(true);
            }}
          >
            <Eye size={16} color="#48479B" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>

          <View style={styles.statusActions}>
            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusUpdate(item.id, 'contacted')}
              >
                <Text style={styles.actionButtonText}>Mark Contacted</Text>
              </TouchableOpacity>
            )}
            {item.status === 'contacted' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleStatusUpdate(item.id, 'completed')}
              >
                <Text style={[styles.actionButtonText, styles.completeButtonText]}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedRequest) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <XCircle size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Request Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Personal Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Personal Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedRequest.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age:</Text>
                <Text style={styles.detailValue}>{selectedRequest.age} years</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight:</Text>
                <Text style={styles.detailValue}>{selectedRequest.weight} kg</Text>
              </View>
              {selectedRequest.height && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Height:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.height} cm</Text>
                </View>
              )}
            </View>

            {/* Contact Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Contact Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedRequest.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedRequest.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Preferred Contact:</Text>
                <Text style={styles.detailValue}>{selectedRequest.contactMethod}</Text>
              </View>
            </View>

            {/* Health Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Health Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Meal Preference:</Text>
                <Text style={styles.detailValue}>{selectedRequest.mealPreference}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Health Goals:</Text>
                <Text style={styles.detailValue}>
                  {selectedRequest.healthGoals.map(goal => goal.replace('-', ' ')).join(', ')}
                </Text>
              </View>
              {selectedRequest.medicalConditions && (
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Medical Conditions:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.medicalConditions}</Text>
                </View>
              )}
              {selectedRequest.currentDiet && (
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Current Diet:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.currentDiet}</Text>
                </View>
              )}
              {selectedRequest.additionalNotes && (
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Additional Notes:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.additionalNotes}</Text>
                </View>
              )}
            </View>

            {/* Assignment */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Assignment</Text>
              <View style={styles.assignmentContainer}>
                <Text style={styles.detailLabel}>Assign Nutritionist:</Text>
                <View style={styles.nutritionistButtons}>
                  {nutritionists.map((nutritionist) => (
                    <TouchableOpacity
                      key={nutritionist}
                      style={[
                        styles.nutritionistButton,
                        selectedRequest.assignedNutritionist === nutritionist && styles.selectedNutritionist
                      ]}
                      onPress={() => handleAssignNutritionist(selectedRequest.id, nutritionist)}
                    >
                      <Text style={[
                        styles.nutritionistButtonText,
                        selectedRequest.assignedNutritionist === nutritionist && styles.selectedNutritionistText
                      ]}>
                        {nutritionist}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Diet Plan */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Diet Plan & Notes</Text>
              {selectedRequest.dietPlan && (
                <View style={styles.existingPlan}>
                  <Text style={styles.detailLabel}>Current Plan:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.dietPlan}</Text>
                </View>
              )}
              <View style={styles.dietPlanInput}>
                <TextInput
                  style={styles.textArea}
                  value={dietPlanNotes}
                  onChangeText={setDietPlanNotes}
                  placeholder="Add diet plan notes or attach files..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={() => Alert.alert('Info', 'File attachment feature would be implemented here')}
                >
                  <Paperclip size={20} color="#48479B" />
                  <Text style={styles.attachButtonText}>Attach Files</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sendPlanButton}
                  onPress={() => handleAddDietPlan(selectedRequest.id, dietPlanNotes)}
                  disabled={!dietPlanNotes.trim()}
                >
                  <Send size={16} color="white" />
                  <Text style={styles.sendPlanButtonText}>Send Diet Plan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Updates */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Status Updates</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[styles.statusUpdateButton, { backgroundColor: '#F59E0B' }]}
                  onPress={() => handleStatusUpdate(selectedRequest.id, 'pending')}
                >
                  <Text style={styles.statusUpdateText}>Mark Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusUpdateButton, { backgroundColor: '#48479B' }]}
                  onPress={() => handleStatusUpdate(selectedRequest.id, 'contacted')}
                >
                  <Text style={styles.statusUpdateText}>Mark Contacted</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusUpdateButton, { backgroundColor: '#10B981' }]}
                  onPress={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                >
                  <Text style={styles.statusUpdateText}>Mark Completed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nutritionist Requests',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#8B5CF6" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{requests.filter(r => r.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{requests.filter(r => r.status === 'contacted').length}</Text>
            <Text style={styles.statLabel}>Contacted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{requests.filter(r => r.status === 'completed').length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <Filter size={20} color="#666" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['all', 'pending', 'contacted', 'completed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.activeFilterButton
                ]}
                onPress={() => setFilterStatus(status as RequestStatus | 'all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.activeFilterButtonText
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderRequestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color="#DDD" />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptyDescription}>
              No nutritionist consultation requests match the current filter.
            </Text>
          </View>
        }
      />

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterScroll: {
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#8B5CF6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  requestDetails: {
    marginBottom: 12,
  },
  healthGoals: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  mealPreference: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assignedTo: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#48479B',
    fontWeight: '500',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#48479B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  completeButtonText: {
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailColumn: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textTransform: 'capitalize',
  },
  assignmentContainer: {
    gap: 12,
  },
  nutritionistButtons: {
    gap: 8,
  },
  nutritionistButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedNutritionist: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  nutritionistButtonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectedNutritionistText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  existingPlan: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dietPlanInput: {
    gap: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#48479B',
    gap: 8,
  },
  attachButtonText: {
    color: '#48479B',
    fontSize: 14,
    fontWeight: '500',
  },
  sendPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendPlanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusUpdateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusUpdateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});