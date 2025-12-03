import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Download,
  Calculator,
  DollarSign,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  CreditCard,
  PieChart,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Scissors,
  ShoppingCart,
  CalendarDays,
  Filter,
  CheckCircle2,
  AlertCircle,
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

interface IncomeData {
  id: string;
  source: 'pos' | 'appointment' | 'booking' | 'product' | 'service';
  description: string;
  amount: number;
  date: string;
  customer?: string;
  paymentMethod?: string;
  staff?: string;
}

interface ExpenseData {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor?: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'overdue';
}

export default function BalanceSheet() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [allIncome, setAllIncome] = useState<IncomeData[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseData[]>([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  // Date range states
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Payment filter
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'upi'>('all');

  useEffect(() => {
    loadAllData();
  }, [selectedWorkspace]);

  const loadAllData = () => {
    loadIncome();
    loadExpenses();
  };

  const loadIncome = () => {
    const income: IncomeData[] = [];
    const workspaceId = selectedWorkspace?.id;

    // Load POS transactions
    try {
      const posData = localStorage.getItem('pos_transactions');
      if (posData) {
        const transactions = JSON.parse(posData);
        transactions.forEach((tx: any) => {
          if (tx.status === 'Completed') {
            income.push({
              id: tx.id,
              source: 'pos',
              description: `POS - ${tx.items?.map((i: any) => i.name).join(', ') || 'Transaction'}`,
              amount: tx.total || 0,
              date: tx.date,
              customer: tx.customer?.name || 'Walk-in',
              paymentMethod: tx.paymentMethod,
              staff: tx.staff,
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading POS:', e);
    }

    // Load Appointments
    try {
      const appointmentsData = localStorage.getItem('zervos_appointments');
      if (appointmentsData) {
        const appointments = JSON.parse(appointmentsData);
        appointments.forEach((apt: any) => {
          if (apt.isPaid && apt.status === 'Completed') {
            income.push({
              id: apt.id,
              source: 'appointment',
              description: `Appointment - ${apt.serviceName || apt.service}`,
              amount: apt.price || 0,
              date: apt.date,
              customer: apt.customerName,
              paymentMethod: apt.paymentMethod || 'Cash',
              staff: apt.staffName,
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading appointments:', e);
    }

    // Load Bookings
    try {
      const bookingKey = workspaceId ? `bookings_${workspaceId}` : 'zervos_bookings';
      const bookingsData = localStorage.getItem(bookingKey);
      if (bookingsData) {
        const bookings = JSON.parse(bookingsData);
        bookings.forEach((booking: any) => {
          if ((booking.status === 'confirmed' || booking.status === 'completed') && booking.totalPrice) {
            income.push({
              id: booking.id,
              source: 'booking',
              description: `Booking - ${booking.customerName}`,
              amount: booking.totalPrice,
              date: booking.date,
              customer: booking.customerName,
              paymentMethod: 'Online',
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading bookings:', e);
    }

    // Load Services
    try {
      const servicesData = localStorage.getItem('zervos_services');
      if (servicesData) {
        const services = JSON.parse(servicesData);
        services.forEach((service: any) => {
          if (service.isActive !== false && service.price) {
            income.push({
              id: `service-${service.id}`,
              source: 'service',
              description: `Service - ${service.name}`,
              amount: service.price,
              date: service.createdAt || new Date().toISOString(),
              customer: service.customerName || 'Customer',
              paymentMethod: service.paymentMethod || 'Cash',
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading services:', e);
    }

    setAllIncome(income.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const loadExpenses = () => {
    const expenseKey = selectedWorkspace 
      ? `zervos_expenses_${selectedWorkspace.id}`
      : 'zervos_expenses';
    
    try {
      const expensesData = localStorage.getItem(expenseKey);
      if (expensesData) {
        const expenses = JSON.parse(expensesData);
        setAllExpenses(expenses.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (e) {
      console.error('Error loading expenses:', e);
    }
  };

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;
  const parsePriceToCents = (value: string) => Math.round(parseFloat(value || '0') * 100);

  // Filter data by date range
  const getFilteredData = useMemo(() => {
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

    const filteredIncome = allIncome.filter(item => {
      const itemDate = new Date(item.date);
      const matchesDate = itemDate >= startDate && itemDate <= endDate;
      const matchesPayment = paymentFilter === 'all' || 
        (item.paymentMethod && item.paymentMethod.toLowerCase() === paymentFilter);
      return matchesDate && matchesPayment;
    });

    const filteredExpenses = allExpenses.filter(item => {
      const itemDate = new Date(item.date);
      const matchesDate = itemDate >= startDate && itemDate <= endDate;
      const matchesStatus = item.status === 'paid'; // Only count paid expenses
      const matchesPayment = paymentFilter === 'all' || 
        (item.paymentMethod && item.paymentMethod.toLowerCase() === paymentFilter);
      return matchesDate && matchesStatus && matchesPayment;
    });

    return { filteredIncome, filteredExpenses };
  }, [allIncome, allExpenses, dateRange, customDateFrom, customDateTo, paymentFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const { filteredIncome, filteredExpenses } = getFilteredData;
    
    const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfitLoss = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfitLoss / totalIncome) * 100 : 0;
    
    // Income by source
    const posIncome = filteredIncome.filter(i => i.source === 'pos').reduce((sum, i) => sum + i.amount, 0);
    const appointmentIncome = filteredIncome.filter(i => i.source === 'appointment').reduce((sum, i) => sum + i.amount, 0);
    const bookingIncome = filteredIncome.filter(i => i.source === 'booking').reduce((sum, i) => sum + i.amount, 0);
    const serviceIncome = filteredIncome.filter(i => i.source === 'service').reduce((sum, i) => sum + i.amount, 0);
    const productIncome = filteredIncome.filter(i => i.source === 'product').reduce((sum, i) => sum + i.amount, 0);
    
    // Payment method breakdown
    const allTransactions = [...filteredIncome, ...filteredExpenses];
    const cashTotal = allTransactions
      .filter(t => t.paymentMethod?.toLowerCase() === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    const cardTotal = allTransactions
      .filter(t => t.paymentMethod?.toLowerCase() === 'card')
      .reduce((sum, t) => sum + t.amount, 0);
    const upiTotal = allTransactions
      .filter(t => t.paymentMethod?.toLowerCase() === 'upi')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      netProfitLoss,
      profitMargin,
      isProfitable: netProfitLoss >= 0,
      incomeBreakdown: {
        pos: posIncome,
        appointments: appointmentIncome,
        bookings: bookingIncome,
        services: serviceIncome,
        products: productIncome,
      },
      paymentBreakdown: {
        cash: cashTotal,
        card: cardTotal,
        upi: upiTotal,
      },
      transactionCounts: {
        income: filteredIncome.length,
        expenses: filteredExpenses.length,
      },
    };
  }, [getFilteredData]);

  const getRangeName = () => {
    if (dateRange === 'custom') return `${customDateFrom} to ${customDateTo}`;
    return dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
  };

  // Export functions
  const exportToCSV = () => {
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    const { filteredIncome, filteredExpenses } = getFilteredData;
    
    let csv = `${businessName} - Balance Sheet (Profit & Loss Statement)\n`;
    csv += `Period: ${getRangeName()}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csv += `SUMMARY\n`;
    csv += `Total Income,${formatPrice(stats.totalIncome)}\n`;
    csv += `Total Expenses,${formatPrice(stats.totalExpenses)}\n`;
    csv += `Net ${stats.isProfitable ? 'Profit' : 'Loss'},${formatPrice(Math.abs(stats.netProfitLoss))}\n`;
    csv += `Profit Margin,${stats.profitMargin.toFixed(2)}%\n\n`;
    
    csv += `INCOME BREAKDOWN\n`;
    csv += `Source,Amount\n`;
    csv += `POS Sales,${formatPrice(stats.incomeBreakdown.pos)}\n`;
    csv += `Appointments,${formatPrice(stats.incomeBreakdown.appointments)}\n`;
    csv += `Bookings,${formatPrice(stats.incomeBreakdown.bookings)}\n`;
    csv += `Services,${formatPrice(stats.incomeBreakdown.services)}\n`;
    csv += `Products,${formatPrice(stats.incomeBreakdown.products)}\n\n`;
    
    csv += `PAYMENT METHOD BREAKDOWN\n`;
    csv += `Method,Amount\n`;
    csv += `Cash,${formatPrice(stats.paymentBreakdown.cash)}\n`;
    csv += `Card,${formatPrice(stats.paymentBreakdown.card)}\n`;
    csv += `UPI,${formatPrice(stats.paymentBreakdown.upi)}\n\n`;
    
    csv += `DETAILED TRANSACTIONS\n`;
    csv += `Date,Type,Description,Amount,Customer\n`;
    filteredIncome.forEach(item => {
      csv += `${item.date},Income,"${item.description}",${formatPrice(item.amount)},"${item.customer || 'N/A'}"\n`;
    });
    filteredExpenses.forEach(item => {
      csv += `${item.date},Expense,"${item.description}",${formatPrice(item.amount)},"${item.vendor || 'N/A'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_BalanceSheet_${Date.now()}.csv`;
    a.click();
    
    toast({
      title: '✅ CSV Downloaded',
      description: 'Balance sheet exported successfully',
    });
  };

  const exportToExcel = () => {
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    const { filteredIncome, filteredExpenses } = getFilteredData;
    
    let html = `<html><head><meta charset="utf-8"><style>
      table { border-collapse: collapse; width: 100%; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; font-weight: bold; }
      .header { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
      .summary { margin: 20px 0; background: #f9f9f9; padding: 15px; }
      .profit { color: green; font-weight: bold; }
      .loss { color: red; font-weight: bold; }
    </style></head><body>`;
    
    html += `<div class="header">${businessName} - Balance Sheet (Profit & Loss)</div>`;
    html += `<div class="summary">`;
    html += `<p><strong>Period:</strong> ${getRangeName()}</p>`;
    html += `<p><strong>Total Income:</strong> ${formatPrice(stats.totalIncome)}</p>`;
    html += `<p><strong>Total Expenses:</strong> ${formatPrice(stats.totalExpenses)}</p>`;
    html += `<p class="${stats.isProfitable ? 'profit' : 'loss'}"><strong>Net ${stats.isProfitable ? 'Profit' : 'Loss'}:</strong> ${formatPrice(Math.abs(stats.netProfitLoss))}</p>`;
    html += `<p><strong>Profit Margin:</strong> ${stats.profitMargin.toFixed(2)}%</p>`;
    html += `</div>`;
    
    html += `<h3>Payment Method Breakdown</h3>`;
    html += `<table><tr><th>Method</th><th>Amount</th></tr>`;
    html += `<tr><td>Cash</td><td>${formatPrice(stats.paymentBreakdown.cash)}</td></tr>`;
    html += `<tr><td>Card</td><td>${formatPrice(stats.paymentBreakdown.card)}</td></tr>`;
    html += `<tr><td>UPI</td><td>${formatPrice(stats.paymentBreakdown.upi)}</td></tr>`;
    html += `</table>`;
    
    html += `<h3>Transactions</h3>`;
    html += `<table><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr>`;
    
    filteredIncome.forEach(item => {
      html += `<tr><td>${item.date}</td><td>Income</td><td>${item.description}</td><td>${formatPrice(item.amount)}</td></tr>`;
    });
    filteredExpenses.forEach(item => {
      html += `<tr><td>${item.date}</td><td>Expense</td><td>${item.description}</td><td>${formatPrice(item.amount)}</td></tr>`;
    });
    
    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_BalanceSheet_${Date.now()}.xls`;
    a.click();

    toast({
      title: '✅ Excel Downloaded',
      description: 'Balance sheet exported successfully',
    });
  };

  const exportToPDF = () => {
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    const { filteredIncome, filteredExpenses } = getFilteredData;
    
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text(businessName, 20, y);
    y += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Balance Sheet (Profit & Loss Statement)', 20, y);
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
    doc.text('Financial Summary', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Income: ${formatPrice(stats.totalIncome)}`, 25, y); y += 6;
    doc.text(`Total Expenses: ${formatPrice(stats.totalExpenses)}`, 25, y); y += 6;
    if (stats.isProfitable) {
      doc.setTextColor(34, 197, 94);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`Net ${stats.isProfitable ? 'Profit' : 'Loss'}: ${formatPrice(Math.abs(stats.netProfitLoss))}`, 25, y); y += 6;
    doc.setTextColor(0, 0, 0);
    doc.text(`Profit Margin: ${stats.profitMargin.toFixed(2)}%`, 25, y);
    y += 15;

    // Income Breakdown
    doc.setFontSize(14);
    doc.text('Income Breakdown', 20, y);
    y += 8;
    doc.setFontSize(10);
    Object.entries(stats.incomeBreakdown).forEach(([source, amount]) => {
      if (amount > 0) {
        doc.text(`${source.charAt(0).toUpperCase() + source.slice(1)}: ${formatPrice(amount)}`, 25, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      }
    });
    y += 10;

    // Payment Method Breakdown
    doc.setFontSize(14);
    doc.text('Payment Method Breakdown', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Cash: ${formatPrice(stats.paymentBreakdown.cash)}`, 25, y); y += 6;
    doc.text(`Card: ${formatPrice(stats.paymentBreakdown.card)}`, 25, y); y += 6;
    doc.text(`UPI: ${formatPrice(stats.paymentBreakdown.upi)}`, 25, y);
    y += 10;

    // Transaction summary
    doc.setFontSize(14);
    doc.text('Transaction Summary', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Income Transactions: ${filteredIncome.length}`, 25, y); y += 6;
    doc.text(`Expense Transactions: ${filteredExpenses.length}`, 25, y);

    doc.save(`${businessName}_BalanceSheet_${Date.now()}.pdf`);
    
    toast({
      title: '✅ PDF Downloaded',
      description: 'Balance sheet exported successfully',
    });
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
          <h1 className="text-3xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-slate-600 mt-1">Spa & Salon Profit & Loss Statement</p>
        </div>
        <Button
          onClick={() => setShowReportDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Detailed Report
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
              className={dateRange === 'today' ? 'bg-blue-600' : ''}
            >
              Today
            </Button>
            <Button
              variant={dateRange === 'week' ? 'default' : 'outline'}
              onClick={() => setDateRange('week')}
              className={dateRange === 'week' ? 'bg-blue-600' : ''}
            >
              This Week
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'outline'}
              onClick={() => setDateRange('month')}
              className={dateRange === 'month' ? 'bg-blue-600' : ''}
            >
              This Month
            </Button>
            <Button
              variant={dateRange === 'year' ? 'default' : 'outline'}
              onClick={() => setDateRange('year')}
              className={dateRange === 'year' ? 'bg-blue-600' : ''}
            >
              This Year
            </Button>
            <Button
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              onClick={() => setDateRange('custom')}
              className={dateRange === 'custom' ? 'bg-blue-600' : ''}
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
      </motion.div>

      {/* Payment Method Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Payment Method:</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={paymentFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setPaymentFilter('all')}
              className={paymentFilter === 'all' ? 'bg-blue-600' : ''}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={paymentFilter === 'cash' ? 'default' : 'outline'}
              onClick={() => setPaymentFilter('cash')}
              className={paymentFilter === 'cash' ? 'bg-green-600' : ''}
            >
              💵 Cash
            </Button>
            <Button
              size="sm"
              variant={paymentFilter === 'card' ? 'default' : 'outline'}
              onClick={() => setPaymentFilter('card')}
              className={paymentFilter === 'card' ? 'bg-purple-600' : ''}
            >
              💳 Card
            </Button>
            <Button
              size="sm"
              variant={paymentFilter === 'upi' ? 'default' : 'outline'}
              onClick={() => setPaymentFilter('upi')}
              className={paymentFilter === 'upi' ? 'bg-orange-600' : ''}
            >
              📱 UPI
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
              <ArrowUpRight className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-green-500">
              {getRangeName()}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600">Total Income</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatPrice(stats.totalIncome)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.transactionCounts.income} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowDownRight className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.totalExpenses)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.transactionCounts.expenses} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl border-2 p-6 shadow-sm ${
            stats.isProfitable 
              ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50'
              : 'border-orange-200 bg-gradient-to-br from-orange-50 to-red-50'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
              stats.isProfitable ? 'bg-blue-500' : 'bg-orange-500'
            }`}>
              {stats.isProfitable ? (
                <TrendingUp className="h-6 w-6 text-white" />
              ) : (
                <TrendingDown className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">Net {stats.isProfitable ? 'Profit' : 'Loss'}</p>
          <p className={`text-3xl font-bold mt-2 ${
            stats.isProfitable ? 'text-blue-600' : 'text-orange-600'
          }`}>
            {formatPrice(Math.abs(stats.netProfitLoss))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Income - Expenses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">Profit Margin</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.profitMargin.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.isProfitable ? 'Healthy margins' : 'Needs improvement'}
          </p>
        </motion.div>
      </div>

      {/* Profit/Loss Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-xl border-2 p-6 shadow-lg ${
          stats.isProfitable 
            ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' 
            : 'border-orange-300 bg-gradient-to-r from-orange-50 to-red-50'
        }`}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {stats.isProfitable ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-600" />
              )}
              <h3 className="text-xl font-bold text-slate-900">
                {stats.isProfitable ? 'Profitable Period' : 'Loss Period'}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Income:</span>
                <span className="font-semibold text-green-600">{formatPrice(stats.totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Expenses:</span>
                <span className="font-semibold text-red-600">- {formatPrice(stats.totalExpenses)}</span>
              </div>
              <div className="h-px bg-slate-300 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Net Result:</span>
                <span className={`font-bold text-lg ${
                  stats.isProfitable ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {stats.isProfitable ? '+' : ''}{formatPrice(stats.netProfitLoss)}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowReportDialog(true)}
            className={stats.isProfitable ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Report
          </Button>
        </div>
      </motion.div>

      {/* Export Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap gap-3"
      >
        <Button onClick={exportToCSV} variant="outline" className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={exportToExcel} variant="outline" className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Button onClick={exportToPDF} variant="outline" className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </motion.div>

      {/* Breakdowns Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Income Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-green-600" />
            Income Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.incomeBreakdown).map(([source, amount]) => (
              <div key={source} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700 capitalize">{source}</span>
                <span className="text-sm font-semibold text-green-600">{formatPrice(amount)}</span>
              </div>
            ))}
            {Object.keys(stats.incomeBreakdown).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No income data for selected period</p>
            )}
          </div>
        </motion.div>

        {/* Payment Method Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            Payment Method Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                💵 Cash
              </span>
              <span className="text-sm font-semibold text-slate-900">{formatPrice(stats.paymentBreakdown.cash)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                💳 Card
              </span>
              <span className="text-sm font-semibold text-slate-900">{formatPrice(stats.paymentBreakdown.card)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                📱 UPI
              </span>
              <span className="text-sm font-semibold text-slate-900">{formatPrice(stats.paymentBreakdown.upi)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Profit & Loss Statement - {getRangeName()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className={`rounded-lg p-4 ${
              stats.isProfitable ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 mb-1">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalIncome)}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatPrice(stats.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Net {stats.isProfitable ? 'Profit' : 'Loss'}</p>
                  <p className={`text-2xl font-bold ${stats.isProfitable ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatPrice(Math.abs(stats.netProfitLoss))}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Profit Margin</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.profitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Breakdown Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Income Details */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  Income Sources
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.incomeBreakdown).map(([source, amount]) => (
                    <div key={source} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="capitalize text-slate-700">{source}</span>
                      <span className="font-semibold text-green-600">{formatPrice(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Details */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  Payment Methods
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-slate-700">💵 Cash</span>
                    <span className="font-semibold text-slate-900">{formatPrice(stats.paymentBreakdown.cash)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-slate-700">💳 Card</span>
                    <span className="font-semibold text-slate-900">{formatPrice(stats.paymentBreakdown.card)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="text-slate-700">📱 UPI</span>
                    <span className="font-semibold text-slate-900">{formatPrice(stats.paymentBreakdown.upi)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Recent Income</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {getFilteredData.filteredIncome?.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="p-2 bg-green-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.source}</span>
                        <span className="text-green-600">{formatPrice(item.amount)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Recent Expenses</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {getFilteredData.filteredExpenses?.slice(0, 10).map((expense, idx) => (
                    <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{expense.description}</span>
                        <span className="text-red-600">{formatPrice(expense.amount)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={exportToCSV} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={exportToExcel} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}