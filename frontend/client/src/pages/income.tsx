import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Download,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  PieChart,
  BarChart3,
  FileText,
  ShoppingCart,
  Scissors,
  CalendarDays,
  Package,
  Users,
  Filter,
  ChevronDown,
  TrendingDown,
  Activity,
  Target,
  CreditCard,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { jsPDF } from 'jspdf';

interface IncomeData {
  id: string;
  source: 'pos' | 'appointment' | 'booking' | 'product' | 'service';
  description: string;
  amount: number; // in cents
  date: string;
  customer: string;
  paymentMethod?: string;
  staff?: string;
  items?: any[];
}

type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function Income() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [allIncomeData, setAllIncomeData] = useState<IncomeData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'pos' | 'appointment' | 'booking' | 'product' | 'service'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'all' | 'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('all');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'overall' | 'pos' | 'appointment' | 'booking' | 'product' | 'service'>('overall');

  useEffect(() => {
    loadAllIncomeData();
  }, [selectedWorkspace]);

  const loadAllIncomeData = () => {
    const allIncome: IncomeData[] = [];
    
    // Load POS Transactions
    try {
      const posTransactions = localStorage.getItem('pos_transactions');
      if (posTransactions) {
        const transactions = JSON.parse(posTransactions);
        transactions.forEach((tx: any) => {
          if (tx.status === 'Completed') {
            allIncome.push({
              id: tx.id,
              source: 'pos',
              description: `POS Sale - ${tx.items?.length || 0} items`,
              amount: tx.amount || 0,
              date: tx.date,
              customer: tx.customer?.name || 'Walk-in Customer',
              paymentMethod: tx.paymentMethod,
              staff: tx.staff,
              items: tx.items,
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading POS transactions:', e);
    }

    // Load Appointments (paid ones)
    try {
      const appointments = localStorage.getItem('zervos_appointments');
      if (appointments) {
        const appts = JSON.parse(appointments);
        appts.forEach((apt: any) => {
          if (apt.paymentStatus === 'paid' && apt.billedAmount) {
            allIncome.push({
              id: apt.id,
              source: 'appointment',
              description: `Appointment - ${apt.serviceName || apt.customService || 'Service'}`,
              amount: Math.round((apt.billedAmount || 0) * 100),
              date: apt.billedAt || apt.date,
              customer: apt.customerName || 'Customer',
              staff: apt.assignedStaff,
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading appointments:', e);
    }

    // Load Bookings (from booking pages)
    try {
      const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
      const bookings = localStorage.getItem(`bookings_${currentWorkspace}`);
      if (bookings) {
        const bookingData = JSON.parse(bookings);
        if (Array.isArray(bookingData)) {
          bookingData.forEach((booking: any) => {
            if (booking.status === 'confirmed' || booking.status === 'completed') {
              allIncome.push({
                id: booking.id,
                source: 'booking',
                description: `Booking - ${booking.serviceName || 'Service'}`,
                amount: booking.amount ? Math.round(booking.amount * 100) : 0,
                date: booking.date || booking.createdAt,
                customer: booking.customerName || booking.name || 'Customer',
              });
            }
          });
        }
      }
    } catch (e) {
      console.error('Error loading bookings:', e);
    }

    // Load Product Sales (from POS with product items)
    try {
      const posTransactions = localStorage.getItem('pos_transactions');
      if (posTransactions) {
        const transactions = JSON.parse(posTransactions);
        transactions.forEach((tx: any) => {
          if (tx.status === 'Completed' && tx.items) {
            tx.items.forEach((item: any) => {
              if (item.productId?.startsWith('product-')) {
                allIncome.push({
                  id: `${tx.id}-${item.productId}`,
                  source: 'product',
                  description: `Product - ${item.name || 'Product'}`,
                  amount: (item.price || 0) * (item.qty || 1),
                  date: tx.date,
                  customer: tx.customer?.name || 'Walk-in Customer',
                  paymentMethod: tx.paymentMethod,
                  staff: item.assignedPerson || tx.staff,
                });
              }
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading product sales:', e);
    }

    // Load Services
    try {
      const servicesData = localStorage.getItem('zervos_services');
      if (servicesData) {
        const services = JSON.parse(servicesData);
        services.forEach((service: any) => {
          if (service.isActive !== false) {
            allIncome.push({
              id: `service-${service.id}`,
              source: 'service',
              description: `Service - ${service.name || 'Service'}`,
              amount: service.price || 0,
              date: service.createdAt || new Date().toISOString(),
              customer: service.customerName || 'Customer',
              paymentMethod: service.paymentMethod || 'Cash',
              staff: service.assignedStaff || 'Staff',
            });
          }
        });
      }
    } catch (e) {
      console.error('Error loading services:', e);
    }

    // Sort by date (newest first)
    allIncome.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllIncomeData(allIncome);
  };

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

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

    return allIncomeData.filter(item => {
      const itemDate = new Date(item.date);
      const matchesDate = itemDate >= startDate && itemDate <= endDate;
      const matchesSource = selectedSource === 'all' || item.source === selectedSource;
      const matchesPaymentMethod = selectedPaymentMethod === 'all' || item.paymentMethod === selectedPaymentMethod;
      return matchesDate && matchesSource && matchesPaymentMethod;
    });
  }, [allIncomeData, dateRange, customDateFrom, customDateTo, selectedSource, selectedPaymentMethod]);

  // Calculate statistics
  const stats = useMemo(() => {
    const filtered = getFilteredData;
    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    const posIncome = filtered.filter(i => i.source === 'pos').reduce((sum, i) => sum + i.amount, 0);
    const appointmentIncome = filtered.filter(i => i.source === 'appointment').reduce((sum, i) => sum + i.amount, 0);
    const bookingIncome = filtered.filter(i => i.source === 'booking').reduce((sum, i) => sum + i.amount, 0);
    const productIncome = filtered.filter(i => i.source === 'product').reduce((sum, i) => sum + i.amount, 0);
    const serviceIncome = filtered.filter(i => i.source === 'service').reduce((sum, i) => sum + i.amount, 0);
    
    // Payment method breakdown
    const paymentBreakdown = {
      Cash: filtered.filter(i => i.paymentMethod === 'Cash').reduce((sum, i) => sum + i.amount, 0),
      UPI: filtered.filter(i => i.paymentMethod === 'UPI').reduce((sum, i) => sum + i.amount, 0),
      Card: filtered.filter(i => i.paymentMethod === 'Card').reduce((sum, i) => sum + i.amount, 0),
      'Bank Transfer': filtered.filter(i => i.paymentMethod === 'Bank Transfer').reduce((sum, i) => sum + i.amount, 0),
    };
    
    return {
      total,
      posIncome,
      appointmentIncome,
      bookingIncome,
      productIncome,
      serviceIncome,
      paymentBreakdown,
      transactionCount: filtered.length,
      avgTransaction: filtered.length > 0 ? total / filtered.length : 0,
    };
  }, [getFilteredData]);

  // Generate report data
  const generateReport = (type: typeof selectedReport) => {
    const filtered = getFilteredData;
    
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
        breakdown: {
          pos: { amount: stats.posIncome, count: filtered.filter(i => i.source === 'pos').length },
          appointments: { amount: stats.appointmentIncome, count: filtered.filter(i => i.source === 'appointment').length },
          bookings: { amount: stats.bookingIncome, count: filtered.filter(i => i.source === 'booking').length },
          products: { amount: stats.productIncome, count: filtered.filter(i => i.source === 'product').length },
          services: { amount: stats.serviceIncome, count: filtered.filter(i => i.source === 'service').length },
        },
        paymentBreakdown: stats.paymentBreakdown,
        transactions: filtered,
      };
    } else {
      const sourceData = filtered.filter(i => i.source === type);
      return {
        ...reportData,
        type,
        transactions: sourceData,
        total: sourceData.reduce((sum, i) => sum + i.amount, 0),
        transactionCount: sourceData.length,
      };
    }
  };

  // Export functions
  const exportToCSV = () => {
    const report = generateReport(selectedReport);
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';
    
    let csv = `${businessName} - Income Report\n`;
    csv += `Report Type: ${selectedReport.toUpperCase()}\n`;
    csv += `Date Range: ${report.dateRange}\n`;
    csv += `Generated: ${report.generatedAt}\n`;
    csv += `Total Income: ${formatPrice(report.total)}\n`;
    csv += `Transactions: ${report.transactionCount}\n\n`;

    if (selectedReport === 'overall' && 'breakdown' in report) {
      csv += `INCOME BREAKDOWN\n`;
      csv += `Source,Amount,Count,Percentage\n`;
      Object.entries(report.breakdown).forEach(([key, value]: [string, any]) => {
        const percentage = report.total > 0 ? ((value.amount / report.total) * 100).toFixed(2) : '0';
        csv += `${key},${formatPrice(value.amount)},${value.count},${percentage}%\n`;
      });
      csv += `\n`;
    }

    csv += `DETAILED TRANSACTIONS\n`;
    csv += `Date,Source,Description,Customer,Amount,Payment Method,Staff\n`;
    report.transactions.forEach((tx: IncomeData) => {
      csv += `${tx.date},${tx.source},${tx.description},"${tx.customer}",${formatPrice(tx.amount)},${tx.paymentMethod || 'N/A'},${tx.staff || 'N/A'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_Income_Report_${selectedReport}_${Date.now()}.csv`;
    a.click();
    
    toast({
      title: '✅ CSV Downloaded',
      description: 'Income report exported successfully',
    });
  };

  const exportToExcel = () => {
    const report = generateReport(selectedReport);
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">`;
    html += `<head><meta charset="UTF-8"><style>table { border-collapse: collapse; } th, td { border: 1px solid black; padding: 8px; }</style></head><body>`;
    html += `<table>`;
    html += `<tr><td colspan="7" style="font-size:18px;font-weight:bold">${businessName} - Income Report</td></tr>`;
    html += `<tr><td colspan="7">Report Type: ${selectedReport.toUpperCase()}</td></tr>`;
    html += `<tr><td colspan="7">Date Range: ${report.dateRange}</td></tr>`;
    html += `<tr><td colspan="7">Total Income: ${formatPrice(report.total)}</td></tr>`;
    html += `<tr><td colspan="7">Transactions: ${report.transactionCount}</td></tr>`;
    html += `<tr></tr>`;

    if (selectedReport === 'overall' && 'breakdown' in report) {
      html += `<tr><td colspan="7" style="font-weight:bold;background:#f0f0f0">INCOME BREAKDOWN</td></tr>`;
      html += `<tr><th>Source</th><th>Amount</th><th>Count</th><th>Percentage</th></tr>`;
      Object.entries(report.breakdown).forEach(([key, value]: [string, any]) => {
        const percentage = report.total > 0 ? ((value.amount / report.total) * 100).toFixed(2) : '0';
        html += `<tr><td>${key}</td><td>${formatPrice(value.amount)}</td><td>${value.count}</td><td>${percentage}%</td></tr>`;
      });
      html += `<tr></tr>`;
    }

    html += `<tr><td colspan="7" style="font-weight:bold;background:#f0f0f0">DETAILED TRANSACTIONS</td></tr>`;
    html += `<tr><th>Date</th><th>Source</th><th>Description</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Staff</th></tr>`;
    report.transactions.forEach((tx: IncomeData) => {
      html += `<tr>`;
      html += `<td>${new Date(tx.date).toLocaleDateString()}</td>`;
      html += `<td>${tx.source}</td>`;
      html += `<td>${tx.description}</td>`;
      html += `<td>${tx.customer}</td>`;
      html += `<td>${formatPrice(tx.amount)}</td>`;
      html += `<td>${tx.paymentMethod || 'N/A'}</td>`;
      html += `<td>${tx.staff || 'N/A'}</td>`;
      html += `</tr>`;
    });
    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}_Income_Report_${selectedReport}_${Date.now()}.xls`;
    a.click();

    toast({
      title: '✅ Excel Downloaded',
      description: 'Income report exported successfully',
    });
  };

  const exportToPDF = () => {
    const report = generateReport(selectedReport);
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
    doc.text(`Income Report - ${selectedReport.toUpperCase()}`, 20, y);
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
    doc.text(`Total Income: ${formatPrice(report.total)}`, 25, y); y += 6;
    doc.text(`Total Transactions: ${report.transactionCount}`, 25, y); y += 6;
    doc.text(`Average Transaction: ${formatPrice(report.avgTransaction)}`, 25, y);
    y += 15;

    // Breakdown for overall report
    if (selectedReport === 'overall' && 'breakdown' in report) {
      doc.setFontSize(14);
      doc.text('Income Breakdown by Source', 20, y);
      y += 8;
      doc.setFontSize(10);
      Object.entries(report.breakdown).forEach(([key, value]: [string, any]) => {
        const percentage = report.total > 0 ? ((value.amount / report.total) * 100).toFixed(2) : '0';
        doc.text(`${key}: ${formatPrice(value.amount)} (${value.count} transactions, ${percentage}%)`, 25, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      y += 10;

      // Payment Method Breakdown
      if (report.paymentBreakdown) {
        doc.setFontSize(14);
        doc.text('Payment Method Breakdown', 20, y);
        y += 8;
        doc.setFontSize(10);
        Object.entries(report.paymentBreakdown).forEach(([method, amount]: [string, any]) => {
          const percentage = report.total > 0 ? ((amount / report.total) * 100).toFixed(2) : '0';
          doc.text(`${method}: ${formatPrice(amount)} (${percentage}%)`, 25, y);
          y += 6;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
        y += 10;
      }
    }

    // Top transactions
    doc.setFontSize(14);
    doc.text('Recent Transactions', 20, y);
    y += 8;
    doc.setFontSize(9);
    report.transactions.slice(0, 20).forEach((tx: IncomeData) => {
      doc.text(`${new Date(tx.date).toLocaleDateString()} - ${tx.description}: ${formatPrice(tx.amount)}`, 25, y);
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`${businessName}_Income_Report_${selectedReport}_${Date.now()}.pdf`);
    
    toast({
      title: '✅ PDF Downloaded',
      description: 'Income report exported successfully',
    });
  };

  const getRangeName = () => {
    if (dateRange === 'custom') return 'Custom Range';
    return dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
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
            <h1 className="text-3xl font-bold text-slate-900">Income Analytics</h1>
            <p className="text-slate-600 mt-1">Comprehensive revenue tracking from all sources</p>
          </div>
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
                className={dateRange === 'today' ? 'bg-brand-600' : ''}
              >
                Today
              </Button>
              <Button
                variant={dateRange === 'week' ? 'default' : 'outline'}
                onClick={() => setDateRange('week')}
                className={dateRange === 'week' ? 'bg-brand-600' : ''}
              >
                This Week
              </Button>
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'}
                onClick={() => setDateRange('month')}
                className={dateRange === 'month' ? 'bg-brand-600' : ''}
              >
                This Month
              </Button>
              <Button
                variant={dateRange === 'year' ? 'default' : 'outline'}
                onClick={() => setDateRange('year')}
                className={dateRange === 'year' ? 'bg-brand-600' : ''}
              >
                This Year
              </Button>
              <Button
                variant={dateRange === 'custom' ? 'default' : 'outline'}
                onClick={() => setDateRange('custom')}
                className={dateRange === 'custom' ? 'bg-brand-600' : ''}
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
              <Label className="text-sm text-slate-600">Filter by source:</Label>
            </div>
            <Select value={selectedSource} onValueChange={(value: any) => setSelectedSource(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="pos">POS Sales</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="booking">Bookings</SelectItem>
                <SelectItem value="product">Product Sales</SelectItem>
                <SelectItem value="service">Services</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />
              <Label className="text-sm text-slate-600">Payment method:</Label>
            </div>
            <Select value={selectedPaymentMethod} onValueChange={(value: any) => setSelectedPaymentMethod(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-green-500">
                {getRangeName()}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-600">Total Income</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatPrice(stats.total)}</p>
            <p className="text-xs text-slate-500 mt-1">{stats.transactionCount} transactions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">POS Sales</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.posIncome)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0 ? ((stats.posIncome / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">Appointments</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.appointmentIncome)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0 ? ((stats.appointmentIncome / stats.total) * 100).toFixed(1) : 0}% of total
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
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.productIncome)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0 ? ((stats.productIncome / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Scissors className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">Services</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(stats.serviceIncome)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0 ? ((stats.serviceIncome / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
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
              <h2 className="text-xl font-bold text-slate-900">Detailed Income Reports</h2>
              <p className="text-sm text-slate-600 mt-1">Generate comprehensive reports by category</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Overall Report */}
            <button
              onClick={() => {
                setSelectedReport('overall');
                setShowReportDialog(true);
              }}
              className="p-6 rounded-xl border-2 border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all group"
            >
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Overall Report</h3>
              <p className="text-xs text-slate-500">All income sources</p>
              <p className="text-lg font-bold text-brand-600 mt-2">{formatPrice(stats.total)}</p>
            </button>

            {/* POS Report */}
            <button
              onClick={() => {
                setSelectedReport('pos');
                setShowReportDialog(true);
              }}
              className="p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">POS Sales</h3>
              <p className="text-xs text-slate-500">Point of sale</p>
              <p className="text-lg font-bold text-blue-600 mt-2">{formatPrice(stats.posIncome)}</p>
            </button>

            {/* Appointments Report */}
            <button
              onClick={() => {
                setSelectedReport('appointment');
                setShowReportDialog(true);
              }}
              className="p-6 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all group"
            >
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Appointments</h3>
              <p className="text-xs text-slate-500">Scheduled services</p>
              <p className="text-lg font-bold text-purple-600 mt-2">{formatPrice(stats.appointmentIncome)}</p>
            </button>

            {/* Bookings Report */}
            <button
              onClick={() => {
                setSelectedReport('booking');
                setShowReportDialog(true);
              }}
              className="p-6 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Bookings</h3>
              <p className="text-xs text-slate-500">Online bookings</p>
              <p className="text-lg font-bold text-green-600 mt-2">{formatPrice(stats.bookingIncome)}</p>
            </button>

            {/* Products Report */}
            <button
              onClick={() => {
                setSelectedReport('product');
                setShowReportDialog(true);
              }}
              className="p-6 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:shadow-lg transition-all group"
            >
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Products</h3>
              <p className="text-xs text-slate-500">Product sales</p>
              <p className="text-lg font-bold text-orange-600 mt-2">{formatPrice(stats.productIncome)}</p>
            </button>

            {/* Services Report */}
            <button
              onClick={() => {
                setSelectedReport('service');
                setShowReportDialog(true);
              }}
              className="p-6 rounded-xl border-2 border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all group"
            >
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Scissors className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Services</h3>
              <p className="text-xs text-slate-500">Service revenue</p>
              <p className="text-lg font-bold text-teal-600 mt-2">{formatPrice(stats.serviceIncome)}</p>
            </button>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-sm text-slate-600 mt-1">Latest {Math.min(getFilteredData.length, 20)} transactions</p>
          </div>
          
          {getFilteredData.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No transactions found</h3>
              <p className="text-sm text-slate-500">
                No income recorded for the selected date range
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {getFilteredData.slice(0, 20).map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          item.source === 'pos' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                          item.source === 'appointment' ? 'border-purple-300 text-purple-700 bg-purple-50' :
                          item.source === 'booking' ? 'border-green-300 text-green-700 bg-green-50' :
                          item.source === 'service' ? 'border-teal-300 text-teal-700 bg-teal-50' :
                          'border-orange-300 text-orange-700 bg-orange-50'
                        }>
                          {item.source === 'pos' && <ShoppingCart className="h-3 w-3 mr-1" />}
                          {item.source === 'appointment' && <CalendarDays className="h-3 w-3 mr-1" />}
                          {item.source === 'booking' && <Calendar className="h-3 w-3 mr-1" />}
                          {item.source === 'product' && <Package className="h-3 w-3 mr-1" />}
                          {item.source === 'service' && <Scissors className="h-3 w-3 mr-1" />}
                          {item.source}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{item.description}</div>
                        {item.paymentMethod && (
                          <div className="text-xs text-slate-500">{item.paymentMethod}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.customer}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-green-600">
                          {formatPrice(item.amount)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6 text-brand-600" />
                {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Income Report
              </DialogTitle>
            </DialogHeader>

            {(() => {
              const report = generateReport(selectedReport);
              
              return (
                <div className="space-y-6 py-4">
                  {/* Report Header */}
                  <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl p-6 border border-brand-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Period</p>
                        <p className="font-semibold text-slate-900">{report.dateRange}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Total Income</p>
                        <p className="text-lg font-bold text-green-600">{formatPrice(report.total)}</p>
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
                  {selectedReport === 'overall' && 'breakdown' in report && (
                    <>
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b">
                          <h3 className="font-semibold text-slate-900">Income Breakdown by Source</h3>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(report.breakdown).map(([key, value]: [string, any]) => {
                              const percentage = report.total > 0 ? ((value.amount / report.total) * 100).toFixed(1) : '0';
                              const Icon = key === 'pos' ? ShoppingCart :
                                         key === 'appointments' ? CalendarDays :
                                         key === 'bookings' ? Calendar :
                                         key === 'services' ? Scissors : Package;
                              const color = key === 'pos' ? 'blue' :
                                          key === 'appointments' ? 'purple' :
                                          key === 'bookings' ? 'green' :
                                          key === 'services' ? 'teal' : 'orange';
                              
                              return (
                                <div key={key} className={`p-4 rounded-lg border-2 border-${color}-200 bg-${color}-50`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`h-5 w-5 text-${color}-600`} />
                                    <span className="font-medium text-slate-900 capitalize">{key}</span>
                                  </div>
                                  <p className={`text-2xl font-bold text-${color}-600`}>{formatPrice(value.amount)}</p>
                                  <p className="text-xs text-slate-600 mt-1">{value.count} transactions • {percentage}%</p>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.entries(report.paymentBreakdown).map(([method, amount]: [string, any]) => {
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
                    </>
                  )}

                  {/* Transactions List */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b">
                      <h3 className="font-semibold text-slate-900">Transaction Details</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Customer</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {report.transactions.map((tx: IncomeData) => (
                            <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-xs text-slate-600">
                                {new Date(tx.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm">{tx.description}</td>
                              <td className="px-4 py-2 text-sm text-slate-600">{tx.customer}</td>
                              <td className="px-4 py-2 text-right text-sm font-semibold text-green-600">
                                {formatPrice(tx.amount)}
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

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Close
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={exportToExcel}
                variant="outline"
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button
                onClick={exportToPDF}
                variant="outline"
                className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
