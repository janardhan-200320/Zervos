import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import DashboardLayout from '@/components/DashboardLayout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Award,
  Calendar,
  Filter,
  Download,
  Star,
  ShoppingCart,
  Clock,
  BarChart3,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Gift,
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  FileText,
  Eye,
  XCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  AlertTriangle,
  Receipt,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  joinDate?: string;
  joiningDate?: string;
  employeeId?: string;
  department?: string;
  location?: string;
  availability?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  emergencyContact?: string;
  skills?: string;
  workAssigned?: string;
  reportingTo?: string;
  profilePicture?: string;
  customWorkHoursStart?: string;
  customWorkHoursEnd?: string;
  customWorkDays?: string[];
  status?: 'active' | 'terminated';
  terminationDate?: string;
  terminationReason?: string;
}

interface Transaction {
  id: string;
  date: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    assignedPerson?: string;
  }>;
  amount: number;
  staff?: string;
  paymentMethod: string;
}

interface StaffKPI {
  staffName: string;
  totalSales: number;
  totalTransactions: number;
  totalServices: number;
  averageTransactionValue: number;
  totalRevenue: number;
  commission: number;
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

interface Incentive {
  id: string;
  staffName: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank';
  reason: string;
  date: string;
  transactionId?: string;
  notes?: string;
}

interface StaffSalary {
  id: string;
  staffId: string;
  staffName: string;
  baseSalary: number;
  paymentSchedule: 'monthly' | 'weekly' | 'bi-weekly';
  lastPaidDate?: string;
  nextPaymentDate?: string;
  accountDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  allowances?: {
    hra?: number;
    transport?: number;
    medical?: number;
    other?: number;
  };
  deductions?: {
    pf?: number;
    tax?: number;
    insurance?: number;
    other?: number;
  };
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    method: 'cash' | 'upi' | 'bank';
    referenceId?: string;
    notes?: string;
  }>;
}

interface StaffDetailView {
  staffMember: StaffMember;
  salary?: StaffSalary;
  totalIncentives: number;
  kpiData?: StaffKPI;
}

export default function StaffKPIPage() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterPeriod, setFilterPeriod] = useState('this-month');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Incentives & Salaries
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [showIncentiveDialog, setShowIncentiveDialog] = useState(false);
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [showTopPerformerDialog, setShowTopPerformerDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedStaffForIncentive, setSelectedStaffForIncentive] = useState('');
  const [showStaffDetailDialog, setShowStaffDetailDialog] = useState(false);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<StaffDetailView | null>(null);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'bank' as 'cash' | 'upi' | 'bank',
    referenceId: '',
    notes: '',
  });
  
  // Incentive form
  const [incentiveForm, setIncentiveForm] = useState({
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'upi' | 'bank',
    reason: '',
    transactionId: '',
    notes: '',
  });
  
  // Salary form
  const [salaryForm, setSalaryForm] = useState({
    staffId: '',
    staffName: '',
    baseSalary: '',
    paymentSchedule: 'monthly' as 'monthly' | 'weekly' | 'bi-weekly',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    hra: '',
    transport: '',
    medical: '',
    otherAllowance: '',
    pf: '',
    tax: '',
    insurance: '',
    otherDeduction: '',
  });

  const storageKeyStaff = useMemo(() => {
    return selectedWorkspace ? `zervos_team_members::${selectedWorkspace.id}` : 'zervos_team_members';
  }, [selectedWorkspace]);
  
  const storageKeyIncentives = useMemo(() => {
    return selectedWorkspace ? `zervos_incentives::${selectedWorkspace.id}` : 'zervos_incentives';
  }, [selectedWorkspace]);
  
  const storageKeySalaries = useMemo(() => {
    return selectedWorkspace ? `zervos_salaries::${selectedWorkspace.id}` : 'zervos_salaries';
  }, [selectedWorkspace]);

  useEffect(() => {
    loadData();
    
    // Listen for team member updates
    const handleTeamMembersUpdate = () => {
      loadData();
    };
    
    window.addEventListener('team-members-updated', handleTeamMembersUpdate);
    
    return () => {
      window.removeEventListener('team-members-updated', handleTeamMembersUpdate);
    };
  }, [selectedWorkspace, storageKeyStaff, storageKeyIncentives, storageKeySalaries]);

  const loadData = () => {
    // Load staff members from team members page with proper workspace scope
    const storedStaff = localStorage.getItem(storageKeyStaff);
    if (storedStaff) {
      try {
        const parsedStaff = JSON.parse(storedStaff);
        // Filter out terminated staff from KPI calculations but keep them in the list
        setStaffMembers(parsedStaff);
      } catch (error) {
        console.error('Error loading staff members:', error);
        setStaffMembers([]);
      }
    } else {
      setStaffMembers([]);
    }

    // Load transactions
    const storedTransactions = localStorage.getItem('pos_transactions');
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }
    
    // Load incentives
    const storedIncentives = localStorage.getItem(storageKeyIncentives);
    if (storedIncentives) {
      try {
        setIncentives(JSON.parse(storedIncentives));
      } catch (error) {
        console.error('Error loading incentives:', error);
        setIncentives([]);
      }
    } else {
      setIncentives([]);
    }
    
    // Load salaries
    const storedSalaries = localStorage.getItem(storageKeySalaries);
    if (storedSalaries) {
      try {
        setSalaries(JSON.parse(storedSalaries));
      } catch (error) {
        console.error('Error loading salaries:', error);
        setSalaries([]);
      }
    } else {
      setSalaries([]);
    }
  };

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let startDate: Date;
    let endDate: Date = now;

    switch (filterPeriod) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this-week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        startDate = customDateFrom ? new Date(customDateFrom) : new Date(0);
        endDate = customDateTo ? new Date(customDateTo) : now;
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return transactions;
    }

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, filterPeriod, customDateFrom, customDateTo]);

  // Calculate KPIs for each staff member
  const staffKPIs = useMemo(() => {
    const kpiMap = new Map<string, StaffKPI>();

    filteredTransactions.forEach(tx => {
      // Process items with assigned person
      tx.items.forEach(item => {
        if (item.assignedPerson) {
          const existing = kpiMap.get(item.assignedPerson) || {
            staffName: item.assignedPerson,
            totalSales: 0,
            totalTransactions: 0,
            totalServices: 0,
            averageTransactionValue: 0,
            totalRevenue: 0,
            commission: 0,
            performance: 'average' as const,
          };

          existing.totalServices += item.qty;
          existing.totalRevenue += item.price * item.qty;
          kpiMap.set(item.assignedPerson, existing);
        }
      });

      // Count transactions handled by staff (cashier)
      if (tx.staff) {
        const existing = kpiMap.get(tx.staff) || {
          staffName: tx.staff,
          totalSales: 0,
          totalTransactions: 0,
          totalServices: 0,
          averageTransactionValue: 0,
          totalRevenue: 0,
          commission: 0,
          performance: 'average' as const,
        };

        existing.totalTransactions += 1;
        existing.totalSales += tx.amount;
        kpiMap.set(tx.staff, existing);
      }
    });

    // Calculate averages and commission
    const kpis = Array.from(kpiMap.values()).map(kpi => {
      kpi.averageTransactionValue = kpi.totalTransactions > 0 
        ? kpi.totalSales / kpi.totalTransactions 
        : 0;
      
      // Commission: 5% of revenue generated from services
      kpi.commission = Math.round(kpi.totalRevenue * 0.05);

      // Performance rating based on revenue
      if (kpi.totalRevenue >= 50000) kpi.performance = 'excellent';
      else if (kpi.totalRevenue >= 30000) kpi.performance = 'good';
      else if (kpi.totalRevenue >= 10000) kpi.performance = 'average';
      else kpi.performance = 'needs-improvement';

      return kpi;
    });

    return kpis.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredTransactions]);

  const filteredKPIs = selectedStaff === 'all' 
    ? staffKPIs 
    : staffKPIs.filter(kpi => kpi.staffName === selectedStaff);

  // Overall stats
  const totalRevenue = staffKPIs.reduce((sum, kpi) => sum + kpi.totalRevenue, 0);
  const totalTransactions = staffKPIs.reduce((sum, kpi) => sum + kpi.totalTransactions, 0);
  const totalServices = staffKPIs.reduce((sum, kpi) => sum + kpi.totalServices, 0);
  const totalCommission = staffKPIs.reduce((sum, kpi) => sum + kpi.commission, 0);

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-700 border-green-300">⭐ Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">👍 Good</Badge>;
      case 'average':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">📊 Average</Badge>;
      case 'needs-improvement':
        return <Badge className="bg-red-100 text-red-700 border-red-300">⚠️ Needs Work</Badge>;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    
    let csv = `${businessName} - Staff KPI Report\n`;
    csv += `Period: ${getRangeName()}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csv += `SUMMARY\n`;
    csv += `Total Revenue,${formatPrice(totalRevenue)}\n`;
    csv += `Total Services,${totalServices}\n`;
    csv += `Total Transactions,${totalTransactions}\n`;
    csv += `Total Commission,${formatPrice(totalCommission)}\n`;
    csv += `Active Staff Members,${staffKPIs.length}\n\n`;
    
    if (topPerformer) {
      csv += `TOP PERFORMER\n`;
      csv += `Name,${topPerformer.staffName}\n`;
      csv += `Revenue,${formatPrice(topPerformer.totalRevenue)}\n`;
      csv += `Performance,${topPerformer.performance}\n\n`;
    }
    
    csv += `STAFF PERFORMANCE DETAILS\n`;
    csv += `Rank,Staff Name,Services,Transactions,Revenue,Avg Transaction,Commission,Performance\n`;
    filteredKPIs.forEach((kpi, index) => {
      csv += `${index + 1},"${kpi.staffName}",${kpi.totalServices},${kpi.totalTransactions},${formatPrice(kpi.totalRevenue)},${formatPrice(kpi.averageTransactionValue)},${formatPrice(kpi.commission)},${kpi.performance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_StaffKPI_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: '✅ CSV Downloaded',
      description: 'Staff KPI report exported successfully',
    });
  };

  const exportToExcel = () => {
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    
    let html = `<html><head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      table { border-collapse: collapse; width: 100%; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      th { background-color: #4F46E5; color: white; font-weight: bold; }
      .header { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
      .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
      .top-performer { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b; }
      .rank { font-weight: bold; }
      .rank-1 { color: #f59e0b; }
      .rank-2 { color: #94a3b8; }
      .rank-3 { color: #d97706; }
    </style></head><body>`;
    
    html += `<div class="header">${businessName} - Staff KPI Report</div>`;
    html += `<p><strong>Period:</strong> ${getRangeName()} | <strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;
    
    html += `<div class="summary">`;
    html += `<h3>Summary Statistics</h3>`;
    html += `<p><strong>Total Revenue:</strong> ${formatPrice(totalRevenue)}</p>`;
    html += `<p><strong>Total Services:</strong> ${totalServices}</p>`;
    html += `<p><strong>Total Transactions:</strong> ${totalTransactions}</p>`;
    html += `<p><strong>Total Commission:</strong> ${formatPrice(totalCommission)}</p>`;
    html += `<p><strong>Active Staff:</strong> ${staffKPIs.length}</p>`;
    html += `</div>`;
    
    if (topPerformer) {
      html += `<div class="top-performer">`;
      html += `<h3>🏆 Top Performer</h3>`;
      html += `<p><strong>${topPerformer.staffName}</strong></p>`;
      html += `<p>Revenue: ${formatPrice(topPerformer.totalRevenue)} | Performance: ${topPerformer.performance}</p>`;
      html += `</div>`;
    }
    
    html += `<h3>Staff Performance Leaderboard</h3>`;
    html += `<table>`;
    html += `<tr><th>Rank</th><th>Staff Name</th><th>Services</th><th>Transactions</th><th>Revenue</th><th>Avg Transaction</th><th>Commission</th><th>Performance</th></tr>`;
    
    filteredKPIs.forEach((kpi, index) => {
      const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
      html += `<tr>`;
      html += `<td class="rank ${rankClass}">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</td>`;
      html += `<td><strong>${kpi.staffName}</strong></td>`;
      html += `<td>${kpi.totalServices}</td>`;
      html += `<td>${kpi.totalTransactions}</td>`;
      html += `<td>${formatPrice(kpi.totalRevenue)}</td>`;
      html += `<td>${formatPrice(kpi.averageTransactionValue)}</td>`;
      html += `<td>${formatPrice(kpi.commission)}</td>`;
      html += `<td>${kpi.performance}</td>`;
      html += `</tr>`;
    });
    
    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_StaffKPI_${Date.now()}.xls`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: '✅ Excel Downloaded',
      description: 'Staff KPI report exported successfully',
    });
  };

  const exportToPDF = () => {
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
    doc.text('Staff KPI & Performance Report', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${getRangeName()}`, 20, y);
    y += 5;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
    y += 15;

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${formatPrice(totalRevenue)}`, 25, y); y += 6;
    doc.text(`Total Services: ${totalServices}`, 25, y); y += 6;
    doc.text(`Total Transactions: ${totalTransactions}`, 25, y); y += 6;
    doc.text(`Total Commission: ${formatPrice(totalCommission)}`, 25, y); y += 6;
    doc.text(`Active Staff Members: ${staffKPIs.length}`, 25, y);
    y += 15;

    // Top Performer
    if (topPerformer) {
      doc.setFontSize(14);
      doc.setTextColor(245, 158, 11);
      doc.text('🏆 Top Performer', 20, y);
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(topPerformer.staffName, 25, y); y += 6;
      doc.setFontSize(10);
      doc.text(`Revenue: ${formatPrice(topPerformer.totalRevenue)}`, 25, y); y += 6;
      doc.text(`Performance: ${topPerformer.performance}`, 25, y);
      y += 15;
    }

    // Staff Performance Table
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Staff Performance Leaderboard', 20, y);
    y += 8;

    doc.setFontSize(9);
    filteredKPIs.forEach((kpi, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      doc.text(`${rank} ${kpi.staffName}`, 25, y); y += 5;
      doc.setFontSize(8);
      doc.text(`Services: ${kpi.totalServices} | Transactions: ${kpi.totalTransactions}`, 30, y); y += 4;
      doc.text(`Revenue: ${formatPrice(kpi.totalRevenue)} | Commission: ${formatPrice(kpi.commission)}`, 30, y);
      y += 8;
      doc.setFontSize(9);
    });

    doc.save(`${businessName}_StaffKPI_${Date.now()}.pdf`);
    
    toast({
      title: '✅ PDF Downloaded',
      description: 'Staff KPI report exported successfully',
    });
  };

  // Get top performer
  const topPerformer = staffKPIs.length > 0 ? staffKPIs[0] : null;

  // Incentive functions
  const handleAddIncentive = () => {
    if (!selectedStaffForIncentive || !incentiveForm.amount || !incentiveForm.reason) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newIncentive: Incentive = {
      id: Date.now().toString(),
      staffName: selectedStaffForIncentive,
      amount: Math.round(parseFloat(incentiveForm.amount) * 100),
      paymentMethod: incentiveForm.paymentMethod,
      reason: incentiveForm.reason,
      date: new Date().toISOString(),
      transactionId: incentiveForm.transactionId || undefined,
      notes: incentiveForm.notes || undefined,
    };

    const updated = [...incentives, newIncentive];
    setIncentives(updated);
    localStorage.setItem(storageKeyIncentives, JSON.stringify(updated));

    toast({
      title: '✅ Incentive Added',
      description: `₹${incentiveForm.amount} incentive added for ${selectedStaffForIncentive}`,
    });

    setShowIncentiveDialog(false);
    setIncentiveForm({
      amount: '',
      paymentMethod: 'cash',
      reason: '',
      transactionId: '',
      notes: '',
    });
  };

  const handleDeleteIncentive = (id: string) => {
    const updated = incentives.filter(i => i.id !== id);
    setIncentives(updated);
    localStorage.setItem(storageKeyIncentives, JSON.stringify(updated));
    
    toast({
      title: '🗑️ Incentive Deleted',
      description: 'Incentive record removed',
    });
  };

  // Salary functions
  const handleAddSalary = () => {
    if (!salaryForm.staffName || !salaryForm.baseSalary) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in staff name and base salary',
        variant: 'destructive',
      });
      return;
    }

    const existingSalary = salaries.find(s => s.staffName === salaryForm.staffName);
    if (existingSalary) {
      toast({
        title: '⚠️ Salary Already Exists',
        description: 'This staff member already has a salary record. Please edit instead.',
        variant: 'destructive',
      });
      return;
    }

    const staffMember = staffMembers.find(s => s.name === salaryForm.staffName);
    const newSalary: StaffSalary = {
      id: Date.now().toString(),
      staffId: staffMember?.id || '',
      staffName: salaryForm.staffName,
      baseSalary: Math.round(parseFloat(salaryForm.baseSalary) * 100),
      paymentSchedule: salaryForm.paymentSchedule,
      accountDetails: {
        bankName: salaryForm.bankName || undefined,
        accountNumber: salaryForm.accountNumber || undefined,
        ifscCode: salaryForm.ifscCode || undefined,
        upiId: salaryForm.upiId || undefined,
      },
      allowances: {
        hra: salaryForm.hra ? Math.round(parseFloat(salaryForm.hra) * 100) : 0,
        transport: salaryForm.transport ? Math.round(parseFloat(salaryForm.transport) * 100) : 0,
        medical: salaryForm.medical ? Math.round(parseFloat(salaryForm.medical) * 100) : 0,
        other: salaryForm.otherAllowance ? Math.round(parseFloat(salaryForm.otherAllowance) * 100) : 0,
      },
      deductions: {
        pf: salaryForm.pf ? Math.round(parseFloat(salaryForm.pf) * 100) : 0,
        tax: salaryForm.tax ? Math.round(parseFloat(salaryForm.tax) * 100) : 0,
        insurance: salaryForm.insurance ? Math.round(parseFloat(salaryForm.insurance) * 100) : 0,
        other: salaryForm.otherDeduction ? Math.round(parseFloat(salaryForm.otherDeduction) * 100) : 0,
      },
      paymentHistory: [],
    };

    const updated = [...salaries, newSalary];
    setSalaries(updated);
    localStorage.setItem(storageKeySalaries, JSON.stringify(updated));

    toast({
      title: '✅ Salary Added',
      description: `Salary structure created for ${salaryForm.staffName}`,
    });

    setShowSalaryDialog(false);
    setSalaryForm({
      staffId: '',
      staffName: '',
      baseSalary: '',
      paymentSchedule: 'monthly',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      hra: '',
      transport: '',
      medical: '',
      otherAllowance: '',
      pf: '',
      tax: '',
      insurance: '',
      otherDeduction: '',
    });
  };

  const handleDeleteSalary = (id: string) => {
    const updated = salaries.filter(s => s.id !== id);
    setSalaries(updated);
    localStorage.setItem(storageKeySalaries, JSON.stringify(updated));
    
    toast({
      title: '🗑️ Salary Deleted',
      description: 'Salary record removed',
    });
  };

  // View staff details
  const handleViewStaffDetails = (staffName: string) => {
    const staffMember = staffMembers.find(s => s.name === staffName);
    if (!staffMember) {
      toast({
        title: '⚠️ Staff Not Found',
        description: 'Staff member details not available',
        variant: 'destructive',
      });
      return;
    }

    const salary = salaries.find(s => s.staffName === staffName);
    const staffIncentives = incentives.filter(i => i.staffName === staffName);
    const totalIncentives = staffIncentives.reduce((sum, i) => sum + i.amount, 0);
    const kpiData = staffKPIs.find(k => k.staffName === staffName);

    setSelectedStaffDetail({
      staffMember,
      salary,
      totalIncentives,
      kpiData,
    });
    setShowStaffDetailDialog(true);
  };

  // Handle staff termination
  const handleTerminateStaff = () => {
    if (!selectedStaffDetail || !terminationReason.trim()) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please provide termination reason',
        variant: 'destructive',
      });
      return;
    }

    const updatedStaff = staffMembers.map(s =>
      s.id === selectedStaffDetail.staffMember.id
        ? {
            ...s,
            status: 'terminated' as const,
            terminationDate: new Date().toISOString(),
            terminationReason: terminationReason,
          }
        : s
    );

    setStaffMembers(updatedStaff);
    localStorage.setItem(storageKeyStaff, JSON.stringify(updatedStaff));

    toast({
      title: '✅ Staff Terminated',
      description: `${selectedStaffDetail.staffMember.name} has been marked as terminated`,
    });

    setShowTerminateDialog(false);
    setShowStaffDetailDialog(false);
    setTerminationReason('');
  };

  // Handle salary payment
  const handleMakePayment = () => {
    if (!selectedStaffDetail?.salary || !paymentForm.amount) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please enter payment amount',
        variant: 'destructive',
      });
      return;
    }

    const payment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: Math.round(parseFloat(paymentForm.amount) * 100),
      method: paymentForm.method,
      referenceId: paymentForm.referenceId,
      notes: paymentForm.notes,
    };

    const updatedSalaries = salaries.map(s =>
      s.id === selectedStaffDetail.salary?.id
        ? {
            ...s,
            paymentHistory: [...(s.paymentHistory || []), payment],
            lastPaidDate: new Date().toISOString(),
          }
        : s
    );

    setSalaries(updatedSalaries);
    localStorage.setItem(storageKeySalaries, JSON.stringify(updatedSalaries));

    toast({
      title: '✅ Payment Recorded',
      description: `Payment of ₹${(parseFloat(paymentForm.amount)).toFixed(2)} recorded successfully`,
    });

    setShowPaymentDialog(false);
    setPaymentForm({
      amount: '',
      method: 'bank',
      referenceId: '',
      notes: '',
    });

    // Refresh staff detail view
    const updatedSalary = updatedSalaries.find(s => s.id === selectedStaffDetail.salary?.id);
    if (updatedSalary) {
      setSelectedStaffDetail({
        ...selectedStaffDetail,
        salary: updatedSalary,
      });
    }
  };

  // Calculate net salary
  const calculateNetSalary = (salary: StaffSalary) => {
    const base = salary.baseSalary;
    const allowances = Object.values(salary.allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
    const deductions = Object.values(salary.deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
    return base + allowances - deductions;
  };

  // Get range name
  const getRangeName = () => {
    if (filterPeriod === 'custom') return `${customDateFrom} to ${customDateTo}`;
    return filterPeriod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff KPI & Performance</h1>
          <p className="text-slate-600 mt-1">Track team performance and productivity metrics</p>
        </div>
        <div className="flex gap-2">
          {topPerformer && (
            <Button
              onClick={() => setShowTopPerformerDialog(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Top Performer
            </Button>
          )}
          <Button 
            onClick={() => setShowReportDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Report
          </Button>
        </div>
      </motion.div>

      {/* Date Range Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Select Period:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterPeriod === 'today' ? 'default' : 'outline'}
              onClick={() => setFilterPeriod('today')}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={filterPeriod === 'this-month' ? 'default' : 'outline'}
              onClick={() => setFilterPeriod('this-month')}
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant={filterPeriod === 'this-year' ? 'default' : 'outline'}
              onClick={() => setFilterPeriod('this-year')}
            >
              This Year
            </Button>
            <Button
              size="sm"
              variant={filterPeriod === 'custom' ? 'default' : 'outline'}
              onClick={() => setFilterPeriod('custom')}
            >
              Custom Range
            </Button>
          </div>

          {filterPeriod === 'custom' && (
            <div className="flex gap-2 items-end">
              <div>
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
              <p className="text-xs text-slate-500 mt-1">Generated by staff</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalServices}</div>
              <p className="text-xs text-slate-500 mt-1">Total services done</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalTransactions}</div>
              <p className="text-xs text-slate-500 mt-1">Total checkouts</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <Award className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatPrice(totalCommission)}</div>
              <p className="text-xs text-slate-500 mt-1">5% of revenue</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Salary & Incentive Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid md:grid-cols-2 gap-4"
      >
        {/* Salary Management Card */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              Salary Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">{salaries.length} staff members have salary structures</p>
            <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Salary Structure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Staff Salary</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Staff Member *</Label>
                      <Select value={salaryForm.staffName} onValueChange={(value) => setSalaryForm({...salaryForm, staffName: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers
                            .filter(member => member.status !== 'terminated')
                            .map(member => (
                              <SelectItem key={member.id} value={member.name}>
                                {member.name} {member.employeeId ? `(${member.employeeId})` : ''} - {member.role}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Base Salary (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="25000"
                        value={salaryForm.baseSalary}
                        onChange={(e) => setSalaryForm({...salaryForm, baseSalary: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Payment Schedule</Label>
                    <Select value={salaryForm.paymentSchedule} onValueChange={(value: any) => setSalaryForm({...salaryForm, paymentSchedule: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 text-green-700">Allowances</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">HRA (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.hra} onChange={(e) => setSalaryForm({...salaryForm, hra: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs">Transport (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.transport} onChange={(e) => setSalaryForm({...salaryForm, transport: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs">Medical (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.medical} onChange={(e) => setSalaryForm({...salaryForm, medical: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs">Other (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.otherAllowance} onChange={(e) => setSalaryForm({...salaryForm, otherAllowance: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 text-red-700">Deductions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">PF (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.pf} onChange={(e) => setSalaryForm({...salaryForm, pf: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs">Tax (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.tax} onChange={(e) => setSalaryForm({...salaryForm, tax: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs">Insurance (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.insurance} onChange={(e) => setSalaryForm({...salaryForm, insurance: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs">Other (₹)</Label>
                        <Input type="number" placeholder="0" value={salaryForm.otherDeduction} onChange={(e) => setSalaryForm({...salaryForm, otherDeduction: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Payment Details (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <Input
                          placeholder="HDFC Bank"
                          value={salaryForm.bankName}
                          onChange={(e) => setSalaryForm({...salaryForm, bankName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          placeholder="1234567890"
                          value={salaryForm.accountNumber}
                          onChange={(e) => setSalaryForm({...salaryForm, accountNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>IFSC Code</Label>
                        <Input
                          placeholder="HDFC0001234"
                          value={salaryForm.ifscCode}
                          onChange={(e) => setSalaryForm({...salaryForm, ifscCode: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>UPI ID</Label>
                        <Input
                          placeholder="name@upi"
                          value={salaryForm.upiId}
                          onChange={(e) => setSalaryForm({...salaryForm, upiId: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddSalary} className="flex-1">Save Salary</Button>
                    <Button variant="outline" onClick={() => setShowSalaryDialog(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {salaries.map(salary => (
                <div key={salary.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium text-sm">{salary.staffName}</p>
                    <p className="text-xs text-slate-500">{formatPrice(calculateNetSalary(salary))} / {salary.paymentSchedule}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleViewStaffDetails(salary.staffName)} className="text-blue-600 hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteSalary(salary.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incentive Management Card */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              Incentive Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">{incentives.length} incentives provided</p>
            <Dialog open={showIncentiveDialog} onOpenChange={setShowIncentiveDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Gift className="h-4 w-4 mr-2" />
                  Provide Incentive
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Provide Incentive</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pr-2">
                  <div>
                    <Label>Staff Member *</Label>
                    <Select value={selectedStaffForIncentive} onValueChange={setSelectedStaffForIncentive}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers
                          .filter(member => member.status !== 'terminated')
                          .map(member => (
                            <SelectItem key={member.id} value={member.name}>
                              {member.name} {member.employeeId ? `(${member.employeeId})` : ''} - {member.role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="500"
                        value={incentiveForm.amount}
                        onChange={(e) => setIncentiveForm({...incentiveForm, amount: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Payment Method *</Label>
                      <Select value={incentiveForm.paymentMethod} onValueChange={(value: any) => setIncentiveForm({...incentiveForm, paymentMethod: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash</SelectItem>
                          <SelectItem value="upi">📱 UPI</SelectItem>
                          <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Reason *</Label>
                    <Input
                      placeholder="Top performer bonus"
                      value={incentiveForm.reason}
                      onChange={(e) => setIncentiveForm({...incentiveForm, reason: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Transaction ID (Optional)</Label>
                    <Input
                      placeholder="TXN123456"
                      value={incentiveForm.transactionId}
                      onChange={(e) => setIncentiveForm({...incentiveForm, transactionId: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={incentiveForm.notes}
                      onChange={(e) => setIncentiveForm({...incentiveForm, notes: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddIncentive} className="flex-1">Provide Incentive</Button>
                    <Button variant="outline" onClick={() => setShowIncentiveDialog(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {incentives.slice(-5).reverse().map(incentive => (
                <div key={incentive.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium text-sm">{incentive.staffName}</p>
                    <p className="text-xs text-slate-500">{formatPrice(incentive.amount)} via {incentive.paymentMethod}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteIncentive(incentive.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter by Staff */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <Filter className="h-5 w-5 text-slate-400" />
        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff Members</SelectItem>
            {staffKPIs.map(kpi => (
              <SelectItem key={kpi.staffName} value={kpi.staffName}>
                {kpi.staffName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Leaderboard */}
      {filteredKPIs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-brand-50 to-purple-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Performance Leaderboard</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <AnimatePresence>
                {filteredKPIs.map((kpi, index) => (
                  <motion.div
                    key={kpi.staffName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-gradient-to-br from-slate-400 to-slate-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-slate-900">{kpi.staffName}</h3>
                            {getPerformanceBadge(kpi.performance)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-slate-500">Services</p>
                              <p className="text-sm font-semibold text-slate-900">{kpi.totalServices}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Transactions</p>
                              <p className="text-sm font-semibold text-slate-900">{kpi.totalTransactions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Avg Transaction</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {formatPrice(kpi.averageTransactionValue)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Commission</p>
                              <p className="text-sm font-semibold text-amber-600">
                                {formatPrice(kpi.commission)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(kpi.totalRevenue)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewStaffDetails(kpi.staffName)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStaffForIncentive(kpi.staffName);
                              setShowIncentiveDialog(true);
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            <Gift className="h-3 w-3 mr-1" />
                            Incentive
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredKPIs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm"
        >
          <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Performance Data</h3>
          <p className="mt-2 text-sm text-slate-600">
            {filteredTransactions.length === 0
              ? 'Start making sales to track staff performance'
              : 'No staff members have recorded activity in this period'}
          </p>
        </motion.div>
      )}

      {/* Performance Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Performance Ratings Guide
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4 border border-green-200">
            <Badge className="bg-green-100 text-green-700 border-green-300 mb-2">⭐ Excellent</Badge>
            <p className="text-sm text-slate-600">Revenue ≥ ₹500</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-blue-200">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-2">👍 Good</Badge>
            <p className="text-sm text-slate-600">Revenue ≥ ₹300</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-yellow-200">
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 mb-2">📊 Average</Badge>
            <p className="text-sm text-slate-600">Revenue ≥ ₹100</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-red-200">
            <Badge className="bg-red-100 text-red-700 border-red-300 mb-2">⚠️ Needs Work</Badge>
            <p className="text-sm text-slate-600">Revenue &lt; ₹100</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          * Commission is calculated at 5% of total revenue generated from services performed
        </p>
      </motion.div>

      {/* All Team Members Section */}
      {staffMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-slate-900">All Team Members</h2>
              </div>
              <Badge variant="outline" className="text-sm">
                {staffMembers.filter(m => m.status !== 'terminated').length} Active
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffMembers
                .filter(member => member.status !== 'terminated')
                .map((member) => {
                  const kpi = staffKPIs.find(k => k.staffName === member.name);
                  const salary = salaries.find(s => s.staffName === member.name);
                  const hasData = !!kpi;
                  
                  return (
                    <div
                      key={member.id}
                      className={`rounded-lg border p-4 transition-all hover:shadow-md ${
                        hasData ? 'border-purple-200 bg-purple-50' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow"
                          />
                        ) : (
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow ${
                            hasData ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-slate-400 to-slate-600'
                          }`}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{member.name}</h3>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge variant="outline" className="text-xs">{member.role}</Badge>
                            {member.employeeId && (
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                                {member.employeeId}
                              </Badge>
                            )}
                          </div>
                          {hasData ? (
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div>
                                <p className="text-slate-500">Revenue</p>
                                <p className="font-semibold text-green-600">{formatPrice(kpi.totalRevenue)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Services</p>
                                <p className="font-semibold text-purple-600">{kpi.totalServices}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 mb-2">No activity in this period</p>
                          )}
                          {salary && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                              <IndianRupee className="h-3 w-3" />
                              <span>Salary: {formatPrice(calculateNetSalary(salary))}</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewStaffDetails(member.name)}
                            className="w-full text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Full Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {staffMembers.filter(m => m.status === 'terminated').length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Terminated Staff ({staffMembers.filter(m => m.status === 'terminated').length})
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffMembers
                    .filter(member => member.status === 'terminated')
                    .map((member) => (
                      <div
                        key={member.id}
                        className="rounded-lg border border-red-200 bg-red-50 p-3 opacity-75"
                      >
                        <div className="flex items-center gap-2">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={member.name}
                              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow grayscale"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-xs shadow grayscale">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-700 text-sm truncate">{member.name}</h4>
                            <p className="text-xs text-slate-600">{member.role}</p>
                            <Badge variant="destructive" className="text-xs mt-1">Terminated</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewStaffDetails(member.name)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Comprehensive Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-6 w-6 text-blue-600" />
              Staff KPI & Performance Report - {getRangeName()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
                <Target className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm text-slate-600">Services Done</p>
                <p className="text-2xl font-bold text-blue-600">{totalServices}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <ShoppingCart className="h-8 w-8 text-purple-600 mb-2" />
                <p className="text-sm text-slate-600">Transactions</p>
                <p className="text-2xl font-bold text-purple-600">{totalTransactions}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
                <Award className="h-8 w-8 text-amber-600 mb-2" />
                <p className="text-sm text-slate-600">Commission</p>
                <p className="text-2xl font-bold text-amber-600">{formatPrice(totalCommission)}</p>
              </div>
            </div>

            {/* Top Performer Highlight */}
            {topPerformer && (
              <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">🏆</div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Top Performer</p>
                      <h3 className="text-2xl font-bold text-slate-900">{topPerformer.staffName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {getPerformanceBadge(topPerformer.performance)}
                        <span className="text-sm text-slate-600">•</span>
                        <span className="text-sm font-medium text-slate-700">{topPerformer.totalServices} services</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 mb-1">Revenue Generated</p>
                    <p className="text-3xl font-bold text-green-600">{formatPrice(topPerformer.totalRevenue)}</p>
                    <p className="text-xs text-slate-500 mt-1">Commission: {formatPrice(topPerformer.commission)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Performance Table */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                Performance Leaderboard
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Staff Name</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Services</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Transactions</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Revenue</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Avg Value</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Commission</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredKPIs.map((kpi, index) => (
                        <tr key={kpi.staffName} className={`hover:bg-slate-50 ${index === 0 ? 'bg-amber-50' : index === 1 ? 'bg-slate-50' : index === 2 ? 'bg-orange-50' : ''}`}>
                          <td className="px-4 py-3">
                            <span className={`text-lg font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-600' : 'text-slate-600'}`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{kpi.staffName}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-slate-700">{kpi.totalServices}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-slate-700">{kpi.totalTransactions}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-green-600">{formatPrice(kpi.totalRevenue)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-slate-700">{formatPrice(kpi.averageTransactionValue)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-amber-600">{formatPrice(kpi.commission)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getPerformanceBadge(kpi.performance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Download Report
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Export this comprehensive staff performance report in your preferred format
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <Button
                  onClick={() => {
                    exportToCSV();
                    setShowReportDialog(false);
                  }}
                  variant="outline"
                  className="flex-1 h-auto py-4 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <div className="text-3xl">📊</div>
                  <div>
                    <p className="font-semibold">CSV Format</p>
                    <p className="text-xs text-slate-500">Compatible with Excel, Sheets</p>
                  </div>
                </Button>
                <Button
                  onClick={() => {
                    exportToExcel();
                    setShowReportDialog(false);
                  }}
                  variant="outline"
                  className="flex-1 h-auto py-4 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <div className="text-3xl">📈</div>
                  <div>
                    <p className="font-semibold">Excel Format</p>
                    <p className="text-xs text-slate-500">Formatted with colors & styling</p>
                  </div>
                </Button>
                <Button
                  onClick={() => {
                    exportToPDF();
                    setShowReportDialog(false);
                  }}
                  variant="outline"
                  className="flex-1 h-auto py-4 flex-col gap-2 hover:bg-red-50 hover:border-red-300"
                >
                  <div className="text-3xl">📄</div>
                  <div>
                    <p className="font-semibold">PDF Format</p>
                    <p className="text-xs text-slate-500">Professional printable report</p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Report Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Report Information</p>
                  <p className="text-xs text-slate-600 mt-1">
                    This report includes performance data for {filteredKPIs.length} staff members during {getRangeName().toLowerCase()}. 
                    Commission is calculated at 5% of total revenue generated from services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Performer Dialog */}
      <Dialog open={showTopPerformerDialog} onOpenChange={setShowTopPerformerDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              Top Performer - {getRangeName()}
            </DialogTitle>
          </DialogHeader>
          
          {topPerformer && (
            <div className="space-y-6">
              {/* Winner Announcement */}
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300">
                <div className="text-6xl mb-3">🏆</div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{topPerformer.staffName}</h2>
                {getPerformanceBadge(topPerformer.performance)}
                <div className="mt-4">
                  <p className="text-4xl font-bold text-green-600">{formatPrice(topPerformer.totalRevenue)}</p>
                  <p className="text-sm text-slate-600 mt-1">Total Revenue Generated</p>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{topPerformer.totalServices}</p>
                  <p className="text-xs text-slate-600">Services</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <ShoppingCart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{topPerformer.totalTransactions}</p>
                  <p className="text-xs text-slate-600">Transactions</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-green-600">{formatPrice(topPerformer.averageTransactionValue)}</p>
                  <p className="text-xs text-slate-600">Avg Transaction</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                  <Award className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-amber-600">{formatPrice(topPerformer.commission)}</p>
                  <p className="text-xs text-slate-600">Commission</p>
                </div>
              </div>

              {/* Provide Incentive Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  Reward Top Performer
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Recognize exceptional performance by providing an incentive to {topPerformer.staffName}
                </p>
                <Button
                  onClick={() => {
                    setSelectedStaffForIncentive(topPerformer.staffName);
                    setShowTopPerformerDialog(false);
                    setShowIncentiveDialog(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Provide Incentive
                </Button>
              </div>

              {/* Salary Info if exists */}
              {salaries.find(s => s.staffName === topPerformer.staffName) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-blue-600" />
                    Salary Information
                  </h3>
                  {(() => {
                    const salary = salaries.find(s => s.staffName === topPerformer.staffName);
                    return salary ? (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm">
                          <span className="font-medium">Base Salary:</span> {formatPrice(salary.baseSalary)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Schedule:</span> {salary.paymentSchedule}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Staff Detail Dialog */}
      <Dialog open={showStaffDetailDialog} onOpenChange={setShowStaffDetailDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6 text-purple-600" />
              Staff Details & Records
            </DialogTitle>
          </DialogHeader>

          {selectedStaffDetail && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-6 p-6 rounded-xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-2 border-purple-200">
                <div className="flex-shrink-0">
                  {selectedStaffDetail.staffMember.profilePicture ? (
                    <img
                      src={selectedStaffDetail.staffMember.profilePicture}
                      alt={selectedStaffDetail.staffMember.name}
                      className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                      {selectedStaffDetail.staffMember.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-1">{selectedStaffDetail.staffMember.name}</h2>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className="bg-purple-600">{selectedStaffDetail.staffMember.role}</Badge>
                        {selectedStaffDetail.staffMember.department && (
                          <Badge variant="outline" className="border-purple-300 text-purple-700">
                            {selectedStaffDetail.staffMember.department}
                          </Badge>
                        )}
                        {selectedStaffDetail.staffMember.status === 'terminated' ? (
                          <Badge variant="destructive" className="bg-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Terminated
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {selectedStaffDetail.staffMember.employeeId && (
                          <p className="text-slate-600">
                            <span className="font-medium">Employee ID:</span> {selectedStaffDetail.staffMember.employeeId}
                          </p>
                        )}
                        {selectedStaffDetail.staffMember.email && (
                          <p className="text-slate-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedStaffDetail.staffMember.email}
                          </p>
                        )}
                        {selectedStaffDetail.staffMember.phone && (
                          <p className="text-slate-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedStaffDetail.staffMember.phone}
                          </p>
                        )}
                        {selectedStaffDetail.staffMember.location && (
                          <p className="text-slate-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedStaffDetail.staffMember.location}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedStaffDetail.staffMember.status !== 'terminated' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowTerminateDialog(true)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Terminate
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* Personal Info Card */}
                <Card className="md:col-span-2 border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-blue-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedStaffDetail.staffMember.idType && (
                        <div>
                          <p className="text-slate-500 text-xs mb-0.5">ID Type</p>
                          <p className="font-medium flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {selectedStaffDetail.staffMember.idType}
                          </p>
                        </div>
                      )}
                      {selectedStaffDetail.staffMember.idNumber && (
                        <div>
                          <p className="text-slate-500 text-xs mb-0.5">ID Number</p>
                          <p className="font-medium">{selectedStaffDetail.staffMember.idNumber}</p>
                        </div>
                      )}
                      {(selectedStaffDetail.staffMember.joiningDate || selectedStaffDetail.staffMember.joinDate) && (
                        <div>
                          <p className="text-slate-500 text-xs mb-0.5">Joining Date</p>
                          <p className="font-medium">
                            {new Date(selectedStaffDetail.staffMember.joiningDate || selectedStaffDetail.staffMember.joinDate || '').toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      )}
                      {selectedStaffDetail.staffMember.availability && (
                        <div>
                          <p className="text-slate-500 text-xs mb-0.5">Work Hours</p>
                          <p className="font-medium text-xs">{selectedStaffDetail.staffMember.availability}</p>
                        </div>
                      )}
                    </div>
                    {selectedStaffDetail.staffMember.address && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Address</p>
                        <p className="font-medium text-sm">{selectedStaffDetail.staffMember.address}</p>
                      </div>
                    )}
                    {selectedStaffDetail.staffMember.emergencyContact && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Emergency Contact</p>
                        <p className="font-medium text-sm">{selectedStaffDetail.staffMember.emergencyContact}</p>
                      </div>
                    )}
                    {selectedStaffDetail.staffMember.skills && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Skills</p>
                        <p className="font-medium text-sm">{selectedStaffDetail.staffMember.skills}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* KPI Summary Card */}
                <Card className="md:col-span-2 border-purple-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {selectedStaffDetail.kpiData ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
                          <p className="text-xl font-bold text-green-600">{formatPrice(selectedStaffDetail.kpiData.totalRevenue)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-slate-600 mb-1">Services</p>
                          <p className="text-xl font-bold text-blue-600">{selectedStaffDetail.kpiData.totalServices}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <p className="text-xs text-slate-600 mb-1">Transactions</p>
                          <p className="text-xl font-bold text-purple-600">{selectedStaffDetail.kpiData.totalTransactions}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <p className="text-xs text-slate-600 mb-1">Commission</p>
                          <p className="text-xl font-bold text-amber-600">{formatPrice(selectedStaffDetail.kpiData.commission)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">No performance data for current period</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Salary Details Card */}
              {selectedStaffDetail.salary && (
                <Card className="border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IndianRupee className="h-5 w-5 text-blue-600" />
                        Salary & Compensation
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setShowPaymentDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Salary Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900 mb-3">Salary Structure</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Base Salary</span>
                            <span className="font-medium">{formatPrice(selectedStaffDetail.salary.baseSalary)}</span>
                          </div>
                          {selectedStaffDetail.salary.allowances && (
                            <>
                              {selectedStaffDetail.salary.allowances.hra! > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>+ HRA</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.allowances.hra)}</span>
                                </div>
                              )}
                              {selectedStaffDetail.salary.allowances.transport! > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>+ Transport</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.allowances.transport)}</span>
                                </div>
                              )}
                              {selectedStaffDetail.salary.allowances.medical! > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>+ Medical</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.allowances.medical)}</span>
                                </div>
                              )}
                              {selectedStaffDetail.salary.allowances.other! > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>+ Other</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.allowances.other)}</span>
                                </div>
                              )}
                            </>
                          )}
                          {selectedStaffDetail.salary.deductions && (
                            <>
                              {selectedStaffDetail.salary.deductions.pf! > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>- PF</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.deductions.pf)}</span>
                                </div>
                              )}
                              {selectedStaffDetail.salary.deductions.tax! > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>- Tax</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.deductions.tax)}</span>
                                </div>
                              )}
                              {selectedStaffDetail.salary.deductions.insurance! > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>- Insurance</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.deductions.insurance)}</span>
                                </div>
                              )}
                              {selectedStaffDetail.salary.deductions.other! > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>- Other</span>
                                  <span>{formatPrice(selectedStaffDetail.salary.deductions.other)}</span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="border-t pt-2 flex justify-between font-bold text-lg">
                            <span>Net Salary</span>
                            <span className="text-blue-600">{formatPrice(calculateNetSalary(selectedStaffDetail.salary))}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Payment: {selectedStaffDetail.salary.paymentSchedule}
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900 mb-3">Payment Details</h4>
                        {selectedStaffDetail.salary.accountDetails && (
                          <div className="space-y-2 text-sm bg-slate-50 rounded-lg p-3">
                            {selectedStaffDetail.salary.accountDetails.bankName && (
                              <div>
                                <p className="text-xs text-slate-500">Bank Name</p>
                                <p className="font-medium flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {selectedStaffDetail.salary.accountDetails.bankName}
                                </p>
                              </div>
                            )}
                            {selectedStaffDetail.salary.accountDetails.accountNumber && (
                              <div>
                                <p className="text-xs text-slate-500">Account Number</p>
                                <p className="font-medium">{selectedStaffDetail.salary.accountDetails.accountNumber}</p>
                              </div>
                            )}
                            {selectedStaffDetail.salary.accountDetails.ifscCode && (
                              <div>
                                <p className="text-xs text-slate-500">IFSC Code</p>
                                <p className="font-medium">{selectedStaffDetail.salary.accountDetails.ifscCode}</p>
                              </div>
                            )}
                            {selectedStaffDetail.salary.accountDetails.upiId && (
                              <div>
                                <p className="text-xs text-slate-500">UPI ID</p>
                                <p className="font-medium flex items-center gap-1">
                                  <Smartphone className="h-3 w-3" />
                                  {selectedStaffDetail.salary.accountDetails.upiId}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        {selectedStaffDetail.salary.lastPaidDate && (
                          <div className="text-xs text-slate-600">
                            <p>Last paid: {new Date(selectedStaffDetail.salary.lastPaidDate).toLocaleDateString('en-GB')}</p>
                          </div>
                        )}
                      </div>

                      {/* Payment History */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Recent Payments
                        </h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {selectedStaffDetail.salary.paymentHistory && selectedStaffDetail.salary.paymentHistory.length > 0 ? (
                            selectedStaffDetail.salary.paymentHistory.slice(-5).reverse().map((payment) => (
                              <div key={payment.id} className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-green-700">{formatPrice(payment.amount)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {payment.method === 'cash' ? '💵' : payment.method === 'upi' ? '📱' : '🏦'} {payment.method}
                                  </Badge>
                                </div>
                                <p className="text-slate-600">{new Date(payment.date).toLocaleDateString('en-GB')}</p>
                                {payment.referenceId && <p className="text-slate-500">Ref: {payment.referenceId}</p>}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No payment history</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Incentives Card */}
              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Gift className="h-5 w-5 text-green-600" />
                      Incentives & Rewards
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedStaffForIncentive(selectedStaffDetail.staffMember.name);
                        setShowIncentiveDialog(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Incentive
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <p className="text-sm text-slate-600">Total Incentives Earned</p>
                    <p className="text-3xl font-bold text-green-600">{formatPrice(selectedStaffDetail.totalIncentives)}</p>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {incentives
                      .filter(i => i.staffName === selectedStaffDetail.staffMember.name)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((incentive) => (
                        <div key={incentive.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-green-700">{formatPrice(incentive.amount)}</p>
                              <p className="text-xs text-slate-600">{new Date(incentive.date).toLocaleDateString('en-GB')}</p>
                            </div>
                            <Badge className={
                              incentive.paymentMethod === 'cash' ? 'bg-amber-500' :
                              incentive.paymentMethod === 'upi' ? 'bg-blue-500' :
                              'bg-purple-500'
                            }>
                              {incentive.paymentMethod === 'cash' ? '💵 Cash' :
                               incentive.paymentMethod === 'upi' ? '📱 UPI' :
                               '🏦 Bank'}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-slate-700 mb-1">{incentive.reason}</p>
                          {incentive.transactionId && (
                            <p className="text-xs text-slate-500">Transaction ID: {incentive.transactionId}</p>
                          )}
                          {incentive.notes && (
                            <p className="text-xs text-slate-600 mt-1 italic">{incentive.notes}</p>
                          )}
                        </div>
                      ))}
                    {incentives.filter(i => i.staffName === selectedStaffDetail.staffMember.name).length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-8">No incentives provided yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Termination Info */}
              {selectedStaffDetail.staffMember.status === 'terminated' && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Termination Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <p className="text-slate-600">Termination Date</p>
                      <p className="font-medium">
                        {selectedStaffDetail.staffMember.terminationDate
                          ? new Date(selectedStaffDetail.staffMember.terminationDate).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </p>
                    </div>
                    {selectedStaffDetail.staffMember.terminationReason && (
                      <div>
                        <p className="text-slate-600">Reason</p>
                        <p className="font-medium">{selectedStaffDetail.staffMember.terminationReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Termination Confirmation Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Terminate Staff Member
            </DialogTitle>
          </DialogHeader>
          {selectedStaffDetail && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  You are about to terminate <strong>{selectedStaffDetail.staffMember.name}</strong>.
                  This action will mark the employee as inactive but will preserve all records.
                </p>
              </div>
              <div>
                <Label>Termination Reason *</Label>
                <Textarea
                  placeholder="Enter reason for termination..."
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleTerminateStaff}
                  disabled={!terminationReason.trim()}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Termination
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTerminateDialog(false);
                    setTerminationReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Record Salary Payment
            </DialogTitle>
          </DialogHeader>
          {selectedStaffDetail?.salary && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 mb-2">
                  Recording payment for <strong>{selectedStaffDetail.staffMember.name}</strong>
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  Net Salary: {formatPrice(calculateNetSalary(selectedStaffDetail.salary))}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Amount (₹) *</Label>
                  <Input
                    type="number"
                    placeholder={`${(calculateNetSalary(selectedStaffDetail.salary) / 100).toFixed(2)}`}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Payment Method *</Label>
                  <Select value={paymentForm.method} onValueChange={(value: any) => setPaymentForm({...paymentForm, method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="upi">📱 UPI</SelectItem>
                      <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Transaction/Reference ID</Label>
                <Input
                  placeholder="TXN12345 (optional)"
                  value={paymentForm.referenceId}
                  onChange={(e) => setPaymentForm({...paymentForm, referenceId: e.target.value})}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes (optional)"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleMakePayment} disabled={!paymentForm.amount} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
