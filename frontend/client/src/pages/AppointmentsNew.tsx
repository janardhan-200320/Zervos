import { useState, useEffect } from 'react';
import { Calendar, Plus, Minus, Search, Filter, CalendarX, DollarSign, CreditCard, Smartphone, Banknote, Edit2, Trash2, Clock, CheckCircle2, XCircle, MoreVertical, Pause, RefreshCw, Eye, Mail, Phone, User, MapPin, MessageSquare, QrCode, Copy, Video, PhoneCall, Building2, Link2, BarChart3, PieChart, TrendingUp, Download, Globe, Wifi, WifiOff, FileText, FileSpreadsheet, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useNotificationTriggers } from '@/lib/notificationHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import jsPDF from 'jspdf';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Appointment {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  customService?: string;
  assignedStaff?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  appointmentStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount?: string;
  currency?: string;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'none' | string;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  notes?: string;
  // New fields for appointment mode
  appointmentMode: 'online' | 'offline' | 'on-call';
  meetingPlatform?: 'zoom' | 'google-meet' | 'microsoft-teams' | 'whatsapp' | 'skype' | 'custom' | string;
  meetingLink?: string;
  callNumber?: string;
  location?: string;
  address?: string;
}

const getCurrencySymbol = (currency: string = 'INR') => {
  const symbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'CNY': '¥',
    'AED': 'د.إ',
  };
  return symbols[currency] || currency;
};

export default function AppointmentsNew() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [modeFilter, setModeFilter] = useState<'all' | 'online' | 'offline' | 'on-call'>('all');
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customReportDates, setCustomReportDates] = useState({ from: '', to: '' });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isCustomService, setIsCustomService] = useState(false);
  const [isCustomPaymentMethod, setIsCustomPaymentMethod] = useState(false);
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');
  const [isCustomPlatform, setIsCustomPlatform] = useState(false);
  const [customPlatform, setCustomPlatform] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{id: string; name: string; price: string; quantity: number}[]>([]);
  const announceAppointmentsChange = () => {
    try {
      window.dispatchEvent(new CustomEvent('appointments-updated'));
      window.dispatchEvent(new CustomEvent('timeslots-updated'));
    } catch (error) {
      console.warn('Failed to notify listeners about appointment changes:', error);
    }
  };
  
  const [newAppointment, setNewAppointment] = useState({
    customerName: '',
    email: '',
    phone: '',
    serviceName: '',
    customService: '',
    assignedStaff: '',
    date: '',
    time: '',
    appointmentStatus: 'confirmed',
    amount: '',
    currency: 'INR',
    paymentMethod: 'none',
    paymentStatus: 'unpaid',
    notes: '',
    // New fields
    appointmentMode: 'offline' as 'online' | 'offline' | 'on-call',
    meetingPlatform: '',
    meetingLink: '',
    callNumber: '',
    location: '',
    address: '',
  });

  useEffect(() => {
    // Load company data
    try {
      const companyData = localStorage.getItem('zervos_company');
      if (companyData) {
        setCompany(JSON.parse(companyData));
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }

    // Load team members
    try {
      const keys = ['zervos_team_members'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('zervos_team_members::')) {
          keys.push(key);
        }
      }
      
      let members: any[] = [];
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            members = [...members, ...parsed];
          }
        }
      }
      
      const uniqueMembers = members.filter((member, index, self) =>
        index === self.findIndex((m) => m.id === member.id)
      );
      
      setTeamMembers(uniqueMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
    }

    // Load services and products
    loadServices();
    loadProducts();

    // Listen for services and products updates
    const handleServicesUpdate = () => loadServices();
    const handleProductsUpdate = () => loadProducts();
    window.addEventListener('services-updated', handleServicesUpdate);
    window.addEventListener('products-updated', handleProductsUpdate);

    // Prefer backend appointments if available, fallback to localStorage
    fetch('/api/appointments')
      .then(res => (res && res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem('zervos_appointments');
          if (saved) {
            try { setAppointments(JSON.parse(saved)); } catch {}
          }
        } catch {}
      });

    return () => {
      window.removeEventListener('services-updated', handleServicesUpdate);
      window.removeEventListener('products-updated', handleProductsUpdate);
    };
  }, []);

  const loadServices = () => {
    try {
      const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
      const stored = localStorage.getItem(`zervos_services_${currentWorkspace}`);
      if (stored) {
        const parsedServices = JSON.parse(stored);
        // Filter only enabled services
        const enabledServices = parsedServices.filter((s: any) => s.isEnabled);
        setServices(enabledServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadProducts = () => {
    try {
      const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
      const stored = localStorage.getItem(`zervos_products_${currentWorkspace}`);
      if (stored) {
        const parsedProducts = JSON.parse(stored);
        // Filter only enabled products
        const enabledProducts = parsedProducts.filter((p: any) => p.isEnabled);
        setProducts(enabledProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addProductToAppointment = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = selectedProducts.find(p => p.id === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const removeProductFromAppointment = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromAppointment(productId);
    } else {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === productId ? { ...p, quantity } : p
      ));
    }
  };

  const calculateTotalWithProducts = () => {
    const serviceAmount = parseFloat(newAppointment.amount) || 0;
    const productsTotal = selectedProducts.reduce((sum, p) => 
      sum + (parseFloat(p.price) * p.quantity), 0
    );
    return serviceAmount + productsTotal;
  };

  const { notifyNewBooking, notifyBookingCancelled } = useNotificationTriggers();

  const handleCreateAppointment = () => {
    const finalServiceName = isCustomService && newAppointment.customService 
      ? newAppointment.customService 
      : newAppointment.serviceName;

    const finalPaymentMethod = isCustomPaymentMethod && customPaymentMethod.trim()
      ? customPaymentMethod.trim().toLowerCase().replace(/\s+/g, '-')
      : newAppointment.paymentMethod;

    const finalMeetingPlatform = isCustomPlatform && customPlatform.trim()
      ? customPlatform.trim().toLowerCase().replace(/\s+/g, '-')
      : newAppointment.meetingPlatform;

    const appointment: Appointment = {
      id: Date.now().toString(),
      customerName: newAppointment.customerName,
      email: newAppointment.email,
      phone: newAppointment.phone,
      serviceName: finalServiceName,
      customService: isCustomService ? newAppointment.customService : undefined,
      assignedStaff: newAppointment.assignedStaff,
      date: newAppointment.date,
      time: newAppointment.time,
      status: 'upcoming',
      appointmentStatus: newAppointment.appointmentStatus as any,
      amount: newAppointment.amount,
      currency: newAppointment.currency,
      paymentMethod: finalPaymentMethod as any,
      paymentStatus: newAppointment.paymentStatus as any,
      notes: newAppointment.notes,
      // New fields
      appointmentMode: newAppointment.appointmentMode,
      meetingPlatform: newAppointment.appointmentMode === 'online' ? finalMeetingPlatform : undefined,
      meetingLink: newAppointment.appointmentMode === 'online' ? newAppointment.meetingLink : undefined,
      callNumber: newAppointment.appointmentMode === 'on-call' ? newAppointment.callNumber : undefined,
      location: newAppointment.appointmentMode === 'offline' ? newAppointment.location : undefined,
      address: newAppointment.appointmentMode === 'offline' ? newAppointment.address : undefined,
    };
    
    const updated = [...appointments, appointment];
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
      
      // 🔔 Trigger notification
      notifyNewBooking(
        appointment.customerName,
        finalServiceName,
        `${appointment.date} at ${appointment.time}`,
        appointment.id
      );
    } catch {}

    // Also send to backend for persistence across devices
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    }).catch(() => {/* ignore errors for now */});
    
    setNewAppointmentOpen(false);
    setIsCustomService(false);
    setIsCustomPaymentMethod(false);
    setCustomPaymentMethod('');
    setIsCustomPlatform(false);
    setCustomPlatform('');
    setNewAppointment({
      customerName: '',
      email: '',
      phone: '',
      serviceName: '',
      customService: '',
      assignedStaff: '',
      date: '',
      time: '',
      appointmentStatus: 'confirmed',
      amount: '',
      currency: 'INR',
      paymentMethod: 'none',
      paymentStatus: 'unpaid',
      notes: '',
      appointmentMode: 'offline',
      meetingPlatform: '',
      meetingLink: '',
      callNumber: '',
      location: '',
      address: '',
    });
    
    toast({ title: "Success", description: "Appointment created successfully" });
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment) return;

    const finalServiceName = isCustomService && newAppointment.customService 
      ? newAppointment.customService 
      : newAppointment.serviceName;

    const finalPaymentMethod = isCustomPaymentMethod && customPaymentMethod.trim()
      ? customPaymentMethod.trim().toLowerCase().replace(/\s+/g, '-')
      : newAppointment.paymentMethod;

    const finalMeetingPlatform = isCustomPlatform && customPlatform.trim()
      ? customPlatform.trim().toLowerCase().replace(/\s+/g, '-')
      : newAppointment.meetingPlatform;

    const updatedAppointment: Appointment = {
      ...selectedAppointment,
      customerName: newAppointment.customerName,
      email: newAppointment.email,
      phone: newAppointment.phone,
      serviceName: finalServiceName,
      customService: isCustomService ? newAppointment.customService : undefined,
      assignedStaff: newAppointment.assignedStaff,
      date: newAppointment.date,
      time: newAppointment.time,
      appointmentStatus: newAppointment.appointmentStatus as any,
      amount: newAppointment.amount,
      currency: newAppointment.currency,
      paymentMethod: finalPaymentMethod as any,
      paymentStatus: newAppointment.paymentStatus as any,
      notes: newAppointment.notes,
      // New fields
      appointmentMode: newAppointment.appointmentMode,
      meetingPlatform: newAppointment.appointmentMode === 'online' ? finalMeetingPlatform : undefined,
      meetingLink: newAppointment.appointmentMode === 'online' ? newAppointment.meetingLink : undefined,
      callNumber: newAppointment.appointmentMode === 'on-call' ? newAppointment.callNumber : undefined,
      location: newAppointment.appointmentMode === 'offline' ? newAppointment.location : undefined,
      address: newAppointment.appointmentMode === 'offline' ? newAppointment.address : undefined,
    };

    const updated = appointments.map(apt => 
      apt.id === selectedAppointment.id ? updatedAppointment : apt
    );
    
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
    } catch {}

    setEditAppointmentOpen(false);
    setSelectedAppointment(null);
    setIsCustomService(false);
    setIsCustomPaymentMethod(false);
    setCustomPaymentMethod('');
    setIsCustomPlatform(false);
    setCustomPlatform('');
    setNewAppointment({
      customerName: '',
      email: '',
      phone: '',
      serviceName: '',
      customService: '',
      assignedStaff: '',
      date: '',
      time: '',
      appointmentStatus: 'confirmed',
      amount: '',
      currency: 'INR',
      paymentMethod: 'none',
      paymentStatus: 'unpaid',
      notes: '',
      appointmentMode: 'offline',
      meetingPlatform: '',
      meetingLink: '',
      callNumber: '',
      location: '',
      address: '',
    });

    toast({ title: "Success", description: "Appointment updated successfully" });
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) return;

    const updated = appointments.filter(apt => apt.id !== selectedAppointment.id);
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
    } catch {}

    // 🔔 Trigger cancellation notification
    notifyBookingCancelled(
      selectedAppointment.customerName,
      selectedAppointment.serviceName
    );

    setDeleteConfirmOpen(false);
    setSelectedAppointment(null);

    toast({ 
      title: "Deleted", 
      description: "Appointment has been deleted successfully",
      variant: "destructive"
    });
  };

  const handleStatusChange = (appointmentId: string, newStatus: 'confirmed' | 'completed' | 'cancelled' | 'pending') => {
    const updated = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, appointmentStatus: newStatus } : apt
    );
    
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
    } catch {}

    const statusMessages = {
      confirmed: 'Appointment confirmed',
      completed: 'Appointment marked as completed',
      cancelled: 'Appointment cancelled',
      pending: 'Appointment set to pending'
    };

    toast({ title: "Status Updated", description: statusMessages[newStatus] });
  };

  const openEditDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const isCustom = !['Consultation', 'Demo', 'Training', 'Support'].includes(appointment.serviceName);
    setIsCustomService(isCustom);
    
    // Check if payment method is custom
    const standardPaymentMethods = ['none', 'cash', 'upi', 'card'];
    const isCustomPayment = appointment.paymentMethod && !standardPaymentMethods.includes(appointment.paymentMethod);
    setIsCustomPaymentMethod(isCustomPayment || false);
    if (isCustomPayment) {
      setCustomPaymentMethod(appointment.paymentMethod || '');
    }

    // Check if meeting platform is custom
    const standardPlatforms = ['zoom', 'google-meet', 'microsoft-teams', 'whatsapp', 'skype'];
    const isCustomMeetingPlatform = appointment.meetingPlatform && !standardPlatforms.includes(appointment.meetingPlatform);
    setIsCustomPlatform(isCustomMeetingPlatform || false);
    if (isCustomMeetingPlatform) {
      setCustomPlatform(appointment.meetingPlatform || '');
    }
    
    setNewAppointment({
      customerName: appointment.customerName,
      email: appointment.email,
      phone: appointment.phone,
      serviceName: isCustom ? '' : appointment.serviceName,
      customService: isCustom ? appointment.serviceName : '',
      assignedStaff: appointment.assignedStaff || '',
      date: appointment.date,
      time: appointment.time,
      appointmentStatus: appointment.appointmentStatus || 'confirmed',
      amount: appointment.amount || '',
      currency: appointment.currency || 'INR',
      paymentMethod: isCustomPayment ? '' : (appointment.paymentMethod || 'none'),
      paymentStatus: appointment.paymentStatus || 'unpaid',
      notes: appointment.notes || '',
      appointmentMode: appointment.appointmentMode || 'offline',
      meetingPlatform: isCustomMeetingPlatform ? '' : (appointment.meetingPlatform || ''),
      meetingLink: appointment.meetingLink || '',
      callNumber: appointment.callNumber || '',
      location: appointment.location || '',
      address: appointment.address || '',
    });
    
    setEditAppointmentOpen(true);
  };

  const upcomingAppointments = appointments.filter(apt => {
    const matchesStatus = apt.status === 'upcoming';
    const matchesMode = modeFilter === 'all' || apt.appointmentMode === modeFilter;
    const matchesSearch = !searchQuery || 
      apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesMode && matchesSearch;
  });

  const pastAppointments = appointments.filter(apt => {
    const matchesStatus = apt.status === 'completed' || apt.status === 'cancelled';
    const matchesMode = modeFilter === 'all' || apt.appointmentMode === modeFilter;
    const matchesSearch = !searchQuery || 
      apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesMode && matchesSearch;
  });

  // Stats for reports
  const totalAppointments = appointments.length;
  const onlineAppointments = appointments.filter(a => a.appointmentMode === 'online').length;
  const offlineAppointments = appointments.filter(a => a.appointmentMode === 'offline').length;
  const onCallAppointments = appointments.filter(a => a.appointmentMode === 'on-call').length;
  const completedAppointments = appointments.filter(a => a.appointmentStatus === 'completed').length;
  const cancelledAppointments = appointments.filter(a => a.appointmentStatus === 'cancelled').length;
  const pendingAppointments = appointments.filter(a => a.appointmentStatus === 'pending').length;
  const confirmedAppointments = appointments.filter(a => a.appointmentStatus === 'confirmed').length;
  const totalRevenue = appointments.reduce((sum, a) => sum + (parseFloat(a.amount || '0') || 0), 0);
  const paidAppointments = appointments.filter(a => a.paymentStatus === 'paid').length;

  // Get filtered appointments based on report period
  const getFilteredAppointmentsByPeriod = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (reportPeriod) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        startDate = customReportDates.from ? new Date(customReportDates.from) : new Date(now);
        endDate = customReportDates.to ? new Date(customReportDates.to) : new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= startDate && aptDate <= endDate;
    });
  };

  // Generate comprehensive appointment report
  const generateAppointmentReport = () => {
    const filtered = getFilteredAppointmentsByPeriod();
    
    const periodLabel = reportPeriod === 'today' ? 'Today' :
                        reportPeriod === 'week' ? 'Last 7 Days' :
                        reportPeriod === 'month' ? 'Last 30 Days' :
                        reportPeriod === 'year' ? 'Last 12 Months' :
                        `${customReportDates.from} to ${customReportDates.to}`;
    
    const online = filtered.filter(a => a.appointmentMode === 'online');
    const offline = filtered.filter(a => a.appointmentMode === 'offline');
    const onCall = filtered.filter(a => a.appointmentMode === 'on-call');
    const completed = filtered.filter(a => a.appointmentStatus === 'completed');
    const cancelled = filtered.filter(a => a.appointmentStatus === 'cancelled');
    const pending = filtered.filter(a => a.appointmentStatus === 'pending');
    const confirmed = filtered.filter(a => a.appointmentStatus === 'confirmed');
    const paid = filtered.filter(a => a.paymentStatus === 'paid');
    const unpaid = filtered.filter(a => a.paymentStatus === 'unpaid');
    const revenue = filtered.reduce((sum, a) => sum + (parseFloat(a.amount || '0') || 0), 0);
    const paidRevenue = paid.reduce((sum, a) => sum + (parseFloat(a.amount || '0') || 0), 0);
    const unpaidRevenue = unpaid.reduce((sum, a) => sum + (parseFloat(a.amount || '0') || 0), 0);
    
    // Service breakdown
    const serviceBreakdown: { [key: string]: { count: number; revenue: number } } = {};
    filtered.forEach(apt => {
      const serviceName = apt.serviceName || 'Unknown';
      if (!serviceBreakdown[serviceName]) {
        serviceBreakdown[serviceName] = { count: 0, revenue: 0 };
      }
      serviceBreakdown[serviceName].count += 1;
      serviceBreakdown[serviceName].revenue += parseFloat(apt.amount || '0') || 0;
    });
    
    // Customer breakdown
    const customerBreakdown: { [key: string]: { count: number; revenue: number } } = {};
    filtered.forEach(apt => {
      const customer = apt.customerName || 'Unknown';
      if (!customerBreakdown[customer]) {
        customerBreakdown[customer] = { count: 0, revenue: 0 };
      }
      customerBreakdown[customer].count += 1;
      customerBreakdown[customer].revenue += parseFloat(apt.amount || '0') || 0;
    });
    
    // Staff breakdown
    const staffBreakdown: { [key: string]: { count: number; revenue: number } } = {};
    filtered.forEach(apt => {
      const staff = apt.assignedStaff || 'Unassigned';
      if (!staffBreakdown[staff]) {
        staffBreakdown[staff] = { count: 0, revenue: 0 };
      }
      staffBreakdown[staff].count += 1;
      staffBreakdown[staff].revenue += parseFloat(apt.amount || '0') || 0;
    });
    
    // Payment method breakdown
    const paymentBreakdown: { [key: string]: { count: number; amount: number } } = {};
    paid.forEach(apt => {
      const method = apt.paymentMethod || 'Unknown';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { count: 0, amount: 0 };
      }
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].amount += parseFloat(apt.amount || '0') || 0;
    });
    
    // Daily breakdown
    const dailyBreakdown: { [key: string]: { count: number; revenue: number } } = {};
    filtered.forEach(apt => {
      const date = apt.date;
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { count: 0, revenue: 0 };
      }
      dailyBreakdown[date].count += 1;
      dailyBreakdown[date].revenue += parseFloat(apt.amount || '0') || 0;
    });
    
    // Platform breakdown for online
    const platformBreakdown: { [key: string]: number } = {};
    online.forEach(apt => {
      const platform = apt.meetingPlatform || 'Other';
      platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
    });
    
    return {
      period: periodLabel,
      summary: {
        total: filtered.length,
        online: online.length,
        offline: offline.length,
        onCall: onCall.length,
        completed: completed.length,
        cancelled: cancelled.length,
        pending: pending.length,
        confirmed: confirmed.length,
        paid: paid.length,
        unpaid: unpaid.length,
        totalRevenue: revenue,
        paidRevenue,
        unpaidRevenue,
        avgRevenuePerAppointment: filtered.length > 0 ? revenue / filtered.length : 0,
        completionRate: filtered.length > 0 ? ((completed.length / filtered.length) * 100).toFixed(1) : '0',
        paymentRate: filtered.length > 0 ? ((paid.length / filtered.length) * 100).toFixed(1) : '0',
      },
      services: Object.entries(serviceBreakdown)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      customers: Object.entries(customerBreakdown)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      staff: Object.entries(staffBreakdown)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count),
      paymentMethods: Object.entries(paymentBreakdown)
        .map(([method, data]) => ({ method, ...data })),
      dailyTrend: Object.entries(dailyBreakdown)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      platforms: Object.entries(platformBreakdown)
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count),
      allAppointments: filtered.map(apt => ({
        id: apt.id,
        customer: apt.customerName,
        email: apt.email,
        phone: apt.phone,
        service: apt.serviceName,
        staff: apt.assignedStaff || 'Unassigned',
        date: apt.date,
        time: apt.time,
        mode: apt.appointmentMode,
        status: apt.appointmentStatus,
        paymentStatus: apt.paymentStatus,
        amount: parseFloat(apt.amount || '0') || 0,
        currency: apt.currency || 'INR',
      })),
    };
  };

  // Download appointment report as CSV
  const downloadAppointmentReportCSV = () => {
    const report = generateAppointmentReport();
    const lines: string[] = [];
    
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('APPOINTMENT ANALYTICS REPORT');
    lines.push(`Period: ${report.period}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    
    lines.push('EXECUTIVE SUMMARY');
    lines.push('-----------------');
    lines.push(`Total Appointments,${report.summary.total}`);
    lines.push(`Online,${report.summary.online}`);
    lines.push(`Offline,${report.summary.offline}`);
    lines.push(`On-Call,${report.summary.onCall}`);
    lines.push(`Completed,${report.summary.completed}`);
    lines.push(`Pending,${report.summary.pending}`);
    lines.push(`Confirmed,${report.summary.confirmed}`);
    lines.push(`Cancelled,${report.summary.cancelled}`);
    lines.push(`Total Revenue,${getCurrencySymbol('INR')}${report.summary.totalRevenue.toLocaleString('en-IN')}`);
    lines.push(`Paid Revenue,${getCurrencySymbol('INR')}${report.summary.paidRevenue.toLocaleString('en-IN')}`);
    lines.push(`Unpaid Revenue,${getCurrencySymbol('INR')}${report.summary.unpaidRevenue.toLocaleString('en-IN')}`);
    lines.push(`Completion Rate,${report.summary.completionRate}%`);
    lines.push(`Payment Rate,${report.summary.paymentRate}%`);
    lines.push('');
    
    lines.push('TOP SERVICES');
    lines.push('------------');
    lines.push('Service,Appointments,Revenue');
    report.services.slice(0, 10).forEach(s => {
      lines.push(`"${s.name}",${s.count},${getCurrencySymbol('INR')}${s.revenue.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('TOP CUSTOMERS');
    lines.push('-------------');
    lines.push('Customer,Appointments,Revenue');
    report.customers.forEach(c => {
      lines.push(`"${c.name}",${c.count},${getCurrencySymbol('INR')}${c.revenue.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('STAFF PERFORMANCE');
    lines.push('-----------------');
    lines.push('Staff,Appointments,Revenue');
    report.staff.forEach(s => {
      lines.push(`"${s.name}",${s.count},${getCurrencySymbol('INR')}${s.revenue.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('APPOINTMENT DETAILS');
    lines.push('-------------------');
    lines.push('ID,Customer,Email,Phone,Service,Staff,Date,Time,Mode,Status,Payment Status,Amount');
    report.allAppointments.forEach(apt => {
      lines.push(`"${apt.id}","${apt.customer}","${apt.email}","${apt.phone}","${apt.service}","${apt.staff}","${apt.date}","${apt.time}","${apt.mode}","${apt.status}","${apt.paymentStatus}",${getCurrencySymbol(apt.currency)}${apt.amount.toLocaleString('en-IN')}`);
    });
    
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Appointments_Report_${report.period.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: '📊 Report Downloaded',
      description: 'Appointment report saved as CSV file',
    });
  };

  // Download appointment report as Excel
  const downloadAppointmentReportExcel = () => {
    const report = generateAppointmentReport();
    const lines: string[] = [];
    
    lines.push('APPOINTMENT ANALYTICS REPORT');
    lines.push(`Period:\t${report.period}`);
    lines.push(`Generated:\t${new Date().toLocaleString()}`);
    lines.push('');
    
    lines.push('SUMMARY METRICS');
    lines.push('Metric\tValue');
    lines.push(`Total Appointments\t${report.summary.total}`);
    lines.push(`Online\t${report.summary.online}`);
    lines.push(`Offline\t${report.summary.offline}`);
    lines.push(`On-Call\t${report.summary.onCall}`);
    lines.push(`Completed\t${report.summary.completed}`);
    lines.push(`Pending\t${report.summary.pending}`);
    lines.push(`Confirmed\t${report.summary.confirmed}`);
    lines.push(`Cancelled\t${report.summary.cancelled}`);
    lines.push(`Total Revenue\t₹${report.summary.totalRevenue.toLocaleString('en-IN')}`);
    lines.push(`Paid Revenue\t₹${report.summary.paidRevenue.toLocaleString('en-IN')}`);
    lines.push(`Unpaid Revenue\t₹${report.summary.unpaidRevenue.toLocaleString('en-IN')}`);
    lines.push(`Avg Revenue per Appointment\t₹${report.summary.avgRevenuePerAppointment.toLocaleString('en-IN')}`);
    lines.push(`Completion Rate\t${report.summary.completionRate}%`);
    lines.push(`Payment Rate\t${report.summary.paymentRate}%`);
    lines.push('');
    
    lines.push('TOP SERVICES');
    lines.push('Service\tAppointments\tRevenue');
    report.services.slice(0, 10).forEach(s => {
      lines.push(`${s.name}\t${s.count}\t₹${s.revenue.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('TOP CUSTOMERS');
    lines.push('Customer\tAppointments\tRevenue');
    report.customers.forEach(c => {
      lines.push(`${c.name}\t${c.count}\t₹${c.revenue.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('STAFF PERFORMANCE');
    lines.push('Staff\tAppointments\tRevenue');
    report.staff.forEach(s => {
      lines.push(`${s.name}\t${s.count}\t₹${s.revenue.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    if (report.platforms.length > 0) {
      lines.push('ONLINE PLATFORMS');
      lines.push('Platform\tAppointments');
      report.platforms.forEach(p => {
        lines.push(`${p.platform}\t${p.count}`);
      });
      lines.push('');
    }
    
    lines.push('COMPLETE APPOINTMENT LIST');
    lines.push('ID\tCustomer\tEmail\tPhone\tService\tStaff\tDate\tTime\tMode\tStatus\tPayment\tAmount');
    report.allAppointments.forEach(apt => {
      lines.push(`${apt.id}\t${apt.customer}\t${apt.email}\t${apt.phone}\t${apt.service}\t${apt.staff}\t${apt.date}\t${apt.time}\t${apt.mode}\t${apt.status}\t${apt.paymentStatus}\t₹${apt.amount.toLocaleString('en-IN')}`);
    });
    
    const excelContent = lines.join('\n');
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Appointments_Report_${report.period.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    
    toast({
      title: '📊 Report Downloaded',
      description: 'Appointment report saved as Excel file',
    });
  };

  // Download appointment report as PDF
  const downloadAppointmentReportPDF = () => {
    const report = generateAppointmentReport();
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > 280) {
        doc.addPage();
        yPosition = 20;
      }
    };
    
    // Header with gradient effect
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Appointment Analytics Report', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${report.period}`, pageWidth / 2, 32, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });
    
    yPosition = 60;
    doc.setTextColor(0, 0, 0);
    
    // Executive Summary Box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition - 5, contentWidth, 70, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, yPosition - 5, contentWidth, 70, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Summary', margin + 5, yPosition + 5);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const col1 = margin + 5;
    const col2 = margin + 55;
    const col3 = margin + 110;
    
    doc.setTextColor(100, 116, 139);
    doc.text('Total:', col1, yPosition);
    doc.text('Online:', col2, yPosition);
    doc.text('Offline:', col3, yPosition);
    yPosition += 8;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(report.summary.total.toString(), col1, yPosition);
    doc.setTextColor(147, 51, 234);
    doc.text(report.summary.online.toString(), col2, yPosition);
    doc.setTextColor(20, 184, 166);
    doc.text(report.summary.offline.toString(), col3, yPosition);
    
    yPosition += 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Completed:', col1, yPosition);
    doc.text('Pending:', col2, yPosition);
    doc.text('Cancelled:', col3, yPosition);
    yPosition += 8;
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.text(report.summary.completed.toString(), col1, yPosition);
    doc.setTextColor(234, 179, 8);
    doc.text(report.summary.pending.toString(), col2, yPosition);
    doc.setTextColor(239, 68, 68);
    doc.text(report.summary.cancelled.toString(), col3, yPosition);
    
    yPosition += 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Total Revenue:', col1, yPosition);
    doc.text('Paid:', col2, yPosition);
    doc.text('Unpaid:', col3, yPosition);
    yPosition += 8;
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${report.summary.totalRevenue.toLocaleString('en-IN')}`, col1, yPosition);
    doc.text(`₹${report.summary.paidRevenue.toLocaleString('en-IN')}`, col2, yPosition);
    doc.setTextColor(239, 68, 68);
    doc.text(`₹${report.summary.unpaidRevenue.toLocaleString('en-IN')}`, col3, yPosition);
    
    yPosition += 25;
    
    // Top Services
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('Top Services', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Service', margin, yPosition);
    doc.text('Count', margin + 80, yPosition);
    doc.text('Revenue', margin + 110, yPosition);
    yPosition += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPosition, margin + contentWidth, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    report.services.slice(0, 5).forEach(s => {
      checkNewPage(10);
      doc.text(s.name.substring(0, 30), margin, yPosition);
      doc.text(s.count.toString(), margin + 80, yPosition);
      doc.text(`₹${s.revenue.toLocaleString('en-IN')}`, margin + 110, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Top Customers
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('Top Customers', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Customer', margin, yPosition);
    doc.text('Appointments', margin + 80, yPosition);
    doc.text('Revenue', margin + 120, yPosition);
    yPosition += 2;
    doc.line(margin, yPosition, margin + contentWidth, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    report.customers.slice(0, 5).forEach(c => {
      checkNewPage(10);
      doc.text(c.name.substring(0, 30), margin, yPosition);
      doc.text(c.count.toString(), margin + 80, yPosition);
      doc.text(`₹${c.revenue.toLocaleString('en-IN')}`, margin + 120, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Staff Performance
    if (report.staff.length > 0) {
      checkNewPage(60);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text('Staff Performance', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Staff Member', margin, yPosition);
      doc.text('Appointments', margin + 80, yPosition);
      doc.text('Revenue', margin + 120, yPosition);
      yPosition += 2;
      doc.line(margin, yPosition, margin + contentWidth, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      report.staff.slice(0, 5).forEach(s => {
        checkNewPage(10);
        doc.text(s.name.substring(0, 30), margin, yPosition);
        doc.text(s.count.toString(), margin + 80, yPosition);
        doc.text(`₹${s.revenue.toLocaleString('en-IN')}`, margin + 120, yPosition);
        yPosition += 8;
      });
    }
    
    // Save PDF
    doc.save(`Appointments_Report_${report.period.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: '📊 Report Downloaded',
      description: 'Appointment report saved as PDF file',
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'online': return <Video className="h-3 w-3" />;
      case 'on-call': return <PhoneCall className="h-3 w-3" />;
      case 'offline': return <Building2 className="h-3 w-3" />;
      default: return <Building2 className="h-3 w-3" />;
    }
  };

  const getModeBadgeColor = (mode: string) => {
    switch (mode) {
      case 'online': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'on-call': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'offline': return 'bg-teal-100 text-teal-700 border-teal-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom': return '📹';
      case 'google-meet': return '🎥';
      case 'microsoft-teams': return '👥';
      case 'whatsapp': return '💬';
      case 'skype': return '📞';
      default: return '🔗';
    }
  };

  const renderAppointmentsList = (appointmentsList: Appointment[]) => {
    if (appointmentsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center relative">
                <Calendar size={48} className="text-indigo-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <CalendarX size={16} className="text-white" />
                </div>
                <div className="absolute top-3 left-3 w-4 h-4 bg-indigo-600 rounded-sm"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full"></div>
                <div className="absolute -top-4 right-8 w-5 h-5 bg-purple-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </h3>
          <p className="text-gray-500 mb-6">
            Organize your schedule by adding appointments here.
          </p>
          <Button 
            onClick={() => setNewAppointmentOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Plus size={18} />
            New Appointment
          </Button>
        </div>
      );
    }

    return (
      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {appointmentsList.map((appointment, index) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{appointment.customerName}</h3>
                    {/* Mode Badge */}
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getModeBadgeColor(appointment.appointmentMode || 'offline')}`}
                    >
                      {getModeIcon(appointment.appointmentMode || 'offline')}
                      {(appointment.appointmentMode || 'offline').charAt(0).toUpperCase() + (appointment.appointmentMode || 'offline').slice(1).replace('-', ' ')}
                    </motion.span>
                    {appointment.appointmentStatus && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          appointment.appointmentStatus === 'confirmed' 
                            ? 'bg-blue-100 text-blue-700' 
                            : appointment.appointmentStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : appointment.appointmentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {appointment.appointmentStatus === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                        {appointment.appointmentStatus === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                        {appointment.appointmentStatus === 'pending' && <Clock className="h-3 w-3" />}
                        {appointment.appointmentStatus === 'cancelled' && <XCircle className="h-3 w-3" />}
                        {appointment.appointmentStatus.charAt(0).toUpperCase() + appointment.appointmentStatus.slice(1)}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-2">{appointment.serviceName}</p>
                  
                  {/* Mode-specific details */}
                  {appointment.appointmentMode === 'online' && appointment.meetingLink && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <span className="text-purple-600">{getPlatformIcon(appointment.meetingPlatform || 'custom')}</span>
                      <span className="text-gray-500 capitalize">{appointment.meetingPlatform?.replace('-', ' ') || 'Meeting'}:</span>
                      <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        Join Meeting
                      </a>
                    </div>
                  )}
                  {appointment.appointmentMode === 'on-call' && appointment.callNumber && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <PhoneCall className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-500">Call:</span>
                      <a href={`tel:${appointment.callNumber}`} className="text-orange-600 hover:underline">{appointment.callNumber}</a>
                    </div>
                  )}
                  {appointment.appointmentMode === 'offline' && appointment.location && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <MapPin className="h-4 w-4 text-teal-500" />
                      <span className="text-gray-500">Location:</span>
                      <span className="text-teal-600">{appointment.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {appointment.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {appointment.time}
                    </span>
                    <span>•</span>
                    <span>{appointment.email}</span>
                  </div>
                  {appointment.amount && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 mt-3"
                    >
                      <div className="flex items-center gap-1 text-sm bg-green-50 px-2.5 py-1 rounded-md">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-700">{getCurrencySymbol(appointment.currency)}{appointment.amount}</span>
                      </div>
                      {appointment.paymentMethod && appointment.paymentMethod !== 'none' && (
                        <span className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 flex items-center gap-1.5 font-medium">
                          {appointment.paymentMethod === 'cash' && <Banknote className="h-3.5 w-3.5" />}
                          {appointment.paymentMethod === 'upi' && <Smartphone className="h-3.5 w-3.5" />}
                          {appointment.paymentMethod === 'card' && <CreditCard className="h-3.5 w-3.5" />}
                          {appointment.paymentMethod.toUpperCase()}
                        </span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                        appointment.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : appointment.paymentStatus === 'partial'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                      </span>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(appointment)}
                      className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setViewDetailsOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {appointment.appointmentStatus !== 'confirmed' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="cursor-pointer"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
                          <span>Mark as Confirmed</span>
                        </DropdownMenuItem>
                      )}
                      
                      {appointment.appointmentStatus !== 'completed' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                          className="cursor-pointer"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          <span>Mark as Completed</span>
                        </DropdownMenuItem>
                      )}
                      
                      {appointment.appointmentStatus !== 'pending' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'pending')}
                          className="cursor-pointer"
                        >
                          <Pause className="mr-2 h-4 w-4 text-yellow-600" />
                          <span>Hold/Set Pending</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => openEditDialog(appointment)}
                        className="cursor-pointer"
                      >
                        <RefreshCw className="mr-2 h-4 w-4 text-purple-600" />
                        <span>Reschedule</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          const feedbackUrl = `${window.location.origin}/feedback?appointmentId=${appointment.id}&service=${encodeURIComponent(appointment.serviceName || appointment.customService || '')}&attendee=${encodeURIComponent(appointment.assignedStaff || '')}&customer=${encodeURIComponent(appointment.customerName)}`;
                          navigator.clipboard.writeText(feedbackUrl);
                          toast({
                            title: 'Feedback Link Copied!',
                            description: 'Share this link with the customer to collect feedback',
                          });
                        }}
                        className="cursor-pointer"
                      >
                        <Copy className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>Copy Feedback Link</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          const feedbackUrl = `${window.location.origin}/feedback?appointmentId=${appointment.id}&service=${encodeURIComponent(appointment.serviceName || appointment.customService || '')}&attendee=${encodeURIComponent(appointment.assignedStaff || '')}&customer=${encodeURIComponent(appointment.customerName)}`;
                          window.open(feedbackUrl, '_blank');
                        }}
                        className="cursor-pointer"
                      >
                        <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
                        <span>Open Feedback Form</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {appointment.appointmentStatus !== 'cancelled' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          className="cursor-pointer text-orange-600 focus:text-orange-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Cancel Appointment</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDeleteConfirmOpen(true);
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Appointment</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
              <p className="text-sm text-gray-500 mt-1">
                Total: {totalAppointments} | Online: {onlineAppointments} | Offline: {offlineAppointments} | On-Call: {onCallAppointments}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <BarChart3 size={18} />
                    Reports
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Select Report Period
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setReportPeriod('today'); setReportsOpen(true); }}>
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Today's Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setReportPeriod('week'); setReportsOpen(true); }}>
                    <Calendar className="h-4 w-4 mr-2 text-green-500" />
                    Weekly Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setReportPeriod('month'); setReportsOpen(true); }}>
                    <CalendarDays className="h-4 w-4 mr-2 text-purple-500" />
                    Monthly Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setReportPeriod('year'); setReportsOpen(true); }}>
                    <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                    Yearly Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setReportPeriod('custom'); setReportsOpen(true); }}>
                    <Filter className="h-4 w-4 mr-2 text-indigo-500" />
                    Custom Date Range
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => setNewAppointmentOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Plus size={18} />
                New Appointment
              </Button>
            </div>
          </div>
          
          {/* Mode Filter Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-500 mr-2">Filter by type:</span>
            <Button
              variant={modeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setModeFilter('all')}
              className={modeFilter === 'all' ? 'bg-gray-800' : ''}
            >
              <Globe className="h-4 w-4 mr-1" />
              All
            </Button>
            <Button
              variant={modeFilter === 'online' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setModeFilter('online')}
              className={modeFilter === 'online' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-600 border-purple-200 hover:bg-purple-50'}
            >
              <Video className="h-4 w-4 mr-1" />
              Online
            </Button>
            <Button
              variant={modeFilter === 'offline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setModeFilter('offline')}
              className={modeFilter === 'offline' ? 'bg-teal-600 hover:bg-teal-700' : 'text-teal-600 border-teal-200 hover:bg-teal-50'}
            >
              <Building2 className="h-4 w-4 mr-1" />
              Offline
            </Button>
            <Button
              variant={modeFilter === 'on-call' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setModeFilter('on-call')}
              className={modeFilter === 'on-call' ? 'bg-orange-600 hover:bg-orange-700' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}
            >
              <PhoneCall className="h-4 w-4 mr-1" />
              On-Call
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming" className="px-6">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past" className="px-6">
                Past
              </TabsTrigger>
              <TabsTrigger value="custom" className="px-6">
                Custom Date
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {renderAppointmentsList(upcomingAppointments)}
            </TabsContent>

            <TabsContent value="past">
              {renderAppointmentsList(pastAppointments)}
            </TabsContent>

            <TabsContent value="custom">
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <Calendar size={48} className="text-indigo-600" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a custom date range</h3>
                <p className="text-gray-500 mb-6">Choose dates to view appointments</p>
                <div className="flex gap-3">
                  <Input type="date" className="w-40" />
                  <span className="text-gray-500 flex items-center">to</span>
                  <Input type="date" className="w-40" />
                  <Button variant="outline">Filter</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* New Appointment Modal */}
        <Dialog open={newAppointmentOpen} onOpenChange={setNewAppointmentOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
              <DialogDescription>
                Create a new appointment for your customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={newAppointment.customerName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newAppointment.email}
                    onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone and Assigned Staff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned {company?.teamMemberLabel || 'Staff'}</Label>
                  <Select 
                    value={newAppointment.assignedStaff}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, assignedStaff: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={teamMembers.length > 0 ? `Select ${company?.teamMemberLabel || 'Staff'}` : 'No staff available'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} {member.role ? `(${member.role})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No staff available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Select 
                    value={isCustomService ? 'custom' : newAppointment.serviceName} 
                    onValueChange={(v) => {
                      if (v === 'custom') {
                        setIsCustomService(true);
                        setNewAppointment({ ...newAppointment, serviceName: '' });
                      } else {
                        setIsCustomService(false);
                        setNewAppointment({ ...newAppointment, serviceName: v, customService: '' });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Demo">Demo</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="custom">✏️ Custom Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isCustomService && (
                  <div className="space-y-2">
                    <Label>Custom Service Name *</Label>
                    <Input
                      value={newAppointment.customService}
                      onChange={(e) => setNewAppointment({ ...newAppointment, customService: e.target.value })}
                      placeholder="Enter custom service name"
                    />
                  </div>
                )}
                {!isCustomService && (
                  <div className="space-y-2">
                    <Label>Appointment Status *</Label>
                    <Select 
                      value={newAppointment.appointmentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Appointment Status when custom service */}
              {isCustomService && (
                <div className="space-y-2">
                  <Label>Appointment Status *</Label>
                  <Select 
                    value={newAppointment.appointmentStatus}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Appointment Mode Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  Appointment Mode
                </h3>
                <div className="flex gap-3 mb-4">
                  <Button
                    type="button"
                    variant={newAppointment.appointmentMode === 'offline' ? 'default' : 'outline'}
                    onClick={() => {
                      setNewAppointment({ ...newAppointment, appointmentMode: 'offline', meetingPlatform: '', meetingLink: '', callNumber: '' });
                      setIsCustomPlatform(false);
                    }}
                    className={newAppointment.appointmentMode === 'offline' ? 'bg-teal-600 hover:bg-teal-700' : 'text-teal-600 border-teal-200 hover:bg-teal-50'}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Offline (In-Person)
                  </Button>
                  <Button
                    type="button"
                    variant={newAppointment.appointmentMode === 'online' ? 'default' : 'outline'}
                    onClick={() => {
                      setNewAppointment({ ...newAppointment, appointmentMode: 'online', callNumber: '' });
                    }}
                    className={newAppointment.appointmentMode === 'online' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-600 border-purple-200 hover:bg-purple-50'}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Online (Virtual)
                  </Button>
                  <Button
                    type="button"
                    variant={newAppointment.appointmentMode === 'on-call' ? 'default' : 'outline'}
                    onClick={() => {
                      setNewAppointment({ ...newAppointment, appointmentMode: 'on-call', meetingPlatform: '', meetingLink: '' });
                      setIsCustomPlatform(false);
                    }}
                    className={newAppointment.appointmentMode === 'on-call' ? 'bg-orange-600 hover:bg-orange-700' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    On-Call
                  </Button>
                </div>

                {/* Online Mode Fields */}
                {newAppointment.appointmentMode === 'online' && (
                  <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Meeting Platform *</Label>
                        <Select 
                          value={isCustomPlatform ? 'custom' : newAppointment.meetingPlatform}
                          onValueChange={(v) => {
                            if (v === 'custom') {
                              setIsCustomPlatform(true);
                              setNewAppointment({ ...newAppointment, meetingPlatform: '' });
                            } else {
                              setIsCustomPlatform(false);
                              setCustomPlatform('');
                              setNewAppointment({ ...newAppointment, meetingPlatform: v });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="zoom">📹 Zoom</SelectItem>
                            <SelectItem value="google-meet">🎥 Google Meet</SelectItem>
                            <SelectItem value="microsoft-teams">👥 Microsoft Teams</SelectItem>
                            <SelectItem value="whatsapp">💬 WhatsApp Video</SelectItem>
                            <SelectItem value="skype">📞 Skype</SelectItem>
                            <SelectItem value="custom">✏️ Custom Platform</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {isCustomPlatform && (
                        <div className="space-y-2">
                          <Label>Custom Platform Name</Label>
                          <Input
                            value={customPlatform}
                            onChange={(e) => {
                              setCustomPlatform(e.target.value);
                              setNewAppointment({ ...newAppointment, meetingPlatform: e.target.value });
                            }}
                            placeholder="Enter platform name"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Meeting Link *</Label>
                      <Input
                        value={newAppointment.meetingLink}
                        onChange={(e) => setNewAppointment({ ...newAppointment, meetingLink: e.target.value })}
                        placeholder="https://zoom.us/j/123456789 or meeting URL"
                      />
                    </div>
                  </div>
                )}

                {/* On-Call Mode Fields */}
                {newAppointment.appointmentMode === 'on-call' && (
                  <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="space-y-2">
                      <Label>Phone Number for Call *</Label>
                      <Input
                        value={newAppointment.callNumber}
                        onChange={(e) => setNewAppointment({ ...newAppointment, callNumber: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                )}

                {/* Offline Mode Fields */}
                {newAppointment.appointmentMode === 'offline' && (
                  <div className="space-y-4 bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Location / Venue</Label>
                        <Input
                          value={newAppointment.location}
                          onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                          placeholder="Meeting room, office, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Full Address</Label>
                        <Input
                          value={newAppointment.address}
                          onChange={(e) => setNewAppointment({ ...newAppointment, address: e.target.value })}
                          placeholder="123 Main St, City, Country"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newAppointment.amount}
                      onChange={(e) => setNewAppointment({ ...newAppointment, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={newAppointment.currency}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">🇮🇳 INR (₹)</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR (€)</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP (£)</SelectItem>
                        <SelectItem value="JPY">🇯🇵 JPY (¥)</SelectItem>
                        <SelectItem value="AUD">🇦🇺 AUD (A$)</SelectItem>
                        <SelectItem value="CAD">🇨🇦 CAD (C$)</SelectItem>
                        <SelectItem value="CHF">🇨🇭 CHF</SelectItem>
                        <SelectItem value="CNY">🇨🇳 CNY (¥)</SelectItem>
                        <SelectItem value="AED">🇦🇪 AED (د.إ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={newAppointment.paymentMethod}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-600" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="upi">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-purple-600" />
                            UPI
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            Card
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select 
                      value={newAppointment.paymentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">
                          <span className="text-red-600 font-medium">Unpaid</span>
                        </SelectItem>
                        <SelectItem value="paid">
                          <span className="text-green-600 font-medium">Paid</span>
                        </SelectItem>
                        <SelectItem value="partial">
                          <span className="text-orange-600 font-medium">Partial</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Product Add-ons */}
              {products.length > 0 && (
                <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-purple-900">🛍️ Product Add-ons</span>
                    <span className="text-xs text-purple-600">(Optional)</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Add Products to Booking</Label>
                    <Select onValueChange={addProductToAppointment}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select products to add..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₹{product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs font-medium text-gray-700">Selected Products:</p>
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">₹{product.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                            >
                              <Minus size={12} />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{product.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                            >
                              <Plus size={12} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => removeProductFromAppointment(product.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
                        <span className="text-sm font-semibold text-purple-900">Products Total:</span>
                        <span className="text-sm font-bold text-purple-900">
                          ₹{selectedProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                      {newAppointment.amount && (
                        <div className="pt-2 border-t border-purple-300 flex justify-between items-center">
                          <span className="text-base font-bold text-purple-900">Grand Total:</span>
                          <span className="text-base font-bold text-purple-900">
                            ₹{calculateTotalWithProducts().toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewAppointmentOpen(false);
                  setIsCustomService(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment} className="bg-indigo-600 hover:bg-indigo-700">
                Create Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Appointment Dialog */}
        <Dialog open={editAppointmentOpen} onOpenChange={setEditAppointmentOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Edit Appointment
              </DialogTitle>
              <DialogDescription>
                Update appointment details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={newAppointment.customerName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newAppointment.email}
                    onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone and Assigned Staff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned {company?.teamMemberLabel || 'Staff'}</Label>
                  <Select 
                    value={newAppointment.assignedStaff}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, assignedStaff: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={teamMembers.length > 0 ? `Select ${company?.teamMemberLabel || 'Staff'}` : 'No staff available'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} {member.role ? `(${member.role})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No staff available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Select 
                    value={isCustomService ? 'custom' : newAppointment.serviceName} 
                    onValueChange={(v) => {
                      if (v === 'custom') {
                        setIsCustomService(true);
                        setNewAppointment({ ...newAppointment, serviceName: '' });
                      } else {
                        setIsCustomService(false);
                        setNewAppointment({ ...newAppointment, serviceName: v, customService: '' });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Demo">Demo</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="custom">✏️ Custom Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isCustomService && (
                  <div className="space-y-2">
                    <Label>Custom Service Name *</Label>
                    <Input
                      value={newAppointment.customService}
                      onChange={(e) => setNewAppointment({ ...newAppointment, customService: e.target.value })}
                      placeholder="Enter custom service name"
                    />
                  </div>
                )}
                {!isCustomService && (
                  <div className="space-y-2">
                    <Label>Appointment Status *</Label>
                    <Select 
                      value={newAppointment.appointmentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {isCustomService && (
                <div className="space-y-2">
                  <Label>Appointment Status *</Label>
                  <Select 
                    value={newAppointment.appointmentStatus}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Appointment Mode Section (Edit Dialog) */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  Appointment Mode
                </h3>
                <div className="flex gap-3 mb-4">
                  <Button
                    type="button"
                    variant={newAppointment.appointmentMode === 'offline' ? 'default' : 'outline'}
                    onClick={() => {
                      setNewAppointment({ ...newAppointment, appointmentMode: 'offline', meetingPlatform: '', meetingLink: '', callNumber: '' });
                      setIsCustomPlatform(false);
                    }}
                    className={newAppointment.appointmentMode === 'offline' ? 'bg-teal-600 hover:bg-teal-700' : 'text-teal-600 border-teal-200 hover:bg-teal-50'}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Offline (In-Person)
                  </Button>
                  <Button
                    type="button"
                    variant={newAppointment.appointmentMode === 'online' ? 'default' : 'outline'}
                    onClick={() => {
                      setNewAppointment({ ...newAppointment, appointmentMode: 'online', callNumber: '' });
                    }}
                    className={newAppointment.appointmentMode === 'online' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-600 border-purple-200 hover:bg-purple-50'}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Online (Virtual)
                  </Button>
                  <Button
                    type="button"
                    variant={newAppointment.appointmentMode === 'on-call' ? 'default' : 'outline'}
                    onClick={() => {
                      setNewAppointment({ ...newAppointment, appointmentMode: 'on-call', meetingPlatform: '', meetingLink: '' });
                      setIsCustomPlatform(false);
                    }}
                    className={newAppointment.appointmentMode === 'on-call' ? 'bg-orange-600 hover:bg-orange-700' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    On-Call
                  </Button>
                </div>

                {/* Online Mode Fields (Edit) */}
                {newAppointment.appointmentMode === 'online' && (
                  <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Meeting Platform *</Label>
                        <Select 
                          value={isCustomPlatform ? 'custom' : newAppointment.meetingPlatform}
                          onValueChange={(v) => {
                            if (v === 'custom') {
                              setIsCustomPlatform(true);
                              setNewAppointment({ ...newAppointment, meetingPlatform: '' });
                            } else {
                              setIsCustomPlatform(false);
                              setCustomPlatform('');
                              setNewAppointment({ ...newAppointment, meetingPlatform: v });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="zoom">📹 Zoom</SelectItem>
                            <SelectItem value="google-meet">🎥 Google Meet</SelectItem>
                            <SelectItem value="microsoft-teams">👥 Microsoft Teams</SelectItem>
                            <SelectItem value="whatsapp">💬 WhatsApp Video</SelectItem>
                            <SelectItem value="skype">📞 Skype</SelectItem>
                            <SelectItem value="custom">✏️ Custom Platform</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {isCustomPlatform && (
                        <div className="space-y-2">
                          <Label>Custom Platform Name</Label>
                          <Input
                            value={customPlatform}
                            onChange={(e) => {
                              setCustomPlatform(e.target.value);
                              setNewAppointment({ ...newAppointment, meetingPlatform: e.target.value });
                            }}
                            placeholder="Enter platform name"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Meeting Link *</Label>
                      <Input
                        value={newAppointment.meetingLink}
                        onChange={(e) => setNewAppointment({ ...newAppointment, meetingLink: e.target.value })}
                        placeholder="https://zoom.us/j/123456789 or meeting URL"
                      />
                    </div>
                  </div>
                )}

                {/* On-Call Mode Fields (Edit) */}
                {newAppointment.appointmentMode === 'on-call' && (
                  <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="space-y-2">
                      <Label>Phone Number for Call *</Label>
                      <Input
                        value={newAppointment.callNumber}
                        onChange={(e) => setNewAppointment({ ...newAppointment, callNumber: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                )}

                {/* Offline Mode Fields (Edit) */}
                {newAppointment.appointmentMode === 'offline' && (
                  <div className="space-y-4 bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Location / Venue</Label>
                        <Input
                          value={newAppointment.location}
                          onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                          placeholder="Meeting room, office, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Full Address</Label>
                        <Input
                          value={newAppointment.address}
                          onChange={(e) => setNewAppointment({ ...newAppointment, address: e.target.value })}
                          placeholder="123 Main St, City, Country"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Payment Details (Edit)
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newAppointment.amount}
                      onChange={(e) => setNewAppointment({ ...newAppointment, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={newAppointment.currency}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">🇮🇳 INR (₹)</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR (€)</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP (£)</SelectItem>
                        <SelectItem value="JPY">🇯🇵 JPY (¥)</SelectItem>
                        <SelectItem value="AUD">🇦🇺 AUD (A$)</SelectItem>
                        <SelectItem value="CAD">🇨🇦 CAD (C$)</SelectItem>
                        <SelectItem value="CHF">🇨🇭 CHF</SelectItem>
                        <SelectItem value="CNY">🇨🇳 CNY (¥)</SelectItem>
                        <SelectItem value="AED">🇦🇪 AED (د.إ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={newAppointment.paymentMethod}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-600" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="upi">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-purple-600" />
                            UPI
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            Card
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select 
                      value={newAppointment.paymentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">
                          <span className="text-red-600 font-medium">Unpaid</span>
                        </SelectItem>
                        <SelectItem value="paid">
                          <span className="text-green-600 font-medium">Paid</span>
                        </SelectItem>
                        <SelectItem value="partial">
                          <span className="text-orange-600 font-medium">Partial</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditAppointmentOpen(false);
                  setSelectedAppointment(null);
                  setIsCustomService(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditAppointment} className="bg-blue-600 hover:bg-blue-700">
                Update Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Appointment
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-gray-900">{selectedAppointment.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedAppointment.serviceName}</p>
                  <p className="text-sm text-gray-500">{selectedAppointment.date} at {selectedAppointment.time}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteAppointment} 
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-indigo-600">
                <Eye className="h-5 w-5" />
                Appointment Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this appointment
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-4"
              >
                {/* Customer Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Name</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedAppointment.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {selectedAppointment.email}
                        </p>
                      </div>
                      {selectedAppointment.phone && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="text-sm text-gray-700 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {selectedAppointment.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Appointment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Service</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedAppointment.serviceName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Mode</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getModeBadgeColor(selectedAppointment.appointmentMode || 'offline')}`}>
                          {getModeIcon(selectedAppointment.appointmentMode || 'offline')}
                          {(selectedAppointment.appointmentMode || 'offline').charAt(0).toUpperCase() + (selectedAppointment.appointmentMode || 'offline').slice(1).replace('-', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedAppointment.appointmentStatus === 'confirmed' 
                            ? 'bg-blue-100 text-blue-700' 
                            : selectedAppointment.appointmentStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : selectedAppointment.appointmentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedAppointment.appointmentStatus === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus === 'pending' && <Clock className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus === 'cancelled' && <XCircle className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus?.charAt(0).toUpperCase() + selectedAppointment.appointmentStatus?.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {selectedAppointment.date}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {selectedAppointment.time}
                        </p>
                      </div>
                      {selectedAppointment.assignedStaff && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Assigned {company?.teamMemberLabel || 'Staff'}</p>
                          <p className="text-sm font-medium text-gray-900">
                            {teamMembers.find(m => m.id === selectedAppointment.assignedStaff)?.name || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting/Call/Location Details */}
                  {(selectedAppointment.appointmentMode === 'online' && selectedAppointment.meetingLink) && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-600" />
                        Online Meeting Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Platform</p>
                          <p className="text-sm font-medium text-gray-900 capitalize flex items-center gap-2">
                            <span>{getPlatformIcon(selectedAppointment.meetingPlatform || 'custom')}</span>
                            {selectedAppointment.meetingPlatform?.replace('-', ' ') || 'Custom Platform'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Meeting Link</p>
                          <a 
                            href={selectedAppointment.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                          >
                            <Link2 className="h-3 w-3" />
                            {selectedAppointment.meetingLink}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedAppointment.appointmentMode === 'on-call' && selectedAppointment.callNumber) && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-5 border border-orange-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-orange-600" />
                        Call Details
                      </h3>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                        <a 
                          href={`tel:${selectedAppointment.callNumber}`} 
                          className="text-sm font-medium text-orange-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {selectedAppointment.callNumber}
                        </a>
                      </div>
                    </div>
                  )}

                  {(selectedAppointment.appointmentMode === 'offline' && (selectedAppointment.location || selectedAppointment.address)) && (
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-5 border border-teal-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-teal-600" />
                        Location Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedAppointment.location && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Venue</p>
                            <p className="text-sm font-medium text-gray-900">{selectedAppointment.location}</p>
                          </div>
                        )}
                        {selectedAppointment.address && (
                          <div className={selectedAppointment.location ? '' : 'col-span-2'}>
                            <p className="text-xs text-gray-500 mb-1">Address</p>
                            <p className="text-sm text-gray-700 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {selectedAppointment.address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Information */}
                  {selectedAppointment.amount && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border border-green-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Payment Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <p className="text-lg font-bold text-green-700">
                            {getCurrencySymbol(selectedAppointment.currency)}{selectedAppointment.amount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Currency</p>
                          <p className="text-sm font-medium text-gray-900">{selectedAppointment.currency || 'INR'}</p>
                        </div>
                        {selectedAppointment.paymentMethod && selectedAppointment.paymentMethod !== 'none' && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="text-sm text-gray-700 flex items-center gap-1.5">
                              {selectedAppointment.paymentMethod === 'cash' && <Banknote className="h-4 w-4 text-green-600" />}
                              {selectedAppointment.paymentMethod === 'upi' && <Smartphone className="h-4 w-4 text-purple-600" />}
                              {selectedAppointment.paymentMethod === 'card' && <CreditCard className="h-4 w-4 text-blue-600" />}
                              {selectedAppointment.paymentMethod.toUpperCase()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                            selectedAppointment.paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : selectedAppointment.paymentStatus === 'partial'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedAppointment.paymentStatus?.charAt(0).toUpperCase() + selectedAppointment.paymentStatus?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedAppointment.notes && (
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setViewDetailsOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setViewDetailsOpen(false);
                  if (selectedAppointment) {
                    openEditDialog(selectedAppointment);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reports Dialog */}
        <Dialog open={reportsOpen} onOpenChange={setReportsOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Appointments Reports & Analytics
              </DialogTitle>
              <DialogDescription className="flex items-center justify-between">
                <span>Comprehensive overview of your appointment statistics</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {reportPeriod === 'today' ? '📅 Today' :
                     reportPeriod === 'week' ? '📆 Last 7 Days' :
                     reportPeriod === 'month' ? '🗓️ Last 30 Days' :
                     reportPeriod === 'year' ? '📊 Last 12 Months' :
                     `📌 ${customReportDates.from || 'Start'} - ${customReportDates.to || 'End'}`}
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            {/* Custom Date Range Picker */}
            {reportPeriod === 'custom' && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 mb-4">
                <h4 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Custom Date Range
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-indigo-600">From Date</Label>
                    <Input
                      type="date"
                      value={customReportDates.from}
                      onChange={(e) => setCustomReportDates({ ...customReportDates, from: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-indigo-600">To Date</Label>
                    <Input
                      type="date"
                      value={customReportDates.to}
                      onChange={(e) => setCustomReportDates({ ...customReportDates, to: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {(() => {
              const report = generateAppointmentReport();
              return (
                <div className="space-y-6 py-4">
                  {/* Quick Stats Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 opacity-80" />
                        <span className="text-sm opacity-80">Total</span>
                      </div>
                      <p className="text-3xl font-bold">{report.summary.total}</p>
                      <p className="text-xs opacity-70 mt-1">Appointments</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 opacity-80" />
                        <span className="text-sm opacity-80">Revenue</span>
                      </div>
                      <p className="text-3xl font-bold">₹{report.summary.totalRevenue.toLocaleString('en-IN')}</p>
                      <p className="text-xs opacity-70 mt-1">{report.summary.paymentRate}% collected</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 opacity-80" />
                        <span className="text-sm opacity-80">Completed</span>
                      </div>
                      <p className="text-3xl font-bold">{report.summary.completed}</p>
                      <p className="text-xs opacity-70 mt-1">{report.summary.completionRate}% rate</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 opacity-80" />
                        <span className="text-sm opacity-80">Avg Value</span>
                      </div>
                      <p className="text-3xl font-bold">₹{Math.round(report.summary.avgRevenuePerAppointment).toLocaleString('en-IN')}</p>
                      <p className="text-xs opacity-70 mt-1">Per Appointment</p>
                    </motion.div>
                  </div>

                  {/* Mode Distribution */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Video className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">Online</span>
                        </div>
                        <span className="text-2xl font-bold text-purple-600">{report.summary.online}</span>
                      </div>
                      <div className="bg-white rounded-full h-2 mt-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${report.summary.total > 0 ? (report.summary.online / report.summary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-teal-600" />
                          <span className="font-medium text-gray-900">Offline</span>
                        </div>
                        <span className="text-2xl font-bold text-teal-600">{report.summary.offline}</span>
                      </div>
                      <div className="bg-white rounded-full h-2 mt-2">
                        <div 
                          className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${report.summary.total > 0 ? (report.summary.offline / report.summary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-5 w-5 text-orange-600" />
                          <span className="font-medium text-gray-900">On-Call</span>
                        </div>
                        <span className="text-2xl font-bold text-orange-600">{report.summary.onCall}</span>
                      </div>
                      <div className="bg-white rounded-full h-2 mt-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${report.summary.total > 0 ? (report.summary.onCall / report.summary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status & Payment Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Status Distribution */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-indigo-600" />
                        Status Distribution
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                          <div className="w-10 h-10 mx-auto mb-1 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Clock className="h-5 w-5 text-yellow-600" />
                          </div>
                          <p className="text-xl font-bold text-yellow-600">{report.summary.pending}</p>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                          <div className="w-10 h-10 mx-auto mb-1 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <p className="text-xl font-bold text-blue-600">{report.summary.confirmed}</p>
                          <p className="text-xs text-gray-500">Confirmed</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                          <div className="w-10 h-10 mx-auto mb-1 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-xl font-bold text-green-600">{report.summary.completed}</p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                          <div className="w-10 h-10 mx-auto mb-1 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <p className="text-xl font-bold text-red-600">{report.summary.cancelled}</p>
                          <p className="text-xs text-gray-500">Cancelled</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Overview */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Payment Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                          <span className="text-sm text-gray-600">Paid Revenue</span>
                          <span className="text-lg font-bold text-green-600">₹{report.summary.paidRevenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                          <span className="text-sm text-gray-600">Unpaid Amount</span>
                          <span className="text-lg font-bold text-orange-600">₹{report.summary.unpaidRevenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Collection Rate</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${report.summary.paymentRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-green-600">{report.summary.paymentRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Services & Customers */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Top Services */}
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                        Top Services
                      </h3>
                      <div className="space-y-2">
                        {report.services.slice(0, 5).map((service, index) => (
                          <div key={service.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-indigo-50 text-indigo-600'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-700">{service.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">₹{service.revenue.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-gray-500">{service.count} bookings</p>
                            </div>
                          </div>
                        ))}
                        {report.services.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                        )}
                      </div>
                    </div>

                    {/* Top Customers */}
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-600" />
                        Top Customers
                      </h3>
                      <div className="space-y-2">
                        {report.customers.slice(0, 5).map((customer, index) => (
                          <div key={customer.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-indigo-50 text-indigo-600'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-700">{customer.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">₹{customer.revenue.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-gray-500">{customer.count} visits</p>
                            </div>
                          </div>
                        ))}
                        {report.customers.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Staff Performance */}
                  {report.staff.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-600" />
                        Staff Performance
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {report.staff.slice(0, 6).map((staff, index) => (
                          <div key={staff.name} className="bg-white rounded-lg p-3 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700 truncate">{staff.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{staff.count} appointments</span>
                              <span className="text-sm font-bold text-green-600">₹{staff.revenue.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <DialogFooter className="flex items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={downloadAppointmentReportCSV} className="gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAppointmentReportExcel} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAppointmentReportPDF} className="gap-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  PDF
                </Button>
              </div>
              <Button variant="outline" onClick={() => setReportsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
