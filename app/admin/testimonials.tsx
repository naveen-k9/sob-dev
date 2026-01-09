import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Star,
  User,
  MessageSquare,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';

interface Testimonial {
  id: string;
  customerName: string;
  customerImage?: string;
  rating: number;
  review: string;
  date: string;
  isActive: boolean;
  isVerified: boolean;
  planType?: string;
  location?: string;
}

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    {
      id: '1',
      customerName: 'Priya Sharma',
      rating: 5,
      review: 'Amazing food quality and timely delivery! The 26-day plan has been perfect for my busy schedule. Highly recommend to everyone.',
      date: '2024-01-15',
      isActive: true,
      isVerified: true,
      planType: '26 Day Plan',
      location: 'Mumbai',
    },
    {
      id: '2',
      customerName: 'Rahul Kumar',
      rating: 4,
      review: 'Great variety of meals and healthy options. The delivery is always on time and the packaging is excellent.',
      date: '2024-01-12',
      isActive: true,
      isVerified: true,
      planType: '15 Day Plan',
      location: 'Delhi',
    },
    {
      id: '3',
      customerName: 'Sneha Patel',
      rating: 5,
      review: 'Best meal subscription service in the city! Fresh ingredients, delicious taste, and affordable prices.',
      date: '2024-01-10',
      isActive: false,
      isVerified: false,
      planType: '6 Day Plan',
      location: 'Bangalore',
    },
    {
      id: '4',
      customerName: 'Amit Singh',
      rating: 4,
      review: 'Very satisfied with the service. The meals are nutritious and taste great. Customer support is also very responsive.',
      date: '2024-01-08',
      isActive: true,
      isVerified: true,
      planType: '26 Day Plan',
      location: 'Pune',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    review: '',
    planType: '',
    location: '',
    isActive: true,
    isVerified: true,
  });

  const resetForm = () => {
    setFormData({
      customerName: '',
      rating: 5,
      review: '',
      planType: '',
      location: '',
      isActive: true,
      isVerified: true,
    });
  };

  const handleAdd = () => {
    if (!formData.customerName.trim() || !formData.review.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      rating: formData.rating,
      review: formData.review,
      date: new Date().toISOString().split('T')[0],
      isActive: formData.isActive,
      isVerified: formData.isVerified,
      planType: formData.planType,
      location: formData.location,
    };

    setTestimonials(prev => [newTestimonial, ...prev]);
    setShowAddModal(false);
    resetForm();
    Alert.alert('Success', 'Testimonial added successfully!');
  };

  const handleEdit = () => {
    if (!selectedTestimonial || !formData.customerName.trim() || !formData.review.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedTestimonial: Testimonial = {
      ...selectedTestimonial,
      customerName: formData.customerName,
      rating: formData.rating,
      review: formData.review,
      planType: formData.planType,
      location: formData.location,
      isActive: formData.isActive,
      isVerified: formData.isVerified,
    };

    setTestimonials(prev => 
      prev.map(item => item.id === selectedTestimonial.id ? updatedTestimonial : item)
    );
    setShowEditModal(false);
    setSelectedTestimonial(null);
    resetForm();
    Alert.alert('Success', 'Testimonial updated successfully!');
  };

  const handleDelete = (testimonial: Testimonial) => {
    Alert.alert(
      'Delete Testimonial',
      `Are you sure you want to delete the testimonial by ${testimonial.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTestimonials(prev => prev.filter(item => item.id !== testimonial.id));
            Alert.alert('Success', 'Testimonial deleted successfully!');
          },
        },
      ]
    );
  };

  const handleToggleStatus = (testimonial: Testimonial) => {
    const updatedTestimonial = { ...testimonial, isActive: !testimonial.isActive };
    setTestimonials(prev => 
      prev.map(item => item.id === testimonial.id ? updatedTestimonial : item)
    );
    Alert.alert(
      'Status Updated',
      `Testimonial ${updatedTestimonial.isActive ? 'activated' : 'deactivated'} successfully!`
    );
  };

  const handleToggleVerification = (testimonial: Testimonial) => {
    const updatedTestimonial = { ...testimonial, isVerified: !testimonial.isVerified };
    setTestimonials(prev => 
      prev.map(item => item.id === testimonial.id ? updatedTestimonial : item)
    );
    Alert.alert(
      'Verification Updated',
      `Testimonial ${updatedTestimonial.isVerified ? 'verified' : 'unverified'} successfully!`
    );
  };

  const openEditModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setFormData({
      customerName: testimonial.customerName,
      rating: testimonial.rating,
      review: testimonial.review,
      planType: testimonial.planType || '',
      location: testimonial.location || '',
      isActive: testimonial.isActive,
      isVerified: testimonial.isVerified,
    });
    setShowEditModal(true);
  };

  const openViewModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowViewModal(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        color={index < rating ? '#F59E0B' : '#E5E7EB'}
        fill={index < rating ? '#F59E0B' : 'transparent'}
      />
    ));
  };

  const renderTestimonialCard = ({ item }: { item: Testimonial }) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    return (
      <View style={styles.testimonialCard}>
        <View style={styles.testimonialHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <User size={20} color="#6B7280" />
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <View style={styles.ratingContainer}>
                {renderStars(item.rating)}
                <Text style={styles.ratingText}>({item.rating}/5)</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusBadges}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? '#10B981' : '#6B7280' }
            ]}>
              <Text style={styles.statusText}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {item.isVerified && (
              <View style={[styles.statusBadge, { backgroundColor: '#48479B' }]}>
                <Text style={styles.statusText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.reviewText} numberOfLines={3}>
          {item.review}
        </Text>

        <View style={styles.testimonialMeta}>
          <View style={styles.metaInfo}>
            {item.planType && (
              <Text style={styles.metaText}>📦 {item.planType}</Text>
            )}
            {item.location && (
              <Text style={styles.metaText}>📍 {item.location}</Text>
            )}
            <Text style={styles.metaText}>📅 {formatDate(item.date)}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#48479B' }]}
            onPress={() => openViewModal(item)}
          >
            <Eye size={16} color="white" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => openEditModal(item)}
          >
            <Edit size={16} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: item.isActive ? '#EF4444' : '#10B981' }
            ]}
            onPress={() => handleToggleStatus(item)}
          >
            {item.isActive ? (
              <ToggleRight size={16} color="white" />
            ) : (
              <ToggleLeft size={16} color="white" />
            )}
            <Text style={styles.actionButtonText}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color="white" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFormModal = (isEdit: boolean) => {
    const isVisible = isEdit ? showEditModal : showAddModal;
    const onClose = () => {
      if (isEdit) {
        setShowEditModal(false);
        setSelectedTestimonial(null);
      } else {
        setShowAddModal(false);
      }
      resetForm();
    };
    const onSubmit = isEdit ? handleEdit : handleAdd;
    const title = isEdit ? 'Edit Testimonial' : 'Add New Testimonial';

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Customer Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.customerName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, customerName: text }))}
                placeholder="Enter customer name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Rating *</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      formData.rating >= rating && styles.ratingButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, rating }))}
                  >
                    <Star
                      size={24}
                      color={formData.rating >= rating ? '#F59E0B' : '#E5E7EB'}
                      fill={formData.rating >= rating ? '#F59E0B' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Review *</Text>
              <TextInput
                style={[styles.formInput, { height: 100 }]}
                value={formData.review}
                onChangeText={(text) => setFormData(prev => ({ ...prev, review: text }))}
                placeholder="Enter customer review"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Plan Type</Text>
              <TextInput
                style={styles.formInput}
                value={formData.planType}
                onChangeText={(text) => setFormData(prev => ({ ...prev, planType: text }))}
                placeholder="e.g., 26 Day Plan"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="e.g., Mumbai"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.toggleSection}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Active Status</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    formData.isActive && styles.toggleButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                >
                  {formData.isActive ? (
                    <ToggleRight size={24} color="#10B981" />
                  ) : (
                    <ToggleLeft size={24} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Verified Status</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    formData.isVerified && styles.toggleButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, isVerified: !prev.isVerified }))}
                >
                  {formData.isVerified ? (
                    <ToggleRight size={24} color="#48479B" />
                  ) : (
                    <ToggleLeft size={24} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Testimonial' : 'Add Testimonial'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Testimonials Management</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{testimonials.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {testimonials.filter(t => t.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {testimonials.filter(t => t.isVerified).length}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length || 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Testimonials List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>All Testimonials ({testimonials.length})</Text>
          
          {testimonials.length > 0 ? (
            <FlatList
              data={testimonials}
              renderItem={renderTestimonialCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Testimonials Found</Text>
              <Text style={styles.emptyDescription}>
                Add your first testimonial to get started.
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Add/Edit Modal */}
      {renderFormModal(false)}
      {renderFormModal(true)}

      {/* View Modal */}
      <Modal
        visible={showViewModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Testimonial Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowViewModal(false);
                setSelectedTestimonial(null);
              }}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedTestimonial && (
              <View>
                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Customer Name</Text>
                  <Text style={styles.viewValue}>{selectedTestimonial.customerName}</Text>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Rating</Text>
                  <View style={styles.viewRating}>
                    {renderStars(selectedTestimonial.rating)}
                    <Text style={styles.viewRatingText}>({selectedTestimonial.rating}/5)</Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Review</Text>
                  <Text style={styles.viewReview}>{selectedTestimonial.review}</Text>
                </View>

                {selectedTestimonial.planType && (
                  <View style={styles.viewSection}>
                    <Text style={styles.viewLabel}>Plan Type</Text>
                    <Text style={styles.viewValue}>{selectedTestimonial.planType}</Text>
                  </View>
                )}

                {selectedTestimonial.location && (
                  <View style={styles.viewSection}>
                    <Text style={styles.viewLabel}>Location</Text>
                    <Text style={styles.viewValue}>{selectedTestimonial.location}</Text>
                  </View>
                )}

                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Date</Text>
                  <Text style={styles.viewValue}>
                    {new Date(selectedTestimonial.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Status</Text>
                  <View style={styles.viewStatusContainer}>
                    <View style={[
                      styles.viewStatusBadge,
                      { backgroundColor: selectedTestimonial.isActive ? '#10B981' : '#6B7280' }
                    ]}>
                      <Text style={styles.viewStatusText}>
                        {selectedTestimonial.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <View style={[
                      styles.viewStatusBadge,
                      { backgroundColor: selectedTestimonial.isVerified ? '#48479B' : '#6B7280' }
                    ]}>
                      <Text style={styles.viewStatusText}>
                        {selectedTestimonial.isVerified ? 'Verified' : 'Unverified'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.viewActions}>
                  <TouchableOpacity
                    style={[styles.viewActionButton, { backgroundColor: '#F59E0B' }]}
                    onPress={() => {
                      setShowViewModal(false);
                      openEditModal(selectedTestimonial);
                    }}
                  >
                    <Edit size={20} color="white" />
                    <Text style={styles.viewActionText}>Edit Testimonial</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.viewActionButton,
                      { backgroundColor: selectedTestimonial.isVerified ? '#EF4444' : '#10B981' }
                    ]}
                    onPress={() => {
                      handleToggleVerification(selectedTestimonial);
                      setShowViewModal(false);
                    }}
                  >
                    {selectedTestimonial.isVerified ? (
                      <ToggleLeft size={20} color="white" />
                    ) : (
                      <ToggleRight size={20} color="white" />
                    )}
                    <Text style={styles.viewActionText}>
                      {selectedTestimonial.isVerified ? 'Unverify' : 'Verify'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  testimonialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  reviewText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 12,
  },
  testimonialMeta: {
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
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
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: 'white',
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  ratingButtonActive: {
    backgroundColor: '#FEF3C7',
  },
  toggleSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  toggleButton: {
    padding: 4,
  },
  toggleButtonActive: {
    // Active state handled by icon color
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  viewValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  viewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewRatingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  viewReview: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  viewStatusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  viewActions: {
    gap: 12,
    marginTop: 20,
  },
  viewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  viewActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});