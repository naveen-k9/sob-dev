import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
  SafeAreaView,
} from 'react-native';
import {
  Gift,
  Users,
  Flame,
  Trophy,
  Copy,
  Share2,
  Wallet,
  Star,
  Calendar,
  Target,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import db from '@/db';
import { ReferralReward, StreakReward } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReferScreen() {
  const { user } = useAuth();
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([]);
  const [streakRewards, setStreakRewards] = useState<StreakReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [referrals, streaks] = await Promise.all([
        db.getReferralRewards(user.id),
        db.getStreakRewards(user.id),
      ]);
      
      setReferralRewards(referrals);
      setStreakRewards(streaks);
    } catch (error) {
      console.error('Error loading refer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (!user?.referralCode) return;
    
    try {
      await Clipboard.setString(user.referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareReferralCode = async () => {
    if (!user?.referralCode) return;
    
    try {
      const message = `Hey! Join me on this amazing food delivery app and get healthy meals delivered to your doorstep. Use my referral code ${user.referralCode} and we both get ₹500 when you subscribe to a 26-day plan! 🍽️✨`;
      
      await Share.share({
        message,
        title: 'Join me for healthy meals!',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStreakMilestones = () => {
    return [
      { streak: 7, amount: 50, achieved: (user?.longestStreak || 0) >= 7 },
      { streak: 15, amount: 100, achieved: (user?.longestStreak || 0) >= 15 },
      { streak: 30, amount: 200, achieved: (user?.longestStreak || 0) >= 30 },
      { streak: 50, amount: 300, achieved: (user?.longestStreak || 0) >= 50 },
      { streak: 100, amount: 500, achieved: (user?.longestStreak || 0) >= 100 },
    ];
  };

  const getNextStreakMilestone = () => {
    const milestones = getStreakMilestones();
    return milestones.find(m => !m.achieved);
  };
  const insets = useSafeAreaInsets();

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loginPrompt}>
          <Gift size={64} color="#48479B" />
          <Text style={styles.loginPromptTitle}>Login to Access Rewards</Text>
          <Text style={styles.loginPromptText}>
            Login to view your referral code, streak rewards, and earnings
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextMilestone = getNextStreakMilestone();
  const streaksToNext = nextMilestone ? nextMilestone.streak - (user.currentStreak || 0) : 0;

  return (
    <SafeAreaView  style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <Text style={styles.headerSubtitle}>
            Share the love and earn rewards together!
          </Text>
        </View>

        {/* Referral Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gift size={24} color="#48479B" />
            <Text style={styles.sectionTitle}>Your Referral Code</Text>
          </View>
          
          <View style={styles.referralCard}>
            <Text style={styles.referralCode}>{user.referralCode}</Text>
            <View style={styles.referralActions}>
              <TouchableOpacity style={styles.actionButton} onPress={copyReferralCode}>
                <Copy size={20} color="#48479B" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={shareReferralCode}>
                <Share2 size={20} color="#48479B" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.referralInfo}>
            <Text style={styles.referralInfoText}>
              🎁 Both you and your friend get ₹500 when they subscribe to a 26-day plan!
            </Text>
          </View>
        </View>

        {/* Referral Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color="#10B981" />
              <Text style={styles.statNumber}>{user.totalReferrals}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
            </View>
            <View style={styles.statCard}>
              <Wallet size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>₹{user.referralEarnings}</Text>
              <Text style={styles.statLabel}>Referral Earnings</Text>
            </View>
          </View>
        </View>

        {/* Streak Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flame size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Order Streak</Text>
          </View>
          
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.streakCurrent}>
                <Text style={styles.streakNumber}>{user.currentStreak}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
              <View style={styles.streakBest}>
                <Trophy size={20} color="#F59E0B" />
                <Text style={styles.streakBestText}>Best: {user.longestStreak}</Text>
              </View>
            </View>
            
            {nextMilestone && (
              <View style={styles.nextMilestone}>
                <Target size={16} color="#6B7280" />
                <Text style={styles.nextMilestoneText}>
                  {streaksToNext} more orders to earn ₹{nextMilestone.amount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Streak Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Rewards</Text>
          <View style={styles.milestones}>
            {getStreakMilestones().map((milestone, index) => (
              <View key={index} style={[
                styles.milestoneItem,
                milestone.achieved && styles.milestoneAchieved
              ]}>
                <View style={[
                  styles.milestoneIcon,
                  milestone.achieved && styles.milestoneIconAchieved
                ]}>
                  <Star size={16} color={milestone.achieved ? '#F59E0B' : '#9CA3AF'} />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={[
                    styles.milestoneTitle,
                    milestone.achieved && styles.milestoneTitleAchieved
                  ]}>
                    {milestone.streak} Day Streak
                  </Text>
                  <Text style={styles.milestoneReward}>₹{milestone.amount} reward</Text>
                </View>
                {milestone.achieved && (
                  <View style={styles.achievedBadge}>
                    <Text style={styles.achievedBadgeText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Recent Rewards */}
        {(referralRewards.length > 0 || streakRewards.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Rewards</Text>
            <View style={styles.rewardsList}>
              {referralRewards.slice(0, 3).map((reward) => (
                <View key={reward.id} style={styles.rewardItem}>
                  <Gift size={20} color="#10B981" />
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardTitle}>Referral Bonus</Text>
                    <Text style={styles.rewardDate}>
                      {new Date(reward.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.rewardAmount}>+₹{reward.amount}</Text>
                </View>
              ))}
              {streakRewards.slice(0, 3).map((reward) => (
                <View key={reward.id} style={styles.rewardItem}>
                  <Flame size={20} color="#F59E0B" />
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardTitle}>
                      {reward.streakCount} Day Streak Reward
                    </Text>
                    <Text style={styles.rewardDate}>
                      {new Date(reward.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.rewardAmount}>+₹{reward.rewardAmount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it Works</Text>
          <View style={styles.howItWorks}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Share your referral code with friends
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                They sign up and subscribe to a 26-day plan
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Both of you get ₹500 in your wallet!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  referralCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  referralCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#48479B',
    letterSpacing: 4,
    marginBottom: 20,
  },
  referralActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  actionButtonText: {
    color: '#48479B',
    fontWeight: '600',
    marginLeft: 8,
  },
  referralInfo: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  referralInfoText: {
    color: '#065F46',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakCurrent: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  streakBest: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  nextMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  nextMilestoneText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  milestones: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneAchieved: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneIconAchieved: {
    backgroundColor: '#FEF3C7',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  milestoneTitleAchieved: {
    color: '#92400E',
  },
  milestoneReward: {
    fontSize: 14,
    color: '#6B7280',
  },
  achievedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rewardsList: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardContent: {
    flex: 1,
    marginLeft: 12,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  rewardDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  howItWorks: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#48479B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
});