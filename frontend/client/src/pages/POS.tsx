import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Calendar, TrendingUp, DollarSign, BarChart3, CalendarDays, ChevronDown, Clock, User, Play, Square, PieChart, Users } from 'lucide-react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Download, Printer, Eye, FileSpreadsheet, FileText, Receipt, FileCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF, 
  printTransactions,
  printSingleTransaction,
  type Transaction as POSTransaction
} from '@/lib/pos-export-utils';
import { POSInvoice } from '@/components/POSInvoice';
import ReactDOM from 'react-dom/client';

// Shift interface
interface Shift {
  id: string;
  staffName: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed';
  openingBalance: number;
  closingBalance: number | null;
  totalSales: number;
  transactionCount: number;
  date: string;
}

type Product = {
  id: string;
  name: string;
  price: number; // in cents
  description?: string;
  category?: string; // domain like Beauty, Spa, Wellness
};

type Transaction = POSTransaction;

// Sample services (prices in cents). These represent service offerings like on the booking system.
const SAMPLE_PRODUCTS: Product[] = [
  { id: 's1', name: 'Beard Design Session', price: 401500, description: 'Professional beard styling (30 min)', category: 'Beauty' },
  { id: 's2', name: 'Facial Treatment', price: 79900, description: '60 min facial cleansing and mask', category: 'Spa' },
  { id: 's3', name: 'Coffee Tasting Session', price: 39900, description: 'Guided coffee tasting', category: 'Wellness' },
  { id: 's4', name: 'Haircut', price: 59900, description: 'Standard haircut', category: 'Beauty' },
  { id: 's5', name: 'Massage (30min)', price: 129900, description: 'Relaxing massage', category: 'Spa' },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'POS-20251107-001',
    customer: { name: 'Vaishak', email: 'vaishak@example.com' },
    items: [{ productId: 's1', qty: 1, price: 401500 }],
    date: '2025-11-06',
    amount: 401500,
    status: 'Completed',
    staff: 'Gujjh',
    openBalance: 0,
    totalReturn: 0,
    balanceAmount: 401500,
    orderValue: 401500,
    currency: '₹',
  },
  {
    id: 'POS-20251107-002',
    customer: { name: 'Alice', email: 'alice@example.com' },
    items: [{ productId: 's3', qty: 2, price: 39900 }],
    date: '2025-11-05',
    amount: 79800,
    status: 'Completed',
    staff: 'John',
    openBalance: 0,
    totalReturn: 0,
    balanceAmount: 79800,
    orderValue: 79800,
    currency: '₹',
  },
];

const SAMPLE_APPOINTMENTS = [
  { id: 'BOOK-1001', label: 'Session - Beard Design (11/06/2025)' },
  { id: 'BOOK-1002', label: 'Session - Coffee Tasting (11/05/2025)' },
];

export default function POSPage() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    // Load transactions from localStorage on mount
    const saved = localStorage.getItem('pos_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return SAMPLE_TRANSACTIONS;
      }
    }
    return SAMPLE_TRANSACTIONS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<string>(''); // rupees string
  const [newServiceCategory, setNewServiceCategory] = useState<string>('Other');
  const [serviceQuery, setServiceQuery] = useState('');

  // POS register state (toggleable)
  const [showRegister, setShowRegister] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [teamMember, setTeamMember] = useState<string>('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const printableRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Shift management state
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('pos_shifts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [activeShift, setActiveShift] = useState<Shift | null>(() => {
    const saved = localStorage.getItem('pos_active_shift');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [shiftStaffName, setShiftStaffName] = useState('');
  const [shiftOpeningBalance, setShiftOpeningBalance] = useState<string>('0');
  const [isEndShiftDialogOpen, setIsEndShiftDialogOpen] = useState(false);
  const [shiftClosingBalance, setShiftClosingBalance] = useState<string>('0');
  const [isShiftHistoryOpen, setIsShiftHistoryOpen] = useState(false);

  // Reports state
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [posReportPeriod, setPosReportPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customPosReportDates, setCustomPosReportDates] = useState({ from: '', to: '' });
  const [shiftFilter, setShiftFilter] = useState<string>('all');

  // Team members for staff dropdown
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false);

  // Load team members
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = () => {
    try {
      const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
      const members: any[] = [];
      
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

  // Filter staff suggestions based on input
  const filteredStaffSuggestions = useMemo(() => {
    if (!shiftStaffName.trim()) return teamMembers;
    const query = shiftStaffName.toLowerCase();
    return teamMembers.filter(m => 
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query))
    );
  }, [teamMembers, shiftStaffName]);

  // Load products and services from localStorage
  useEffect(() => {
    loadProductsAndServices();
    
    // Listen for updates
    const handleProductsUpdate = () => loadProductsAndServices();
    const handleServicesUpdate = () => loadProductsAndServices();
    
    window.addEventListener('products-updated', handleProductsUpdate);
    window.addEventListener('services-updated', handleServicesUpdate);
    
    return () => {
      window.removeEventListener('products-updated', handleProductsUpdate);
      window.removeEventListener('services-updated', handleServicesUpdate);
    };
  }, []);

  const loadProductsAndServices = () => {
    try {
      const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
      const allItems: Product[] = [];

      // Load products from Products page
      const productsKey = `zervos_products_${currentWorkspace}`;
      const productsRaw = localStorage.getItem(productsKey);
      if (productsRaw) {
        const productsList = JSON.parse(productsRaw);
        if (Array.isArray(productsList)) {
          productsList.forEach((prod: any) => {
            if (prod.isEnabled) {
              allItems.push({
                id: prod.id,
                name: prod.name,
                price: Math.round(parseFloat(prod.price) * 100), // Convert to cents
                description: prod.description,
                category: prod.category,
              });
            }
          });
        }
      }

      // Load services from Services page
      const servicesKey = `zervos_services_${currentWorkspace}`;
      const servicesRaw = localStorage.getItem(servicesKey);
      if (servicesRaw) {
        const servicesList = JSON.parse(servicesRaw);
        if (Array.isArray(servicesList)) {
          servicesList.forEach((svc: any) => {
            if (svc.isEnabled) {
              allItems.push({
                id: svc.id,
                name: svc.name,
                price: Math.round(parseFloat(svc.price) * 100), // Convert to cents
                description: `${svc.description} (${svc.duration})`,
                category: svc.category,
              });
            }
          });
        }
      }

      // Fallback to sample data if nothing loaded
      if (allItems.length === 0) {
        setProducts(SAMPLE_PRODUCTS);
      } else {
        setProducts(allItems);
      }
    } catch (error) {
      console.error('Error loading products and services:', error);
      setProducts(SAMPLE_PRODUCTS);
    }
  };

  // Listen for storage changes (when new transaction is added from POS Register)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('pos_transactions');
      if (saved) {
        try {
          setTransactions(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing transactions:', e);
        }
      }
    };

    // Reload transactions when component mounts or regains focus
    handleStorageChange();

    // Listen for custom event when returning from POS Register
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.customer.name.toLowerCase().includes(q) ||
        (t.customer.email || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const handleViewTransaction = (tx: Transaction) => {
    setSelectedTx(tx);
    setViewOpen(true);
  };

  const handleRefund = (tx: Transaction) => {
    if (!window.confirm(`Refund ${tx.id}?`)) return;
    // simple in-memory refund: mark refunded and set totalReturn
    setTransactions((t) => t.map(item => item.id === tx.id ? { ...item, status: 'Refunded', totalReturn: (item.totalReturn || 0) + item.amount, balanceAmount: 0 } : item));
    toast({ title: 'Refund processed', description: `${tx.id} marked refunded` });
  };

  // Stats
  const stats = useMemo(() => {
    const total = transactions.length;
    const completed = transactions.filter((t) => t.status === 'Completed').length;
    const pending = transactions.filter((t) => t.status === 'Pending').length;
    const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
    return { total, completed, pending, totalRevenue };
  }, [transactions]);

  // Shift management functions
  const startShift = () => {
    if (!shiftStaffName.trim()) {
      toast({ title: 'Error', description: 'Please enter staff name', variant: 'destructive' });
      return;
    }
    const newShift: Shift = {
      id: `SHIFT-${Date.now()}`,
      staffName: shiftStaffName.trim(),
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      openingBalance: parseFloat(shiftOpeningBalance) * 100 || 0,
      closingBalance: null,
      totalSales: 0,
      transactionCount: 0,
      date: new Date().toISOString().split('T')[0],
    };
    setActiveShift(newShift);
    localStorage.setItem('pos_active_shift', JSON.stringify(newShift));
    setIsShiftDialogOpen(false);
    setShiftStaffName('');
    setShiftOpeningBalance('0');
    toast({ title: '✅ Shift Started', description: `${newShift.staffName}'s shift has begun` });
  };

  const endShift = () => {
    if (!activeShift) return;
    
    const shiftTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const shiftStart = new Date(activeShift.startTime);
      return txDate >= shiftStart && tx.staff === activeShift.staffName;
    });
    
    const totalSales = shiftTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    const completedShift: Shift = {
      ...activeShift,
      endTime: new Date().toISOString(),
      status: 'completed',
      closingBalance: parseFloat(shiftClosingBalance) * 100 || 0,
      totalSales,
      transactionCount: shiftTransactions.length,
    };
    
    const updatedShifts = [completedShift, ...shifts];
    setShifts(updatedShifts);
    localStorage.setItem('pos_shifts', JSON.stringify(updatedShifts));
    
    setActiveShift(null);
    localStorage.removeItem('pos_active_shift');
    
    setIsEndShiftDialogOpen(false);
    setShiftClosingBalance('0');
    toast({ 
      title: '✅ Shift Ended', 
      description: `${completedShift.staffName}'s shift completed. Sales: ₹${(totalSales/100).toFixed(2)}` 
    });
  };

  // Get shift-filtered transactions
  const getShiftTransactions = (shift: Shift) => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const shiftStart = new Date(shift.startTime);
      const shiftEnd = shift.endTime ? new Date(shift.endTime) : new Date();
      return txDate >= shiftStart && txDate <= shiftEnd && tx.staff === shift.staffName;
    });
  };

  // Report generation
  const getFilteredTransactionsByPeriod = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (posReportPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customPosReportDates.from ? new Date(customPosReportDates.from) : new Date(0);
        endDate = customPosReportDates.to ? new Date(customPosReportDates.to) : now;
        break;
      default:
        startDate = new Date(0);
    }

    let filtered = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });

    // Apply shift filter
    if (shiftFilter !== 'all') {
      const selectedShift = shifts.find(s => s.id === shiftFilter);
      if (selectedShift) {
        filtered = filtered.filter(tx => tx.staff === selectedShift.staffName);
      }
    }

    return filtered;
  };

  const generatePOSReport = () => {
    const filtered = getFilteredTransactionsByPeriod();
    
    const periodLabel = posReportPeriod === 'today' ? "Today's" :
                       posReportPeriod === 'week' ? 'Weekly' :
                       posReportPeriod === 'month' ? 'Monthly' :
                       posReportPeriod === 'year' ? 'Yearly' : 'Custom Range';
    
    const completedTx = filtered.filter(t => t.status === 'Completed');
    const pendingTx = filtered.filter(t => t.status === 'Pending');
    const refundedTx = filtered.filter(t => t.status === 'Refunded');
    
    const totalRevenue = completedTx.reduce((sum, t) => sum + t.amount, 0);
    const totalRefunds = refundedTx.reduce((sum, t) => sum + (t.totalReturn || 0), 0);
    const avgTransactionValue = completedTx.length > 0 ? totalRevenue / completedTx.length : 0;
    
    // Staff performance
    const staffStats: Record<string, { sales: number; count: number; refunds: number }> = {};
    filtered.forEach(tx => {
      const staff = tx.staff || 'Unassigned';
      if (!staffStats[staff]) {
        staffStats[staff] = { sales: 0, count: 0, refunds: 0 };
      }
      if (tx.status === 'Completed') {
        staffStats[staff].sales += tx.amount;
        staffStats[staff].count += 1;
      }
      if (tx.status === 'Refunded') {
        staffStats[staff].refunds += tx.totalReturn || 0;
      }
    });
    
    const staffPerformance = Object.entries(staffStats).map(([name, data]) => ({
      name,
      sales: data.sales,
      count: data.count,
      refunds: data.refunds,
      avgTicket: data.count > 0 ? data.sales / data.count : 0,
    })).sort((a, b) => b.sales - a.sales);

    // Hourly breakdown (for today)
    const hourlyBreakdown: Record<number, { sales: number; count: number }> = {};
    if (posReportPeriod === 'today') {
      for (let i = 0; i < 24; i++) {
        hourlyBreakdown[i] = { sales: 0, count: 0 };
      }
      completedTx.forEach(tx => {
        const hour = new Date(tx.date).getHours();
        hourlyBreakdown[hour].sales += tx.amount;
        hourlyBreakdown[hour].count += 1;
      });
    }

    // Payment method breakdown
    const paymentMethods: Record<string, { amount: number; count: number }> = {};
    completedTx.forEach(tx => {
      const method = tx.paymentMethod || 'Cash';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { amount: 0, count: 0 };
      }
      paymentMethods[method].amount += tx.amount;
      paymentMethods[method].count += 1;
    });

    // Shift-wise breakdown
    const shiftBreakdown = shifts
      .filter(s => {
        const shiftDate = new Date(s.date);
        const now = new Date();
        let startDate: Date;
        switch (posReportPeriod) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }
        return shiftDate >= startDate;
      })
      .map(s => ({
        id: s.id,
        staffName: s.staffName,
        date: s.date,
        startTime: new Date(s.startTime).toLocaleTimeString(),
        endTime: s.endTime ? new Date(s.endTime).toLocaleTimeString() : 'Active',
        totalSales: s.totalSales,
        transactionCount: s.transactionCount,
        status: s.status,
      }));

    return {
      period: periodLabel,
      summary: {
        totalTransactions: filtered.length,
        completedTransactions: completedTx.length,
        pendingTransactions: pendingTx.length,
        refundedTransactions: refundedTx.length,
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        avgTransactionValue,
      },
      staffPerformance,
      hourlyBreakdown: Object.entries(hourlyBreakdown).map(([hour, data]) => ({
        hour: parseInt(hour),
        ...data,
      })),
      paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        ...data,
      })),
      shiftBreakdown,
      allTransactions: filtered,
    };
  };

  // Download report functions
  const downloadPOSReportCSV = () => {
    const report = generatePOSReport();
    const date = new Date().toLocaleDateString('en-IN');
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';

    let csvContent = '';
    csvContent += `${businessName} - POS ${report.period} Report\n`;
    csvContent += `Generated on: ${date}\n\n`;
    
    csvContent += `SUMMARY\n`;
    csvContent += `Total Transactions,${report.summary.totalTransactions}\n`;
    csvContent += `Completed,${report.summary.completedTransactions}\n`;
    csvContent += `Pending,${report.summary.pendingTransactions}\n`;
    csvContent += `Refunded,${report.summary.refundedTransactions}\n`;
    csvContent += `Total Revenue,₹${(report.summary.totalRevenue/100).toFixed(2)}\n`;
    csvContent += `Total Refunds,₹${(report.summary.totalRefunds/100).toFixed(2)}\n`;
    csvContent += `Net Revenue,₹${(report.summary.netRevenue/100).toFixed(2)}\n`;
    csvContent += `Avg Transaction,₹${(report.summary.avgTransactionValue/100).toFixed(2)}\n\n`;

    csvContent += `STAFF PERFORMANCE\n`;
    csvContent += `Staff Name,Sales,Transactions,Refunds,Avg Ticket\n`;
    report.staffPerformance.forEach(s => {
      csvContent += `${s.name},₹${(s.sales/100).toFixed(2)},${s.count},₹${(s.refunds/100).toFixed(2)},₹${(s.avgTicket/100).toFixed(2)}\n`;
    });
    csvContent += '\n';

    csvContent += `SHIFT BREAKDOWN\n`;
    csvContent += `Staff,Date,Start Time,End Time,Sales,Transactions,Status\n`;
    report.shiftBreakdown.forEach(s => {
      csvContent += `${s.staffName},${s.date},${s.startTime},${s.endTime},₹${(s.totalSales/100).toFixed(2)},${s.transactionCount},${s.status}\n`;
    });
    csvContent += '\n';

    csvContent += `PAYMENT METHODS\n`;
    csvContent += `Method,Amount,Count\n`;
    report.paymentMethods.forEach(p => {
      csvContent += `${p.method},₹${(p.amount/100).toFixed(2)},${p.count}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${businessName}_POS_Report_${report.period}_${date}.csv`;
    link.click();
    toast({ title: '✅ CSV Downloaded', description: 'POS report saved successfully' });
  };

  const downloadPOSReportExcel = () => {
    const report = generatePOSReport();
    const date = new Date().toLocaleDateString('en-IN');
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';

    let excelContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head><body>`;
    
    // Summary sheet
    excelContent += `<table><tr><td colspan="2" style="font-size:18px;font-weight:bold">${businessName} - POS ${report.period} Report</td></tr>`;
    excelContent += `<tr><td colspan="2">Generated: ${date}</td></tr><tr></tr>`;
    excelContent += `<tr><td style="font-weight:bold">Metric</td><td style="font-weight:bold">Value</td></tr>`;
    excelContent += `<tr><td>Total Transactions</td><td>${report.summary.totalTransactions}</td></tr>`;
    excelContent += `<tr><td>Completed</td><td>${report.summary.completedTransactions}</td></tr>`;
    excelContent += `<tr><td>Pending</td><td>${report.summary.pendingTransactions}</td></tr>`;
    excelContent += `<tr><td>Refunded</td><td>${report.summary.refundedTransactions}</td></tr>`;
    excelContent += `<tr><td>Total Revenue</td><td>₹${(report.summary.totalRevenue/100).toFixed(2)}</td></tr>`;
    excelContent += `<tr><td>Net Revenue</td><td>₹${(report.summary.netRevenue/100).toFixed(2)}</td></tr>`;
    excelContent += `</table>`;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${businessName}_POS_Report_${report.period}_${date}.xls`;
    link.click();
    toast({ title: '✅ Excel Downloaded', description: 'POS report saved successfully' });
  };

  const downloadPOSReportPDF = () => {
    const report = generatePOSReport();
    const date = new Date().toLocaleDateString('en-IN');
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';

    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text(businessName, 20, y);
    y += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`POS ${report.period} Report`, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${date}`, 20, y);
    y += 15;

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${report.summary.totalTransactions}`, 25, y); y += 6;
    doc.text(`Completed: ${report.summary.completedTransactions}`, 25, y); y += 6;
    doc.text(`Total Revenue: ₹${(report.summary.totalRevenue/100).toFixed(2)}`, 25, y); y += 6;
    doc.text(`Net Revenue: ₹${(report.summary.netRevenue/100).toFixed(2)}`, 25, y); y += 6;
    doc.text(`Avg Transaction: ₹${(report.summary.avgTransactionValue/100).toFixed(2)}`, 25, y);
    y += 15;

    // Staff Performance
    if (report.staffPerformance.length > 0) {
      doc.setFontSize(14);
      doc.text('Staff Performance', 20, y);
      y += 8;
      doc.setFontSize(10);
      report.staffPerformance.slice(0, 10).forEach(s => {
        doc.text(`${s.name}: ₹${(s.sales/100).toFixed(2)} (${s.count} sales)`, 25, y);
        y += 6;
      });
      y += 10;
    }

    // Shift Breakdown
    if (report.shiftBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.text('Shift Breakdown', 20, y);
      y += 8;
      doc.setFontSize(10);
      report.shiftBreakdown.slice(0, 8).forEach(s => {
        doc.text(`${s.staffName} (${s.date}): ₹${(s.totalSales/100).toFixed(2)} - ${s.transactionCount} txns`, 25, y);
        y += 6;
      });
    }

    doc.save(`${businessName}_POS_Report_${report.period}_${date}.pdf`);
    toast({ title: '✅ PDF Downloaded', description: 'POS report saved successfully' });
  };

  // Cart helpers (register)
  const addToCart = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const changeQty = (id: string, delta: number) => {
    setCart((c) => {
      const next = (c[id] || 0) + delta;
      if (next <= 0) {
        const copy = { ...c };
        delete copy[id];
        return copy;
      }
      return { ...c, [id]: next };
    });
  };
  const removeFromCart = (id: string) => setCart((c) => {
    const copy = { ...c };
    delete copy[id];
    return copy;
  });

  const cartItems = useMemo(() => Object.entries(cart).map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty })), [cart, products]);
  const subtotal = cartItems.reduce((s, it) => s + it.product.price * it.qty, 0);
  const format = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  // Derived lists
  const domains = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredServices = useMemo(() => {
    const q = queryOrEmpty(serviceQuery).toLowerCase();
    return products.filter(p => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      const matchesDomain = domainFilter === 'all' || (p.category || '').toLowerCase() === domainFilter.toLowerCase();
      return matchesQuery && matchesDomain;
    });
  }, [products, serviceQuery, domainFilter]);

  // Helper for safe query
  function queryOrEmpty(q: string | null | undefined) { return (q || '').toString(); }

  const computeTotalWithTaxAndDiscount = (base: number) => {
    const discount = Math.round((base * discountPercent) / 100);
    const taxed = Math.round(((base - discount) * (100 + taxPercent)) / 100);
    return { discount, taxed, total: taxed };
  };

  const addCustomService = (addToCartAfter = false) => {
    if (!newServiceName || !newServicePrice) {
      toast({ title: 'Invalid service', description: 'Please provide name and price' });
      return;
    }
    // parse rupees to cents
    const rupees = Number(newServicePrice);
    if (isNaN(rupees)) {
      toast({ title: 'Invalid price', description: 'Enter a valid number' });
      return;
    }
    const priceCents = Math.round(rupees * 100);
    const newService: Product = {
      id: 'svc-' + Date.now(),
      name: newServiceName,
      price: priceCents,
      description: `Custom service (${newServiceCategory})`,
      category: newServiceCategory,
    };
    setProducts((s) => [newService, ...s]);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceCategory('Other');
    setShowCustomForm(false);
    toast({ title: 'Service added', description: `${newService.name} added to services` });
    if (addToCartAfter) {
      // add newly created service to cart
      setCart((c) => ({ ...c, [newService.id]: 1 }));
    }
  };

  const handleCompleteSale = () => {
    // create a transaction from cart
    const id = `POS-${Date.now()}`;
    const amount = subtotal;
    const newTx: Transaction = {
      id,
      customer: { name: 'Walk-in Customer' },
      items: cartItems.map((it) => ({ productId: it.product.id, qty: it.qty, price: it.product.price })),
      date: new Date().toISOString().slice(0, 10),
      amount,
      status: 'Completed',
      staff: teamMember || 'Not specified',
      openBalance: 0,
      totalReturn: 0,
      balanceAmount: amount,
      orderValue: amount,
      currency: '₹',
    };
    
    // Save to localStorage
    const updatedTransactions = [newTx, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem('pos_transactions', JSON.stringify(updatedTransactions));
    
    // Reset form
    setCart({});
    setTeamMember('');
    setShowRegister(false);
    toast({ title: 'Sale recorded', description: `${format(amount)} recorded${selectedBooking ? ' (linked to ' + selectedBooking + ')' : ''}` });
    // open receipt preview so user can print/export
    setReceiptOpen(true);
  };

  // Export handlers
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: 'No Data', description: 'No transactions to export', variant: 'destructive' });
      return;
    }
    try {
      exportToCSV(filteredTransactions, `pos-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      toast({ 
        title: '✅ CSV Downloaded', 
        description: `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} exported successfully` 
      });
      setExportOpen(false);
    } catch (error) {
      toast({ title: 'Export Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: 'No Data', description: 'No transactions to export', variant: 'destructive' });
      return;
    }
    try {
      exportToExcel(filteredTransactions, `pos-transactions-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ 
        title: '✅ Excel Downloaded', 
        description: 'Multi-sheet workbook with Summary, Transactions, Items & Staff Performance' 
      });
      setExportOpen(false);
    } catch (error) {
      toast({ title: 'Export Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: 'No Data', description: 'No transactions to export', variant: 'destructive' });
      return;
    }
    try {
      exportToPDF(filteredTransactions, `pos-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ 
        title: '✅ PDF Downloaded', 
        description: 'Professional transaction report generated successfully' 
      });
      setExportOpen(false);
    } catch (error) {
      toast({ title: 'Export Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handlePrintAll = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: 'No Data', description: 'No transactions to print', variant: 'destructive' });
      return;
    }
    try {
      printTransactions(filteredTransactions);
      setExportOpen(false);
    } catch (error) {
      toast({ title: 'Print Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handlePrintSingle = (tx: Transaction) => {
    try {
      printSingleTransaction(tx);
    } catch (error) {
      toast({ title: 'Print Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handlePrintInvoice = (tx: Transaction, showTax: boolean) => {
    try {
      // Get company data
      const companyData = localStorage.getItem('zervos_company');
      const company = companyData ? JSON.parse(companyData) : {
        name: 'Your Business',
        businessType: 'Services',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        gst: '',
      };

      // Transform transaction items to match InvoiceItem format
      const transformedTransaction = {
        ...tx,
        paymentMethod: tx.paymentMethod || 'Cash',
        items: tx.items.map((item: any) => ({
          name: item.name || 'Product',
          qty: item.qty,
          price: item.price,
          assignedPerson: item.assignedPerson || '',
        })),
      };

      // Create a temporary container
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      document.body.appendChild(printContainer);

      // Render the invoice
      const root = ReactDOM.createRoot(printContainer);
      root.render(
        <POSInvoice 
          transaction={transformedTransaction} 
          company={company} 
          showTax={showTax}
        />
      );

      // Wait for render then print
      setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Receipt ${tx.id}</title>
                <meta charset="UTF-8">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  html, body { 
                    height: 100%;
                    overflow-y: auto;
                  }
                  body { 
                    font-family: 'Courier New', monospace; 
                    margin: 0; 
                    padding: 0;
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    min-height: 100vh;
                    padding: 20px 20px 100px 20px;
                    overflow-y: auto;
                  }
                  .receipt-container {
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    max-height: none;
                    margin-bottom: 20px;
                  }
                  @media print {
                    body { 
                      margin: 0; 
                      padding: 0; 
                      background: white;
                      overflow: visible;
                    }
                    .receipt-container {
                      box-shadow: none;
                    }
                    button { display: none !important; }
                    @page {
                      size: 80mm auto;
                      margin: 0;
                    }
                  }
                  .no-print { display: block; }
                  @media print {
                    .no-print { display: none !important; }
                  }
                </style>
              </head>
              <body>
                <div class="receipt-container">
                  ${printContainer.innerHTML}
                </div>
                <div class="no-print" style="text-align: center; margin-top: 20px; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <button onclick="window.print()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 14px; font-weight: 600;">🖨️ Print Receipt</button>
                  <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">✕ Close</button>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
        }

        // Cleanup
        document.body.removeChild(printContainer);
      }, 100);

      toast({ 
        title: 'Invoice Generated', 
        description: `${showTax ? 'With Tax' : 'Without Tax'} invoice opened in new window`,
      });
    } catch (error) {
      toast({ title: 'Print Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">POS</h1>
            <p className="text-gray-600 mt-1">Point of Sale — manage in-person sales and quick checkouts</p>
            {/* Active Shift Indicator */}
            {activeShift && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Shift Active: {activeShift.staffName}
                </span>
                <span className="text-gray-500">
                  Started: {new Date(activeShift.startTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Shift Management */}
              {!activeShift ? (
                <Button 
                  onClick={() => setIsShiftDialogOpen(true)} 
                  variant="outline"
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Play size={16} /> Start Shift
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsEndShiftDialogOpen(true)} 
                  variant="outline"
                  className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Square size={16} /> End Shift
                </Button>
              )}

              <Button 
                onClick={() => setIsShiftHistoryOpen(true)} 
                variant="outline"
                className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Clock size={16} /> Shift History
              </Button>

              {/* Reports Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                    <BarChart3 size={16} />
                    Reports
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { setPosReportPeriod('today'); setIsReportsOpen(true); }}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Today's Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPosReportPeriod('week'); setIsReportsOpen(true); }}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Weekly Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPosReportPeriod('month'); setIsReportsOpen(true); }}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Monthly Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPosReportPeriod('year'); setIsReportsOpen(true); }}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Yearly Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPosReportPeriod('custom'); setIsReportsOpen(true); }}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Custom Range
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Dropdown */}
              <div className="relative">
                <Button 
                  onClick={() => setExportOpen((s) => !s)} 
                  variant={undefined} 
                  className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 flex items-center gap-2 relative"
                  disabled={filteredTransactions.length === 0}
                >
                  <Download size={16} /> Export
                  {filteredTransactions.length > 0 && (
                    <span className="ml-1 bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      {filteredTransactions.length}
                    </span>
                  )}
                </Button>
                {exportOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-xl z-50 overflow-hidden">
                    <div className="bg-gradient-to-r from-brand-600 to-purple-600 text-white px-4 py-2 text-sm font-semibold">
                      Export {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
                    </div>
                    <button 
                      onClick={handleExportCSV} 
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b transition-colors"
                    >
                      <FileText size={16} className="text-green-600" />
                      <div>
                        <div className="font-medium text-sm">CSV</div>
                        <div className="text-xs text-slate-500">Comma-separated values</div>
                      </div>
                    </button>
                    <button 
                      onClick={handleExportExcel} 
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b transition-colors"
                    >
                      <FileSpreadsheet size={16} className="text-green-700" />
                      <div>
                        <div className="font-medium text-sm">Excel</div>
                        <div className="text-xs text-slate-500">Multi-sheet workbook</div>
                      </div>
                    </button>
                    <button 
                      onClick={handleExportPDF} 
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b transition-colors"
                    >
                      <FileText size={16} className="text-red-600" />
                      <div>
                        <div className="font-medium text-sm">PDF</div>
                        <div className="text-xs text-slate-500">Professional report</div>
                      </div>
                    </button>
                    <button 
                      onClick={handlePrintAll} 
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <Printer size={16} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Print</div>
                        <div className="text-xs text-slate-500">Print preview</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => setLocation('/pos-register')} 
                className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white shadow-lg flex items-center gap-2 px-6 py-3 text-base font-semibold"
              >
                <ShoppingCart size={18} />
                Open POS Register
              </Button>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total Sales</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Filter className="text-yellow-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{(stats.totalRevenue/100).toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search by tx ID, customer, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter size={16} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transactions table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Open balance</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total return</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap"><span className="font-mono text-sm font-medium text-gray-900">{tx.id}</span></td>
                      <td className="px-4 py-4"><div className="text-sm font-medium">{tx.staff || '—'}</div></td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{tx.openBalance ? `₹${(tx.openBalance/100).toFixed(2)}` : '₹0.00'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{tx.totalReturn ? `₹${(tx.totalReturn/100).toFixed(2)}` : '₹0.00'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{tx.balanceAmount ? `₹${(tx.balanceAmount/100).toFixed(2)}` : `₹${(tx.amount/100).toFixed(2)}`}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">₹{((tx.orderValue ?? tx.amount)/100).toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tx.status==='Completed' ? 'bg-green-100 text-green-800' : tx.status==='Pending' ? 'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>{tx.status}</span></td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleViewTransaction(tx)} 
                            title="View Details" 
                            className="rounded px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <div className="relative group">
                            <button 
                              title="Print Bill" 
                              className="rounded px-2 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                            >
                              <Receipt size={16} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                              <button
                                onClick={() => handlePrintInvoice(tx, true)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                              >
                                <FileCheck size={14} className="text-green-600" />
                                <span>With Tax</span>
                              </button>
                              <button
                                onClick={() => handlePrintInvoice(tx, false)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
                              >
                                <FileText size={14} className="text-blue-600" />
                                <span>Without Tax</span>
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRefund(tx)} 
                            title="Process Refund" 
                            className="rounded px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">Use the POS register to create sales or adjust your filters.</p>
            </div>
          )}
        </div>

        {/* POS Register (toggleable) */}
        {showRegister && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <input
                    placeholder="Search services..."
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                  />
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <label className="text-sm">Domain</label>
                  <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="rounded-md border px-2 py-1">
                    {domains.map(d => <option key={d} value={d === 'all' ? 'all' : d}>{d}</option>)}
                  </select>
                  <button onClick={() => setShowCustomForm((s)=>!s)} className="ml-auto rounded-md border px-3 py-2">Add custom service</button>
                </div>

                {showCustomForm && (
                  <div className="mb-4 rounded-md border p-3 bg-slate-50">
                    <div className="flex gap-2">
                      <input placeholder="Service name" value={newServiceName} onChange={(e)=>setNewServiceName(e.target.value)} className="flex-1 rounded-md border px-2 py-1" />
                      <input placeholder="Price (₹)" value={newServicePrice} onChange={(e)=>setNewServicePrice(e.target.value)} className="w-28 rounded-md border px-2 py-1" />
                      <select value={newServiceCategory} onChange={(e)=>setNewServiceCategory(e.target.value)} className="rounded-md border px-2 py-1">
                        <option>Other</option>
                        {domains.filter(d=>d!=='all').map(d=> <option key={d} value={d}>{d}</option>)}
                        <option value="Beauty">Beauty</option>
                        <option value="Spa">Spa</option>
                        <option value="Wellness">Wellness</option>
                      </select>
                      <button onClick={()=>addCustomService(true)} className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">Add & Add to cart</button>
                      <button onClick={()=>addCustomService(false)} className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">Add</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredServices.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-slate-500">{p.description} {p.category ? `• ${p.category}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold">₹{(p.price/100).toFixed(2)}</div>
                        <button onClick={() => addToCart(p.id)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-white shadow-sm hover:bg-blue-700"><Plus size={14} /> Add Service</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold">Cart</h2>
                {cartItems.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-500">Cart is empty</div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {cartItems.map(({ product, qty }) => (
                      <div key={product.id} className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-slate-500">₹{(product.price/100).toFixed(2)} × {qty}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => changeQty(product.id, -1)} className="rounded-md border px-2 py-1"><Minus size={14} /></button>
                          <div className="w-6 text-center">{qty}</div>
                          <button onClick={() => changeQty(product.id, 1)} className="rounded-md border px-2 py-1"><Plus size={14} /></button>
                          <button onClick={() => removeFromCart(product.id)} className="ml-2 rounded-md p-2 text-slate-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}

                    <div className="mt-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">Subtotal</div>
                        <div className="font-semibold">{format(subtotal)}</div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Discount %</label>
                          <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value || 0))} className="w-20 rounded-md border px-2 py-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Tax %</label>
                          <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value || 0))} className="w-20 rounded-md border px-2 py-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Payment</label>
                          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded-md border px-2 py-1">
                            <option>Cash</option>
                            <option>Card</option>
                            <option>UPI</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Team Member</label>
                          <input 
                            type="text" 
                            value={teamMember} 
                            onChange={(e) => setTeamMember(e.target.value)} 
                            placeholder="Enter name"
                            className="flex-1 rounded-md border px-2 py-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Link Booking</label>
                          <select value={selectedBooking ?? ''} onChange={(e) => setSelectedBooking(e.target.value || null)} className="rounded-md border px-2 py-1">
                            <option value="">None</option>
                            {SAMPLE_APPOINTMENTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                          </select>
                        </div>
                        <Button onClick={handleCompleteSale} className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white"> <CreditCard size={16} /> Complete Sale</Button>
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* Receipt Preview Modal */}
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Receipt Preview</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6">
                <div className="text-center border-b pb-4 mb-4">
                  <h3 className="font-bold text-2xl text-slate-900">🧾 RECEIPT</h3>
                  <p className="text-sm text-slate-600 mt-2">{new Date().toLocaleString()}</p>
                  {selectedTx && <p className="text-xs font-mono text-slate-500 mt-1">{selectedTx.id}</p>}
                </div>
                
                {selectedTx ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-slate-700">Customer:</p>
                        <p className="text-slate-900">{selectedTx.customer.name}</p>
                        {selectedTx.customer.email && <p className="text-xs text-slate-500">{selectedTx.customer.email}</p>}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Staff:</p>
                        <p className="text-slate-900">{selectedTx.staff || 'N/A'}</p>
                        {selectedTx.serviceAttendee && (
                          <p className="text-xs text-slate-500">Attendee: {selectedTx.serviceAttendee}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-b py-3">
                      <p className="font-semibold text-sm mb-2">Items:</p>
                      {selectedTx.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span>{item.name || item.productId} × {item.qty}</span>
                          <span className="font-medium">{format(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Order Value:</span>
                        <span>{format(selectedTx.orderValue || selectedTx.amount)}</span>
                      </div>
                      {(selectedTx.amount - (selectedTx.orderValue || selectedTx.amount)) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tax/Fees:</span>
                          <span>{format(selectedTx.amount - (selectedTx.orderValue || selectedTx.amount))}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>TOTAL:</span>
                        <span className="text-brand-600">{format(selectedTx.amount)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-center text-slate-500 pt-4 border-t">
                      <p>Payment Method: <strong>{selectedTx.paymentMethod || 'N/A'}</strong></p>
                      <p className="mt-2">Thank you for your business! ⭐⭐⭐⭐⭐</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <p>No transaction selected</p>
                  </div>
                )}
              </div>
              
              {selectedTx && (
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={() => handlePrintSingle(selectedTx)} 
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Printer size={16} /> Print Receipt
                  </Button>
                  <Button 
                    onClick={() => {
                      try {
                        exportToPDF([selectedTx], `receipt-${selectedTx.id}.pdf`);
                        toast({ title: 'PDF Downloaded', description: 'Receipt saved as PDF' });
                      } catch (error) {
                        toast({ title: 'Export Failed', description: (error as Error).message, variant: 'destructive' });
                      }
                    }} 
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <FileText size={16} /> Save as PDF
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {/* Transaction View Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {selectedTx ? (
                <div>
                  <div className="mb-2 text-sm text-slate-600">ID: <span className="font-mono">{selectedTx.id}</span></div>
                  <div className="mb-2">Staff: <strong>{selectedTx.staff || '—'}</strong></div>
                  <div className="mb-2">Customer: <strong>{selectedTx.customer.name}</strong> <div className="text-sm text-slate-500">{selectedTx.customer.email}</div></div>
                  <div className="mb-2">Date: {new Date(selectedTx.date).toLocaleString()}</div>
                  <div className="mb-4">
                    <h4 className="font-medium">Items</h4>
                    <div className="mt-2 space-y-2">
                      {selectedTx.items.map(it => (
                        <div key={it.productId} className="flex justify-between">
                          <div>{products.find(p=>p.id===it.productId)?.name || it.productId} × {it.qty}</div>
                          <div>{format(it.price * it.qty)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between font-semibold"><div>Order Value</div><div>{format(selectedTx.orderValue ?? selectedTx.amount)}</div></div>
                </div>
              ) : (
                <div>No transaction selected</div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Start Shift Dialog */}
        <Dialog open={isShiftDialogOpen} onOpenChange={(open) => {
          setIsShiftDialogOpen(open);
          if (!open) setShowStaffSuggestions(false);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Play className="text-white" size={20} />
                </div>
                Start New Shift
              </DialogTitle>
              <DialogDescription>
                Begin a new billing shift. All transactions will be tracked under this shift.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Label>Staff Name *</Label>
                <div className="relative mt-1">
                  <Input
                    value={shiftStaffName}
                    onChange={(e) => {
                      setShiftStaffName(e.target.value);
                      setShowStaffSuggestions(true);
                    }}
                    onFocus={() => setShowStaffSuggestions(true)}
                    placeholder="Type or select staff name"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffSuggestions(!showStaffSuggestions)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown size={18} className={`transition-transform ${showStaffSuggestions ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {/* Staff Suggestions Dropdown */}
                {showStaffSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {teamMembers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        <p>No team members found.</p>
                        <p className="text-xs mt-1">You can still type a name manually.</p>
                      </div>
                    ) : filteredStaffSuggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        <p>No matching staff found.</p>
                        <p className="text-xs mt-1">Press Enter to use "{shiftStaffName}"</p>
                      </div>
                    ) : (
                      filteredStaffSuggestions.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setShiftStaffName(member.name || member.email || 'Staff');
                            setShowStaffSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                            {(member.name || member.email || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{member.name || 'Unnamed'}</p>
                            {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                            {member.role && <p className="text-xs text-gray-400">{member.role}</p>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label>Opening Cash Balance (₹)</Label>
                <Input
                  type="number"
                  value={shiftOpeningBalance}
                  onChange={(e) => setShiftOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>Cancel</Button>
              <Button onClick={startShift} className="bg-green-600 hover:bg-green-700">
                <Play size={16} className="mr-2" /> Start Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* End Shift Dialog */}
        <Dialog open={isEndShiftDialogOpen} onOpenChange={setIsEndShiftDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <Square className="text-white" size={20} />
                </div>
                End Shift
              </DialogTitle>
              <DialogDescription>
                Complete the current shift for {activeShift?.staffName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {activeShift && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Staff:</span>
                    <span className="font-medium">{activeShift.staffName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium">{new Date(activeShift.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Opening Balance:</span>
                    <span className="font-medium">₹{(activeShift.openingBalance/100).toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div>
                <Label>Closing Cash Balance (₹)</Label>
                <Input
                  type="number"
                  value={shiftClosingBalance}
                  onChange={(e) => setShiftClosingBalance(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEndShiftDialogOpen(false)}>Cancel</Button>
              <Button onClick={endShift} className="bg-red-600 hover:bg-red-700">
                <Square size={16} className="mr-2" /> End Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shift History Dialog */}
        <Dialog open={isShiftHistoryOpen} onOpenChange={setIsShiftHistoryOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Clock className="text-white" size={20} />
                </div>
                Shift History
              </DialogTitle>
              <DialogDescription>
                View all completed and active shifts
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {shifts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No shift history found</p>
                  <p className="text-sm">Start your first shift to begin tracking</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift) => (
                    <div key={shift.id} className="bg-gray-50 rounded-xl p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${shift.status === 'active' ? 'bg-green-100' : 'bg-gray-200'}`}>
                            <User size={20} className={shift.status === 'active' ? 'text-green-600' : 'text-gray-600'} />
                          </div>
                          <div>
                            <p className="font-semibold">{shift.staffName}</p>
                            <p className="text-sm text-gray-500">{shift.date}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${shift.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                          {shift.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Start Time</p>
                          <p className="font-medium">{new Date(shift.startTime).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">End Time</p>
                          <p className="font-medium">{shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Sales</p>
                          <p className="font-medium text-green-600">₹{(shift.totalSales/100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Transactions</p>
                          <p className="font-medium">{shift.transactionCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShiftHistoryOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* POS Reports Dialog */}
        <Dialog open={isReportsOpen} onOpenChange={setIsReportsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  <span>POS Sales Report</span>
                  <span className="text-sm font-normal text-gray-500 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      posReportPeriod === 'today' ? 'bg-blue-100 text-blue-700' :
                      posReportPeriod === 'week' ? 'bg-green-100 text-green-700' :
                      posReportPeriod === 'month' ? 'bg-purple-100 text-purple-700' :
                      posReportPeriod === 'year' ? 'bg-amber-100 text-amber-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {posReportPeriod === 'today' ? "Today's Report" :
                       posReportPeriod === 'week' ? 'Weekly Report' :
                       posReportPeriod === 'month' ? 'Monthly Report' :
                       posReportPeriod === 'year' ? 'Yearly Report' :
                       'Custom Range'}
                    </span>
                  </span>
                </div>
              </DialogTitle>
              <DialogDescription>
                Comprehensive POS sales analysis with shift-wise breakdown
              </DialogDescription>
            </DialogHeader>

            {/* Custom Date Range Picker */}
            {posReportPeriod === 'custom' && (
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CalendarDays className="text-pink-600" size={18} />
                  Select Custom Date Range
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">From Date</Label>
                    <Input
                      type="date"
                      value={customPosReportDates.from}
                      onChange={(e) => setCustomPosReportDates(prev => ({ ...prev, from: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">To Date</Label>
                    <Input
                      type="date"
                      value={customPosReportDates.to}
                      onChange={(e) => setCustomPosReportDates(prev => ({ ...prev, to: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shift Filter */}
            <div className="flex items-center gap-4 mb-4">
              <Label className="text-sm font-medium">Filter by Shift:</Label>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  {shifts.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.staffName} - {s.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(() => {
              const report = generatePOSReport();
              return (
                <div className="space-y-6 py-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="text-blue-600" size={20} />
                        <span className="text-sm text-gray-600">Total Transactions</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700">{report.summary.totalTransactions}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="text-green-600" size={20} />
                        <span className="text-sm text-gray-600">Total Revenue</span>
                      </div>
                      <p className="text-3xl font-bold text-green-700">₹{(report.summary.totalRevenue/100).toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-purple-600" size={20} />
                        <span className="text-sm text-gray-600">Net Revenue</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-700">₹{(report.summary.netRevenue/100).toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <PieChart className="text-amber-600" size={20} />
                        <span className="text-sm text-gray-600">Avg Transaction</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-700">₹{(report.summary.avgTransactionValue/100).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{report.summary.completedTransactions}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{report.summary.pendingTransactions}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Refunded</p>
                      <p className="text-2xl font-bold text-red-600">{report.summary.refundedTransactions}</p>
                    </div>
                  </div>

                  {/* Staff Performance */}
                  {report.staffPerformance.length > 0 && (
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <Users size={18} />
                          Staff Performance
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Staff</th>
                              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Sales</th>
                              <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Transactions</th>
                              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Avg Ticket</th>
                              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Refunds</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.staffPerformance.map((staff, idx) => (
                              <tr key={idx} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{staff.name}</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600">₹{(staff.sales/100).toFixed(2)}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{staff.count}</td>
                                <td className="px-4 py-3 text-right text-gray-600">₹{(staff.avgTicket/100).toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-red-600">₹{(staff.refunds/100).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Shift Breakdown */}
                  {report.shiftBreakdown.length > 0 && (
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <Clock size={18} />
                          Shift-wise Breakdown
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Staff</th>
                              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Time</th>
                              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Sales</th>
                              <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Transactions</th>
                              <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.shiftBreakdown.map((shift, idx) => (
                              <tr key={idx} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{shift.staffName}</td>
                                <td className="px-4 py-3 text-gray-600">{shift.date}</td>
                                <td className="px-4 py-3 text-gray-600">{shift.startTime} - {shift.endTime}</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600">₹{(shift.totalSales/100).toFixed(2)}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{shift.transactionCount}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${shift.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                    {shift.status === 'active' ? 'Active' : 'Completed'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Payment Methods */}
                  {report.paymentMethods.length > 0 && (
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <CreditCard size={18} />
                          Payment Methods
                        </h3>
                      </div>
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.paymentMethods.map((pm, idx) => (
                          <div key={idx} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <p className="text-sm text-gray-600">{pm.method}</p>
                            <p className="text-xl font-bold text-amber-700">₹{(pm.amount/100).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{pm.count} transactions</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Download Buttons */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Download size={18} />
                      Download Report
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={downloadPOSReportCSV}
                        variant="outline"
                        className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        <FileSpreadsheet size={18} />
                        Download CSV
                      </Button>
                      <Button
                        onClick={downloadPOSReportExcel}
                        variant="outline"
                        className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <FileSpreadsheet size={18} />
                        Download Excel
                      </Button>
                      <Button
                        onClick={downloadPOSReportPDF}
                        variant="outline"
                        className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <FileText size={18} />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
