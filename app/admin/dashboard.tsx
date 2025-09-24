import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  SafeAreaView,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  Users,
  ChefHat,
  Truck,
  ShoppingBag,
  BarChart3,
  MapPin,
  Bell,
  FileText,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Package,
  Clock,
  X,
  Check,
  Megaphone,
  MessageSquare,
  Download,
  Printer,
  Share,
  FileDown,
  Eye,
  Settings,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Heart,
  Building2,
} from 'lucide-react-native';
import db from '@/db';
import { seedIfEmpty } from '@/services/firebase';
import { Subscription, User, AppSettings, KitchenStaff, DeliveryPerson, UserRole, TimeSlot, Meal } from '@/types';
import PromotionalAdmin from '@/components/PromotionalAdmin';
import RoleSelector from '@/components/RoleSelector';

interface DashboardCard {
  id: string;
  title: string;
  value: string;
  icon: any;
  color: string;
  gradient: readonly [string, string, ...string[]];
  onPress?: () => void;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 156,
    activeOrders: 23,
    totalRevenue: '₹45,230',
    deliveryPartners: 8,
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscriptions, setShowSubscriptions] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await seedIfEmpty();
      const [allSubscriptions, allUsers, settings, kitchen, delivery] = await Promise.all([
        db.getSubscriptions(),
        db.getUsers(),
        db.getAppSettings(),
        db.getKitchenStaff(),
        db.getDeliveryPersons()
      ]);
      setSubscriptions(allSubscriptions);
      setUsers(allUsers);
      setAppSettings(settings);
      setKitchenStaff(kitchen);
      setDeliveryPersons(delivery);
      
      // Update stats
      setStats({
        totalUsers: allUsers.length,
        activeOrders: allSubscriptions.filter(sub => sub.status === 'active').length,
        totalRevenue: `₹${allSubscriptions.reduce((sum, sub) => sum + sub.totalAmount, 0).toLocaleString()}`,
        deliveryPartners: delivery.length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards: DashboardCard[] = [
    {
      id: '1',
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB'] as const,
      onPress: () => setShowUsersManagement(true),
    },
    {
      id: '2',
      title: 'Active Orders',
      value: stats.activeOrders.toString(),
      icon: ShoppingBag,
      color: '#10B981',
      gradient: ['#10B981', '#059669'] as const,
      onPress: () => console.log('Navigate to Orders Management'),
    },
    {
      id: '3',
      title: 'Revenue',
      value: stats.totalRevenue,
      icon: BarChart3,
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'] as const,
      onPress: () => console.log('Navigate to Reports'),
    },
    {
      id: '4',
      title: 'Delivery Partners',
      value: stats.deliveryPartners.toString(),
      icon: Truck,
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED'] as const,
      onPress: () => console.log('Navigate to Delivery Partners'),
    },
  ];

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [optionSearch, setOptionSearch] = useState<string>('');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const addMealDrawerAnim = useRef(new Animated.Value(0)).current;
  const drawerWidth = Math.min(520, Math.floor(Dimensions.get('window').width * 0.92));
  useEffect(() => {
    if (showAddMeal) {
      addMealDrawerAnim.setValue(0);
      Animated.timing(addMealDrawerAnim, { toValue: 1, duration: 280, useNativeDriver: false }).start();
    }
  }, [showAddMeal]);
  const closeAddMealDrawer = () => {
    Animated.timing(addMealDrawerAnim, { toValue: 0, duration: 240, useNativeDriver: false }).start(({ finished }) => {
      if (finished) setShowAddMeal(false);
    });
  };
  const addMealPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) {
          closeAddMealDrawer();
        }
      },
    })
  ).current;
  const [showAddLocation, setShowAddLocation] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [showViewCategories, setShowViewCategories] = useState(false);
  const [showViewMeals, setShowViewMeals] = useState(false);
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>('');
  const [showViewLocations, setShowViewLocations] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newMealName, setNewMealName] = useState('');
  const [newMealDescription, setNewMealDescription] = useState('');
  const [newMealPrice, setNewMealPrice] = useState('');
  const [newMealOriginalPrice, setNewMealOriginalPrice] = useState('');
  const [newMealCategoryId, setNewMealCategoryId] = useState('');
  const [newMealCategoryIds, setNewMealCategoryIds] = useState<string[]>([]);
  const [newMealIsVeg, setNewMealIsVeg] = useState<boolean>(true);
  const [newMealHasEgg, setNewMealHasEgg] = useState<boolean>(false);
  const [newIsBasicThali, setNewIsBasicThali] = useState<boolean>(false);
  const [newVegVariantPrice, setNewVegVariantPrice] = useState<string>('');
  const [newNonVegVariantPrice, setNewNonVegVariantPrice] = useState<string>('');
  const [newAllowDaySelection, setNewAllowDaySelection] = useState<boolean>(false);
  const [newMealImageUrl, setNewMealImageUrl] = useState('');
  const [newMealIsActive, setNewMealIsActive] = useState<boolean>(true);
  const [newMealIsFeatured, setNewMealIsFeatured] = useState<boolean>(false);
  const [newMealIsDraft, setNewMealIsDraft] = useState<boolean>(true);
  const [newMealPreparationTime, setNewMealPreparationTime] = useState('');
  const [newMealTags, setNewMealTags] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [newMealProtein, setNewMealProtein] = useState('');
  const [newMealCarbs, setNewMealCarbs] = useState('');
  const [newMealFat, setNewMealFat] = useState('');
  const [newMealFiber, setNewMealFiber] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [notifyRequests, setNotifyRequests] = useState<any[]>([]);
  const [showCutoffSettings, setShowCutoffSettings] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [cutoffTimes, setCutoffTimes] = useState({
    skipCutoffTime: '09:00',
    addOnCutoffTime: '08:00',
  });
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
  const [staffType, setStaffType] = useState<'kitchen' | 'delivery'>('kitchen');
  const [kitchenStaff, setKitchenStaff] = useState<KitchenStaff[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [showPromotionalAdmin, setShowPromotionalAdmin] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showTimeSlotsModal, setShowTimeSlotsModal] = useState<boolean>(false);
  const [newSlotTime, setNewSlotTime] = useState<string>('');
  const [newSlotLabel, setNewSlotLabel] = useState<string>('');
  const [assignSlotsMeal, setAssignSlotsMeal] = useState<Meal | null>(null);
  const [assignSelectedSlots, setAssignSelectedSlots] = useState<string[]>([]);
  const [showUsersManagement, setShowUsersManagement] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string>('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceSubscription, setSelectedInvoiceSubscription] = useState<Subscription | null>(null);

  const generateInvoiceHTML = (subscription: Subscription, user: User) => {
    const invoiceNumber = `INV-${subscription.id.slice(-8).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString('en-IN');
    const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .company-tagline {
            font-size: 14px;
            opacity: 0.9;
        }
        .invoice-details {
            padding: 30px;
        }
        .invoice-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .invoice-info, .customer-info {
            flex: 1;
            min-width: 250px;
        }
        .invoice-info {
            margin-right: 20px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: 500;
            color: #718096;
        }
        .info-value {
            font-weight: 600;
            color: #2d3748;
        }
        .subscription-details {
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .detail-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .detail-value {
            font-size: 20px;
            font-weight: bold;
            color: #2b6cb0;
            margin-bottom: 5px;
        }
        .detail-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .payment-summary {
            background: #edf2f7;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
        }
        .summary-row.total {
            border-top: 2px solid #4a5568;
            font-weight: bold;
            font-size: 18px;
            color: #2d3748;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-paid {
            background: #c6f6d5;
            color: #22543d;
        }
        .status-pending {
            background: #fed7d7;
            color: #742a2a;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f7fafc;
            color: #718096;
            font-size: 14px;
        }
        @media print {
            body { background: white; }
            .invoice-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-name">FoodDelivery Pro</div>
            <div class="company-tagline">Premium Meal Subscription Service</div>
        </div>
        
        <div class="invoice-details">
            <div class="invoice-meta">
                <div class="invoice-info">
                    <div class="section-title">Invoice Details</div>
                    <div class="info-row">
                        <span class="info-label">Invoice Number:</span>
                        <span class="info-value">${invoiceNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Invoice Date:</span>
                        <span class="info-value">${invoiceDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Subscription ID:</span>
                        <span class="info-value">#${subscription.id.slice(-6)}</span>
                    </div>
                </div>
                
                <div class="customer-info">
                    <div class="section-title">Customer Details</div>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${user.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${user.email || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${user.phone}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Address:</span>
                        <span class="info-value">${user.addresses?.[0]?.addressLine || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="subscription-details">
                <div class="section-title">Subscription Details</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-value">${formatDate(subscription.startDate)}</div>
                        <div class="detail-label">Start Date</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${formatDate(subscription.endDate)}</div>
                        <div class="detail-label">End Date</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${subscription.totalDeliveries}</div>
                        <div class="detail-label">Total Meals</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${subscription.deliveryTime}</div>
                        <div class="detail-label">Delivery Time</div>
                    </div>
                </div>
            </div>
            
            <div class="payment-summary">
                <div class="section-title">Payment Summary</div>
                <div class="summary-row">
                    <span>Subscription Amount:</span>
                    <span>₹${subscription.totalAmount}</span>
                </div>
                <div class="summary-row">
                    <span>Paid Amount:</span>
                    <span>₹${subscription.paidAmount || 0}</span>
                </div>
                <div class="summary-row">
                    <span>Remaining Amount:</span>
                    <span>₹${subscription.totalAmount - (subscription.paidAmount || 0)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Amount:</span>
                    <span>₹${subscription.totalAmount}</span>
                </div>
                <div style="margin-top: 15px;">
                    <span>Payment Status: </span>
                    <span class="status-badge ${(subscription.paidAmount || 0) >= subscription.totalAmount ? 'status-paid' : 'status-pending'}">
                        ${(subscription.paidAmount || 0) >= subscription.totalAmount ? 'Paid' : 'Pending'}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for choosing FoodDelivery Pro!</p>
            <p>For any queries, contact us at support@fooddeliverypro.com</p>
        </div>
    </div>
    
    <script>
        // Auto print functionality
        function printInvoice() {
            window.print();
        }
        
        // Add print button
        document.addEventListener('DOMContentLoaded', function() {
            const printBtn = document.createElement('button');
            printBtn.innerHTML = '🖨️ Print Invoice';
            printBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; z-index: 1000;';
            printBtn.onclick = printInvoice;
            document.body.appendChild(printBtn);
        });
    </script>
</body>
</html>
    `;
  };

  const handleDownloadInvoice = async (subscription: Subscription) => {
    const user = users.find(u => u.id === subscription.userId);
    if (!user) {
      Alert.alert('Error', 'User not found for this subscription');
      return;
    }

    try {
      const htmlContent = generateInvoiceHTML(subscription, user);
      
      if (Platform.OS === 'web') {
        // For web, open in new tab
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.document.title = `Invoice-${subscription.id.slice(-8)}`;
        }
      } else {
        // For mobile, use WebBrowser
        const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        await WebBrowser.openBrowserAsync(dataUri);
      }
      
      console.log('Invoice generated successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  const handleExportSalesReport = async () => {
    try {
      console.log('Exporting sales report...');
      
      // Prepare CSV data
      const csvData = subscriptions.map(subscription => {
        const user = users.find(u => u.id === subscription.userId);
        return {
          subscriptionId: subscription.id,
          userName: user?.name || 'Unknown User',
          planName: subscription.planName || `${subscription.totalDeliveries} Day Plan`,
          amount: subscription.totalAmount,
          paymentStatus: (subscription.paidAmount || 0) >= subscription.totalAmount ? 'Paid' : 'Pending',
          dateOfPurchase: new Date(subscription.createdAt || subscription.startDate).toLocaleDateString('en-IN')
        };
      });

      // Create CSV content
      const csvHeaders = 'Subscription ID,User Name,Plan Name,Amount,Payment Status,Date of Purchase\n';
      const csvRows = csvData.map(row => 
        `${row.subscriptionId},"${row.userName}","${row.planName}",${row.amount},${row.paymentStatus},${row.dateOfPurchase}`
      ).join('\n');
      const csvContent = csvHeaders + csvRows;

      if (Platform.OS === 'web') {
        // For web, create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('Success', 'Sales report exported successfully!');
      } else {
        // For mobile, show CSV content in a modal or share
        Alert.alert(
          'Sales Report',
          `CSV data prepared with ${csvData.length} records. In a real app, this would be saved to device storage or shared.`,
          [
            { text: 'OK' },
            {
              text: 'View Data',
              onPress: () => {
                console.log('CSV Content:', csvContent);
                Alert.alert('CSV Data', csvContent.substring(0, 500) + '...');
              }
            }
          ]
        );
      }
      
      console.log('Sales report export completed');
    } catch (error) {
      console.error('Error exporting sales report:', error);
      Alert.alert('Error', 'Failed to export sales report');
    }
  };

  const handlePrintInvoice = async (subscription: Subscription) => {
    const user = users.find(u => u.id === subscription.userId);
    if (!user) {
      Alert.alert('Error', 'User not found for this subscription');
      return;
    }

    try {
      const htmlContent = generateInvoiceHTML(subscription, user);
      
      if (Platform.OS === 'web') {
        // For web, open in new tab and trigger print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        // For mobile, same as download (open in browser)
        const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        await WebBrowser.openBrowserAsync(dataUri);
      }
      
      console.log('Invoice print initiated');
    } catch (error) {
      console.error('Error printing invoice:', error);
      Alert.alert('Error', 'Failed to print invoice');
    }
  };

  type ManagementGroup = 'Primary' | 'Catalog' | 'Operations' | 'Marketing' | 'Reports';

  const managementOptions: Array<{
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    onPress: () => void;
    group: ManagementGroup;
  }> = [
    {
      id: '1',
      title: 'Add Category',
      description: 'Add new meal categories',
      icon: Plus,
      color: '#3B82F6',
      onPress: () => setShowAddCategory(true),
      group: 'Catalog',
    },
    {
      id: '2',
      title: 'Add Meal',
      description: 'Add new meals to menu',
      icon: ChefHat,
      color: '#10B981',
      onPress: async () => {
        try {
          const cats = await db.getCategories();
          setCategories(cats);
        } catch (e) {
          console.log('failed to load categories for add meal', e);
        }
        setShowAddMeal(true);
      },
      group: 'Primary',
    },
    {
      id: '3',
      title: 'Add Location',
      description: 'Add serviceable locations',
      icon: MapPin,
      color: '#F59E0B',
      onPress: () => setShowAddLocation(true),
      group: 'Operations',
    },
    {
      id: '4',
      title: 'Manual Subscription',
      description: 'Create manual subscriptions',
      icon: Plus,
      color: '#EF4444',
      onPress: () => router.push('/admin/manual-subscription' as any),
      group: 'Primary',
    },
    {
      id: '5',
      title: 'Users Management',
      description: 'Manage users and roles',
      icon: Users,
      color: '#2563EB',
      onPress: () => setShowUsersManagement(true),
      group: 'Operations',
    },
    {
      id: '6',
      title: 'View Categories',
      description: 'Manage meal categories',
      icon: Package,
      color: '#8B5CF6',
      onPress: () => loadCategories(),
      group: 'Catalog',
    },
    {
      id: '7',
      title: 'View Meals',
      description: 'Manage meals menu',
      icon: FileText,
      color: '#06B6D4',
      onPress: () => openMealsModal(),
      group: 'Catalog',
    },
    {
      id: '8',
      title: 'View Locations',
      description: 'Manage delivery locations',
      icon: MapPin,
      color: '#84CC16',
      onPress: () => loadLocations(),
      group: 'Operations',
    },
    {
      id: '9',
      title: 'Toggle Subscriptions',
      description: 'Show/hide subscription list',
      icon: Bell,
      color: '#F97316',
      onPress: () => setShowSubscriptions(!showSubscriptions),
      group: 'Primary',
    },
    {
      id: '10',
      title: 'Cutoff Settings',
      description: 'Configure skip & add-on cutoff times',
      icon: Clock,
      color: '#EC4899',
      onPress: () => loadCutoffSettings(),
      group: 'Operations',
    },
    {
      id: '11',
      title: 'Promotional Sections',
      description: 'Manage homepage promotional content',
      icon: Megaphone,
      color: '#FF6B35',
      onPress: () => setShowPromotionalAdmin(true),
      group: 'Marketing',
    },
    {
      id: '12',
      title: 'Support Tickets',
      description: 'Manage customer support tickets',
      icon: MessageSquare,
      color: '#8B5CF6',
      onPress: () => router.push('/admin/support' as any),
      group: 'Primary',
    },
    {
      id: '13',
      title: 'Sales Report',
      description: 'Export sales data to CSV',
      icon: FileDown,
      color: '#059669',
      onPress: () => handleExportSalesReport(),
      group: 'Reports',
    },
    {
      id: '17',
      title: 'Push Center',
      description: 'Send notifications to users',
      icon: Bell,
      color: '#DC2626',
      onPress: () => router.push('/admin/push-center' as any),
      group: 'Marketing',
    },
    {
      id: '14',
      title: 'Banners Management',
      description: 'Manage homepage banners and promotions',
      icon: ImageIcon,
      color: '#F59E0B',
      onPress: () => router.push('/admin/banners' as any),
      group: 'Marketing',
    },
    {
      id: '15',
      title: 'Testimonials Management',
      description: 'Manage customer testimonials and reviews',
      icon: MessageSquare,
      color: '#10B981',
      onPress: () => router.push('/admin/testimonials' as any),
      group: 'Marketing',
    },
    {
      id: '16',
      title: 'Nutritionist Requests',
      description: 'Manage nutritionist consultation requests',
      icon: Heart,
      color: '#EC4899',
      onPress: () => router.push('/admin/nutritionist-requests' as any),
      group: 'Operations',
    },
    {
      id: '18',
      title: 'Corporate Catering',
      description: 'Manage corporate catering requests and quotations',
      icon: Building2,
      color: '#0EA5E9',
      onPress: () => router.push('/admin/corporate-catering' as any),
      group: 'Marketing',
    },
    {
      id: '19',
      title: 'Addons Management',
      description: 'Manage meal add-ons',
      icon: Package,
      color: '#22C55E',
      onPress: () => router.push('/admin/addons' as any),
      group: 'Catalog',
    },
    {
      id: '21',
      title: 'Time Slots',
      description: 'Create and manage delivery slots',
      icon: Clock,
      color: '#0EA5E9',
      onPress: () => openTimeSlotsModal(),
      group: 'Operations',
    },
    {
      id: '20',
      title: 'Subscriptions',
      description: 'View all subscriptions (live)',
      icon: FileText,
      color: '#0EA5E9',
      onPress: () => router.push('/admin/subscriptions' as any),
      group: 'Primary',
    },
  ];

  const loadCategories = async () => {
    try {
      const cats = await db.getCategories();
      setCategories(cats);
      setShowViewCategories(true);
      console.log('Categories loaded:', cats.length);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMealsData = async () => {
    try {
      const mealsData = await db.getMeals();
      const categoriesData = await db.getCategories();
      setMeals(mealsData);
      setCategories(categoriesData);
      console.log('Meals loaded:', mealsData.length);
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

  const openMealsModal = async () => {
    await loadMealsData();
    setShowViewMeals(true);
  };

  const loadLocations = async () => {
    try {
      const locs = await db.getServiceableLocations();
      setLocations(locs);
      setShowViewLocations(true);
      console.log('Locations loaded:', locs.length);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const slots = await db.getTimeSlots();
      setTimeSlots(slots);
      console.log('Time slots loaded:', slots.length);
    } catch (e) {
      console.log('loadTimeSlots error', e);
    }
  };

  const openTimeSlotsModal = async () => {
    await loadTimeSlots();
    setShowTimeSlotsModal(true);
  };

  const handleAddTimeSlot = async () => {
    if (!newSlotTime.trim()) {
      Alert.alert('Error', 'Enter time range (e.g., 12PM-2PM)');
      return;
    }
    try {
      await db.createTimeSlot({ time: newSlotTime.trim(), label: newSlotLabel.trim() || undefined, isActive: true });
      setNewSlotTime('');
      setNewSlotLabel('');
      await loadTimeSlots();
    } catch (e) {
      console.log('add slot error', e);
      Alert.alert('Error', 'Failed to add slot');
    }
  };

  const toggleSlotActive = async (slotId: string) => {
    try {
      await db.toggleTimeSlotActive(slotId);
      await loadTimeSlots();
    } catch (e) {
      console.log('toggle slot error', e);
    }
  };

  const openAssignSlotsModal = async (meal: Meal) => {
    try {
      await loadTimeSlots();
      setAssignSlotsMeal(meal);
      const current = meal.availableTimeSlotIds ?? [];
      setAssignSelectedSlots(current);
      setShowAssignSlots(true);
    } catch (e) {
      console.log('openAssignSlotsModal error', e);
    }
  };

  const [showAssignSlots, setShowAssignSlots] = useState<boolean>(false);
  const [showEditMeal, setShowEditMeal] = useState<boolean>(false);
  const [editMealId, setEditMealId] = useState<string>('');
  const [editMealName, setEditMealName] = useState<string>('');
  const [editMealDescription, setEditMealDescription] = useState<string>('');
  const [editMealPrice, setEditMealPrice] = useState<string>('');
  const [editMealOriginalPrice, setEditMealOriginalPrice] = useState<string>('');
  const [editMealImageUrl, setEditMealImageUrl] = useState<string>('');
  const [editMealIsVeg, setEditMealIsVeg] = useState<boolean>(true);
  const [editMealHasEgg, setEditMealHasEgg] = useState<boolean>(false);
  const [editMealIsActive, setEditMealIsActive] = useState<boolean>(true);
  const [editMealIsFeatured, setEditMealIsFeatured] = useState<boolean>(false);
  const [editMealIsDraft, setEditMealIsDraft] = useState<boolean>(false);
  const [editMealPreparationTime, setEditMealPreparationTime] = useState<string>('');
  const [editMealTags, setEditMealTags] = useState<string>('');
  const [editMealCategoryIds, setEditMealCategoryIds] = useState<string[]>([]);
  const [editMealCategoryId, setEditMealCategoryId] = useState<string>('');

  const saveAssignSlots = async () => {
    if (!assignSlotsMeal) return;
    try {
      await db.assignTimeSlotsToMeal(assignSlotsMeal.id, assignSelectedSlots);
      Alert.alert('Success', 'Time slots updated for meal');
      setShowAssignSlots(false);
      await loadMealsData();
    } catch (e) {
      console.log('saveAssignSlots error', e);
      Alert.alert('Error', 'Failed to update time slots');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryDescription.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await db.addCategory({
        name: newCategoryName,
        description: newCategoryDescription,
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowAddCategory(false);
      Alert.alert('Success', 'Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const openEditMeal = async (meal: Meal) => {
    try {
      const cats = await db.getCategories();
      setCategories(cats);
    } catch (e) {
      console.log('openEditMeal: failed to load categories', e);
    }
    setEditMealId(meal.id);
    setEditMealName(meal.name);
    setEditMealDescription(meal.description);
    setEditMealPrice(String(meal.price));
    setEditMealOriginalPrice(meal.originalPrice ? String(meal.originalPrice) : '');
    setEditMealImageUrl(meal.images?.[0] ?? '');
    setEditMealIsVeg(!!meal.isVeg);
    setEditMealHasEgg(!!meal.hasEgg);
    setEditMealIsActive(!!meal.isActive);
    setEditMealIsFeatured(!!meal.isFeatured);
    setEditMealIsDraft(!!meal.isDraft);
    setEditMealPreparationTime(meal.preparationTime ? String(meal.preparationTime) : '');
    setEditMealTags((meal.tags || []).join(', '));
    const catIds = Array.isArray(meal.categoryIds) && meal.categoryIds.length > 0 ? meal.categoryIds : (meal.categoryId ? [meal.categoryId] : []);
    setEditMealCategoryIds(catIds);
    setEditMealCategoryId(meal.categoryId || (catIds[0] ?? ''));
    setShowEditMeal(true);
  };

  const handleAddMeal = async () => {
    if (!newMealName.trim() || !newMealDescription.trim() || !newMealPrice.trim() || !newMealCategoryId.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      const price = parseFloat(newMealPrice);
      const originalPrice = newMealOriginalPrice.trim() ? parseFloat(newMealOriginalPrice) : undefined;
      const preparationTime = newMealPreparationTime.trim() ? parseInt(newMealPreparationTime, 10) : undefined;
      const nutritionInfo = (newMealCalories || newMealProtein || newMealCarbs || newMealFat || newMealFiber)
        ? {
            calories: parseInt(newMealCalories || '0', 10),
            protein: parseInt(newMealProtein || '0', 10),
            carbs: parseInt(newMealCarbs || '0', 10),
            fat: parseInt(newMealFat || '0', 10),
            fiber: parseInt(newMealFiber || '0', 10),
          }
        : undefined;
      const tags = newMealTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const categoryIdsPayload = newMealCategoryIds.length > 0 ? newMealCategoryIds : (newMealCategoryId ? [newMealCategoryId] : []);

      const variantPricing = newIsBasicThali ? {
        veg: newVegVariantPrice.trim() ? parseFloat(newVegVariantPrice) : price,
        nonveg: newNonVegVariantPrice.trim() ? parseFloat(newNonVegVariantPrice) : price,
      } : undefined;

      await db.addMeal({
        name: newMealName.trim(),
        description: newMealDescription.trim(),
        price,
        originalPrice,
        categoryId: categoryIdsPayload[0] || '',
        categoryIds: categoryIdsPayload,
        isVeg: newMealIsVeg,
        hasEgg: newMealHasEgg,
        image: newMealImageUrl.trim() || undefined,
        isActive: newMealIsActive,
        isFeatured: newMealIsFeatured,
        isDraft: newMealIsDraft,
        preparationTime,
        tags: tags.length ? tags : undefined,
        nutritionInfo,
        isBasicThali: newIsBasicThali,
        variantPricing,
        allowDaySelection: newAllowDaySelection,
      });
      setNewMealName('');
      setNewMealDescription('');
      setNewMealPrice('');
      setNewMealOriginalPrice('');
      setNewMealCategoryId('');
      setNewMealCategoryIds([]);
      setNewMealIsVeg(true);
      setNewMealHasEgg(false);
      setNewIsBasicThali(false);
      setNewVegVariantPrice('');
      setNewNonVegVariantPrice('');
      setNewAllowDaySelection(false);
      setNewMealImageUrl('');
      setNewMealIsActive(true);
      setNewMealIsFeatured(false);
      setNewMealIsDraft(true);
      setNewMealPreparationTime('');
      setNewMealTags('');
      setNewMealCalories('');
      setNewMealProtein('');
      setNewMealCarbs('');
      setNewMealFat('');
      setNewMealFiber('');
      setShowAddMeal(false);
      Alert.alert('Success', 'Meal added successfully!');
      await loadMealsData();
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to add meal');
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !newLocationAddress.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await db.addLocation({
        name: newLocationName,
        address: newLocationAddress,
      });
      setNewLocationName('');
      setNewLocationAddress('');
      setShowAddLocation(false);
      Alert.alert('Success', 'Location added successfully!');
    } catch (error) {
      console.error('Error adding location:', error);
      Alert.alert('Error', 'Failed to add location');
    }
  };

  const loadNotifyRequests = async () => {
    try {
      const requests = await db.getNotifyRequests();
      setNotifyRequests(requests);
    } catch (error) {
      console.error('Error loading notify requests:', error);
    }
  };

  useEffect(() => {
    loadNotifyRequests();
  }, []);

  useEffect(() => {
    loadMealsData();
  }, []);

  const handleAssignSubscription = async (subscriptionId: string, assigneeId: string, role: 'kitchen' | 'delivery') => {
    try {
      await db.assignSubscription(subscriptionId, assigneeId, role);
      setShowStaffDrawer(false);
      loadData(); // Reload data to show updated assignments
      
      const staffName = role === 'kitchen' 
        ? kitchenStaff.find(s => s.id === assigneeId)?.name 
        : deliveryPersons.find(s => s.id === assigneeId)?.name;
      
      Alert.alert('Success', `Subscription assigned to ${staffName}`);
      console.log(`Subscription ${subscriptionId} assigned to ${role}: ${assigneeId}`);
    } catch (error) {
      console.error('Error assigning subscription:', error);
      Alert.alert('Error', 'Failed to assign subscription');
    }
  };

  const openStaffDrawer = (subscriptionId: string, type: 'kitchen' | 'delivery') => {
    setSelectedSubscriptionId(subscriptionId);
    setStaffType(type);
    setShowStaffDrawer(true);
  };

  const renderSubscriptionCard = ({ item }: { item: Subscription }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return '#10B981';
        case 'paused': return '#F59E0B';
        case 'cancelled': return '#EF4444';
        case 'completed': return '#6B7280';
        default: return '#6B7280';
      }
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    const user = users.find(u => u.id === item.userId);
    const deliveredMeals = (item.totalDeliveries || 0) - (item.remainingDeliveries || 0);

    const handleGenerateInvoice = () => {
      setSelectedInvoiceSubscription(item);
      setShowInvoiceModal(true);
    };

    return (
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionUser}>{user?.name || 'Unknown User'}</Text>
            <Text style={styles.subscriptionPhone}>{user?.phone}</Text>
            <Text style={styles.subscriptionId}>ID: #{item.id.slice(-6)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.subscriptionDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#9CA3AF" />
            <Text style={styles.detailText}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Package size={16} color="#9CA3AF" />
            <Text style={styles.detailText}>
              {deliveredMeals}/{item.totalDeliveries} meals delivered
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color="#9CA3AF" />
            <Text style={styles.detailText}>
              Delivery: {item.deliveryTime}
            </Text>
          </View>
        </View>
        
        <View style={styles.subscriptionFooter}>
          <View>
            <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
            <Text style={styles.paidAmount}>Paid: ₹{item.paidAmount || 0}</Text>
          </View>
          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={handleGenerateInvoice}
          >
            <FileText size={16} color="white" />
            <Text style={styles.invoiceButtonText}>Invoice</Text>
          </TouchableOpacity>
        </View>
        
        {/* Assignment Buttons */}
        <View style={styles.assignmentSection}>
          <Text style={styles.assignmentTitle}>Assign to Staff:</Text>
          <View style={styles.assignButtons}>
            <TouchableOpacity 
              style={[styles.assignButton, { backgroundColor: '#10B981' }]}
              onPress={() => openStaffDrawer(item.id, 'kitchen')}
            >
              <ChefHat size={16} color="white" />
              <Text style={styles.assignButtonText}>Kitchen</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.assignButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => openStaffDrawer(item.id, 'delivery')}
            >
              <Truck size={16} color="white" />
              <Text style={styles.assignButtonText}>Delivery</Text>
            </TouchableOpacity>
          </View>
          {(item.assignedKitchenId || item.assignedDeliveryId) && (
            <View style={styles.assignmentStatus}>
              {item.assignedKitchenId && (
                <Text style={styles.assignedText}>
                  ✓ Kitchen: {kitchenStaff.find(s => s.id === item.assignedKitchenId)?.name || item.assignedKitchenId}
                </Text>
              )}
              {item.assignedDeliveryId && (
                <Text style={styles.assignedText}>
                  ✓ Delivery: {deliveryPersons.find(s => s.id === item.assignedDeliveryId)?.name || item.assignedDeliveryId}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const loadCutoffSettings = async () => {
    try {
      console.log('Loading cutoff settings in admin...');
      const settings = await db.getAppSettings();
      console.log('Cutoff settings loaded in admin:', settings);
      setCutoffTimes({
        skipCutoffTime: settings.skipCutoffTime,
        addOnCutoffTime: settings.addOnCutoffTime,
      });
      setShowCutoffSettings(true);
    } catch (error) {
      console.error('Error loading cutoff settings:', error);
    }
  };

  const saveCutoffSettings = async () => {
    try {
      console.log('Saving cutoff settings:', cutoffTimes);
      const updatedSettings = await db.updateAppSettings(cutoffTimes);
      console.log('Updated settings saved:', updatedSettings);
      setShowCutoffSettings(false);
      Alert.alert('Success', 'Cutoff times updated successfully!');
      loadData(); // Reload data to get updated settings
    } catch (error) {
      console.error('Error saving cutoff settings:', error);
      Alert.alert('Error', 'Failed to update cutoff times');
    }
  };

  const handleToggleDraftMode = async (mealId: string) => {
    try {
      console.log('Toggling draft mode for meal:', mealId);
      const updatedMeal = await db.toggleMealDraftStatus(mealId);
      if (updatedMeal) {
        await loadMealsData();
        const statusText = updatedMeal.isDraft ? 'moved to draft mode' : 'published live';
        Alert.alert(
          'Draft Mode Updated',
          `Meal "${updatedMeal.name}" has been ${statusText}.\n\n${updatedMeal.isDraft ? 'This meal is now only visible to admins.' : 'This meal is now visible to all users.'}`
        );
      }
    } catch (error) {
      console.error('Error toggling draft mode:', error);
      Alert.alert('Error', 'Failed to update draft mode');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/role-selection');
          },
        },
      ]
    );
  };

  const changeUserRole = async (targetUser: User, newRole: UserRole) => {
    try {
      if (targetUser.role === newRole) {
        Alert.alert('No change', 'User already has this role');
        return;
      }
      setUpdatingUserId(targetUser.id);
      console.log('Updating user role', { userId: targetUser.id, from: targetUser.role, to: newRole });
      const updated = await db.updateUser(targetUser.id, { role: newRole });
      if (!updated) {
        Alert.alert('Error', 'Failed to update user');
        return;
      }
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      Alert.alert('Success', `Role updated to ${newRole}`);
    } catch (e) {
      console.error('changeUserRole error', e);
      Alert.alert('Error', 'Could not update role');
    } finally {
      setUpdatingUserId('');
    }
  };

  const toggleUserActive = async (targetUser: User) => {
    try {
      setUpdatingUserId(targetUser.id);
      const updated = await db.updateUser(targetUser.id, { isActive: !targetUser.isActive });
      if (updated) {
        setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      }
    } catch (e) {
      console.error('toggleUserActive error', e);
      Alert.alert('Error', 'Could not update user status');
    } finally {
      setUpdatingUserId('');
    }
  };

  const quickBar = [
    managementOptions.find(o => o.id === '2'), // Add Meal
    managementOptions.find(o => o.id === '20'), // Subscriptions
    managementOptions.find(o => o.id === '12'), // Support Tickets
    managementOptions.find(o => o.id === '17'), // Push Center
    managementOptions.find(o => o.id === '19'), // Addons
    managementOptions.find(o => o.id === '6'),  // View Categories
    managementOptions.find(o => o.id === '7'),  // View Meals
  ].filter(Boolean) as typeof managementOptions;

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesQuery = (
      u.name.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? u.isActive : !u.isActive;
    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
            </View>
            <View style={styles.headerActions}>
              <RoleSelector currentRole="admin" />
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {dashboardCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.statCard}
                  onPress={card.onPress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={card.gradient}
                    style={styles.statGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.statContent}>
                      <IconComponent size={24} color="white" />
                      <Text style={styles.statValue}>{card.value}</Text>
                      <Text style={styles.statTitle}>{card.title}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Management Options */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Management</Text>

            <View style={styles.searchRow}>
              <TextInput
                testID="admin-management-search"
                placeholder="Search actions…"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={optionSearch}
                onChangeText={setOptionSearch}
              />
            </View>

            {(['Primary','Catalog','Operations','Marketing','Reports'] as ManagementGroup[]).map((group) => {
              const grouped = managementOptions
                .filter(o => o.group === group)
                .filter(o =>
                  optionSearch.trim() === ''
                    ? true
                    : (o.title + ' ' + o.description).toLowerCase().includes(optionSearch.toLowerCase())
                );
              if (grouped.length === 0) return null;
              return (
                <View key={group} style={{ marginBottom: 16 }}>
                  <Text style={styles.groupTitle}>{group}</Text>
                  <View style={styles.optionsGrid}>
                    {grouped.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          testID={`admin-card-${option.id}`}
                          style={styles.optionCard}
                          onPress={option.onPress}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                            <IconComponent size={24} color="white" />
                          </View>
                          <Text style={styles.optionTitle}>{option.title}</Text>
                          <Text style={styles.optionDescription}>{option.description}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Meals Card (View + Add inside) */}
          <View style={styles.sectionContainer}>
            <View style={styles.mealsCard}>
              <View style={styles.mealsHeader}>
                <Text style={styles.mealsTitle}>Meals</Text>
                <View style={styles.mealsHeaderActions}>
                  <TouchableOpacity
                    testID="meals-card-add"
                    style={styles.mealsAddBtn}
                    onPress={async () => {
                      try {
                        const cats = await db.getCategories();
                        setCategories(cats);
                      } catch (e) {
                        console.log('load categories for meals card add', e);
                      }
                      setShowAddMeal(true);
                    }}
                  >
                    <Plus size={16} color="white" />
                    <Text style={styles.mealsAddBtnText}>Add Meal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="meals-card-view-all"
                    style={styles.mealsViewAllBtn}
                    onPress={openMealsModal}
                  >
                    <Text style={styles.mealsViewAllText}>View all</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inline list preview */}
              {meals.length === 0 ? (
                <View style={styles.emptyMealsContainer}>
                  <ChefHat size={48} color="#9CA3AF" />
                  <Text style={styles.emptyMealsTitle}>No Meals</Text>
                  <Text style={styles.emptyMealsDescription}>Create your first meal to get started.</Text>
                </View>
              ) : (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.mealsRow}> 
                      {meals.slice(0, 6).map((meal) => (
                        <View key={meal.id} style={styles.mealTinyCard}>
                          <View style={styles.mealTinyThumb}>
                            <Text style={styles.mealImageText}>🍽️</Text>
                          </View>
                          <Text numberOfLines={1} style={styles.mealTinyName}>{meal.name}</Text>
                          <Text style={styles.mealTinyMeta}>₹{meal.price}</Text>
                          <View style={styles.mealTinyBadges}>
                            <View style={[styles.vegBadge, { backgroundColor: meal.isVeg ? '#4CAF50' : '#F44336' }]}>
                              <Text style={styles.vegBadgeText}>{meal.isVeg ? 'Veg' : 'Non-Veg'}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: meal.isActive ? '#10B981' : '#6B7280' }]}>
                              <Text style={styles.statusText}>{meal.isActive ? 'Active' : 'Inactive'}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* All Subscriptions */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Customer Subscriptions</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/admin/manual-subscription')}
              >
                <Plus size={16} color="white" />
                <Text style={styles.createButtonText}>Create Manual</Text>
              </TouchableOpacity>
            </View>
            {showSubscriptions && (
              loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading subscriptions...</Text>
                </View>
              ) : subscriptions.length > 0 ? (
                <FlatList
                  data={subscriptions}
                  renderItem={renderSubscriptionCard}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Package size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No Subscriptions Found</Text>
                  <Text style={styles.emptyDescription}>
                    No users have created subscriptions yet.
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Quick Access */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickBar}>
              {quickBar.map((option) => {
                const IconC = option.icon;
                return (
                  <TouchableOpacity
                    key={option.id}
                    testID={`quick-${option.id}`}
                    onPress={option.onPress}
                    style={styles.quickPill}
                    activeOpacity={0.85}
                  >
                    <IconC size={18} color="white" />
                    <Text style={styles.quickPillText}>{option.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Staff Assignment Drawer */}
        <Modal
          visible={showStaffDrawer}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Assign to {staffType === 'kitchen' ? 'Kitchen Staff' : 'Delivery Person'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStaffDrawer(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {staffType === 'kitchen' ? (
                <View>
                  <Text style={styles.sectionSubtitle}>Select Kitchen Staff Member</Text>
                  {kitchenStaff.filter(staff => staff.isActive).map((staff) => (
                    <TouchableOpacity
                      key={staff.id}
                      style={styles.staffCard}
                      onPress={() => handleAssignSubscription(selectedSubscriptionId, staff.id, 'kitchen')}
                    >
                      <View style={styles.staffInfo}>
                        <View style={[styles.staffIcon, { backgroundColor: '#10B981' }]}>
                          <ChefHat size={20} color="white" />
                        </View>
                        <View style={styles.staffDetails}>
                          <Text style={styles.staffName}>{staff.name}</Text>
                          <Text style={styles.staffRole}>{staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}</Text>
                          <Text style={styles.staffContact}>{staff.phone}</Text>
                        </View>
                      </View>
                      <Check size={20} color="#10B981" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View>
                  <Text style={styles.sectionSubtitle}>Select Delivery Person</Text>
                  {deliveryPersons.filter(person => person.isActive).map((person) => (
                    <TouchableOpacity
                      key={person.id}
                      style={styles.staffCard}
                      onPress={() => handleAssignSubscription(selectedSubscriptionId, person.id, 'delivery')}
                    >
                      <View style={styles.staffInfo}>
                        <View style={[styles.staffIcon, { backgroundColor: '#3B82F6' }]}>
                          <Truck size={20} color="white" />
                        </View>
                        <View style={styles.staffDetails}>
                          <Text style={styles.staffName}>{person.name}</Text>
                          <Text style={styles.staffRole}>Delivery Person</Text>
                          <Text style={styles.staffContact}>{person.phone}</Text>
                          <Text style={styles.staffVehicle}>Vehicle: {person.vehicleNumber}</Text>
                          <View style={styles.availabilityBadge}>
                            <View style={[
                              styles.statusDot, 
                              { backgroundColor: person.isAvailable ? '#10B981' : '#EF4444' }
                            ]} />
                            <Text style={styles.availabilityText}>
                              {person.isAvailable ? 'Available' : 'Busy'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Check size={20} color="#3B82F6" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Cutoff Settings Modal */}
        <Modal
          visible={showCutoffSettings}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cutoff Time Settings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCutoffSettings(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Skip Meal Cutoff Time</Text>
                <Text style={styles.settingDescription}>
                  Users can skip meals until this time on the delivery day
                </Text>
                <TextInput
                  style={styles.timeInput}
                  value={cutoffTimes.skipCutoffTime}
                  onChangeText={(text) => setCutoffTimes(prev => ({ ...prev, skipCutoffTime: text }))}
                  placeholder="09:00"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Add-on Cutoff Time</Text>
                <Text style={styles.settingDescription}>
                  Users can add extra items until this time on the delivery day
                </Text>
                <TextInput
                  style={styles.timeInput}
                  value={cutoffTimes.addOnCutoffTime}
                  onChangeText={(text) => setCutoffTimes(prev => ({ ...prev, addOnCutoffTime: text }))}
                  placeholder="08:00"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.currentSettings}>
                <Text style={styles.currentSettingsTitle}>Current Settings</Text>
                {appSettings && (
                  <View>
                    <Text style={styles.currentSettingText}>
                      Skip Cutoff: {appSettings.skipCutoffTime}
                    </Text>
                    <Text style={styles.currentSettingText}>
                      Add-on Cutoff: {appSettings.addOnCutoffTime}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveCutoffSettings}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Add Category Modal */}
        <Modal
          visible={showAddCategory}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddCategory(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Category Name</Text>
                <TextInput
                  style={styles.timeInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Description</Text>
                <TextInput
                  style={[styles.timeInput, { height: 80 }]}
                  value={newCategoryDescription}
                  onChangeText={setNewCategoryDescription}
                  placeholder="Enter category description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddCategory}
              >
                <Text style={styles.saveButtonText}>Add Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Add Meal Modal */}
        <Modal
          visible={false}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Meal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddMeal(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Meal Name</Text>
                <TextInput
                  testID="add-meal-name"
                  style={styles.timeInput}
                  value={newMealName}
                  onChangeText={setNewMealName}
                  placeholder="Enter meal name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Description</Text>
                <TextInput
                  testID="add-meal-description"
                  style={[styles.timeInput, { height: 80 }]}
                  value={newMealDescription}
                  onChangeText={setNewMealDescription}
                  placeholder="Enter meal description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      testID={`add-meal-category-${cat.id}`}
                      style={[styles.categoryFilterChip, newMealCategoryId === cat.id && styles.categoryFilterChipActive]}
                      onPress={() => setNewMealCategoryId(cat.id)}
                    >
                      <Text style={[styles.categoryFilterText, newMealCategoryId === cat.id && styles.categoryFilterTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {newMealCategoryId === '' && (
                  <Text style={[styles.settingDescription, { marginTop: 8 }]}>Please select a category</Text>
                )}
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Diet Preference</Text>
                <View style={styles.roleChipsRow}>
                  <TouchableOpacity
                    testID="add-meal-veg"
                    style={[styles.chip, newMealIsVeg && styles.chipActive]}
                    onPress={() => setNewMealIsVeg(true)}
                  >
                    <Text style={[styles.chipText, newMealIsVeg && styles.chipTextActive]}>Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="add-meal-nonveg"
                    style={[styles.chip, !newMealIsVeg && styles.chipActive]}
                    onPress={() => setNewMealIsVeg(false)}
                  >
                    <Text style={[styles.chipText, !newMealIsVeg && styles.chipTextActive]}>Non-Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="add-meal-hasegg"
                    style={[styles.chip, newMealHasEgg && styles.chipActive]}
                    onPress={() => setNewMealHasEgg(!newMealHasEgg)}
                  >
                    <Text style={[styles.chipText, newMealHasEgg && styles.chipTextActive]}>{newMealHasEgg ? 'Egg ✓' : 'Egg ✗'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Pricing</Text>
                <TextInput
                  testID="add-meal-price"
                  style={styles.timeInput}
                  value={newMealPrice}
                  onChangeText={setNewMealPrice}
                  placeholder="Price (₹)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="add-meal-original-price"
                  style={styles.timeInput}
                  value={newMealOriginalPrice}
                  onChangeText={setNewMealOriginalPrice}
                  placeholder="Original Price (₹) - optional"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Media</Text>
                <TextInput
                  testID="add-meal-image"
                  style={styles.timeInput}
                  value={newMealImageUrl}
                  onChangeText={setNewMealImageUrl}
                  placeholder="Image URL (Unsplash etc.)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Visibility</Text>
                <View style={styles.roleChipsRow}>
                  <TouchableOpacity
                    testID="add-meal-active"
                    style={[styles.chip, newMealIsActive && styles.chipActive]}
                    onPress={() => setNewMealIsActive(!newMealIsActive)}
                  >
                    <Text style={[styles.chipText, newMealIsActive && styles.chipTextActive]}>{newMealIsActive ? 'Active' : 'Inactive'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="add-meal-featured"
                    style={[styles.chip, newMealIsFeatured && styles.chipActive]}
                    onPress={() => setNewMealIsFeatured(!newMealIsFeatured)}
                  >
                    <Text style={[styles.chipText, newMealIsFeatured && styles.chipTextActive]}>{newMealIsFeatured ? 'Featured ✓' : 'Featured ✗'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="add-meal-draft"
                    style={[styles.chip, newMealIsDraft && styles.chipActive]}
                    onPress={() => setNewMealIsDraft(!newMealIsDraft)}
                  >
                    <Text style={[styles.chipText, newMealIsDraft && styles.chipTextActive]}>{newMealIsDraft ? 'Draft' : 'Live'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Preparation & Tags</Text>
                <TextInput
                  testID="add-meal-prep"
                  style={styles.timeInput}
                  value={newMealPreparationTime}
                  onChangeText={setNewMealPreparationTime}
                  placeholder="Preparation Time (minutes)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="add-meal-tags"
                  style={styles.timeInput}
                  value={newMealTags}
                  onChangeText={setNewMealTags}
                  placeholder="Tags (comma separated)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Nutrition (optional)</Text>
                <TextInput
                  testID="add-meal-cal"
                  style={styles.timeInput}
                  value={newMealCalories}
                  onChangeText={setNewMealCalories}
                  placeholder="Calories"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="add-meal-protein"
                  style={styles.timeInput}
                  value={newMealProtein}
                  onChangeText={setNewMealProtein}
                  placeholder="Protein (g)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="add-meal-carbs"
                  style={styles.timeInput}
                  value={newMealCarbs}
                  onChangeText={setNewMealCarbs}
                  placeholder="Carbs (g)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="add-meal-fat"
                  style={styles.timeInput}
                  value={newMealFat}
                  onChangeText={setNewMealFat}
                  placeholder="Fat (g)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="add-meal-fiber"
                  style={styles.timeInput}
                  value={newMealFiber}
                  onChangeText={setNewMealFiber}
                  placeholder="Fiber (g)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                testID="add-meal-submit"
                style={styles.saveButton}
                onPress={handleAddMeal}
              >
                <Text style={styles.saveButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {showAddMeal && (
          <View style={styles.drawerOverlay} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={closeAddMealDrawer}>
              <Animated.View
                style={[
                  styles.drawerBackdrop,
                  { opacity: addMealDrawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }) },
                ]}
              />
            </TouchableWithoutFeedback>
            <Animated.View
              {...addMealPan.panHandlers}
              style={[
                styles.drawerSheet,
                { width: drawerWidth, transform: [{ translateX: addMealDrawerAnim.interpolate({ inputRange: [0, 1], outputRange: [drawerWidth, 0] }) }] },
              ]}
            >
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Meal</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeAddMealDrawer}
                  >
                    <X size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Meal Name</Text>
                    <TextInput
                      testID="add-meal-name"
                      style={styles.timeInput}
                      value={newMealName}
                      onChangeText={setNewMealName}
                      placeholder="Enter meal name"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Description</Text>
                    <TextInput
                      testID="add-meal-description"
                      style={[styles.timeInput, { height: 80 }]}
                      value={newMealDescription}
                      onChangeText={setNewMealDescription}
                      placeholder="Enter meal description"
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {categories.map((cat) => {
                        const active = newMealCategoryIds.includes(cat.id);
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            testID={`add-meal-category-${cat.id}`}
                            style={[styles.categoryFilterChip, (active || newMealCategoryId === cat.id) && styles.categoryFilterChipActive]}
                            onPress={() => {
                              setNewMealCategoryId(cat.id);
                              setNewMealCategoryIds(prev => active ? prev.filter(id => id !== cat.id) : [...prev, cat.id]);
                            }}
                          >
                            <Text style={[styles.categoryFilterText, (active || newMealCategoryId === cat.id) && styles.categoryFilterTextActive]}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {newMealCategoryIds.length === 0 && newMealCategoryId === '' && (
                      <Text style={[styles.settingDescription, { marginTop: 8 }]}>Please select at least one category</Text>
                    )}
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Diet Preference</Text>
                    <View style={styles.roleChipsRow}>
                      <TouchableOpacity
                        testID="add-meal-veg"
                        style={[styles.chip, newMealIsVeg && styles.chipActive]}
                        onPress={() => setNewMealIsVeg(true)}
                      >
                        <Text style={[styles.chipText, newMealIsVeg && styles.chipTextActive]}>Veg</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="add-meal-nonveg"
                        style={[styles.chip, !newMealIsVeg && styles.chipActive]}
                        onPress={() => setNewMealIsVeg(false)}
                      >
                        <Text style={[styles.chipText, !newMealIsVeg && styles.chipTextActive]}>Non-Veg</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="add-meal-hasegg"
                        style={[styles.chip, newMealHasEgg && styles.chipActive]}
                        onPress={() => setNewMealHasEgg(!newMealHasEgg)}
                      >
                        <Text style={[styles.chipText, newMealHasEgg && styles.chipTextActive]}>{newMealHasEgg ? 'Egg ✓' : 'Egg ✗'}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ height: 12 }} />
                    <Text style={styles.settingTitle}>Basic Thali & Variants</Text>
                    <View style={styles.roleChipsRow}>
                      <TouchableOpacity
                        testID="add-meal-basic-thali"
                        style={[styles.chip, newIsBasicThali && styles.chipActive]}
                        onPress={() => setNewIsBasicThali(!newIsBasicThali)}
                      >
                        <Text style={[styles.chipText, newIsBasicThali && styles.chipTextActive]}>{newIsBasicThali ? 'Basic Thali ✓' : 'Basic Thali ✗'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="add-meal-allow-day-selection"
                        style={[styles.chip, newAllowDaySelection && styles.chipActive]}
                        onPress={() => setNewAllowDaySelection(!newAllowDaySelection)}
                      >
                        <Text style={[styles.chipText, newAllowDaySelection && styles.chipTextActive]}>
                          {newAllowDaySelection ? 'Allow Day Selection ✓' : 'Allow Day Selection ✗'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {newIsBasicThali && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.settingDescription}>Set variant prices (leave blank to fallback to base price)</Text>
                        <TextInput
                          testID="add-meal-veg-price"
                          style={styles.timeInput}
                          value={newVegVariantPrice}
                          onChangeText={setNewVegVariantPrice}
                          placeholder="Veg variant price (₹)"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                        <View style={{ height: 10 }} />
                        <TextInput
                          testID="add-meal-nonveg-price"
                          style={styles.timeInput}
                          value={newNonVegVariantPrice}
                          onChangeText={setNewNonVegVariantPrice}
                          placeholder="Non-Veg variant price (₹)"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Pricing</Text>
                    <TextInput
                      testID="add-meal-price"
                      style={styles.timeInput}
                      value={newMealPrice}
                      onChangeText={setNewMealPrice}
                      placeholder="Price (₹)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <View style={{ height: 10 }} />
                    <TextInput
                      testID="add-meal-original-price"
                      style={styles.timeInput}
                      value={newMealOriginalPrice}
                      onChangeText={setNewMealOriginalPrice}
                      placeholder="Original Price (₹) - optional"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Media</Text>
                    <TextInput
                      testID="add-meal-image"
                      style={styles.timeInput}
                      value={newMealImageUrl}
                      onChangeText={setNewMealImageUrl}
                      placeholder="Image URL (Unsplash etc.)"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Visibility</Text>
                    <View style={styles.roleChipsRow}>
                      <TouchableOpacity
                        testID="add-meal-active"
                        style={[styles.chip, newMealIsActive && styles.chipActive]}
                        onPress={() => setNewMealIsActive(!newMealIsActive)}
                      >
                        <Text style={[styles.chipText, newMealIsActive && styles.chipTextActive]}>{newMealIsActive ? 'Active' : 'Inactive'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="add-meal-featured"
                        style={[styles.chip, newMealIsFeatured && styles.chipActive]}
                        onPress={() => setNewMealIsFeatured(!newMealIsFeatured)}
                      >
                        <Text style={[styles.chipText, newMealIsFeatured && styles.chipTextActive]}>{newMealIsFeatured ? 'Featured ✓' : 'Featured ✗'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="add-meal-draft"
                        style={[styles.chip, newMealIsDraft && styles.chipActive]}
                        onPress={() => setNewMealIsDraft(!newMealIsDraft)}
                      >
                        <Text style={[styles.chipText, newMealIsDraft && styles.chipTextActive]}>{newMealIsDraft ? 'Draft' : 'Live'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Preparation & Tags</Text>
                    <TextInput
                      testID="add-meal-prep"
                      style={styles.timeInput}
                      value={newMealPreparationTime}
                      onChangeText={setNewMealPreparationTime}
                      placeholder="Preparation Time (minutes)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <View style={{ height: 10 }} />
                    <TextInput
                      testID="add-meal-tags"
                      style={styles.timeInput}
                      value={newMealTags}
                      onChangeText={setNewMealTags}
                      placeholder="Tags (comma separated)"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingTitle}>Nutrition (optional)</Text>
                    <TextInput
                      testID="add-meal-cal"
                      style={styles.timeInput}
                      value={newMealCalories}
                      onChangeText={setNewMealCalories}
                      placeholder="Calories"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <View style={{ height: 10 }} />
                    <TextInput
                      testID="add-meal-protein"
                      style={styles.timeInput}
                      value={newMealProtein}
                      onChangeText={setNewMealProtein}
                      placeholder="Protein (g)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <View style={{ height: 10 }} />
                    <TextInput
                      testID="add-meal-carbs"
                      style={styles.timeInput}
                      value={newMealCarbs}
                      onChangeText={setNewMealCarbs}
                      placeholder="Carbs (g)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <View style={{ height: 10 }} />
                    <TextInput
                      testID="add-meal-fat"
                      style={styles.timeInput}
                      value={newMealFat}
                      onChangeText={setNewMealFat}
                      placeholder="Fat (g)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <View style={{ height: 10 }} />
                    <TextInput
                      testID="add-meal-fiber"
                      style={styles.timeInput}
                      value={newMealFiber}
                      onChangeText={setNewMealFiber}
                      placeholder="Fiber (g)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity
                    testID="add-meal-submit"
                    style={styles.saveButton}
                    onPress={handleAddMeal}
                  >
                    <Text style={styles.saveButtonText}>Add Meal</Text>
                  </TouchableOpacity>
                </ScrollView>
              </SafeAreaView>
            </Animated.View>
          </View>
        )}

        {/* Add Location Modal */}
        <Modal
          visible={showAddLocation}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddLocation(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Location Name</Text>
                <TextInput
                  style={styles.timeInput}
                  value={newLocationName}
                  onChangeText={setNewLocationName}
                  placeholder="Enter location name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Address</Text>
                <TextInput
                  style={[styles.timeInput, { height: 80 }]}
                  value={newLocationAddress}
                  onChangeText={setNewLocationAddress}
                  placeholder="Enter location address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => console.log('Map selection feature - would open polygon selector')}
              >
                <Text style={styles.saveButtonText}>Select Area on Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: '#10B981', marginTop: 10 }]}
                onPress={handleAddLocation}
              >
                <Text style={styles.saveButtonText}>Add Location</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* View Categories Modal */}
        <Modal
          visible={showViewCategories}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Categories ({categories.length})</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowViewCategories(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {categories.map((category) => (
                <View key={category.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{category.name}</Text>
                    <Text style={styles.itemDescription}>{category.description}</Text>
                    <Text style={styles.itemDescription}>Group: {category.group ? (category.group === 'meal-time' ? 'Meal-time' : 'Collection') : '—'}</Text>
                    <Text style={styles.itemStatus}>
                      Status: {category.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.editButton}>
                      <Edit size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                      <Trash2 size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Time Slots Modal */}
        <Modal
          visible={showTimeSlotsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery Time Slots ({timeSlots.length})</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowTimeSlotsModal(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Create New Slot</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="Time range (e.g., 12PM-2PM)"
                  placeholderTextColor="#9CA3AF"
                  value={newSlotTime}
                  onChangeText={setNewSlotTime}
                />
                <View style={{ height: 10 }} />
                <TextInput
                  style={styles.timeInput}
                  placeholder="Label (optional, e.g., Lunch)"
                  placeholderTextColor="#9CA3AF"
                  value={newSlotLabel}
                  onChangeText={setNewSlotLabel}
                />
                <View style={{ height: 12 }} />
                <TouchableOpacity style={styles.saveButton} onPress={handleAddTimeSlot}>
                  <Text style={styles.saveButtonText}>Add Slot</Text>
                </TouchableOpacity>
              </View>

              {timeSlots.map(slot => (
                <View key={slot.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{slot.time}</Text>
                    <Text style={styles.itemDescription}>{slot.label || '—'}</Text>
                    <Text style={styles.itemStatus}>Status: {(slot.isActive ?? true) ? 'Active' : 'Inactive'}</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => toggleSlotActive(slot.id)}>
                      <ToggleRight size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Assign Slots Modal */}
        <Modal
          visible={showAssignSlots}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Time Slots{assignSlotsMeal ? ` • ${assignSlotsMeal.name}` : ''}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowAssignSlots(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingDescription}>Select one or more delivery time slots for this meal.</Text>
                {timeSlots.map(slot => {
                  const active = assignSelectedSlots.includes(slot.id);
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.staffCard, { borderColor: active ? '#3B82F6' : '#E5E7EB' }]}
                      onPress={() => setAssignSelectedSlots(prev => active ? prev.filter(id => id !== slot.id) : [...prev, slot.id])}
                    >
                      <View style={styles.staffInfo}>
                        <View style={[styles.staffIcon, { backgroundColor: active ? '#3B82F6' : '#9CA3AF' }]}>
                          <Clock size={20} color="white" />
                        </View>
                        <View style={styles.staffDetails}>
                          <Text style={styles.staffName}>{slot.time}</Text>
                          <Text style={styles.staffContact}>{slot.label || '—'}</Text>
                        </View>
                      </View>
                      {active ? <Check size={20} color="#3B82F6" /> : <View />}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 12 }} />
                <TouchableOpacity style={styles.saveButton} onPress={saveAssignSlots}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* View Meals Modal */}
        <Modal
          visible={showViewMeals}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meals Management ({meals.length})</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowViewMeals(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Filter by Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
                  <TouchableOpacity
                    style={[
                      styles.categoryFilterChip,
                      selectedMealCategory === '' && styles.categoryFilterChipActive
                    ]}
                    onPress={() => setSelectedMealCategory('')}
                  >
                    <Text style={[
                      styles.categoryFilterText,
                      selectedMealCategory === '' && styles.categoryFilterTextActive
                    ]}>All</Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryFilterChip,
                        selectedMealCategory === category.id && styles.categoryFilterChipActive
                      ]}
                      onPress={() => setSelectedMealCategory(category.id)}
                    >
                      <Text style={[
                        styles.categoryFilterText,
                        selectedMealCategory === category.id && styles.categoryFilterTextActive
                      ]}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Meals List */}
              {meals
                .filter(meal => {
                  if (selectedMealCategory === '') return true;
                  const primaryMatch = meal.categoryId === selectedMealCategory;
                  const multiMatch = Array.isArray(meal.categoryIds) && meal.categoryIds.includes(selectedMealCategory);
                  return primaryMatch || multiMatch;
                })
                .map((meal) => {
                  const category = categories.find(cat => cat.id === meal.categoryId);
                  return (
                    <View key={meal.id} style={styles.mealCard}>
                      <View style={styles.mealImageContainer}>
                        {meal.images && meal.images[0] ? (
                          <View style={styles.mealImagePlaceholder}>
                            <Text style={styles.mealImageText}>📷</Text>
                          </View>
                        ) : (
                          <View style={styles.mealImagePlaceholder}>
                            <Text style={styles.mealImageText}>🍽️</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.mealInfo}>
                        <View style={styles.mealHeader}>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          <View style={styles.mealBadges}>
                            <View style={[
                              styles.vegBadge,
                              { backgroundColor: meal.isVeg ? '#4CAF50' : '#F44336' }
                            ]}>
                              <Text style={styles.vegBadgeText}>
                                {meal.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                              </Text>
                            </View>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: meal.isActive ? '#10B981' : '#6B7280' }
                            ]}>
                              <Text style={styles.statusText}>
                                {meal.isActive ? 'Active' : 'Inactive'}
                              </Text>
                            </View>
                            <View style={[
                              styles.draftBadge,
                              { backgroundColor: meal.isDraft ? '#F59E0B' : '#10B981' }
                            ]}>
                              <Text style={styles.draftBadgeText}>
                                {meal.isDraft ? '📝 Draft' : '✅ Live'}
                              </Text>
                            </View>
                          </View>
                        </View>
                        
                        <Text style={styles.mealDescription} numberOfLines={2}>
                          {meal.description}
                        </Text>
                        
                        <View style={styles.mealDetails}>
                          <Text style={styles.mealPrice}>₹{meal.price}</Text>
                          {meal.originalPrice && (
                            <Text style={styles.mealOriginalPrice}>₹{meal.originalPrice}</Text>
                          )}
                          <Text style={styles.mealCategory}>• {category?.name || 'Uncategorized'}</Text>
                        </View>
                        
                        {meal.rating && (
                          <View style={styles.mealRating}>
                            <Text style={styles.ratingText}>⭐ {meal.rating}</Text>
                            <Text style={styles.reviewCount}>({meal.reviewCount} reviews)</Text>
                          </View>
                        )}
                        
                        <View style={styles.mealActions}>
                          <TouchableOpacity 
                            style={styles.previewButton}
                            onPress={() => {
                              console.log('Opening meal preview for:', meal.name);
                              router.push(`/meal/${meal.id}` as any);
                            }}
                          >
                            <Eye size={16} color="white" />
                            <Text style={styles.previewButtonText}>Preview</Text>
                          </TouchableOpacity>
                          
                         
                          <TouchableOpacity 
                            style={styles.categoryButton}
                            onPress={() => openAssignSlotsModal(meal)}
                          >
                            <Clock size={16} color="white" />
                            <Text style={styles.categoryButtonText}>Time Slots</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.categoryButton}
                            onPress={() => {
                              console.log('Assign category for meal:', meal.name);
                              Alert.alert(
                                'Assign Category',
                                `Current category: ${category?.name || 'None'}\n\nIn a full implementation, this would open a category selection modal.`,
                                [
                                  { text: 'OK' }
                                ]
                              );
                            }}
                          >
                            <Settings size={16} color="white" />
                            <Text style={styles.categoryButtonText}>Category</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.editButton} onPress={() => openEditMeal(meal)}>
                            <Edit size={16} color="white" />
                          </TouchableOpacity>
                           <TouchableOpacity 
                            style={[
                              styles.draftToggleButton,
                              { backgroundColor: meal.isDraft ? '#F59E0B' : '#10B981' }
                            ]}
                            onPress={() => handleToggleDraftMode(meal.id)}
                          >
                            {meal.isDraft ? (
                              <ToggleLeft size={16} color="white" />
                            ) : (
                              <ToggleRight size={16} color="white" />
                            )}
                            <Text style={styles.draftToggleText}>
                              {meal.isDraft ? 'Draft' : 'Live'}
                            </Text>
                          </TouchableOpacity>

                          
                          <TouchableOpacity style={styles.deleteButton}>
                            <Trash2 size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              }
              
              {meals.filter(meal => {
                if (selectedMealCategory === '') return true;
                const primaryMatch = meal.categoryId === selectedMealCategory;
                const multiMatch = Array.isArray(meal.categoryIds) && meal.categoryIds.includes(selectedMealCategory);
                return primaryMatch || multiMatch;
              }).length === 0 && (
                <View style={styles.emptyMealsContainer}>
                  <ChefHat size={48} color="#9CA3AF" />
                  <Text style={styles.emptyMealsTitle}>No Meals Found</Text>
                  <Text style={styles.emptyMealsDescription}>
                    {selectedMealCategory ? 'No meals in this category.' : 'No meals available.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Edit Meal Modal */}
        <Modal
          visible={showEditMeal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Meal</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowEditMeal(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Basic Info</Text>
                <TextInput
                  testID="edit-meal-name"
                  style={styles.timeInput}
                  value={editMealName}
                  onChangeText={setEditMealName}
                  placeholder="Meal name"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="edit-meal-description"
                  style={[styles.timeInput, { height: 80 }]}
                  value={editMealDescription}
                  onChangeText={setEditMealDescription}
                  placeholder="Description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {categories.map((cat) => {
                    const active = editMealCategoryIds.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        testID={`edit-meal-category-${cat.id}`}
                        style={[styles.categoryFilterChip, (active || editMealCategoryId === cat.id) && styles.categoryFilterChipActive]}
                        onPress={() => {
                          setEditMealCategoryId(cat.id);
                          setEditMealCategoryIds(prev => active ? prev.filter(id => id !== cat.id) : [...prev, cat.id]);
                        }}
                      >
                        <Text style={[styles.categoryFilterText, (active || editMealCategoryId === cat.id) && styles.categoryFilterTextActive]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {editMealCategoryIds.length === 0 && (
                  <Text style={[styles.settingDescription, { marginTop: 8 }]}>Please select at least one category</Text>
                )}
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Diet Preference</Text>
                <View style={styles.roleChipsRow}>
                  <TouchableOpacity
                    testID="edit-meal-veg"
                    style={[styles.chip, editMealIsVeg && styles.chipActive]}
                    onPress={() => setEditMealIsVeg(true)}
                  >
                    <Text style={[styles.chipText, editMealIsVeg && styles.chipTextActive]}>Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="edit-meal-nonveg"
                    style={[styles.chip, !editMealIsVeg && styles.chipActive]}
                    onPress={() => setEditMealIsVeg(false)}
                  >
                    <Text style={[styles.chipText, !editMealIsVeg && styles.chipTextActive]}>Non-Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="edit-meal-hasegg"
                    style={[styles.chip, editMealHasEgg && styles.chipActive]}
                    onPress={() => setEditMealHasEgg(!editMealHasEgg)}
                  >
                    <Text style={[styles.chipText, editMealHasEgg && styles.chipTextActive]}>{editMealHasEgg ? 'Egg ✓' : 'Egg ✗'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Pricing</Text>
                <TextInput
                  testID="edit-meal-price"
                  style={styles.timeInput}
                  value={editMealPrice}
                  onChangeText={setEditMealPrice}
                  placeholder="Price (₹)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="edit-meal-original-price"
                  style={styles.timeInput}
                  value={editMealOriginalPrice}
                  onChangeText={setEditMealOriginalPrice}
                  placeholder="Original Price (₹)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Media</Text>
                <TextInput
                  testID="edit-meal-image"
                  style={styles.timeInput}
                  value={editMealImageUrl}
                  onChangeText={setEditMealImageUrl}
                  placeholder="Image URL"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Visibility</Text>
                <View style={styles.roleChipsRow}>
                  <TouchableOpacity
                    testID="edit-meal-active"
                    style={[styles.chip, editMealIsActive && styles.chipActive]}
                    onPress={() => setEditMealIsActive(!editMealIsActive)}
                  >
                    <Text style={[styles.chipText, editMealIsActive && styles.chipTextActive]}>{editMealIsActive ? 'Active' : 'Inactive'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="edit-meal-featured"
                    style={[styles.chip, editMealIsFeatured && styles.chipActive]}
                    onPress={() => setEditMealIsFeatured(!editMealIsFeatured)}
                  >
                    <Text style={[styles.chipText, editMealIsFeatured && styles.chipTextActive]}>{editMealIsFeatured ? 'Featured ✓' : 'Featured ✗'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="edit-meal-draft"
                    style={[styles.chip, editMealIsDraft && styles.chipActive]}
                    onPress={() => setEditMealIsDraft(!editMealIsDraft)}
                  >
                    <Text style={[styles.chipText, editMealIsDraft && styles.chipTextActive]}>{editMealIsDraft ? 'Draft' : 'Live'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Preparation & Tags</Text>
                <TextInput
                  testID="edit-meal-prep"
                  style={styles.timeInput}
                  value={editMealPreparationTime}
                  onChangeText={setEditMealPreparationTime}
                  placeholder="Preparation Time (minutes)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <View style={{ height: 10 }} />
                <TextInput
                  testID="edit-meal-tags"
                  style={styles.timeInput}
                  value={editMealTags}
                  onChangeText={setEditMealTags}
                  placeholder="Tags (comma separated)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                testID="edit-meal-submit"
                style={styles.saveButton}
                onPress={async () => {
                  if (!editMealId) { Alert.alert('Error', 'No meal selected'); return; }
                  if (!editMealName.trim() || !editMealDescription.trim() || !editMealPrice.trim() || editMealCategoryIds.length === 0) {
                    Alert.alert('Error', 'Please fill all required fields');
                    return;
                  }
                  try {
                    const price = parseFloat(editMealPrice);
                    const originalPrice = editMealOriginalPrice.trim() ? parseFloat(editMealOriginalPrice) : undefined;
                    const preparationTime = editMealPreparationTime.trim() ? parseInt(editMealPreparationTime, 10) : undefined;
                    const tags = editMealTags.split(',').map(t => t.trim()).filter(Boolean);
                    const payload: Partial<Meal> = {
                      name: editMealName.trim(),
                      description: editMealDescription.trim(),
                      price,
                      originalPrice,
                      images: [editMealImageUrl.trim()].filter(Boolean),
                      categoryId: editMealCategoryId || editMealCategoryIds[0],
                      categoryIds: editMealCategoryIds,
                      isVeg: editMealIsVeg,
                      hasEgg: editMealHasEgg,
                      isActive: editMealIsActive,
                      isFeatured: editMealIsFeatured,
                      isDraft: editMealIsDraft,
                      preparationTime,
                      tags: tags.length ? tags : undefined,
                    };
                    const updated = await db.updateMeal(editMealId, payload);
                    if (!updated) throw new Error('Update failed');
                    Alert.alert('Success', 'Meal updated successfully');
                    setShowEditMeal(false);
                    await loadMealsData();
                  } catch (e) {
                    console.log('edit meal save error', e);
                    Alert.alert('Error', 'Failed to update meal');
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* View Locations Modal */}
        <Modal
          visible={showViewLocations}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Locations ({locations.length})</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowViewLocations(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {locations.map((location) => (
                <View key={location.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{location.name}</Text>
                    <Text style={styles.itemDescription}>
                      Delivery Fee: ₹{location.deliveryFee}
                    </Text>
                    <Text style={styles.itemDescription}>
                      Radius: {location.radius}km
                    </Text>
                    <Text style={styles.itemStatus}>
                      Status: {location.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.editButton}>
                      <Edit size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                      <Trash2 size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {notifyRequests.length > 0 && (
                <View style={styles.notifySection}>
                  <Text style={styles.sectionSubtitle}>Notify Me Requests ({notifyRequests.length})</Text>
                  {notifyRequests.map((request) => (
                    <View key={request.id} style={styles.notifyCard}>
                      <Text style={styles.itemName}>{request.name}</Text>
                      <Text style={styles.itemDescription}>{request.phone}</Text>
                      <Text style={styles.itemDescription}>{request.location}</Text>
                      <Text style={styles.itemStatus}>
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Invoice Generation Modal */}
        <Modal
          visible={showInvoiceModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Invoice</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowInvoiceModal(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedInvoiceSubscription && (
                <View>
                  <View style={styles.invoicePreview}>
                    <Text style={styles.invoiceTitle}>Invoice Preview</Text>
                    <View style={styles.invoiceDetails}>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Invoice Number:</Text>
                        <Text style={styles.invoiceValue}>INV-{selectedInvoiceSubscription.id.slice(-8).toUpperCase()}</Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Customer:</Text>
                        <Text style={styles.invoiceValue}>{users.find(u => u.id === selectedInvoiceSubscription.userId)?.name}</Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Subscription ID:</Text>
                        <Text style={styles.invoiceValue}>#{selectedInvoiceSubscription.id.slice(-6)}</Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Total Amount:</Text>
                        <Text style={styles.invoiceValue}>₹{selectedInvoiceSubscription.totalAmount}</Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Paid Amount:</Text>
                        <Text style={styles.invoiceValue}>₹{selectedInvoiceSubscription.paidAmount || 0}</Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Payment Status:</Text>
                        <Text style={[
                          styles.invoiceValue,
                          {
                            color: (selectedInvoiceSubscription.paidAmount || 0) >= selectedInvoiceSubscription.totalAmount 
                              ? '#10B981' : '#EF4444'
                          }
                        ]}>
                          {(selectedInvoiceSubscription.paidAmount || 0) >= selectedInvoiceSubscription.totalAmount ? 'Paid' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.invoiceActions}>
                    <TouchableOpacity
                      style={[styles.invoiceActionButton, { backgroundColor: '#3B82F6' }]}
                      onPress={() => handleDownloadInvoice(selectedInvoiceSubscription)}
                    >
                      <Download size={20} color="white" />
                      <Text style={styles.invoiceActionText}>Download PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.invoiceActionButton, { backgroundColor: '#10B981' }]}
                      onPress={() => handlePrintInvoice(selectedInvoiceSubscription)}
                    >
                      <Printer size={20} color="white" />
                      <Text style={styles.invoiceActionText}>Print Invoice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.invoiceActionButton, { backgroundColor: '#8B5CF6' }]}
                      onPress={() => {
                        const user = users.find(u => u.id === selectedInvoiceSubscription.userId);
                        if (user) {
                          const shareText = `Invoice for ${user.name}\nSubscription ID: #${selectedInvoiceSubscription.id.slice(-6)}\nAmount: ₹${selectedInvoiceSubscription.totalAmount}`;
                          if (Platform.OS === 'web') {
                            navigator.clipboard.writeText(shareText);
                            Alert.alert('Success', 'Invoice details copied to clipboard');
                          } else {
                            console.log('Share invoice:', shareText);
                            Alert.alert('Share', shareText);
                          }
                        }
                      }}
                    >
                      <Share size={20} color="white" />
                      <Text style={styles.invoiceActionText}>Share Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Promotional Admin Modal */}
        <PromotionalAdmin
          visible={showPromotionalAdmin}
          onClose={() => setShowPromotionalAdmin(false)}
        />

        {/* Users Management Modal */}
        <Modal
          visible={showUsersManagement}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Users Management</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowUsersManagement(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Search & Filters</Text>
                <TextInput
                  testID="users-search-input"
                  style={styles.timeInput}
                  placeholder="Search by name, phone, or email"
                  placeholderTextColor="#9CA3AF"
                  value={userSearch}
                  onChangeText={setUserSearch}
                />
                <View style={{ height: 12 }} />
                <Text style={[styles.settingDescription, { marginBottom: 8 }]}>Role</Text>
                <View style={styles.roleChipsRow}>
                  {(['all','customer','kitchen','delivery','admin'] as Array<UserRole | 'all'>).map((r) => (
                    <TouchableOpacity
                      key={r}
                      testID={`users-filter-role-${r}`}
                      onPress={() => setRoleFilter(r)}
                      style={[styles.chip, (roleFilter === r) && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, (roleFilter === r) && styles.chipTextActive]}>
                        {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ height: 12 }} />
                <Text style={[styles.settingDescription, { marginBottom: 8 }]}>Status</Text>
                <View style={styles.roleChipsRow}>
                  {(['all','active','inactive'] as Array<'all'|'active'|'inactive'>).map((s) => (
                    <TouchableOpacity
                      key={s}
                      testID={`users-filter-status-${s}`}
                      onPress={() => setStatusFilter(s)}
                      style={[styles.chip, (statusFilter === s) && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, (statusFilter === s) && styles.chipTextActive]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {filteredUsers.map((u) => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userItemName}>{u.name}</Text>
                    <Text style={styles.userMeta}>{u.phone} • {u.email}</Text>
                    <View style={styles.userBadges}>
                      <View style={[styles.roleBadge, { backgroundColor: u.role === 'admin' ? '#EF4444' : u.role === 'kitchen' ? '#10B981' : u.role === 'delivery' ? '#F59E0B' : '#3B82F6' }]}>
                        <Text style={styles.roleBadgeText}>{u.role.toUpperCase()}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: u.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Text style={[styles.statusPillText, { color: u.isActive ? '#065F46' : '#991B1B' }]}>{u.isActive ? 'Active' : 'Inactive'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <View style={styles.roleChipsRow}>
                      {(['customer','kitchen','delivery'] as UserRole[]).map((r) => (
                        <TouchableOpacity
                          key={r}
                          testID={`set-role-${u.id}-${r}`}
                          onPress={() => changeUserRole(u, r)}
                          disabled={updatingUserId === u.id}
                          style={[styles.chip, u.role === r && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, u.role === r && styles.chipTextActive]}>
                            {r === 'customer' ? 'Normal' : r.charAt(0).toUpperCase() + r.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      testID={`toggle-active-${u.id}`}
                      onPress={() => toggleUserActive(u)}
                      style={[styles.toggleActiveBtn, { backgroundColor: u.isActive ? '#6B7280' : '#10B981' }]}
                      disabled={updatingUserId === u.id}
                    >
                      <Text style={styles.toggleActiveText}>{u.isActive ? 'Deactivate' : 'Activate'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {filteredUsers.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Users size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No users found</Text>
                  <Text style={styles.emptyDescription}>Try a different search.</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  searchRow: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  quickBar: {
    paddingRight: 20,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
    gap: 6,
  },
  quickPillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  quickActionButton: {
    display: 'none',
  },
  quickActionText: {
    display: 'none',
  },
  subscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionUser: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  subscriptionPhone: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  subscriptionId: {
    fontSize: 12,
    color: '#6B7280',
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
  subscriptionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  subscriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paidAmount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  assignmentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  assignmentTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  assignButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  assignButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  assignmentStatus: {
    marginTop: 4,
  },
  assignedText: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 2,
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
  settingSection: {
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
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  currentSettings: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  currentSettingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  currentSettingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
  },
  drawerSheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  staffCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  staffIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  staffContact: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  staffVehicle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 2,
  },
  itemStatus: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 6,
  },
  notifySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notifyCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  filterSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryFilter: {
    flexDirection: 'row',
  },
  categoryFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryFilterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: 'white',
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealImageContainer: {
    marginRight: 16,
  },
  mealImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealImageText: {
    fontSize: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  mealBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  vegBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vegBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  mealDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  mealDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 8,
  },
  mealOriginalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  mealCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  mealRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  draftBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  draftBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  draftToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  draftToggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyMealsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyMealsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMealsDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  invoiceButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  invoicePreview: {
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
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  invoiceDetails: {
    gap: 12,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  invoiceValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  invoiceActions: {
    gap: 12,
  },
  invoiceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  invoiceActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    marginBottom: 12,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userActions: {
    gap: 12,
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextActive: {
    color: 'white',
  },
  mealsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  mealsHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mealsAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mealsAddBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  mealsViewAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealsViewAllText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  mealsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  mealTinyCard: {
    width: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'white',
  },
  mealTinyThumb: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mealTinyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  mealTinyMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 6,
  },
  mealTinyBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  toggleActiveBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleActiveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});