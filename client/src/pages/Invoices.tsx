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
} from '@/components/ui/dialog';
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

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>(getAllInvoices());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceOrProductId: '',
    itemType: 'service', // 'service' or 'product'
    paymentMethod: 'Cash',
    currency: 'INR',
    status: 'Paid' as 'Paid' | 'Pending' | 'Cancelled',
    notes: '',
  });

  const stats = useMemo(() => getInvoiceStats(), [invoices]);

  // Load services and products
  useEffect(() => {
    loadServicesAndProducts();
    
    const handleUpdate = () => loadServicesAndProducts();
    window.addEventListener('services-updated', handleUpdate);
    window.addEventListener('products-updated', handleUpdate);
    
    return () => {
      window.removeEventListener('services-updated', handleUpdate);
      window.removeEventListener('products-updated', handleUpdate);
    };
  }, []);

  const loadServicesAndProducts = () => {
    try {
      const currentWorkspace = localStorage.getItem('zervos_current_workspace') || 'default';
      
      // Load services
      const servicesKey = `zervos_services_${currentWorkspace}`;
      const servicesRaw = localStorage.getItem(servicesKey);
      if (servicesRaw) {
        const servicesList = JSON.parse(servicesRaw);
        setServices(Array.isArray(servicesList) ? servicesList.filter((s: any) => s.isEnabled) : []);
      }
      
      // Load products
      const productsKey = `zervos_products_${currentWorkspace}`;
      const productsRaw = localStorage.getItem(productsKey);
      if (productsRaw) {
        const productsList = JSON.parse(productsRaw);
        setProducts(Array.isArray(productsList) ? productsList.filter((p: any) => p.isEnabled) : []);
      }
    } catch (error) {
      console.error('Error loading services and products:', error);
    }
  };

  // Create invoice from form
  const handleCreateInvoice = async () => {
    if (!invoiceForm.customerName || !invoiceForm.customerEmail || !invoiceForm.serviceOrProductId) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const { createInvoice } = await import('@/lib/invoice-utils');
    
    // Find the selected service or product
    const selectedItem = invoiceForm.itemType === 'service'
      ? services.find(s => s.id === invoiceForm.serviceOrProductId)
      : products.find(p => p.id === invoiceForm.serviceOrProductId);

    if (!selectedItem) {
      toast({
        title: 'Item Not Found',
        description: 'Selected service or product not found',
        variant: 'destructive',
      });
      return;
    }

    const getCurrencySymbol = (code: string) => {
      const symbols: { [key: string]: string } = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
        'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'AED': 'د.إ',
      };
      return symbols[code] || '₹';
    };

    const price = parseFloat(selectedItem.price);
    const subtotal = price;
    const taxAmount = Math.round((subtotal * 18) / 100); // 18% tax
    const amount = subtotal + taxAmount;

    const companyData = localStorage.getItem('zervos_company');
    const company = companyData ? JSON.parse(companyData) : { name: 'Your Company', email: '' };

    const newInvoice = createInvoice({
      bookingId: 'BOOK-' + Date.now(),
      customer: {
        name: invoiceForm.customerName,
        email: invoiceForm.customerEmail,
        phone: invoiceForm.customerPhone,
      },
      service: {
        name: selectedItem.name,
        duration: selectedItem.duration || (invoiceForm.itemType === 'product' ? `SKU: ${selectedItem.sku}` : 'N/A'),
        price: price,
      },
      amount: amount,
      subtotal: subtotal,
      taxAmount: taxAmount,
      paymentMethod: invoiceForm.paymentMethod,
      currency: getCurrencySymbol(invoiceForm.currency),
      status: invoiceForm.status,
      company: {
        name: company.businessName || company.name || 'Your Company',
        email: company.email || '',
      },
      bookingDate: new Date().toLocaleDateString(),
      bookingTime: new Date().toLocaleTimeString(),
      notes: invoiceForm.notes || 'Thank you for your business!',
    });
    
    setInvoices(getAllInvoices());
    setIsCreateModalOpen(false);
    
    // Reset form
    setInvoiceForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      serviceOrProductId: '',
      itemType: 'service',
      paymentMethod: 'Cash',
      currency: 'INR',
      status: 'Paid',
      notes: '',
    });
    
    toast({
      title: 'Invoice Created',
      description: `Invoice ${newInvoice.invoiceId} has been created`,
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

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

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

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const success = deleteInvoice(invoiceId);
      if (success) {
        setInvoices(getAllInvoices());
        toast({
          title: 'Deleted',
          description: 'Invoice has been deleted',
        });
      }
    }
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
        date: invoice.issueDate,
        customer: {
          name: invoice.customerName,
          email: invoice.customerEmail,
          phone: invoice.customerPhone,
        },
        items: [{
          name: invoice.serviceName || 'Service',
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
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2" size={18} />
            Create Invoice
          </Button>
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
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="View Invoice"
                          >
                            <Eye size={16} />
                          </Button>
                          <div className="relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Print Bill"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                              <Receipt size={16} />
                            </Button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                              <button
                                onClick={() => handlePrintInvoice(invoice, true)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                              >
                                <FileCheck size={14} className="text-green-600" />
                                <span>With Tax</span>
                              </button>
                              <button
                                onClick={() => handlePrintInvoice(invoice, false)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
                              >
                                <FileText size={14} className="text-blue-600" />
                                <span>Without Tax</span>
                              </button>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(invoice)}
                            title="Send Email to Customer"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Mail size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.invoiceId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
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

        {/* Create Invoice Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Details */}
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={invoiceForm.customerName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={invoiceForm.customerEmail}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    placeholder="+91 9876543210"
                    value={invoiceForm.customerPhone}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* Item Selection */}
              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select
                  value={invoiceForm.itemType}
                  onValueChange={(value) => setInvoiceForm({ ...invoiceForm, itemType: value, serviceOrProductId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select {invoiceForm.itemType === 'service' ? 'Service' : 'Product'} *</Label>
                <Select
                  value={invoiceForm.serviceOrProductId}
                  onValueChange={(value) => setInvoiceForm({ ...invoiceForm, serviceOrProductId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${invoiceForm.itemType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceForm.itemType === 'service' ? (
                      services.length > 0 ? (
                        services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - ₹{service.price}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No services available</SelectItem>
                      )
                    ) : (
                      products.length > 0 ? (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₹{product.price}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No products available</SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={invoiceForm.paymentMethod}
                    onValueChange={(value) => setInvoiceForm({ ...invoiceForm, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Net Banking">Net Banking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={invoiceForm.status}
                    onValueChange={(value) => setInvoiceForm({ ...invoiceForm, status: value as 'Paid' | 'Pending' | 'Cancelled' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Thank you for your business!"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice} className="bg-purple-600 hover:bg-purple-700">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
