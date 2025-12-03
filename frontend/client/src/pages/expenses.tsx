import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  X,
  Target,
  ShoppingCart,
  FileText,
  Package,
  RefreshCw,
  ArrowDownRight,
  Receipt,
  Truck,
  BarChart3,
  PieChart,
  TrendingUp,
  Zap,
  Command,
  Star,
  Phone,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number; // in cents
  date: string;
  vendor?: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'overdue';
  attachments?: string[];
  notes?: string;
  createdAt: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'office-supplies', label: 'Office Supplies', icon: FileText },
  { value: 'equipment', label: 'Equipment', icon: ShoppingCart },
  { value: 'utilities', label: 'Utilities', icon: Building2 },
  { value: 'marketing', label: 'Marketing', icon: Target },
  { value: 'travel', label: 'Travel', icon: Calendar },
  { value: 'rent', label: 'Rent & Facilities', icon: Building2 },
  { value: 'software', label: 'Software & Subscriptions', icon: CreditCard },
  { value: 'professional', label: 'Professional Services', icon: User },
  { value: 'inventory', label: 'Inventory', icon: Package },
  { value: 'transportation', label: 'Transportation', icon: Truck },
  { value: 'other', label: 'Other', icon: DollarSign },
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Digital Wallet', 'Other'];

const VENDOR_CATEGORIES = [
  { value: 'products', label: 'Product Suppliers', icon: Package },
  { value: 'equipment', label: 'Equipment Suppliers', icon: ShoppingCart },
  { value: 'services', label: 'Service Providers', icon: FileText },
  { value: 'utilities', label: 'Utilities', icon: Building2 },
  { value: 'office', label: 'Office Supplies', icon: FileText },
  { value: 'other', label: 'Other', icon: DollarSign },
];

export default function Expenses() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'overall' | string>('overall');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Vendor suggestion states
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);

  // Form state
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: 'Cash',
    status: 'paid' as 'paid' | 'pending' | 'overdue',
    notes: '',
  });

  const storageKey = selectedWorkspace 
    ? `zervos_expenses_${selectedWorkspace.id}`
    : 'zervos_expenses';
  
  const vendorStorageKey = selectedWorkspace
    ? `zervos_vendors_${selectedWorkspace.id}`
    : 'zervos_vendors';

  useEffect(() => {
    loadData();
    loadVendors();
  }, [selectedWorkspace]);

  const loadData = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setExpenses(JSON.parse(stored));
  };

  const loadVendors = () => {
    const stored = localStorage.getItem(vendorStorageKey);
    if (stored) {
      const vendorsList = JSON.parse(stored);
      setVendors(vendorsList.filter((v: any) => v.status === 'active'));
    }
  };

  const saveExpenses = (data: Expense[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setExpenses(data);
  };

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;
  const parsePriceToCents = (value: string) => Math.round(parseFloat(value || '0') * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.category || !expenseForm.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      description: expenseForm.description,
      category: expenseForm.category,
      amount: parsePriceToCents(expenseForm.amount),
      date: expenseForm.date,
      vendor: expenseForm.vendor,
      paymentMethod: expenseForm.paymentMethod,
      status: expenseForm.status,
      notes: expenseForm.notes,
      createdAt: new Date().toISOString(),
    };

    saveExpenses([newExpense, ...expenses]);
    toast({ title: 'Expense Added', description: 'Expense recorded successfully' });
    resetForm();
    setIsExpenseDialogOpen(false);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;

    const updated = expenses.map(exp =>
      exp.id === editingExpense.id
        ? {
            ...exp,
            description: expenseForm.description,
            category: expenseForm.category,
            amount: parsePriceToCents(expenseForm.amount),
            date: expenseForm.date,
            vendor: expenseForm.vendor,
            paymentMethod: expenseForm.paymentMethod,
            status: expenseForm.status,
            notes: expenseForm.notes,
          }
        : exp
    );

    saveExpenses(updated);
    toast({ title: 'Expense Updated', description: 'Changes saved successfully' });
    resetForm();
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    saveExpenses(expenses.filter(exp => exp.id !== id));
    toast({ title: 'Expense Deleted', description: 'Expense removed successfully' });
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      category: expense.category,
      amount: (expense.amount / 100).toString(),
      date: expense.date,
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      notes: expense.notes || '',
    });
    setIsExpenseDialogOpen(true);
  };

  const resetForm = () => {
    setExpenseForm({
      description: '',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      paymentMethod: 'Cash',
      status: 'paid',
      notes: '',
    });
    setVendorSearchTerm('');
    setShowVendorSuggestions(false);
  };

  // Vendor suggestion logic
  const getVendorSuggestions = () => {
    if (!vendorSearchTerm) return vendors.slice(0, 5);
    
    return vendors
      .filter(vendor => 
        vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
        vendor.category?.toLowerCase().includes(vendorSearchTerm.toLowerCase())
      )
      .slice(0, 8);
  };

  const selectVendor = (vendor: any) => {
    setExpenseForm({ ...expenseForm, vendor: vendor.name });
    setVendorSearchTerm(vendor.name);
    setShowVendorSuggestions(false);
  };

  // Export functions
  const exportToCSV = () => {
    const report = generateReport(selectedReport);
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    
    let csv = `${businessName} - Expense Report\n`;
    csv += `Report Type: ${selectedReport === 'overall' ? 'Overall' : selectedReport}\n`;
    csv += `Date Range: ${report.dateRange}\n`;
    csv += `Generated: ${report.generatedAt}\n\n`;
    csv += `Total Expenses: ${formatPrice(report.total)}\n`;
    csv += `Total Transactions: ${report.transactionCount}\n`;
    csv += `Average Transaction: ${formatPrice(report.avgTransaction)}\n\n`;
    
    csv += 'Date,Description,Category,Vendor,Amount,Payment Method,Status,Notes\n';
    report.transactions.forEach((exp: Expense) => {
      csv += `${exp.date},"${exp.description}","${exp.category}","${exp.vendor || 'N/A'}",${formatPrice(exp.amount)},"${exp.paymentMethod}","${exp.status}","${exp.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_Expense_Report_${selectedReport}_${Date.now()}.csv`;
    a.click();
    
    toast({
      title: '✅ CSV Downloaded',
      description: 'Expense report exported successfully',
    });
  };

  const exportToExcel = () => {
    const report = generateReport(selectedReport);
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    
    let html = `<html><head><meta charset="utf-8"><style>
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; font-weight: bold; }
      .header { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
      .summary { margin: 20px 0; }
    </style></head><body>`;
    
    html += `<div class="header">${businessName} - Expense Report</div>`;
    html += `<div class="summary">`;
    html += `<p><strong>Report Type:</strong> ${selectedReport === 'overall' ? 'Overall' : selectedReport}</p>`;
    html += `<p><strong>Date Range:</strong> ${report.dateRange}</p>`;
    html += `<p><strong>Total Expenses:</strong> ${formatPrice(report.total)}</p>`;
    html += `<p><strong>Total Transactions:</strong> ${report.transactionCount}</p>`;
    html += `</div>`;
    
    html += `<table><tr>`;
    html += `<th>Date</th><th>Description</th><th>Category</th><th>Vendor</th><th>Amount</th><th>Payment Method</th><th>Status</th><th>Notes</th>`;
    html += `</tr>`;
    
    report.transactions.forEach((exp: Expense) => {
      html += `<tr>`;
      html += `<td>${exp.date}</td>`;
      html += `<td>${exp.description}</td>`;
      html += `<td>${exp.category}</td>`;
      html += `<td>${exp.vendor || 'N/A'}</td>`;
      html += `<td>${formatPrice(exp.amount)}</td>`;
      html += `<td>${exp.paymentMethod}</td>`;
      html += `<td>${exp.status}</td>`;
      html += `<td>${exp.notes || ''}</td>`;
      html += `</tr>`;
    });
    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_Expense_Report_${selectedReport}_${Date.now()}.xls`;
    a.click();

    toast({
      title: '✅ Excel Downloaded',
      description: 'Expense report exported successfully',
    });
  };

  const exportToPDF = () => {
    const report = generateReport(selectedReport);
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(239, 68, 68);
    doc.text(businessName, 20, y);
    y += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Expense Report - ${selectedReport.toUpperCase()}`, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date Range: ${report.dateRange}`, 20, y);
    y += 5;
    doc.text(`Generated: ${report.generatedAt}`, 20, y);
    y += 15;

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Expenses: ${formatPrice(report.total)}`, 25, y); y += 6;
    doc.text(`Total Transactions: ${report.transactionCount}`, 25, y); y += 6;
    doc.text(`Average Transaction: ${formatPrice(report.avgTransaction)}`, 25, y);
    y += 15;

    // Category breakdown for overall report
    if (selectedReport === 'overall' && 'categoryBreakdown' in report) {
      doc.setFontSize(14);
      doc.text('Expense Breakdown by Category', 20, y);
      y += 8;
      doc.setFontSize(10);
      Object.entries(report.categoryBreakdown).forEach(([category, data]: [string, any]) => {
        if (data.count > 0) {
          const percentage = report.total > 0 ? ((data.amount / report.total) * 100).toFixed(2) : '0';
          doc.text(`${category}: ${formatPrice(data.amount)} (${data.count} transactions, ${percentage}%)`, 25, y);
          y += 6;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        }
      });
      y += 10;

      // Payment method breakdown
      if (report.paymentBreakdown) {
        doc.setFontSize(14);
        doc.text('Payment Method Breakdown', 20, y);
        y += 8;
        doc.setFontSize(10);
        Object.entries(report.paymentBreakdown).forEach(([method, amount]: [string, any]) => {
          if (amount > 0) {
            const percentage = report.total > 0 ? ((amount / report.total) * 100).toFixed(2) : '0';
            doc.text(`${method}: ${formatPrice(amount)} (${percentage}%)`, 25, y);
            y += 6;
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
          }
        });
        y += 10;
      }
    }

    // Recent transactions
    doc.setFontSize(14);
    doc.text('Recent Transactions', 20, y);
    y += 8;
    doc.setFontSize(9);
    report.transactions.slice(0, 20).forEach((exp: Expense) => {
      doc.text(`${new Date(exp.date).toLocaleDateString()} - ${exp.description}: ${formatPrice(exp.amount)} (${exp.vendor || 'No vendor'})`, 25, y);
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`${businessName}_Expense_Report_${selectedReport}_${Date.now()}.pdf`);
    
    toast({
      title: '✅ PDF Downloaded',
      description: 'Expense report exported successfully',
    });
  };

  const getRangeName = () => {
    if (dateRange === 'custom') return 'Custom Range';
    return dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
  };

  // Get filtered expenses with date range
  const getFilteredExpenses = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
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
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        startDate = customDateFrom ? new Date(customDateFrom) : new Date(0);
        endDate = customDateTo ? new Date(customDateTo) : now;
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(0);
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesDate = expenseDate >= startDate && expenseDate <= endDate;
      
      const matchesSearch = 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
      const matchesPaymentMethod = filterPaymentMethod === 'all' || expense.paymentMethod === filterPaymentMethod;

      return matchesDate && matchesSearch && matchesCategory && matchesStatus && matchesPaymentMethod;
    });
  }, [expenses, dateRange, customDateFrom, customDateTo, searchTerm, filterCategory, filterStatus, filterPaymentMethod]);

  // Calculate statistics
  const stats = useMemo(() => {
    const filtered = getFilteredExpenses;
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    const paidExpenses = filtered.filter(exp => exp.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
    const pendingExpenses = filtered.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);
    const overdueExpenses = filtered.filter(exp => exp.status === 'overdue').reduce((sum, exp) => sum + exp.amount, 0);
    
    // Category breakdown
    const categoryBreakdown: Record<string, { amount: number; count: number }> = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      const catExpenses = filtered.filter(exp => exp.category === cat.value);
      categoryBreakdown[cat.label] = {
        amount: catExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        count: catExpenses.length,
      };
    });
    
    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {};
    PAYMENT_METHODS.forEach(method => {
      paymentBreakdown[method] = filtered.filter(exp => exp.paymentMethod === method).reduce((sum, exp) => sum + exp.amount, 0);
    });
    
    // Top vendors
    const vendorMap: Record<string, number> = {};
    filtered.forEach(exp => {
      if (exp.vendor) {
        vendorMap[exp.vendor] = (vendorMap[exp.vendor] || 0) + exp.amount;
      }
    });
    
    return {
      total,
      paidExpenses,
      pendingExpenses,
      overdueExpenses,
      categoryBreakdown,
      paymentBreakdown,
      vendorMap,
      transactionCount: filtered.length,
      avgTransaction: filtered.length > 0 ? total / filtered.length : 0,
    };
  }, [getFilteredExpenses]);

  // Generate report data
  const generateReport = (type: string) => {
    const filtered = getFilteredExpenses;
    
    const reportData = {
      dateRange: dateRange === 'custom' 
        ? `${customDateFrom} to ${customDateTo}`
        : dateRange.charAt(0).toUpperCase() + dateRange.slice(1),
      generatedAt: new Date().toLocaleString(),
      total: stats.total,
      transactionCount: filtered.length,
      avgTransaction: stats.avgTransaction,
    };

    if (type === 'overall') {
      return {
        ...reportData,
        categoryBreakdown: stats.categoryBreakdown,
        paymentBreakdown: stats.paymentBreakdown,
        statusBreakdown: {
          paid: stats.paidExpenses,
          pending: stats.pendingExpenses,
          overdue: stats.overdueExpenses,
        },
        topVendors: Object.entries(stats.vendorMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10),
        transactions: filtered,
      };
    } else {
      const categoryData = filtered.filter(exp => exp.category === type);
      return {
        ...reportData,
        type,
        transactions: categoryData,
        total: categoryData.reduce((sum, exp) => sum + exp.amount, 0),
        transactionCount: categoryData.length,
      };
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryObj = EXPENSE_CATEGORIES.find(c => c.value === category);
    return categoryObj ? categoryObj.icon : DollarSign;
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
          <h1 className="text-3xl font-bold text-slate-900">Expense Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive expense tracking and reporting</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingExpense(null);
            setIsExpenseDialogOpen(true);
          }}
          className="bg-gradient-to-r from-red-500 to-red-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
            <Button
              variant={dateRange === 'today' ? 'default' : 'outline'}
              onClick={() => setDateRange('today')}
              className={dateRange === 'today' ? 'bg-red-600' : ''}
            >
              Today
            </Button>
            <Button
              variant={dateRange === 'week' ? 'default' : 'outline'}
              onClick={() => setDateRange('week')}
              className={dateRange === 'week' ? 'bg-red-600' : ''}
            >
              This Week
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'outline'}
              onClick={() => setDateRange('month')}
              className={dateRange === 'month' ? 'bg-red-600' : ''}
            >
              This Month
            </Button>
            <Button
              variant={dateRange === 'year' ? 'default' : 'outline'}
              onClick={() => setDateRange('year')}
              className={dateRange === 'year' ? 'bg-red-600' : ''}
            >
              This Year
            </Button>
            <Button
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              onClick={() => setDateRange('custom')}
              className={dateRange === 'custom' ? 'bg-red-600' : ''}
            >
              Custom Range
            </Button>
          </div>

          {dateRange === 'custom' && (
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

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <Label className="text-sm text-slate-600">Filters:</Label>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {PAYMENT_METHODS.map(method => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-red-500">
              {getRangeName()}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600">Total Expenses</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{formatPrice(stats.total)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.transactionCount} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">Paid</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.paidExpenses)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.total > 0 ? ((stats.paidExpenses / stats.total) * 100).toFixed(1) : 0}% of total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">Pending</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.pendingExpenses)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.total > 0 ? ((stats.pendingExpenses / stats.total) * 100).toFixed(1) : 0}% of total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">Overdue</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.overdueExpenses)}</p>
          <p className="text-xs text-slate-500 mt-1">Requires attention</p>
        </motion.div>
      </div>

      {/* Detailed Reports Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Detailed Expense Reports</h2>
            <p className="text-sm text-slate-600 mt-1">Generate comprehensive reports by category with export options</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Overall Report */}
          <button
            onClick={() => {
              setSelectedReport('overall');
              setShowReportDialog(true);
            }}
            className="p-6 rounded-xl border-2 border-slate-200 hover:border-red-500 hover:shadow-lg transition-all group"
          >
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Overall Report</h3>
            <p className="text-xs text-slate-500">All expenses</p>
            <p className="text-lg font-bold text-red-600 mt-2">{formatPrice(stats.total)}</p>
          </button>

          {/* Category Reports */}
          {EXPENSE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const catStats = stats.categoryBreakdown[category.label];
            if (!catStats || catStats.count === 0) return null;
            
            return (
              <button
                key={category.value}
                onClick={() => {
                  setSelectedReport(category.value);
                  setShowReportDialog(true);
                }}
                className="p-6 rounded-xl border-2 border-slate-200 hover:border-red-500 hover:shadow-lg transition-all group"
              >
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-8 w-8 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{category.label}</h3>
                <p className="text-xs text-slate-500">{catStats.count} expenses</p>
                <p className="text-lg font-bold text-slate-900 mt-2">{formatPrice(catStats.amount)}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Search and Quick Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search expenses by description or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </motion.div>

      {/* Expenses Table */}
      {getFilteredExpenses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Receipt className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No expenses found</h3>
          <p className="mt-2 text-sm text-slate-600">
            {expenses.length === 0
              ? 'Start by adding your first expense'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <AnimatePresence>
                  {getFilteredExpenses.map((expense, index) => {
                    const CategoryIcon = getCategoryIcon(expense.category);
                    const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);

                    return (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">{expense.description}</div>
                            {expense.vendor && (
                              <div className="text-sm text-slate-500">Vendor: {expense.vendor}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-600">{category?.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-red-600">{formatPrice(expense.amount)}</span>
                          <div className="text-sm text-slate-500">{expense.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(expense.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsExpenseDialogOpen(false);
          setEditingExpense(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Enter expense description"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label htmlFor="vendor" className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  Smart Vendor Suggestion
                </Label>
                <div className="relative">
                  <Input
                    id="vendor"
                    value={vendorSearchTerm || expenseForm.vendor}
                    onChange={(e) => {
                      setVendorSearchTerm(e.target.value);
                      setExpenseForm({ ...expenseForm, vendor: e.target.value });
                      setShowVendorSuggestions(true);
                    }}
                    onFocus={() => setShowVendorSuggestions(true)}
                    placeholder="Type to search vendors..."
                    className="pr-10"
                  />
                  <Command className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                
                {showVendorSuggestions && vendors.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {vendorSearchTerm ? 'Matching' : 'Suggested'} Vendors
                      </p>
                    </div>
                    <div className="p-1">
                      {getVendorSuggestions().length > 0 ? (
                        getVendorSuggestions().map((vendor) => (
                          <button
                            key={vendor.id}
                            type="button"
                            onClick={() => selectVendor(vendor)}
                            className="w-full p-3 hover:bg-slate-50 rounded-lg text-left transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                                  {vendor.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {VENDOR_CATEGORIES.find(c => c.value === vendor.category)?.label || vendor.category}
                                  </Badge>
                                  {vendor.rating && (
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-2.5 w-2.5 ${
                                            i < vendor.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {vendor.phone && (
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {vendor.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No vendors found. Add vendors in Vendor Management.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="payment">Payment Method</Label>
                <Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm({ ...expenseForm, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={expenseForm.status} onValueChange={(value: any) => setExpenseForm({ ...expenseForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsExpenseDialogOpen(false);
              setEditingExpense(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingExpense ? handleUpdateExpense : handleAddExpense}>
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-red-600" />
              {selectedReport === 'overall' ? 'Overall' : EXPENSE_CATEGORIES.find(c => c.value === selectedReport)?.label} Expense Report
            </DialogTitle>
          </DialogHeader>

          {(() => {
            const report = generateReport(selectedReport);
            
            return (
              <div className="space-y-6 py-4">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Period</p>
                      <p className="font-semibold text-slate-900">{report.dateRange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Total Expenses</p>
                      <p className="text-lg font-bold text-red-600">{formatPrice(report.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Transactions</p>
                      <p className="font-semibold text-slate-900">{report.transactionCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Average</p>
                      <p className="font-semibold text-slate-900">{formatPrice(report.avgTransaction)}</p>
                    </div>
                  </div>
                </div>

                {/* Breakdown for overall report */}
                {selectedReport === 'overall' && 'categoryBreakdown' in report && (
                  <>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-6 py-3 border-b">
                        <h3 className="font-semibold text-slate-900">Expense Breakdown by Category</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(report.categoryBreakdown).map(([category, data]: [string, any]) => {
                            if (data.count === 0) return null;
                            const percentage = report.total > 0 ? ((data.amount / report.total) * 100).toFixed(1) : '0';
                            const categoryObj = EXPENSE_CATEGORIES.find(c => c.label === category);
                            const Icon = categoryObj?.icon || DollarSign;
                            
                            return (
                              <div key={category} className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon className="h-5 w-5 text-slate-600" />
                                  <span className="font-medium text-slate-900">{category}</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{formatPrice(data.amount)}</p>
                                <p className="text-xs text-slate-600 mt-1">{data.count} transactions • {percentage}%</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Breakdown */}
                    {report.paymentBreakdown && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b">
                          <h3 className="font-semibold text-slate-900">Payment Method Breakdown</h3>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(report.paymentBreakdown).map(([method, amount]: [string, any]) => {
                              if (amount === 0) return null;
                              const percentage = report.total > 0 ? ((amount / report.total) * 100).toFixed(1) : '0';
                              return (
                                <div key={method} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-4 w-4 text-slate-600" />
                                    <span className="font-medium text-slate-900 text-sm">{method}</span>
                                  </div>
                                  <p className="text-xl font-bold text-slate-900">{formatPrice(amount)}</p>
                                  <p className="text-xs text-slate-600 mt-1">{percentage}% of total</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Vendors */}
                    {report.topVendors && report.topVendors.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b">
                          <h3 className="font-semibold text-slate-900">Top Vendors</h3>
                        </div>
                        <div className="p-6">
                          <div className="space-y-3">
                            {report.topVendors.map(([vendor, amount]: [string, number], index: number) => {
                              const percentage = report.total > 0 ? ((amount / report.total) * 100).toFixed(1) : '0';
                              return (
                                <div key={vendor} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                      <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                                    </div>
                                    <span className="font-medium text-slate-900">{vendor}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-slate-900">{formatPrice(amount)}</p>
                                    <p className="text-xs text-slate-500">{percentage}%</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Export Buttons */}
                <div className="flex gap-3 justify-end border-t pt-4">
                  <Button variant="outline" onClick={exportToCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={exportToExcel} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button variant="outline" onClick={exportToPDF} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b">
                    <h3 className="font-semibold text-slate-900">Transaction Details ({report.transactions.length})</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Vendor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Payment</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {report.transactions.map((exp: Expense) => (
                          <tr key={exp.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-xs text-slate-600">
                              {new Date(exp.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm">{exp.description}</td>
                            <td className="px-4 py-2 text-sm text-slate-600">{exp.vendor || 'N/A'}</td>
                            <td className="px-4 py-2 text-xs">
                              <Badge variant="outline" className="text-xs">
                                {exp.paymentMethod}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-semibold text-red-600">
                              {formatPrice(exp.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}