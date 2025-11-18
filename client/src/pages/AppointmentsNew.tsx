import { useState, useEffect } from 'react';
import { Calendar, Plus, Minus, Search, Filter, CalendarX, DollarSign, CreditCard, Smartphone, Banknote, Edit2, Trash2, Clock, CheckCircle2, XCircle, MoreVertical, Pause, RefreshCw, Eye, Mail, Phone, User, MapPin, MessageSquare, QrCode, Copy } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Appointment {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  customService?: string;
  assignedStaff?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  appointmentStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount?: string;
  currency?: string;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'none';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  notes?: string;
}

const getCurrencySymbol = (currency: string = 'INR') => {
  const symbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'CNY': '¥',
    'AED': 'د.إ',
  };
  return symbols[currency] || currency;
};

export default function AppointmentsNew() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isCustomService, setIsCustomService] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{id: string; name: string; price: string; quantity: number}[]>([]);
  const announceAppointmentsChange = () => {
    try {
      window.dispatchEvent(new CustomEvent('appointments-updated'));
      window.dispatchEvent(new CustomEvent('timeslots-updated'));
    } catch (error) {
      console.warn('Failed to notify listeners about appointment changes:', error);
    }
  };
  
  const [newAppointment, setNewAppointment] = useState({
    customerName: '',
    email: '',
    phone: '',
    serviceName: '',
    customService: '',
    assignedStaff: '',
    date: '',
    time: '',
    appointmentStatus: 'confirmed',
    amount: '',
    currency: 'INR',
    paymentMethod: 'none',
    paymentStatus: 'unpaid',
    notes: '',
  });

  useEffect(() => {
    // Load company data
    try {
      const companyData = localStorage.getItem('zervos_company');
      if (companyData) {
        setCompany(JSON.parse(companyData));
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }

    // Load team members
    try {
      const keys = ['zervos_team_members'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('zervos_team_members::')) {
          keys.push(key);
        }
      }
      
      let members: any[] = [];
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            members = [...members, ...parsed];
          }
        }
      }
      
      const uniqueMembers = members.filter((member, index, self) =>
        index === self.findIndex((m) => m.id === member.id)
      );
      
      setTeamMembers(uniqueMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
    }

    // Load services and products
    loadServices();
    loadProducts();

    // Listen for services and products updates
    const handleServicesUpdate = () => loadServices();
    const handleProductsUpdate = () => loadProducts();
    window.addEventListener('services-updated', handleServicesUpdate);
    window.addEventListener('products-updated', handleProductsUpdate);

    // Prefer backend appointments if available, fallback to localStorage
    fetch('/api/appointments')
      .then(res => (res && res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem('zervos_appointments');
          if (saved) {
            try { setAppointments(JSON.parse(saved)); } catch {}
          }
        } catch {}
      });

    return () => {
      window.removeEventListener('services-updated', handleServicesUpdate);
      window.removeEventListener('products-updated', handleProductsUpdate);
    };
  }, []);

  const loadServices = () => {
    try {
      const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
      const stored = localStorage.getItem(`zervos_services_${currentWorkspace}`);
      if (stored) {
        const parsedServices = JSON.parse(stored);
        // Filter only enabled services
        const enabledServices = parsedServices.filter((s: any) => s.isEnabled);
        setServices(enabledServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadProducts = () => {
    try {
      const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
      const stored = localStorage.getItem(`zervos_products_${currentWorkspace}`);
      if (stored) {
        const parsedProducts = JSON.parse(stored);
        // Filter only enabled products
        const enabledProducts = parsedProducts.filter((p: any) => p.isEnabled);
        setProducts(enabledProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addProductToAppointment = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = selectedProducts.find(p => p.id === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const removeProductFromAppointment = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromAppointment(productId);
    } else {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === productId ? { ...p, quantity } : p
      ));
    }
  };

  const calculateTotalWithProducts = () => {
    const serviceAmount = parseFloat(newAppointment.amount) || 0;
    const productsTotal = selectedProducts.reduce((sum, p) => 
      sum + (parseFloat(p.price) * p.quantity), 0
    );
    return serviceAmount + productsTotal;
  };

  const handleCreateAppointment = () => {
    const finalServiceName = isCustomService && newAppointment.customService 
      ? newAppointment.customService 
      : newAppointment.serviceName;

    const appointment: Appointment = {
      id: Date.now().toString(),
      customerName: newAppointment.customerName,
      email: newAppointment.email,
      phone: newAppointment.phone,
      serviceName: finalServiceName,
      customService: isCustomService ? newAppointment.customService : undefined,
      assignedStaff: newAppointment.assignedStaff,
      date: newAppointment.date,
      time: newAppointment.time,
      status: 'upcoming',
      appointmentStatus: newAppointment.appointmentStatus as any,
      amount: newAppointment.amount,
      currency: newAppointment.currency,
      paymentMethod: newAppointment.paymentMethod as any,
      paymentStatus: newAppointment.paymentStatus as any,
      notes: newAppointment.notes,
    };
    
    const updated = [...appointments, appointment];
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
    } catch {}

    // Also send to backend for persistence across devices
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    }).catch(() => {/* ignore errors for now */});
    
    setNewAppointmentOpen(false);
    setIsCustomService(false);
    setNewAppointment({
      customerName: '',
      email: '',
      phone: '',
      serviceName: '',
      customService: '',
      assignedStaff: '',
      date: '',
      time: '',
      appointmentStatus: 'confirmed',
      amount: '',
      currency: 'INR',
      paymentMethod: 'none',
      paymentStatus: 'unpaid',
      notes: '',
    });
    
    toast({ title: "Success", description: "Appointment created successfully" });
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment) return;

    const finalServiceName = isCustomService && newAppointment.customService 
      ? newAppointment.customService 
      : newAppointment.serviceName;

    const updatedAppointment: Appointment = {
      ...selectedAppointment,
      customerName: newAppointment.customerName,
      email: newAppointment.email,
      phone: newAppointment.phone,
      serviceName: finalServiceName,
      customService: isCustomService ? newAppointment.customService : undefined,
      assignedStaff: newAppointment.assignedStaff,
      date: newAppointment.date,
      time: newAppointment.time,
      appointmentStatus: newAppointment.appointmentStatus as any,
      amount: newAppointment.amount,
      currency: newAppointment.currency,
      paymentMethod: newAppointment.paymentMethod as any,
      paymentStatus: newAppointment.paymentStatus as any,
      notes: newAppointment.notes,
    };

    const updated = appointments.map(apt => 
      apt.id === selectedAppointment.id ? updatedAppointment : apt
    );
    
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
    } catch {}

    setEditAppointmentOpen(false);
    setSelectedAppointment(null);
    setIsCustomService(false);
    setNewAppointment({
      customerName: '',
      email: '',
      phone: '',
      serviceName: '',
      customService: '',
      assignedStaff: '',
      date: '',
      time: '',
      appointmentStatus: 'confirmed',
      amount: '',
      currency: 'INR',
      paymentMethod: 'none',
      paymentStatus: 'unpaid',
      notes: '',
    });

    toast({ title: "Success", description: "Appointment updated successfully" });
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) return;

    const updated = appointments.filter(apt => apt.id !== selectedAppointment.id);
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
    } catch {}

    setDeleteConfirmOpen(false);
    setSelectedAppointment(null);

    toast({ 
      title: "Deleted", 
      description: "Appointment has been deleted successfully",
      variant: "destructive"
    });
  };

  const handleStatusChange = (appointmentId: string, newStatus: 'confirmed' | 'completed' | 'cancelled' | 'pending') => {
    const updated = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, appointmentStatus: newStatus } : apt
    );
    
    setAppointments(updated);
    try {
      localStorage.setItem('zervos_appointments', JSON.stringify(updated));
      announceAppointmentsChange();
    } catch {}

    const statusMessages = {
      confirmed: 'Appointment confirmed',
      completed: 'Appointment marked as completed',
      cancelled: 'Appointment cancelled',
      pending: 'Appointment set to pending'
    };

    toast({ title: "Status Updated", description: statusMessages[newStatus] });
  };

  const openEditDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const isCustom = !['Consultation', 'Demo', 'Training', 'Support'].includes(appointment.serviceName);
    setIsCustomService(isCustom);
    
    setNewAppointment({
      customerName: appointment.customerName,
      email: appointment.email,
      phone: appointment.phone,
      serviceName: isCustom ? '' : appointment.serviceName,
      customService: isCustom ? appointment.serviceName : '',
      assignedStaff: appointment.assignedStaff || '',
      date: appointment.date,
      time: appointment.time,
      appointmentStatus: appointment.appointmentStatus || 'confirmed',
      amount: appointment.amount || '',
      currency: appointment.currency || 'INR',
      paymentMethod: appointment.paymentMethod || 'none',
      paymentStatus: appointment.paymentStatus || 'unpaid',
      notes: appointment.notes || '',
    });
    
    setEditAppointmentOpen(true);
  };

  const upcomingAppointments = appointments.filter(apt => apt.status === 'upcoming');
  const pastAppointments = appointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled');

  const renderAppointmentsList = (appointmentsList: Appointment[]) => {
    if (appointmentsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center relative">
                <Calendar size={48} className="text-indigo-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <CalendarX size={16} className="text-white" />
                </div>
                <div className="absolute top-3 left-3 w-4 h-4 bg-indigo-600 rounded-sm"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full"></div>
                <div className="absolute -top-4 right-8 w-5 h-5 bg-purple-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </h3>
          <p className="text-gray-500 mb-6">
            Organize your schedule by adding appointments here.
          </p>
          <Button 
            onClick={() => setNewAppointmentOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Plus size={18} />
            New Appointment
          </Button>
        </div>
      );
    }

    return (
      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {appointmentsList.map((appointment, index) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{appointment.customerName}</h3>
                    {appointment.appointmentStatus && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          appointment.appointmentStatus === 'confirmed' 
                            ? 'bg-blue-100 text-blue-700' 
                            : appointment.appointmentStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : appointment.appointmentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {appointment.appointmentStatus === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                        {appointment.appointmentStatus === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                        {appointment.appointmentStatus === 'pending' && <Clock className="h-3 w-3" />}
                        {appointment.appointmentStatus === 'cancelled' && <XCircle className="h-3 w-3" />}
                        {appointment.appointmentStatus.charAt(0).toUpperCase() + appointment.appointmentStatus.slice(1)}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-2">{appointment.serviceName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {appointment.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {appointment.time}
                    </span>
                    <span>•</span>
                    <span>{appointment.email}</span>
                  </div>
                  {appointment.amount && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 mt-3"
                    >
                      <div className="flex items-center gap-1 text-sm bg-green-50 px-2.5 py-1 rounded-md">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-700">{getCurrencySymbol(appointment.currency)}{appointment.amount}</span>
                      </div>
                      {appointment.paymentMethod && appointment.paymentMethod !== 'none' && (
                        <span className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 flex items-center gap-1.5 font-medium">
                          {appointment.paymentMethod === 'cash' && <Banknote className="h-3.5 w-3.5" />}
                          {appointment.paymentMethod === 'upi' && <Smartphone className="h-3.5 w-3.5" />}
                          {appointment.paymentMethod === 'card' && <CreditCard className="h-3.5 w-3.5" />}
                          {appointment.paymentMethod.toUpperCase()}
                        </span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                        appointment.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : appointment.paymentStatus === 'partial'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                      </span>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(appointment)}
                      className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setViewDetailsOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {appointment.appointmentStatus !== 'confirmed' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="cursor-pointer"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
                          <span>Mark as Confirmed</span>
                        </DropdownMenuItem>
                      )}
                      
                      {appointment.appointmentStatus !== 'completed' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                          className="cursor-pointer"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          <span>Mark as Completed</span>
                        </DropdownMenuItem>
                      )}
                      
                      {appointment.appointmentStatus !== 'pending' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'pending')}
                          className="cursor-pointer"
                        >
                          <Pause className="mr-2 h-4 w-4 text-yellow-600" />
                          <span>Hold/Set Pending</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => openEditDialog(appointment)}
                        className="cursor-pointer"
                      >
                        <RefreshCw className="mr-2 h-4 w-4 text-purple-600" />
                        <span>Reschedule</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          const feedbackUrl = `${window.location.origin}/feedback?appointmentId=${appointment.id}&service=${encodeURIComponent(appointment.serviceName || appointment.customService || '')}&attendee=${encodeURIComponent(appointment.assignedStaff || '')}&customer=${encodeURIComponent(appointment.customerName)}`;
                          navigator.clipboard.writeText(feedbackUrl);
                          toast({
                            title: 'Feedback Link Copied!',
                            description: 'Share this link with the customer to collect feedback',
                          });
                        }}
                        className="cursor-pointer"
                      >
                        <Copy className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>Copy Feedback Link</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          const feedbackUrl = `${window.location.origin}/feedback?appointmentId=${appointment.id}&service=${encodeURIComponent(appointment.serviceName || appointment.customService || '')}&attendee=${encodeURIComponent(appointment.assignedStaff || '')}&customer=${encodeURIComponent(appointment.customerName)}`;
                          window.open(feedbackUrl, '_blank');
                        }}
                        className="cursor-pointer"
                      >
                        <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
                        <span>Open Feedback Form</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {appointment.appointmentStatus !== 'cancelled' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          className="cursor-pointer text-orange-600 focus:text-orange-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Cancel Appointment</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDeleteConfirmOpen(true);
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Appointment</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setNewAppointmentOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Plus size={18} />
                New Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming" className="px-6">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past" className="px-6">
                Past
              </TabsTrigger>
              <TabsTrigger value="custom" className="px-6">
                Custom Date
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {renderAppointmentsList(upcomingAppointments)}
            </TabsContent>

            <TabsContent value="past">
              {renderAppointmentsList(pastAppointments)}
            </TabsContent>

            <TabsContent value="custom">
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <Calendar size={48} className="text-indigo-600" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a custom date range</h3>
                <p className="text-gray-500 mb-6">Choose dates to view appointments</p>
                <div className="flex gap-3">
                  <Input type="date" className="w-40" />
                  <span className="text-gray-500 flex items-center">to</span>
                  <Input type="date" className="w-40" />
                  <Button variant="outline">Filter</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* New Appointment Modal */}
        <Dialog open={newAppointmentOpen} onOpenChange={setNewAppointmentOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
              <DialogDescription>
                Create a new appointment for your customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={newAppointment.customerName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newAppointment.email}
                    onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone and Assigned Staff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned {company?.teamMemberLabel || 'Staff'}</Label>
                  <Select 
                    value={newAppointment.assignedStaff}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, assignedStaff: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={teamMembers.length > 0 ? `Select ${company?.teamMemberLabel || 'Staff'}` : 'No staff available'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} {member.role ? `(${member.role})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No staff available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Select 
                    value={isCustomService ? 'custom' : newAppointment.serviceName} 
                    onValueChange={(v) => {
                      if (v === 'custom') {
                        setIsCustomService(true);
                        setNewAppointment({ ...newAppointment, serviceName: '' });
                      } else {
                        setIsCustomService(false);
                        setNewAppointment({ ...newAppointment, serviceName: v, customService: '' });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Demo">Demo</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="custom">✏️ Custom Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isCustomService && (
                  <div className="space-y-2">
                    <Label>Custom Service Name *</Label>
                    <Input
                      value={newAppointment.customService}
                      onChange={(e) => setNewAppointment({ ...newAppointment, customService: e.target.value })}
                      placeholder="Enter custom service name"
                    />
                  </div>
                )}
                {!isCustomService && (
                  <div className="space-y-2">
                    <Label>Appointment Status *</Label>
                    <Select 
                      value={newAppointment.appointmentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Appointment Status when custom service */}
              {isCustomService && (
                <div className="space-y-2">
                  <Label>Appointment Status *</Label>
                  <Select 
                    value={newAppointment.appointmentStatus}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newAppointment.amount}
                      onChange={(e) => setNewAppointment({ ...newAppointment, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={newAppointment.currency}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">🇮🇳 INR (₹)</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR (€)</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP (£)</SelectItem>
                        <SelectItem value="JPY">🇯🇵 JPY (¥)</SelectItem>
                        <SelectItem value="AUD">🇦🇺 AUD (A$)</SelectItem>
                        <SelectItem value="CAD">🇨🇦 CAD (C$)</SelectItem>
                        <SelectItem value="CHF">🇨🇭 CHF</SelectItem>
                        <SelectItem value="CNY">🇨🇳 CNY (¥)</SelectItem>
                        <SelectItem value="AED">🇦🇪 AED (د.إ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={newAppointment.paymentMethod}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-600" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="upi">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-purple-600" />
                            UPI
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            Card
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select 
                      value={newAppointment.paymentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">
                          <span className="text-red-600 font-medium">Unpaid</span>
                        </SelectItem>
                        <SelectItem value="paid">
                          <span className="text-green-600 font-medium">Paid</span>
                        </SelectItem>
                        <SelectItem value="partial">
                          <span className="text-orange-600 font-medium">Partial</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Product Add-ons */}
              {products.length > 0 && (
                <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-purple-900">🛍️ Product Add-ons</span>
                    <span className="text-xs text-purple-600">(Optional)</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Add Products to Booking</Label>
                    <Select onValueChange={addProductToAppointment}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select products to add..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₹{product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs font-medium text-gray-700">Selected Products:</p>
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">₹{product.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                            >
                              <Minus size={12} />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{product.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                            >
                              <Plus size={12} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => removeProductFromAppointment(product.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
                        <span className="text-sm font-semibold text-purple-900">Products Total:</span>
                        <span className="text-sm font-bold text-purple-900">
                          ₹{selectedProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                      {newAppointment.amount && (
                        <div className="pt-2 border-t border-purple-300 flex justify-between items-center">
                          <span className="text-base font-bold text-purple-900">Grand Total:</span>
                          <span className="text-base font-bold text-purple-900">
                            ₹{calculateTotalWithProducts().toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewAppointmentOpen(false);
                  setIsCustomService(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment} className="bg-indigo-600 hover:bg-indigo-700">
                Create Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Appointment Dialog */}
        <Dialog open={editAppointmentOpen} onOpenChange={setEditAppointmentOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Edit Appointment
              </DialogTitle>
              <DialogDescription>
                Update appointment details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={newAppointment.customerName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newAppointment.email}
                    onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone and Assigned Staff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned {company?.teamMemberLabel || 'Staff'}</Label>
                  <Select 
                    value={newAppointment.assignedStaff}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, assignedStaff: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={teamMembers.length > 0 ? `Select ${company?.teamMemberLabel || 'Staff'}` : 'No staff available'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} {member.role ? `(${member.role})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No staff available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Select 
                    value={isCustomService ? 'custom' : newAppointment.serviceName} 
                    onValueChange={(v) => {
                      if (v === 'custom') {
                        setIsCustomService(true);
                        setNewAppointment({ ...newAppointment, serviceName: '' });
                      } else {
                        setIsCustomService(false);
                        setNewAppointment({ ...newAppointment, serviceName: v, customService: '' });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Demo">Demo</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="custom">✏️ Custom Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isCustomService && (
                  <div className="space-y-2">
                    <Label>Custom Service Name *</Label>
                    <Input
                      value={newAppointment.customService}
                      onChange={(e) => setNewAppointment({ ...newAppointment, customService: e.target.value })}
                      placeholder="Enter custom service name"
                    />
                  </div>
                )}
                {!isCustomService && (
                  <div className="space-y-2">
                    <Label>Appointment Status *</Label>
                    <Select 
                      value={newAppointment.appointmentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {isCustomService && (
                <div className="space-y-2">
                  <Label>Appointment Status *</Label>
                  <Select 
                    value={newAppointment.appointmentStatus}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, appointmentStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newAppointment.amount}
                      onChange={(e) => setNewAppointment({ ...newAppointment, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={newAppointment.currency}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">🇮🇳 INR (₹)</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR (€)</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP (£)</SelectItem>
                        <SelectItem value="JPY">🇯🇵 JPY (¥)</SelectItem>
                        <SelectItem value="AUD">🇦🇺 AUD (A$)</SelectItem>
                        <SelectItem value="CAD">🇨🇦 CAD (C$)</SelectItem>
                        <SelectItem value="CHF">🇨🇭 CHF</SelectItem>
                        <SelectItem value="CNY">🇨🇳 CNY (¥)</SelectItem>
                        <SelectItem value="AED">🇦🇪 AED (د.إ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={newAppointment.paymentMethod}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-600" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="upi">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-purple-600" />
                            UPI
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            Card
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select 
                      value={newAppointment.paymentStatus}
                      onValueChange={(v) => setNewAppointment({ ...newAppointment, paymentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">
                          <span className="text-red-600 font-medium">Unpaid</span>
                        </SelectItem>
                        <SelectItem value="paid">
                          <span className="text-green-600 font-medium">Paid</span>
                        </SelectItem>
                        <SelectItem value="partial">
                          <span className="text-orange-600 font-medium">Partial</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditAppointmentOpen(false);
                  setSelectedAppointment(null);
                  setIsCustomService(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditAppointment} className="bg-blue-600 hover:bg-blue-700">
                Update Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Appointment
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-gray-900">{selectedAppointment.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedAppointment.serviceName}</p>
                  <p className="text-sm text-gray-500">{selectedAppointment.date} at {selectedAppointment.time}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteAppointment} 
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-indigo-600">
                <Eye className="h-5 w-5" />
                Appointment Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this appointment
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-4"
              >
                {/* Customer Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Name</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedAppointment.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {selectedAppointment.email}
                        </p>
                      </div>
                      {selectedAppointment.phone && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="text-sm text-gray-700 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {selectedAppointment.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Appointment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Service</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedAppointment.serviceName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedAppointment.appointmentStatus === 'confirmed' 
                            ? 'bg-blue-100 text-blue-700' 
                            : selectedAppointment.appointmentStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : selectedAppointment.appointmentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedAppointment.appointmentStatus === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus === 'pending' && <Clock className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus === 'cancelled' && <XCircle className="h-3 w-3" />}
                          {selectedAppointment.appointmentStatus?.charAt(0).toUpperCase() + selectedAppointment.appointmentStatus?.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {selectedAppointment.date}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {selectedAppointment.time}
                        </p>
                      </div>
                      {selectedAppointment.assignedStaff && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Assigned {company?.teamMemberLabel || 'Staff'}</p>
                          <p className="text-sm font-medium text-gray-900">
                            {teamMembers.find(m => m.id === selectedAppointment.assignedStaff)?.name || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  {selectedAppointment.amount && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border border-green-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Payment Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <p className="text-lg font-bold text-green-700">
                            {getCurrencySymbol(selectedAppointment.currency)}{selectedAppointment.amount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Currency</p>
                          <p className="text-sm font-medium text-gray-900">{selectedAppointment.currency || 'INR'}</p>
                        </div>
                        {selectedAppointment.paymentMethod && selectedAppointment.paymentMethod !== 'none' && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="text-sm text-gray-700 flex items-center gap-1.5">
                              {selectedAppointment.paymentMethod === 'cash' && <Banknote className="h-4 w-4 text-green-600" />}
                              {selectedAppointment.paymentMethod === 'upi' && <Smartphone className="h-4 w-4 text-purple-600" />}
                              {selectedAppointment.paymentMethod === 'card' && <CreditCard className="h-4 w-4 text-blue-600" />}
                              {selectedAppointment.paymentMethod.toUpperCase()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                            selectedAppointment.paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : selectedAppointment.paymentStatus === 'partial'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedAppointment.paymentStatus?.charAt(0).toUpperCase() + selectedAppointment.paymentStatus?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedAppointment.notes && (
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setViewDetailsOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setViewDetailsOpen(false);
                  if (selectedAppointment) {
                    openEditDialog(selectedAppointment);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

