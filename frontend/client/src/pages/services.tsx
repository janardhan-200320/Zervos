import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Clock, DollarSign, Tag, MoreVertical, Sparkles, Search, Link2, Copy, Check, Upload, FileSpreadsheet, ShoppingCart, FileText, Download, BarChart3, TrendingUp, Users, Calendar, Eye, X, PieChart, Package2, CalendarDays, Filter, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  actualPrice?: string; // Original/MRP price
  offerPrice?: string; // Discounted/selling price
  barcode?: string; // Barcode for scanner
  currency: string;
  description: string;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  // Package-specific fields (optional)
  packageServices?: string[];
  originalPrice?: string;
  discount?: string;
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
];

const getCurrencySymbol = (code: string) => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency?.symbol || '₹';
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageServices, setPackageServices] = useState<string[]>([]);
  const [packageDiscount, setPackageDiscount] = useState('10');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    actualPrice: '',
    offerPrice: '',
    barcode: '',
    currency: 'INR',
    description: '',
    category: '',
  });

  const defaultCategories = ['Spa & Wellness', 'Beauty & Salon', 'Fitness & Training', 'Consultation', 'Treatment', 'Workshop', 'Other'];
  
  // Combine default and custom categories
  const categories = [...defaultCategories, ...customCategories];

  // Load custom categories from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('zervos_custom_service_categories');
    if (savedCategories) {
      setCustomCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Save custom category
  const addCustomCategory = () => {
    if (customCategoryName.trim() && !categories.includes(customCategoryName.trim())) {
      const newCategories = [...customCategories, customCategoryName.trim()];
      setCustomCategories(newCategories);
      localStorage.setItem('zervos_custom_service_categories', JSON.stringify(newCategories));
      setFormData({ ...formData, category: customCategoryName.trim() });
      setCustomCategoryName('');
      setIsCustomCategory(false);
      toast({
        title: '✅ Category Added',
        description: `"${customCategoryName.trim()}" has been added to categories`,
      });
    }
  };

  // Reports state
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [servicesReportPeriod, setServicesReportPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customServicesReportDates, setCustomServicesReportDates] = useState({ from: '', to: '' });

  // Get filtered services based on report period
  const getFilteredServicesByPeriod = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (servicesReportPeriod) {
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
        startDate = customServicesReportDates.from ? new Date(customServicesReportDates.from) : new Date(now);
        endDate = customServicesReportDates.to ? new Date(customServicesReportDates.to) : new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    return services.filter(service => {
      const createdDate = new Date(service.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });
  };

  // Generate Services Report Data
  const generateServicesReport = () => {
    const filtered = getFilteredServicesByPeriod();
    const periodLabel = servicesReportPeriod === 'today' ? 'Today' :
                        servicesReportPeriod === 'week' ? 'Last 7 Days' :
                        servicesReportPeriod === 'month' ? 'Last 30 Days' :
                        servicesReportPeriod === 'year' ? 'Last 12 Months' :
                        `${customServicesReportDates.from} to ${customServicesReportDates.to}`;
    
    const totalServices = filtered.length;
    const enabledServices = filtered.filter(s => s.isEnabled).length;
    const disabledServices = filtered.filter(s => !s.isEnabled).length;
    const packageServices = filtered.filter(s => s.category === 'Package');
    
    // Category breakdown as array
    const categoryMap: Record<string, { count: number; totalRevenue: number }> = {};
    filtered.forEach(s => {
      if (!categoryMap[s.category]) {
        categoryMap[s.category] = { count: 0, totalRevenue: 0 };
      }
      categoryMap[s.category].count++;
      categoryMap[s.category].totalRevenue += parseFloat(s.price) || 0;
    });
    
    const categoryBreakdown = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      count: data.count,
      totalRevenue: data.totalRevenue,
      percentage: totalServices > 0 ? Math.round((data.count / totalServices) * 100) : 0
    }));

    // Price analysis
    const prices = filtered.map(s => parseFloat(s.price) || 0);
    const totalRevenue = prices.reduce((a, b) => a + b, 0);
    const averagePrice = totalServices > 0 ? Math.round(totalRevenue / totalServices) : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const validPrices = prices.filter(p => p > 0);
    const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

    // Duration analysis
    const durations = filtered.map(s => parseInt(s.duration) || 0);
    const averageDuration = totalServices > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / totalServices) : 0;

    // Package services formatted
    const packages = packageServices.map(s => ({
      name: s.name,
      category: s.category,
      price: parseFloat(s.price) || 0,
      discount: 10 // Default discount for packages
    }));

    // All services formatted
    const allServices = filtered.map(s => ({
      name: s.name,
      category: s.category,
      price: parseFloat(s.price) || 0,
      duration: parseInt(s.duration) || 0,
      enabled: s.isEnabled
    }));

    // Recommendations
    const recommendations: string[] = [];
    if (disabledServices > totalServices * 0.3 && totalServices > 0) {
      recommendations.push(`Consider enabling ${disabledServices} disabled services to increase offerings`);
    }
    if (highestPrice > averagePrice * 3 && averagePrice > 0) {
      recommendations.push(`You have premium services priced significantly higher than average - consider marketing them`);
    }
    if (categoryBreakdown.length < 3) {
      recommendations.push(`Add more service categories to diversify your offerings`);
    }

    return {
      period: periodLabel,
      summary: {
        totalServices,
        enabledServices,
        disabledServices,
        totalRevenue,
        averagePrice,
        highestPrice,
        lowestPrice,
        averageDuration
      },
      categoryBreakdown,
      packages,
      allServices,
      recommendations
    };
  };

  // Download Services Report as CSV
  const downloadServicesCSV = () => {
    const report = generateServicesReport();
    let csvContent = 'SERVICES REPORT\n';
    csvContent += `Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}\n\n`;
    
    // Summary Section
    csvContent += 'SUMMARY\n';
    csvContent += `Total Services,${report.summary.totalServices}\n`;
    csvContent += `Active Services,${report.summary.enabledServices}\n`;
    csvContent += `Inactive Services,${report.summary.disabledServices}\n`;
    csvContent += `Total Revenue Potential,₹${report.summary.totalRevenue.toLocaleString('en-IN')}\n`;
    csvContent += `Average Price,₹${report.summary.averagePrice}\n`;
    csvContent += `Highest Price,₹${report.summary.highestPrice.toLocaleString('en-IN')}\n`;
    csvContent += `Lowest Price,₹${report.summary.lowestPrice.toLocaleString('en-IN')}\n`;
    csvContent += `Average Duration,${report.summary.averageDuration} mins\n\n`;

    // Category Breakdown
    csvContent += 'CATEGORY BREAKDOWN\n';
    csvContent += 'Category,Count,Total Value,Percentage\n';
    report.categoryBreakdown.forEach(cat => {
      csvContent += `${cat.name},${cat.count},₹${cat.totalRevenue.toLocaleString('en-IN')},${cat.percentage}%\n`;
    });
    csvContent += '\n';

    // Services List
    csvContent += 'DETAILED SERVICES LIST\n';
    csvContent += 'Service Name,Category,Price (₹),Duration,Status\n';
    report.allServices.forEach(s => {
      csvContent += `"${s.name}","${s.category}",${s.price},"${s.duration} mins",${s.enabled ? 'Active' : 'Inactive'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Services_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: '📥 CSV Downloaded', description: 'Services report has been downloaded' });
  };

  // Download Services Report as Excel (TSV format for Excel compatibility)
  const downloadServicesExcel = () => {
    const report = generateServicesReport();
    let content = 'SERVICES REPORT\t\t\t\t\n';
    content += `Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}\t\t\t\t\n\n`;
    
    content += 'SUMMARY\t\t\t\t\n';
    content += `Metric\tValue\t\t\t\n`;
    content += `Total Services\t${report.summary.totalServices}\t\t\t\n`;
    content += `Active Services\t${report.summary.enabledServices}\t\t\t\n`;
    content += `Inactive Services\t${report.summary.disabledServices}\t\t\t\n`;
    content += `Total Revenue Potential\t₹${report.summary.totalRevenue.toLocaleString('en-IN')}\t\t\t\n`;
    content += `Average Price\t₹${report.summary.averagePrice}\t\t\t\n`;
    content += `Average Duration\t${report.summary.averageDuration} mins\t\t\t\n\n`;

    content += 'CATEGORY BREAKDOWN\t\t\t\t\n';
    content += 'Category\tCount\tTotal Value\tPercentage\t\n';
    report.categoryBreakdown.forEach(cat => {
      content += `${cat.name}\t${cat.count}\t₹${cat.totalRevenue.toLocaleString('en-IN')}\t${cat.percentage}%\t\n`;
    });
    content += '\n';

    content += 'DETAILED SERVICES LIST\t\t\t\t\n';
    content += 'Service Name\tCategory\tPrice (₹)\tDuration\tStatus\n';
    report.allServices.forEach(s => {
      content += `${s.name}\t${s.category}\t${s.price}\t${s.duration} mins\t${s.enabled ? 'Active' : 'Inactive'}\n`;
    });

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Services_Report_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    toast({ title: '📥 Excel Downloaded', description: 'Services report has been downloaded' });
  };

  // Download Services Report as PDF (HTML-based printable)
  const downloadServicesPDF = () => {
    const report = generateServicesReport();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Services Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #7C3AED; border-bottom: 3px solid #7C3AED; padding-bottom: 10px; }
          h2 { color: #4F46E5; margin-top: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); padding: 20px; border-radius: 12px; text-align: center; }
          .summary-card h3 { font-size: 24px; color: #7C3AED; margin: 0; }
          .summary-card p { color: #6B7280; margin: 5px 0 0 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); color: white; padding: 12px; text-align: left; }
          td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; }
          tr:nth-child(even) { background: #F9FAFB; }
          .status-active { color: #059669; font-weight: 600; }
          .status-inactive { color: #DC2626; font-weight: 600; }
          .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📊 Services Report</h1>
        <p style="color: #6B7280;">Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>${report.summary.totalServices}</h3>
            <p>Total Services</p>
          </div>
          <div class="summary-card">
            <h3>${report.summary.enabledServices}</h3>
            <p>Active Services</p>
          </div>
          <div class="summary-card">
            <h3>₹${report.summary.totalRevenue.toLocaleString('en-IN')}</h3>
            <p>Revenue Potential</p>
          </div>
          <div class="summary-card">
            <h3>₹${report.summary.averagePrice}</h3>
            <p>Average Price</p>
          </div>
        </div>

        <h2>📁 Category Breakdown</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Count</th><th>Total Value</th><th>Percentage</th></tr>
          </thead>
          <tbody>
            ${report.categoryBreakdown.map(cat => `
              <tr><td>${cat.name}</td><td>${cat.count}</td><td>₹${cat.totalRevenue.toLocaleString('en-IN')}</td><td>${cat.percentage}%</td></tr>
            `).join('')}
          </tbody>
        </table>

        <h2>📋 Detailed Services List</h2>
        <table>
          <thead>
            <tr><th>Service Name</th><th>Category</th><th>Price</th><th>Duration</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${report.allServices.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.category}</td>
                <td>₹${s.price.toLocaleString('en-IN')}</td>
                <td>${s.duration} mins</td>
                <td class="${s.enabled ? 'status-active' : 'status-inactive'}">${s.enabled ? '✓ Active' : '✗ Inactive'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by Zervos Business Suite • ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    toast({ title: '📄 PDF Ready', description: 'Print dialog opened for PDF download' });
  };

  // CSV Template Download Function
  const downloadCSVTemplate = () => {
    const headers = [
      'Service Name',
      'Service Price (₹)',
      'Duration (mins)',
      'Category',
      'Description/Notes'
    ];
    
    const sampleData = [
      ['Swedish Massage', '2500', '60', 'Spa & Wellness', 'Relaxing full body massage'],
      ['Facial Treatment', '1500', '45', 'Beauty & Salon', 'Deep cleansing facial'],
      ['Haircut & Styling', '800', '30', 'Beauty & Salon', 'Professional haircut'],
      ['Deep Tissue Massage', '3500', '90', 'Spa & Wellness', 'Therapeutic deep massage'],
      ['Manicure & Pedicure', '1200', '60', 'Beauty & Salon', 'Complete nail care'],
    ];

    // Create styled CSV content - This is a clean CSV for Excel
    let csvContent = '';
    csvContent += headers.join(',') + '\n';
    sampleData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    // Add empty rows for user to fill
    for (let i = 0; i < 10; i++) {
      csvContent += ',,,,' + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Services_Bulk_Import_Template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '📥 Template Downloaded!',
      description: 'Open in Excel → Select header row → Apply bold & green background. Fill your services and upload!',
      duration: 6000,
    });
  };

  // Parse CSV File
  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log('CSV file content:', text);
      
      const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log('Parsed lines:', lines);
      
      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must contain headers and at least one data row',
          variant: 'destructive',
        });
        return;
      }

      const data = [];
      let headerIndex = -1;

      // Find the service header row
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        console.log(`Line ${i}:`, values);
        
        // Check if this is the service header row (starts with Service Name)
        if (values[0] === 'Service Name' || values[0].toLowerCase().includes('service name')) {
          headerIndex = i;
          const headers = values;
          
          // Parse service rows
          for (let j = i + 1; j < lines.length; j++) {
            const serviceValues = lines[j].split(',').map(v => v.trim().replace(/"/g, ''));
            if (serviceValues[0] && serviceValues[0] !== '') {
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = serviceValues[index] || '';
              });
              data.push(row);
            }
          }
          break;
        }
      }

      if (data.length === 0) {
        console.log('No data found after parsing');
        toast({
          title: 'No Data Found',
          description: 'CSV file does not contain valid data rows. Please check the format.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Parsed data:', data);
      setImportedData(data);
      toast({
        title: '✅ CSV Parsed Successfully',
        description: `Found ${data.length} service entries ready to import`,
      });
    };

    reader.onerror = () => {
      toast({
        title: 'File Read Error',
        description: 'Failed to read the CSV file',
        variant: 'destructive',
      });
    };

    reader.readAsText(file);
  };

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
        return;
      }
      console.log('Parsing CSV file:', file.name);
      setCsvFile(file);
      parseCSVFile(file);
    }
  };

  // Process and import CSV data - Always navigates to POS after import
  const processBulkImport = () => {
    console.log('processBulkImport called');
    console.log('importedData:', importedData);
    
    if (importedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please upload a CSV file first',
        variant: 'destructive',
      });
      return;
    }

    const newServices: Service[] = [];

    // Process service rows
    importedData.forEach((row, index) => {
      // Validate required fields
      if (!row['Service Name'] || !row['Service Price (₹)']) {
        return; // Skip empty rows
      }

      const duration = row['Duration (mins)'] || '30';
      const category = row['Category'] || 'Other';

      const newService: Service = {
        id: `bulk-${Date.now()}-${index}`,
        name: row['Service Name'],
        duration: `${duration} mins`,
        price: row['Service Price (₹)'],
        currency: 'INR',
        description: row['Description/Notes'] || '',
        category: category,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      };

      newServices.push(newService);
    });

    if (newServices.length > 0) {
      saveServices([...services, ...newServices]);
      
      // Store data for POS with prices in cents
      const servicesForPOS = newServices.map(svc => ({
        ...svc,
        price: Math.round(parseFloat(svc.price) * 100) // Convert to cents
      }));

      const bulkData = {
        services: servicesForPOS,
        type: 'services'
      };
      
      localStorage.setItem('bulk_import_data', JSON.stringify(bulkData));
      
      // Close dialog first
      setIsBulkImportOpen(false);
      setCsvFile(null);
      setImportedData([]);
      
      toast({
        title: '✅ Services Imported Successfully!',
        description: `${newServices.length} services added. Opening POS for billing...`,
      });
      
      // Navigate to POS
      setTimeout(() => {
        setLocation('/pos-register');
      }, 500);
    }
  };

  // Recommended service templates
  const recommendedServices: Omit<Service, 'id' | 'createdAt'>[] = [
    // Spa & Wellness
    { name: 'Swedish Massage', duration: '60 mins', price: '2500', currency: 'INR', description: 'Full body relaxation massage with essential oils', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Deep Tissue Massage', duration: '90 mins', price: '3500', currency: 'INR', description: 'Therapeutic massage targeting deep muscle layers', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Hot Stone Therapy', duration: '75 mins', price: '3000', currency: 'INR', description: 'Relaxing massage using heated stones', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Aromatherapy Session', duration: '60 mins', price: '2800', currency: 'INR', description: 'Therapeutic massage with aromatic essential oils', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Body Scrub & Polish', duration: '45 mins', price: '2000', currency: 'INR', description: 'Exfoliating treatment for smooth, glowing skin', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Couples Spa Package', duration: '120 mins', price: '8000', currency: 'INR', description: 'Relaxing spa experience for two', category: 'Spa & Wellness', isEnabled: true },
    
    // Beauty & Salon
    { name: 'Haircut & Styling', duration: '45 mins', price: '800', currency: 'INR', description: 'Professional haircut with styling', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Hair Coloring', duration: '120 mins', price: '4500', currency: 'INR', description: 'Full color treatment with conditioning', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Keratin Treatment', duration: '180 mins', price: '8500', currency: 'INR', description: 'Smoothing and straightening treatment', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Manicure & Pedicure', duration: '60 mins', price: '1200', currency: 'INR', description: 'Complete nail care and polish', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Gel Nails', duration: '45 mins', price: '1000', currency: 'INR', description: 'Long-lasting gel nail application', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Facial Treatment', duration: '60 mins', price: '2500', currency: 'INR', description: 'Deep cleansing and hydrating facial', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Makeup Application', duration: '60 mins', price: '2000', currency: 'INR', description: 'Professional makeup for special occasions', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Eyebrow Threading', duration: '15 mins', price: '100', currency: 'INR', description: 'Precise eyebrow shaping', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Waxing Service', duration: '30 mins', price: '500', currency: 'INR', description: 'Hair removal service', category: 'Beauty & Salon', isEnabled: true },
    
    // Fitness & Training
    { name: 'Personal Training Session', duration: '60 mins', price: '1500', currency: 'INR', description: 'One-on-one fitness training', category: 'Fitness & Training', isEnabled: true },
    { name: 'Group Fitness Class', duration: '45 mins', price: '500', currency: 'INR', description: 'High-energy group workout', category: 'Fitness & Training', isEnabled: true },
    { name: 'Yoga Session', duration: '60 mins', price: '600', currency: 'INR', description: 'Mindful yoga practice for all levels', category: 'Fitness & Training', isEnabled: true },
    { name: 'Pilates Class', duration: '55 mins', price: '800', currency: 'INR', description: 'Core-strengthening pilates workout', category: 'Fitness & Training', isEnabled: true },
    { name: 'Spin Class', duration: '45 mins', price: '600', currency: 'INR', description: 'Indoor cycling workout', category: 'Fitness & Training', isEnabled: true },
    { name: 'HIIT Training', duration: '45 mins', price: '900', currency: 'INR', description: 'High-intensity interval training', category: 'Fitness & Training', isEnabled: true },
    { name: 'Nutrition Consultation', duration: '60 mins', price: '2000', currency: 'INR', description: 'Personalized nutrition planning', category: 'Consultation', isEnabled: true },
    { name: 'Fitness Assessment', duration: '30 mins', price: '1000', currency: 'INR', description: 'Complete fitness evaluation', category: 'Consultation', isEnabled: true },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
    const stored = localStorage.getItem(`zervos_services_${currentWorkspace}`);
    if (stored) {
      setServices(JSON.parse(stored));
    }
  };

  const saveServices = (updatedServices: Service[]) => {
    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
    localStorage.setItem(`zervos_services_${currentWorkspace}`, JSON.stringify(updatedServices));
    setServices(updatedServices);
    // Dispatch event for other components to sync
    window.dispatchEvent(new CustomEvent('services-updated'));
  };

  const handleOpenNew = () => {
    setFormData({ name: '', duration: '', price: '', actualPrice: '', offerPrice: '', barcode: '', currency: 'INR', description: '', category: '' });
    setEditingService(null);
    setIsNewServiceOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price,
      actualPrice: service.actualPrice || '',
      offerPrice: service.offerPrice || '',
      barcode: service.barcode || '',
      currency: service.currency,
      description: service.description,
      category: service.category,
    });
    setEditingService(service);
    setIsNewServiceOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.duration || !formData.price || !formData.category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (editingService) {
      // Update existing service
      const updatedServices = services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...formData }
          : s
      );
      saveServices(updatedServices);
      toast({
        title: 'Service Updated',
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Create new service
      const newService: Service = {
        id: Date.now().toString(),
        ...formData,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      };
      saveServices([...services, newService]);
      toast({
        title: 'Service Added',
        description: `${newService.name} has been added successfully.`,
      });
    }
    setIsNewServiceOpen(false);
  };

  const handleDelete = () => {
    if (!deletingService) return;
    
    const updatedServices = services.filter(s => s.id !== deletingService.id);
    saveServices(updatedServices);
    setIsDeleteDialogOpen(false);
    setDeletingService(null);
    toast({
      title: 'Service Deleted',
      description: `${deletingService.name} has been removed.`,
    });
  };

  const handleToggleEnabled = (id: string) => {
    const updatedServices = services.map(s =>
      s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
    );
    saveServices(updatedServices);
  };

  const openDeleteDialog = (service: Service) => {
    setDeletingService(service);
    setIsDeleteDialogOpen(true);
  };

  const copyBookingURL = (serviceId: string, serviceName: string) => {
    const url = `${window.location.origin}/book/${serviceId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(serviceId);
      toast({
        title: 'Booking Link Copied!',
        description: `Share this link for ${serviceName}`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    });
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Services & Packages</h1>
                <p className="text-gray-600 mt-1">Manage your service offerings</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                  <BarChart3 size={18} />
                  Reports
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => { setServicesReportPeriod('today'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Today's Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setServicesReportPeriod('week'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Weekly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setServicesReportPeriod('month'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Monthly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setServicesReportPeriod('year'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Yearly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setServicesReportPeriod('custom'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Custom Range
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsBulkImportOpen(true)} variant="outline" className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
              <Upload size={18} />
              Import Bulk
            </Button>
            <Button onClick={() => setIsPackageModalOpen(true)} variant="outline" className="gap-2">
              <Tag size={18} />
              Create Package
            </Button>
            <Button onClick={handleOpenNew} className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus size={18} />
              Add Service
            </Button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-400"
          />
        </motion.div>

        {/* Services Grid */}
        <AnimatePresence mode="popLayout">
          {filteredServices.length === 0 && services.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <div className="inline-block p-6 bg-white rounded-3xl shadow-lg mb-4">
                <Sparkles className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first service or load recommended templates</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleOpenNew}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Service
                </Button>
                <Button
                  onClick={() => {
                    const servicesToAdd = recommendedServices.map((service, index) => ({
                      ...service,
                      id: `rec-${Date.now()}-${index}`,
                      createdAt: new Date().toISOString(),
                    }));
                    saveServices(servicesToAdd);
                    toast({
                      title: 'Recommended Services Loaded',
                      description: `${servicesToAdd.length} service templates have been added to your catalog.`,
                    });
                  }}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Load Recommended Services
                </Button>
              </div>
            </motion.div>
          ) : filteredServices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="inline-block p-6 bg-white rounded-3xl shadow-lg mb-4">
                <Search className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No matching services</h3>
              <p className="text-gray-500">Try adjusting your search query</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service, index) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 p-6 ${
                !service.isEnabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                    {service.category === 'Package' && (
                      <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-semibold shadow-sm">
                        ✨ Package
                      </span>
                    )}
                    {!service.isEnabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                    <Tag size={12} />
                    {service.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.isEnabled}
                    onCheckedChange={() => handleToggleEnabled(service.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(service)}>
                        <Edit size={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(service)}
                        className="text-red-600"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
              )}

              {service.barcode && (
                <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Barcode</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{service.barcode}</p>
                </div>
              )}

              <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700 font-medium">{service.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {service.offerPrice ? (
                        <>
                          <span className="text-gray-900 font-semibold">
                            {getCurrencySymbol(service.currency)}{service.offerPrice}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                            OFFER
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-900 font-semibold">
                          {getCurrencySymbol(service.currency)}{service.price}
                        </span>
                      )}
                      <span className="text-gray-500">({service.currency})</span>
                    </div>
                    {service.actualPrice && service.offerPrice && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 line-through">
                          MRP: {getCurrencySymbol(service.currency)}{service.actualPrice}
                        </span>
                        <span className="text-xs text-green-600 font-semibold">
                          Save {Math.round(((parseFloat(service.actualPrice) - parseFloat(service.offerPrice)) / parseFloat(service.actualPrice)) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`text-sm font-medium ${service.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {service.isEnabled ? '● Active' : '● Disabled'}
                </span>
              </div>

              {/* Booking URL & QR Code */}
              {service.isEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    onClick={() => copyBookingURL(service.id, service.name)}
                  >
                    {copiedId === service.id ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={14} />
                        <span>Copy Booking Link</span>
                        <Copy size={12} className="ml-auto" />
                      </>
                    )}
                  </Button>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/book/' + service.id)}`}
                    download={`${service.name.replace(/\s+/g, '-')}-QR.png`}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      type="button"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 14h8v-8H3v8zm2-6h4v4H5v-4zm8-10v8h8V3h-8zm6 6h-4V5h4v4zm-6 4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v4h-2v-4zm2-2h2v2h-2v-2zm0-4h2v2h-2v-2z"/>
                      </svg>
                      <span>Download QR Code</span>
                    </Button>
                  </a>
                  <p className="text-xs text-gray-400 mt-2 text-center truncate px-2">
                    /book/{service.id}
                  </p>
                </div>
              )}
            </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Service Form Modal */}
        <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
              <DialogDescription>
                {editingService ? 'Update service details' : 'Add a new bookable service'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  placeholder="Technical Interview"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="60 mins"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actualPrice">Actual Price (MRP)</Label>
                  <Input
                    id="actualPrice"
                    type="number"
                    placeholder="200"
                    value={formData.actualPrice}
                    onChange={(e) => setFormData({ ...formData, actualPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerPrice">Offer Price (Selling)</Label>
                  <Input
                    id="offerPrice"
                    type="number"
                    placeholder="150"
                    value={formData.offerPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, offerPrice: e.target.value, price: e.target.value })
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Default Price (Fallback)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="150"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Used if no offer price is set</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {!isCustomCategory ? (
                  <Select 
                    value={formData.category} 
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setFormData({ ...formData, category: val });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-purple-600 font-medium border-t mt-1 pt-2">
                        <span className="flex items-center gap-2">
                          <Plus size={14} /> Add Custom Category
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom category name"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                      autoFocus
                    />
                    <Button type="button" onClick={addCustomCategory} size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setCustomCategoryName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode (Optional)</Label>
                <Input
                  id="barcode"
                  placeholder="Enter or scan barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500">Scan with barcode scanner for instant entry</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Service description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!formData.name || !formData.duration || !formData.price || !formData.category}
              >
                {editingService ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600">Delete Service</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            {deletingService && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete <span className="font-bold">{deletingService.name}</span>?
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingService(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Package Dialog */}
        <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Tag className="text-purple-600" size={24} />
                Create Service Package
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Package Name */}
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name *</Label>
                <Input
                  id="packageName"
                  placeholder="e.g., Spa Day Package, Complete Wellness Bundle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Package Description */}
              <div className="space-y-2">
                <Label htmlFor="packageDescription">Description</Label>
                <Textarea
                  id="packageDescription"
                  placeholder="Describe what's included in this package..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Select Services */}
              <div className="space-y-3">
                <Label>Select Services to Include *</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-gray-50">
                  {services
                    .filter(s => s.isEnabled && s.category !== 'Package')
                    .map((service) => (
                      <div key={service.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={packageServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPackageServices([...packageServices, service.id]);
                            } else {
                              setPackageServices(packageServices.filter(id => id !== service.id));
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{service.name}</span>
                            <div className="text-sm text-gray-600">
                              <span className="mr-4">{service.duration} min</span>
                              <span className="font-semibold">₹{service.price}</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                </div>
                {packageServices.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Select at least 2 services to create a package</p>
                )}
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <Label htmlFor="discount">Package Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="10"
                  value={packageDiscount}
                  onChange={(e) => setPackageDiscount(e.target.value)}
                />
                <p className="text-xs text-gray-500">Discount applied to the total of all services</p>
              </div>

              {/* Package Summary */}
              {packageServices.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-purple-900">Package Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Services included:</span>
                      <span className="font-medium">{packageServices.length} services</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total duration:</span>
                      <span className="font-medium">
                        {services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseInt(s.duration), 0)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Actual Total Price (MRP):</span>
                      <span className="line-through text-gray-500">
                        ₹{services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Discount ({packageDiscount}%):</span>
                      <span className="text-green-600 font-medium">
                        -₹{(services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0) * 
                          (parseFloat(packageDiscount) / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="font-semibold text-purple-900">Package Offer Price:</span>
                      <span className="font-bold text-xl text-purple-600">
                        ₹{(services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0) * 
                          (1 - parseFloat(packageDiscount) / 100)
                        ).toFixed(2)}
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
                  setIsPackageModalOpen(false);
                  setPackageServices([]);
                  setPackageDiscount('10');
                  setFormData({
                    name: '',
                    duration: '',
                    price: '',
                    currency: 'INR',
                    description: '',
                    category: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!formData.name.trim()) {
                    toast({
                      title: "Package name required",
                      description: "Please enter a name for your package.",
                      variant: "destructive"
                    });
                    return;
                  }
                  if (packageServices.length < 2) {
                    toast({
                      title: "Select more services",
                      description: "A package must include at least 2 services.",
                      variant: "destructive"
                    });
                    return;
                  }

                  // Calculate package details
                  const selectedServices = services.filter(s => packageServices.includes(s.id));
                  const totalDuration = selectedServices.reduce((sum, s) => sum + parseInt(s.duration), 0);
                  const actualTotalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0);
                  const packageOfferPrice = actualTotalPrice * (1 - parseFloat(packageDiscount) / 100);

                  // Create package as a service
                  const newPackage: Service = {
                    id: Date.now().toString(),
                    name: formData.name,
                    duration: `${totalDuration} mins`,
                    price: packageOfferPrice.toFixed(2),
                    actualPrice: actualTotalPrice.toFixed(2),
                    offerPrice: packageOfferPrice.toFixed(2),
                    currency: 'INR',
                    category: 'Package',
                    description: formData.description || 
                      `Includes: ${selectedServices.map(s => s.name).join(', ')}. Save ${packageDiscount}%!`,
                    isEnabled: true,
                    createdAt: new Date().toISOString(),
                    packageServices: packageServices, // Store included service IDs
                    originalPrice: actualTotalPrice.toFixed(2),
                    discount: packageDiscount
                  };

                  saveServices([...services, newPackage]);
                  setIsPackageModalOpen(false);
                  setPackageServices([]);
                  setPackageDiscount('10');
                  setFormData({
                    name: '',
                    duration: '',
                    price: '',
                    currency: 'INR',
                    description: '',
                    category: '',
                  });

                  toast({
                    title: "Package created!",
                    description: `${newPackage.name} has been added to your services.`
                  });
                }}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!formData.name.trim() || packageServices.length < 2}
              >
                Create Package
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl shadow-lg">
                  <Upload className="text-white" size={28} />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Bulk Import Services
                  </span>
                  <p className="text-sm font-normal text-gray-500 mt-1">Quick & Easy CSV Import</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Step 1: Download Template */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📥 Download CSV Template</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get our ready-to-use template with sample data. Open in Excel and apply styling for professional look!
                    </p>
                    <div className="bg-white/80 rounded-xl p-3 mb-4 border border-blue-100">
                      <p className="text-xs text-blue-700 font-medium">💡 Pro Tip: In Excel, select header row → Home → Fill Color → Green for attractive table look!</p>
                    </div>
                    <Button 
                      onClick={downloadCSVTemplate}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 shadow-md"
                    >
                      <FileSpreadsheet size={18} />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Fill Template */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">✏️ Fill in Your Services</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">💼</span>
                        <span className="font-bold text-gray-800">Service Name</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., Swedish Massage</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">💰</span>
                        <span className="font-bold text-gray-800">Price (₹)</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., 2500</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">⏱️</span>
                        <span className="font-bold text-gray-800">Duration</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., 60 (mins)</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">📁</span>
                        <span className="font-bold text-gray-800">Category</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., Spa & Wellness</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors col-span-2 sm:col-span-2">
                        <span className="text-2xl block mb-1">📝</span>
                        <span className="font-bold text-gray-800">Description</span>
                        <p className="text-gray-500 text-xs mt-1">Brief description of the service</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Upload CSV */}
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📤 Upload & Import to POS</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your CSV and we'll automatically import services and open POS for billing!
                    </p>
                    
                    <div className="border-3 border-dashed border-emerald-300 rounded-2xl p-6 text-center bg-white/80 hover:bg-emerald-50 transition-all cursor-pointer group">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer block">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload size={32} className="text-emerald-600" />
                        </div>
                        {csvFile ? (
                          <div>
                            <p className="text-lg font-bold text-emerald-700 mb-1">✅ {csvFile.name}</p>
                            <p className="text-sm text-gray-500">Click to change file</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg font-bold text-gray-700 mb-1">Drop CSV here or Click to Upload</p>
                            <p className="text-sm text-gray-500">Supports .csv files</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {importedData.length > 0 && (
                      <div className="mt-4 bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 rounded-xl p-4 shadow-inner">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check size={18} className="text-white" />
                          </div>
                          <p className="font-bold text-emerald-800">
                            {importedData.length} Services Ready to Import!
                          </p>
                        </div>
                        <div className="bg-white rounded-lg overflow-hidden border border-emerald-200">
                          <div className="grid grid-cols-3 gap-2 p-2 bg-emerald-500 text-white text-xs font-bold">
                            <span>Service</span>
                            <span>Price</span>
                            <span>Duration</span>
                          </div>
                          <div className="max-h-32 overflow-y-auto">
                            {importedData.slice(0, 5).map((row, idx) => (
                              <div key={idx} className="grid grid-cols-3 gap-2 p-2 text-xs border-b border-emerald-100 last:border-0 hover:bg-emerald-50">
                                <span className="font-medium text-gray-800 truncate">{row['Service Name']}</span>
                                <span className="text-emerald-700">₹{row['Service Price (₹)']}</span>
                                <span className="text-gray-600">{row['Duration (mins)']} mins</span>
                              </div>
                            ))}
                          </div>
                          {importedData.length > 5 && (
                            <p className="text-xs text-center py-2 text-gray-500 bg-gray-50">
                              +{importedData.length - 5} more services
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkImportOpen(false);
                  setCsvFile(null);
                  setImportedData([]);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={processBulkImport}
                disabled={importedData.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 shadow-lg gap-2 text-base py-5"
              >
                <ShoppingCart size={20} />
                Import Services & Open POS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Services Report Dialog */}
        <Dialog open={isReportsOpen} onOpenChange={setIsReportsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  <span>Services Report</span>
                  <span className="text-sm font-normal text-gray-500 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      servicesReportPeriod === 'today' ? 'bg-blue-100 text-blue-700' :
                      servicesReportPeriod === 'week' ? 'bg-green-100 text-green-700' :
                      servicesReportPeriod === 'month' ? 'bg-purple-100 text-purple-700' :
                      servicesReportPeriod === 'year' ? 'bg-amber-100 text-amber-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {servicesReportPeriod === 'today' ? "Today's Report" :
                       servicesReportPeriod === 'week' ? 'Weekly Report' :
                       servicesReportPeriod === 'month' ? 'Monthly Report' :
                       servicesReportPeriod === 'year' ? 'Yearly Report' :
                       'Custom Range'}
                    </span>
                  </span>
                </div>
              </DialogTitle>
              <DialogDescription>
                Comprehensive analysis of your services catalog
              </DialogDescription>
            </DialogHeader>

            {/* Custom Date Range Picker */}
            {servicesReportPeriod === 'custom' && (
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
                      value={customServicesReportDates.from}
                      onChange={(e) => setCustomServicesReportDates(prev => ({ ...prev, from: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">To Date</Label>
                    <Input
                      type="date"
                      value={customServicesReportDates.to}
                      onChange={(e) => setCustomServicesReportDates(prev => ({ ...prev, to: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const report = generateServicesReport();
              return (
                <div className="space-y-6 py-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package2 className="text-blue-600" size={20} />
                        <span className="text-sm text-gray-600">Total Services</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700">{report.summary.totalServices}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-emerald-600" size={20} />
                        <span className="text-sm text-gray-600">Enabled</span>
                      </div>
                      <p className="text-3xl font-bold text-emerald-700">{report.summary.enabledServices}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <PieChart className="text-amber-600" size={20} />
                        <span className="text-sm text-gray-600">Avg Price</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-700">₹{report.summary.averagePrice}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="text-purple-600" size={20} />
                        <span className="text-sm text-gray-600">Total Revenue Potential</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-700">₹{report.summary.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* More Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Highest Price</p>
                      <p className="text-xl font-bold text-gray-800">₹{report.summary.highestPrice}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Lowest Price</p>
                      <p className="text-xl font-bold text-gray-800">₹{report.summary.lowestPrice}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Avg Duration</p>
                      <p className="text-xl font-bold text-gray-800">{report.summary.averageDuration} mins</p>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3">
                      <h3 className="font-bold flex items-center gap-2">
                        <PieChart size={18} />
                        Category Breakdown
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Services</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">%</th>
                            <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.categoryBreakdown.map((cat, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{cat.count}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {cat.percentage}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-600">₹{cat.totalRevenue.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Package Services */}
                  {report.packages.length > 0 && (
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <Package2 size={18} />
                          Package Services ({report.packages.length})
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="grid gap-3">
                          {report.packages.map((pkg, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-amber-50 rounded-lg p-3 border border-amber-200">
                              <div>
                                <p className="font-medium text-gray-800">{pkg.name}</p>
                                <p className="text-sm text-gray-500">{pkg.category}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-amber-700">₹{pkg.price}</p>
                                <p className="text-sm text-emerald-600">{pkg.discount}% off</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Services Table */}
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3">
                      <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18} />
                        All Services Details
                      </h3>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600">Service</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600">Category</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Price</th>
                            <th className="text-center px-3 py-2 font-semibold text-gray-600">Duration</th>
                            <th className="text-center px-3 py-2 font-semibold text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.allServices.map((svc, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-800">{svc.name}</td>
                              <td className="px-3 py-2 text-gray-600">{svc.category}</td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-600">₹{svc.price}</td>
                              <td className="px-3 py-2 text-center text-gray-600">{svc.duration} mins</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${svc.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {svc.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {report.recommendations.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        💡 Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {report.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
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
                        onClick={() => downloadReport('csv')}
                        variant="outline"
                        className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        <FileSpreadsheet size={18} />
                        Download CSV
                      </Button>
                      <Button
                        onClick={() => downloadReport('excel')}
                        variant="outline"
                        className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <FileSpreadsheet size={18} />
                        Download Excel
                      </Button>
                      <Button
                        onClick={() => downloadReport('pdf')}
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
