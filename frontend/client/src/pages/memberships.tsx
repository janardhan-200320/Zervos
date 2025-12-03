import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  Star,
  Crown,
  Gem,
  TrendingUp,
  Users,
  Gift,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  DollarSign,
  Percent,
  Zap,
  ShoppingBag,
  CheckCircle,
  BadgeCheck,
  Share2,
  Copy,
  QrCode,
  Flame,
  Trophy,
  Target,
  Calendar,
  Cake,
  Medal,
  Sparkles,
} from 'lucide-react';

interface MembershipTier {
  id: string;
  name: string;
  icon: any;
  color: string;
  gradient: string;
  minSpend: number;
  pointsPerRupee: number;
  benefits: string[];
  discount: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  points: number;
  tier: string;
  joinDate: string;
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  badges?: string[];
  lastVisit?: string;
  visitStreak?: number;
  dateOfBirth?: string;
  birthdayRewardClaimed?: boolean;
}

// Achievement Badges Configuration
const ACHIEVEMENT_BADGES = [
  { id: 'first_visit', name: 'First Visit', icon: '🎯', description: 'Made first purchase', requirement: 1 },
  { id: 'regular', name: 'Regular Customer', icon: '⭐', description: '5+ visits', requirement: 5 },
  { id: 'loyal', name: 'Loyal Member', icon: '💎', description: '10+ visits', requirement: 10 },
  { id: 'vip', name: 'VIP Customer', icon: '👑', description: '25+ visits', requirement: 25 },
  { id: 'big_spender', name: 'Big Spender', icon: '💰', description: 'Spent ₹50k+', requirement: 50000 },
  { id: 'referral_master', name: 'Referral Master', icon: '🤝', description: 'Referred 5+ friends', requirement: 5 },
  { id: 'streak_master', name: 'Streak Master', icon: '🔥', description: '7 day streak', requirement: 7 },
  { id: 'early_adopter', name: 'Early Adopter', icon: '🚀', description: 'First 100 members', requirement: 100 },
];

export default function MembershipsPage() {
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showEditTierDialog, setShowEditTierDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [tierFormData, setTierFormData] = useState({
    id: '',
    name: '',
    minSpend: '',
    pointsPerRupee: '',
    discount: '',
    benefits: [''],
    color: 'text-orange-700',
    gradient: 'from-orange-400 to-orange-600',
  });

  // Membership Tiers Configuration - Now editable
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([
    {
      id: 'bronze',
      name: 'Bronze',
      icon: Award,
      color: 'text-orange-700',
      gradient: 'from-orange-400 to-orange-600',
      minSpend: 0,
      pointsPerRupee: 1,
      benefits: [
        '1 point per ₹1 spent',
        'Birthday special offer',
        'Early access to sales',
        'Member-only promotions'
      ],
      discount: 5,
    },
    {
      id: 'silver',
      name: 'Silver',
      icon: Star,
      color: 'text-gray-500',
      gradient: 'from-gray-300 to-gray-500',
      minSpend: 10000,
      pointsPerRupee: 1.5,
      benefits: [
        '1.5 points per ₹1 spent',
        '5% discount on all services',
        'Priority booking slots',
        'Complimentary product samples',
        'All Bronze benefits'
      ],
      discount: 10,
    },
    {
      id: 'gold',
      name: 'Gold',
      icon: Crown,
      color: 'text-yellow-600',
      gradient: 'from-yellow-400 to-yellow-600',
      minSpend: 25000,
      pointsPerRupee: 2,
      benefits: [
        '2 points per ₹1 spent',
        '10% discount on all services',
        'Free service on birthday',
        'Exclusive Gold member events',
        'Extended validity of points',
        'All Silver benefits'
      ],
      discount: 15,
    },
    {
      id: 'elite',
      name: 'Elite',
      icon: Gem,
      color: 'text-purple-600',
      gradient: 'from-purple-400 to-purple-600',
      minSpend: 50000,
      pointsPerRupee: 3,
      benefits: [
        '3 points per ₹1 spent',
        '15% discount on all services',
        'Dedicated relationship manager',
        'VIP lounge access',
        'Complimentary premium service quarterly',
        'Points never expire',
        'All Gold benefits'
      ],
      discount: 20,
    },
  ]);

  // Membership Plans State
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [showAddPlanDialog, setShowAddPlanDialog] = useState(false);
  const [showEditPlanDialog, setShowEditPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planFormData, setPlanFormData] = useState({
    id: '',
    name: '',
    price: '',
    duration: '',
    discount: '',
    points: '',
    benefits: [''],
    color: 'from-blue-500 to-cyan-500',
  });

  // Load customers and calculate their tiers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
    elite: 0,
    totalPoints: 0,
    averageSpend: 0,
  });

  // Add Member Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    initialSpend: '',
    tier: 'bronze',
    notes: '',
    referralCode: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    loadCustomers();
    loadMembershipPlans();
  }, [selectedWorkspace]);

  // Load membership plans from localStorage
  const loadMembershipPlans = () => {
    try {
      const workspaceId = selectedWorkspace?.id || 'default';
      const stored = localStorage.getItem(`membership_plans_${workspaceId}`);
      if (stored) {
        setMembershipPlans(JSON.parse(stored));
      } else {
        // Initialize with default plans
        const defaultPlans = [
          {
            id: 'basic_monthly',
            name: 'Basic Monthly',
            price: 99900,
            duration: 30,
            discount: 5,
            points: 100,
            benefits: ['5% discount on all services', '100 welcome points', 'Priority booking', 'Birthday bonus'],
            color: 'from-blue-500 to-cyan-500',
          },
          {
            id: 'premium_monthly',
            name: 'Premium Monthly',
            price: 199900,
            duration: 30,
            discount: 10,
            points: 250,
            benefits: ['10% discount on all services', '250 welcome points', 'Priority booking', 'Free consultation', 'Birthday bonus', '2 free add-on services'],
            color: 'from-purple-500 to-pink-500',
          },
          {
            id: 'gold_quarterly',
            name: 'Gold Quarterly',
            price: 499900,
            duration: 90,
            discount: 15,
            points: 750,
            benefits: ['15% discount on all services', '750 welcome points', 'VIP priority booking', 'Free consultation', 'Birthday & anniversary bonus', '5 free add-on services', 'Exclusive member events'],
            color: 'from-amber-500 to-orange-500',
          },
          {
            id: 'platinum_annual',
            name: 'Platinum Annual',
            price: 1499900,
            duration: 365,
            discount: 20,
            points: 3000,
            benefits: ['20% discount on all services', '3000 welcome points', 'VIP priority booking', 'Unlimited free consultations', 'Birthday & anniversary bonus', 'Unlimited free add-ons', 'Exclusive member events', 'Personal account manager', 'Free product samples'],
            color: 'from-slate-700 to-slate-900',
          },
        ];
        setMembershipPlans(defaultPlans);
        localStorage.setItem(`membership_plans_${workspaceId}`, JSON.stringify(defaultPlans));
      }
    } catch (error) {
      console.error('Error loading membership plans:', error);
    }
  };

  // Save membership plans to localStorage
  const saveMembershipPlans = (plans: any[]) => {
    try {
      const workspaceId = selectedWorkspace?.id || 'default';
      localStorage.setItem(`membership_plans_${workspaceId}`, JSON.stringify(plans));
      setMembershipPlans(plans);
      // Trigger event so POS can reload
      window.dispatchEvent(new CustomEvent('membership-plans-updated'));
      toast({
        title: 'Plans Updated',
        description: 'Membership plans have been saved successfully',
      });
    } catch (error) {
      console.error('Error saving membership plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to save membership plans',
        variant: 'destructive',
      });
    }
  };

  // Tier Management Functions
  const openEditTier = (tier: MembershipTier) => {
    setEditingTier(tier);
    setTierFormData({
      id: tier.id,
      name: tier.name,
      minSpend: tier.minSpend.toString(),
      pointsPerRupee: tier.pointsPerRupee.toString(),
      discount: tier.discount.toString(),
      benefits: tier.benefits.length > 0 ? tier.benefits : [''],
      color: tier.color,
      gradient: tier.gradient,
    });
    setShowEditTierDialog(true);
  };

  const handleEditTier = () => {
    if (!tierFormData.name.trim()) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in tier name',
        variant: 'destructive',
      });
      return;
    }

    const updatedTier = {
      ...editingTier!,
      name: tierFormData.name,
      minSpend: parseInt(tierFormData.minSpend) || 0,
      pointsPerRupee: parseFloat(tierFormData.pointsPerRupee) || 1,
      discount: parseInt(tierFormData.discount) || 0,
      benefits: tierFormData.benefits.filter(b => b.trim() !== ''),
      color: tierFormData.color,
      gradient: tierFormData.gradient,
    };

    const updated = membershipTiers.map(t => t.id === editingTier!.id ? updatedTier : t);
    setMembershipTiers(updated);
    
    // Save to localStorage
    const workspaceId = selectedWorkspace?.id || 'default';
    localStorage.setItem(`membership_tiers_${workspaceId}`, JSON.stringify(updated));
    
    setShowEditTierDialog(false);
    setEditingTier(null);
    
    toast({
      title: 'Tier Updated',
      description: `${tierFormData.name} tier has been updated`,
    });
  };

  const handleDeleteTier = (tierId: string) => {
    if (membershipTiers.length <= 1) {
      toast({
        title: 'Cannot Delete',
        description: 'You must have at least one membership tier',
        variant: 'destructive',
      });
      return;
    }

    const tier = membershipTiers.find(t => t.id === tierId);
    if (!confirm(`Delete "${tier?.name}" tier? Members in this tier will be moved to Bronze.`)) {
      return;
    }

    const updated = membershipTiers.filter(t => t.id !== tierId);
    setMembershipTiers(updated);
    
    // Save to localStorage
    const workspaceId = selectedWorkspace?.id || 'default';
    localStorage.setItem(`membership_tiers_${workspaceId}`, JSON.stringify(updated));
    
    toast({
      title: 'Tier Deleted',
      description: `${tier?.name} tier has been removed`,
    });
  };

  const addTierBenefit = () => {
    setTierFormData({
      ...tierFormData,
      benefits: [...tierFormData.benefits, ''],
    });
  };

  const updateTierBenefit = (index: number, value: string) => {
    const updated = [...tierFormData.benefits];
    updated[index] = value;
    setTierFormData({ ...tierFormData, benefits: updated });
  };

  const removeTierBenefit = (index: number) => {
    const updated = tierFormData.benefits.filter((_, i) => i !== index);
    setTierFormData({ ...tierFormData, benefits: updated });
  };

  // Generate unique referral code
  const generateReferralCode = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  };

  // Calculate earned badges
  const calculateBadges = (customer: any, visitCount: number) => {
    const badges: string[] = [];
    
    if (visitCount >= 1) badges.push('first_visit');
    if (visitCount >= 5) badges.push('regular');
    if (visitCount >= 10) badges.push('loyal');
    if (visitCount >= 25) badges.push('vip');
    if (customer.totalSpent >= 50000) badges.push('big_spender');
    if ((customer.referralCount || 0) >= 5) badges.push('referral_master');
    if ((customer.visitStreak || 0) >= 7) badges.push('streak_master');
    
    return badges;
  };

  // Calculate visit streak
  const calculateStreak = (lastVisit: string | undefined) => {
    if (!lastVisit) return 0;
    
    const today = new Date();
    const last = new Date(lastVisit);
    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    // If visited within last 2 days, maintain streak
    if (diffDays <= 2) return 1; // Simplified - in production, track properly
    return 0;
  };

  // Check if birthday is coming up (within 7 days)
  const isBirthdayUpcoming = (dob: string | undefined) => {
    if (!dob) return false;
    
    const today = new Date();
    const birthDate = new Date(dob);
    birthDate.setFullYear(today.getFullYear());
    
    const diffDays = Math.floor((birthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const loadCustomers = () => {
    if (!selectedWorkspace) return;

    // Load customers from localStorage
    const customersData = JSON.parse(
      localStorage.getItem(`customers_${selectedWorkspace.id}`) || '[]'
    );

    // Load POS transactions to calculate total spend
    const transactions = JSON.parse(
      localStorage.getItem('pos_transactions') || '[]'
    );

    // Calculate spending and assign tiers
    const processedCustomers = customersData.map((customer: any) => {
      // Calculate total spent from transactions
      const customerTransactions = transactions.filter(
        (t: any) => t.customerName === customer.name
      );
      const totalSpent = customerTransactions.reduce(
        (sum: number, t: any) => sum + (t.total || 0),
        0
      );

      // Determine tier based on spending
      let tier = 'bronze';
      let pointsPerRupee = 1;
      
      if (totalSpent >= 50000) {
        tier = 'elite';
        pointsPerRupee = 3;
      } else if (totalSpent >= 25000) {
        tier = 'gold';
        pointsPerRupee = 2;
      } else if (totalSpent >= 10000) {
        tier = 'silver';
        pointsPerRupee = 1.5;
      }

      // Calculate points (with referral bonus if applicable)
      let points = Math.floor(totalSpent * pointsPerRupee);
      
      // Add referral bonuses
      const referralBonus = (customer.referralCount || 0) * 500; // 500 points per referral
      points += referralBonus;

      // Calculate visit count and badges
      const visitCount = customerTransactions.length;
      const badges = calculateBadges({ ...customer, totalSpent }, visitCount);
      
      // Calculate streak
      const visitStreak = calculateStreak(customer.lastVisit);
      
      // Add streak bonus points
      if (visitStreak >= 7) points += 1000; // 7-day streak bonus
      if (visitStreak >= 30) points += 5000; // 30-day streak mega bonus

      // Generate referral code if not exists
      const referralCode = customer.referralCode || generateReferralCode(customer.name);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        totalSpent,
        points,
        tier,
        joinDate: customer.createdAt || new Date().toISOString(),
        referralCode,
        referredBy: customer.referredBy,
        referralCount: customer.referralCount || 0,
        badges,
        lastVisit: customer.lastVisit,
        visitStreak,
        dateOfBirth: customer.dateOfBirth,
        birthdayRewardClaimed: customer.birthdayRewardClaimed || false,
      };
    });

    setCustomers(processedCustomers);

    // Calculate statistics
    const stats = {
      totalMembers: processedCustomers.length,
      bronze: processedCustomers.filter((c: Customer) => c.tier === 'bronze').length,
      silver: processedCustomers.filter((c: Customer) => c.tier === 'silver').length,
      gold: processedCustomers.filter((c: Customer) => c.tier === 'gold').length,
      elite: processedCustomers.filter((c: Customer) => c.tier === 'elite').length,
      totalPoints: processedCustomers.reduce((sum: number, c: Customer) => sum + c.points, 0),
      averageSpend: processedCustomers.length > 0
        ? processedCustomers.reduce((sum: number, c: Customer) => sum + c.totalSpent, 0) / processedCustomers.length
        : 0,
    };

    setStats(stats);
  };

  const exportMembersData = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Tier', 'Total Spent', 'Points', 'Join Date'].join(','),
      ...customers.map(c => 
        [c.name, c.email, c.phone, c.tier.toUpperCase(), c.totalSpent, c.points, new Date(c.joinDate).toLocaleDateString()].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `membership_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Export Successful',
      description: 'Membership data has been downloaded',
    });
  };

  // Plan Management Functions
  const handleAddPlan = () => {
    if (!planFormData.name.trim() || !planFormData.price || !planFormData.duration) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in plan name, price, and duration',
        variant: 'destructive',
      });
      return;
    }

    const newPlan = {
      id: `plan_${Date.now()}`,
      name: planFormData.name,
      price: parseInt(planFormData.price) * 100, // Convert to cents
      duration: parseInt(planFormData.duration),
      discount: parseInt(planFormData.discount) || 0,
      points: parseInt(planFormData.points) || 0,
      benefits: planFormData.benefits.filter(b => b.trim() !== ''),
      color: planFormData.color,
    };

    const updated = [...membershipPlans, newPlan];
    saveMembershipPlans(updated);
    setShowAddPlanDialog(false);
    resetPlanForm();
  };

  const handleEditPlan = () => {
    if (!planFormData.name.trim() || !planFormData.price || !planFormData.duration) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in plan name, price, and duration',
        variant: 'destructive',
      });
      return;
    }

    const updatedPlan = {
      ...editingPlan,
      name: planFormData.name,
      price: parseInt(planFormData.price) * 100,
      duration: parseInt(planFormData.duration),
      discount: parseInt(planFormData.discount) || 0,
      points: parseInt(planFormData.points) || 0,
      benefits: planFormData.benefits.filter(b => b.trim() !== ''),
      color: planFormData.color,
    };

    const updated = membershipPlans.map(p => p.id === editingPlan.id ? updatedPlan : p);
    saveMembershipPlans(updated);
    setShowEditPlanDialog(false);
    setEditingPlan(null);
    resetPlanForm();
  };

  const handleDeletePlan = (planId: string) => {
    const updated = membershipPlans.filter(p => p.id !== planId);
    saveMembershipPlans(updated);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanFormData({
      id: plan.id,
      name: plan.name,
      price: (plan.price / 100).toString(),
      duration: plan.duration.toString(),
      discount: plan.discount.toString(),
      points: plan.points.toString(),
      benefits: plan.benefits.length > 0 ? plan.benefits : [''],
      color: plan.color,
    });
    setShowEditPlanDialog(true);
  };

  const resetPlanForm = () => {
    setPlanFormData({
      id: '',
      name: '',
      price: '',
      duration: '',
      discount: '',
      points: '',
      benefits: [''],
      color: 'from-blue-500 to-cyan-500',
    });
  };

  const addBenefitField = () => {
    setPlanFormData({
      ...planFormData,
      benefits: [...planFormData.benefits, ''],
    });
  };

  const updateBenefit = (index: number, value: string) => {
    const updated = [...planFormData.benefits];
    updated[index] = value;
    setPlanFormData({ ...planFormData, benefits: updated });
  };

  const removeBenefit = (index: number) => {
    const updated = planFormData.benefits.filter((_, i) => i !== index);
    setPlanFormData({ ...planFormData, benefits: updated });
  };

  const handleAddMember = () => {
    if (!selectedWorkspace) {
      toast({
        title: 'Error',
        description: 'No workspace selected',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in name and phone number',
        variant: 'destructive',
      });
      return;
    }

    // Create new member
    const initialSpend = parseFloat(formData.initialSpend) || 0;
    const tierConfig = membershipTiers.find(t => t.id === formData.tier);
    const points = Math.floor(initialSpend * (tierConfig?.pointsPerRupee || 1));

    const newMember: Customer = {
      id: `MEMBER-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      totalSpent: initialSpend,
      points: points,
      tier: formData.tier,
      joinDate: new Date().toISOString(),
    };

    // Save to customers in workspace
    const existingCustomers = JSON.parse(
      localStorage.getItem(`customers_${selectedWorkspace.id}`) || '[]'
    );

    // Handle referral bonus
    let bonusPoints = 0;
    if (formData.referralCode) {
      // Find referrer and add bonus
      const referrer = existingCustomers.find(
        (c: any) => c.referralCode === formData.referralCode
      );
      
      if (referrer) {
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        referrer.points = (referrer.points || 0) + 500; // Referrer gets 500 points
        bonusPoints = 250; // Referee gets 250 points
        
        toast({
          title: 'Referral Applied! 🎉',
          description: `${referrer.name} earned 500 points. You get 250 bonus points!`,
        });
      }
    }

    const newCustomer = {
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      notes: formData.notes,
      createdAt: newMember.joinDate,
      loyaltyMember: true,
      tier: newMember.tier,
      points: newMember.points + bonusPoints,
      totalSpent: newMember.totalSpent,
      referralCode: generateReferralCode(newMember.name),
      referredBy: formData.referralCode || null,
      referralCount: 0,
      badges: ['first_visit'],
      lastVisit: new Date().toISOString(),
      visitStreak: 1,
      dateOfBirth: formData.dateOfBirth || null,
      birthdayRewardClaimed: false,
    };

    existingCustomers.push(newCustomer);
    localStorage.setItem(
      `customers_${selectedWorkspace.id}`,
      JSON.stringify(existingCustomers)
    );

    // Reset form and close dialog
    setFormData({
      name: '',
      email: '',
      phone: '',
      initialSpend: '',
      tier: 'bronze',
      notes: '',
      referralCode: '',
      dateOfBirth: '',
    });
    setShowAddDialog(false);

    // Reload customers
    loadCustomers();

    toast({
      title: 'Member Added Successfully',
      description: `${newMember.name} has been enrolled in the ${tierConfig?.name} tier with ${points} points`,
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const getTierBadge = (tier: string) => {
    const tierConfig = membershipTiers.find(t => t.id === tier);
    if (!tierConfig) return null;

    return (
      <Badge className={`${tierConfig.color} bg-gradient-to-r ${tierConfig.gradient} text-white border-0`}>
        <tierConfig.icon className="h-3 w-3 mr-1" />
        {tierConfig.name}
      </Badge>
    );
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
    });
  };

  const showMemberDetails = (customer: Customer) => {
    setSelectedMember(customer);
    setShowReferralDialog(true);
  };

  const showQRCode = (customer: Customer) => {
    setSelectedMember(customer);
    setShowQRDialog(true);
  };

  const claimBirthdayReward = (customerId: string) => {
    if (!selectedWorkspace) return;

    const existingCustomers = JSON.parse(
      localStorage.getItem(`customers_${selectedWorkspace.id}`) || '[]'
    );

    const customer = existingCustomers.find((c: any) => c.id === customerId);
    if (customer && !customer.birthdayRewardClaimed) {
      customer.birthdayRewardClaimed = true;
      customer.points = (customer.points || 0) + 1000; // 1000 birthday bonus points
      
      localStorage.setItem(
        `customers_${selectedWorkspace.id}`,
        JSON.stringify(existingCustomers)
      );

      loadCustomers();

      toast({
        title: '🎂 Happy Birthday!',
        description: '1000 bonus points added to your account!',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="text-purple-600" size={28} />
                Loyalty & Memberships
              </h1>
              <p className="text-gray-600 mt-1">Reward your customers with points-based loyalty program</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
            >
              <Plus size={18} />
              Add Member
            </Button>
            <Button onClick={exportMembersData} variant="outline" className="gap-2">
              <Download size={18} />
              Export Data
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tiers">Membership Tiers</TabsTrigger>
            <TabsTrigger value="plans">Membership Plans</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Users className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Members</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Zap className="text-green-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Points Issued</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <DollarSign className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg. Customer Spend</p>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.averageSpend.toFixed(0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <TrendingUp className="text-orange-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Elite Members</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.elite}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-purple-600" />
                  Membership Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {membershipTiers.map((tier, index) => {
                    const count = stats[tier.id as keyof typeof stats] as number;
                    const percentage = stats.totalMembers > 0 ? (count / stats.totalMembers) * 100 : 0;
                    
                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-2 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${tier.gradient}`}>
                            <tier.icon className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-gray-900">{count}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{tier.name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${tier.gradient}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of members</p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {membershipTiers.map((tier, index) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <div className={`h-3 bg-gradient-to-r ${tier.gradient}`} />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${tier.gradient}`}>
                            <tier.icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">{tier.name} Membership</CardTitle>
                            <CardDescription>
                              Spend ₹{tier.minSpend.toLocaleString()}+ to unlock
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditTier(tier)}
                            className="h-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTier(tier.id)}
                            className="h-8 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <p className="text-xs text-gray-600">Points Rate</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {tier.pointsPerRupee}x
                          </p>
                          <p className="text-xs text-gray-500">per ₹1 spent</p>
                        </div>

                        <div className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Percent className="h-4 w-4 text-green-500" />
                            <p className="text-xs text-gray-600">Discount</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {tier.discount}%
                          </p>
                          <p className="text-xs text-gray-500">on all services</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-600" />
                          Member Benefits:
                        </p>
                        <ul className="space-y-2">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Membership Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Purchasable Membership Plans</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create and manage membership plans that customers can purchase in POS
                </p>
              </div>
              <Button
                onClick={() => {
                  resetPlanForm();
                  setShowAddPlanDialog(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {membershipPlans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full border-2 hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className={`w-full rounded-xl bg-gradient-to-r ${plan.color} p-4 mb-4 text-white`}>
                        <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">₹{(plan.price / 100).toFixed(0)}</span>
                          <span className="text-sm opacity-90">/ {plan.duration} days</span>
                        </div>
                      </div>

                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                          <span className="text-sm font-medium text-green-900">Discount</span>
                          <Badge className="bg-green-600">{plan.discount}% OFF</Badge>
                        </div>
                        <div className="flex items-center justify-between bg-purple-50 p-2 rounded border border-purple-200">
                          <span className="text-sm font-medium text-purple-900">Welcome Points</span>
                          <Badge className="bg-purple-600">+{plan.points} pts</Badge>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <h4 className="font-semibold text-gray-900 text-sm">Benefits:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {plan.benefits.map((benefit: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <Sparkles className="h-3 w-3 text-purple-500 mt-1 flex-shrink-0" />
                              <span className="text-xs text-gray-700">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => openEditPlan(plan)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm(`Delete "${plan.name}" plan?`)) {
                              handleDeletePlan(plan.id);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {membershipPlans.length === 0 && (
              <Card className="p-12 text-center">
                <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Yet</h3>
                <p className="text-gray-600 mb-4">Create your first membership plan</p>
                <Button onClick={() => setShowAddPlanDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plan
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {/* Search */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search members by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  All Members ({filteredCustomers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Member</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tier</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Spent</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Points</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{customer.name}</p>
                                  {customer.visitStreak && customer.visitStreak >= 3 && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                      <Flame className="h-3 w-3 mr-1" />
                                      {customer.visitStreak} day streak
                                    </Badge>
                                  )}
                                  {customer.dateOfBirth && isBirthdayUpcoming(customer.dateOfBirth) && (
                                    <Badge variant="outline" className="text-pink-600 border-pink-300 text-xs">
                                      <Cake className="h-3 w-3 mr-1" />
                                      Birthday Soon!
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{customer.email}</p>
                                <p className="text-xs text-gray-400">{customer.phone}</p>
                                {customer.badges && customer.badges.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {customer.badges.slice(0, 3).map(badgeId => {
                                      const badge = ACHIEVEMENT_BADGES.find(b => b.id === badgeId);
                                      return badge ? (
                                        <span key={badgeId} title={badge.name} className="text-xs">
                                          {badge.icon}
                                        </span>
                                      ) : null;
                                    })}
                                    {customer.badges.length > 3 && (
                                      <span className="text-xs text-gray-500">+{customer.badges.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {getTierBadge(customer.tier)}
                              {customer.referralCount && customer.referralCount > 0 && (
                                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                  <Share2 className="h-3 w-3 mr-1" />
                                  {customer.referralCount} refs
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-semibold text-gray-900">₹{customer.totalSpent.toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              <Zap className="h-3 w-3" />
                              <span className="font-semibold text-sm">{customer.points}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => showMemberDetails(customer)}
                                className="h-8 px-2"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => showQRCode(customer)}
                                className="h-8 px-2"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredCustomers.length === 0 && (
                    <div className="text-center py-12">
                      <Users size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                      <p className="text-gray-600">Try adjusting your search query</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Achievement Badges
                </CardTitle>
                <CardDescription>
                  Reward milestones that customers can unlock through engagement and spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ACHIEVEMENT_BADGES.map((badge, index) => {
                    const earnedCount = customers.filter(c => 
                      c.badges?.includes(badge.id)
                    ).length;

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-2 rounded-lg p-4 hover:shadow-lg transition-all hover:border-purple-300"
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                          <p className="text-xs text-gray-600 mb-3">{badge.description}</p>
                          <div className="bg-purple-50 rounded-full px-3 py-1">
                            <p className="text-sm font-semibold text-purple-700">
                              {earnedCount} {earnedCount === 1 ? 'member' : 'members'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Badge Earners */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-orange-600" />
                  Top Badge Collectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customers
                    .sort((a, b) => (b.badges?.length || 0) - (a.badges?.length || 0))
                    .slice(0, 10)
                    .map((customer, index) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{getTierBadge(customer.tier)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {customer.badges?.slice(0, 5).map(badgeId => {
                              const badge = ACHIEVEMENT_BADGES.find(b => b.id === badgeId);
                              return badge ? (
                                <span key={badgeId} title={badge.name} className="text-lg">
                                  {badge.icon}
                                </span>
                              ) : null;
                            })}
                          </div>
                          <Badge variant="secondary">
                            {customer.badges?.length || 0} badges
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Plan Dialog */}
        <Dialog open={showAddPlanDialog} onOpenChange={setShowAddPlanDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Custom Membership Plan</DialogTitle>
              <DialogDescription>
                Create a new membership plan that customers can purchase in POS
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name *</Label>
                  <Input
                    placeholder="e.g., VIP Annual"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    placeholder="2999"
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration (Days) *</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={planFormData.duration}
                    onChange={(e) => setPlanFormData({ ...planFormData, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={planFormData.discount}
                    onChange={(e) => setPlanFormData({ ...planFormData, discount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Welcome Points</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={planFormData.points}
                    onChange={(e) => setPlanFormData({ ...planFormData, points: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color Gradient</Label>
                <Select value={planFormData.color} onValueChange={(value) => setPlanFormData({ ...planFormData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from-blue-500 to-cyan-500">Blue</SelectItem>
                    <SelectItem value="from-purple-500 to-pink-500">Purple</SelectItem>
                    <SelectItem value="from-amber-500 to-orange-500">Gold</SelectItem>
                    <SelectItem value="from-green-500 to-emerald-500">Green</SelectItem>
                    <SelectItem value="from-red-500 to-rose-500">Red</SelectItem>
                    <SelectItem value="from-slate-700 to-slate-900">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Benefits</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBenefitField}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Benefit
                  </Button>
                </div>
                <div className="space-y-2">
                  {planFormData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="e.g., Free consultation"
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                      />
                      {planFormData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeBenefit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPlanDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPlan} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={showEditPlanDialog} onOpenChange={setShowEditPlanDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Membership Plan</DialogTitle>
              <DialogDescription>
                Update plan details. Changes will reflect in POS immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name *</Label>
                  <Input
                    placeholder="e.g., VIP Annual"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    placeholder="2999"
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration (Days) *</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={planFormData.duration}
                    onChange={(e) => setPlanFormData({ ...planFormData, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={planFormData.discount}
                    onChange={(e) => setPlanFormData({ ...planFormData, discount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Welcome Points</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={planFormData.points}
                    onChange={(e) => setPlanFormData({ ...planFormData, points: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color Gradient</Label>
                <Select value={planFormData.color} onValueChange={(value) => setPlanFormData({ ...planFormData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from-blue-500 to-cyan-500">Blue</SelectItem>
                    <SelectItem value="from-purple-500 to-pink-500">Purple</SelectItem>
                    <SelectItem value="from-amber-500 to-orange-500">Gold</SelectItem>
                    <SelectItem value="from-green-500 to-emerald-500">Green</SelectItem>
                    <SelectItem value="from-red-500 to-rose-500">Red</SelectItem>
                    <SelectItem value="from-slate-700 to-slate-900">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Benefits</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBenefitField}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Benefit
                  </Button>
                </div>
                <div className="space-y-2">
                  {planFormData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="e.g., Free consultation"
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                      />
                      {planFormData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeBenefit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditPlanDialog(false);
                setEditingPlan(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditPlan} className="bg-purple-600 hover:bg-purple-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Add Loyalty Member
              </DialogTitle>
              <DialogDescription>
                Enroll a new customer in the loyalty program. They will automatically receive points based on their tier.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Initial Spend */}
              <div className="space-y-2">
                <Label htmlFor="initialSpend">Initial Spending Amount (Optional)</Label>
                <Input
                  id="initialSpend"
                  type="number"
                  placeholder="0"
                  value={formData.initialSpend}
                  onChange={(e) => setFormData({ ...formData, initialSpend: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  If the customer has previous purchases, enter the amount to calculate starting points
                </p>
              </div>

              {/* Tier Selection */}
              <div className="space-y-2">
                <Label htmlFor="tier">Membership Tier</Label>
                <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipTiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        <div className="flex items-center gap-2">
                          <tier.icon className={`h-4 w-4 ${tier.color}`} />
                          <span className="font-medium">{tier.name}</span>
                          <span className="text-xs text-gray-500">
                            ({tier.pointsPerRupee}x points, {tier.discount}% discount)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Tier will auto-adjust based on total spending
                </p>
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  placeholder="Enter referrer's code"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-gray-500">
                  Both referrer and referee get bonus points!
                </p>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Get special birthday rewards automatically!
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about this member..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Preview */}
              {formData.initialSpend && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-purple-900 mb-2">Points Preview:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Starting Points:</span>
                    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                      <Zap className="h-4 w-4" />
                      <span className="font-bold">
                        {Math.floor(
                          parseFloat(formData.initialSpend) * 
                          (membershipTiers.find(t => t.id === formData.tier)?.pointsPerRupee || 1)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    initialSpend: '',
                    tier: 'bronze',
                    notes: '',
                    referralCode: '',
                    dateOfBirth: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Referral Details Dialog */}
        <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-green-600" />
                Referral Program
              </DialogTitle>
              <DialogDescription>
                Share your referral code and earn rewards!
              </DialogDescription>
            </DialogHeader>

            {selectedMember && (
              <div className="space-y-4 py-4">
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-300">
                  <p className="text-sm text-gray-600 mb-2">Your Referral Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-3xl font-bold text-green-700">
                      {selectedMember.referralCode}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyReferralCode(selectedMember.referralCode!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Share this code with friends!</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Share2 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{selectedMember.referralCount || 0}</p>
                      <p className="text-xs text-gray-600">Total Referrals</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Gift className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {(selectedMember.referralCount || 0) * 500}
                      </p>
                      <p className="text-xs text-gray-600">Bonus Points Earned</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">How it Works:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span>Share your code with friends</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span>They enter it when signing up</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span>You get 500 points, they get 250 points!</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                Quick Check-in QR Code
              </DialogTitle>
              <DialogDescription>
                Scan this code at checkout to earn points instantly
              </DialogDescription>
            </DialogHeader>

            {selectedMember && (
              <div className="space-y-4 py-4">
                <div className="bg-white p-6 rounded-lg border-4 border-purple-200">
                  <div className="text-center">
                    {/* Placeholder QR Code - In production, use a QR library */}
                    <div className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-purple-300">
                      <div className="text-center">
                        <QrCode className="h-24 w-24 mx-auto text-purple-600 mb-2" />
                        <p className="text-sm font-mono font-bold text-gray-700">
                          {selectedMember.id}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-4">
                      {selectedMember.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getTierBadge(selectedMember.tier)}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Quick Check-in Benefits:</p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Instant points on every purchase</li>
                        <li>• No need to enter phone number</li>
                        <li>• Track your streak automatically</li>
                        <li>• Unlock badges faster!</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    // In production, implement download QR code functionality
                    toast({
                      title: 'QR Code',
                      description: 'Download feature coming soon!',
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Tier Dialog */}
        <Dialog open={showEditTierDialog} onOpenChange={setShowEditTierDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-purple-600" />
                Edit Membership Tier
              </DialogTitle>
              <DialogDescription>
                Update tier details and benefits. Changes affect all members in this tier.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier Name *</Label>
                  <Input
                    placeholder="e.g., Platinum"
                    value={tierFormData.name}
                    onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Spend (₹)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={tierFormData.minSpend}
                    onChange={(e) => setTierFormData({ ...tierFormData, minSpend: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points per ₹1 Spent</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="1.5"
                    value={tierFormData.pointsPerRupee}
                    onChange={(e) => setTierFormData({ ...tierFormData, pointsPerRupee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={tierFormData.discount}
                    onChange={(e) => setTierFormData({ ...tierFormData, discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Text Color Class</Label>
                  <Select value={tierFormData.color} onValueChange={(value) => setTierFormData({ ...tierFormData, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-orange-700">Orange</SelectItem>
                      <SelectItem value="text-gray-500">Gray/Silver</SelectItem>
                      <SelectItem value="text-yellow-600">Yellow/Gold</SelectItem>
                      <SelectItem value="text-purple-600">Purple</SelectItem>
                      <SelectItem value="text-blue-600">Blue</SelectItem>
                      <SelectItem value="text-green-600">Green</SelectItem>
                      <SelectItem value="text-red-600">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gradient</Label>
                  <Select value={tierFormData.gradient} onValueChange={(value) => setTierFormData({ ...tierFormData, gradient: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="from-orange-400 to-orange-600">Orange</SelectItem>
                      <SelectItem value="from-gray-300 to-gray-500">Gray/Silver</SelectItem>
                      <SelectItem value="from-yellow-400 to-yellow-600">Yellow/Gold</SelectItem>
                      <SelectItem value="from-purple-400 to-purple-600">Purple</SelectItem>
                      <SelectItem value="from-blue-400 to-blue-600">Blue</SelectItem>
                      <SelectItem value="from-green-400 to-green-600">Green</SelectItem>
                      <SelectItem value="from-red-400 to-red-600">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tier Benefits</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTierBenefit}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Benefit
                  </Button>
                </div>
                <div className="space-y-2">
                  {tierFormData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="e.g., Free service on birthday"
                        value={benefit}
                        onChange={(e) => updateTierBenefit(index, e.target.value)}
                      />
                      {tierFormData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeTierBenefit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="border-2 rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${tierFormData.gradient} text-white inline-block`}>
                  <p className="text-lg font-bold">{tierFormData.name || 'Tier Name'}</p>
                  <p className="text-sm">
                    {tierFormData.pointsPerRupee || 1}x points • {tierFormData.discount || 0}% discount
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditTierDialog(false);
                setEditingTier(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditTier} className="bg-purple-600 hover:bg-purple-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
