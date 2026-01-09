import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { ChevronDown, X, User, Shield, ChefHat, Truck } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
interface RoleSelectorProps {
  currentRole: 'user' | 'admin' | 'kitchen' | 'delivery';
}

const roles = [
  {
    id: 'user' as const,
    name: 'User',
    icon: User,
    route: '/(tabs)',
    color: '#48479B',
    description: 'Customer dashboard'
  },
  {
    id: 'admin' as const,
    name: 'Admin',
    icon: Shield,
    route: '/admin/dashboard',
    color: '#EF4444',
    description: 'Admin management panel'
  },
  {
    id: 'kitchen' as const,
    name: 'Kitchen',
    icon: ChefHat,
    route: '/kitchen/dashboard',
    color: '#10B981',
    description: 'Kitchen staff dashboard'
  },
  {
    id: 'delivery' as const,
    name: 'Delivery',
    icon: Truck,
    route: '/delivery/dashboard',
    color: '#F59E0B',
    description: 'Delivery partner dashboard'
  },
];

export default function RoleSelector({ currentRole }: RoleSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const currentRoleData = roles.find(role => role.id === currentRole);
  const CurrentIcon = currentRoleData?.icon || User;

  const handleRoleSelect = (roleId: string, route: string) => {
    setShowModal(false);
    console.log(`Switching to ${roleId} role`);
    router.push(route as any);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, { borderColor: currentRoleData?.color }]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.selectorContent}>
          <View style={[styles.iconContainer, { backgroundColor: currentRoleData?.color }]}>
            <CurrentIcon size={16} color="white" />
          </View>
          <Text style={styles.selectorText}>{currentRoleData?.name}</Text>
          <ChevronDown size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Switch Role</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Select a role to navigate to its dashboard. This is for testing and development purposes.
            </Text>
            
            {roles.map((role) => {
              const RoleIcon = role.icon;
              const isSelected = role.id === currentRole;
              
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    isSelected && styles.selectedRoleCard,
                    { borderLeftColor: role.color }
                  ]}
                  onPress={() => handleRoleSelect(role.id, role.route)}
                  disabled={isSelected}
                >
                  <View style={styles.roleCardContent}>
                    <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
                      <RoleIcon size={20} color="white" />
                    </View>
                    <View style={styles.roleInfo}>
                      <Text style={[
                        styles.roleName,
                        isSelected && styles.selectedRoleName
                      ]}>
                        {role.name}
                      </Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorText: {
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
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRoleCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#48479B',
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedRoleName: {
    color: '#1D4ED8',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});