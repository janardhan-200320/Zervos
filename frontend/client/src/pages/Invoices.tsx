import { useState, useMemo, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Download,
  Eye,
  Trash2,
  FileText,
  DollarSign,
  TrendingUp,
  Filter,
  Calendar,
  Mail,
  Plus,
  Receipt,
  FileCheck,
  CheckSquare,
  Square,
  X,
  BarChart3,
  FileSpreadsheet,
  ChevronDown,
  Clock,
  CalendarDays,
  CalendarRange,
  Users,
  CreditCard,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  MessageCircle,
  MessageSquare,
  Send,
  MoreVertical,
  Printer,
  ExternalLink,
  Copy,
  Share2,
} from 'lucide-react';
import {
  getAllInvoices,
  getInvoiceStats,
  deleteInvoice,
  downloadInvoiceHTML,
  type Invoice,
} from '@/lib/invoice-utils';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { POSInvoice } from '@/components/POSInvoice';
import { useToast } from '@/hooks/use-toast';
import ReactDOM from 'react-dom/client';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  notifyPaymentReceived,
  notifyPaymentPending,
  notifyPaymentOverdue,
} from '@/lib/notificationHelpers';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';

export default function InvoicesPage() {
  const { toast } = useToast();
  const notifications = useNotifications();
  const [invoices, setInvoices] = useState<Invoice[]>(getAllInvoices());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isReportsDialogOpen, setIsReportsDialogOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customReportDates, setCustomReportDates] = useState({ from: '', to: '' });

  const stats = useMemo(() => getInvoiceStats(), [invoices]);

  // Analytics data
  const analyticsData = useMemo(() => {
    // Revenue trend by month
    const monthlyRevenue = invoices.reduce((acc: any, invoice) => {
      const date = new Date(invoice.dateIssued);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = { month: monthYear, revenue: 0, count: 0 };
      }
      
      if (invoice.status === 'Paid') {
        acc[monthYear].revenue += invoice.amount;
        acc[monthYear].count += 1;
      }
      
      return acc;
    }, {});

    const revenueByMonth = Object.values(monthlyRevenue).slice(-6); // Last 6 months

    // Payment status breakdown
    const statusBreakdown = [
      { name: 'Paid', value: stats.paid, color: '#10b981' },
      { name: 'Pending', value: stats.pending, color: '#f59e0b' },
      { name: 'Cancelled', value: stats.cancelled || 0, color: '#ef4444' },
    ];

    // Top customers
    const customerRevenue = invoices.reduce((acc: any, invoice) => {
      if (invoice.status === 'Paid') {
        const customer = invoice.customer.name;
        if (!acc[customer]) {
          acc[customer] = { name: customer, revenue: 0 };
        }
        acc[customer].revenue += invoice.amount;
      }
      return acc;
    }, {});

    const topCustomers = Object.values(customerRevenue)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      revenueByMonth,
      statusBreakdown: statusBreakdown.filter(s => s.value > 0),
      topCustomers,
    };
  }, [invoices, stats]);

  // Get filtered invoices based on report period
  const getFilteredInvoicesByPeriod = () => {
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

    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.dateIssued);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  };

  // Generate comprehensive invoice report
  const generateInvoiceReport = () => {
    const filteredInvoices = getFilteredInvoicesByPeriod();
    const totalInvoices = filteredInvoices.length;
    const paidInvoices = filteredInvoices.filter(i => i.status === 'Paid');
    const pendingInvoices = filteredInvoices.filter(i => i.status === 'Pending');
    const cancelledInvoices = filteredInvoices.filter(i => i.status === 'Cancelled');
    
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
    const cancelledAmount = cancelledInvoices.reduce((sum, i) => sum + i.amount, 0);
    const averageInvoiceValue = totalInvoices > 0 ? (totalRevenue + pendingAmount) / totalInvoices : 0;
    
    // Payment method breakdown
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {};
    paidInvoices.forEach(invoice => {
      const method = invoice.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += invoice.amount;
    });

    // Customer breakdown
    const customerBreakdown: { [key: string]: { count: number; amount: number } } = {};
    filteredInvoices.forEach(invoice => {
      const customer = invoice.customer.name;
      if (!customerBreakdown[customer]) {
        customerBreakdown[customer] = { count: 0, amount: 0 };
      }
      customerBreakdown[customer].count += 1;
      if (invoice.status === 'Paid') {
        customerBreakdown[customer].amount += invoice.amount;
      }
    });

    const topCustomers = Object.entries(customerBreakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Daily revenue trend
    const dailyRevenue: { [key: string]: number } = {};
    paidInvoices.forEach(invoice => {
      const date = new Date(invoice.dateIssued).toLocaleDateString('en-IN');
      dailyRevenue[date] = (dailyRevenue[date] || 0) + invoice.amount;
    });

    // Service/Product breakdown
    const itemBreakdown: { [key: string]: { count: number; amount: number } } = {};
    filteredInvoices.forEach(invoice => {
      const itemName = invoice.service?.name || 'Unknown Service';
      if (!itemBreakdown[itemName]) {
        itemBreakdown[itemName] = { count: 0, amount: 0 };
      }
      itemBreakdown[itemName].count += 1;
      if (invoice.status === 'Paid') {
        itemBreakdown[itemName].amount += invoice.amount || 0;
      }
    });

    const topItems = Object.entries(itemBreakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const periodLabel = reportPeriod === 'today' ? 'Today' :
                        reportPeriod === 'week' ? 'Last 7 Days' :
                        reportPeriod === 'month' ? 'Last 30 Days' :
                        reportPeriod === 'year' ? 'Last 12 Months' :
                        `${customReportDates.from} to ${customReportDates.to}`;

    return {
      period: periodLabel,
      summary: {
        totalInvoices,
        paidCount: paidInvoices.length,
        pendingCount: pendingInvoices.length,
        cancelledCount: cancelledInvoices.length,
        totalRevenue,
        pendingAmount,
        cancelledAmount,
        averageInvoiceValue,
        collectionRate: totalInvoices > 0 ? ((paidInvoices.length / totalInvoices) * 100).toFixed(1) : '0',
      },
      paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage: paidInvoices.length > 0 ? ((data.count / paidInvoices.length) * 100).toFixed(1) : '0',
      })),
      topCustomers,
      topItems,
      dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })),
      allInvoices: filteredInvoices.map(invoice => ({
        id: invoice.invoiceId,
        customer: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone || '',
        amount: invoice.amount,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod || '',
        dateIssued: invoice.dateIssued,
        items: invoice.service?.name || '',
      })),
      recommendations: [
        pendingInvoices.length > 5 ? `${pendingInvoices.length} invoices pending - consider follow-up reminders` : null,
        cancelledInvoices.length > 0 ? `${cancelledInvoices.length} cancelled invoices worth ₹${cancelledAmount.toLocaleString('en-IN')}` : null,
        topCustomers.length > 0 && topCustomers[0].amount > totalRevenue * 0.3 ? `${topCustomers[0].name} contributes ${((topCustomers[0].amount / totalRevenue) * 100).toFixed(0)}% of revenue - diversify customer base` : null,
      ].filter(Boolean),
    };
  };

  // Download invoice report as CSV
  const downloadInvoiceReportCSV = () => {
    const report = generateInvoiceReport();
    const lines: string[] = [];
    
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('INVOICE ANALYTICS REPORT');
    lines.push(`Period: ${report.period}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    
    lines.push('EXECUTIVE SUMMARY');
    lines.push('-----------------');
    lines.push(`Total Invoices,${report.summary.totalInvoices}`);
    lines.push(`Paid Invoices,${report.summary.paidCount}`);
    lines.push(`Pending Invoices,${report.summary.pendingCount}`);
    lines.push(`Cancelled Invoices,${report.summary.cancelledCount}`);
    lines.push(`Total Revenue,₹${report.summary.totalRevenue.toLocaleString('en-IN')}`);
    lines.push(`Pending Amount,₹${report.summary.pendingAmount.toLocaleString('en-IN')}`);
    lines.push(`Average Invoice Value,₹${report.summary.averageInvoiceValue.toLocaleString('en-IN')}`);
    lines.push(`Collection Rate,${report.summary.collectionRate}%`);
    lines.push('');
    
    lines.push('PAYMENT METHODS');
    lines.push('---------------');
    lines.push('Method,Count,Amount,Percentage');
    report.paymentMethods.forEach(pm => {
      lines.push(`${pm.method},${pm.count},₹${pm.amount.toLocaleString('en-IN')},${pm.percentage}%`);
    });
    lines.push('');
    
    lines.push('TOP CUSTOMERS');
    lines.push('-------------');
    lines.push('Customer,Invoices,Revenue');
    report.topCustomers.forEach(c => {
      lines.push(`"${c.name}",${c.count},₹${c.amount.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('INVOICE DETAILS');
    lines.push('---------------');
    lines.push('Invoice ID,Customer,Email,Phone,Amount,Status,Payment Method,Date,Items');
    report.allInvoices.forEach(inv => {
      lines.push(`"${inv.id}","${inv.customer}","${inv.email}","${inv.phone}",₹${inv.amount.toLocaleString('en-IN')},"${inv.status}","${inv.paymentMethod}","${inv.dateIssued}","${inv.items}"`);
    });
    
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_Report_${report.period.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: '📊 Report Downloaded',
      description: 'Invoice report saved as CSV file',
    });
  };

  // Download invoice report as Excel
  const downloadInvoiceReportExcel = () => {
    const report = generateInvoiceReport();
    const lines: string[] = [];
    
    lines.push('INVOICE ANALYTICS REPORT');
    lines.push(`Period:\t${report.period}`);
    lines.push(`Generated:\t${new Date().toLocaleString()}`);
    lines.push('');
    
    lines.push('SUMMARY METRICS');
    lines.push('Metric\tValue');
    lines.push(`Total Invoices\t${report.summary.totalInvoices}`);
    lines.push(`Paid Invoices\t${report.summary.paidCount}`);
    lines.push(`Pending Invoices\t${report.summary.pendingCount}`);
    lines.push(`Cancelled Invoices\t${report.summary.cancelledCount}`);
    lines.push(`Total Revenue\t₹${report.summary.totalRevenue.toLocaleString('en-IN')}`);
    lines.push(`Pending Amount\t₹${report.summary.pendingAmount.toLocaleString('en-IN')}`);
    lines.push(`Cancelled Amount\t₹${report.summary.cancelledAmount.toLocaleString('en-IN')}`);
    lines.push(`Average Invoice Value\t₹${report.summary.averageInvoiceValue.toLocaleString('en-IN')}`);
    lines.push(`Collection Rate\t${report.summary.collectionRate}%`);
    lines.push('');
    
    lines.push('PAYMENT METHODS');
    lines.push('Method\tCount\tAmount\tPercentage');
    report.paymentMethods.forEach(pm => {
      lines.push(`${pm.method}\t${pm.count}\t₹${pm.amount.toLocaleString('en-IN')}\t${pm.percentage}%`);
    });
    lines.push('');
    
    lines.push('TOP CUSTOMERS');
    lines.push('Customer\tInvoices\tRevenue');
    report.topCustomers.forEach(c => {
      lines.push(`${c.name}\t${c.count}\t₹${c.amount.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('TOP SERVICES/PRODUCTS');
    lines.push('Item\tCount\tRevenue');
    report.topItems.forEach(item => {
      lines.push(`${item.name}\t${item.count}\t₹${item.amount.toLocaleString('en-IN')}`);
    });
    lines.push('');
    
    lines.push('COMPLETE INVOICE LIST');
    lines.push('Invoice ID\tCustomer\tEmail\tPhone\tAmount\tStatus\tPayment Method\tDate\tItems');
    report.allInvoices.forEach(inv => {
      lines.push(`${inv.id}\t${inv.customer}\t${inv.email}\t${inv.phone}\t₹${inv.amount.toLocaleString('en-IN')}\t${inv.status}\t${inv.paymentMethod}\t${inv.dateIssued}\t${inv.items}`);
    });
    
    const excelContent = lines.join('\n');
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_Report_${report.period.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    
    toast({
      title: '📊 Report Downloaded',
      description: 'Invoice report saved as Excel file',
    });
  };

  // Download invoice report as PDF
  const downloadInvoiceReportPDF = () => {
    const report = generateInvoiceReport();
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
    
    // Title
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Analytics Report', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${report.period}`, pageWidth / 2, 32, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });
    
    yPosition = 60;
    doc.setTextColor(0, 0, 0);
    
    // Executive Summary
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition - 5, contentWidth, 60, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, yPosition - 5, contentWidth, 60, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Summary', margin + 5, yPosition + 5);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const col1 = margin + 5;
    const col2 = margin + 60;
    const col3 = margin + 115;
    
    doc.setTextColor(100, 116, 139);
    doc.text('Total Invoices:', col1, yPosition);
    doc.text('Paid:', col2, yPosition);
    doc.text('Pending:', col3, yPosition);
    yPosition += 8;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(report.summary.totalInvoices.toString(), col1, yPosition);
    doc.text(report.summary.paidCount.toString(), col2, yPosition);
    doc.text(report.summary.pendingCount.toString(), col3, yPosition);
    
    yPosition += 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Total Revenue:', col1, yPosition);
    doc.text('Pending Amount:', col2, yPosition);
    doc.text('Collection Rate:', col3, yPosition);
    yPosition += 8;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${report.summary.totalRevenue.toLocaleString('en-IN')}`, col1, yPosition);
    doc.text(`₹${report.summary.pendingAmount.toLocaleString('en-IN')}`, col2, yPosition);
    doc.text(`${report.summary.collectionRate}%`, col3, yPosition);
    
    yPosition += 25;
    
    // Payment Methods
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('Payment Methods', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Method', margin, yPosition);
    doc.text('Count', margin + 50, yPosition);
    doc.text('Amount', margin + 80, yPosition);
    doc.text('Share', margin + 130, yPosition);
    yPosition += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPosition, margin + contentWidth, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    report.paymentMethods.forEach(pm => {
      checkNewPage(10);
      doc.text(pm.method, margin, yPosition);
      doc.text(pm.count.toString(), margin + 50, yPosition);
      doc.text(`₹${pm.amount.toLocaleString('en-IN')}`, margin + 80, yPosition);
      doc.text(`${pm.percentage}%`, margin + 130, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Top Customers
    checkNewPage(70);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('Top Customers', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Customer', margin, yPosition);
    doc.text('Invoices', margin + 80, yPosition);
    doc.text('Revenue', margin + 120, yPosition);
    yPosition += 2;
    doc.line(margin, yPosition, margin + contentWidth, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    report.topCustomers.slice(0, 5).forEach(c => {
      checkNewPage(10);
      doc.text(c.name.substring(0, 35), margin, yPosition);
      doc.text(c.count.toString(), margin + 80, yPosition);
      doc.text(`₹${c.amount.toLocaleString('en-IN')}`, margin + 120, yPosition);
      yPosition += 8;
    });
    
    // Invoice Details Page
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', pageWidth / 2, 18, { align: 'center' });
    
    yPosition = 45;
    
    // Table headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(71, 85, 105);
    doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
    
    doc.text('Invoice ID', margin + 2, yPosition);
    doc.text('Customer', margin + 35, yPosition);
    doc.text('Amount', margin + 85, yPosition);
    doc.text('Status', margin + 120, yPosition);
    doc.text('Date', margin + 150, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7);
    
    report.allInvoices.slice(0, 30).forEach((inv, idx) => {
      checkNewPage(10);
      
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPosition - 4, contentWidth, 8, 'F');
      }
      
      doc.text(inv.id.substring(0, 15), margin + 2, yPosition);
      doc.text(inv.customer.substring(0, 25), margin + 35, yPosition);
      doc.text(`₹${inv.amount.toLocaleString('en-IN')}`, margin + 85, yPosition);
      doc.text(inv.status, margin + 120, yPosition);
      doc.text(inv.dateIssued, margin + 150, yPosition);
      
      yPosition += 8;
    });
    
    if (report.allInvoices.length > 30) {
      yPosition += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`... and ${report.allInvoices.length - 30} more invoices`, margin, yPosition);
    }
    
    // Recommendations
    if (report.recommendations.length > 0) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Insights & Recommendations', pageWidth / 2, 18, { align: 'center' });
      
      yPosition = 50;
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      
      report.recommendations.forEach((rec, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}.`, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(rec as string, margin + 10, yPosition);
        yPosition += 12;
      });
    }
    
    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
    }
    
    doc.save(`Invoice_Report_${report.period.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: '📊 Report Downloaded',
      description: 'Invoice report saved as PDF file',
    });
  };

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.service.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase();

      // Date range filter
      const matchesDateRange = (() => {
        if (!dateRange.from && !dateRange.to) return true;
        const invoiceDate = new Date(invoice.dateIssued);
        if (dateRange.from && new Date(dateRange.from) > invoiceDate) return false;
        if (dateRange.to && new Date(dateRange.to) < invoiceDate) return false;
        return true;
      })();

      // Amount range filter
      const matchesAmountRange = (() => {
        if (!amountRange.min && !amountRange.max) return true;
        if (amountRange.min && invoice.amount < parseFloat(amountRange.min)) return false;
        if (amountRange.max && invoice.amount > parseFloat(amountRange.max)) return false;
        return true;
      })();

      return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange;
    });
  }, [invoices, searchQuery, statusFilter, dateRange, amountRange]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    // Open the modal so user can download PDF
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
    
    toast({
      title: 'Invoice Opened',
      description: 'Click "Download PDF" button to save as PDF',
      duration: 3000,
    });
  };

  const handleSendEmail = async (invoice: Invoice) => {
    const { sendInvoiceEmail, logInvoiceEmail } = await import('@/lib/email-service');
    
    const success = await sendInvoiceEmail({
      to: invoice.customer.email,
      customerName: invoice.customer.name,
      invoiceId: invoice.invoiceId,
      amount: invoice.amount,
      currency: invoice.currency,
    });
    
    if (success) {
      logInvoiceEmail(invoice.invoiceId, invoice.customer.email);
      
      // Trigger notification for email sent
      notifications.addNotification({
        type: 'payment',
        title: 'Invoice Emailed',
        message: `Invoice ${invoice.invoiceId} sent to ${invoice.customer.name}`,
        priority: 'low',
        metadata: {
          bookingId: invoice.invoiceId,
          customerId: invoice.customer.email,
        },
      });
      
      toast({
        title: 'Email Sent!',
        description: `Invoice sent to ${invoice.customer.email}`,
      });
    } else {
      toast({
        title: 'Email Failed',
        description: 'Please configure email settings first',
        variant: 'destructive',
      });
    }
  };

  // Send invoice via WhatsApp
  const handleSendWhatsApp = (invoice: Invoice) => {
    const phone = invoice.customer.phone?.replace(/[^0-9]/g, '') || '';
    if (!phone) {
      toast({
        title: 'No Phone Number',
        description: 'Customer phone number is not available',
        variant: 'destructive',
      });
      return;
    }

    const message = encodeURIComponent(
      `*Invoice ${invoice.invoiceId}*\n\n` +
      `Dear ${invoice.customer.name},\n\n` +
      `Thank you for your business!\n\n` +
      `📋 *Invoice Details:*\n` +
      `• Service: ${invoice.service.name}\n` +
      `• Amount: ${invoice.currency}${invoice.amount.toFixed(2)}\n` +
      `• Status: ${invoice.status}\n` +
      `• Date: ${new Date(invoice.dateIssued).toLocaleDateString()}\n\n` +
      `For any queries, please contact us.\n\n` +
      `Best regards,\n${invoice.company?.name || 'Our Team'}`
    );

    const whatsappUrl = `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: '📱 WhatsApp Opened',
      description: `Sending invoice to ${invoice.customer.name}`,
    });
  };

  // Send invoice via SMS
  const handleSendSMS = (invoice: Invoice) => {
    const phone = invoice.customer.phone?.replace(/[^0-9]/g, '') || '';
    if (!phone) {
      toast({
        title: 'No Phone Number',
        description: 'Customer phone number is not available',
        variant: 'destructive',
      });
      return;
    }

    const message = encodeURIComponent(
      `Invoice ${invoice.invoiceId} - ${invoice.service.name}: ${invoice.currency}${invoice.amount.toFixed(2)} (${invoice.status}). Thank you! - ${invoice.company?.name || 'Our Team'}`
    );

    // Try SMS URL scheme (works on mobile devices)
    const smsUrl = `sms:${phone}?body=${message}`;
    window.open(smsUrl, '_self');

    toast({
      title: '💬 SMS Ready',
      description: `Opening SMS for ${invoice.customer.name}`,
    });
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const success = deleteInvoice(invoiceId);
      if (success) {
        setInvoices(getAllInvoices());
        setSelectedInvoices(prev => {
          const updated = new Set(prev);
          updated.delete(invoiceId);
          return updated;
        });
        toast({
          title: 'Deleted',
          description: 'Invoice has been deleted',
        });
      }
    }
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.invoiceId)));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      const updated = new Set(prev);
      if (updated.has(invoiceId)) {
        updated.delete(invoiceId);
      } else {
        updated.add(invoiceId);
      }
      return updated;
    });
  };

  const handleBulkDelete = () => {
    if (selectedInvoices.size === 0) return;
    
    if (window.confirm(`Delete ${selectedInvoices.size} invoice(s)?`)) {
      selectedInvoices.forEach(invoiceId => deleteInvoice(invoiceId));
      setInvoices(getAllInvoices());
      setSelectedInvoices(new Set());
      setBulkActionMode(false);
      
      toast({
        title: 'Deleted',
        description: `${selectedInvoices.size} invoice(s) deleted`,
      });
    }
  };

  const handleBulkEmail = async () => {
    if (selectedInvoices.size === 0) return;
    
    const { sendInvoiceEmail, logInvoiceEmail } = await import('@/lib/email-service');
    let successCount = 0;
    
    for (const invoiceId of Array.from(selectedInvoices)) {
      const invoice = invoices.find(inv => inv.invoiceId === invoiceId);
      if (invoice) {
        const success = await sendInvoiceEmail({
          to: invoice.customer.email,
          customerName: invoice.customer.name,
          invoiceId: invoice.invoiceId,
          amount: invoice.amount,
          currency: invoice.currency,
        });
        if (success) {
          logInvoiceEmail(invoice.invoiceId, invoice.customer.email);
          successCount++;
        }
      }
    }
    
    setSelectedInvoices(new Set());
    setBulkActionMode(false);
    
    toast({
      title: 'Emails Sent',
      description: `${successCount} invoice(s) emailed successfully`,
    });
  };

  const handlePrintInvoice = (invoice: Invoice, showTax: boolean) => {
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

      // Transform invoice to transaction format
      const transaction = {
        id: invoice.invoiceId,
        date: invoice.dateIssued,
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email,
          phone: invoice.customer.phone || '',
        },
        items: [{
          name: invoice.service?.name || 'Service',
          qty: 1,
          price: invoice.amount,
          assignedPerson: '',
        }],
        amount: invoice.amount,
        staff: '',
        paymentMethod: invoice.paymentMethod || 'Cash',
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
          transaction={transaction} 
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
                <title>Receipt ${invoice.invoiceId}</title>
                <meta charset="UTF-8">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { 
                    font-family: 'Courier New', monospace; 
                    margin: 0; 
                    padding: 0;
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    min-height: 100vh;
                    padding: 20px;
                  }
                  .receipt-container {
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  }
                  @media print {
                    body { 
                      margin: 0; 
                      padding: 0; 
                      background: white;
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
        title: 'Receipt Generated', 
        description: `${showTax ? 'With Tax' : 'Without Tax'} receipt opened for printing`,
      });
    } catch (error) {
      toast({ title: 'Print Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Manage and track all your billing invoices</p>
          </div>
          <div className="flex gap-2">
            {/* Reports Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <BarChart3 className="mr-2" size={18} />
                  Reports
                  <ChevronDown className="ml-2" size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => { setReportPeriod('today'); setIsReportsDialogOpen(true); }}>
                  <Clock className="mr-2" size={16} />
                  Today's Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReportPeriod('week'); setIsReportsDialogOpen(true); }}>
                  <CalendarDays className="mr-2" size={16} />
                  Weekly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReportPeriod('month'); setIsReportsDialogOpen(true); }}>
                  <Calendar className="mr-2" size={16} />
                  Monthly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReportPeriod('year'); setIsReportsDialogOpen(true); }}>
                  <CalendarRange className="mr-2" size={16} />
                  Yearly Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setReportPeriod('custom'); setIsReportsDialogOpen(true); }}>
                  <Filter className="mr-2" size={16} />
                  Custom Range
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant={showAnalytics ? "default" : "outline"}
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={showAnalytics ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600"}
            >
              <TrendingUp className="mr-2" size={18} />
              Analytics
            </Button>
            <Button 
              variant={bulkActionMode ? "outline" : "ghost"}
              onClick={() => {
                setBulkActionMode(!bulkActionMode);
                setSelectedInvoices(new Set());
              }}
              className="text-gray-600"
            >
              {bulkActionMode ? <X className="mr-2" size={18} /> : <CheckSquare className="mr-2" size={18} />}
              {bulkActionMode ? 'Cancel' : 'Select'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="text-purple-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total Invoices</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.paid}</span>
            </div>
            <p className="text-sm text-gray-600">Paid Invoices</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="text-yellow-600" size={20} />
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
              <span className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(0)}</span>
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analyticsData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                    formatter={(value: any) => [`₹${value.toFixed(0)}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Status Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.statusBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analyticsData.topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                    formatter={(value: any) => [`₹${value.toFixed(0)}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search by invoice ID, customer, or service..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full sm:w-auto"
            >
              <Filter size={16} className="mr-2" />
              {showAdvancedFilters ? 'Hide' : 'More'} Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    placeholder="From"
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    placeholder="To"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                    placeholder="Min"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                    placeholder="Max"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({ from: '', to: '' });
                    setAmountRange({ min: '', max: '' });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Toolbar */}
        {bulkActionMode && selectedInvoices.size > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="text-purple-600" size={20} />
              <span className="font-medium text-gray-900">
                {selectedInvoices.size} invoice{selectedInvoices.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEmail}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Mail size={16} className="mr-2" />
                Email All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-2" />
                Delete All
              </Button>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {bulkActionMode && (
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={handleSelectAll}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {selectedInvoices.size === filteredInvoices.length ? (
                            <CheckSquare size={20} />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.invoiceId} className="hover:bg-gray-50 transition-colors">
                      {bulkActionMode && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectInvoice(invoice.invoiceId)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            {selectedInvoices.has(invoice.invoiceId) ? (
                              <CheckSquare size={20} />
                            ) : (
                              <Square size={20} />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {invoice.invoiceId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.customer.name}</div>
                          <div className="text-sm text-gray-500">{invoice.customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {invoice.customer.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{invoice.service.name}</div>
                        <div className="text-xs text-gray-500">{invoice.service.duration}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(invoice.dateIssued).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">
                          {invoice.currency}{invoice.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {/* View & Details */}
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                              <Eye size={16} className="mr-2 text-gray-600" />
                              View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(invoice.invoiceId);
                              toast({ title: 'Copied!', description: 'Invoice ID copied to clipboard' });
                            }}>
                              <Copy size={16} className="mr-2 text-gray-600" />
                              Copy Invoice ID
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Print Options */}
                            <DropdownMenuItem onClick={() => handlePrintInvoice(invoice, true)}>
                              <Receipt size={16} className="mr-2 text-purple-600" />
                              Print with Tax
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintInvoice(invoice, false)}>
                              <FileText size={16} className="mr-2 text-blue-600" />
                              Print without Tax
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                              <Download size={16} className="mr-2 text-gray-600" />
                              Download PDF
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Send Options */}
                            <DropdownMenuItem onClick={() => handleSendEmail(invoice)}>
                              <Mail size={16} className="mr-2 text-blue-600" />
                              Send via Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendWhatsApp(invoice)}>
                              <MessageCircle size={16} className="mr-2 text-green-600" />
                              Send via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendSMS(invoice)}>
                              <MessageSquare size={16} className="mr-2 text-cyan-600" />
                              Send via SMS
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Delete */}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteInvoice(invoice.invoiceId)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Invoices will appear here when customers complete paid bookings'}
              </p>
            </div>
          )}
        </div>

        {/* View Invoice Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <InvoiceTemplate
                invoice={selectedInvoice}
                onClose={() => setIsViewModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Reports Dialog */}
        <Dialog open={isReportsDialogOpen} onOpenChange={setIsReportsDialogOpen}>
          <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                Invoice Analytics Report
              </DialogTitle>
              <DialogDescription>
                Comprehensive invoice report with insights and analytics
              </DialogDescription>
            </DialogHeader>

            {/* Period Selector */}
            <div className="flex flex-wrap items-center gap-3 py-4 border-b">
              <span className="text-sm font-medium text-gray-600">Period:</span>
              <div className="flex gap-2">
                {[
                  { value: 'today', label: 'Today', icon: Clock },
                  { value: 'week', label: 'Week', icon: CalendarDays },
                  { value: 'month', label: 'Month', icon: Calendar },
                  { value: 'year', label: 'Year', icon: CalendarRange },
                  { value: 'custom', label: 'Custom', icon: Filter },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={reportPeriod === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReportPeriod(value as any)}
                    className={reportPeriod === value ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    <Icon className="mr-1" size={14} />
                    {label}
                  </Button>
                ))}
              </div>
              {reportPeriod === 'custom' && (
                <div className="flex gap-2 items-center ml-auto">
                  <Input
                    type="date"
                    value={customReportDates.from}
                    onChange={(e) => setCustomReportDates({ ...customReportDates, from: e.target.value })}
                    className="w-40"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    value={customReportDates.to}
                    onChange={(e) => setCustomReportDates({ ...customReportDates, to: e.target.value })}
                    className="w-40"
                  />
                </div>
              )}
            </div>

            {(() => {
              const report = generateInvoiceReport();
              return (
                <div className="space-y-6 py-4">
                  {/* Executive Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <FileText className="h-8 w-8 opacity-80" />
                        <span className="text-3xl font-bold">{report.summary.totalInvoices}</span>
                      </div>
                      <p className="text-sm mt-2 opacity-90">Total Invoices</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <CheckCircle2 className="h-8 w-8 opacity-80" />
                        <span className="text-3xl font-bold">{report.summary.paidCount}</span>
                      </div>
                      <p className="text-sm mt-2 opacity-90">Paid Invoices</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <AlertCircle className="h-8 w-8 opacity-80" />
                        <span className="text-3xl font-bold">{report.summary.pendingCount}</span>
                      </div>
                      <p className="text-sm mt-2 opacity-90">Pending</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <DollarSign className="h-8 w-8 opacity-80" />
                        <span className="text-2xl font-bold">₹{report.summary.totalRevenue.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-sm mt-2 opacity-90">Total Revenue</p>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <CreditCard className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Pending Amount</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">₹{report.summary.pendingAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Cancelled</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">{report.summary.cancelledCount}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Collection Rate</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">{report.summary.collectionRate}%</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Receipt className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Avg Invoice Value</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">₹{report.summary.averageInvoiceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {/* Payment Methods & Top Customers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-slate-900">Payment Methods</h3>
                      </div>
                      <div className="space-y-3">
                        {report.paymentMethods.length > 0 ? (
                          report.paymentMethods.map((pm, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'][idx % 5] }}
                                />
                                <span className="text-sm text-slate-700">{pm.method}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-900">₹{pm.amount.toLocaleString('en-IN')}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{pm.percentage}%</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4">No payment data available</p>
                        )}
                      </div>
                    </div>

                    {/* Top Customers */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">Top Customers</h3>
                      </div>
                      <div className="space-y-3">
                        {report.topCustomers.length > 0 ? (
                          report.topCustomers.slice(0, 5).map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <span className="text-sm text-slate-700 truncate max-w-[150px]">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{c.count} inv</span>
                                <span className="text-sm font-medium text-slate-900">₹{c.amount.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4">No customer data available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice List Preview */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-slate-600" />
                          <h3 className="font-semibold text-slate-900">Invoice Details</h3>
                        </div>
                        <span className="text-sm text-slate-500">{report.allInvoices.length} invoices</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Invoice ID</th>
                            <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Customer</th>
                            <th className="text-right text-xs font-semibold text-slate-600 px-4 py-3">Amount</th>
                            <th className="text-center text-xs font-semibold text-slate-600 px-4 py-3">Status</th>
                            <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Payment</th>
                            <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.allInvoices.slice(0, 10).map((inv, idx) => (
                            <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm font-medium text-purple-600">{inv.id.substring(0, 12)}...</td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{inv.customer}</p>
                                  <p className="text-xs text-slate-500">{inv.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">₹{inv.amount.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                  inv.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{inv.paymentMethod || '-'}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{inv.dateIssued}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {report.allInvoices.length > 10 && (
                        <div className="bg-slate-50 px-4 py-3 text-center border-t border-slate-100">
                          <span className="text-sm text-slate-500">
                            +{report.allInvoices.length - 10} more invoices (download report for full list)
                          </span>
                        </div>
                      )}
                      {report.allInvoices.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm text-slate-500">No invoices found for this period</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {report.recommendations.length > 0 && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <h3 className="font-semibold text-amber-900">Insights & Recommendations</h3>
                      </div>
                      <ul className="space-y-2">
                        {report.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                            <ArrowUpRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Download Options */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Download className="h-5 w-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Download Report</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Export the complete invoice report in your preferred format
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        onClick={downloadInvoiceReportCSV}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                      <Button
                        onClick={downloadInvoiceReportExcel}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Excel
                      </Button>
                      <Button
                        onClick={downloadInvoiceReportPDF}
                        className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setIsReportsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
