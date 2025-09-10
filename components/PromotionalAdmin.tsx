import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { X, Plus, Edit, Trash2 } from 'lucide-react-native';
import { promotionalSections, PromotionalItem } from '@/constants/data';

interface PromotionalAdminProps {
  visible: boolean;
  onClose: () => void;
}

export default function PromotionalAdmin({ visible, onClose }: PromotionalAdminProps) {
  const [activeSection, setActiveSection] = useState<'festival' | 'weekly'>('festival');
  const [editingItem, setEditingItem] = useState<PromotionalItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const currentSection = promotionalSections[activeSection];

  const handleEditItem = (item: PromotionalItem) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleAddItem = () => {
    const newItem: PromotionalItem = {
      id: `${activeSection}-${Date.now()}`,
      title: '',
      subtitle: '',
      image: '',
      backgroundColor: '#FF6B35',
      textColor: '#FFFFFF',
      icon: '',
      actionType: 'category',
      actionValue: '',
      size: 'medium',
      position: currentSection.items.length + 1,
      isActive: true,
    };
    setEditingItem(newItem);
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!editingItem) return;
    
    // In a real app, this would save to a database
    console.log('Saving promotional item:', editingItem);
    Alert.alert('Success', 'Promotional item saved successfully!');
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this promotional item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would delete from database
            console.log('Deleting item:', itemId);
            Alert.alert('Success', 'Item deleted successfully!');
          },
        },
      ]
    );
  };

  const toggleItemActive = (itemId: string) => {
    // In a real app, this would update the database
    console.log('Toggling active status for item:', itemId);
  };

  const switchActiveSection = (section: 'festival' | 'weekly') => {
    // In a real app, this would update which section is currently active on homepage
    console.log('Switching active promotional section to:', section);
    Alert.alert('Success', `Switched to ${section} promotional section!`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Promotional Sections</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.tab, activeSection === 'festival' && styles.activeTab]}
            onPress={() => setActiveSection('festival')}
          >
            <Text style={[styles.tabText, activeSection === 'festival' && styles.activeTabText]}>
              Festival
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeSection === 'weekly' && styles.activeTab]}
            onPress={() => setActiveSection('weekly')}
          >
            <Text style={[styles.tabText, activeSection === 'weekly' && styles.activeTabText]}>
              Weekly
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{currentSection.title}</Text>
          <TouchableOpacity
            style={styles.activateButton}
            onPress={() => switchActiveSection(activeSection)}
          >
            <Text style={styles.activateButtonText}>Make Active</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.itemsList}>
          {currentSection.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemSize}>{item.size}</Text>
                    <Text style={styles.itemAction}>{item.actionType}</Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => toggleItemActive(item.id)}
                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                    thumbColor={item.isActive ? '#FFFFFF' : '#9CA3AF'}
                  />
                </View>
              </View>
              <View style={styles.itemButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditItem(item)}
                >
                  <Edit size={16} color="#8B5CF6" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add New Item</Text>
        </TouchableOpacity>

        {/* Item Edit Modal */}
        <Modal visible={showItemModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingItem?.id.includes(Date.now().toString()) ? 'Add' : 'Edit'} Promotional Item
              </Text>
              
              <ScrollView style={styles.modalForm}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.title}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, title: text} : null)}
                  placeholder="Enter title"
                />

                <Text style={styles.fieldLabel}>Subtitle</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.subtitle}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, subtitle: text} : null)}
                  placeholder="Enter subtitle (optional)"
                />

                <Text style={styles.fieldLabel}>Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.image}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, image: text} : null)}
                  placeholder="Enter image URL"
                />

                <Text style={styles.fieldLabel}>Background Color</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.backgroundColor}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, backgroundColor: text} : null)}
                  placeholder="#FF6B35"
                />

                <Text style={styles.fieldLabel}>Action Type</Text>
                <View style={styles.actionTypeButtons}>
                  {['category', 'offer', 'meal', 'external'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.actionTypeButton,
                        editingItem?.actionType === type && styles.activeActionType
                      ]}
                      onPress={() => setEditingItem(prev => prev ? {...prev, actionType: type as any} : null)}
                    >
                      <Text style={[
                        styles.actionTypeText,
                        editingItem?.actionType === type && styles.activeActionTypeText
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Action Value</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.actionValue}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, actionValue: text} : null)}
                  placeholder="Category ID, Offer Code, etc."
                />

                <Text style={styles.fieldLabel}>Size</Text>
                <View style={styles.sizeButtons}>
                  {['small', 'medium', 'large'].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeButton,
                        editingItem?.size === size && styles.activeSizeButton
                      ]}
                      onPress={() => setEditingItem(prev => prev ? {...prev, size: size as any} : null)}
                    >
                      <Text style={[
                        styles.sizeButtonText,
                        editingItem?.size === size && styles.activeSizeButtonText
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveItem}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  activateButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  itemsList: {
    flex: 1,
    padding: 20,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  itemSize: {
    fontSize: 12,
    color: '#8B5CF6',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemAction: {
    fontSize: 12,
    color: '#10B981',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemActions: {
    alignItems: 'center',
  },
  itemButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: {
    maxHeight: 400,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  actionTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeActionType: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  actionTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeActionTypeText: {
    color: 'white',
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeSizeButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeSizeButtonText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});