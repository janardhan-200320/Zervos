import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, X, 
  Coffee, Scissors, Heart, Dumbbell, Stethoscope, MoreHorizontal,
  User, CreditCard, Banknote, Smartphone, DollarSign, Receipt, ArrowLeft, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type Service = {
  id: string;
  name: string;
  price: number; // in cents
  description?: string;
  duration?: string;
  category: 'Beauty' | 'Fashion' | 'Salon' | 'Gym' | 'Clinic' | 'Other';
};

type CartItem = {
  service: Service;
  quantity: number;
  assignedPerson?: string;
};

type CartData = {
  quantity: number;
  assignedPerson: string;
};

// Initial services for different categories
const INITIAL_SERVICES: Service[] = [
  // Beauty
  { id: 'b1', name: 'Beard Design Session', price: 401500, description: 'Professional beard styling', duration: '30 min', category: 'Beauty' },
  { id: 'b2', name: 'Facial Treatment', price: 79900, description: '60 min facial cleansing and mask', duration: '60 min', category: 'Beauty' },
  { id: 'b3', name: 'Haircut', price: 59900, description: 'Standard haircut', duration: '45 min', category: 'Beauty' },
  
  // Salon
  { id: 'sl1', name: 'Hair Color', price: 149900, description: 'Full hair coloring service', duration: '2 hr', category: 'Salon' },
  { id: 'sl2', name: 'Hair Spa', price: 89900, description: 'Deep conditioning treatment', duration: '1 hr', category: 'Salon' },
  { id: 'sl3', name: 'Manicure & Pedicure', price: 69900, description: 'Complete nail care', duration: '1 hr', category: 'Salon' },
  
  // Spa (Fashion related services)
  { id: 'f1', name: 'Massage (30min)', price: 129900, description: 'Relaxing massage', duration: '30 min', category: 'Fashion' },
  { id: 'f2', name: 'Body Scrub', price: 99900, description: 'Full body exfoliation', duration: '45 min', category: 'Fashion' },
  
  // Gym
  { id: 'g1', name: 'Personal Training Session', price: 199900, description: 'One-on-one training', duration: '1 hr', category: 'Gym' },
  { id: 'g2', name: 'Group Class', price: 49900, description: 'Group fitness class', duration: '45 min', category: 'Gym' },
  { id: 'g3', name: 'Nutrition Consultation', price: 149900, description: 'Diet planning session', duration: '30 min', category: 'Gym' },
  
  // Clinic
  { id: 'c1', name: 'General Consultation', price: 79900, description: 'Doctor consultation', duration: '20 min', category: 'Clinic' },
  { id: 'c2', name: 'Physiotherapy Session', price: 119900, description: 'Physical therapy', duration: '45 min', category: 'Clinic' },
  { id: 'c3', name: 'Diagnostic Tests', price: 299900, description: 'Basic health checkup', duration: '30 min', category: 'Clinic' },
  
  // Wellness/Other
  { id: 'o1', name: 'Coffee Tasting Session', price: 39900, description: 'Guided coffee tasting', duration: '30 min', category: 'Other' },
  { id: 'o2', name: 'Yoga Class', price: 59900, description: 'Group yoga session', duration: '1 hr', category: 'Other' },
];

const CATEGORY_ICONS = {
  Beauty: Scissors,
  Fashion: Heart,
  Salon: Scissors,
  Gym: Dumbbell,
  Clinic: Stethoscope,
  Other: Coffee,
};

const CATEGORY_COLORS = {
  Beauty: 'from-pink-500 to-rose-500',
  Fashion: 'from-purple-500 to-indigo-500',
  Salon: 'from-amber-500 to-orange-500',
  Gym: 'from-green-500 to-emerald-500',
  Clinic: 'from-blue-500 to-cyan-500',
  Other: 'from-slate-500 to-gray-500',
};

export default function POSRegister() {
  const [, setLocation] = useLocation();
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [cart, setCart] = useState<Record<string, CartData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomService, setShowCustomService] = useState(false);
  const [showCustomProduct, setShowCustomProduct] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [staffName, setStaffName] = useState('');
  const [serviceAttendee, setServiceAttendee] = useState('');
  const [salesAgent, setSalesAgent] = useState('');
  const { toast} = useToast();
  const [viewMode, setViewMode] = useState<'services' | 'products'>('services');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Custom service form
  const [customService, setCustomService] = useState({
    name: '',
    price: '',
    description: '',
    duration: '',
    category: 'Other' as Service['category'],
  });

  const categories = ['all', 'Beauty', 'Fashion', 'Salon', 'Gym', 'Clinic', 'Other'];

  // Load services and products from localStorage
  useEffect(() => {
    const loadInventory = () => {
      try {
        const allServices: Service[] = [...INITIAL_SERVICES];
        
        // Get current workspace
        const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
        
        // Load Services from Services page
        const storedServices = localStorage.getItem(`zervos_services_${currentWorkspace}`);
        if (storedServices) {
          const services = JSON.parse(storedServices);
          const mappedServices: Service[] = services
            .filter((s: any) => s.isEnabled)
            .map((s: any) => ({
              id: `service-${s.id}`,
              name: s.name,
              price: Math.round(parseFloat(s.price) * 100), // Convert to cents
              description: s.description || '',
              duration: s.duration || '',
              category: (s.category === 'Spa & Wellness' ? 'Fashion' : 
                        s.category === 'Beauty & Salon' ? 'Beauty' : 
                        s.category === 'Fitness & Training' ? 'Gym' : 'Other') as Service['category'],
            }));
          allServices.push(...mappedServices);
        }
        
        // Load Products from Products page
        const storedProducts = localStorage.getItem(`zervos_products_${currentWorkspace}`);
        if (storedProducts) {
          const products = JSON.parse(storedProducts);
          const productServices: Service[] = products
            .filter((p: any) => p.isEnabled)
            .map((p: any) => ({
              id: `product-${p.id}`,
              name: p.name,
              price: Math.round(parseFloat(p.price) * 100), // Convert to cents
              description: p.description || '',
              duration: '',
              category: 'Other' as Service['category'],
            }));
          allServices.push(...productServices);
        }
        
        setServices(allServices);
        
        toast({
          title: 'Inventory Loaded',
          description: `${allServices.length} items available in POS`,
        });
      } catch (error) {
        console.error('Error loading services/products:', error);
        toast({
          title: 'Error Loading Inventory',
          description: 'Failed to load services and products',
          variant: 'destructive',
        });
      }
    };
    
    // Load initially
    loadInventory();
    
    // Listen for updates from Services and Products pages
    const handleServicesUpdate = () => {
      console.log('Services updated - reloading inventory');
      loadInventory();
    };
    
    const handleProductsUpdate = () => {
      console.log('Products updated - reloading inventory');
      loadInventory();
    };
    
    window.addEventListener('services-updated', handleServicesUpdate);
    window.addEventListener('products-updated', handleProductsUpdate);
    
    // Cleanup listeners
    return () => {
      window.removeEventListener('services-updated', handleServicesUpdate);
      window.removeEventListener('products-updated', handleProductsUpdate);
    };
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Filter by view mode (services vs products) - STRICT filtering
      let matchesViewMode = false;
      
      if (viewMode === 'services') {
        // Show: 'service-' prefix OR 'custom-service-' prefix OR initial demo services
        matchesViewMode = service.id.startsWith('service-') || 
                          service.id.startsWith('custom-service-') ||
                          (!service.id.startsWith('product-') && 
                           !service.id.startsWith('custom-product-') && 
                           !service.id.startsWith('custom-'));
      } else if (viewMode === 'products') {
        // Show: 'product-' prefix OR 'custom-product-' prefix
        matchesViewMode = service.id.startsWith('product-') || 
                          service.id.startsWith('custom-product-');
      }
      
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      
      return matchesViewMode && matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory, viewMode]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, cartItem]) => ({
        service: services.find(s => s.id === id)!,
        quantity: cartItem.quantity,
        assignedPerson: cartItem.assignedPerson,
      }))
      .filter(item => item.service);
  }, [cart, services]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.service.price * item.quantity), 0);
  
  // Calculate discount
  useEffect(() => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setDiscountAmount(0);
      return;
    }

    const value = parseFloat(discountValue);
    
    if (discountType === 'percentage') {
      const maxPercentage = 100;
      const validPercentage = Math.min(value, maxPercentage);
      setDiscountAmount(Math.round((subtotal * validPercentage) / 100));
    } else {
      // Fixed discount should not exceed subtotal
      const maxDiscount = subtotal;
      const validDiscount = Math.min(value * 100, maxDiscount); // Convert to cents
      setDiscountAmount(Math.round(validDiscount));
    }
  }, [discountValue, discountType, subtotal]);

  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = Math.round(subtotalAfterDiscount * 0.18); // 18% tax on discounted amount
  const total = subtotalAfterDiscount + tax;

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const addToCart = (serviceId: string) => {
    setCart(prev => {
      const newCart: Record<string, CartData> = {
        ...prev,
        [serviceId]: {
          quantity: (prev[serviceId]?.quantity || 0) + 1,
          assignedPerson: prev[serviceId]?.assignedPerson || '',
        },
      };
      return newCart;
    });
    toast({
      title: 'Added to cart',
      description: 'Service added successfully',
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[serviceId]?.quantity || 0) + delta;
      if (newQty <= 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      const newCart: Record<string, CartData> = { 
        ...prev, 
        [serviceId]: {
          quantity: newQty,
          assignedPerson: prev[serviceId]?.assignedPerson || '',
        }
      };
      return newCart;
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prev => {
      const { [serviceId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateAssignedPerson = (serviceId: string, person: string) => {
    setCart(prev => {
      const newCart: Record<string, CartData> = {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          assignedPerson: person,
        },
      };
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
    toast({
      title: 'Cart cleared',
      description: 'All items removed from cart',
    });
  };

  const handleAddCustomService = () => {
    if (!customService.name || !customService.price) {
      toast({
        title: 'Invalid item',
        description: 'Please provide name and price',
        variant: 'destructive',
      });
      return;
    }

    const priceInCents = Math.round(parseFloat(customService.price) * 100);
    
    // Use correct prefix based on current view mode
    const prefix = viewMode === 'services' ? 'custom-service-' : 'custom-product-';
    const itemType = viewMode === 'services' ? 'service' : 'product';
    
    const newService: Service = {
      id: `${prefix}${Date.now()}`,
      name: customService.name,
      price: priceInCents,
      description: customService.description,
      duration: customService.duration,
      category: customService.category,
    };

    setServices(prev => [newService, ...prev]);
    setShowCustomService(false);
    setShowCustomProduct(false);
    setCustomService({
      name: '',
      price: '',
      description: '',
      duration: '',
      category: 'Other',
    });

    toast({
      title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} added`,
      description: `${newService.name} has been added to ${itemType}s`,
    });

    // Automatically add to cart
    addToCart(newService.id);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add services before checkout',
        variant: 'destructive',
      });
      return;
    }
    setShowCheckout(true);
  };

  const handleCompleteSale = () => {
    // Validate staff name
    if (!staffName.trim()) {
      toast({
        title: 'Staff name required',
        description: 'Please enter the staff member handling this bill',
        variant: 'destructive',
      });
      return;
    }

    // Validate service attendee for service items
    const hasServices = cartItems.some(item => 
      item.service.id.startsWith('service-') || 
      item.service.id.startsWith('custom-service-') ||
      (!item.service.id.startsWith('product-') && !item.service.id.startsWith('custom-product-'))
    );
    
    if (hasServices && !serviceAttendee.trim()) {
      toast({
        title: 'Service attendee required',
        description: 'Please enter who is performing the service',
        variant: 'destructive',
      });
      return;
    }

    // Create transaction object
    const transaction = {
      id: `POS-${Date.now()}`,
      customer: { 
        name: customerName || 'Walk-in Customer',
        email: customerEmail || '',
        phone: customerPhone || ''
      },
      items: cartItems.map(item => ({
        productId: item.service.id,
        qty: item.quantity,
        price: item.service.price,
        name: item.service.name,
        assignedPerson: item.assignedPerson || staffName.trim()
      })),
      date: new Date().toISOString().split('T')[0],
      amount: total,
      status: 'Completed' as const,
      staff: staffName.trim(),
      serviceAttendee: serviceAttendee.trim() || undefined,
      openBalance: 0,
      totalReturn: 0,
      balanceAmount: total,
      orderValue: total,
      currency: '₹',
      paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
    };

    // Get existing transactions from localStorage
    const existingTransactions = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
    
    // Add new transaction at the beginning
    const updatedTransactions = [transaction, ...existingTransactions];
    
    // Save back to localStorage
    localStorage.setItem('pos_transactions', JSON.stringify(updatedTransactions));

    toast({
      title: 'Sale completed!',
      description: `Total: ${formatPrice(total)} - Payment recorded successfully`,
    });
    
    // Reset form
    setCart({});
    setShowCheckout(false);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setStaffName('');
    setServiceAttendee('');
    setSalesAgent('');
    setPaymentMethod('cash');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-lg shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">POS System</h1>
                <p className="text-sm text-slate-600">Service & Appointment Sales</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1 text-sm bg-purple-50 border-purple-200 text-purple-700">
                <Scissors className="mr-1 h-3 w-3" />
                {services.filter(s => s.id.startsWith('service-') || s.id.startsWith('custom-service-')).length} Services
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-sm bg-green-50 border-green-200 text-green-700">
                <Package className="mr-1 h-3 w-3" />
                {services.filter(s => s.id.startsWith('product-') || s.id.startsWith('custom-product-')).length} Products
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-sm bg-blue-50 border-blue-200 text-blue-700">
                <ShoppingCart className="mr-1 h-3 w-3" />
                {cartItems.length} in cart
              </Badge>
              <Button
                onClick={() => setLocation('/dashboard/pos')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to POS
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm border p-4 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={`Search ${viewMode === 'services' ? 'services' : 'products'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                />
              </div>

              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 pb-4 border-b">
                <Button
                  onClick={() => setViewMode('services')}
                  variant={viewMode === 'services' ? 'default' : 'outline'}
                  className={viewMode === 'services' ? 'bg-brand-600' : ''}
                  size="sm"
                >
                  <Scissors className="mr-2 h-4 w-4" />
                  Services
                </Button>
                <Button
                  onClick={() => setViewMode('products')}
                  variant={viewMode === 'products' ? 'default' : 'outline'}
                  className={viewMode === 'products' ? 'bg-green-600' : ''}
                  size="sm"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Domain:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => {
                    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
                    
                    if (viewMode === 'services') {
                      // Load Services page to add recommended services
                      toast({
                        title: 'Load Services',
                        description: 'Go to Services page in sidebar to load 25 recommended services in ₹',
                      });
                    } else {
                      // Load Products page to add recommended products
                      toast({
                        title: 'Load Products',
                        description: 'Go to Products page in sidebar (under Items) to load 33 recommended products in ₹',
                      });
                    }
                  }}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Load Recommended
                </Button>

                <Button
                  onClick={() => viewMode === 'services' ? setShowCustomService(true) : setShowCustomProduct(true)}
                  variant="outline"
                  className="border-brand-300 text-brand-700 hover:bg-brand-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {viewMode === 'services' ? 'Add custom service' : 'Add custom product'}
                </Button>
              </div>
            </motion.div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service, index) => {
                  const Icon = CATEGORY_ICONS[service.category];
                  const gradient = CATEGORY_COLORS[service.category];
                  
                  return (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{service.name}</h3>
                                {(service.id.startsWith('service-') || service.id.startsWith('custom-service-')) && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-purple-50 border-purple-200 text-purple-700">
                                    {service.id.startsWith('custom-service-') ? 'Custom Service' : 'Service'}
                                  </Badge>
                                )}
                                {(service.id.startsWith('product-') || service.id.startsWith('custom-product-')) && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-50 border-green-200 text-green-700">
                                    {service.id.startsWith('custom-product-') ? 'Custom Product' : 'Product'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{service.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">{formatPrice(service.price)}</p>
                            <p className="text-xs text-slate-500">
                              {service.duration && `${service.duration} • `}{service.category}
                            </p>
                          </div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => addToCart(service.id)}
                              className={`${
                                (service.id.startsWith('service-') || service.id.startsWith('custom-service-'))
                                  ? 'bg-purple-600 hover:bg-purple-700' 
                                  : (service.id.startsWith('product-') || service.id.startsWith('custom-product-'))
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              } text-white shadow-md`}
                              size="sm"
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Add to Cart
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredServices.length === 0 && (
              <motion.div 
                className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="inline-block p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-full mb-4">
                  {viewMode === 'services' ? (
                    <Scissors className="h-16 w-16 text-purple-500" />
                  ) : (
                    <Package className="h-16 w-16 text-green-500" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No {viewMode === 'services' ? 'Services' : 'Products'} Available
                </h3>
                <p className="text-slate-600 mb-4">
                  {viewMode === 'services' 
                    ? 'Load 25 recommended services from the Services page'
                    : 'Load 33 recommended products from the Products page'
                  }
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <p className="text-sm text-slate-500">Click "Load Recommended" button above or</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open('/dashboard/services', '_blank')}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      size="sm"
                    >
                      <Scissors className="mr-2 h-4 w-4" />
                      Open Services Page
                    </Button>
                    <Button
                      onClick={() => window.open('/dashboard/products', '_blank')}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      size="sm"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Open Products Page
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <motion.div 
                className="bg-white rounded-xl shadow-lg border p-6 space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-brand-600" />
                  Cart
                </h2>
                {cartItems.length > 0 && (
                  <Button
                    onClick={clearCart}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Staff Information Section */}
              <div className="space-y-3">
                {/* Staff Handling Bill */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Label htmlFor="staff-name" className="text-sm font-medium text-blue-900 mb-1 block">
                    Staff Handling Bill
                  </Label>
                  <Input
                    id="staff-name"
                    placeholder="Enter staff name"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                  />
                </div>

                {/* Service Attendee */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <Label htmlFor="service-attendee" className="text-sm font-medium text-purple-900 mb-1 block">
                    Service Attendee (Who is performing the service?)
                  </Label>
                  <Input
                    id="service-attendee"
                    placeholder="Enter attendee name"
                    value={serviceAttendee}
                    onChange={(e) => setServiceAttendee(e.target.value)}
                    className="bg-white border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                  <p className="text-xs text-purple-600 mt-1">
                    Required for service bookings
                  </p>
                </div>

              </div>

              <div className="border-t pt-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">Cart is empty</p>
                    <p className="text-sm text-slate-500 mt-1">Add services to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {cartItems.map(item => (
                        <motion.div
                          key={item.service.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-slate-50 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">
                                {item.service.name}
                              </p>
                              <p className="text-xs text-slate-600">
                                {formatPrice(item.service.price)} × {item.quantity}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateQuantity(item.service.id, -1)}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold w-6 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                onClick={() => updateQuantity(item.service.id, 1)}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => removeFromCart(item.service.id)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Assigned Person Field */}
                          <div className="px-3 pb-3 pt-0">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-slate-500" />
                              <Input
                                placeholder={
                                  item.service.id.startsWith('product-') || item.service.id.startsWith('custom-product-')
                                    ? 'Who sold this?'
                                    : 'Who performed this?'
                                }
                                value={item.assignedPerson || ''}
                                onChange={(e) => updateAssignedPerson(item.service.id, e.target.value)}
                                className="h-8 text-xs bg-white border-slate-300 focus:border-brand-500"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <motion.div 
                  className="border-t pt-4 space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Discount Section */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Apply Discount
                      </Label>
                      {discountAmount > 0 && (
                        <Badge variant="secondary" className="bg-amber-600 text-white">
                          -{formatPrice(discountAmount)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => {
                        setDiscountType(value);
                        setDiscountValue('');
                        setDiscountAmount(0);
                      }}>
                        <SelectTrigger className="w-[130px] bg-white border-amber-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage %</SelectItem>
                          <SelectItem value="fixed">Fixed ₹</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex-1 relative">
                        <Input
                          type="number"
                          placeholder={discountType === 'percentage' ? '0-100' : '0.00'}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="bg-white border-amber-300 focus:border-amber-500 focus:ring-amber-200"
                          min="0"
                          max={discountType === 'percentage' ? '100' : undefined}
                          step={discountType === 'percentage' ? '1' : '0.01'}
                        />
                        {discountValue && parseFloat(discountValue) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDiscountValue('');
                              setDiscountAmount(0);
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {discountAmount > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-1"
                      >
                        {discountType === 'percentage' 
                          ? `${discountValue}% discount applied` 
                          : `₹${discountValue} discount applied`}
                      </motion.div>
                    )}
                  </div>

                  {/* Pricing Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Sub Total</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    
                    {discountAmount > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between text-amber-600 font-medium"
                      >
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Discount {discountType === 'percentage' && `(${discountValue}%)`}
                        </span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </motion.div>
                    )}
                    
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-dashed">
                        <span>Subtotal after discount</span>
                        <span>{formatPrice(subtotalAfterDiscount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-slate-600">
                      <span>Tax (18%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Round Off</span>
                      <span>₹0.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">
                        (Items: {cartItems.length}, Qty: {cartItems.reduce((s, i) => s + i.quantity, 0)})
                      </p>
                      <p className="text-2xl font-bold text-brand-600">{formatPrice(total)}</p>
                      {discountAmount > 0 && (
                        <p className="text-xs text-amber-600 line-through">
                          was {formatPrice(subtotal + Math.round(subtotal * 0.18))}
                        </p>
                      )}
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-lg py-6"
                    >
                      <Receipt className="mr-2 h-5 w-5" />
                      PROCEED
                    </Button>
                  </motion.div>
                </motion.div>
              )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Service Dialog */}
      <Dialog open={showCustomService} onOpenChange={setShowCustomService}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-600" />
              Add Custom Service
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service-name">Service Name *</Label>
              <Input
                id="service-name"
                placeholder="e.g., Special Massage Package"
                value={customService.name}
                onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="service-price">Price (₹) *</Label>
                <Input
                  id="service-price"
                  type="number"
                  placeholder="0.00"
                  value={customService.price}
                  onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-duration">Duration</Label>
                <Input
                  id="service-duration"
                  placeholder="e.g., 1 hr"
                  value={customService.duration}
                  onChange={(e) => setCustomService({ ...customService, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-category">Category</Label>
              <Select 
                value={customService.category} 
                onValueChange={(value) => setCustomService({ ...customService, category: value as Service['category'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beauty">Beauty</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Salon">Salon</SelectItem>
                  <SelectItem value="Gym">Gym</SelectItem>
                  <SelectItem value="Clinic">Clinic</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                placeholder="Brief description of the service"
                value={customService.description}
                onChange={(e) => setCustomService({ ...customService, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomService(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomService} className="bg-brand-600 hover:bg-brand-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Product Dialog */}
      <Dialog open={showCustomProduct} onOpenChange={setShowCustomProduct}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Add Custom Product
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="e.g., Hair Oil, Shampoo"
                value={customService.name}
                onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product-price">Price (₹) *</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="0.00"
                  value={customService.price}
                  onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-category">Category</Label>
                <Select 
                  value={customService.category} 
                  onValueChange={(value) => setCustomService({ ...customService, category: value as Service['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Salon">Salon</SelectItem>
                    <SelectItem value="Gym">Gym</SelectItem>
                    <SelectItem value="Clinic">Clinic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Brief description of the product"
                value={customService.description}
                onChange={(e) => setCustomService({ ...customService, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomProduct(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              handleAddCustomService();
              setShowCustomProduct(false);
            }} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax (18%):</span>
                <span className="font-semibold">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-brand-600">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Customer Information</span>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="customer-name">Name (Optional)</Label>
                <Input
                  id="customer-name"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-email">Email (Optional)</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-phone">Phone Number (Optional)</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteSale}
              className="bg-green-600 hover:bg-green-700"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
