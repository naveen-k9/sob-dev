import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  Book,
  Headphones,
  FileText,
  Send,
  ExternalLink,
  Clock,
  MapPin,
  CreditCard,
  Package,
  Users,
  Shield,
  AlertCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { LayoutStyles } from "@/constants/layout";
import { useAuth } from "@/contexts/AuthContext";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: any;
}

interface ContactMethod {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  color: string;
}

const HelpSupportScreen: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const categories = [
    { id: "all", label: "All", icon: HelpCircle },
    { id: "orders", label: "Orders", icon: Package },
    { id: "delivery", label: "Delivery", icon: MapPin },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "subscription", label: "Subscription", icon: Clock },
    { id: "account", label: "Account", icon: Users },
  ];

  const faqs: FAQ[] = [
    {
      id: "1",
      category: "orders",
      question: "How do I place an order?",
      answer:
        "To place an order:\n1. Browse the menu from the Home or Menu tab\n2. Select your desired meals and add them to cart\n3. Choose delivery time and address\n4. Proceed to checkout and complete payment\n5. You'll receive an order confirmation with details",
      icon: Package,
    },
    {
      id: "2",
      category: "orders",
      question: "Can I modify or cancel my order?",
      answer:
        'You can modify or cancel your order before the cutoff time (usually 8 PM for next day delivery). Go to Orders tab, select your order, and tap "Modify" or "Cancel". Refunds for cancellations are processed within 5-7 business days.',
      icon: Package,
    },
    {
      id: "3",
      category: "orders",
      question: "What is the minimum order amount?",
      answer:
        "The minimum order amount is ₹99. Orders below this amount cannot be processed. We recommend ordering for multiple meals or subscribing to our meal plans for better value.",
      icon: Package,
    },
    {
      id: "4",
      category: "delivery",
      question: "What are your delivery timings?",
      answer:
        "We offer flexible delivery slots:\n• Breakfast: 7:00 AM - 10:00 AM\n• Lunch: 12:00 PM - 2:00 PM\n• Dinner: 7:00 PM - 9:00 PM\n\nYou can choose your preferred time slot during checkout.",
      icon: MapPin,
    },
    {
      id: "5",
      category: "delivery",
      question: "Do you deliver to my area?",
      answer:
        "Enter your delivery address to check serviceability. We're constantly expanding our delivery zones. If we don't serve your area yet, you can request service area notification and we'll inform you when we start delivering there.",
      icon: MapPin,
    },
    {
      id: "6",
      category: "delivery",
      question: "What is the delivery fee?",
      answer:
        "Delivery fee is ₹40 per order. However, it's FREE for orders above ₹299. Subscription members enjoy free delivery on all orders.",
      icon: MapPin,
    },
    {
      id: "7",
      category: "payment",
      question: "What payment methods do you accept?",
      answer:
        "We accept multiple payment methods:\n• Credit/Debit Cards (Visa, MasterCard, RuPay)\n• UPI (Google Pay, PhonePe, Paytm, etc.)\n• Net Banking\n• Wallets (Paytm, Amazon Pay, etc.)\n• Cash on Delivery (selected areas)",
      icon: CreditCard,
    },
    {
      id: "8",
      category: "payment",
      question: "Is my payment information secure?",
      answer:
        "Yes, absolutely! We use industry-standard encryption and secure payment gateways (Razorpay). We never store your complete card details. All transactions are PCI DSS compliant.",
      icon: Shield,
    },
    {
      id: "9",
      category: "payment",
      question: "How do I get a refund?",
      answer:
        "Refunds are processed automatically for cancelled orders. The amount is credited to:\n• Original payment method: 5-7 business days\n• Wallet: Instantly\n\nFor issues with delivered orders, contact support for refund processing.",
      icon: CreditCard,
    },
    {
      id: "10",
      category: "subscription",
      question: "How do meal subscriptions work?",
      answer:
        "Our subscription plans offer:\n• Discounted rates on meals\n• Free delivery on all orders\n• Priority support\n• Flexible pause/resume options\n• No commitment - cancel anytime\n\nChoose from weekly, monthly, or custom plans.",
      icon: Clock,
    },
    {
      id: "11",
      category: "subscription",
      question: "Can I pause my subscription?",
      answer:
        "Yes! You can pause your subscription anytime from Profile > Subscriptions. Pausing is useful for vacations or temporary breaks. Your subscription days will be extended accordingly.",
      icon: Clock,
    },
    {
      id: "12",
      category: "subscription",
      question: "How do I cancel my subscription?",
      answer:
        'To cancel:\n1. Go to Profile > Subscriptions\n2. Select your active subscription\n3. Tap "Cancel Subscription"\n4. Confirm cancellation\n\nYou\'ll continue to receive meals until your paid period ends.',
      icon: Clock,
    },
    {
      id: "13",
      category: "account",
      question: "How do I update my profile information?",
      answer:
        'Go to Profile tab and tap "Edit Profile". You can update:\n• Name and phone number\n• Email address\n• Delivery addresses\n• Dietary preferences\n• Notification settings',
      icon: Users,
    },
    {
      id: "14",
      category: "account",
      question: "How does the referral program work?",
      answer:
        "Share your unique referral code with friends. When they make their first order:\n• They get ₹100 off\n• You earn ₹100 in wallet\n\nBonus is credited after successful delivery. No limit on referrals!",
      icon: Users,
    },
    {
      id: "15",
      category: "account",
      question: "What is the wallet and how do I use it?",
      answer:
        "Your wallet stores credits from:\n• Referral bonuses\n• Streak rewards\n• Refunds\n• Promotional offers\n\nWallet balance is auto-applied during checkout. You can also manually select wallet payment.",
      icon: CreditCard,
    },
  ];

  const contactMethods: ContactMethod[] = [
    {
      id: "1",
      title: "Phone Support",
      description: "Call us: +91 98765 43210",
      icon: Phone,
      color: Colors.primary,
      action: () => {
        Linking.openURL("tel:+919876543210");
      },
    },
    {
      id: "2",
      title: "WhatsApp",
      description: "Chat with us on WhatsApp",
      icon: MessageCircle,
      color: "#25D366",
      action: () => {
        Linking.openURL("https://wa.me/919876543210?text=Hi, I need help with");
      },
    },
    {
      id: "3",
      title: "Email Support",
      description: "support@sameoldbox.com",
      icon: Mail,
      color: "#EA4335",
      action: () => {
        Linking.openURL("mailto:support@sameoldbox.com");
      },
    },
    {
      id: "4",
      title: "Create Ticket",
      description: "Submit a support ticket",
      icon: FileText,
      color: Colors.accent,
      action: () => {
        if (user) {
          router.push("/support/create" as any);
        } else {
          Alert.alert(
            "Login Required",
            "Please login to create a support ticket"
          );
        }
      },
    },
  ];

  const quickLinks = [
    {
      id: "1",
      title: "Terms & Conditions",
      icon: FileText,
      action: () => {
        Linking.openURL("https://sameoldbox.com/terms");
      },
    },
    {
      id: "2",
      title: "Privacy Policy",
      icon: Shield,
      action: () => {
        Linking.openURL("https://sameoldbox.com/privacy");
      },
    },
    {
      id: "3",
      title: "Refund Policy",
      icon: CreditCard,
      action: () => {
        Linking.openURL("https://sameoldbox.com/refunds");
      },
    },
    {
      id: "4",
      title: "View Support Tickets",
      icon: Headphones,
      action: () => {
        if (user) {
          router.push("/support" as any);
        } else {
          Alert.alert("Login Required", "Please login to view support tickets");
        }
      },
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackMessage.trim()) {
      Alert.alert("Required", "Please enter your feedback");
      return;
    }

    // In a real app, this would send to backend
    Alert.alert(
      "Thank You!",
      "Your feedback has been submitted. We appreciate your input!",
      [
        {
          text: "OK",
          onPress: () => {
            setFeedbackMessage("");
            setShowFeedbackForm(false);
          },
        },
      ]
    );
  };

  const renderCategoryChip = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryChip,
        selectedCategory === category.id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <category.icon
        size={16}
        color={selectedCategory === category.id ? "#fff" : Colors.primary}
      />
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === category.id && styles.categoryChipTextActive,
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  const renderFAQ = (faq: FAQ) => {
    const isExpanded = expandedFAQ === faq.id;

    return (
      <View key={faq.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => toggleFAQ(faq.id)}
          activeOpacity={0.7}
        >
          <View style={styles.faqIconContainer}>
            <faq.icon size={20} color={Colors.primary} />
          </View>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          {isExpanded ? (
            <ChevronUp size={20} color={Colors.mutedText} />
          ) : (
            <ChevronDown size={20} color={Colors.mutedText} />
          )}
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderContactMethod = (method: ContactMethod) => (
    <TouchableOpacity
      key={method.id}
      style={styles.contactCard}
      onPress={method.action}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.contactIconContainer,
          { backgroundColor: method.color + "15" },
        ]}
      >
        <method.icon size={24} color={method.color} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{method.title}</Text>
        <Text style={styles.contactDescription}>{method.description}</Text>
      </View>
      <ExternalLink size={20} color={Colors.mutedText} />
    </TouchableOpacity>
  );

  const renderQuickLink = (link: any) => (
    <TouchableOpacity
      key={link.id}
      style={styles.quickLinkItem}
      onPress={link.action}
      activeOpacity={0.7}
    >
      <link.icon size={20} color={Colors.primary} />
      <Text style={styles.quickLinkText}>{link.title}</Text>
      <ExternalLink size={16} color={Colors.mutedText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Headphones size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Search our FAQs or contact support for assistance
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={Colors.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionSubtitle}>
            Choose your preferred way to reach us
          </Text>
          {contactMethods.map(renderContactMethod)}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.faqHeader}>
            <Book size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(renderCategoryChip)}
          </ScrollView>

          {/* FAQ List */}
          {filteredFAQs.length > 0 ? (
            <View style={styles.faqList}>{filteredFAQs.map(renderFAQ)}</View>
          ) : (
            <View style={styles.noResultsContainer}>
              <AlertCircle size={48} color={Colors.mutedText} />
              <Text style={styles.noResultsText}>No FAQs found</Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your search or category filter
              </Text>
            </View>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          {quickLinks.map(renderQuickLink)}
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.sectionTitle}>Send Feedback</Text>
            {!showFeedbackForm && (
              <TouchableOpacity
                style={styles.showFeedbackButton}
                onPress={() => setShowFeedbackForm(!showFeedbackForm)}
              >
                <Send size={16} color={Colors.primary} />
                <Text style={styles.showFeedbackButtonText}>Give Feedback</Text>
              </TouchableOpacity>
            )}
          </View>

          {showFeedbackForm && (
            <View style={styles.feedbackForm}>
              <Text style={styles.feedbackLabel}>
                Help us improve by sharing your thoughts
              </Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Tell us what you think..."
                placeholderTextColor={Colors.mutedText}
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.feedbackActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setFeedbackMessage("");
                    setShowFeedbackForm(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitFeedback}
                >
                  <Send size={16} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Business Hours */}
        <View style={styles.businessHours}>
          <Clock size={20} color={Colors.mutedText} />
          <View style={styles.businessHoursText}>
            <Text style={styles.businessHoursTitle}>Support Hours</Text>
            <Text style={styles.businessHoursSubtitle}>
              Monday - Sunday: 8:00 AM - 10:00 PM IST
            </Text>
          </View>
        </View>

        {/* App Version */}
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: Colors.primary,
    padding: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -25,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: Colors.mutedText,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 22,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.mutedText,
    textAlign: "center",
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  showFeedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primary + "15",
  },
  showFeedbackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  feedbackForm: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackLabel: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 12,
  },
  feedbackInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 12,
  },
  feedbackActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  businessHours: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    marginBottom: 20,
  },
  businessHoursText: {
    flex: 1,
  },
  businessHoursTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  businessHoursSubtitle: {
    fontSize: 14,
    color: Colors.mutedText,
  },
  appVersion: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.mutedText,
    marginBottom: 20,
  },
});

export default HelpSupportScreen;
