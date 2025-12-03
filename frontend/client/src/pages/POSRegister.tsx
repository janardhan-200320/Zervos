import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, X, 
  Coffee, Scissors, Heart, Dumbbell, Stethoscope, MoreHorizontal,
  User, CreditCard, Banknote, Smartphone, DollarSign, Receipt, ArrowLeft, Package,
  Award, Sparkles, Calendar, Clock, CheckCircle2, MapPin, Phone, Mail, FileText, Tag, Percent, IndianRupee,
  ChevronDown, UserCheck, Users, Layers, PlusCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

type Service = {
  id: string;
  name: string;
  price: number; // in cents (offer price or default price)
  actualPrice?: number; // MRP in cents
  offerPrice?: number; // Selling price in cents
  barcode?: string; // Barcode for scanner
  description?: string;
  duration?: string;
  category: 'Beauty' | 'Fashion' | 'Salon' | 'Gym' | 'Clinic' | 'Other';
};

type CartItem = {
  service: Service;
  quantity: number;
  assignedPerson?: string;
};

type CartData = {
  quantity: number;
  assignedPerson: string;
};

// Tab/Session type for multi-customer billing
type POSTab = {
  id: string;
  name: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  cart: Record<string, CartData>;
  staffHandlingBill: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  paymentMethod: string;
  createdAt: Date;
  isActive: boolean;
};

// Staff member type
type TeamMember = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
};

// Initial services for different categories
const INITIAL_SERVICES: Service[] = [
  // Beauty
  { id: 'b1', name: 'Beard Design Session', price: 401500, description: 'Professional beard styling', duration: '30 min', category: 'Beauty' },
  { id: 'b2', name: 'Facial Treatment', price: 79900, description: '60 min facial cleansing and mask', duration: '60 min', category: 'Beauty' },
  { id: 'b3', name: 'Haircut', price: 59900, description: 'Standard haircut', duration: '45 min', category: 'Beauty' },
  
  // Salon
  { id: 'sl1', name: 'Hair Color', price: 149900, description: 'Full hair coloring service', duration: '2 hr', category: 'Salon' },
  { id: 'sl2', name: 'Hair Spa', price: 89900, description: 'Deep conditioning treatment', duration: '1 hr', category: 'Salon' },
  { id: 'sl3', name: 'Manicure & Pedicure', price: 69900, description: 'Complete nail care', duration: '1 hr', category: 'Salon' },
  
  // Spa (Fashion related services)
  { id: 'f1', name: 'Massage (30min)', price: 129900, description: 'Relaxing massage', duration: '30 min', category: 'Fashion' },
  { id: 'f2', name: 'Body Scrub', price: 99900, description: 'Full body exfoliation', duration: '45 min', category: 'Fashion' },
  
  // Gym
  { id: 'g1', name: 'Personal Training Session', price: 199900, description: 'One-on-one training', duration: '1 hr', category: 'Gym' },
  { id: 'g2', name: 'Group Class', price: 49900, description: 'Group fitness class', duration: '45 min', category: 'Gym' },
  { id: 'g3', name: 'Nutrition Consultation', price: 149900, description: 'Diet planning session', duration: '30 min', category: 'Gym' },
  
  // Clinic
  { id: 'c1', name: 'General Consultation', price: 79900, description: 'Doctor consultation', duration: '20 min', category: 'Clinic' },
  { id: 'c2', name: 'Physiotherapy Session', price: 119900, description: 'Physical therapy', duration: '45 min', category: 'Clinic' },
  { id: 'c3', name: 'Diagnostic Tests', price: 299900, description: 'Basic health checkup', duration: '30 min', category: 'Clinic' },
  
  // Wellness/Other
  { id: 'o1', name: 'Coffee Tasting Session', price: 39900, description: 'Guided coffee tasting', duration: '30 min', category: 'Other' },
  { id: 'o2', name: 'Yoga Class', price: 59900, description: 'Group yoga session', duration: '1 hr', category: 'Other' },
];

const CATEGORY_ICONS = {
  Beauty: Scissors,
  Fashion: Heart,
  Salon: Scissors,
  Gym: Dumbbell,
  Clinic: Stethoscope,
  Other: Coffee,
};

const CATEGORY_COLORS = {
  Beauty: 'from-pink-500 to-rose-500',
  Fashion: 'from-purple-500 to-indigo-500',
  Salon: 'from-amber-500 to-orange-500',
  Gym: 'from-green-500 to-emerald-500',
  Clinic: 'from-blue-500 to-cyan-500',
  Other: 'from-slate-500 to-gray-500',
};

export default function POSRegister() {
  const [, setLocation] = useLocation();
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [cart, setCart] = useState<Record<string, CartData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomService, setShowCustomService] = useState(false);
  const [showCustomProduct, setShowCustomProduct] = useState(false);
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [staffName, setStaffName] = useState('');
  const [salesAgent, setSalesAgent] = useState('');
  const [loyaltyMember, setLoyaltyMember] = useState<any>(null);
  const [pointsToEarn, setPointsToEarn] = useState(0);
  const [showLoyaltyInfo, setShowLoyaltyInfo] = useState(false);
  const { toast} = useToast();

  // Discount state - moved up for use in tab management
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Team members state for staff dropdowns
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showServiceStaffDropdown, setShowServiceStaffDropdown] = useState<string | null>(null);
  
  // Multi-tab POS state
  const [posTabs, setPosTabs] = useState<POSTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [showNewTabInput, setShowNewTabInput] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  // Customer database for auto-fill
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [isCustomerAutoFilled, setIsCustomerAutoFilled] = useState(false);

  // Load team members for dropdowns
  useEffect(() => {
    loadTeamMembers();
    loadExistingCustomers();
  }, []);

  const loadTeamMembers = () => {
    try {
      const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
      const members: TeamMember[] = [];
      
      // Try workspace-specific key first
      const workspaceKey = `zervos_team_members::${currentWorkspace}`;
      const workspaceData = localStorage.getItem(workspaceKey);
      if (workspaceData) {
        const parsed = JSON.parse(workspaceData);
        if (Array.isArray(parsed)) {
          members.push(...parsed.filter((m: any) => m.status === 'active' || !m.status));
        }
      }
      
      // Also try default key
      const defaultData = localStorage.getItem('zervos_team_members');
      if (defaultData) {
        const parsed = JSON.parse(defaultData);
        if (Array.isArray(parsed)) {
          parsed.forEach((m: any) => {
            if ((m.status === 'active' || !m.status) && !members.find(existing => existing.id === m.id)) {
              members.push(m);
            }
          });
        }
      }

      // Search all localStorage for team_members keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('zervos_team_members')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                parsed.forEach((m: any) => {
                  if ((m.status === 'active' || !m.status) && !members.find(existing => existing.id === m.id)) {
                    members.push(m);
                  }
                });
              }
            }
          } catch (e) {}
        }
      }

      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadExistingCustomers = () => {
    try {
      const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
      const customers: any[] = [];

      // Load from customers database
      const customersKey = `customers_${currentWorkspace}`;
      const customersData = localStorage.getItem(customersKey);
      if (customersData) {
        const parsed = JSON.parse(customersData);
        if (Array.isArray(parsed)) {
          customers.push(...parsed);
        }
      }

      // Also check POS transactions for customer data
      const posTransactions = localStorage.getItem('pos_transactions');
      if (posTransactions) {
        const txs = JSON.parse(posTransactions);
        if (Array.isArray(txs)) {
          txs.forEach((tx: any) => {
            if (tx.customer && tx.customer.phone && !customers.find(c => c.phone === tx.customer.phone)) {
              customers.push({
                name: tx.customer.name,
                email: tx.customer.email || '',
                phone: tx.customer.phone,
              });
            }
          });
        }
      }

      setExistingCustomers(customers);
    } catch (error) {
      console.error('Error loading existing customers:', error);
    }
  };

  // Auto-fill customer when phone number is entered
  const handlePhoneChange = useCallback((phone: string) => {
    setCustomerPhone(phone);
    setIsCustomerAutoFilled(false);

    if (phone.length >= 10) {
      const matchingCustomer = existingCustomers.find(c => 
        c.phone && (c.phone === phone || c.phone.includes(phone) || phone.includes(c.phone))
      );
      
      if (matchingCustomer) {
        setCustomerName(matchingCustomer.name || '');
        setCustomerEmail(matchingCustomer.email || '');
        setIsCustomerAutoFilled(true);
        toast({
          title: '✅ Customer Found!',
          description: `Details auto-filled for ${matchingCustomer.name}`,
          duration: 3000,
        });
      }
    }

    // Show suggestions
    if (phone.length >= 3) {
      const results = existingCustomers.filter(c =>
        c.phone && c.phone.includes(phone)
      ).slice(0, 5);
      setCustomerSearchResults(results);
      setShowCustomerSuggestions(results.length > 0);
    } else {
      setShowCustomerSuggestions(false);
    }
  }, [existingCustomers, toast]);

  // Initialize first tab on mount
  useEffect(() => {
    if (posTabs.length === 0) {
      const initialTab: POSTab = {
        id: `tab-${Date.now()}`,
        name: 'Customer 1',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        cart: {},
        staffHandlingBill: '',
        discountType: 'percentage',
        discountValue: '',
        paymentMethod: 'cash',
        createdAt: new Date(),
        isActive: true,
      };
      setPosTabs([initialTab]);
      setActiveTabId(initialTab.id);
    }
  }, []);

  // Sync current tab state with active tab
  const syncToActiveTab = useCallback(() => {
    if (!activeTabId) return;
    
    setPosTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          customerName,
          customerPhone,
          customerEmail,
          cart,
          staffHandlingBill: staffName,
          discountType,
          discountValue,
          paymentMethod,
        };
      }
      return tab;
    }));
  }, [activeTabId, customerName, customerPhone, customerEmail, cart, staffName, discountType, discountValue, paymentMethod]);

  // Load tab data when switching tabs
  const loadTabData = useCallback((tab: POSTab) => {
    setCustomerName(tab.customerName);
    setCustomerPhone(tab.customerPhone);
    setCustomerEmail(tab.customerEmail);
    setCart(tab.cart);
    setStaffName(tab.staffHandlingBill);
    setDiscountType(tab.discountType);
    setDiscountValue(tab.discountValue);
    setPaymentMethod(tab.paymentMethod);
    setIsCustomerAutoFilled(false);
  }, []);

  // Switch tab handler
  const handleSwitchTab = useCallback((tabId: string) => {
    if (tabId === activeTabId) return;
    
    // Save current tab state first
    syncToActiveTab();
    
    // Load new tab
    const newTab = posTabs.find(t => t.id === tabId);
    if (newTab) {
      loadTabData(newTab);
      setActiveTabId(tabId);
    }
  }, [activeTabId, posTabs, syncToActiveTab, loadTabData]);

  // Create new tab
  const createNewTab = useCallback(() => {
    // Save current tab first
    syncToActiveTab();
    
    const tabNumber = posTabs.length + 1;
    const newTab: POSTab = {
      id: `tab-${Date.now()}`,
      name: newTabName.trim() || `Customer ${tabNumber}`,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      cart: {},
      staffHandlingBill: '',
      discountType: 'percentage',
      discountValue: '',
      paymentMethod: 'cash',
      createdAt: new Date(),
      isActive: true,
    };
    
    setPosTabs(prev => [...prev, newTab]);
    loadTabData(newTab);
    setActiveTabId(newTab.id);
    setShowNewTabInput(false);
    setNewTabName('');
    
    toast({
      title: '✅ New Tab Created',
      description: `${newTab.name} is ready for billing`,
    });
  }, [posTabs.length, newTabName, syncToActiveTab, loadTabData, toast]);

  // Close tab
  const closeTab = useCallback((tabId: string) => {
    const tabToClose = posTabs.find(t => t.id === tabId);
    const hasItems = tabToClose && Object.keys(tabToClose.cart).length > 0;
    
    if (hasItems) {
      if (!window.confirm(`This tab has items in cart. Are you sure you want to close "${tabToClose?.name}"?`)) {
        return;
      }
    }
    
    if (posTabs.length <= 1) {
      toast({
        title: 'Cannot Close',
        description: 'At least one tab must remain open',
        variant: 'destructive',
      });
      return;
    }
    
    const newTabs = posTabs.filter(t => t.id !== tabId);
    setPosTabs(newTabs);
    
    // If we closed the active tab, switch to the last one
    if (tabId === activeTabId && newTabs.length > 0) {
      const lastTab = newTabs[newTabs.length - 1];
      loadTabData(lastTab);
      setActiveTabId(lastTab.id);
    }
  }, [posTabs, activeTabId, loadTabData, toast]);

  // Filter staff suggestions
  const filteredStaffSuggestions = useMemo(() => {
    if (!staffName.trim()) return teamMembers;
    const query = staffName.toLowerCase();
    return teamMembers.filter(m => 
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query))
    );
  }, [teamMembers, staffName]);
  
  // Membership tier configuration
  const MEMBERSHIP_TIERS = [
    { id: 'bronze', name: 'Bronze', minSpend: 0, pointsPerRupee: 1, discount: 5 },
    { id: 'silver', name: 'Silver', minSpend: 10000, pointsPerRupee: 1.5, discount: 10 },
    { id: 'gold', name: 'Gold', minSpend: 25000, pointsPerRupee: 2, discount: 15 },
    { id: 'elite', name: 'Elite', minSpend: 50000, pointsPerRupee: 3, discount: 20 },
  ];

  // Purchasable Membership Plans - loaded from localStorage
  const [MEMBERSHIP_PLANS, setMEMBERSHIP_PLANS] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<'services' | 'products'>('services');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Appointments Billing State
  const [showAppointmentsBilling, setShowAppointmentsBilling] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointmentBillingOpen, setAppointmentBillingOpen] = useState(false);
  const [appointmentProducts, setAppointmentProducts] = useState<{id: string; name: string; price: number; quantity: number}[]>([]);
  const [appointmentServiceCharge, setAppointmentServiceCharge] = useState<string>('0');
  const [appointmentTaxPercent, setAppointmentTaxPercent] = useState<string>('18');
  const [appointmentDiscountPercent, setAppointmentDiscountPercent] = useState<string>('0');
  const [appointmentRoundOff, setAppointmentRoundOff] = useState<boolean>(true);
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');
  const [appointmentPaymentMethod, setAppointmentPaymentMethod] = useState<string>('cash');
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState<string>('');

  // Load appointments from localStorage
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = () => {
    try {
      const saved = localStorage.getItem('zervos_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter for completed/confirmed appointments that need billing
        const billableAppointments = parsed.filter((apt: any) => 
          (apt.status === 'completed' || apt.appointmentStatus === 'completed' || apt.appointmentStatus === 'confirmed') &&
          apt.paymentStatus !== 'paid'
        );
        setAppointments(billableAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  // Get all products for appointment billing
  const allProducts = useMemo(() => {
    const products: any[] = [];
    try {
      const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
      const productsKey = `zervos_products_${currentWorkspace}`;
      const productsRaw = localStorage.getItem(productsKey);
      if (productsRaw) {
        const parsed = JSON.parse(productsRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            if (p.isEnabled) {
              products.push({
                id: p.id,
                name: p.name,
                price: Math.round(parseFloat(p.price) * 100),
                category: p.category,
              });
            }
          });
        }
      }
    } catch (e) {}
    return products;
  }, []);

  // Filtered appointments based on search
  const filteredAppointments = useMemo(() => {
    if (!appointmentSearchQuery.trim()) return appointments;
    const query = appointmentSearchQuery.toLowerCase();
    return appointments.filter(apt => 
      apt.customerName?.toLowerCase().includes(query) ||
      apt.email?.toLowerCase().includes(query) ||
      apt.phone?.includes(query) ||
      apt.serviceName?.toLowerCase().includes(query)
    );
  }, [appointments, appointmentSearchQuery]);

  // Calculate appointment bill
  const calculateAppointmentBill = () => {
    if (!selectedAppointment) return { subtotal: 0, serviceCharge: 0, productsTotal: 0, discount: 0, tax: 0, total: 0, roundOff: 0 };
    
    const serviceAmount = parseFloat(selectedAppointment.amount || '0') * 100;
    const productsTotal = appointmentProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const serviceCharge = parseFloat(appointmentServiceCharge) * 100 || 0;
    const subtotal = serviceAmount + productsTotal + serviceCharge;
    
    const discountPercent = parseFloat(appointmentDiscountPercent) || 0;
    const discount = Math.round((subtotal * discountPercent) / 100);
    
    const afterDiscount = subtotal - discount;
    const taxPercent = parseFloat(appointmentTaxPercent) || 0;
    const tax = Math.round((afterDiscount * taxPercent) / 100);
    
    let total = afterDiscount + tax;
    let roundOff = 0;
    
    if (appointmentRoundOff) {
      const rounded = Math.round(total / 100) * 100;
      roundOff = rounded - total;
      total = rounded;
    }
    
    return { subtotal, serviceCharge, productsTotal, discount, tax, total, roundOff, serviceAmount };
  };

  // Handle appointment billing completion
  const completeAppointmentBilling = () => {
    if (!selectedAppointment) return;
    
    const bill = calculateAppointmentBill();
    
    // Create transaction
    const transaction = {
      id: `POS-APT-${Date.now()}`,
      customer: { 
        name: selectedAppointment.customerName, 
        email: selectedAppointment.email,
        phone: selectedAppointment.phone 
      },
      items: [
        { 
          productId: 'service', 
          name: selectedAppointment.serviceName || selectedAppointment.customService,
          qty: 1, 
          price: bill.serviceAmount,
          type: 'service'
        },
        ...appointmentProducts.map(p => ({
          productId: p.id,
          name: p.name,
          qty: p.quantity,
          price: p.price,
          type: 'product'
        }))
      ],
      date: new Date().toISOString(),
      amount: bill.total,
      status: 'Completed',
      staff: staffName || selectedAppointment.assignedStaff || 'Not specified',
      openBalance: 0,
      totalReturn: 0,
      balanceAmount: bill.total,
      orderValue: bill.total,
      currency: '₹',
      paymentMethod: appointmentPaymentMethod,
      appointmentId: selectedAppointment.id,
      serviceCharge: bill.serviceCharge,
      discount: bill.discount,
      tax: bill.tax,
      roundOff: bill.roundOff,
      notes: appointmentNotes,
    };
    
    // Save transaction
    const existingTxs = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
    localStorage.setItem('pos_transactions', JSON.stringify([transaction, ...existingTxs]));
    
    // Update appointment payment status
    const allAppointments = JSON.parse(localStorage.getItem('zervos_appointments') || '[]');
    const updatedAppointments = allAppointments.map((apt: any) => 
      apt.id === selectedAppointment.id 
        ? { ...apt, paymentStatus: 'paid', billedAmount: bill.total / 100, billedAt: new Date().toISOString() }
        : apt
    );
    localStorage.setItem('zervos_appointments', JSON.stringify(updatedAppointments));
    
    // Reset state
    setAppointmentBillingOpen(false);
    setSelectedAppointment(null);
    setAppointmentProducts([]);
    setAppointmentServiceCharge('0');
    setAppointmentDiscountPercent('0');
    setAppointmentNotes('');
    loadAppointments();
    
    toast({
      title: '✅ Appointment Billed Successfully!',
      description: `₹${(bill.total / 100).toFixed(2)} charged for ${selectedAppointment.customerName}`,
    });
  };

  // Custom service form
  const [customService, setCustomService] = useState({
    name: '',
    price: '',
    description: '',
    duration: '',
    category: 'Other' as Service['category'],
  });

  const categories = ['all', 'Beauty', 'Fashion', 'Salon', 'Gym', 'Clinic', 'Other'];

  // Load membership plans from localStorage
  useEffect(() => {
    const loadMembershipPlans = () => {
      try {
        const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
        const stored = localStorage.getItem(`membership_plans_${currentWorkspace}`);
        if (stored) {
          setMEMBERSHIP_PLANS(JSON.parse(stored));
        } else {
          // Initialize with default plans if none exist
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
          setMEMBERSHIP_PLANS(defaultPlans);
          localStorage.setItem(`membership_plans_${currentWorkspace}`, JSON.stringify(defaultPlans));
          console.log('✅ Default membership plans initialized:', defaultPlans.length);
        }
      } catch (error) {
        console.error('Error loading membership plans:', error);
      }
    };

    loadMembershipPlans();

    // Listen for plan updates from Loyalty page
    const handlePlansUpdate = () => {
      loadMembershipPlans();
    };

    window.addEventListener('membership-plans-updated', handlePlansUpdate);
    return () => {
      window.removeEventListener('membership-plans-updated', handlePlansUpdate);
    };
  }, []);

  // Load services and products from localStorage
  useEffect(() => {
    console.log('POS Register mounted - checking localStorage');
    console.log('bulk_import_data present:', localStorage.getItem('bulk_import_data') !== null);
    
    const loadInventory = () => {
      try {
        const allServices: Service[] = [...INITIAL_SERVICES];
        
        // Get current workspace
        const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
        
        // Load Services from Services page
        const storedServices = localStorage.getItem(`zervos_services_${currentWorkspace}`);
        if (storedServices) {
          const services = JSON.parse(storedServices);
          const mappedServices: Service[] = services
            .filter((s: any) => s.isEnabled)
            .map((s: any) => {
              const actualPrice = s.actualPrice ? Math.round(parseFloat(s.actualPrice) * 100) : undefined;
              const offerPrice = s.offerPrice ? Math.round(parseFloat(s.offerPrice) * 100) : undefined;
              const defaultPrice = Math.round(parseFloat(s.price) * 100);
              
              return {
                id: `service-${s.id}`,
                name: s.name,
                price: offerPrice || defaultPrice, // Use offer price if available, else default
                actualPrice: actualPrice,
                offerPrice: offerPrice,
                barcode: s.barcode || '',
                description: s.description || '',
                duration: s.duration || '',
                category: (s.category === 'Spa & Wellness' ? 'Fashion' : 
                          s.category === 'Beauty & Salon' ? 'Beauty' : 
                          s.category === 'Fitness & Training' ? 'Gym' : 'Other') as Service['category'],
              };
            });
          allServices.push(...mappedServices);
        }
        
        // Load Products from Products page
        const storedProducts = localStorage.getItem(`zervos_products_${currentWorkspace}`);
        if (storedProducts) {
          const products = JSON.parse(storedProducts);
          const productServices: Service[] = products
            .filter((p: any) => p.isEnabled)
            .map((p: any) => {
              const actualPrice = p.actualPrice ? Math.round(parseFloat(p.actualPrice) * 100) : undefined;
              const offerPrice = p.offerPrice ? Math.round(parseFloat(p.offerPrice) * 100) : undefined;
              const defaultPrice = Math.round(parseFloat(p.price) * 100);
              
              return {
                id: `product-${p.id}`,
                name: p.name,
                price: offerPrice || defaultPrice, // Use offer price if available, else default
                actualPrice: actualPrice,
                offerPrice: offerPrice,
                barcode: p.barcode || '',
                description: p.description || '',
                duration: '',
                category: 'Other' as Service['category'],
              };
            });
          allServices.push(...productServices);
        }
        
        setServices(allServices);
        
        // Check for bulk import data and auto-add to cart
        const bulkImportData = localStorage.getItem('bulk_import_data');
        console.log('POS Register - checking for bulk_import_data:', bulkImportData);
        
        if (bulkImportData) {
          try {
            const importData = JSON.parse(bulkImportData);
            console.log('POS Register - parsed import data:', importData);
            
            const bulkServices = importData.services || [];
            const customers = importData.customers || [];
            
            console.log('POS Register - bulkServices:', bulkServices);
            console.log('POS Register - customers:', customers);
            
            if (bulkServices.length > 0) {
              // Add imported services to allServices
              // Prices are already in cents from the import process
              const importedServices: Service[] = bulkServices.map((svc: any) => ({
                id: svc.id,
                name: svc.name,
                price: typeof svc.price === 'number' ? svc.price : Math.round(parseFloat(svc.price) * 100),
                description: svc.description || '',
                duration: svc.duration || '',
                category: (svc.category === 'Spa & Wellness' ? 'Fashion' : 
                          svc.category === 'Beauty & Salon' ? 'Beauty' : 
                          svc.category === 'Fitness & Training' ? 'Gym' : 'Other') as Service['category'],
              }));
              
              console.log('POS Register - importedServices:', importedServices);
              
              setServices([...allServices, ...importedServices]);
              
              // Auto-add bulk services to cart
              const newCart: Record<string, CartData> = {};
              importedServices.forEach((service) => {
                newCart[service.id] = {
                  quantity: 1,
                  assignedPerson: '',
                };
              });
              
              console.log('POS Register - newCart:', newCart);
              setCart(newCart);
              
              // Set customer info if available
              if (customers.length > 0 && customers[0]) {
                setCustomerName(customers[0].name || '');
                setCustomerEmail(customers[0].email || '');
                setCustomerPhone(customers[0].phone || '');
              }
              
              // Clear bulk import data
              localStorage.removeItem('bulk_import_data');
              
              toast({
                title: '✅ Bulk Services Loaded',
                description: `${bulkServices.length} imported services added to cart`,
                duration: 5000,
              });
            }
          } catch (error) {
            console.error('Error loading bulk import data:', error);
            localStorage.removeItem('bulk_import_data');
          }
        } else {
          toast({
            title: 'Inventory Loaded',
            description: `${allServices.length} items available in POS`,
          });
        }
      } catch (error) {
        console.error('Error loading services/products:', error);
        toast({
          title: 'Error Loading Inventory',
          description: 'Failed to load services and products',
          variant: 'destructive',
        });
      }
    };
    
    // Load initially
    loadInventory();
    
    // Check for bulk import on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible - checking for bulk import');
        const bulkData = localStorage.getItem('bulk_import_data');
        if (bulkData) {
          console.log('Found bulk data on visibility change, reloading');
          loadInventory();
        }
      }
    };
    
    // Listen for updates from Services and Products pages
    const handleServicesUpdate = () => {
      console.log('Services updated - reloading inventory');
      loadInventory();
    };
    
    const handleProductsUpdate = () => {
      console.log('Products updated - reloading inventory');
      loadInventory();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('services-updated', handleServicesUpdate);
    window.addEventListener('products-updated', handleProductsUpdate);
    
    // Cleanup listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('services-updated', handleServicesUpdate);
      window.removeEventListener('products-updated', handleProductsUpdate);
    };
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Filter by view mode (services vs products) - STRICT filtering
      let matchesViewMode = false;
      
      if (viewMode === 'services') {
        // Show: 'service-' prefix OR 'custom-service-' prefix OR initial demo services
        matchesViewMode = service.id.startsWith('service-') || 
                          service.id.startsWith('custom-service-') ||
                          (!service.id.startsWith('product-') && 
                           !service.id.startsWith('custom-product-') && 
                           !service.id.startsWith('custom-'));
      } else if (viewMode === 'products') {
        // Show: 'product-' prefix OR 'custom-product-' prefix
        matchesViewMode = service.id.startsWith('product-') || 
                          service.id.startsWith('custom-product-');
      }
      
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      
      return matchesViewMode && matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory, viewMode]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, cartItem]) => ({
        service: services.find(s => s.id === id)!,
        quantity: cartItem.quantity,
        assignedPerson: cartItem.assignedPerson,
      }))
      .filter(item => item.service);
  }, [cart, services]);

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.service.price * item.quantity);
  }, 0);
  
  // Calculate discount
  useEffect(() => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setDiscountAmount(0);
      return;
    }

    const value = parseFloat(discountValue);
    
    if (discountType === 'percentage') {
      const maxPercentage = 100;
      const validPercentage = Math.min(value, maxPercentage);
      setDiscountAmount(Math.round((subtotal * validPercentage) / 100));
    } else {
      // Fixed discount should not exceed subtotal
      const maxDiscount = subtotal;
      const validDiscount = Math.min(value * 100, maxDiscount); // Convert to cents
      setDiscountAmount(Math.round(validDiscount));
    }
  }, [discountValue, discountType, subtotal]);

  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = Math.round(subtotalAfterDiscount * 0.18); // 18% tax on discounted amount
  const total = subtotalAfterDiscount + tax;

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const addToCart = (serviceId: string) => {
    setCart(prev => {
      const newCart: Record<string, CartData> = {
        ...prev,
        [serviceId]: {
          quantity: (prev[serviceId]?.quantity || 0) + 1,
          assignedPerson: prev[serviceId]?.assignedPerson || '',
        },
      };
      return newCart;
    });
    toast({
      title: 'Added to cart',
      description: 'Service added successfully',
    });
  };

  // Handle barcode scanning
  const handleBarcodeInput = (barcode: string) => {
    if (!barcode.trim()) return;

    // Find service/product by barcode
    const foundItem = services.find(s => s.barcode && s.barcode.toLowerCase() === barcode.toLowerCase());
    
    if (foundItem) {
      addToCart(foundItem.id);
      toast({
        title: '✅ Item Scanned!',
        description: `${foundItem.name} added to cart`,
        duration: 2000,
      });
      setBarcodeInput(''); // Clear the input after successful scan
    } else {
      toast({
        title: '❌ Barcode Not Found',
        description: 'No item with this barcode exists in inventory',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[serviceId]?.quantity || 0) + delta;
      if (newQty <= 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      const newCart: Record<string, CartData> = { 
        ...prev, 
        [serviceId]: {
          quantity: newQty,
          assignedPerson: prev[serviceId]?.assignedPerson || '',
        }
      };
      return newCart;
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prev => {
      const { [serviceId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateAssignedPerson = (serviceId: string, person: string) => {
    setCart(prev => {
      const newCart: Record<string, CartData> = {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          assignedPerson: person,
        },
      };
      return newCart;
    });
  };



  const clearCart = () => {
    setCart({});
    toast({
      title: 'Cart cleared',
      description: 'All items removed from cart',
    });
  };

  const handleAddCustomService = () => {
    if (!customService.name || !customService.price) {
      toast({
        title: 'Invalid item',
        description: 'Please provide name and price',
        variant: 'destructive',
      });
      return;
    }

    const priceInCents = Math.round(parseFloat(customService.price) * 100);
    
    // Use correct prefix based on current view mode
    const prefix = viewMode === 'services' ? 'custom-service-' : 'custom-product-';
    const itemType = viewMode === 'services' ? 'service' : 'product';
    
    const newService: Service = {
      id: `${prefix}${Date.now()}`,
      name: customService.name,
      price: priceInCents,
      description: customService.description,
      duration: customService.duration,
      category: customService.category,
    };

    setServices(prev => [newService, ...prev]);
    setShowCustomService(false);
    setShowCustomProduct(false);
    setCustomService({
      name: '',
      price: '',
      description: '',
      duration: '',
      category: 'Other',
    });

    toast({
      title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} added`,
      description: `${newService.name} has been added to ${itemType}s`,
    });

    // Automatically add to cart
    addToCart(newService.id);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add services before checkout',
        variant: 'destructive',
      });
      return;
    }
    setShowCheckout(true);
  };

  // Generate referral code for new members
  const generateReferralCode = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  };

  // Check for existing loyalty member
  const checkLoyaltyMember = (phone: string, name: string) => {
    if (!phone && !name) {
      setLoyaltyMember(null);
      setPointsToEarn(0);
      setShowLoyaltyInfo(false);
      return;
    }

    try {
      const workspaceId = localStorage.getItem('zervos_current_workspace') || 'default';
      const customersRaw = localStorage.getItem(`customers_${workspaceId}`);
      if (!customersRaw) return;

      const customers = JSON.parse(customersRaw);
      const member = customers.find((c: any) => 
        (phone && c.phone === phone) || (name && c.name.toLowerCase() === name.toLowerCase())
      );

      if (member && member.loyaltyMember) {
        setLoyaltyMember(member);
        
        // Calculate points to earn based on current tier
        const currentTier = MEMBERSHIP_TIERS.find(t => t.id === member.tier) || MEMBERSHIP_TIERS[0];
        const amountInRupees = total / 100;
        const points = Math.floor(amountInRupees * currentTier.pointsPerRupee);
        setPointsToEarn(points);
        setShowLoyaltyInfo(true);
      } else {
        // New customer - calculate points for Bronze tier
        const amountInRupees = total / 100;
        const points = Math.floor(amountInRupees * 1); // 1 point per rupee for new members
        setPointsToEarn(points);
        setLoyaltyMember(null);
        setShowLoyaltyInfo(true);
      }
    } catch (error) {
      console.error('Error checking loyalty member:', error);
    }
  };

  // Watch for customer details changes
  useEffect(() => {
    checkLoyaltyMember(customerPhone, customerName);
  }, [customerPhone, customerName, total]);

  const handleCompleteSale = () => {
    // Validate staff name
    if (!staffName.trim()) {
      toast({
        title: 'Staff name required',
        description: 'Please enter the staff member handling this bill',
        variant: 'destructive',
      });
      return;
    }

    // Validate mandatory customer fields
    if (!customerName.trim()) {
      toast({
        title: 'Customer name required',
        description: 'Please enter the customer name',
        variant: 'destructive',
      });
      return;
    }

    if (!customerPhone.trim()) {
      toast({
        title: 'Phone number required',
        description: 'Please enter the customer phone number',
        variant: 'destructive',
      });
      return;
    }

    // Create transaction object
    const transaction = {
      id: `POS-${Date.now()}`,
      customer: { 
        name: customerName.trim(),
        email: customerEmail.trim() || '',
        phone: customerPhone.trim()
      },
      items: cartItems.map(item => ({
        productId: item.service.id,
        qty: item.quantity,
        price: item.service.price,
        name: item.service.name,
        assignedPerson: item.assignedPerson || ''
      })),
      date: new Date().toISOString().split('T')[0],
      amount: total,
      status: 'Completed' as const,
      staff: staffName.trim(),
      openBalance: 0,
      totalReturn: 0,
      balanceAmount: total,
      orderValue: total,
      currency: '₹',
      paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
    };

    // Get existing transactions from localStorage
    const existingTransactions = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
    
    // Add new transaction at the beginning
    const updatedTransactions = [transaction, ...existingTransactions];
    
    // Save back to localStorage
    localStorage.setItem('pos_transactions', JSON.stringify(updatedTransactions));

    // Also save customer to existing customers for future auto-fill
    const workspaceId = localStorage.getItem('zervos_current_workspace') || 'default';
    const customersKey = `customers_${workspaceId}`;
    const existingCustomersData = JSON.parse(localStorage.getItem(customersKey) || '[]');
    
    // Check if customer already exists by phone
    const existingCustomerIndex = existingCustomersData.findIndex((c: any) => c.phone === customerPhone.trim());
    if (existingCustomerIndex === -1) {
      // Add new customer
      existingCustomersData.push({
        id: `customer-${Date.now()}`,
        name: customerName.trim(),
        email: customerEmail.trim() || '',
        phone: customerPhone.trim(),
        createdAt: new Date().toISOString(),
        totalSpent: total / 100,
        points: Math.floor(total / 100),
        tier: 'bronze',
        loyaltyMember: true,
      });
      localStorage.setItem(customersKey, JSON.stringify(existingCustomersData));
    }

    // Handle Loyalty Membership
    if (customerPhone || customerName) {
      const workspaceId = localStorage.getItem('zervos_current_workspace') || 'default';
      const customersRaw = localStorage.getItem(`customers_${workspaceId}`) || '[]';
      const customers = JSON.parse(customersRaw);
      
      const amountInRupees = total / 100;
      
      // Check if cart contains membership plan
      const membershipItem = cartItems.find(item => item.service.id.startsWith('membership-'));
      let membershipPlan = null;
      if (membershipItem) {
        const planId = membershipItem.service.id.split('-')[1];
        membershipPlan = MEMBERSHIP_PLANS.find(p => p.id === planId);
      }
      
      let customerIndex = customers.findIndex((c: any) => 
        (customerPhone && c.phone === customerPhone) || 
        (customerName && c.name.toLowerCase() === customerName.toLowerCase())
      );

      if (customerIndex >= 0) {
        // Existing customer - update points and spending
        const customer = customers[customerIndex];
        const currentSpend = customer.totalSpent || 0;
        const newTotalSpend = currentSpend + amountInRupees;
        
        // Determine new tier based on total spend
        let newTier = 'bronze';
        let pointsMultiplier = 1;
        for (const tier of MEMBERSHIP_TIERS) {
          if (newTotalSpend >= tier.minSpend) {
            newTier = tier.id;
            pointsMultiplier = tier.pointsPerRupee;
          }
        }

        // Calculate points for this transaction
        const earnedPoints = Math.floor(amountInRupees * pointsMultiplier);
        
        // Apply membership plan if purchased
        const customerUpdate: any = {
          ...customer,
          totalSpent: newTotalSpend,
          points: (customer.points || 0) + earnedPoints,
          tier: newTier,
          loyaltyMember: true,
          lastVisit: new Date().toISOString(),
          phone: customerPhone || customer.phone,
          email: customerEmail || customer.email,
        };

        if (membershipPlan) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + membershipPlan.duration);
          
          customerUpdate.activeMembership = {
            planId: membershipPlan.id,
            planName: membershipPlan.name,
            discount: membershipPlan.discount,
            startDate: new Date().toISOString(),
            expiryDate: expiryDate.toISOString(),
            status: 'active',
          };
          customerUpdate.points = (customer.points || 0) + earnedPoints + membershipPlan.points;
        }

        customers[customerIndex] = customerUpdate;
        localStorage.setItem(`customers_${workspaceId}`, JSON.stringify(customers));
        
        if (membershipPlan) {
          toast({
            title: '🎉 Membership Activated!',
            description: `${membershipPlan.name} plan activated! ${earnedPoints + membershipPlan.points} points credited. ${membershipPlan.discount}% discount unlocked!`,
          });
        } else {
          toast({
            title: '🎉 Sale Completed & Points Awarded!',
            description: `${formatPrice(total)} paid. ${earnedPoints} points earned! Total: ${customers[customerIndex].points} points`,
          });
        }
      } else if (customerName.trim()) {
        // New customer - create loyalty membership
        const earnedPoints = Math.floor(amountInRupees * 1); // Bronze tier
        
        const newCustomer: any = {
          id: `MEMBER-${Date.now()}`,
          name: customerName.trim(),
          email: customerEmail || '',
          phone: customerPhone || '',
          totalSpent: amountInRupees,
          points: earnedPoints,
          tier: 'bronze',
          loyaltyMember: true,
          joinDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          referralCode: generateReferralCode(customerName.trim()),
          referralCount: 0,
          badges: ['first_visit'],
          visitStreak: 1,
        };

        // Apply membership plan if purchased
        if (membershipPlan) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + membershipPlan.duration);
          
          newCustomer.activeMembership = {
            planId: membershipPlan.id,
            planName: membershipPlan.name,
            discount: membershipPlan.discount,
            startDate: new Date().toISOString(),
            expiryDate: expiryDate.toISOString(),
            status: 'active',
          };
          newCustomer.points = earnedPoints + membershipPlan.points;
        }

        customers.push(newCustomer);
        localStorage.setItem(`customers_${workspaceId}`, JSON.stringify(customers));
        
        if (membershipPlan) {
          toast({
            title: '🎊 Membership Activated!',
            description: `Welcome! ${membershipPlan.name} plan activated with ${newCustomer.points} points and ${membershipPlan.discount}% discount!`,
          });
        } else {
          toast({
            title: '🎊 Welcome to Our Loyalty Program!',
            description: `${formatPrice(total)} paid. ${earnedPoints} points earned! You're now a Bronze member.`,
          });
        }
      }
    } else {
      toast({
        title: 'Sale completed!',
        description: `Total: ${formatPrice(total)} - Payment recorded successfully`,
      });
    }
    
    // Reset form and handle tabs
    setCart({});
    setShowCheckout(false);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setStaffName('');
    setSalesAgent('');
    setPaymentMethod('cash');
    setLoyaltyMember(null);
    setPointsToEarn(0);
    setShowLoyaltyInfo(false);
    setIsCustomerAutoFilled(false);
    setDiscountValue('');
    setDiscountAmount(0);
    
    // Reload customer list for future auto-fill
    loadExistingCustomers();
    
    // Update tab to show completed or close if multiple tabs
    if (posTabs.length > 1) {
      // Close current tab after successful sale
      closeTab(activeTabId);
    } else {
      // Reset the single tab
      const resetTab: POSTab = {
        id: `tab-${Date.now()}`,
        name: 'Customer 1',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        cart: {},
        staffHandlingBill: '',
        discountType: 'percentage',
        discountValue: '',
        paymentMethod: 'cash',
        createdAt: new Date(),
        isActive: true,
      };
      setPosTabs([resetTab]);
      setActiveTabId(resetTab.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-lg shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">POS System</h1>
                <p className="text-xs text-slate-600">Multi-Customer Billing</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2 py-1 text-xs bg-purple-50 border-purple-200 text-purple-700">
                <Scissors className="mr-1 h-3 w-3" />
                {services.filter(s => s.id.startsWith('service-') || s.id.startsWith('custom-service-')).length}
              </Badge>
              <Badge variant="outline" className="px-2 py-1 text-xs bg-green-50 border-green-200 text-green-700">
                <Package className="mr-1 h-3 w-3" />
                {services.filter(s => s.id.startsWith('product-') || s.id.startsWith('custom-product-')).length}
              </Badge>
              <Badge variant="outline" className="px-2 py-1 text-xs bg-blue-50 border-blue-200 text-blue-700">
                <ShoppingCart className="mr-1 h-3 w-3" />
                {cartItems.length}
              </Badge>
              <Button
                onClick={() => setLocation('/dashboard/pos')}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-8 text-xs"
              >
                <ArrowLeft size={14} />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Multi-Tab Navigation Bar - Like shopping mall POS */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
              <AnimatePresence mode="popLayout">
                {posTabs.map((tab, index) => {
                  const isActive = tab.id === activeTabId;
                  const itemCount = Object.keys(tab.cart).length;
                  
                  return (
                    <motion.div
                      key={tab.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      className="flex-shrink-0"
                    >
                      <div
                        onClick={() => handleSwitchTab(tab.id)}
                        className={`
                          relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all
                          ${isActive 
                            ? 'bg-white shadow-md border-t-2 border-x border-brand-500 text-brand-700 font-semibold -mb-px z-10' 
                            : 'bg-slate-200/50 hover:bg-slate-200 text-slate-600 border border-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-300 text-slate-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm whitespace-nowrap max-w-[100px] truncate">
                            {tab.customerName || tab.name}
                          </span>
                          {itemCount > 0 && (
                            <Badge className={`h-5 px-1.5 text-[10px] ${
                              isActive ? 'bg-brand-600' : 'bg-slate-500'
                            }`}>
                              {itemCount}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Close button */}
                        {posTabs.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              closeTab(tab.id);
                            }}
                            className={`
                              ml-1 p-0.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors
                              ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}
                            `}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        
                        {/* Active indicator dot */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand-500"
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add New Tab Button */}
              {showNewTabInput ? (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-1 ml-2 flex-shrink-0"
                >
                  <Input
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    placeholder="Tab name..."
                    className="h-8 w-32 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createNewTab();
                      if (e.key === 'Escape') {
                        setShowNewTabInput(false);
                        setNewTabName('');
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                    onClick={createNewTab}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                    onClick={() => {
                      setShowNewTabInput(false);
                      setNewTabName('');
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewTabInput(true)}
                  className="flex items-center gap-1 px-3 py-2 ml-2 rounded-lg bg-gradient-to-r from-brand-500 to-purple-600 text-white text-xs font-medium shadow-sm hover:shadow-md transition-all flex-shrink-0"
                >
                  <PlusCircle className="h-4 w-4" />
                  New Tab
                </motion.button>
              )}
              
              {/* Quick info */}
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 flex-shrink-0 pl-4">
                <Layers className="h-3 w-3" />
                <span>{posTabs.length} active {posTabs.length === 1 ? 'tab' : 'tabs'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner - Prominent at top */}
            <motion.div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg border-2 border-blue-400 p-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">Barcode Scanner</h3>
                  <p className="text-blue-100 text-xs">Scan product barcode to add instantly</p>
                </div>
              </div>
              <div className="relative">
                <Input
                  placeholder="Click here and scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeInput(barcodeInput);
                    }
                  }}
                  className="h-12 text-lg font-mono bg-white border-2 border-blue-300 focus:border-white focus:ring-2 focus:ring-white/50 pl-4 pr-28"
                  autoComplete="off"
                />
                <Button
                  onClick={() => handleBarcodeInput(barcodeInput)}
                  className="absolute right-1 top-1 h-10 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!barcodeInput.trim()}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm border p-4 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={`Search ${viewMode === 'services' ? 'services' : 'products'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                />
              </div>

              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 pb-4 border-b">
                <Button
                  onClick={() => setViewMode('services')}
                  variant={viewMode === 'services' ? 'default' : 'outline'}
                  className={viewMode === 'services' ? 'bg-brand-600' : ''}
                  size="sm"
                >
                  <Scissors className="mr-2 h-4 w-4" />
                  Services
                </Button>
                <Button
                  onClick={() => setViewMode('products')}
                  variant={viewMode === 'products' ? 'default' : 'outline'}
                  className={viewMode === 'products' ? 'bg-green-600' : ''}
                  size="sm"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Domain:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => {
                    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
                    
                    if (viewMode === 'services') {
                      // Load Services page to add recommended services
                      toast({
                        title: 'Load Services',
                        description: 'Go to Services page in sidebar to load 25 recommended services in ₹',
                      });
                    } else {
                      // Load Products page to add recommended products
                      toast({
                        title: 'Load Products',
                        description: 'Go to Products page in sidebar (under Items) to load 33 recommended products in ₹',
                      });
                    }
                  }}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Load Recommended
                </Button>

                <Button
                  onClick={() => viewMode === 'services' ? setShowCustomService(true) : setShowCustomProduct(true)}
                  variant="outline"
                  className="border-brand-300 text-brand-700 hover:bg-brand-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {viewMode === 'services' ? 'Add custom service' : 'Add custom product'}
                </Button>

                {/* Spacer to push action buttons to the right */}
                <div className="flex-1" />

                <Button
                  onClick={() => {
                    loadAppointments();
                    setShowAppointmentsBilling(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Appointments Billing
                  {appointments.length > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                      {appointments.length}
                    </span>
                  )}
                </Button>

                <Button
                  onClick={() => setShowMembershipPlans(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Award className="mr-2 h-4 w-4" />
                  Membership Plans
                </Button>
              </div>
            </motion.div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service, index) => {
                  const Icon = CATEGORY_ICONS[service.category];
                  const gradient = CATEGORY_COLORS[service.category];
                  
                  return (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{service.name}</h3>
                                {(service.id.startsWith('service-') || service.id.startsWith('custom-service-')) && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-purple-50 border-purple-200 text-purple-700">
                                    {service.id.startsWith('custom-service-') ? 'Custom Service' : 'Service'}
                                  </Badge>
                                )}
                                {(service.id.startsWith('product-') || service.id.startsWith('custom-product-')) && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-50 border-green-200 text-green-700">
                                    {service.id.startsWith('custom-product-') ? 'Custom Product' : 'Product'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{service.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold text-slate-900">{formatPrice(service.price)}</p>
                              {service.offerPrice && service.actualPrice && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                  {Math.round(((service.actualPrice - service.offerPrice) / service.actualPrice) * 100)}% OFF
                                </span>
                              )}
                            </div>
                            {service.actualPrice && service.offerPrice && (
                              <p className="text-xs text-slate-400 line-through">
                                MRP: {formatPrice(service.actualPrice)}
                              </p>
                            )}
                            <p className="text-xs text-slate-500">
                              {service.duration && `${service.duration} • `}{service.category}
                            </p>
                            {service.barcode && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M2 6h2v12H2V6zm4 0h1v12H6V6zm2 0h1v12H8V6zm3 0h1v12h-1V6zm2 0h2v12h-2V6zm3 0h1v12h-1V6zm3 0h1v12h-1V6zm2 0h2v12h-2V6z"/>
                                </svg>
                                <span className="font-mono">{service.barcode}</span>
                              </div>
                            )}
                          </div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => addToCart(service.id)}
                              className={`${
                                (service.id.startsWith('service-') || service.id.startsWith('custom-service-'))
                                  ? 'bg-purple-600 hover:bg-purple-700' 
                                  : (service.id.startsWith('product-') || service.id.startsWith('custom-product-'))
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              } text-white shadow-md`}
                              size="sm"
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Add to Cart
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredServices.length === 0 && (
              <motion.div 
                className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="inline-block p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-full mb-4">
                  {viewMode === 'services' ? (
                    <Scissors className="h-16 w-16 text-purple-500" />
                  ) : (
                    <Package className="h-16 w-16 text-green-500" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No {viewMode === 'services' ? 'Services' : 'Products'} Available
                </h3>
                <p className="text-slate-600 mb-4">
                  {viewMode === 'services' 
                    ? 'Load 25 recommended services from the Services page'
                    : 'Load 33 recommended products from the Products page'
                  }
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <p className="text-sm text-slate-500">Click "Load Recommended" button above or</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open('/dashboard/services', '_blank')}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      size="sm"
                    >
                      <Scissors className="mr-2 h-4 w-4" />
                      Open Services Page
                    </Button>
                    <Button
                      onClick={() => window.open('/dashboard/products', '_blank')}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      size="sm"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Open Products Page
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <motion.div 
                className="bg-white rounded-xl shadow-lg border p-6 space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-brand-600" />
                  Cart
                </h2>
                {cartItems.length > 0 && (
                  <Button
                    onClick={clearCart}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Staff Information Section */}
              <div className="space-y-3">
                {/* Staff Handling Bill - With Dropdown */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3">
                  <Label htmlFor="staff-name" className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Staff Handling Bill *
                  </Label>
                  <div className="relative">
                    <Input
                      id="staff-name"
                      placeholder="Select or type staff name..."
                      value={staffName}
                      onChange={(e) => {
                        setStaffName(e.target.value);
                        setShowStaffDropdown(true);
                      }}
                      onFocus={() => setShowStaffDropdown(true)}
                      className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <ChevronDown size={18} className={`transition-transform ${showStaffDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Staff Dropdown */}
                    <AnimatePresence>
                      {showStaffDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {teamMembers.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-500">
                              <p className="font-medium">No team members found</p>
                              <p className="text-xs mt-1">You can still type a name manually</p>
                            </div>
                          ) : filteredStaffSuggestions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-500">
                              <p>No matching staff found</p>
                              <p className="text-xs mt-1">Press Enter to use "{staffName}"</p>
                            </div>
                          ) : (
                            filteredStaffSuggestions.map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => {
                                  setStaffName(member.name || member.email || 'Staff');
                                  setShowStaffDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                  {(member.name || member.email || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{member.name || 'Unnamed'}</p>
                                  {member.role && <p className="text-xs text-slate-400">{member.role}</p>}
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {teamMembers.length} team members available
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">Cart is empty</p>
                    <p className="text-sm text-slate-500 mt-1">Add services to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {cartItems.map(item => (
                        <motion.div
                          key={item.service.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-slate-50 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">
                                {item.service.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-600">
                                  {formatPrice(item.service.price)} × {item.quantity}
                                </p>
                                {item.service.actualPrice && item.service.offerPrice && (
                                  <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full font-semibold">
                                    {Math.round(((item.service.actualPrice - item.service.offerPrice) / item.service.actualPrice) * 100)}% OFF
                                  </span>
                                )}
                              </div>
                              {item.service.actualPrice && item.service.offerPrice && (
                                <p className="text-[10px] text-slate-400 line-through">
                                  MRP: {formatPrice(item.service.actualPrice)} each
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateQuantity(item.service.id, -1)}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold w-6 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                onClick={() => updateQuantity(item.service.id, 1)}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => removeFromCart(item.service.id)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Assigned Person Field - With Dropdown */}
                          <div className="px-3 pb-3 pt-0">
                            <div className="relative">
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                <div className="flex-1 relative">
                                  <Input
                                    placeholder={
                                      item.service.id.startsWith('product-') || item.service.id.startsWith('custom-product-')
                                        ? 'Who sold this product?'
                                        : 'Who served this service?'
                                    }
                                    value={item.assignedPerson || ''}
                                    onChange={(e) => {
                                      updateAssignedPerson(item.service.id, e.target.value);
                                      setShowServiceStaffDropdown(item.service.id);
                                    }}
                                    onFocus={() => setShowServiceStaffDropdown(item.service.id)}
                                    className="h-8 text-xs bg-white border-slate-300 focus:border-brand-500 pr-8"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowServiceStaffDropdown(
                                      showServiceStaffDropdown === item.service.id ? null : item.service.id
                                    )}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                                  >
                                    <ChevronDown size={14} className={`transition-transform ${showServiceStaffDropdown === item.service.id ? 'rotate-180' : ''}`} />
                                  </button>

                                  {/* Staff Dropdown for this item */}
                                  <AnimatePresence>
                                    {showServiceStaffDropdown === item.service.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                                      >
                                        {teamMembers.length === 0 ? (
                                          <div className="px-3 py-2 text-xs text-slate-500">
                                            <p>No team members. Type a name.</p>
                                          </div>
                                        ) : (
                                          teamMembers.filter(m => {
                                            const query = (item.assignedPerson || '').toLowerCase();
                                            return !query || 
                                              (m.name && m.name.toLowerCase().includes(query)) ||
                                              (m.email && m.email.toLowerCase().includes(query));
                                          }).slice(0, 5).map((member) => (
                                            <button
                                              key={member.id}
                                              type="button"
                                              onClick={() => {
                                                updateAssignedPerson(item.service.id, member.name || member.email || 'Staff');
                                                setShowServiceStaffDropdown(null);
                                              }}
                                              className="w-full px-3 py-1.5 text-left hover:bg-blue-50 flex items-center gap-2 border-b last:border-b-0 transition-colors"
                                            >
                                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-medium">
                                                {(member.name || member.email || 'S').charAt(0).toUpperCase()}
                                              </div>
                                              <span className="text-xs font-medium text-slate-700 truncate">
                                                {member.name || member.email}
                                              </span>
                                            </button>
                                          ))
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 ml-5 mt-0.5">
                                {item.service.id.startsWith('product-') || item.service.id.startsWith('custom-product-')
                                  ? '📦 Product sold by'
                                  : '✂️ Service performed by'
                                }
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <motion.div 
                  className="border-t pt-4 space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Overall Discount Section */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Overall Cart Discount
                      </Label>
                      {discountAmount > 0 && (
                        <Badge variant="secondary" className="bg-amber-600 text-white">
                          -{formatPrice(discountAmount)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => {
                        setDiscountType(value);
                        setDiscountValue('');
                        setDiscountAmount(0);
                      }}>
                        <SelectTrigger className="w-[130px] bg-white border-amber-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage %</SelectItem>
                          <SelectItem value="fixed">Fixed ₹</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex-1 relative">
                        <Input
                          type="number"
                          placeholder={discountType === 'percentage' ? '0-100' : '0.00'}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="bg-white border-amber-300 focus:border-amber-500 focus:ring-amber-200"
                          min="0"
                          max={discountType === 'percentage' ? '100' : undefined}
                          step={discountType === 'percentage' ? '1' : '0.01'}
                        />
                        {discountValue && parseFloat(discountValue) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDiscountValue('');
                              setDiscountAmount(0);
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {discountAmount > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-1"
                      >
                        {discountType === 'percentage' 
                          ? `${discountValue}% discount applied` 
                          : `₹${discountValue} discount applied`}
                      </motion.div>
                    )}
                  </div>

                  {/* Pricing Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Sub Total</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    
                    {discountAmount > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between text-amber-600 font-medium"
                      >
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Discount {discountType === 'percentage' && `(${discountValue}%)`}
                        </span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </motion.div>
                    )}
                    
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-dashed">
                        <span>Subtotal after discount</span>
                        <span>{formatPrice(subtotalAfterDiscount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-slate-600">
                      <span>Tax (18%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Round Off</span>
                      <span>₹0.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">
                        (Items: {cartItems.length}, Qty: {cartItems.reduce((s, i) => s + i.quantity, 0)})
                      </p>
                      <p className="text-2xl font-bold text-brand-600">{formatPrice(total)}</p>
                      {discountAmount > 0 && (
                        <p className="text-xs text-amber-600 line-through">
                          was {formatPrice(subtotal + Math.round(subtotal * 0.18))}
                        </p>
                      )}
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-lg py-6"
                    >
                      <Receipt className="mr-2 h-5 w-5" />
                      PROCEED
                    </Button>
                  </motion.div>
                </motion.div>
              )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Service Dialog */}
      <Dialog open={showCustomService} onOpenChange={setShowCustomService}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-600" />
              Add Custom Service
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service-name">Service Name *</Label>
              <Input
                id="service-name"
                placeholder="e.g., Special Massage Package"
                value={customService.name}
                onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="service-price">Price (₹) *</Label>
                <Input
                  id="service-price"
                  type="number"
                  placeholder="0.00"
                  value={customService.price}
                  onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-duration">Duration</Label>
                <Input
                  id="service-duration"
                  placeholder="e.g., 1 hr"
                  value={customService.duration}
                  onChange={(e) => setCustomService({ ...customService, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-category">Category</Label>
              <Select 
                value={customService.category} 
                onValueChange={(value) => setCustomService({ ...customService, category: value as Service['category'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beauty">Beauty</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Salon">Salon</SelectItem>
                  <SelectItem value="Gym">Gym</SelectItem>
                  <SelectItem value="Clinic">Clinic</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                placeholder="Brief description of the service"
                value={customService.description}
                onChange={(e) => setCustomService({ ...customService, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomService(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomService} className="bg-brand-600 hover:bg-brand-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Product Dialog */}
      <Dialog open={showCustomProduct} onOpenChange={setShowCustomProduct}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Add Custom Product
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="e.g., Hair Oil, Shampoo"
                value={customService.name}
                onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product-price">Price (₹) *</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="0.00"
                  value={customService.price}
                  onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-category">Category</Label>
                <Select 
                  value={customService.category} 
                  onValueChange={(value) => setCustomService({ ...customService, category: value as Service['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Salon">Salon</SelectItem>
                    <SelectItem value="Gym">Gym</SelectItem>
                    <SelectItem value="Clinic">Clinic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Brief description of the product"
                value={customService.description}
                onChange={(e) => setCustomService({ ...customService, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomProduct(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              handleAddCustomService();
              setShowCustomProduct(false);
            }} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Membership Plans Dialog */}
      <Dialog open={showMembershipPlans} onOpenChange={setShowMembershipPlans}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Award className="h-6 w-6 text-purple-600" />
              Membership Plans
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Choose the perfect membership plan for your customer and unlock exclusive benefits
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
            {MEMBERSHIP_PLANS.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`h-full border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                  idx === 3 ? 'border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100' : 'border-purple-200'
                }`}>
                  <CardContent className="p-6">
                    {/* Plan Header */}
                    <div className={`w-full rounded-xl bg-gradient-to-r ${plan.color} p-4 mb-4 text-white`}>
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">₹{(plan.price / 100).toFixed(0)}</span>
                        <span className="text-sm opacity-90">/ {plan.duration} days</span>
                      </div>
                    </div>

                    {/* Key Benefits */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-green-900">Discount</span>
                        <Badge className="bg-green-600">{plan.discount}% OFF</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <span className="text-sm font-medium text-purple-900">Welcome Points</span>
                        <Badge className="bg-purple-600">+{plan.points} pts</Badge>
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-2 mb-6">
                      <h4 className="font-semibold text-gray-900 text-sm mb-3">All Benefits:</h4>
                      {plan.benefits.map((benefit: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={() => {
                        const membershipService: Service = {
                          id: `membership-${plan.id}-${Date.now()}`,
                          name: `${plan.name} Membership`,
                          price: plan.price,
                          description: `${plan.duration} days with ${plan.discount}% discount, ${plan.points} points`,
                          duration: `${plan.duration} days`,
                          category: 'Other',
                        };
                        // Add membership service to services list first
                        setServices([...services, membershipService]);
                        // Then add to cart
                        addToCart(membershipService.id);
                        setShowMembershipPlans(false);
                        toast({
                          title: "Membership Added! 🎉",
                          description: `${plan.name} added to cart`,
                        });
                      }}
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembershipPlans(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax (18%):</span>
                <span className="font-semibold">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-brand-600">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Customer Information</span>
                </div>
                {isCustomerAutoFilled && (
                  <Badge className="bg-green-500 text-white text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Auto-filled
                  </Badge>
                )}
              </div>
              
              {/* Phone Number - First for auto-fill */}
              <div className="grid gap-2 relative">
                <Label htmlFor="customer-phone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-red-500" />
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="Enter phone to auto-fill customer details..."
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onFocus={() => {
                    if (customerPhone.length >= 3) {
                      const results = existingCustomers.filter(c =>
                        c.phone && c.phone.includes(customerPhone)
                      ).slice(0, 5);
                      setCustomerSearchResults(results);
                      setShowCustomerSuggestions(results.length > 0);
                    }
                  }}
                  className={`bg-white ${!customerPhone.trim() ? 'border-red-300' : 'border-green-300'}`}
                />
                
                {/* Customer Suggestions Dropdown */}
                <AnimatePresence>
                  {showCustomerSuggestions && customerSearchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      <div className="px-3 py-2 bg-blue-50 border-b text-xs font-medium text-blue-700">
                        <Users className="inline h-3 w-3 mr-1" />
                        Existing Customers Found
                      </div>
                      {customerSearchResults.map((customer, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomerName(customer.name || '');
                            setCustomerEmail(customer.email || '');
                            setCustomerPhone(customer.phone || '');
                            setIsCustomerAutoFilled(true);
                            setShowCustomerSuggestions(false);
                            toast({
                              title: '✅ Customer Selected',
                              description: `Details loaded for ${customer.name}`,
                            });
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                            {(customer.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{customer.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{customer.phone} {customer.email && `• ${customer.email}`}</p>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <p className="text-xs text-blue-600">
                  💡 Enter phone number to auto-fill existing customer details
                </p>
              </div>

              {/* Customer Name - Mandatory */}
              <div className="grid gap-2">
                <Label htmlFor="customer-name" className="flex items-center gap-1">
                  <User className="h-3 w-3 text-red-500" />
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer name..."
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setIsCustomerAutoFilled(false);
                  }}
                  className={`bg-white ${!customerName.trim() ? 'border-red-300' : 'border-green-300'}`}
                />
                {!customerName.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Customer name is required
                  </p>
                )}
              </div>

              {/* Email - Optional */}
              <div className="grid gap-2">
                <Label htmlFor="customer-email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  Email <span className="text-slate-400 text-xs">(Optional)</span>
                </Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    setIsCustomerAutoFilled(false);
                  }}
                  className="bg-white border-slate-200"
                />
              </div>

              {/* Loyalty Member Info */}
              {showLoyaltyInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg"
                >
                  {loyaltyMember ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="font-bold text-purple-900">
                          Loyalty Member Found! 🎉
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        {loyaltyMember.activeMembership && loyaltyMember.activeMembership.status === 'active' && (
                          <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Award className="h-3 w-3 text-amber-600" />
                                <span className="font-bold text-amber-900 text-xs">
                                  {loyaltyMember.activeMembership.planName}
                                </span>
                              </div>
                              <Badge className="bg-amber-600 text-xs">
                                {loyaltyMember.activeMembership.discount}% OFF
                              </Badge>
                            </div>
                            <p className="text-xs text-amber-700 mt-1">
                              Valid until {new Date(loyaltyMember.activeMembership.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Tier:</span>
                          <span className="font-semibold capitalize text-purple-700">
                            {loyaltyMember.tier}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Points:</span>
                          <span className="font-semibold text-purple-700">
                            {loyaltyMember.points || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Spent:</span>
                          <span className="font-semibold text-purple-700">
                            ₹{(loyaltyMember.totalSpent || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-purple-200">
                          <span className="text-gray-700 font-medium">Points to Earn:</span>
                          <span className="font-bold text-green-600">
                            +{pointsToEarn} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="font-bold text-purple-900">
                          New Loyalty Member! 🌟
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-700">
                          Customer will be automatically enrolled in our loyalty program
                        </p>
                        <div className="flex justify-between pt-2 border-t border-purple-200">
                          <span className="text-gray-700 font-medium">Welcome Points:</span>
                          <span className="font-bold text-green-600">
                            +{pointsToEarn} pts
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          🎁 Starting as Bronze Member • 1 point per ₹1
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-left">
              {(!customerName.trim() || !customerPhone.trim()) && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Fill all required fields (Name & Phone)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCheckout(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCompleteSale}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!customerName.trim() || !customerPhone.trim() || !staffName.trim()}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Complete Sale
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointments Billing Dialog - List View */}
      <Dialog open={showAppointmentsBilling} onOpenChange={setShowAppointmentsBilling}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
              Appointments Billing
              <Badge className="ml-2 bg-blue-100 text-blue-700">{appointments.length} Pending</Badge>
            </DialogTitle>
            <DialogDescription>
              Select an appointment to process billing for completed services
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col py-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer name, email, phone, or service..."
                value={appointmentSearchQuery}
                onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Appointments</h3>
                  <p className="text-gray-500 text-sm">
                    All appointments have been billed or there are no completed appointments yet.
                  </p>
                </div>
              ) : (
                filteredAppointments.map((apt) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setAppointmentBillingOpen(true);
                      setShowAppointmentsBilling(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                            {apt.customerName?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{apt.customerName || 'Walk-in Customer'}</h4>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {apt.email || 'No email'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Scissors className="h-3 w-3 text-purple-500" />
                            <span className="truncate">{apt.serviceName || apt.customService || 'Custom Service'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span>{new Date(apt.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-3 w-3 text-green-500" />
                            <span>{apt.time}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <User className="h-3 w-3 text-orange-500" />
                            <span className="truncate">{apt.assignedStaff || 'Not Assigned'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-green-600">
                          ₹{parseFloat(apt.amount || '0').toFixed(2)}
                        </div>
                        <Badge 
                          className={`mt-1 ${
                            apt.appointmentStatus === 'completed' || apt.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {apt.appointmentStatus || apt.status || 'Pending'}
                        </Badge>
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                            <Receipt className="h-3 w-3 mr-1" />
                            Bill Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowAppointmentsBilling(false)}>
              Close
            </Button>
            <Button onClick={loadAppointments} variant="ghost" className="text-blue-600">
              <ArrowLeft className="h-4 w-4 mr-1 rotate-180" />
              Refresh List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Billing Detail Dialog */}
      <Dialog open={appointmentBillingOpen} onOpenChange={(open) => {
        setAppointmentBillingOpen(open);
        if (!open) {
          setSelectedAppointment(null);
          setAppointmentProducts([]);
          setAppointmentServiceCharge('0');
          setAppointmentDiscountPercent('0');
          setAppointmentNotes('');
        }
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5 text-green-600" />
              Appointment Billing
              {selectedAppointment && (
                <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  #{selectedAppointment.id?.slice(-6) || 'NEW'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Customer & Service Info */}
                <div className="space-y-4">
                  {/* Customer Info Card */}
                  <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                            {selectedAppointment.customerName?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{selectedAppointment.customerName || 'Walk-in Customer'}</p>
                            <p className="text-gray-600 text-xs">{selectedAppointment.email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-200">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{selectedAppointment.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{selectedAppointment.location || 'In-Store'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Info Card */}
                  <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <Scissors className="h-4 w-4" />
                        Service Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-purple-200">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {selectedAppointment.serviceName || selectedAppointment.customService || 'Custom Service'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedAppointment.duration || '60 min'} • {selectedAppointment.assignedStaff || 'Not Assigned'}
                            </p>
                          </div>
                          <div className="text-lg font-bold text-purple-600">
                            ₹{parseFloat(selectedAppointment.amount || '0').toFixed(2)}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 bg-white rounded border text-center">
                            <Calendar className="h-3 w-3 mx-auto mb-1 text-blue-500" />
                            <p className="font-medium">{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                          </div>
                          <div className="p-2 bg-white rounded border text-center">
                            <Clock className="h-3 w-3 mx-auto mb-1 text-green-500" />
                            <p className="font-medium">{selectedAppointment.time}</p>
                          </div>
                          <div className="p-2 bg-white rounded border text-center">
                            <CheckCircle2 className="h-3 w-3 mx-auto mb-1 text-emerald-500" />
                            <p className="font-medium capitalize">{selectedAppointment.appointmentStatus || selectedAppointment.status}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Add Products */}
                  <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Products Used
                        <Badge variant="outline" className="ml-auto">{appointmentProducts.length} items</Badge>
                      </h3>
                      
                      {/* Product Search/Add */}
                      <Select
                        onValueChange={(productId) => {
                          const product = allProducts.find(p => p.id === productId);
                          if (product) {
                            const existing = appointmentProducts.find(p => p.id === product.id);
                            if (existing) {
                              setAppointmentProducts(prev =>
                                prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
                              );
                            } else {
                              setAppointmentProducts(prev => [...prev, { ...product, quantity: 1 }]);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Add product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allProducts.length === 0 ? (
                            <SelectItem value="none" disabled>No products available</SelectItem>
                          ) : (
                            allProducts.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex justify-between w-full">
                                  <span>{p.name}</span>
                                  <span className="text-gray-500 ml-2">₹{(p.price / 100).toFixed(2)}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Added Products List */}
                      <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                        {appointmentProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  if (p.quantity <= 1) {
                                    setAppointmentProducts(prev => prev.filter(prod => prod.id !== p.id));
                                  } else {
                                    setAppointmentProducts(prev =>
                                      prev.map(prod => prod.id === p.id ? { ...prod, quantity: prod.quantity - 1 } : prod)
                                    );
                                  }
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-bold">{p.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setAppointmentProducts(prev =>
                                    prev.map(prod => prod.id === p.id ? { ...prod, quantity: prod.quantity + 1 } : prod)
                                  );
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold text-green-600 w-16 text-right">
                                ₹{((p.price * p.quantity) / 100).toFixed(2)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => setAppointmentProducts(prev => prev.filter(prod => prod.id !== p.id))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Billing Details */}
                <div className="space-y-4">
                  {/* Charges & Adjustments */}
                  <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-4 space-y-4">
                      <h3 className="font-semibold text-green-900 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Billing Adjustments
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-600">Service Charge (₹)</Label>
                          <Input
                            type="number"
                            value={appointmentServiceCharge}
                            onChange={(e) => setAppointmentServiceCharge(e.target.value)}
                            className="bg-white"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Discount (%)</Label>
                          <Input
                            type="number"
                            value={appointmentDiscountPercent}
                            onChange={(e) => setAppointmentDiscountPercent(e.target.value)}
                            className="bg-white"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Tax (%)</Label>
                          <Input
                            type="number"
                            value={appointmentTaxPercent}
                            onChange={(e) => setAppointmentTaxPercent(e.target.value)}
                            className="bg-white"
                            min="0"
                          />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <Label className="text-xs text-gray-600">Round Off</Label>
                          <Switch
                            checked={appointmentRoundOff}
                            onCheckedChange={setAppointmentRoundOff}
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <Label className="text-xs text-gray-600">Payment Method</Label>
                        <Select value={appointmentPaymentMethod} onValueChange={setAppointmentPaymentMethod}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                Cash
                              </div>
                            </SelectItem>
                            <SelectItem value="card">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Card
                              </div>
                            </SelectItem>
                            <SelectItem value="upi">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                UPI
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label className="text-xs text-gray-600">Billing Notes</Label>
                        <Textarea
                          placeholder="Add any notes for this bill..."
                          value={appointmentNotes}
                          onChange={(e) => setAppointmentNotes(e.target.value)}
                          className="bg-white resize-none"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bill Summary */}
                  <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-100">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Bill Summary
                      </h3>
                      
                      {(() => {
                        const bill = calculateAppointmentBill();
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                              <span>Service Amount</span>
                              <span className="font-medium">₹{((bill.serviceAmount || 0) / 100).toFixed(2)}</span>
                            </div>
                            {bill.productsTotal > 0 && (
                              <div className="flex justify-between text-gray-600">
                                <span>Products ({appointmentProducts.length})</span>
                                <span className="font-medium">₹{(bill.productsTotal / 100).toFixed(2)}</span>
                              </div>
                            )}
                            {bill.serviceCharge > 0 && (
                              <div className="flex justify-between text-gray-600">
                                <span>Service Charge</span>
                                <span className="font-medium">₹{(bill.serviceCharge / 100).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="border-t border-dashed my-2 pt-2">
                              <div className="flex justify-between text-gray-700 font-medium">
                                <span>Subtotal</span>
                                <span>₹{(bill.subtotal / 100).toFixed(2)}</span>
                              </div>
                            </div>
                            {bill.discount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Discount ({appointmentDiscountPercent}%)
                                </span>
                                <span className="font-medium">-₹{(bill.discount / 100).toFixed(2)}</span>
                              </div>
                            )}
                            {bill.tax > 0 && (
                              <div className="flex justify-between text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Percent className="h-3 w-3" />
                                  Tax ({appointmentTaxPercent}%)
                                </span>
                                <span className="font-medium">₹{(bill.tax / 100).toFixed(2)}</span>
                              </div>
                            )}
                            {bill.roundOff !== 0 && (
                              <div className="flex justify-between text-gray-500 text-xs">
                                <span>Round Off</span>
                                <span>{bill.roundOff > 0 ? '+' : ''}₹{(bill.roundOff / 100).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="border-t-2 border-gray-300 mt-3 pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Grand Total</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  ₹{(bill.total / 100).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAppointmentBillingOpen(false);
                setShowAppointmentsBilling(true);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to List
            </Button>
            <Button
              onClick={completeAppointmentBilling}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
