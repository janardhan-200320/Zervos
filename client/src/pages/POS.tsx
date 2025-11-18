import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Download, Printer, Eye, FileSpreadsheet, FileText, Receipt, FileCheck } from 'lucide-react';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">POS</h1>
            <p className="text-gray-600 mt-1">Point of Sale — manage in-person sales and quick checkouts</p>
          </div>
            <div className="flex items-center gap-2">
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
                            onClick={() => {
                              try {
                                exportToCSV([tx], `${tx.id}.csv`);
                                toast({ title: 'Downloaded', description: `${tx.id} exported to CSV` });
                              } catch (error) {
                                toast({ title: 'Export Failed', description: (error as Error).message, variant: 'destructive' });
                              }
                            }} 
                            title="Download CSV" 
                            className="rounded px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          >
                            <Download size={16} />
                          </button>
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
      </div>
    </DashboardLayout>
  );
}

