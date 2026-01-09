import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Image,
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
  Image as ImageIcon,
  Link,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react-native';

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mockBanners: Banner[] = [
  {
    id: '1',
    title: 'Summer Special Offer',
    description: 'Get 30% off on all meal plans this summer!',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop',
    linkUrl: '/subscription',
    isActive: true,
    priority: 1,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-15'),
  },
  {
    id: '2',
    title: 'New Menu Launch',
    description: 'Discover our exciting new continental dishes',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop',
    linkUrl: '/categories',
    isActive: true,
    priority: 2,
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-05-10'),
  },
  {
    id: '3',
    title: 'Healthy Living Campaign',
    description: 'Join our healthy eating challenge and win prizes',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop',
    isActive: false,
    priority: 3,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-07-31'),
    createdAt: new Date('2024-05-05'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: '4',
    title: 'Weekend Brunch Special',
    description: 'Exclusive weekend brunch menu available now',
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
    linkUrl: '/meal/brunch-special',
    isActive: true,
    priority: 4,
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01'),
  },
];

export default function BannersManagement() {
  const [banners, setBanners] = useState<Banner[]>(mockBanners);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    priority: '1',
    startDate: '',
    endDate: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      priority: '1',
      startDate: '',
      endDate: '',
    });
  };

  const handleAddBanner = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.imageUrl.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newBanner: Banner = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      imageUrl: formData.imageUrl,
      linkUrl: formData.linkUrl || undefined,
      isActive: true,
      priority: parseInt(formData.priority) || 1,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setBanners(prev => [...prev, newBanner]);
    setShowAddModal(false);
    resetForm();
    Alert.alert('Success', 'Banner added successfully!');
  };

  const handleEditBanner = () => {
    if (!selectedBanner || !formData.title.trim() || !formData.description.trim() || !formData.imageUrl.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedBanner: Banner = {
      ...selectedBanner,
      title: formData.title,
      description: formData.description,
      imageUrl: formData.imageUrl,
      linkUrl: formData.linkUrl || undefined,
      priority: parseInt(formData.priority) || 1,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      updatedAt: new Date(),
    };

    setBanners(prev => prev.map(banner => 
      banner.id === selectedBanner.id ? updatedBanner : banner
    ));
    setShowEditModal(false);
    setSelectedBanner(null);
    resetForm();
    Alert.alert('Success', 'Banner updated successfully!');
  };

  const handleDeleteBanner = (bannerId: string) => {
    Alert.alert(
      'Delete Banner',
      'Are you sure you want to delete this banner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBanners(prev => prev.filter(banner => banner.id !== bannerId));
            Alert.alert('Success', 'Banner deleted successfully!');
          },
        },
      ]
    );
  };

  const handleToggleActive = (bannerId: string) => {
    setBanners(prev => prev.map(banner => 
      banner.id === bannerId 
        ? { ...banner, isActive: !banner.isActive, updatedAt: new Date() }
        : banner
    ));
  };

  const openEditModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      priority: banner.priority.toString(),
      startDate: banner.startDate ? banner.startDate.toISOString().split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.toISOString().split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const openViewModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowViewModal(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderBannerCard = ({ item }: { item: Banner }) => {
    const isExpired = item.endDate && new Date() > item.endDate;
    const isScheduled = item.startDate && new Date() < item.startDate;
    
    return (
      <View style={styles.bannerCard}>
        <View style={styles.bannerImageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
          <View style={styles.bannerOverlay}>
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: item.isActive 
                  ? (isExpired ? '#EF4444' : isScheduled ? '#F59E0B' : '#10B981')
                  : '#6B7280'
              }
            ]}>
              <Text style={styles.statusText}>
                {!item.isActive ? 'INACTIVE' : isExpired ? 'EXPIRED' : isScheduled ? 'SCHEDULED' : 'ACTIVE'}
              </Text>
            </View>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>#{item.priority}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.bannerContent}>
          <View style={styles.bannerHeader}>
            <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: item.isActive ? '#10B981' : '#6B7280' }
              ]}
              onPress={() => handleToggleActive(item.id)}
            >
              {item.isActive ? (
                <ToggleRight size={16} color="white" />
              ) : (
                <ToggleLeft size={16} color="white" />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.bannerDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          {item.linkUrl && (
            <View style={styles.linkContainer}>
              <ExternalLink size={14} color="#48479B" />
              <Text style={styles.linkText} numberOfLines={1}>{item.linkUrl}</Text>
            </View>
          )}
          
          <View style={styles.bannerDates}>
            {item.startDate && (
              <Text style={styles.dateText}>Start: {formatDate(item.startDate)}</Text>
            )}
            {item.endDate && (
              <Text style={styles.dateText}>End: {formatDate(item.endDate)}</Text>
            )}
          </View>
          
          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#48479B' }]}
              onPress={() => openViewModal(item)}
            >
              <Eye size={16} color="white" />
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#10B981' }]}
              onPress={() => openEditModal(item)}
            >
              <Edit size={16} color="white" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleDeleteBanner(item.id)}
            >
              <Trash2 size={16} color="white" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFormModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{isEdit ? 'Edit Banner' : 'Add New Banner'}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (isEdit) {
                setShowEditModal(false);
                setSelectedBanner(null);
              } else {
                setShowAddModal(false);
              }
              resetForm();
            }}
          >
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter banner title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formInput, { height: 80 }]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter banner description"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Image URL *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.imageUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, imageUrl: text }))}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#9CA3AF"
            />
            {formData.imageUrl && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Link URL (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={formData.linkUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, linkUrl: text }))}
              placeholder="/subscription or https://example.com"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Priority</Text>
            <TextInput
              style={styles.formInput}
              value={formData.priority}
              onChangeText={(text) => setFormData(prev => ({ ...prev, priority: text }))}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
            <Text style={styles.formHint}>Lower numbers appear first</Text>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>Start Date (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.startDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.formLabel}>End Date (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.endDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={isEdit ? handleEditBanner : handleAddBanner}
          >
            <Text style={styles.saveButtonText}>{isEdit ? 'Update Banner' : 'Add Banner'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Banners Management</Text>
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
            <Text style={styles.statValue}>{banners.length}</Text>
            <Text style={styles.statLabel}>Total Banners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{banners.filter(b => b.isActive).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{banners.filter(b => !b.isActive).length}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        {/* Banners List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading banners...</Text>
            </View>
          ) : banners.length > 0 ? (
            <FlatList
              data={banners.sort((a, b) => a.priority - b.priority)}
              renderItem={renderBannerCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <ImageIcon size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Banners Found</Text>
              <Text style={styles.emptyDescription}>
                Create your first banner to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={20} color="white" />
                <Text style={styles.emptyButtonText}>Add Banner</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
              <Text style={styles.modalTitle}>Banner Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowViewModal(false);
                  setSelectedBanner(null);
                }}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedBanner && (
                <View>
                  <View style={styles.viewImageContainer}>
                    <Image source={{ uri: selectedBanner.imageUrl }} style={styles.viewImage} />
                    <View style={styles.viewOverlay}>
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor: selectedBanner.isActive 
                            ? (selectedBanner.endDate && new Date() > selectedBanner.endDate ? '#EF4444' : '#10B981')
                            : '#6B7280'
                        }
                      ]}>
                        <Text style={styles.statusText}>
                          {selectedBanner.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.viewDetails}>
                    <Text style={styles.viewTitle}>{selectedBanner.title}</Text>
                    <Text style={styles.viewDescription}>{selectedBanner.description}</Text>
                    
                    {selectedBanner.linkUrl && (
                      <View style={styles.viewRow}>
                        <Text style={styles.viewLabel}>Link URL:</Text>
                        <Text style={styles.viewValue}>{selectedBanner.linkUrl}</Text>
                      </View>
                    )}
                    
                    <View style={styles.viewRow}>
                      <Text style={styles.viewLabel}>Priority:</Text>
                      <Text style={styles.viewValue}>#{selectedBanner.priority}</Text>
                    </View>
                    
                    {selectedBanner.startDate && (
                      <View style={styles.viewRow}>
                        <Text style={styles.viewLabel}>Start Date:</Text>
                        <Text style={styles.viewValue}>{formatDate(selectedBanner.startDate)}</Text>
                      </View>
                    )}
                    
                    {selectedBanner.endDate && (
                      <View style={styles.viewRow}>
                        <Text style={styles.viewLabel}>End Date:</Text>
                        <Text style={styles.viewValue}>{formatDate(selectedBanner.endDate)}</Text>
                      </View>
                    )}
                    
                    <View style={styles.viewRow}>
                      <Text style={styles.viewLabel}>Created:</Text>
                      <Text style={styles.viewValue}>{formatDate(selectedBanner.createdAt)}</Text>
                    </View>
                    
                    <View style={styles.viewRow}>
                      <Text style={styles.viewLabel}>Updated:</Text>
                      <Text style={styles.viewValue}>{formatDate(selectedBanner.updatedAt)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.viewActions}>
                    <TouchableOpacity
                      style={[styles.viewActionButton, { backgroundColor: '#10B981' }]}
                      onPress={() => {
                        setShowViewModal(false);
                        openEditModal(selectedBanner);
                      }}
                    >
                      <Edit size={20} color="white" />
                      <Text style={styles.viewActionText}>Edit Banner</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.viewActionButton, { backgroundColor: '#EF4444' }]}
                      onPress={() => {
                        setShowViewModal(false);
                        handleDeleteBanner(selectedBanner.id);
                      }}
                    >
                      <Trash2 size={20} color="white" />
                      <Text style={styles.viewActionText}>Delete Banner</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  bannerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerImageContainer: {
    position: 'relative',
    height: 200,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  priorityBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  bannerContent: {
    padding: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    marginRight: 12,
  },
  toggleButton: {
    padding: 6,
    borderRadius: 6,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  linkText: {
    fontSize: 12,
    color: '#48479B',
    flex: 1,
  },
  bannerDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    margin: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  formRow: {
    flexDirection: 'row',
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
  formHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  imagePreview: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  saveButton: {
    backgroundColor: '#48479B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewImageContainer: {
    position: 'relative',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  viewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  viewOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  viewDetails: {
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
  viewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  viewDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  viewLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  viewActions: {
    gap: 12,
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