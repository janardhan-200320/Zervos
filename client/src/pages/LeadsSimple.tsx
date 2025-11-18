import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, MoreVertical, Mail, Phone, Calendar, Building2, 
  User, Edit, Trash2, Eye, Briefcase, FileText, Clock, CheckCircle2, 
  XCircle, Users, TrendingUp, Download, Package, DollarSign, ShoppingBag,
  FileSpreadsheet, Star, AlertCircle
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface CustomerAppointment {
  id: string;
  service: string;
  date: string;
  time: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  notes?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  source: string;
  notes: string;
  createdAt: string;
  lastContact?: string;
  appointments: CustomerAppointment[];
  totalAppointments: number;
  completedAppointments: number;
  assigned?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  status: 'active' | 'inactive';
  totalSpent: number;
  lastPurchase?: string;
  createdAt: string;
  notes?: string;
  services?: string[];
  items?: string[];
  businessValue: number;
}

interface BulkLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  totalItems: number;
  itemsOrdered: string[];
  servicesRequested: string[];
  totalValue: number;
  estimatedDealSize: number;
  priority: 'high' | 'medium' | 'low';
  status: 'prospect' | 'negotiating' | 'committed' | 'closed';
  notes: string;
  followUpDate: string;
  assignedTo: string;
  sourceChannel: string;
  createdAt: string;
  lastContactDate?: string;
  potentialMonthlyRecurring: number;
  decisionMaker: string;
  companySize: string;
  industry: string;
  budget: string;
  timeline: string;
  competitors: string[];
  painPoints: string[];
  specialRequirements: string;
}

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Corp',
    role: 'CEO',
    source: 'LinkedIn',
    notes: 'Interested in our enterprise package. Follow up next week.',
    createdAt: '2025-11-01',
    lastContact: '2025-11-05',
    totalAppointments: 3,
    completedAppointments: 2,
    appointments: [
      {
        id: 'a1',
        service: 'Initial Consultation',
        date: '2025-11-05',
        time: '10:00 AM',
        status: 'completed',
        notes: 'Great discussion about requirements'
      },
      {
        id: 'a2',
        service: 'Product Demo',
        date: '2025-11-08',
        time: '2:00 PM',
        status: 'scheduled'
      },
      {
        id: 'a3',
        service: 'Strategy Session',
        date: '2025-10-28',
        time: '11:00 AM',
        status: 'completed'
      }
    ]
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    phone: '+1 (555) 987-6543',
    company: 'Innovation Labs',
    role: 'Marketing Director',
    source: 'Referral from Jane Doe',
    notes: 'Looking for marketing automation tools. Budget approved.',
    createdAt: '2025-10-28',
    lastContact: '2025-11-06',
    totalAppointments: 5,
    completedAppointments: 4,
    appointments: [
      {
        id: 'a4',
        service: 'Discovery Call',
        date: '2025-11-06',
        time: '9:00 AM',
        status: 'completed'
      },
      {
        id: 'a5',
        service: 'Follow-up Meeting',
        date: '2025-11-10',
        time: '3:00 PM',
        status: 'scheduled'
      }
    ]
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'mchen@business.com',
    phone: '+1 (555) 456-7890',
    company: 'Global Solutions',
    role: 'Operations Manager',
    source: 'Website Contact Form',
    notes: 'Needs integration with existing systems. Technical team involved.',
    createdAt: '2025-10-25',
    lastContact: '2025-11-04',
    totalAppointments: 2,
    completedAppointments: 1,
    appointments: [
      {
        id: 'a6',
        service: 'Technical Assessment',
        date: '2025-11-04',
        time: '1:00 PM',
        status: 'completed'
      },
      {
        id: 'a7',
        service: 'Implementation Planning',
        date: '2025-10-20',
        time: '4:00 PM',
        status: 'cancelled',
        notes: 'Rescheduled due to conflict'
      }
    ]
  },
];

const appointmentStatusColors = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'leads' | 'customers'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isViewCustomerDialogOpen, setIsViewCustomerDialogOpen] = useState(false);
  const [isEditLeadDialogOpen, setIsEditLeadDialogOpen] = useState(false);
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false);
  const [isBulkLeadDialogOpen, setIsBulkLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { toast } = useToast();
  const [bulkLeads, setBulkLeads] = useState<BulkLead[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [isAddBulkLeadDialogOpen, setIsAddBulkLeadDialogOpen] = useState(false);
  const [newBulkLead, setNewBulkLead] = useState<BulkLead>({
    id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    totalItems: 0,
    itemsOrdered: [],
    servicesRequested: [],
    totalValue: 0,
    estimatedDealSize: 0,
    priority: 'medium',
    status: 'prospect',
    notes: '',
    followUpDate: '',
    assignedTo: '',
    sourceChannel: 'Direct Inquiry',
    createdAt: '',
    potentialMonthlyRecurring: 0,
    decisionMaker: '',
    companySize: '50-200 employees',
    industry: '',
    budget: '$50,000 - $100,000',
    timeline: '3-6 months',
    competitors: [],
    painPoints: [],
    specialRequirements: '',
  });
  const [currentItemInput, setCurrentItemInput] = useState('');
  const [currentServiceInput, setCurrentServiceInput] = useState('');
  const [currentPainPoint, setCurrentPainPoint] = useState('');
  const [currentCompetitor, setCurrentCompetitor] = useState('');
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    source: '',
    notes: '',
    status: '',
    tags: [] as string[],
    position: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    leadValue: '',
    website: '',
    defaultLanguage: 'System Default',
    assigned: '',
  });
  const [currentTag, setCurrentTag] = useState('');
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
    services: [] as string[],
    items: [] as string[],
    businessValue: 0,
  });
  const [currentService, setCurrentService] = useState('');
  const [currentItem, setCurrentItem] = useState('');

  // Load company data and team members
  useEffect(() => {
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
      // Try to get all workspace-specific team member keys
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
      
      // Remove duplicates by id
      const uniqueMembers = members.filter((member, index, self) =>
        index === self.findIndex((m) => m.id === member.id)
      );
      
      // If no team members found, add some default ones
      if (uniqueMembers.length === 0) {
        const defaultMembers = [
          {
            id: 'tm1',
            name: 'Sarah Johnson',
            email: 'sarah@company.com',
            role: 'Sales Manager',
            phone: '+1 (555) 234-5678',
            isActive: true
          },
          {
            id: 'tm2',
            name: 'Michael Chen',
            email: 'michael@company.com',
            role: 'Account Executive',
            phone: '+1 (555) 345-6789',
            isActive: true
          },
          {
            id: 'tm3',
            name: 'Emily Rodriguez',
            email: 'emily@company.com',
            role: 'Customer Success',
            phone: '+1 (555) 456-7890',
            isActive: true
          },
          {
            id: 'tm4',
            name: 'David Thompson',
            email: 'david@company.com',
            role: 'Business Development',
            phone: '+1 (555) 567-8901',
            isActive: true
          }
        ];
        setTeamMembers(defaultMembers);
        // Optionally save to localStorage
        localStorage.setItem('zervos_team_members', JSON.stringify(defaultMembers));
      } else {
        setTeamMembers(uniqueMembers);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = filterSource === 'all' || lead.source.toLowerCase().includes(filterSource.toLowerCase());
    
    return matchesSearch && matchesSource;
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.city && customer.city.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const handleAddLead = () => {
    if (!newLead.name || !newLead.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least name and email fields.",
        variant: "destructive",
      });
      return;
    }

    const lead: Lead = {
      id: Date.now().toString(),
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      company: newLead.company,
      role: newLead.role,
      source: newLead.source,
      notes: newLead.notes,
      createdAt: new Date().toISOString().split('T')[0],
      appointments: [],
      totalAppointments: 0,
      completedAppointments: 0,
      assigned: newLead.assigned,
    };

    setLeads([lead, ...leads]);
    setIsAddDialogOpen(false);
    setNewLead({
      name: '',
      email: '',
      phone: '',
      company: '',
      role: '',
      source: '',
      notes: '',
      status: '',
      tags: [],
      position: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      zipCode: '',
      leadValue: '',
      website: '',
      defaultLanguage: 'System Default',
      assigned: '',
    });
    setCurrentTag('');
    
    toast({
      title: "Lead Added",
      description: `${newLead.name} has been added to your leads list.`,
    });
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and email fields.",
        variant: "destructive",
      });
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      city: newCustomer.city,
      status: newCustomer.status,
      totalSpent: newCustomer.businessValue,
      createdAt: new Date().toISOString().split('T')[0],
      notes: newCustomer.notes,
      services: newCustomer.services,
      items: newCustomer.items,
      businessValue: newCustomer.businessValue,
    };

    setCustomers([customer, ...customers]);
    setIsAddCustomerDialogOpen(false);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      status: 'active',
      notes: '',
      services: [],
      items: [],
      businessValue: 0,
    });
    setCurrentService('');
    setCurrentItem('');
    
    toast({
      title: "Customer Added",
      description: `${newCustomer.name} has been added to your customer list.`,
    });
  };

  const handleDeleteLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
    toast({
      title: "Lead Deleted",
      description: "The lead has been removed from your list.",
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter(customer => customer.id !== id));
    toast({
      title: "Customer Deleted",
      description: "The customer has been removed from your list.",
    });
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead({
      ...lead,
      tags: [],
      position: lead.role,
      address: '',
      city: '',
      state: '',
      country: 'India',
      zipCode: '',
      leadValue: '',
      website: '',
      defaultLanguage: 'System Default',
      status: 'new',
    });
    setIsEditLeadDialogOpen(true);
  };

  const handleUpdateLead = () => {
    if (!editingLead.name || !editingLead.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least name and email fields.",
        variant: "destructive",
      });
      return;
    }

    const updatedLead: Lead = {
      id: editingLead.id,
      name: editingLead.name,
      email: editingLead.email,
      phone: editingLead.phone,
      company: editingLead.company,
      role: editingLead.role,
      source: editingLead.source,
      notes: editingLead.notes,
      createdAt: editingLead.createdAt,
      appointments: editingLead.appointments || [],
      totalAppointments: editingLead.totalAppointments || 0,
      completedAppointments: editingLead.completedAppointments || 0,
      assigned: editingLead.assigned,
      lastContact: editingLead.lastContact,
    };

    setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l));
    setIsEditLeadDialogOpen(false);
    setEditingLead(null);
    
    toast({
      title: "Lead Updated",
      description: `${updatedLead.name}'s information has been updated.`,
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer({
      ...customer,
    });
    setIsEditCustomerDialogOpen(true);
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer.name || !editingCustomer.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and email fields.",
        variant: "destructive",
      });
      return;
    }

    const updatedCustomer: Customer = {
      ...editingCustomer,
      totalSpent: editingCustomer.businessValue,
    };

    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setIsEditCustomerDialogOpen(false);
    setEditingCustomer(null);
    
    toast({
      title: "Customer Updated",
      description: `${updatedCustomer.name}'s information has been updated.`,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalLeads = filteredLeads.length;
  const totalCustomers = filteredCustomers.length;
  const totalAppointments = filteredLeads.reduce((sum, lead) => sum + lead.totalAppointments, 0);
  const activeLeads = filteredLeads.filter(lead => lead.totalAppointments > 0).length;
  const totalBusinessValue = filteredCustomers.reduce((sum, customer) => sum + customer.businessValue, 0);

  // Load bulk leads from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zervos_bulk_leads');
      if (stored) {
        setBulkLeads(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading bulk leads:', error);
    }
  }, []);

  // Save bulk leads to localStorage
  const saveBulkLeads = (leads: any[]) => {
    try {
      localStorage.setItem('zervos_bulk_leads', JSON.stringify(leads));
      setBulkLeads(leads);
    } catch (error) {
      console.error('Error saving bulk leads:', error);
    }
  };

  // Export to CSV function
  const exportBulkLeadsToCSV = () => {
    if (bulkLeads.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no bulk leads to export. Please add bulk leads first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Helper: CSV escape
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      // Currency & date formatting helpers
      const formatCurrency = (amount: number) => amount ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00';
      const formatDate = (d?: string) => {
        if (!d) return 'Not Set';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return 'Invalid Date';
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      // Compute metrics for Key Metrics block
      const totalLeads = bulkLeads.length;
      const totalEstimated = bulkLeads.reduce((s, l) => s + (l.estimatedDealSize || 0), 0);
      const totalValue = bulkLeads.reduce((s, l) => s + (l.totalValue || 0), 0);
      const totalMRR = bulkLeads.reduce((s, l) => s + (l.potentialMonthlyRecurring || 0), 0);
      const totalARR = totalMRR * 12;
      const totalItems = bulkLeads.reduce((s, l) => s + (l.totalItems || 0), 0);
      const avgDeal = totalLeads ? Math.round(totalEstimated / totalLeads) : 0;
      
      // Calculate median deal size
      const sortedDeals = [...bulkLeads].map(l => l.estimatedDealSize || 0).sort((a, b) => a - b);
      const medianDeal = totalLeads > 0 ? (totalLeads % 2 === 0 ? (sortedDeals[totalLeads / 2 - 1] + sortedDeals[totalLeads / 2]) / 2 : sortedDeals[Math.floor(totalLeads / 2)]) : 0;
      
      // Calculate mode (most common priority)
      const priorityCounts: {[key: string]: number} = {};
      bulkLeads.forEach(l => {
        const p = (l.priority || 'medium').toLowerCase();
        priorityCounts[p] = (priorityCounts[p] || 0) + 1;
      });
      const modePriority = Object.entries(priorityCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.toUpperCase() || 'MEDIUM';
      
      // Status breakdown
      const statusCount = {
        prospect: bulkLeads.filter(l => l.status === 'prospect').length,
        negotiating: bulkLeads.filter(l => l.status === 'negotiating').length,
        committed: bulkLeads.filter(l => l.status === 'committed').length,
        closed: bulkLeads.filter(l => l.status === 'closed').length
      };
      
      const sortedByDeal = [...bulkLeads].sort((a, b) => (b.estimatedDealSize || 0) - (a.estimatedDealSize || 0));
      const top5 = sortedByDeal.slice(0, 5);

      // Column headers (pivot-ready with clear categorization)
      const headers = [
        'Lead ID', 'Status', 'Priority', 'Deal Probability (%)', 
        'Company', 'Contact Person', 'Decision Maker', 'Email', 'Phone', 
        'Industry', 'Company Size', 'Source', 'Assigned To',
        'Estimated Deal (₹)', 'Total Value (₹)', 'MRR (₹)', 'ARR (₹)', 
        'Items Count', 'Items Ordered', 'Services Requested',
        'Budget Range', 'Timeline', 'Days Since Created', 'Days Until Follow-up',
        'Follow-up Date', 'Created Date', 'Last Contact', 
        'Pain Points', 'Competitors', 'Special Requirements', 'Internal Notes', 'Next Action'
      ];

      // Build rows with calculated fields
      const now = new Date();
      const rows = bulkLeads.map(lead => {
        const annual = (lead.potentialMonthlyRecurring || 0) * 12;
        const probability = lead.status === 'closed' ? '100' : lead.status === 'committed' ? '80' : lead.status === 'negotiating' ? '50' : '25';
        const nextAction = lead.status === 'prospect' ? 'Schedule initial call' : lead.status === 'negotiating' ? 'Send proposal' : lead.status === 'committed' ? 'Prepare contract' : 'Account management';
        
        // Calculate days since created and days until follow-up
        const createdDate = lead.createdAt ? new Date(lead.createdAt) : now;
        const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : now;
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilFollowup = Math.floor((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return [
          lead.id || '',
          lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'Prospect',
          (lead.priority || 'MEDIUM').toUpperCase(),
          probability,
          lead.company || '',
          lead.name || '',
          lead.decisionMaker || '',
          lead.email || '',
          lead.phone || '',
          lead.industry || '',
          lead.companySize || '',
          lead.sourceChannel || '',
          lead.assignedTo || 'Unassigned',
          lead.estimatedDealSize ? formatCurrency(lead.estimatedDealSize) : '₹0.00',
          lead.totalValue ? formatCurrency(lead.totalValue) : '₹0.00',
          lead.potentialMonthlyRecurring ? formatCurrency(lead.potentialMonthlyRecurring) : '₹0.00',
          formatCurrency(annual),
          lead.totalItems?.toString() || '0',
          lead.itemsOrdered && lead.itemsOrdered.length > 0 ? lead.itemsOrdered.join(' | ') : 'None',
          lead.servicesRequested && lead.servicesRequested.length > 0 ? lead.servicesRequested.join(' | ') : 'None',
          lead.budget || 'Not Specified',
          lead.timeline || 'Not Specified',
          daysSinceCreated.toString(),
          daysUntilFollowup.toString(),
          formatDate(lead.followUpDate),
          formatDate(lead.createdAt),
          formatDate(lead.lastContactDate),
          lead.painPoints && lead.painPoints.length > 0 ? lead.painPoints.join(' | ') : 'None',
          lead.competitors && lead.competitors.length > 0 ? lead.competitors.join(' | ') : 'None',
          lead.specialRequirements || 'None',
          lead.notes ? lead.notes.replace(/[\r\n]+/g, ' ').trim() : 'No notes',
          nextAction
        ];
      });

      // Build CSV lines: Top section with Key Metrics for readability
      const csv: string[] = [];
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"           BULK LEADS COMPREHENSIVE ANALYTICS REPORT"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push(`"Generated: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}"`);
      csv.push('"Currency: Indian Rupees (₹)"');
      csv.push('');
      csv.push('"━━━ KEY METRICS SUMMARY ━━━"');
      csv.push(`"Total Leads in Pipeline",${totalLeads}`);
      csv.push(`"Total Estimated Deal Value","${formatCurrency(totalEstimated)}"`);
      csv.push(`"Total Pipeline Value","${formatCurrency(totalValue)}"`);
      csv.push(`"Total Monthly Recurring Revenue (MRR)","${formatCurrency(totalMRR)}"`);
      csv.push(`"Total Annual Recurring Revenue (ARR)","${formatCurrency(totalARR)}"`);
      csv.push(`"Total Items/Services Count",${totalItems}`);
      csv.push('');
      csv.push('"━━━ STATISTICAL ANALYSIS ━━━"');
      csv.push(`"Average Deal Size","${formatCurrency(avgDeal)}"`);
      csv.push(`"Median Deal Size","${formatCurrency(medianDeal)}"`);
      csv.push(`"Most Common Priority Level","${modePriority}"`);
      csv.push('');
      csv.push('"━━━ STATUS BREAKDOWN ━━━"');
      csv.push(`"Prospect Leads",${statusCount.prospect}`);
      csv.push(`"Negotiating Deals",${statusCount.negotiating}`);
      csv.push(`"Committed Deals",${statusCount.committed}`);
      csv.push(`"Closed Deals",${statusCount.closed}`);
      csv.push('');

      // Top 5 leads (readable block)
      csv.push('"━━━ TOP 5 HIGHEST VALUE LEADS ━━━"');
      if (top5.length === 0) {
        csv.push('"No leads available"');
      } else {
        csv.push('"Rank","Lead ID","Company","Contact Person","Decision Maker","Status","Estimated Deal (₹)","Priority"');
        top5.forEach((l, idx) => {
          csv.push([
            `"#${idx + 1}"`, 
            escapeCSV(l.id || 'N/A'), 
            escapeCSV(l.company || 'N/A'), 
            escapeCSV(l.name || 'N/A'), 
            escapeCSV(l.decisionMaker || 'N/A'),
            escapeCSV(l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : 'Prospect'),
            escapeCSV(formatCurrency(l.estimatedDealSize || 0)),
            escapeCSV((l.priority || 'medium').toUpperCase())
          ].join(','));
        });
      }
      csv.push('');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                    DETAILED LEADS DATA"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('');

      // Add the column headers row
      csv.push(headers.map(h => '"' + h + '"').join(','));

      // Add data rows
      rows.forEach(r => {
        csv.push(r.map(c => escapeCSV(c)).join(','));
      });

      // Summary row with totals
      csv.push('');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                      TOTALS & SUMMARY"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"Metric","Value"');
      csv.push(`"Total Leads",${totalLeads}`);
      csv.push(`"Total Estimated Deals","${formatCurrency(totalEstimated)}"`);
      csv.push(`"Total Pipeline Value","${formatCurrency(totalValue)}"`);
      csv.push(`"Total MRR","${formatCurrency(totalMRR)}"`);
      csv.push(`"Total ARR","${formatCurrency(totalARR)}"`);
      csv.push(`"Total Items Count",${totalItems}`);
      csv.push(`"Average Deal Size","${formatCurrency(avgDeal)}"`);
      csv.push(`"Median Deal Size","${formatCurrency(medianDeal)}"`);
      csv.push('');

      // Column descriptions for user clarity
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                  COLUMN REFERENCE GUIDE"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"Column Name","Description"');
      csv.push('"Lead ID","Unique internal identifier for tracking"');
      csv.push('"Status","Current stage: Prospect → Negotiating → Committed → Closed"');
      csv.push('"Priority","Urgency level: HIGH / MEDIUM / LOW"');
      csv.push('"Deal Probability (%)","Success likelihood: Prospect=25% | Negotiating=50% | Committed=80% | Closed=100%"');
      csv.push('"Estimated Deal (₹)","Sales team projected revenue for this opportunity"');
      csv.push('"Total Value (₹)","Calculated sum of all items and services"');
      csv.push('"MRR (₹)","Monthly Recurring Revenue - ongoing monthly income"');
      csv.push('"ARR (₹)","Annual Recurring Revenue - calculated as MRR × 12"');
      csv.push('"Days Since Created","Number of days in pipeline (auto-calculated)"');
      csv.push('"Days Until Follow-up","Days remaining until scheduled follow-up (negative = overdue)"');
      csv.push('"Items Ordered","Products/items requested (separated by |)"');
      csv.push('"Services Requested","Services needed (separated by |)"');
      csv.push('"Pain Points","Customer challenges we can solve"');
      csv.push('"Competitors","Other vendors being considered"');
      csv.push('"Next Action","Recommended next step based on current status"');
      csv.push('');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                    IMPORTANT NOTES"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"• All currency values are in Indian Rupees (₹)"');
      csv.push('"• Use Excel or Google Sheets for best viewing experience"');
      csv.push('"• Enable filters on header row for easy data analysis"');
      csv.push('"• Create pivot tables using Status, Priority, or Industry columns"');
      csv.push('"• Sort by Estimated Deal to prioritize high-value opportunities"');
      csv.push('"• Filter by Days Until Follow-up to identify urgent actions"');
      csv.push(`"• Report generated on: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}"`);
      csv.push('"• For questions or support, contact your sales manager"');
      csv.push('"═══════════════════════════════════════════════════════════════"');

      // Create and download
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Bulk_Leads_Professional_Report_${ts}.csv`;
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Export Complete', description: `Professional CSV exported (${totalLeads} leads). File: ${filename}` });
    } catch (err) {
      console.error('export error', err);
      toast({ title: 'Export Failed', description: 'Could not generate CSV. Check console for details.', variant: 'destructive' });
    }
  };

  // Export individual bulk lead to CSV
  const exportIndividualBulkLead = (lead: BulkLead) => {
    try {
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      const formatCurrency = (amount: number) => amount ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00';
      const formatDate = (d?: string) => {
        if (!d) return 'Not Set';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return 'Invalid Date';
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const annual = (lead.potentialMonthlyRecurring || 0) * 12;
      const probability = lead.status === 'closed' ? '100' : lead.status === 'committed' ? '80' : lead.status === 'negotiating' ? '50' : '25';
      const now = new Date();
      const createdDate = lead.createdAt ? new Date(lead.createdAt) : now;
      const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : now;
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilFollowup = Math.floor((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const csv: string[] = [];
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"              INDIVIDUAL BULK LEAD DETAILED REPORT"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push(`"Report Generated: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}"`);
      csv.push(`"Lead ID: ${lead.id}"`);
      csv.push('"Currency: Indian Rupees (₹)"');
      csv.push('');

      csv.push('"━━━ LEAD OVERVIEW ━━━"');
      csv.push('"Field","Value"');
      csv.push(`"Lead ID","${escapeCSV(lead.id)}"`);
      csv.push(`"Status","${lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'Prospect'}"`);
      csv.push(`"Priority Level","${(lead.priority || 'MEDIUM').toUpperCase()}"`);
      csv.push(`"Deal Probability","${probability}%"`);
      csv.push(`"Created Date","${formatDate(lead.createdAt)}"`);
      csv.push(`"Days in Pipeline","${daysSinceCreated} days"`);
      csv.push(`"Follow-up Date","${formatDate(lead.followUpDate)}"`);
      csv.push(`"Days Until Follow-up","${daysUntilFollowup} days ${daysUntilFollowup < 0 ? '(OVERDUE)' : ''}"`);
      csv.push('');

      csv.push('"━━━ CONTACT INFORMATION ━━━"');
      csv.push('"Field","Value"');
      csv.push(`"Company Name","${escapeCSV(lead.company)}"`);
      csv.push(`"Contact Person","${escapeCSV(lead.name)}"`);
      csv.push(`"Decision Maker","${escapeCSV(lead.decisionMaker || 'Not Specified')}"`);
      csv.push(`"Email Address","${escapeCSV(lead.email)}"`);
      csv.push(`"Phone Number","${escapeCSV(lead.phone)}"`);
      csv.push(`"Industry","${escapeCSV(lead.industry || 'Not Specified')}"`);
      csv.push(`"Company Size","${escapeCSV(lead.companySize || 'Not Specified')}"`);
      csv.push(`"Source Channel","${escapeCSV(lead.sourceChannel)}"`);
      csv.push(`"Assigned Sales Rep","${escapeCSV(lead.assignedTo || 'Unassigned')}"`);
      csv.push('');

      csv.push('"━━━ FINANCIAL METRICS ━━━"');
      csv.push('"Metric","Amount"');
      csv.push(`"Estimated Deal Size","${formatCurrency(lead.estimatedDealSize || 0)}"`);
      csv.push(`"Total Deal Value","${formatCurrency(lead.totalValue || 0)}"`);
      csv.push(`"Monthly Recurring Revenue (MRR)","${formatCurrency(lead.potentialMonthlyRecurring || 0)}"`);
      csv.push(`"Annual Recurring Revenue (ARR)","${formatCurrency(annual)}"`);
      csv.push(`"Budget Range","${escapeCSV(lead.budget || 'Not Specified')}"`);
      csv.push(`"Expected Timeline","${escapeCSV(lead.timeline || 'Not Specified')}"`);
      csv.push('');

      csv.push('"━━━ ITEMS & SERVICES ━━━"');
      csv.push(`"Total Items/Services Count",${lead.totalItems || 0}`);
      csv.push('');
      csv.push('"Items Ordered:"');
      if (lead.itemsOrdered && lead.itemsOrdered.length > 0) {
        lead.itemsOrdered.forEach((item, idx) => {
          csv.push(`"${idx + 1}. ${escapeCSV(item)}"`);
        });
      } else {
        csv.push('"None"');
      }
      csv.push('');
      csv.push('"Services Requested:"');
      if (lead.servicesRequested && lead.servicesRequested.length > 0) {
        lead.servicesRequested.forEach((service, idx) => {
          csv.push(`"${idx + 1}. ${escapeCSV(service)}"`);
        });
      } else {
        csv.push('"None"');
      }
      csv.push('');

      csv.push('"━━━ CUSTOMER INSIGHTS ━━━"');
      csv.push('"Pain Points:"');
      if (lead.painPoints && lead.painPoints.length > 0) {
        lead.painPoints.forEach((point, idx) => {
          csv.push(`"${idx + 1}. ${escapeCSV(point)}"`);
        });
      } else {
        csv.push('"None identified"');
      }
      csv.push('');
      csv.push('"Competing Vendors:"');
      if (lead.competitors && lead.competitors.length > 0) {
        lead.competitors.forEach((comp, idx) => {
          csv.push(`"${idx + 1}. ${escapeCSV(comp)}"`);
        });
      } else {
        csv.push('"No competitors identified"');
      }
      csv.push('');

      csv.push('"━━━ ADDITIONAL DETAILS ━━━"');
      csv.push('"Special Requirements:"');
      csv.push(`"${escapeCSV(lead.specialRequirements || 'None')}"`);
      csv.push('');
      csv.push('"Internal Notes:"');
      csv.push(`"${escapeCSV(lead.notes || 'No notes available')}"`);
      csv.push('');
      csv.push('"Last Contact Date:"');
      csv.push(`"${formatDate(lead.lastContactDate)}"`);
      csv.push('');

      csv.push('"━━━ RECOMMENDED ACTIONS ━━━"');
      const nextAction = lead.status === 'prospect' ? 'Schedule initial call to understand requirements' : 
                        lead.status === 'negotiating' ? 'Send detailed proposal with pricing breakdown' : 
                        lead.status === 'committed' ? 'Prepare contract and onboarding documentation' : 
                        'Account management and upsell opportunities';
      csv.push(`"Next Action: ${nextAction}"`);
      csv.push('');

      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                        SUMMARY"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"This is a detailed report for a single bulk lead opportunity."');
      csv.push('"For comprehensive pipeline analysis, export the full bulk leads report."');
      csv.push('');
      csv.push('"Report Information:"');
      csv.push(`"- Generated on: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}"`);
      csv.push('"- All currency values in Indian Rupees (₹)"');
      csv.push('"- For questions, contact your sales manager"');
      csv.push('"═══════════════════════════════════════════════════════════════"');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `Bulk_Lead_${lead.company?.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.csv`;
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ 
        title: 'Individual Report Exported', 
        description: `Downloaded detailed report for ${lead.company}` 
      });
    } catch (err) {
      console.error('Individual export error', err);
      toast({ 
        title: 'Export Failed', 
        description: 'Could not generate individual report.', 
        variant: 'destructive' 
      });
    }
  };

  // Export leads to CSV
  const exportLeadsToCSV = () => {
    if (filteredLeads.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no leads to export. Please add leads first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      const formatDate = (d?: string) => {
        if (!d) return 'Not Set';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return 'Invalid Date';
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const totalLeads = filteredLeads.length;
      const totalAppointments = filteredLeads.reduce((s, l) => s + (l.totalAppointments || 0), 0);
      const completedAppointments = filteredLeads.reduce((s, l) => s + (l.completedAppointments || 0), 0);
      const conversionRate = totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : '0';

      // Source breakdown
      const sourceCount: {[key: string]: number} = {};
      filteredLeads.forEach(l => {
        const src = l.source || 'Unknown';
        sourceCount[src] = (sourceCount[src] || 0) + 1;
      });

      const headers = [
        'Lead ID', 'Name', 'Email', 'Phone', 'Company', 'Role', 'Source', 'Status',
        'Assigned To', 'Total Appointments', 'Completed', 'Pending', 'Conversion Rate (%)',
        'Created Date', 'Last Contact', 'Days Since Created', 'Notes', 'Tags'
      ];

      const now = new Date();
      const rows = filteredLeads.map(lead => {
        const createdDate = lead.createdAt ? new Date(lead.createdAt) : now;
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const pending = (lead.totalAppointments || 0) - (lead.completedAppointments || 0);
        const convRate = lead.totalAppointments > 0 ? ((lead.completedAppointments / lead.totalAppointments) * 100).toFixed(1) : '0';

        return [
          lead.id || '',
          lead.name || '',
          lead.email || '',
          lead.phone || '',
          lead.company || '',
          lead.role || '',
          lead.source || '',
          'Active',
          lead.assigned || 'Unassigned',
          lead.totalAppointments?.toString() || '0',
          lead.completedAppointments?.toString() || '0',
          pending.toString(),
          convRate,
          formatDate(lead.createdAt),
          formatDate(lead.lastContact),
          daysSinceCreated.toString(),
          lead.notes ? lead.notes.replace(/[\r\n]+/g, ' ').trim() : 'No notes',
          '' // Tags placeholder
        ];
      });

      const csv: string[] = [];
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                  LEADS COMPREHENSIVE REPORT"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push(`"Generated: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}"`);
      csv.push(`"Filter Applied: ${filterSource === 'all' ? 'All Sources' : filterSource.charAt(0).toUpperCase() + filterSource.slice(1)}"`);
      csv.push('');

      csv.push('"━━━ KEY METRICS SUMMARY ━━━"');
      csv.push(`"Total Leads",${totalLeads}`);
      csv.push(`"Total Appointments",${totalAppointments}`);
      csv.push(`"Completed Appointments",${completedAppointments}`);
      csv.push(`"Overall Conversion Rate","${conversionRate}%"`);
      csv.push('');

      csv.push('"━━━ LEADS BY SOURCE ━━━"');
      csv.push('"Source","Count"');
      Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
        csv.push(`"${src}",${count}`);
      });
      csv.push('');

      csv.push('"━━━ TOP 10 MOST ACTIVE LEADS ━━━"');
      const topLeads = [...filteredLeads].sort((a, b) => (b.totalAppointments || 0) - (a.totalAppointments || 0)).slice(0, 10);
      if (topLeads.length > 0) {
        csv.push('"Rank","Name","Company","Total Appointments","Completed","Source"');
        topLeads.forEach((l, idx) => {
          csv.push([
            `"#${idx + 1}"`,
            escapeCSV(l.name),
            escapeCSV(l.company || 'N/A'),
            l.totalAppointments || 0,
            l.completedAppointments || 0,
            escapeCSV(l.source || 'Unknown')
          ].join(','));
        });
      } else {
        csv.push('"No leads available"');
      }
      csv.push('');

      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                    DETAILED LEADS DATA"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('');

      csv.push(headers.map(h => '"' + h + '"').join(','));
      rows.forEach(r => {
        csv.push(r.map(c => escapeCSV(c)).join(','));
      });

      csv.push('');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                      SUMMARY"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"Metric","Value"');
      csv.push(`"Total Leads Exported",${totalLeads}`);
      csv.push(`"Total Appointments",${totalAppointments}`);
      csv.push(`"Completed Appointments",${completedAppointments}`);
      csv.push(`"Conversion Rate","${conversionRate}%"`);
      csv.push('');

      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                  COLUMN REFERENCE GUIDE"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"Column Name","Description"');
      csv.push('"Lead ID","Unique internal identifier"');
      csv.push('"Conversion Rate (%)","Percentage of completed vs total appointments"');
      csv.push('"Days Since Created","Number of days since lead was added"');
      csv.push('"Pending","Appointments scheduled but not yet completed"');
      csv.push('');
      csv.push('"Important Notes:"');
      csv.push('"• Use Excel or Google Sheets for best viewing experience"');
      csv.push('"• Enable filters on header row for easy data analysis"');
      csv.push('"• Create pivot tables using Source or Status columns"');
      csv.push(`"• Report generated on: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}"`);
      csv.push('"═══════════════════════════════════════════════════════════════"');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `Leads_Report_${filterSource !== 'all' ? filterSource + '_' : ''}${ts}.csv`;
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ 
        title: 'Export Complete', 
        description: `Downloaded report with ${totalLeads} leads. Conversion rate: ${conversionRate}%` 
      });
    } catch (err) {
      console.error('export error', err);
      toast({ 
        title: 'Export Failed', 
        description: 'Could not generate CSV. Check console for details.', 
        variant: 'destructive' 
      });
    }
  };

  // Export Customers to CSV
  const exportCustomersToCSV = () => {
    try {
      const csv: string[] = [];
      const escape = (str: string | number | undefined) => {
        if (str === undefined || str === null) return '""';
        const s = String(str);
        return `"${s.replace(/"/g, '""')}"`;
      };

      const totalCustomers = filteredCustomers.length;
      const activeCustomers = filteredCustomers.filter(c => c.status === 'active').length;
      const inactiveCustomers = totalCustomers - activeCustomers;
      const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
      const totalBusinessValue = filteredCustomers.reduce((sum, c) => sum + c.businessValue, 0);
      const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      const avgBusinessValue = totalCustomers > 0 ? totalBusinessValue / totalCustomers : 0;

      // Calculate top customers
      const topCustomers = [...filteredCustomers]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // Calculate customers by city
      const cityCount: Record<string, number> = {};
      filteredCustomers.forEach(c => {
        const city = c.city || 'Unknown';
        cityCount[city] = (cityCount[city] || 0) + 1;
      });

      // Header
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                CUSTOMERS COMPREHENSIVE REPORT"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push(`"Generated: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}"`);
      if (searchQuery) {
        csv.push(`"Search Filter: ${searchQuery}"`);
      }
      csv.push('');

      // Key Metrics
      csv.push('"━━━ KEY METRICS SUMMARY ━━━"');
      csv.push('"Total Customers",' + totalCustomers);
      csv.push('"Active Customers",' + activeCustomers);
      csv.push('"Inactive Customers",' + inactiveCustomers);
      csv.push(`"Total Revenue","₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`);
      csv.push(`"Total Business Value","₹${totalBusinessValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`);
      csv.push(`"Avg. Revenue per Customer","₹${avgSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`);
      csv.push(`"Avg. Business Value","₹${avgBusinessValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`);
      csv.push(`"Active Rate","${totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(1) : 0}%"`);
      csv.push('');

      // Customers by City
      csv.push('"━━━ CUSTOMERS BY CITY ━━━"');
      csv.push('"City","Count","Percentage"');
      Object.entries(cityCount)
        .sort(([, a], [, b]) => b - a)
        .forEach(([city, count]) => {
          const pct = ((count / totalCustomers) * 100).toFixed(1);
          csv.push(`${escape(city)},${count},"${pct}%"`);
        });
      csv.push('');

      // Top 10 Customers
      csv.push('"━━━ TOP 10 HIGHEST SPENDING CUSTOMERS ━━━"');
      csv.push('"Rank","Name","Total Spent","Business Value","Status","City"');
      topCustomers.forEach((customer, idx) => {
        const rank = `#${idx + 1}`;
        const spent = `₹${customer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const bv = `₹${customer.businessValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        csv.push(`${escape(rank)},${escape(customer.name)},${escape(spent)},${escape(bv)},${escape(customer.status)},${escape(customer.city || 'N/A')}`);
      });
      csv.push('');

      // Detailed Data
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                    DETAILED CUSTOMERS DATA"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('');

      // Column Headers
      csv.push([
        '"Customer ID"',
        '"Name"',
        '"Email"',
        '"Phone"',
        '"Address"',
        '"City"',
        '"Status"',
        '"Total Spent"',
        '"Business Value"',
        '"Last Purchase"',
        '"Created Date"',
        '"Days Since Created"',
        '"Days Since Last Purchase"',
        '"Services"',
        '"Items"',
        '"Notes"'
      ].join(','));

      // Data Rows
      filteredCustomers.forEach(customer => {
        const daysSinceCreated = customer.createdAt 
          ? Math.floor((new Date().getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        const daysSinceLastPurchase = customer.lastPurchase
          ? Math.floor((new Date().getTime() - new Date(customer.lastPurchase).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const services = customer.services && customer.services.length > 0 
          ? customer.services.join(', ') 
          : 'None';
        
        const items = customer.items && customer.items.length > 0 
          ? customer.items.join(', ') 
          : 'None';

        const spent = `₹${customer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const bv = `₹${customer.businessValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const lastPurchase = customer.lastPurchase 
          ? new Date(customer.lastPurchase).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'N/A';
        
        const createdDate = customer.createdAt
          ? new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'N/A';

        csv.push([
          escape(customer.id),
          escape(customer.name),
          escape(customer.email),
          escape(customer.phone),
          escape(customer.address || 'N/A'),
          escape(customer.city || 'N/A'),
          escape(customer.status),
          escape(spent),
          escape(bv),
          escape(lastPurchase),
          escape(createdDate),
          escape(daysSinceCreated),
          escape(daysSinceLastPurchase !== null ? daysSinceLastPurchase : 'N/A'),
          escape(services),
          escape(items),
          escape(customer.notes || '')
        ].join(','));
      });

      csv.push('');

      // Summary
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                      SUMMARY"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"Metric","Value"');
      csv.push(`"Total Customers Exported",${totalCustomers}`);
      csv.push(`"Active Customers",${activeCustomers}`);
      csv.push(`"Inactive Customers",${inactiveCustomers}`);
      csv.push(`"Total Revenue","₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`);
      csv.push(`"Total Business Value","₹${totalBusinessValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`);
      csv.push(`"Average Customer Value","₹${avgBusinessValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`);
      csv.push('');

      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"                  COLUMN REFERENCE GUIDE"');
      csv.push('"═══════════════════════════════════════════════════════════════"');
      csv.push('"Column Name","Description"');
      csv.push('"Customer ID","Unique internal identifier"');
      csv.push('"Total Spent","Total amount spent by customer (all-time revenue)"');
      csv.push('"Business Value","Estimated lifetime value of customer"');
      csv.push('"Days Since Created","Number of days since customer was added"');
      csv.push('"Days Since Last Purchase","Days elapsed since last transaction"');
      csv.push('"Services","List of services purchased by customer"');
      csv.push('"Items","List of items/products purchased"');
      csv.push('');
      csv.push('"Important Notes:"');
      csv.push('"• Use Excel or Google Sheets for best viewing experience"');
      csv.push('"• Enable filters on header row for easy data analysis"');
      csv.push('"• Create pivot tables using City or Status columns"');
      csv.push('"• Sort by Total Spent to identify high-value customers"');
      csv.push(`"• Report generated on: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}"`);
      csv.push('"═══════════════════════════════════════════════════════════════"');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `Customers_Report_${searchQuery ? 'filtered_' : ''}${ts}.csv`;
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ 
        title: 'Export Complete', 
        description: `Downloaded report with ${totalCustomers} customers. Total revenue: ₹${totalRevenue.toLocaleString('en-IN')}` 
      });
    } catch (err) {
      console.error('export error', err);
      toast({ 
        title: 'Export Failed', 
        description: 'Could not generate CSV. Check console for details.', 
        variant: 'destructive' 
      });
    }
  };

  // Delete bulk lead
  const handleDeleteBulkLead = (id: string) => {
    const updated = bulkLeads.filter(lead => lead.id !== id);
    saveBulkLeads(updated);
    toast({
      title: "Bulk Lead Deleted",
      description: "The bulk lead has been removed.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalLeads}</div>
              <p className="text-xs text-slate-500 mt-1">Potential customers</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-gradient-to-br from-brand-50 to-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-brand-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalCustomers}</div>
              <p className="text-xs text-slate-500 mt-1">Active customers</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-gradient-to-br from-green-50 to-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Leads</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{activeLeads}</div>
              <p className="text-xs text-slate-500 mt-1">With appointments</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalAppointments}</div>
              <p className="text-xs text-slate-500 mt-1">All customer meetings</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-gradient-to-br from-orange-50 to-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Leads to customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Header and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads & Customer Management</h1>
            <p className="text-sm text-slate-600">Track leads, customers, and appointment history</p>
          </div>

          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={() => setIsBulkLeadDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Users className="mr-2 h-4 w-4" />
                Bulk Leads
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={() => setIsAddCustomerDialogOpen(true)}
                className="bg-brand-600 hover:bg-brand-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Tabs for Leads and Customers */}
        <Tabs defaultValue="leads" className="w-full" onValueChange={(value) => setActiveTab(value as 'leads' | 'customers')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Leads ({totalLeads})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers ({totalCustomers})
            </TabsTrigger>
          </TabsList>

          {/* Search and Filter */}
          <Card className="border-slate-200 bg-white shadow-sm mt-4">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={activeTab === 'leads' ? "Search leads by name, email, company..." : "Search customers by name, email, city..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {activeTab === 'leads' && (
                  <>
                    <Select value={filterSource} onValueChange={setFilterSource}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={exportLeadsToCSV}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      disabled={filteredLeads.length === 0}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </>
                )}
                {activeTab === 'customers' && (
                  <Button
                    onClick={exportCustomersToCSV}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    disabled={filteredCustomers.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <TabsContent value="leads">
            <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No customers found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {searchQuery || filterSource !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Get started by adding your first customer'}
                </p>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[18%]">
                        Customer
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[15%]">
                        Company & Role
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[18%]">
                        Contact
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                        Source
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[17%]">
                        Notes
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                        Appointments
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[8%]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredLeads.map((lead, index) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* Customer Name */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-brand-200 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold">
                                {getInitials(lead.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-slate-900">{lead.name}</p>
                                {lead.totalAppointments > 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              {lead.lastContact && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  Last: {new Date(lead.lastContact).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Company & Role */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900 text-sm flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{lead.company}</span>
                            </p>
                            <p className="text-sm text-slate-600 flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{lead.role}</span>
                            </p>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <a 
                              href={`mailto:${lead.email}`} 
                              className="text-sm text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1 group"
                            >
                              <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                            <a 
                              href={`tel:${lead.phone}`}
                              className="text-sm text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1 group"
                            >
                              <Phone className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600 flex-shrink-0" />
                              <span>{lead.phone}</span>
                            </a>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {lead.source}
                          </Badge>
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-4">
                          {lead.notes ? (
                            <div>
                              <p className="text-sm text-slate-600 line-clamp-2" title={lead.notes}>
                                {lead.notes}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No notes</span>
                          )}
                        </td>

                        {/* Appointments Stats */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-900">{lead.totalAppointments}</span>
                              </div>
                              <span className="text-xs text-slate-500 mt-1">Total</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-green-900">{lead.completedAppointments}</span>
                              </div>
                              <span className="text-xs text-slate-500 mt-1">Done</span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsViewDialogOpen(true);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Full Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    toast({
                                      title: "Coming Soon",
                                      description: "Appointment booking feature will be available soon.",
                                    });
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Book Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.location.href = `mailto:${lead.email}`;
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (window.confirm(`Are you sure you want to delete ${lead.name}? This action cannot be undone.`)) {
                                      handleDeleteLead(lead.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Customers Table */}
      <TabsContent value="customers">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No customers found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {searchQuery 
                    ? 'Try adjusting your search' 
                    : 'Get started by adding your first customer'}
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[20%]">
                        Customer
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[20%]">
                        Contact
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[15%]">
                        Location
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                        Status
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[15%]">
                        Business Value
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[10%]">
                        Joined
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[8%]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCustomers.map((customer, index) => (
                      <motion.tr 
                        key={customer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-brand-200">
                              <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold">
                                {getInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-slate-900">{customer.name}</div>
                              <div className="text-sm text-slate-500">ID: {customer.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="h-4 w-4 text-slate-400" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="h-4 w-4 text-slate-400" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-700">
                            {customer.city || 'N/A'}
                          </div>
                          {customer.address && (
                            <div className="text-xs text-slate-500 truncate max-w-[150px]">
                              {customer.address}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge 
                            variant="outline" 
                            className={customer.status === 'active' 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-slate-100 text-slate-600 border-slate-200"}
                          >
                            {customer.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-green-600">
                            ${customer.businessValue.toFixed(2)}
                          </div>
                          {customer.services && customer.services.length > 0 && (
                            <div className="text-xs text-slate-500">
                              {customer.services.length} service{customer.services.length > 1 ? 's' : ''}
                            </div>
                          )}
                          {customer.items && customer.items.length > 0 && (
                            <div className="text-xs text-slate-500">
                              {customer.items.length} item{customer.items.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-700">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCustomer(customer);
                                  setIsViewCustomerDialogOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditCustomer(customer)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.location.href = `mailto:${customer.email}`;
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
                                      handleDeleteCustomer(customer.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="text-2xl flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <User className="h-6 w-6 text-brand-600" />
                </motion.div>
                Add New Lead
              </DialogTitle>
              <DialogDescription>
                Create a comprehensive customer profile with all relevant details
              </DialogDescription>
            </motion.div>
          </DialogHeader>
          
          <motion.div 
            className="grid gap-6 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Status and Source Row */}
            <motion.div 
              className="grid grid-cols-3 gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <div className="grid gap-2">
                <Label htmlFor="status" className="flex items-center gap-1">
                  <span className="text-red-500">*</span> Status
                </Label>
                <Select value={newLead.status} onValueChange={(value) => setNewLead({ ...newLead, status: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-brand-500 focus:ring-brand-200">
                    <SelectValue placeholder="Non selected" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="negotiation">In Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="source" className="flex items-center gap-1">
                  <span className="text-red-500">*</span> Source
                </Label>
                <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-brand-500 focus:ring-brand-200">
                    <SelectValue placeholder="Non selected" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website Contact Form">Website Contact Form</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Trade Show">Trade Show</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assigned">
                  Assigned {company?.teamMemberLabel || 'Team Member'}
                </Label>
                <Select 
                  value={newLead.assigned}
                  onValueChange={(value) => setNewLead({...newLead, assigned: value})}
                >
                  <SelectTrigger className="border-slate-300 focus:border-brand-500 focus:ring-brand-200">
                    <SelectValue placeholder={teamMembers.length > 0 ? `Select ${company?.teamMemberLabel || 'Team Member'}` : 'No staff available'} />
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
            </motion.div>

            {/* Tags */}
            <motion.div 
              className="grid gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="tags" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                Tags
              </Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add tag and press Enter"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentTag.trim()) {
                        e.preventDefault();
                        setNewLead({ ...newLead, tags: [...newLead.tags, currentTag.trim()] });
                        setCurrentTag('');
                      }
                    }}
                    className="flex-1 border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentTag.trim()) {
                        setNewLead({ ...newLead, tags: [...newLead.tags, currentTag.trim()] });
                        setCurrentTag('');
                      }
                    }}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newLead.tags.length > 0 && (
                  <motion.div 
                    className="flex flex-wrap gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {newLead.tags.map((tag, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="flex items-center gap-1 bg-brand-100 text-brand-800 border-brand-200"
                        >
                          {tag}
                          <button
                            onClick={() => setNewLead({ ...newLead, tags: newLead.tags.filter((_, i) => i !== index) })}
                            className="ml-1 hover:text-brand-900"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Name and Email */}
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="grid gap-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <span className="text-red-500">*</span> Name
                </Label>
                <motion.div whileFocus={{ scale: 1.01 }}>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                  />
                </motion.div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <motion.div whileFocus={{ scale: 1.01 }}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Address and Position */}
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Street address"
                  value={newLead.address}
                  onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                  rows={3}
                  className="border-slate-300 focus:border-brand-500 focus:ring-brand-200 resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    placeholder="Job title"
                    value={newLead.position}
                    onChange={(e) => setNewLead({ ...newLead, position: e.target.value })}
                    className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* State, Country, Zip */}
            <motion.div 
              className="grid grid-cols-3 gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State/Province"
                  value={newLead.state}
                  onChange={(e) => setNewLead({ ...newLead, state: e.target.value })}
                  className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Select value={newLead.country} onValueChange={(value) => setNewLead({ ...newLead, country: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-brand-500 focus:ring-brand-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  placeholder="Postal code"
                  value={newLead.zipCode}
                  onChange={(e) => setNewLead({ ...newLead, zipCode: e.target.value })}
                  className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                />
              </div>
            </motion.div>

            {/* Phone, Website, Company */}
            <motion.div 
              className="grid grid-cols-3 gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={newLead.website}
                  onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
                  className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Company name"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  className="border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                />
              </div>
            </motion.div>

            {/* Lead Value and Language */}
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <div className="grid gap-2">
                <Label htmlFor="leadValue">Lead value</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <Input
                    id="leadValue"
                    type="number"
                    placeholder="0"
                    value={newLead.leadValue}
                    onChange={(e) => setNewLead({ ...newLead, leadValue: e.target.value })}
                    className="pl-8 border-slate-300 focus:border-brand-500 focus:ring-brand-200"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select value={newLead.defaultLanguage} onValueChange={(value) => setNewLead({ ...newLead, defaultLanguage: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-brand-500 focus:ring-brand-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="System Default">System Default</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Notes */}
            <motion.div 
              className="grid gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any relevant notes about this customer..."
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                rows={3}
                className="border-slate-300 focus:border-brand-500 focus:ring-brand-200 resize-none"
              />
            </motion.div>
          </motion.div>

          <DialogFooter>
            <motion.div 
              className="flex gap-2 w-full sm:w-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewLead({
                    name: '',
                    email: '',
                    phone: '',
                    company: '',
                    role: '',
                    source: '',
                    notes: '',
                    status: '',
                    tags: [],
                    position: '',
                    address: '',
                    city: '',
                    state: '',
                    country: 'India',
                    zipCode: '',
                    leadValue: '',
                    website: '',
                    defaultLanguage: 'System Default',
                    assigned: '',
                  });
                  setCurrentTag('');
                }}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleAddLead}
                  disabled={!newLead.name}
                  className="bg-brand-600 hover:bg-brand-700 flex-1 sm:flex-none"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  </motion.div>
                  Add Lead
                </Button>
              </motion.div>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-brand-200">
                    <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold text-xl">
                      {getInitials(selectedLead.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">{selectedLead.name}</DialogTitle>
                    <DialogDescription>
                      {selectedLead.role} at {selectedLead.company}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Customer Info</TabsTrigger>
                  <TabsTrigger value="appointments">
                    Appointments ({selectedLead.appointments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <a href={`mailto:${selectedLead.email}`} className="text-sm hover:text-brand-600">
                            {selectedLead.email}
                          </a>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Phone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <a href={`tel:${selectedLead.phone}`} className="text-sm hover:text-brand-600">
                            {selectedLead.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Company</Label>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <p className="text-sm">{selectedLead.company}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Role</Label>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-slate-400" />
                          <p className="text-sm">{selectedLead.role}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Source</Label>
                        <p className="text-sm">{selectedLead.source}</p>
                      </div>
                      {selectedLead.assigned && (
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">Assigned To</Label>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <p className="text-sm">
                              {teamMembers.find(m => m.id === selectedLead.assigned)?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedLead.notes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">Notes</Label>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-sm text-slate-700">{selectedLead.notes}</p>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Customer Since</Label>
                        <p className="text-sm">{new Date(selectedLead.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                      {selectedLead.lastContact && (
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">Last Contact</Label>
                          <p className="text-sm">{new Date(selectedLead.lastContact).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appointments" className="space-y-4 mt-4">
                  {selectedLead.appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-slate-300 mx-auto" />
                      <p className="mt-4 text-sm text-slate-600">No appointments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedLead.appointments.map((appointment) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-slate-900">{appointment.service}</h4>
                                <Badge className={`${appointmentStatusColors[appointment.status]} border text-xs`}>
                                  {appointment.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {appointment.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                                  {appointment.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(appointment.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {appointment.time}
                                </div>
                              </div>
                              {appointment.notes && (
                                <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded p-2">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button className="bg-brand-600 hover:bg-brand-700">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book New Appointment
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="text-2xl flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Users className="h-6 w-6 text-brand-600" />
                </motion.div>
                Add New Customer
              </DialogTitle>
              <DialogDescription>
                Add a verified customer with essential contact information
              </DialogDescription>
            </motion.div>
          </DialogHeader>
          
          <motion.div 
            className="grid gap-4 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Name and Email Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer-name" className="flex items-center gap-1">
                  <span className="text-red-500">*</span> Full Name
                </Label>
                <Input
                  id="customer-name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="border-slate-300 focus:border-brand-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-email" className="flex items-center gap-1">
                  <span className="text-red-500">*</span> Email Address
                </Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="border-slate-300 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Phone Number</Label>
              <Input
                id="customer-phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="border-slate-300 focus:border-brand-500"
              />
            </div>

            {/* Address and City Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer-address">Address</Label>
                <Input
                  id="customer-address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="border-slate-300 focus:border-brand-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-city">City</Label>
                <Input
                  id="customer-city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  className="border-slate-300 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Services Taken */}
            <div className="grid gap-2">
              <Label htmlFor="customer-services" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-500" />
                Services Taken
              </Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="customer-services"
                    placeholder="Add service and press Enter"
                    value={currentService}
                    onChange={(e) => setCurrentService(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentService.trim()) {
                        e.preventDefault();
                        setNewCustomer({ ...newCustomer, services: [...newCustomer.services, currentService.trim()] });
                        setCurrentService('');
                      }
                    }}
                    className="flex-1 border-slate-300 focus:border-brand-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentService.trim()) {
                        setNewCustomer({ ...newCustomer, services: [...newCustomer.services, currentService.trim()] });
                        setCurrentService('');
                      }
                    }}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newCustomer.services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newCustomer.services.map((service, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => setNewCustomer({ 
                            ...newCustomer, 
                            services: newCustomer.services.filter((_, i) => i !== index) 
                          })}
                          className="ml-1 hover:text-blue-900"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Items Purchased */}
            <div className="grid gap-2">
              <Label htmlFor="customer-items" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                Items Purchased
              </Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="customer-items"
                    placeholder="Add item and press Enter"
                    value={currentItem}
                    onChange={(e) => setCurrentItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentItem.trim()) {
                        e.preventDefault();
                        setNewCustomer({ ...newCustomer, items: [...newCustomer.items, currentItem.trim()] });
                        setCurrentItem('');
                      }
                    }}
                    className="flex-1 border-slate-300 focus:border-brand-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentItem.trim()) {
                        setNewCustomer({ ...newCustomer, items: [...newCustomer.items, currentItem.trim()] });
                        setCurrentItem('');
                      }
                    }}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newCustomer.items.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newCustomer.items.map((item, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setNewCustomer({ 
                            ...newCustomer, 
                            items: newCustomer.items.filter((_, i) => i !== index) 
                          })}
                          className="ml-1 hover:text-green-900"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Business Value */}
            <div className="grid gap-2">
              <Label htmlFor="customer-business-value" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                Business Value ($)
              </Label>
              <Input
                id="customer-business-value"
                type="number"
                min="0"
                step="0.01"
                value={newCustomer.businessValue}
                onChange={(e) => setNewCustomer({ ...newCustomer, businessValue: parseFloat(e.target.value) || 0 })}
                className="border-slate-300 focus:border-brand-500"
              />
              <p className="text-xs text-slate-500">Total revenue generated from this customer</p>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="customer-status">Status</Label>
              <Select value={newCustomer.status} onValueChange={(value) => setNewCustomer({ ...newCustomer, status: value as 'active' | 'inactive' })}>
                <SelectTrigger className="border-slate-300 focus:border-brand-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="customer-notes">Notes</Label>
              <Textarea
                id="customer-notes"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                className="min-h-[80px] border-slate-300 focus:border-brand-500"
              />
            </div>
          </motion.div>

          <DialogFooter>
            <motion.div className="flex gap-2 w-full sm:w-auto" whileHover={{ scale: 1.01 }}>
              <Button variant="outline" onClick={() => setIsAddCustomerDialogOpen(false)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-none">
                <Button 
                  onClick={handleAddCustomer}
                  disabled={!newCustomer.name || !newCustomer.email}
                  className="bg-brand-600 hover:bg-brand-700 w-full"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </motion.div>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={isViewCustomerDialogOpen} onOpenChange={setIsViewCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-brand-200">
                    <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold text-xl">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">{selectedCustomer.name}</DialogTitle>
                    <DialogDescription>Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500 text-xs uppercase">Status</Label>
                    <Badge 
                      variant="outline" 
                      className={selectedCustomer.status === 'active' 
                        ? "bg-green-50 text-green-700 border-green-200 mt-1" 
                        : "bg-slate-100 text-slate-600 border-slate-200 mt-1"}
                    >
                      {selectedCustomer.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs uppercase">Total Spent</Label>
                    <p className="font-semibold text-lg">${selectedCustomer.totalSpent.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <p className="mt-1">{selectedCustomer.email}</p>
                </div>

                {selectedCustomer.phone && (
                  <div>
                    <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Phone
                    </Label>
                    <p className="mt-1">{selectedCustomer.phone}</p>
                  </div>
                )}

                {(selectedCustomer.address || selectedCustomer.city) && (
                  <div>
                    <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      Location
                    </Label>
                    <p className="mt-1">
                      {selectedCustomer.address && <>{selectedCustomer.address}<br /></>}
                      {selectedCustomer.city}
                    </p>
                  </div>
                )}

                {selectedCustomer.lastPurchase && (
                  <div>
                    <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Last Purchase
                    </Label>
                    <p className="mt-1">{new Date(selectedCustomer.lastPurchase).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedCustomer.services && selectedCustomer.services.length > 0 && (
                  <div>
                    <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      Services Taken
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCustomer.services.map((service, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCustomer.items && selectedCustomer.items.length > 0 && (
                  <div>
                    <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Items Purchased
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCustomer.items.map((item, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCustomer.businessValue > 0 && (
                  <div>
                    <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Business Value
                    </Label>
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      ${selectedCustomer.businessValue.toFixed(2)}
                    </p>
                  </div>
                )}

                {selectedCustomer.notes && (
                  <div>
                    <Label className="text-slate-500 text-xs uppercase flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Notes
                    </Label>
                    <p className="mt-1 text-sm text-slate-600 bg-slate-50 rounded p-3">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsViewCustomerDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  className="bg-brand-600 hover:bg-brand-700"
                  onClick={() => {
                    setIsViewCustomerDialogOpen(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Customer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadDialogOpen} onOpenChange={setIsEditLeadDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {editingLead && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Edit className="h-6 w-6 text-purple-600" />
                  Edit Lead
                </DialogTitle>
                <DialogDescription>
                  Update lead information
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* Name and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lead-name" className="flex items-center gap-1">
                      <span className="text-red-500">*</span> Full Name
                    </Label>
                    <Input
                      id="edit-lead-name"
                      value={editingLead.name}
                      onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lead-email" className="flex items-center gap-1">
                      <span className="text-red-500">*</span> Email
                    </Label>
                    <Input
                      id="edit-lead-email"
                      type="email"
                      value={editingLead.email}
                      onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-lead-phone">Phone</Label>
                  <Input
                    id="edit-lead-phone"
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Company and Role */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lead-company">Company</Label>
                    <Input
                      id="edit-lead-company"
                      value={editingLead.company}
                      onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lead-role">Role/Position</Label>
                    <Input
                      id="edit-lead-role"
                      value={editingLead.role}
                      onChange={(e) => setEditingLead({ ...editingLead, role: e.target.value })}
                      placeholder="Job title"
                    />
                  </div>
                </div>

                {/* Source and Assigned */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lead-source">Source</Label>
                    <Select value={editingLead.source} onValueChange={(value) => setEditingLead({ ...editingLead, source: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website Contact Form">Website Contact Form</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                        <SelectItem value="Trade Show">Trade Show</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lead-assigned">Assigned To</Label>
                    <Select 
                      value={editingLead.assigned}
                      onValueChange={(value) => setEditingLead({ ...editingLead, assigned: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={teamMembers.length > 0 ? "Select team member" : "No staff available"} />
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

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-lead-notes">Notes</Label>
                  <Textarea
                    id="edit-lead-notes"
                    value={editingLead.notes}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditLeadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateLead}
                  disabled={!editingLead.name || !editingLead.email}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Lead
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerDialogOpen} onOpenChange={setIsEditCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {editingCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Edit className="h-6 w-6 text-brand-600" />
                  Edit Customer
                </DialogTitle>
                <DialogDescription>
                  Update customer information
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* Name and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-customer-name" className="flex items-center gap-1">
                      <span className="text-red-500">*</span> Full Name
                    </Label>
                    <Input
                      id="edit-customer-name"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-customer-email" className="flex items-center gap-1">
                      <span className="text-red-500">*</span> Email
                    </Label>
                    <Input
                      id="edit-customer-email"
                      type="email"
                      value={editingCustomer.email}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-customer-phone">Phone</Label>
                  <Input
                    id="edit-customer-phone"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Address and City */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-customer-address">Address</Label>
                    <Input
                      id="edit-customer-address"
                      value={editingCustomer.address || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-customer-city">City</Label>
                    <Input
                      id="edit-customer-city"
                      value={editingCustomer.city || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                </div>

                {/* Business Value */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-customer-business-value">Business Value ($)</Label>
                  <Input
                    id="edit-customer-business-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingCustomer.businessValue}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, businessValue: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-customer-status">Status</Label>
                  <Select value={editingCustomer.status} onValueChange={(value) => setEditingCustomer({ ...editingCustomer, status: value as 'active' | 'inactive' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-customer-notes">Notes</Label>
                  <Textarea
                    id="edit-customer-notes"
                    value={editingCustomer.notes || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditCustomerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateCustomer}
                  disabled={!editingCustomer.name || !editingCustomer.email}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Customer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Lead Management Dialog */}
      <Dialog open={isBulkLeadDialogOpen} onOpenChange={setIsBulkLeadDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Bulk Lead Management
                </DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  Manage high-value leads with multiple items and services - Your most important prospects
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={exportBulkLeadsToCSV}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  disabled={bulkLeads.length === 0}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
                <Button
                  onClick={() => {
                    setNewBulkLead({
                      id: '',
                      name: '',
                      email: '',
                      phone: '',
                      company: '',
                      totalItems: 0,
                      itemsOrdered: [],
                      servicesRequested: [],
                      totalValue: 0,
                      estimatedDealSize: 0,
                      priority: 'medium',
                      status: 'prospect',
                      notes: '',
                      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      assignedTo: '',
                      sourceChannel: 'Direct Inquiry',
                      createdAt: new Date().toISOString().split('T')[0],
                      potentialMonthlyRecurring: 0,
                      decisionMaker: '',
                      companySize: '50-200 employees',
                      industry: '',
                      budget: '$50,000 - $100,000',
                      timeline: '3-6 months',
                      competitors: [],
                      painPoints: [],
                      specialRequirements: '',
                    });
                    setIsAddBulkLeadDialogOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bulk Lead
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Bulk Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{bulkLeads.length}</div>
                  <p className="text-xs text-slate-500 mt-1">High-value prospects</p>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Pipeline Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${bulkLeads.reduce((sum, lead) => sum + lead.estimatedDealSize, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Potential revenue</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {bulkLeads.reduce((sum, lead) => sum + lead.totalItems, 0)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Across all leads</p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Avg Deal Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    ${bulkLeads.length > 0 ? Math.round(bulkLeads.reduce((sum, lead) => sum + lead.estimatedDealSize, 0) / bulkLeads.length).toLocaleString() : '0'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Per bulk lead</p>
                </CardContent>
              </Card>
            </div>

            {/* Bulk Leads Table */}
            {bulkLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Bulk Leads Yet</h3>
                <p className="text-slate-600 text-center max-w-md mb-6">
                  Start tracking your high-value prospects who are interested in multiple items or services.
                  These are your most important leads requiring special attention.
                </p>
                <Button
                  onClick={() => {
                    setNewBulkLead({
                      id: '',
                      name: '',
                      email: '',
                      phone: '',
                      company: '',
                      totalItems: 0,
                      itemsOrdered: [],
                      servicesRequested: [],
                      totalValue: 0,
                      estimatedDealSize: 0,
                      priority: 'high',
                      status: 'prospect',
                      notes: '',
                      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      assignedTo: '',
                      sourceChannel: 'Direct Inquiry',
                      createdAt: new Date().toISOString().split('T')[0],
                      potentialMonthlyRecurring: 0,
                      decisionMaker: '',
                      companySize: '50-200 employees',
                      industry: '',
                      budget: '$50,000 - $100,000',
                      timeline: '3-6 months',
                      competitors: [],
                      painPoints: [],
                      specialRequirements: '',
                    });
                    setIsAddBulkLeadDialogOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Bulk Lead
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bulkLeads.map((lead, index) => {
                  const priorityColors = {
                    high: 'bg-red-100 text-red-800 border-red-300',
                    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    low: 'bg-green-100 text-green-800 border-green-300',
                  };
                  
                  const statusColors = {
                    prospect: 'bg-blue-100 text-blue-800 border-blue-300',
                    negotiating: 'bg-purple-100 text-purple-800 border-purple-300',
                    committed: 'bg-green-100 text-green-800 border-green-300',
                    closed: 'bg-slate-100 text-slate-800 border-slate-300',
                  };

                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-2 border-slate-200 rounded-xl p-6 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-16 w-16 border-3 border-amber-300">
                            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xl font-bold">
                              {getInitials(lead.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-slate-900">{lead.name}</h3>
                              <Badge className={`${priorityColors[lead.priority]} border font-semibold`}>
                                <Star className="h-3 w-3 mr-1" />
                                {lead.priority.toUpperCase()} PRIORITY
                              </Badge>
                              <Badge className={`${statusColors[lead.status]} border`}>
                                {lead.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Building2 className="h-4 w-4" />
                                <span className="font-medium">{lead.company}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${lead.email}`} className="hover:text-amber-600">{lead.email}</a>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${lead.phone}`} className="hover:text-amber-600">{lead.phone}</a>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Lead Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                toast({
                                  title: "Edit Feature",
                                  description: "Edit dialog will be available soon with full form editing.",
                                });
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Lead Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `mailto:${lead.email}?subject=Regarding ${lead.company} - Bulk Lead Inquiry&body=Dear ${lead.name},%0D%0A%0D%0AThank you for your interest.%0D%0A%0D%0ABest regards`;
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `tel:${lead.phone}`;
                              }}
                            >
                              <Phone className="mr-2 h-4 w-4" />
                              Call Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                toast({
                                  title: "Meeting Scheduled",
                                  description: `Follow-up meeting with ${lead.company} set for ${new Date(lead.followUpDate).toLocaleDateString()}`,
                                });
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Schedule Meeting
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => exportIndividualBulkLead(lead)}
                              className="text-green-600 focus:text-green-600 focus:bg-green-50"
                            >
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Export Individual Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${lead.company}? This action cannot be undone.`)) {
                                  handleDeleteBulkLead(lead.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Bulk Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Separator className="my-4" />

                      {/* Key Metrics */}
                      <div className="grid grid-cols-5 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                            <Package className="h-3.5 w-3.5" />
                            <span>Total Items</span>
                          </div>
                          <div className="text-2xl font-bold text-slate-900">{lead.totalItems}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Deal Size</span>
                          </div>
                          <div className="text-2xl font-bold text-green-600">${lead.estimatedDealSize.toLocaleString()}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Monthly MRR</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">${lead.potentialMonthlyRecurring.toLocaleString()}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>Company Size</span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">{lead.companySize}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Timeline</span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">{lead.timeline}</div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Items Ordered ({lead.itemsOrdered.length})
                          </h4>
                          {lead.itemsOrdered.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {lead.itemsOrdered.map((item: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No items yet</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Services Requested ({lead.servicesRequested.length})
                          </h4>
                          {lead.servicesRequested.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {lead.servicesRequested.map((service: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No services yet</p>
                          )}
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-xs text-slate-600">Industry</Label>
                          <p className="text-sm font-medium text-slate-900">{lead.industry || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Budget Range</Label>
                          <p className="text-sm font-medium text-slate-900">{lead.budget}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Decision Maker</Label>
                          <p className="text-sm font-medium text-slate-900">{lead.decisionMaker || 'Not specified'}</p>
                        </div>
                      </div>

                      {/* Pain Points & Competitors */}
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Pain Points
                          </h4>
                          {lead.painPoints.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                              {lead.painPoints.map((point: string, i: number) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-500 italic">Not identified</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Competing With
                          </h4>
                          {lead.competitors.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {lead.competitors.map((comp: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-red-50 border-red-200 text-red-700 text-xs">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No competitors identified</p>
                          )}
                        </div>
                      </div>

                      {/* Notes & Dates */}
                      {lead.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-semibold text-amber-900 mb-1">Notes</h4>
                          <p className="text-sm text-amber-800">{lead.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t">
                        <div className="flex gap-4">
                          <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span>
                          <span>Source: {lead.sourceChannel}</span>
                          {lead.assignedTo && <span>Assigned: {lead.assignedTo}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="font-medium">Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-slate-600">
                {bulkLeads.length} bulk lead{bulkLeads.length !== 1 ? 's' : ''} • 
                Total pipeline value: ${bulkLeads.reduce((sum, lead) => sum + lead.estimatedDealSize, 0).toLocaleString()}
              </p>
              <Button variant="outline" onClick={() => setIsBulkLeadDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bulk Lead Form Dialog */}
      <Dialog open={isAddBulkLeadDialogOpen} onOpenChange={setIsAddBulkLeadDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              Add New Bulk Lead
            </DialogTitle>
            <DialogDescription>
              Create a new high-value prospect with multiple items or services. Fill in all required details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <User className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-name" className="text-sm font-medium">
                    Contact Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bulk-name"
                    placeholder="e.g., John Smith"
                    value={newBulkLead.name}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, name: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bulk-email"
                    type="email"
                    placeholder="john.smith@company.com"
                    value={newBulkLead.email}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, email: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-phone" className="text-sm font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bulk-phone"
                    placeholder="+1 (555) 000-0000"
                    value={newBulkLead.phone}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, phone: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-decision-maker" className="text-sm font-medium">
                    Decision Maker / Title
                  </Label>
                  <Input
                    id="bulk-decision-maker"
                    placeholder="e.g., CEO, CTO, Director"
                    value={newBulkLead.decisionMaker}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, decisionMaker: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <Building2 className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-900">Company Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-company" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bulk-company"
                    placeholder="e.g., Acme Corporation"
                    value={newBulkLead.company}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, company: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-industry" className="text-sm font-medium">
                    Industry Sector
                  </Label>
                  <Input
                    id="bulk-industry"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    value={newBulkLead.industry}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, industry: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-company-size" className="text-sm font-medium">
                    Company Size
                  </Label>
                  <Select
                    value={newBulkLead.companySize}
                    onValueChange={(value) => setNewBulkLead({ ...newBulkLead, companySize: value })}
                  >
                    <SelectTrigger id="bulk-company-size" className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                      <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                      <SelectItem value="50-200 employees">50-200 employees</SelectItem>
                      <SelectItem value="200-500 employees">200-500 employees</SelectItem>
                      <SelectItem value="500-1000 employees">500-1000 employees</SelectItem>
                      <SelectItem value="1000+ employees">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-source" className="text-sm font-medium">
                    Source Channel
                  </Label>
                  <Select
                    value={newBulkLead.sourceChannel}
                    onValueChange={(value) => setNewBulkLead({ ...newBulkLead, sourceChannel: value })}
                  >
                    <SelectTrigger id="bulk-source" className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direct Inquiry">Direct Inquiry</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Trade Show">Trade Show</SelectItem>
                      <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items & Services Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <Package className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-900">Items & Services Requested</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Items Ordered</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter item name"
                      value={currentItemInput}
                      onChange={(e) => setCurrentItemInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && currentItemInput.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            itemsOrdered: [...newBulkLead.itemsOrdered, currentItemInput.trim()],
                            totalItems: newBulkLead.totalItems + 1,
                          });
                          setCurrentItemInput('');
                        }
                      }}
                      className="border-slate-300"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (currentItemInput.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            itemsOrdered: [...newBulkLead.itemsOrdered, currentItemInput.trim()],
                            totalItems: newBulkLead.totalItems + 1,
                          });
                          setCurrentItemInput('');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newBulkLead.itemsOrdered.map((item, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-blue-50 border-blue-300 text-blue-700"
                      >
                        {item}
                        <button
                          onClick={() => {
                            const newItems = newBulkLead.itemsOrdered.filter((_, i) => i !== index);
                            setNewBulkLead({
                              ...newBulkLead,
                              itemsOrdered: newItems,
                              totalItems: newItems.length + newBulkLead.servicesRequested.length,
                            });
                          }}
                          className="ml-2 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Services Requested</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter service name"
                      value={currentServiceInput}
                      onChange={(e) => setCurrentServiceInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && currentServiceInput.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            servicesRequested: [...newBulkLead.servicesRequested, currentServiceInput.trim()],
                            totalItems: newBulkLead.totalItems + 1,
                          });
                          setCurrentServiceInput('');
                        }
                      }}
                      className="border-slate-300"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (currentServiceInput.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            servicesRequested: [...newBulkLead.servicesRequested, currentServiceInput.trim()],
                            totalItems: newBulkLead.totalItems + 1,
                          });
                          setCurrentServiceInput('');
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newBulkLead.servicesRequested.map((service, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-purple-50 border-purple-300 text-purple-700"
                      >
                        {service}
                        <button
                          onClick={() => {
                            const newServices = newBulkLead.servicesRequested.filter((_, i) => i !== index);
                            setNewBulkLead({
                              ...newBulkLead,
                              servicesRequested: newServices,
                              totalItems: newBulkLead.itemsOrdered.length + newServices.length,
                            });
                          }}
                          className="ml-2 hover:text-purple-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Deal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-900">Deal Information</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-deal-size" className="text-sm font-medium">
                    Estimated Deal Size ($)
                  </Label>
                  <Input
                    id="bulk-deal-size"
                    type="number"
                    placeholder="50000"
                    value={newBulkLead.estimatedDealSize || ''}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, estimatedDealSize: parseFloat(e.target.value) || 0 })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-mrr" className="text-sm font-medium">
                    Monthly Recurring ($)
                  </Label>
                  <Input
                    id="bulk-mrr"
                    type="number"
                    placeholder="5000"
                    value={newBulkLead.potentialMonthlyRecurring || ''}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, potentialMonthlyRecurring: parseFloat(e.target.value) || 0 })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-total-value" className="text-sm font-medium">
                    Total Value ($)
                  </Label>
                  <Input
                    id="bulk-total-value"
                    type="number"
                    placeholder="75000"
                    value={newBulkLead.totalValue || ''}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, totalValue: parseFloat(e.target.value) || 0 })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-budget" className="text-sm font-medium">
                    Budget Range
                  </Label>
                  <Select
                    value={newBulkLead.budget}
                    onValueChange={(value) => setNewBulkLead({ ...newBulkLead, budget: value })}
                  >
                    <SelectTrigger id="bulk-budget" className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$10,000 - $25,000">$10,000 - $25,000</SelectItem>
                      <SelectItem value="$25,000 - $50,000">$25,000 - $50,000</SelectItem>
                      <SelectItem value="$50,000 - $100,000">$50,000 - $100,000</SelectItem>
                      <SelectItem value="$100,000 - $250,000">$100,000 - $250,000</SelectItem>
                      <SelectItem value="$250,000 - $500,000">$250,000 - $500,000</SelectItem>
                      <SelectItem value="$500,000+">$500,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-timeline" className="text-sm font-medium">
                    Timeline
                  </Label>
                  <Select
                    value={newBulkLead.timeline}
                    onValueChange={(value) => setNewBulkLead({ ...newBulkLead, timeline: value })}
                  >
                    <SelectTrigger id="bulk-timeline" className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate (0-1 month)">Immediate (0-1 month)</SelectItem>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="12+ months">12+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-follow-up" className="text-sm font-medium">
                    Follow-up Date
                  </Label>
                  <Input
                    id="bulk-follow-up"
                    type="date"
                    value={newBulkLead.followUpDate}
                    onChange={(e) => setNewBulkLead({ ...newBulkLead, followUpDate: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Priority & Status Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <Star className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-900">Priority & Status</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-priority" className="text-sm font-medium">
                    Priority Level
                  </Label>
                  <Select
                    value={newBulkLead.priority}
                    onValueChange={(value: 'high' | 'medium' | 'low') => setNewBulkLead({ ...newBulkLead, priority: value })}
                  >
                    <SelectTrigger id="bulk-priority" className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          High Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          Low Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={newBulkLead.status}
                    onValueChange={(value: 'prospect' | 'negotiating' | 'committed' | 'closed') => setNewBulkLead({ ...newBulkLead, status: value })}
                  >
                    <SelectTrigger id="bulk-status" className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="committed">Committed</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-assigned" className="text-sm font-medium">
                    Assigned To
                  </Label>
                  <Select
                    value={newBulkLead.assignedTo}
                    onValueChange={(value) => setNewBulkLead({ ...newBulkLead, assignedTo: value })}
                  >
                    <SelectTrigger id="bulk-assigned" className="border-slate-300">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name} - {member.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-900">Additional Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pain Points</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter pain point"
                      value={currentPainPoint}
                      onChange={(e) => setCurrentPainPoint(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && currentPainPoint.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            painPoints: [...newBulkLead.painPoints, currentPainPoint.trim()],
                          });
                          setCurrentPainPoint('');
                        }
                      }}
                      className="border-slate-300"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (currentPainPoint.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            painPoints: [...newBulkLead.painPoints, currentPainPoint.trim()],
                          });
                          setCurrentPainPoint('');
                        }
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newBulkLead.painPoints.map((point, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-orange-50 border-orange-300 text-orange-700"
                      >
                        {point}
                        <button
                          onClick={() => {
                            setNewBulkLead({
                              ...newBulkLead,
                              painPoints: newBulkLead.painPoints.filter((_, i) => i !== index),
                            });
                          }}
                          className="ml-2 hover:text-orange-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Competitors</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter competitor name"
                      value={currentCompetitor}
                      onChange={(e) => setCurrentCompetitor(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && currentCompetitor.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            competitors: [...newBulkLead.competitors, currentCompetitor.trim()],
                          });
                          setCurrentCompetitor('');
                        }
                      }}
                      className="border-slate-300"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (currentCompetitor.trim()) {
                          setNewBulkLead({
                            ...newBulkLead,
                            competitors: [...newBulkLead.competitors, currentCompetitor.trim()],
                          });
                          setCurrentCompetitor('');
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newBulkLead.competitors.map((comp, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-red-50 border-red-300 text-red-700"
                      >
                        {comp}
                        <button
                          onClick={() => {
                            setNewBulkLead({
                              ...newBulkLead,
                              competitors: newBulkLead.competitors.filter((_, i) => i !== index),
                            });
                          }}
                          className="ml-2 hover:text-red-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-special" className="text-sm font-medium">
                  Special Requirements
                </Label>
                <Textarea
                  id="bulk-special"
                  placeholder="Any special requirements, custom requests, or unique considerations..."
                  value={newBulkLead.specialRequirements}
                  onChange={(e) => setNewBulkLead({ ...newBulkLead, specialRequirements: e.target.value })}
                  className="border-slate-300 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="bulk-notes"
                  placeholder="Add any additional notes, meeting summaries, or important information..."
                  value={newBulkLead.notes}
                  onChange={(e) => setNewBulkLead({ ...newBulkLead, notes: e.target.value })}
                  className="border-slate-300 min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddBulkLeadDialogOpen(false);
                setNewBulkLead({
                  id: '',
                  name: '',
                  email: '',
                  phone: '',
                  company: '',
                  totalItems: 0,
                  itemsOrdered: [],
                  servicesRequested: [],
                  totalValue: 0,
                  estimatedDealSize: 0,
                  priority: 'medium',
                  status: 'prospect',
                  notes: '',
                  followUpDate: '',
                  assignedTo: '',
                  sourceChannel: 'Direct Inquiry',
                  createdAt: '',
                  potentialMonthlyRecurring: 0,
                  decisionMaker: '',
                  companySize: '50-200 employees',
                  industry: '',
                  budget: '$50,000 - $100,000',
                  timeline: '3-6 months',
                  competitors: [],
                  painPoints: [],
                  specialRequirements: '',
                });
                setCurrentItemInput('');
                setCurrentServiceInput('');
                setCurrentPainPoint('');
                setCurrentCompetitor('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newBulkLead.name || !newBulkLead.email || !newBulkLead.phone || !newBulkLead.company) {
                  toast({
                    title: "Missing Required Fields",
                    description: "Please fill in all required fields (Name, Email, Phone, Company)",
                    variant: "destructive",
                  });
                  return;
                }

                const bulkLeadToSave: BulkLead = {
                  ...newBulkLead,
                  id: `BL-${Date.now()}`,
                  createdAt: new Date().toISOString().split('T')[0],
                };

                saveBulkLeads([...bulkLeads, bulkLeadToSave]);
                setIsAddBulkLeadDialogOpen(false);
                
                // Reset form
                setNewBulkLead({
                  id: '',
                  name: '',
                  email: '',
                  phone: '',
                  company: '',
                  totalItems: 0,
                  itemsOrdered: [],
                  servicesRequested: [],
                  totalValue: 0,
                  estimatedDealSize: 0,
                  priority: 'medium',
                  status: 'prospect',
                  notes: '',
                  followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  assignedTo: '',
                  sourceChannel: 'Direct Inquiry',
                  createdAt: '',
                  potentialMonthlyRecurring: 0,
                  decisionMaker: '',
                  companySize: '50-200 employees',
                  industry: '',
                  budget: '$50,000 - $100,000',
                  timeline: '3-6 months',
                  competitors: [],
                  painPoints: [],
                  specialRequirements: '',
                });
                setCurrentItemInput('');
                setCurrentServiceInput('');
                setCurrentPainPoint('');
                setCurrentCompetitor('');

                toast({
                  title: "Bulk Lead Created Successfully!",
                  description: `${bulkLeadToSave.name} from ${bulkLeadToSave.company} has been added to your bulk leads.`,
                });
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Bulk Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
