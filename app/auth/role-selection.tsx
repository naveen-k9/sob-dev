import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { UserRole } from '@/types';
import { User, Shield, ChefHat, Truck } from 'lucide-react-native';



const roles = [
  {
    id: 'customer' as UserRole,
    title: 'Customer',
    description: 'Order delicious meals',
    icon: User,
    color: '#48479B',
    gradient: ['#48479B', '#F7931E'],
  },
  {
    id: 'admin' as UserRole,
    title: 'Admin',
    description: 'Manage the platform',
    icon: Shield,
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A855F7'],
  },
  {
    id: 'kitchen' as UserRole,
    title: 'Kitchen Staff',
    description: 'Prepare amazing meals',
    icon: ChefHat,
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'delivery' as UserRole,
    title: 'Delivery Partner',
    description: 'Deliver with care',
    icon: Truck,
    color: '#48479B',
    gradient: ['#48479B', '#2563EB'],
  },
];

export default function RoleSelectionScreen() {


  const handleRoleSelect = (role: UserRole) => {
    router.push({
      pathname: '/auth/login',
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to FoodieApp</Text>
            <Text style={styles.subtitle}>Choose your role to continue</Text>
          </View>

          <View style={styles.rolesContainer}>
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={styles.roleCard}
                  onPress={() => handleRoleSelect(role.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[role.gradient[0], role.gradient[1]]}
                    style={styles.roleGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.roleContent}>
                      <View style={styles.iconContainer}>
                        <IconComponent size={32} color="white" />
                      </View>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.push('/auth/login?guest=true')}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  roleGradient: {
    padding: 24,
  },
  roleContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  guestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  guestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});