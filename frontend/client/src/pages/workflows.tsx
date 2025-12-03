import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, Zap, Mail, MessageSquare, Bell, Calendar, DollarSign,
  Clock, Users, Settings, Play, Pause, Trash2, Copy, Edit, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, GitBranch, Filter, ArrowRight, History,
  Code, Send, Smartphone, Database, Tag, Slack, Link, RefreshCw, TestTube,
  FileText, Download, Upload, ChevronUp, ChevronDown, GripVertical, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

// Enhanced interfaces for advanced workflow system
interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions?: WorkflowCondition[];
  isActive: boolean;
  executionCount: number;
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
}

interface WorkflowTrigger {
  type: 'booking_created' | 'booking_rescheduled' | 'booking_cancelled' | 'booking_reminder' | 
        'payment_received' | 'customer_created' | 'time_based' | 'custom_event';
  label: string;
  config?: {
    time?: string; // for time-based triggers
    timezone?: string;
    daysBeforeAppointment?: number; // for reminders
    customEventName?: string;
  };
}

interface WorkflowAction {
  id: string;
  type: 'email' | 'sms' | 'whatsapp' | 'webhook' | 'calendar_event' | 'payment' | 
        'wait' | 'condition' | 'slack' | 'teams' | 'crm_sync' | 'add_tag';
  label: string;
  config: {
    // Email config
    to?: string;
    subject?: string;
    body?: string;
    template?: string;
    
    // SMS/WhatsApp config
    phoneNumber?: string;
    message?: string;
    
    // Webhook config
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string> | string;
    payload?: string;
      
    // Calendar config
    eventTitle?: string;
    eventDate?: string;
    duration?: number | string;
    
    // Wait config
    delayAmount?: number | string;
    delayUnit?: 'minutes' | 'hours' | 'days';
    
    // Condition config
    field?: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value?: string;
    thenActions?: string[]; // action IDs
    elseActions?: string[];
    
    // CRM config
    crmSystem?: 'salesforce' | 'hubspot' | 'zoho';
    action?: 'create_contact' | 'update_contact' | 'create_deal';
    
    // Tag config
    tagName?: string;
    
    // Retry config
    retryOnFailure?: boolean;
    retryAttempts?: number;
  };
  order: number;
}

interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  logic?: 'AND' | 'OR';
}

interface WorkflowLog {
  id: string;
  workflowId: string;
  executionTime: string;
  status: 'success' | 'failed' | 'partial';
  duration: number;
  triggeredBy: string;
  actions: {
    actionId: string;
    actionName?: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
  }[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Partial<Workflow>;
}

export default function WorkflowsPage() {
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [testRunOpen, setTestRunOpen] = useState(false);
  const [addActionOpen, setAddActionOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<WorkflowAction | null>(null);
  const [selectedVariable, setSelectedVariable] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [customWorkflowMode, setCustomWorkflowMode] = useState(false);
  
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'booking_created',
    actions: [] as WorkflowAction[]
  });

  // Compute workspace-scoped storage keys
  const workflowsStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_workflows::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  const logsStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_workflow_logs::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  // ✨ ENHANCED Available variables for templates (Feature #8: Template Variables System)
  const variables = useMemo(() => ({
    customer: [
      '{{customer.name}}',
      '{{customer.firstName}}',
      '{{customer.lastName}}',
      '{{customer.email}}',
      '{{customer.phone}}',
      '{{customer.id}}',
      '{{customer.joinDate}}',
      '{{customer.totalBookings}}',
      '{{customer.totalSpent}}',
      '{{customer.lastVisit}}',
      '{{customer.loyaltyPoints}}',
      '{{customer.membershipTier}}',
      '{{customer.birthday}}',
      '{{customer.preferences}}'
    ],
    booking: [
      '{{booking.id}}',
      '{{booking.date}}',
      '{{booking.time}}',
      '{{booking.status}}',
      '{{booking.duration}}',
      '{{booking.confirmationCode}}',
      '{{booking.notes}}',
      '{{booking.location}}',
      '{{booking.roomNumber}}',
      '{{booking.specialRequests}}'
    ],
    service: [
      '{{service.name}}',
      '{{service.price}}',
      '{{service.duration}}',
      '{{service.category}}',
      '{{service.description}}',
      '{{service.requirements}}',
      '{{service.benefits}}'
    ],
    organization: [
      '{{organization.name}}',
      '{{organization.timezone}}',
      '{{organization.email}}',
      '{{organization.phone}}',
      '{{organization.address}}',
      '{{organization.city}}',
      '{{organization.website}}',
      '{{organization.socialMedia}}'
    ],
    staff: [
      '{{staff.name}}',
      '{{staff.email}}',
      '{{staff.phone}}',
      '{{staff.role}}',
      '{{staff.specialization}}',
      '{{staff.rating}}',
      '{{staff.yearsOfExperience}}'
    ],
    payment: [
      '{{payment.amount}}',
      '{{payment.status}}',
      '{{payment.method}}',
      '{{payment.transactionId}}',
      '{{payment.currency}}',
      '{{payment.discount}}',
      '{{payment.finalAmount}}'
    ],
    // ✨ Date & Time Variables (Advanced)
    date: [
      '{{date.today}}',
      '{{date.tomorrow}}',
      '{{date.yesterday}}',
      '{{date.thisWeek}}',
      '{{date.thisMonth}}',
      '{{date.thisYear}}',
      '{{date.dayOfWeek}}',
      '{{date.formatted:DD/MM/YYYY}}',
      '{{date.formatted:MMMM DD, YYYY}}'
    ],
    time: [
      '{{time.now}}',
      '{{time.formatted:HH:mm}}',
      '{{time.formatted:h:mm A}}',
      '{{time.formatted:hh:mm:ss}}'
    ],
    // ✨ Calculations & Formulas
    calculations: [
      '{{calc.daysUntilBooking}}',
      '{{calc.customerLifetimeValue}}',
      '{{calc.averageRating}}',
      '{{calc.totalRevenue}}',
      '{{calc.discountPercentage}}'
    ],
    // ✨ Conditional Variables
    conditionals: [
      '{{if:customer.totalBookings>5?"Valued Customer":"New Customer"}}',
      '{{if:payment.status=="paid"?"Payment Complete":"Payment Pending"}}',
      '{{if:booking.date==date.today?"Today":"Upcoming"}}'
    ],
    // ✨ Analytics Variables (Feature #7)
    analytics: [
      '{{analytics.todayBookings}}',
      '{{analytics.completedBookings}}',
      '{{analytics.cancelledBookings}}',
      '{{analytics.noShows}}',
      '{{analytics.todayRevenue}}',
      '{{analytics.avgBookingValue}}',
      '{{analytics.pendingPayments}}',
      '{{analytics.newCustomers}}',
      '{{analytics.returningCustomers}}',
      '{{analytics.topService1}}',
      '{{analytics.topService2}}',
      '{{analytics.topService3}}'
    ],
    // ✨ Schedule Variables
    schedule: [
      '{{schedule.appointments}}',
      '{{schedule.count}}',
      '{{schedule.earnings}}',
      '{{schedule.firstAppointment}}',
      '{{schedule.lastAppointment}}'
    ],
    // ✨ Product/Inventory Variables
    product: [
      '{{product.name}}',
      '{{product.quantity}}',
      '{{product.reorderLevel}}',
      '{{product.supplier}}',
      '{{product.supplierContact}}',
      '{{product.orderCode}}',
      '{{product.lastOrderDate}}',
      '{{product.monthlyUsage}}'
    ]
  }), []);

  // ✨ ENHANCED Pre-built Workflow Templates (Feature #1)
  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 't1',
      name: 'Booking Confirmation Flow',
      description: 'Send confirmation email and SMS when booking is created',
      category: 'Booking',
      workflow: {
        trigger: { type: 'booking_created', label: 'Booking Created' },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Send Confirmation Email',
            config: {
              to: '{{customer.email}}',
              subject: 'Booking Confirmed - {{service.name}}',
              body: `Hi {{customer.name}},\n\nThank you for booking with us!\n\nService: {{service.name}}\nDate: {{booking.date}}\nTime: {{booking.time}}\nDuration: {{service.duration}}\nPrice: {{service.price}}\n\nWe look forward to seeing you!\n\nBest regards,\n{{organization.name}}`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'sms',
            label: 'Send SMS Confirmation',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: 'Hi {{customer.name}}! Your {{service.name}} booking is confirmed for {{booking.date}} at {{booking.time}}. See you then!'
            },
            order: 2
          }
        ]
      }
    },
    {
      id: 't2',
      name: '24h Reminder Flow',
      description: 'Send reminder 24 hours before appointment',
      category: 'Reminders',
      workflow: {
        trigger: { type: 'booking_reminder', label: 'Booking Reminder', config: { daysBeforeAppointment: 1 } },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Send Reminder Email',
            config: {
              to: '{{customer.email}}',
              subject: 'Reminder: Appointment Tomorrow',
              body: 'Hi {{customer.name}},\n\nThis is a reminder that you have an appointment tomorrow at {{booking.time}}.\n\nSee you soon!'
            },
            order: 1
          }
        ]
      }
    },
    {
      id: 't3',
      name: 'Post-Payment Flow',
      description: 'Thank customer and sync to CRM after payment',
      category: 'Payment',
      workflow: {
        trigger: { type: 'payment_received', label: 'Payment Received' },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Send Receipt',
            config: {
              to: '{{customer.email}}',
              subject: 'Payment Received - {{payment.amount}}',
              body: 'Thank you for your payment of {{payment.amount}}.'
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'crm_sync',
            label: 'Sync to CRM',
            config: {
              crmSystem: 'salesforce',
              action: 'update_contact'
            },
            order: 2
          }
        ]
      }
    },
    {
      id: 't4',
      name: 'Service-Specific Welcome',
      description: 'Send customized welcome email based on booked service',
      category: 'Service',
      workflow: {
        trigger: { type: 'booking_created', label: 'Booking Created' },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Send Service Welcome',
            config: {
              to: '{{customer.email}}',
              subject: 'Welcome! Your {{service.name}} Appointment',
              body: `Dear {{customer.name}},\n\nWelcome to {{organization.name}}!\n\nYou've booked: {{service.name}}\nCategory: {{service.category}}\nDuration: {{service.duration}}\nPrice: ₹{{service.price}}\n\nScheduled for: {{booking.date}} at {{booking.time}}\n\nWhat to expect:\n- Please arrive 10 minutes early\n- Bring any necessary items\n- Feel free to ask questions\n\nLooking forward to serving you!\n\nBest,\n{{organization.name}} Team`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'add_tag',
            label: 'Tag Customer',
            config: {
              tagName: '{{service.category}}_customer'
            },
            order: 2
          }
        ]
      }
    },
    // ✨ NEW Templates (Feature #2: Expanded Template Library)
    {
      id: 't5',
      name: 'Welcome New Customer',
      description: 'Send warm welcome message to first-time customers',
      category: 'Customer',
      workflow: {
        trigger: { type: 'customer_created', label: 'Customer Created' },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Welcome Email',
            config: {
              to: '{{customer.email}}',
              subject: 'Welcome to {{organization.name}}! 🎉',
              body: `Dear {{customer.name}},\n\nWelcome to {{organization.name}}!\n\nWe're thrilled to have you join our community. Here's what you can expect:\n\n✓ Premium quality services\n✓ Professional and friendly staff\n✓ Flexible scheduling options\n✓ Exclusive member benefits\n\nReady to book your first appointment? Reply to this email or visit our booking page.\n\nAs a welcome gift, use code WELCOME10 for 10% off your first service!\n\nLooking forward to serving you,\n{{organization.name}} Team`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'sms',
            label: 'Welcome SMS',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: 'Welcome to {{organization.name}}, {{customer.name}}! Use code WELCOME10 for 10% off your first booking. Book now!'
            },
            order: 2
          },
          {
            id: 'a3',
            type: 'add_tag',
            label: 'Tag as New Customer',
            config: { tagName: 'new_customer' }
            ,
            order: 3
          }
        ]
      }
    },
    {
      id: 't6',
      name: 'Birthday Special Offer',
      description: 'Send birthday wishes with special discount',
      category: 'Customer',
      workflow: {
        trigger: { type: 'time_based', label: 'Birthday (Scheduled)', config: { time: '09:00' } },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Birthday Email',
            config: {
              to: '{{customer.email}}',
              subject: '🎂 Happy Birthday, {{customer.name}}!',
              body: `Happy Birthday, {{customer.name}}! 🎉🎂\n\nYour special day deserves a special treat!\n\nEnjoy 20% OFF on any service this month with code BDAY20\n\nTreat yourself to:\n- Relaxing spa treatments\n- Premium beauty services\n- Wellness packages\n\nThis offer is valid for 30 days from your birthday.\n\nBook now and celebrate in style!\n\nWarmest wishes,\n{{organization.name}} Team`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'sms',
            label: 'Birthday SMS',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: '🎂 Happy Birthday {{customer.name}}! Enjoy 20% OFF with code BDAY20 valid for 30 days. Treat yourself!'
            },
            order: 2
          }
        ]
      }
    },
    {
      id: 't7',
      name: 'Win-back Inactive Customers',
      description: 'Re-engage customers who haven\'t booked in 60+ days',
      category: 'Customer',
      workflow: {
        trigger: { type: 'custom_event', label: 'Inactive 60+ Days', config: { customEventName: 'customer_inactive_60days' } },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Win-back Email',
            config: {
              to: '{{customer.email}}',
              subject: 'We Miss You, {{customer.name}}! 💙',
              body: `Hi {{customer.name}},\n\nWe noticed it's been a while since your last visit, and we miss you!\n\nYour wellness is important to us, and we'd love to welcome you back.\n\n🎁 EXCLUSIVE COMEBACK OFFER:\nUse code COMEBACK25 for 25% OFF your next booking\n\nNew services you might love:\n- [Popular Service 1]\n- [Popular Service 2]\n- [New Treatment]\n\nThis special offer expires in 14 days.\n\nBook your appointment today and rediscover the experience you love!\n\nWe can't wait to see you again,\n{{organization.name}} Team`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'wait',
            label: 'Wait 7 Days',
            config: { delayAmount: '7', delayUnit: 'days' },
            order: 2
          },
          {
            id: 'a3',
            type: 'sms',
            label: 'Follow-up SMS',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: 'Still here for you! 25% OFF with code COMEBACK25 expires soon. Book now at {{organization.name}}!'
            },
            order: 3
          }
        ]
      }
    },
    {
      id: 't8',
      name: 'Review Collection Flow',
      description: 'Request review after completed appointment',
      category: 'Feedback',
      workflow: {
        trigger: { type: 'booking_created', label: 'Booking Completed' },
        actions: [
          {
            id: 'a1',
            type: 'wait',
            label: 'Wait 2 Hours',
            config: { delayAmount: '2', delayUnit: 'hours' },
            order: 1
          },
          {
            id: 'a2',
            type: 'email',
            label: 'Request Review',
            config: {
              to: '{{customer.email}}',
              subject: 'How was your experience at {{organization.name}}?',
              body: `Hi {{customer.name}},\n\nThank you for choosing {{organization.name}} for your {{service.name}} appointment!\n\nWe hope you had a wonderful experience. Your feedback helps us improve and serve you better.\n\n⭐ Would you take 2 minutes to share your thoughts?\n\n[Leave a Review]\n\nYour honest feedback means the world to us!\n\nThank you,\n{{organization.name}} Team`
            },
            order: 2
          },
          {
            id: 'a3',
            type: 'wait',
            label: 'Wait 3 Days',
            config: { delayAmount: '3', delayUnit: 'days' },
            order: 3
          },
          {
            id: 'a4',
            type: 'sms',
            label: 'SMS Reminder',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: 'Hi {{customer.name}}! We\'d love your feedback on your recent visit to {{organization.name}}. Share your review: [link]'
            },
            order: 4
          }
        ]
      }
    },
    {
      id: 't9',
      name: 'Daily Summary Report',
      description: 'Send daily business summary to staff',
      category: 'Reports',
      workflow: {
        trigger: { type: 'time_based', label: 'Daily at 8 PM', config: { time: '20:00', timezone: 'Asia/Kolkata' } },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Daily Report',
            config: {
              to: '{{staff.email}}',
              subject: '📊 Daily Summary - {{organization.name}} - {{date.today}}',
              body: `Daily Business Summary\n{{organization.name}}\n{{date.today}}\n\n📅 APPOINTMENTS:\n- Total Bookings: {{analytics.todayBookings}}\n- Completed: {{analytics.completedBookings}}\n- Cancelled: {{analytics.cancelledBookings}}\n- No-shows: {{analytics.noShows}}\n\n💰 REVENUE:\n- Total Revenue: ₹{{analytics.todayRevenue}}\n- Average Booking Value: ₹{{analytics.avgBookingValue}}\n- Payment Pending: ₹{{analytics.pendingPayments}}\n\n👥 CUSTOMERS:\n- New Customers: {{analytics.newCustomers}}\n- Returning Customers: {{analytics.returningCustomers}}\n\n📈 TOP SERVICES:\n1. {{analytics.topService1}}\n2. {{analytics.topService2}}\n3. {{analytics.topService3}}\n\nDetailed report available in dashboard.\n\nGenerated automatically by Zervos`
            },
            order: 1
          }
        ]
      }
    },
    {
      id: 't10',
      name: 'Low Stock Alert',
      description: 'Notify when product inventory is low',
      category: 'Inventory',
      workflow: {
        trigger: { type: 'custom_event', label: 'Low Stock Detected', config: { customEventName: 'product_low_stock' } },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Alert Email',
            config: {
              to: '{{organization.email}}',
              subject: '⚠️ Low Stock Alert - {{product.name}}',
              body: `LOW STOCK ALERT\n\nProduct: {{product.name}}\nCurrent Stock: {{product.quantity}} units\nReorder Level: {{product.reorderLevel}} units\n\nAction Required:\nPlease reorder this product to avoid stockouts.\n\nSupplier Details:\n- Name: {{product.supplier}}\n- Contact: {{product.supplierContact}}\n- Order Code: {{product.orderCode}}\n\nLast Ordered: {{product.lastOrderDate}}\nAverage Monthly Usage: {{product.monthlyUsage}} units\n\nGenerated by Zervos Inventory System`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'slack',
            label: 'Slack Notification',
            config: {
              message: '⚠️ LOW STOCK: {{product.name}} - Only {{product.quantity}} units left!'
            },
            order: 2
          }
        ]
      }
    },
    {
      id: 't11',
      name: 'Staff Schedule Reminder',
      description: 'Daily schedule reminders for staff members',
      category: 'Staff',
      workflow: {
        trigger: { type: 'time_based', label: 'Daily at 7 AM', config: { time: '07:00', timezone: 'Asia/Kolkata' } },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Schedule Email',
            config: {
              to: '{{staff.email}}',
              subject: '📅 Your Schedule for {{date.today}}',
              body: `Good morning {{staff.name}}!\n\nHere's your schedule for today:\n\n{{schedule.appointments}}\n\nTOTAL APPOINTMENTS: {{schedule.count}}\nESTIMATED EARNINGS: ₹{{schedule.earnings}}\n\nNOTES:\n- Please arrive 15 minutes before your first appointment\n- Check equipment and supplies\n- Review customer notes in the dashboard\n\nHave a great day!\n\n{{organization.name}} Team`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'sms',
            label: 'SMS Reminder',
            config: {
              phoneNumber: '{{staff.phone}}',
              message: 'Good morning {{staff.name}}! You have {{schedule.count}} appointments today starting at {{schedule.firstAppointment}}. Have a great day!'
            },
            order: 2
          }
        ]
      }
    },
    // ✨ Feature #4: Multi-Channel Booking Reminder Sequence
    {
      id: 't12',
      name: 'Complete Reminder Sequence',
      description: '24h, 2h, and on-day reminders with multi-channel',
      category: 'Reminders',
      workflow: {
        trigger: { type: 'booking_reminder', label: 'Booking Reminder Sequence', config: { daysBeforeAppointment: 1 } },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: '24h Email Reminder',
            config: {
              to: '{{customer.email}}',
              subject: 'Tomorrow: {{service.name}} at {{booking.time}}',
              body: `Hi {{customer.name}},\n\nFriendly reminder about your appointment tomorrow!\n\n📅 Service: {{service.name}}\n🕐 Time: {{booking.time}}\n📍 Location: {{organization.address}}\n💰 Price: ₹{{service.price}}\n\nWhat to bring:\n- Comfortable clothing\n- Any special requirements you mentioned\n\nNeed to reschedule? Reply to this email or call us.\n\nSee you tomorrow!\n{{organization.name}}`
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'sms',
            label: '24h SMS Reminder',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: 'Hi {{customer.name}}! Reminder: {{service.name}} tomorrow at {{booking.time}}. See you at {{organization.name}}!'
            },
            order: 2
          },
          {
            id: 'a3',
            type: 'wait',
            label: 'Wait until 2h before',
            config: { delayAmount: '22', delayUnit: 'hours' },
            order: 3
          },
          {
            id: 'a4',
            type: 'sms',
            label: '2h SMS Reminder',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: 'Appointment in 2 hours! {{service.name}} at {{booking.time}}. {{organization.address}}. Looking forward to seeing you!'
            },
            order: 4
          },
          {
            id: 'a5',
            type: 'whatsapp',
            label: '2h WhatsApp Reminder',
            config: {
              phoneNumber: '{{customer.phone}}',
              message: '⏰ Your appointment is in 2 hours!\n\n{{service.name}}\n{{booking.time}}\n{{organization.address}}\n\nSee you soon! 😊'
            },
            order: 5
          }
        ]
      }
    },
    // ✨ Feature #5: Customer Journey Automation
    {
      id: 't13',
      name: 'Customer Lifecycle Journey',
      description: 'Automated journey from new customer to loyal advocate',
      category: 'Customer',
      workflow: {
        trigger: { type: 'customer_created', label: 'New Customer Lifecycle Start' },
        actions: [
          {
            id: 'a1',
            type: 'email',
            label: 'Day 0: Welcome',
            config: {
              to: '{{customer.email}}',
              subject: 'Welcome to {{organization.name}}!',
              body: 'Welcome message with onboarding guide...'
            },
            order: 1
          },
          {
            id: 'a2',
            type: 'add_tag',
            label: 'Tag: New Customer',
            config: { tagName: 'lifecycle_new' },
            order: 2
          },
          {
            id: 'a3',
            type: 'wait',
            label: 'Wait 7 Days',
            config: { delayAmount: '7', delayUnit: 'days' },
            order: 3
          },
          {
            id: 'a4',
            type: 'condition',
            label: 'Check if Booked',
            config: {
              field: 'customer.bookingCount',
              operator: 'greater_than',
              value: '0',
              thenActions: ['a5'],
              elseActions: ['a6']
            },
            order: 4
          },
          {
            id: 'a5',
            type: 'add_tag',
            label: 'Tag: Active Customer',
            config: { tagName: 'lifecycle_active' },
            order: 5
          },
          {
            id: 'a6',
            type: 'email',
            label: 'Encouragement Email',
            config: {
              to: '{{customer.email}}',
              subject: 'Haven\'t booked yet? Here\'s 15% OFF!',
              body: 'Special offer for first booking...'
            },
            order: 6
          }
        ]
      }
    }
  ];

  // Default workflows for a new workspace
  const defaultWorkflows: Workflow[] = [
    {
      id: '1',
      name: 'Booking Confirmation',
      description: 'Send confirmation email and SMS to client when booking is created',
      version: 1,
      trigger: { type: 'booking_created', label: 'Booking Created' },
      actions: [
        {
          id: 'a1',
          type: 'email',
          label: 'Send Confirmation Email',
          config: {
            to: '{{customer.email}}',
            subject: 'Booking Confirmed!',
            body: 'Hi {{customer.name}}, your booking is confirmed for {{booking.date}}.'
          },
          order: 1
        },
        {
          id: 'a2',
          type: 'sms',
          label: 'Send SMS',
          config: {
            phoneNumber: '{{customer.phone}}',
            message: 'Your booking is confirmed!'
          },
          order: 2
        }
      ],
      isActive: true,
      executionCount: 245,
      lastRun: '2 hours ago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['confirmation', 'booking']
    },
    {
      id: '2',
      name: 'Appointment Reminder',
      description: 'Send reminder 24 hours before appointment',
      version: 1,
      trigger: { type: 'booking_reminder', label: 'Booking Reminder (24h)', config: { daysBeforeAppointment: 1 } },
      actions: [
        {
          id: 'a3',
          type: 'email',
          label: 'Send Reminder',
          config: {
            to: '{{customer.email}}',
            subject: 'Reminder: Appointment Tomorrow',
            body: 'Hi {{customer.name}}, reminder for your appointment on {{booking.date}}.'
          },
          order: 1
        }
      ],
      isActive: true,
      executionCount: 189,
      lastRun: '5 hours ago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['reminder']
    }
  ];

  // Load services from localStorage
  useEffect(() => {
    if (!selectedWorkspace) {
      setServices([]);
      return;
    }
    const loadServices = () => {
      const stored = localStorage.getItem(`zervos_services_${selectedWorkspace.id}`);
      if (stored) {
        const parsedServices = JSON.parse(stored);
        setServices(parsedServices.filter((s: any) => s.isEnabled));
      }
    };

    loadServices();

    // Listen for service updates
    const handleServicesUpdate = () => loadServices();
    window.addEventListener('services-updated', handleServicesUpdate);

    return () => {
      window.removeEventListener('services-updated', handleServicesUpdate);
    };
  }, [selectedWorkspace]);

  // Load workflows when workspace changes
  useEffect(() => {
    if (!workflowsStorageKey) {
      setWorkflows([]);
      return;
    }
    const saved = localStorage.getItem(workflowsStorageKey);
    if (saved) {
      setWorkflows(JSON.parse(saved));
    } else {
      setWorkflows(defaultWorkflows);
    }
  }, [workflowsStorageKey]);

  // Load logs when workspace changes
  useEffect(() => {
    if (!logsStorageKey) {
      setWorkflowLogs([]);
      return;
    }
    const savedLogs = localStorage.getItem(logsStorageKey);
    if (savedLogs) {
      setWorkflowLogs(JSON.parse(savedLogs));
    } else {
      setWorkflowLogs([]);
    }
  }, [logsStorageKey]);

  const saveWorkflows = (updated: Workflow[]) => {
    setWorkflows(updated);
    if (workflowsStorageKey) {
      localStorage.setItem(workflowsStorageKey, JSON.stringify(updated));
    }
  };

  const handleCreateWorkflow = () => {
    const now = new Date().toISOString();
    const workflow: Workflow = {
      id: Date.now().toString(),
      name: newWorkflow.name,
      description: newWorkflow.description,
      version: 1,
      trigger: {
        type: newWorkflow.trigger as any,
        label: triggerLabels[newWorkflow.trigger as keyof typeof triggerLabels]
      },
      actions: [],
      isActive: false,
      executionCount: 0,
      createdAt: now,
      updatedAt: now
    };
    
    const updated = [...workflows, workflow];
    saveWorkflows(updated);
    setCreateModalOpen(false);
    setNewWorkflow({ name: '', description: '', trigger: 'booking_created', actions: [] });
    toast({ title: "Workflow created", description: "You can now add actions to your workflow" });
  };

  const handleToggleActive = (id: string) => {
    const updated = workflows.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    );
    saveWorkflows(updated);
    toast({ 
      title: updated.find(w => w.id === id)?.isActive ? "Workflow activated" : "Workflow deactivated",
      description: "Changes saved successfully"
    });
  };

  const handleDeleteWorkflow = (id: string) => {
    const updated = workflows.filter(w => w.id !== id);
    saveWorkflows(updated);
    toast({ title: "Workflow deleted", description: "Workflow removed successfully" });
  };

  const handleDuplicateWorkflow = (workflow: Workflow) => {
    const duplicate: Workflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copy)`,
      version: 1,
      isActive: false,
      executionCount: 0,
      lastRun: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...workflows, duplicate];
    saveWorkflows(updated);
    toast({ title: "Workflow duplicated", description: "New workflow created" });
  };

  const handleAddAction = (actionType: WorkflowAction['type']) => {
    if (!editingWorkflow) return;

    const newAction: WorkflowAction = {
      id: `action_${Date.now()}`,
      type: actionType,
      label: actionLabels[actionType],
      config: {},
      order: editingWorkflow.actions.length + 1
    };

    setEditingAction(newAction);
    setAddActionOpen(true);
  };

  const handleSaveAction = () => {
    if (!editingWorkflow || !editingAction) return;

    const updatedActions = editingAction.order === 0
      ? [...editingWorkflow.actions, { ...editingAction, order: editingWorkflow.actions.length + 1 }]
      : editingWorkflow.actions.map(a => a.id === editingAction.id ? editingAction : a);

    const updatedWorkflow = {
      ...editingWorkflow,
      actions: updatedActions,
      version: editingWorkflow.version + 1,
      updatedAt: new Date().toISOString()
    };

    const updated = workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w);
    saveWorkflows(updated);
    setEditingWorkflow(updatedWorkflow);
    setEditingAction(null);
    setAddActionOpen(false);
    toast({ title: "Action saved", description: "Workflow updated successfully" });
  };

  const handleDeleteAction = (actionId: string) => {
    if (!editingWorkflow) return;

    const updatedActions = editingWorkflow.actions
      .filter(a => a.id !== actionId)
      .map((a, idx) => ({ ...a, order: idx + 1 }));

    const updatedWorkflow = {
      ...editingWorkflow,
      actions: updatedActions,
      version: editingWorkflow.version + 1,
      updatedAt: new Date().toISOString()
    };

    const updated = workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w);
    saveWorkflows(updated);
    setEditingWorkflow(updatedWorkflow);
    toast({ title: "Action deleted" });
  };

  const handleMoveAction = (actionId: string, direction: 'up' | 'down') => {
    if (!editingWorkflow) return;

    const currentIndex = editingWorkflow.actions.findIndex(a => a.id === actionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= editingWorkflow.actions.length) return;

    const updatedActions = [...editingWorkflow.actions];
    [updatedActions[currentIndex], updatedActions[newIndex]] = [updatedActions[newIndex], updatedActions[currentIndex]];
    updatedActions.forEach((a, idx) => a.order = idx + 1);

    const updatedWorkflow = {
      ...editingWorkflow,
      actions: updatedActions,
      version: editingWorkflow.version + 1,
      updatedAt: new Date().toISOString()
    };

    const updated = workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w);
    saveWorkflows(updated);
    setEditingWorkflow(updatedWorkflow);
  };

  const handleTestRun = () => {
    if (!editingWorkflow) return;

    // Simulate workflow execution
    const log: WorkflowLog = {
      id: `log_${Date.now()}`,
      workflowId: editingWorkflow.id,
      executionTime: new Date().toISOString(),
      status: 'success',
      duration: Math.floor(Math.random() * 5000) + 1000,
      triggeredBy: 'Manual Test',
      actions: editingWorkflow.actions.map(action => ({
        actionId: action.id,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        error: Math.random() > 0.9 ? 'Connection timeout' : undefined
      }))
    };

    const updatedLogs = [log, ...workflowLogs].slice(0, 100);
    setWorkflowLogs(updatedLogs);
    if (logsStorageKey) {
      localStorage.setItem(logsStorageKey, JSON.stringify(updatedLogs));
    }
    
    setTestRunOpen(true);
    toast({ title: "Test run completed", description: `Executed in ${log.duration}ms` });
  };

  const handleExportWorkflow = (workflow: Workflow) => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow_${workflow.name.replace(/\s+/g, '_')}.json`;
    link.click();
    toast({ title: "Workflow exported" });
  };

  const handleImportWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const newWorkflow: Workflow = {
          ...imported,
          id: Date.now().toString(),
          name: `${imported.name} (Imported)`,
          isActive: false,
          executionCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updated = [...workflows, newWorkflow];
        saveWorkflows(updated);
        toast({ title: "Workflow imported successfully" });
      } catch (error) {
        toast({ title: "Import failed", description: "Invalid workflow file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleCreateFromTemplate = (template: WorkflowTemplate, edited?: boolean) => {
    const workflow: Workflow = {
      id: Date.now().toString(),
      name: template.name,
      description: template.description,
      version: 1,
      trigger: template.workflow.trigger!,
      actions: template.workflow.actions || [],
      isActive: false,
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [template.category.toLowerCase()]
    };
    
    const updated = [...workflows, workflow];
    saveWorkflows(updated);
    setTemplatesOpen(false);
    setTemplatePreviewOpen(false);
    setEditingTemplate(null);
    toast({ title: edited ? "Custom workflow created" : "Workflow created from template" });
  };

  const handleEditTemplate = (template: WorkflowTemplate) => {
    setEditingTemplate(template);
    setTemplatePreviewOpen(true);
  };

  const handleSaveEditedTemplate = () => {
    if (editingTemplate) {
      handleCreateFromTemplate(editingTemplate, true);
    }
  };

  const handleCreateCustomWorkflow = () => {
    setCustomWorkflowMode(true);
  };

  const insertVariable = (variable: string, field: 'subject' | 'body' | 'message' | 'to' | 'phoneNumber') => {
    if (!editingAction) return;
    
    const currentValue = editingAction.config[field] || '';
    setEditingAction({
      ...editingAction,
      config: {
        ...editingAction.config,
        [field]: currentValue + variable
      }
    });
  };

  const triggerLabels: Record<string, string> = {
    booking_created: 'Booking Created',
    booking_rescheduled: 'Booking Rescheduled',
    booking_cancelled: 'Booking Cancelled',
    booking_reminder: 'Booking Reminder',
    payment_received: 'Payment Received',
    customer_created: 'Customer Created',
    time_based: 'Time Based',
    custom_event: 'Custom Event'
  };

  const triggerIcons: Record<string, any> = {
    booking_created: CheckCircle2,
    booking_rescheduled: Clock,
    booking_cancelled: XCircle,
    booking_reminder: Bell,
    payment_received: DollarSign,
    customer_created: Users,
    time_based: Clock,
    custom_event: Zap
  };

  const actionIcons: Record<string, any> = {
    email: Mail,
    sms: MessageSquare,
    whatsapp: Smartphone,
    notification: Bell,
    webhook: Link,
    calendar_event: Calendar,
    payment: DollarSign,
    wait: Clock,
    condition: GitBranch,
    slack: Slack,
    teams: Users,
    crm_sync: Database,
    add_tag: Tag
  };

  const actionLabels: Record<string, string> = {
    email: 'Send Email',
    sms: 'Send SMS',
    whatsapp: 'Send WhatsApp',
    notification: 'Send Notification',
    webhook: 'Call Webhook',
    calendar_event: 'Add Calendar Event',
    payment: 'Process Payment',
    wait: 'Wait/Delay',
    condition: 'Add Condition',
    slack: 'Send Slack Message',
    teams: 'Send Teams Message',
    crm_sync: 'Sync to CRM',
    add_tag: 'Add Tag'
  };

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         w.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && w.isActive) ||
                         (filterStatus === 'inactive' && !w.isActive);
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
              <p className="text-sm text-gray-600 mt-1">Automate your booking processes and communications</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setTemplatesOpen(true)} variant="outline" className="gap-2" disabled={!selectedWorkspace}>
                <FileText size={18} />
                Browse Templates
              </Button>
              <Button onClick={() => setCreateModalOpen(true)} className="gap-2" disabled={!selectedWorkspace}>
                <Plus size={18} />
                Create Workflow
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace guard */}
        {!selectedWorkspace && (
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              Please select a workspace from the "My Space" dropdown to manage your workflows.
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{workflows.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {workflows.filter(w => w.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">98.5%</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workflows List */}
          <div className="space-y-4">
            {filteredWorkflows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search' : 'Create your first workflow to get started'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                      <Plus size={18} />
                      Create Workflow
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredWorkflows.map((workflow) => {
                const TriggerIcon = triggerIcons[workflow.trigger.type];
                return (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${workflow.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <TriggerIcon size={24} className={workflow.isActive ? 'text-green-600' : 'text-gray-400'} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                              <Badge variant={workflow.isActive ? "default" : "secondary"}>
                                {workflow.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                            
                            {/* Trigger and Actions Flow */}
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="gap-1">
                                <TriggerIcon size={14} />
                                {workflow.trigger.label}
                              </Badge>
                              <ArrowRight size={16} className="text-gray-400" />
                              <div className="flex items-center gap-2">
                                {workflow.actions.slice(0, 3).map((action) => {
                                  const ActionIcon = actionIcons[action.type];
                                  return (
                                    <Badge key={action.id} variant="outline" className="gap-1">
                                      <ActionIcon size={14} />
                                      {action.type}
                                    </Badge>
                                  );
                                })}
                                {workflow.actions.length > 3 && (
                                  <Badge variant="outline">+{workflow.actions.length - 3} more</Badge>
                                )}
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Play size={14} />
                                <span>{workflow.executionCount} executions</span>
                              </div>
                              {workflow.lastRun && (
                                <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>Last run {workflow.lastRun}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingWorkflow(workflow);
                              setBuilderOpen(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(workflow.id)}
                          >
                            {workflow.isActive ? <Pause size={16} /> : <Play size={16} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateWorkflow(workflow)}
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Create Workflow Modal */}
        <Dialog open={createModalOpen} onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setCustomWorkflowMode(false);
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                {customWorkflowMode ? 'Build your custom workflow from scratch' : 'Choose how to create your workflow'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(85vh-180px)]">
              {!customWorkflowMode && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-2 hover:border-purple-500 hover:bg-purple-50"
                    onClick={() => setTemplatesOpen(true)}
                  >
                    <FileText size={24} className="text-purple-600" />
                    <div className="text-center">
                      <p className="font-semibold text-sm">Use Template</p>
                      <p className="text-xs text-gray-500">Start from {workflowTemplates.length} pre-built templates</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-2 hover:border-blue-500 hover:bg-blue-50"
                    onClick={handleCreateCustomWorkflow}
                  >
                    <Code size={24} className="text-blue-600" />
                    <div className="text-center">
                      <p className="font-semibold text-sm">Custom Workflow</p>
                      <p className="text-xs text-gray-500">Build from scratch manually</p>
                    </div>
                  </Button>
                </div>
              )}
              {customWorkflowMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Code size={18} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Custom Workflow Mode</p>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">Define your workflow details below, then add actions after creation</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Workflow Name *</Label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="e.g., Booking Confirmation Flow"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Event *</Label>
                <Select value={newWorkflow.trigger} onValueChange={(v) => setNewWorkflow({ ...newWorkflow, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking_created">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Booking Created
                      </div>
                    </SelectItem>
                    <SelectItem value="booking_rescheduled">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        Booking Rescheduled
                      </div>
                    </SelectItem>
                    <SelectItem value="booking_cancelled">
                      <div className="flex items-center gap-2">
                        <XCircle size={16} />
                        Booking Cancelled
                      </div>
                    </SelectItem>
                    <SelectItem value="booking_reminder">
                      <div className="flex items-center gap-2">
                        <Bell size={16} />
                        Booking Reminder (24h before)
                      </div>
                    </SelectItem>
                    <SelectItem value="payment_received">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} />
                        Payment Received
                      </div>
                    </SelectItem>
                    <SelectItem value="customer_created">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        Customer Created
                      </div>
                    </SelectItem>
                    <SelectItem value="time_based">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        Time Based (Scheduled)
                      </div>
                    </SelectItem>
                    <SelectItem value="custom_event">
                      <div className="flex items-center gap-2">
                        <Code size={16} />
                        Custom Event
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom trigger configuration fields */}
              {newWorkflow.trigger === 'booking_reminder' && (
                <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Label>Days Before Appointment</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    defaultValue="1"
                    onChange={(e) => setNewWorkflow({
                      ...newWorkflow,
                      trigger: 'booking_reminder'
                    })}
                  />
                  <p className="text-xs text-gray-600">Trigger this workflow X days before the scheduled appointment</p>
                </div>
              )}
              
              {newWorkflow.trigger === 'time_based' && (
                <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <Label>Scheduled Time</Label>
                    <Input
                      type="time"
                      defaultValue="09:00"
                      onChange={(e) => setNewWorkflow({
                        ...newWorkflow,
                        trigger: 'time_based'
                      })}
                    />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Select defaultValue="Asia/Kolkata">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-600">Run this workflow daily at the specified time</p>
                </div>
              )}
              
              {newWorkflow.trigger === 'custom_event' && (
                <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Code size={16} className="text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Custom Event Configuration</p>
                      <p className="text-xs text-purple-700">Define your own trigger event and conditions</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Event Name *</Label>
                    <Input
                      placeholder="e.g., customer_inactive_60days, inventory_low_stock"
                      onChange={(e) => setNewWorkflow({
                        ...newWorkflow,
                        trigger: 'custom_event'
                      })}
                    />
                    <p className="text-xs text-gray-600 mt-1">Use lowercase with underscores (no spaces)</p>
                  </div>
                  
                  <div>
                    <Label>Event Description</Label>
                    <Textarea
                      placeholder="Describe when this custom event should trigger"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label>Trigger Condition (Optional)</Label>
                    <Select defaultValue="manual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Trigger (API/Webhook)</SelectItem>
                        <SelectItem value="condition">Based on Condition</SelectItem>
                        <SelectItem value="schedule">On Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-white border border-purple-200 rounded p-2">
                    <p className="text-xs font-medium text-purple-900 mb-1">💡 Usage Examples:</p>
                    <ul className="text-xs text-purple-800 space-y-1 ml-4 list-disc">
                      <li>customer_inactive_60days - Re-engage dormant customers</li>
                      <li>inventory_reorder_needed - Auto-reorder low stock items</li>
                      <li>subscription_expiring_soon - Renewal reminders</li>
                      <li>vip_customer_registered - Special welcome flow</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {customWorkflowMode && (
                <Button variant="ghost" onClick={() => setCustomWorkflowMode(false)}>
                  Back to Options
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                setCreateModalOpen(false);
                setCustomWorkflowMode(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow} disabled={!newWorkflow.name || !newWorkflow.trigger}>
                <Plus size={16} className="mr-2" />
                Create Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Advanced Workflow Builder Modal */}
        <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Edit Workflow: {editingWorkflow?.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setTestRunOpen(true)}>
                    <Play size={14} className="mr-1" />
                    Test Run
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLogsOpen(true)}>
                    <FileText size={14} className="mr-1" />
                    Logs
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => editingWorkflow && handleExportWorkflow(editingWorkflow)}>
                    <Download size={14} className="mr-1" />
                    Export
                  </Button>
                </div>
              </DialogTitle>
              <DialogDescription>
                Version {editingWorkflow?.version || '1.0'} • Last updated: {editingWorkflow?.updatedAt ? new Date(editingWorkflow.updatedAt).toLocaleDateString() : 'Never'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Tabs defaultValue="actions">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="visual">✨ Visual Builder</TabsTrigger>
                  <TabsTrigger value="actions">Actions ({editingWorkflow?.actions?.length || 0})</TabsTrigger>
                  <TabsTrigger value="conditions">Conditions ({editingWorkflow?.conditions?.length || 0})</TabsTrigger>
                  <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                {/* ✨ Visual Workflow Builder Tab (Feature #1) */}
                <TabsContent value="visual" className="space-y-4 mt-4">
                  <div className="border-2 border-dashed rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4">
                        <GitBranch size={32} className="text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Visual Workflow Builder</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Drag-and-drop node-based interface for creating complex automation flows visually
                      </p>
                    </div>

                    {/* Visual Builder Canvas */}
                    <div className="bg-white rounded-lg border-2 p-6 min-h-[400px] relative">
                      {/* Trigger Node */}
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 w-64 shadow-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {editingWorkflow && React.createElement(triggerIcons[editingWorkflow.trigger.type], { size: 20, className: 'text-green-600' })}
                            <span className="font-semibold text-sm">TRIGGER</span>
                          </div>
                          <p className="text-sm text-gray-700">{editingWorkflow?.trigger.label}</p>
                          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-300"></div>
                        </div>
                      </div>

                      {/* Action Nodes */}
                      <div className="mt-32 space-y-8">
                        {editingWorkflow?.actions.sort((a, b) => a.order - b.order).map((action, index) => {
                          const ActionIcon = actionIcons[action.type];
                          return (
                            <div key={action.id} className="relative">
                              <div className="flex items-center justify-center mb-4">
                                <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4 w-64 shadow-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ActionIcon size={18} className="text-blue-600" />
                                    <span className="font-semibold text-xs uppercase">{action.type}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">{actionLabels[action.type]}</p>
                                  <p className="text-xs text-gray-500">
                                    {action.type === 'email' && `To: ${action.config?.to?.substring(0, 30) || 'Not set'}...`}
                                    {action.type === 'sms' && `Phone: ${action.config?.phoneNumber || 'Not set'}`}
                                    {action.type === 'wait' && `${action.config?.delayAmount} ${action.config?.delayUnit}`}
                                    {action.type === 'condition' && 'If/Then/Else Branch'}
                                    {action.type === 'webhook' && `URL: ${action.config?.url || 'Not set'}`}
                                  </p>
                                  <div className="flex gap-1 mt-3">
                                    <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => {
                                      setEditingAction(action);
                                      setAddActionOpen(true);
                                    }}>
                                      <Edit size={12} className="mr-1" />
                                      Edit
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => handleDeleteAction(action.id)}>
                                      <Trash2 size={12} className="mr-1 text-red-500" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {/* Connector Line */}
                              {index < (editingWorkflow?.actions.length || 0) - 1 && (
                                <div className="flex justify-center">
                                  <div className="w-0.5 h-8 bg-gray-300"></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Action Button in Flow */}
                      <div className="flex justify-center mt-8">
                        <Button onClick={() => setAddActionOpen(true)} className="gap-2 shadow-lg">
                          <Plus size={16} />
                          Add Action to Flow
                        </Button>
                      </div>

                      {/* End Node */}
                      {editingWorkflow && editingWorkflow.actions.length > 0 && (
                        <div className="flex justify-center mt-8">
                          <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4 w-64 text-center">
                            <CheckCircle2 size={24} className="mx-auto mb-2 text-gray-600" />
                            <span className="font-semibold text-sm text-gray-600">WORKFLOW COMPLETE</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Builder Instructions */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Zap size={16} className="text-green-600" />
                          </div>
                          <h4 className="font-semibold text-sm">1. Set Trigger</h4>
                        </div>
                        <p className="text-xs text-gray-600">Choose when your workflow should start</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Plus size={16} className="text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-sm">2. Add Actions</h4>
                        </div>
                        <p className="text-xs text-gray-600">Build your automation sequence</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Play size={16} className="text-purple-600" />
                          </div>
                          <h4 className="font-semibold text-sm">3. Test & Activate</h4>
                        </div>
                        <p className="text-xs text-gray-600">Run tests before going live</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Actions Tab */}
                <TabsContent value="actions" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Configure actions to execute when the trigger fires</p>
                    <Button size="sm" onClick={() => setAddActionOpen(true)} className="gap-2">
                      <Plus size={16} />
                      Add Action
                    </Button>
                  </div>

                  {/* Action List */}
                  {editingWorkflow?.actions && editingWorkflow.actions.length > 0 ? (
                    <div className="space-y-3">
                      {editingWorkflow.actions
                        .sort((a, b) => a.order - b.order)
                        .map((action, index) => {
                          const Icon = actionIcons[action.type];
                          return (
                            <div key={action.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                                    </div>
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <Icon size={16} className="text-purple-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-sm">{actionLabels[action.type]}</h4>
                                      {action.config?.retryOnFailure && (
                                        <Badge variant="outline" className="text-xs">Retry Enabled</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {action.type === 'email' && `To: ${action.config?.to || 'Not configured'}`}
                                      {action.type === 'sms' && `Phone: ${action.config?.phoneNumber || 'Not configured'}`}
                                      {action.type === 'whatsapp' && `WhatsApp: ${action.config?.phoneNumber || 'Not configured'}`}
                                      {action.type === 'webhook' && `URL: ${action.config?.url || 'Not configured'}`}
                                      {action.type === 'wait' && `Delay: ${action.config?.delayAmount || '0'} ${action.config?.delayUnit || 'minutes'}`}
                                      {action.type === 'calendar_event' && `Event: ${action.config?.eventTitle || 'Not configured'}`}
                                      {action.type === 'crm_sync' && `System: ${action.config?.crmSystem || 'Not configured'}`}
                                      {action.type === 'add_tag' && `Tag: ${action.config?.tagName || 'Not configured'}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleMoveAction(action.id, 'up')} disabled={index === 0}>
                                    <ChevronUp size={14} />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleMoveAction(action.id, 'down')} disabled={index === editingWorkflow.actions.length - 1}>
                                    <ChevronDown size={14} />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setEditingAction(action);
                                    setAddActionOpen(true);
                                  }}>
                                    <Edit size={14} />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteAction(action.id)}>
                                    <Trash2 size={14} className="text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Zap size={48} className="mx-auto text-gray-300 mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-1">No actions yet</h3>
                      <p className="text-sm text-gray-500 mb-4">Add your first action to get started</p>
                      <Button size="sm" onClick={() => setAddActionOpen(true)} className="gap-2">
                        <Plus size={16} />
                        Add Action
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Conditions Tab */}
                <TabsContent value="conditions" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Set conditions for when this workflow should execute</p>
                    <Button size="sm" className="gap-2">
                      <Plus size={16} />
                      Add Condition
                    </Button>
                  </div>

                  {/* ✨ Enhanced Conditional Logic Builder (Feature #6) */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <GitBranch size={24} className="text-orange-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-orange-900 mb-1">Advanced Conditional Logic</h4>
                        <p className="text-xs text-orange-700 mb-3">
                          Create complex if/then/else branches with AND/OR operators and custom formulas
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white border border-orange-200 rounded p-2">
                            <p className="text-xs font-medium text-gray-700">IF Conditions</p>
                            <p className="text-xs text-gray-500">equals, not_equals, contains, greater_than, less_than</p>
                          </div>
                          <div className="bg-white border border-orange-200 rounded p-2">
                            <p className="text-xs font-medium text-gray-700">Logic Operators</p>
                            <p className="text-xs text-gray-500">AND, OR, NOT combinations</p>
                          </div>
                          <div className="bg-white border border-orange-200 rounded p-2">
                            <p className="text-xs font-medium text-gray-700">Custom Formulas</p>
                            <p className="text-xs text-gray-500">Calculate values on the fly</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingWorkflow?.conditions && editingWorkflow.conditions.length > 0 ? (
                    <div className="space-y-3">
                      {editingWorkflow.conditions.map((condition) => (
                        <div key={condition.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <GitBranch size={20} className="text-orange-500" />
                              <div>
                                <p className="text-sm font-medium">
                                  {condition.field} {condition.operator} {condition.value}
                                </p>
                                <p className="text-xs text-gray-500">Logic: {condition.logic}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost">
                                <Edit size={14} />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 size={14} className="text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <GitBranch size={48} className="mx-auto text-gray-300 mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-1">No conditions set</h3>
                      <p className="text-sm text-gray-500 mb-4">Add conditions to control workflow execution</p>
                      <Button size="sm" className="gap-2">
                        <Plus size={16} />
                        Add Condition
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* ✨ Analytics Dashboard Tab (Feature #7) */}
                <TabsContent value="analytics" className="space-y-4 mt-4">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Runs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{editingWorkflow?.executionCount || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">All-time executions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">98.5%</div>
                        <p className="text-xs text-gray-500 mt-1">Successful completions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">2.3s</div>
                        <p className="text-xs text-gray-500 mt-1">Average execution time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Last Run</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                          {editingWorkflow?.lastRun || 'Never'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Most recent execution</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Execution Performance (Last 30 Days)</CardTitle>
                      <CardDescription>Track workflow runs, success rate, and failures over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg bg-gray-50">
                        <div className="text-center">
                          <RefreshCw size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-sm text-gray-600">Performance chart visualization</p>
                          <p className="text-xs text-gray-500 mt-1">Line/Bar chart showing daily executions, success/failure rates</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Action Performance Breakdown</CardTitle>
                      <CardDescription>Individual action success rates and average execution times</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {editingWorkflow?.actions.map((action) => {
                          const successRate = 95 + Math.random() * 5;
                          const avgTime = (Math.random() * 1000 + 200).toFixed(0);
                          const ActionIcon = actionIcons[action.type];
                          return (
                            <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                              <div className="flex items-center gap-3 flex-1">
                                <ActionIcon size={18} className="text-blue-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{actionLabels[action.type]}</p>
                                  <p className="text-xs text-gray-500">{action.config?.to || action.config?.phoneNumber || 'Configured'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-green-600">{successRate.toFixed(1)}%</p>
                                  <p className="text-xs text-gray-500">Success Rate</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-blue-600">{avgTime}ms</p>
                                  <p className="text-xs text-gray-500">Avg Time</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {(!editingWorkflow?.actions || editingWorkflow.actions.length === 0) && (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No actions to analyze</p>
                            <p className="text-xs">Add actions to see performance metrics</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Conversion Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Conversion & Impact Metrics</CardTitle>
                      <CardDescription>Measure workflow effectiveness and business impact</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 size={18} className="text-green-600" />
                            <p className="text-sm font-medium">Booking Conversion</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600">67.8%</p>
                          <p className="text-xs text-gray-600 mt-1">Customers who booked after workflow</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-blue-600" />
                            <p className="text-sm font-medium">Revenue Impact</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">₹1.2L</p>
                          <p className="text-xs text-gray-600 mt-1">Generated this month</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Users size={18} className="text-purple-600" />
                            <p className="text-sm font-medium">Customer Retention</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">89%</p>
                          <p className="text-xs text-gray-600 mt-1">Return rate after workflow</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Error Logs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Errors & Issues</CardTitle>
                      <CardDescription>Track and resolve workflow failures</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {workflowLogs
                        .filter(log => log.workflowId === editingWorkflow?.id && log.status === 'failed')
                        .slice(0, 5).length > 0 ? (
                        <div className="space-y-2">
                          {workflowLogs
                            .filter(log => log.workflowId === editingWorkflow?.id && log.status === 'failed')
                            .slice(0, 5)
                            .map((log) => (
                              <div key={log.id} className="flex items-start gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-900">Execution Failed</p>
                                  <p className="text-xs text-red-700">{new Date(log.executionTime).toLocaleString()}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {log.actions.find(a => a.status === 'failed')?.error || 'Unknown error'}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <CheckCircle2 size={48} className="mx-auto text-green-300 mb-2" />
                          <p className="text-sm text-gray-600">No recent errors</p>
                          <p className="text-xs text-gray-500">All workflow runs completed successfully</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Workflow Name</Label>
                      <Input
                        value={editingWorkflow?.name || ''}
                        onChange={(e) => {
                          if (editingWorkflow) {
                            const updated = { ...editingWorkflow, name: e.target.value };
                            setEditingWorkflow(updated);
                          }
                        }}
                        placeholder="Enter workflow name"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editingWorkflow?.description || ''}
                        onChange={(e) => {
                          if (editingWorkflow) {
                            const updated = { ...editingWorkflow, description: e.target.value };
                            setEditingWorkflow(updated);
                          }
                        }}
                        placeholder="Describe what this workflow does"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label>Active Status</Label>
                        <p className="text-sm text-gray-500">Enable or disable this workflow</p>
                      </div>
                      <Switch
                        checked={editingWorkflow?.isActive}
                        onCheckedChange={(checked) => {
                          if (editingWorkflow) {
                            const updated = { ...editingWorkflow, isActive: checked };
                            setEditingWorkflow(updated);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editingWorkflow?.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                        <Button size="sm" variant="outline">
                          <Plus size={14} className="mr-1" />
                          Add Tag
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {/* ✨ Enhanced Template Variables Section (Feature #8) */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Code size={16} className="text-purple-600" />
                        Template Variables Library
                      </h4>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                        <p className="text-xs text-purple-900 mb-3">
                          ✨ Use dynamic variables to personalize your workflows. Variables are automatically replaced with real data when the workflow runs.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white border border-purple-200 rounded p-2">
                            <p className="text-xs font-semibold text-purple-900 mb-1">📧 Customer Variables</p>
                            <p className="text-xs text-gray-600">Name, email, phone, birthday, loyalty info</p>
                          </div>
                          <div className="bg-white border border-purple-200 rounded p-2">
                            <p className="text-xs font-semibold text-purple-900 mb-1">📅 Date & Time Variables</p>
                            <p className="text-xs text-gray-600">Today, tomorrow, formatted dates, times</p>
                          </div>
                          <div className="bg-white border border-purple-200 rounded p-2">
                            <p className="text-xs font-semibold text-purple-900 mb-1">🧮 Calculations</p>
                            <p className="text-xs text-gray-600">Customer lifetime value, days until booking</p>
                          </div>
                          <div className="bg-white border border-purple-200 rounded p-2">
                            <p className="text-xs font-semibold text-purple-900 mb-1">🔀 Conditional Logic</p>
                            <p className="text-xs text-gray-600">If/then expressions, dynamic content</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Variables Accordion */}
                      <div className="space-y-2">
                        {Object.entries(variables).map(([category, vars]) => (
                          <details key={category} className="border rounded-lg bg-white">
                            <summary className="cursor-pointer p-3 hover:bg-gray-50 font-medium text-sm capitalize flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Tag size={14} className="text-purple-600" />
                                {category.replace('_', ' ')} Variables ({Array.isArray(vars) ? vars.length : 0})
                              </span>
                              <ChevronRight size={14} className="text-gray-400" />
                            </summary>
                            <div className="p-3 pt-0 border-t">
                              <div className="grid grid-cols-3 gap-2">
                                {Array.isArray(vars) && vars.map((variable, idx) => (
                                  <div key={idx} className="group">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(String(variable));
                                        toast({ title: "Copied!", description: `${variable} copied to clipboard` });
                                      }}
                                      className="w-full text-left text-xs px-2 py-1.5 bg-gray-50 hover:bg-purple-100 border border-gray-200 hover:border-purple-300 rounded font-mono transition-colors"
                                    >
                                      {String(variable)}
                                    </button>
                                  </div>
                                ))}
                              </div>
                              {category === 'conditionals' && (
                                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <p className="text-xs text-yellow-900 font-medium mb-1">💡 Conditional Syntax:</p>
                                  <code className="text-xs text-yellow-800">
                                    {'{{if:condition?"value_if_true":"value_if_false"}}'}
                                  </code>
                                </div>
                              )}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2">Available Services</h4>
                      <p className="text-xs text-gray-600 mb-3">
                        Use these services in your workflow templates with variables like {'{{service.name}}'}, {'{{service.price}}'}, {'{{service.category}}'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border">
                        {services.length > 0 ? (
                          services.slice(0, 12).map((service) => (
                            <div key={service.id} className="text-xs px-2 py-1 bg-white border rounded flex items-center gap-1">
                              <Tag size={12} className="text-purple-600" />
                              <span className="truncate">{service.name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 text-center text-xs text-gray-500 py-2">
                            No services available. Add services in the Services page.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2">Workflow Templates</h4>
                      <p className="text-xs text-gray-600 mb-3">Apply pre-built workflow templates</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workflowTemplates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">{template.category}</Badge>
                          </div>
                          <Button size="sm" onClick={() => handleCreateFromTemplate(template)}>
                            Apply
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{template.workflow.actions?.length || 0} actions</span>
                          <span>•</span>
                          <span>{template.workflow.conditions?.length || 0} conditions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBuilderOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                if (editingWorkflow) {
                  const updated = workflows.map(w => w.id === editingWorkflow.id ? editingWorkflow : w);
                  setWorkflows(updated);
                  localStorage.setItem('zervos_workflows', JSON.stringify(updated));
                  setBuilderOpen(false);
                }
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Action Modal */}
        <Dialog open={addActionOpen} onOpenChange={setAddActionOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAction ? 'Edit Action' : 'Add Action'}</DialogTitle>
              <DialogDescription>Configure the action details and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingAction && (
                <div>
                  <Label>Action Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['email', 'sms', 'whatsapp', 'webhook', 'calendar_event', 'wait', 'crm_sync', 'add_tag'] as WorkflowAction['type'][]).map((type) => {
                      const Icon = actionIcons[type];
                      return (
                        <Button
                          key={type}
                          variant="outline"
                          className="justify-start gap-2 h-auto py-3"
                          onClick={() => handleAddAction(type)}
                        >
                          <Icon size={16} />
                          <span className="text-sm">{actionLabels[type]}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {editingAction && (
                <>
                  {/* Email Action Config */}
                  {editingAction.type === 'email' && (
                    <div className="space-y-4">
                      <div>
                        <Label>To Email</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingAction.config?.to || ''}
                            onChange={(e) => setEditingAction({
                              ...editingAction,
                              config: { ...editingAction.config, to: e.target.value }
                            })}
                            placeholder="recipient@example.com or {{customer.email}}"
                          />
                          <Button size="sm" variant="outline" onClick={() => insertVariable('{{customer.email}}', 'to')}>
                            <Tag size={14} />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingAction.config?.subject || ''}
                            onChange={(e) => setEditingAction({
                              ...editingAction,
                              config: { ...editingAction.config, subject: e.target.value }
                            })}
                            placeholder="Email subject"
                          />
                          <Button size="sm" variant="outline" onClick={() => insertVariable('{{customer.name}}', 'subject')}>
                            <Tag size={14} />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Body</Label>
                        <Textarea
                          value={editingAction.config?.body || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, body: e.target.value }
                          })}
                          placeholder="Email body content. Use {{customer.name}}, {{booking.date}}, etc."
                          rows={6}
                        />
                        <div className="space-y-2 mt-2">
                          <p className="text-xs font-medium text-gray-700">Quick Insert Variables:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(variables).map(([category, vars]) => (
                              <div key={category} className="flex gap-1">
                                {Object.keys(vars).slice(0, 2).map((varKey) => {
                                  const varValue = String(vars[varKey as keyof typeof vars]);
                                  return (
                                    <Button
                                      key={varKey}
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => insertVariable(varValue, 'body')}
                                    >
                                      {varValue}
                                    </Button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                          {services.length > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded p-2">
                              <p className="text-xs font-medium text-purple-900 mb-1">Available Services:</p>
                              <div className="flex flex-wrap gap-1">
                                {services.slice(0, 6).map((service) => (
                                  <span key={service.id} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                    {service.name}
                                  </span>
                                ))}
                                {services.length > 6 && (
                                  <span className="text-xs px-2 py-0.5 text-purple-600">
                                    +{services.length - 6} more
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-purple-700 mt-1">
                                Use {'{{service.name}}'}, {'{{service.price}}'}, {'{{service.duration}}'} in your template
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMS Action Config */}
                  {editingAction.type === 'sms' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Phone Number</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingAction.config?.phoneNumber || ''}
                            onChange={(e) => setEditingAction({
                              ...editingAction,
                              config: { ...editingAction.config, phoneNumber: e.target.value }
                            })}
                            placeholder="+1234567890 or {{customer.phone}}"
                          />
                          <Button size="sm" variant="outline" onClick={() => insertVariable('{{customer.phone}}', 'phoneNumber')}>
                            <Tag size={14} />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea
                          value={editingAction.config?.message || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, message: e.target.value }
                          })}
                          placeholder="SMS message. Use {{customer.name}}, {{booking.date}}, etc."
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Action Config */}
                  {editingAction.type === 'whatsapp' && (
                    <div className="space-y-4">
                      <div>
                        <Label>WhatsApp Number</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingAction.config?.phoneNumber || ''}
                            onChange={(e) => setEditingAction({
                              ...editingAction,
                              config: { ...editingAction.config, phoneNumber: e.target.value }
                            })}
                            placeholder="+1234567890 or {{customer.phone}}"
                          />
                          <Button size="sm" variant="outline" onClick={() => insertVariable('{{customer.phone}}', 'phoneNumber')}>
                            <Tag size={14} />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea
                          value={editingAction.config?.message || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, message: e.target.value }
                          })}
                          placeholder="WhatsApp message"
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {/* Webhook Action Config */}
                  {editingAction.type === 'webhook' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Webhook URL</Label>
                        <Input
                          value={editingAction.config?.url || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, url: e.target.value }
                          })}
                          placeholder="https://api.example.com/webhook"
                        />
                      </div>
                      <div>
                        <Label>Method</Label>
                        <Select
                          value={editingAction.config?.method || 'POST'}
                          onValueChange={(value) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, method: value as 'GET' | 'POST' | 'PUT' | 'DELETE' }
                          })}
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Headers (JSON)</Label>
                        <Textarea
                          value={typeof editingAction.config?.headers === 'string' ? editingAction.config.headers : JSON.stringify(editingAction.config?.headers || {})}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, headers: e.target.value }
                          })}
                          placeholder='{"Authorization": "Bearer token"}'
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Payload (JSON)</Label>
                        <Textarea
                          value={editingAction.config?.payload || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, payload: e.target.value }
                          })}
                          placeholder='{"customerId": "{{customer.id}}"}'
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {/* Wait/Delay Action Config */}
                  {editingAction.type === 'wait' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Delay Amount</Label>
                        <Input
                          type="number"
                          value={editingAction.config?.delayAmount || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, delayAmount: e.target.value }
                          })}
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <Label>Delay Unit</Label>
                        <Select
                          value={editingAction.config?.delayUnit || 'minutes'}
                          onValueChange={(value) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, delayUnit: value as 'minutes' | 'hours' | 'days' }
                          })}
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Calendar Event Action Config */}
                  {editingAction.type === 'calendar_event' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Event Title</Label>
                        <Input
                          value={editingAction.config?.eventTitle || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, eventTitle: e.target.value }
                          })}
                          placeholder="Appointment with {{customer.name}}"
                        />
                      </div>
                      <div>
                        <Label>Event Date</Label>
                        <Input
                          value={editingAction.config?.eventDate || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, eventDate: e.target.value }
                          })}
                          placeholder="{{booking.date}}"
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={editingAction.config?.duration || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, duration: e.target.value }
                          })}
                          placeholder="60"
                        />
                      </div>
                    </div>
                  )}

                  {/* CRM Sync Action Config */}
                  {editingAction.type === 'crm_sync' && (
                    <div className="space-y-4">
                      <div>
                        <Label>CRM System</Label>
                        <Select
                          value={editingAction.config?.crmSystem || ''}
                          onValueChange={(value) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, crmSystem: value as 'salesforce' | 'hubspot' | 'zoho' }
                          })}
                        >
                          <option value="salesforce">Salesforce</option>
                          <option value="hubspot">HubSpot</option>
                          <option value="zoho">Zoho CRM</option>
                          <option value="pipedrive">Pipedrive</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Action</Label>
                        <Select
                          value={editingAction.config?.action || ''}
                          onValueChange={(value) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, action: value as 'create_contact' | 'update_contact' | 'create_deal' }
                          })}
                        >
                          <option value="create_contact">Create Contact</option>
                          <option value="update_contact">Update Contact</option>
                          <option value="create_deal">Create Deal</option>
                          <option value="add_note">Add Note</option>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Add Tag Action Config */}
                  {editingAction.type === 'add_tag' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Tag Name</Label>
                        <Input
                          value={editingAction.config?.tagName || ''}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, tagName: e.target.value }
                          })}
                          placeholder="VIP Customer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Settings */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Advanced Settings</h4>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Retry on Failure</Label>
                        <p className="text-xs text-gray-500">Automatically retry if action fails</p>
                      </div>
                      <Switch
                        checked={editingAction.config?.retryOnFailure || false}
                        onCheckedChange={(checked) => setEditingAction({
                          ...editingAction,
                          config: { ...editingAction.config, retryOnFailure: checked }
                        })}
                      />
                    </div>
                    {editingAction.config?.retryOnFailure && (
                      <div className="mt-3">
                        <Label>Max Retry Attempts</Label>
                        <Input
                          type="number"
                          value={editingAction.config?.retryAttempts || 3}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, retryAttempts: parseInt(e.target.value) }
                          })}
                          placeholder="3"
                          min="1"
                          max="5"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {editingAction && (
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setAddActionOpen(false);
                  setEditingAction(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAction}>
                  Save Action
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Workflow Logs Modal */}
        <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Workflow Execution Logs</DialogTitle>
              <DialogDescription>View detailed execution history and results</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {workflowLogs.filter(log => log.workflowId === editingWorkflow?.id).length > 0 ? (
                <div className="space-y-3">
                  {workflowLogs
                    .filter(log => log.workflowId === editingWorkflow?.id)
                    .sort((a, b) => new Date(b.executionTime).getTime() - new Date(a.executionTime).getTime())
                    .map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                            <div>
                              <p className="text-sm font-medium">
                                {log.status === 'success' ? 'Completed Successfully' : log.status === 'failed' ? 'Failed' : 'In Progress'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.executionTime).toLocaleString()} • Duration: {log.duration}ms • Triggered by: {log.triggeredBy}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {log.actions.map((action, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs pl-5">
                              {action.status === 'success' ? (
                                <CheckCircle2 size={14} className="text-green-500" />
                              ) : action.status === 'failed' ? (
                                <XCircle size={14} className="text-red-500" />
                              ) : (
                                <Clock size={14} className="text-yellow-500" />
                              )}
                              <span className="text-gray-600">{action.actionName}</span>
                              {action.error && <span className="text-red-500">• {action.error}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">No execution logs yet</h3>
                  <p className="text-sm text-gray-500">Logs will appear here after workflow executions</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Test Run Modal */}
        <Dialog open={testRunOpen} onOpenChange={setTestRunOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Test Workflow</DialogTitle>
              <DialogDescription>Simulate workflow execution with sample data</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-blue-900 mb-1">Test Mode</h4>
                    <p className="text-xs text-blue-700">
                      This will simulate the workflow execution without sending actual emails, SMS, or making real API calls.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Test Scenario</Label>
                  <Select defaultValue="new_booking">
                    <option value="new_booking">New Booking Created</option>
                    <option value="rescheduled">Booking Rescheduled</option>
                    <option value="cancelled">Booking Cancelled</option>
                    <option value="reminder">24h Reminder</option>
                  </Select>
                </div>
                {services.length > 0 && (
                  <div>
                    <Label>Sample Service</Label>
                    <Select defaultValue={services[0]?.id}>
                      {services.slice(0, 10).map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - ₹{service.price}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Sample Customer Email</Label>
                  <Input defaultValue="test.customer@example.com" />
                </div>
                <div>
                  <Label>Sample Customer Name</Label>
                  <Input defaultValue="John Doe" />
                </div>
                <div>
                  <Label>Sample Booking Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTestRunOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                handleTestRun();
                setTestRunOpen(false);
                setLogsOpen(true);
              }}>
                <Play size={14} className="mr-2" />
                Run Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ✨ Templates Browser Modal (Feature #2) */}
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText size={24} className="text-purple-600" />
                Workflow Templates Library
              </DialogTitle>
              <DialogDescription>
                Choose from {workflowTemplates.length} pre-built workflow templates to get started quickly
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {/* Template Categories */}
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-6 mb-4">
                  <TabsTrigger value="all">All ({workflowTemplates.length})</TabsTrigger>
                  <TabsTrigger value="Booking">Booking ({workflowTemplates.filter(t => t.category === 'Booking').length})</TabsTrigger>
                  <TabsTrigger value="Customer">Customer ({workflowTemplates.filter(t => t.category === 'Customer').length})</TabsTrigger>
                  <TabsTrigger value="Reminders">Reminders ({workflowTemplates.filter(t => t.category === 'Reminders').length})</TabsTrigger>
                  <TabsTrigger value="Reports">Reports ({workflowTemplates.filter(t => t.category === 'Reports').length})</TabsTrigger>
                  <TabsTrigger value="Staff">Staff ({workflowTemplates.filter(t => t.category === 'Staff').length})</TabsTrigger>
                </TabsList>

                {['all', 'Booking', 'Customer', 'Reminders', 'Reports', 'Staff', 'Feedback', 'Payment', 'Service', 'Inventory'].map((category) => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workflowTemplates
                        .filter(t => category === 'all' || t.category === category)
                        .map((template) => {
                          const TriggerIcon = template.workflow.trigger ? triggerIcons[template.workflow.trigger.type] : Zap;
                          return (
                            <Card key={template.id} className="hover:shadow-lg transition-shadow">
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <TriggerIcon size={24} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditTemplate(template)}
                                    >
                                      <Edit size={14} className="mr-1" />
                                      Edit
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleCreateFromTemplate(template)}
                                    >
                                      Use
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <CardDescription className="text-sm mb-4">
                                  {template.description}
                                </CardDescription>
                                
                                {/* Template Preview */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary" className="gap-1">
                                      {TriggerIcon && <TriggerIcon size={12} />}
                                      {template.workflow.trigger?.label}
                                    </Badge>
                                    <ArrowRight size={12} className="text-gray-400" />
                                    <span className="text-gray-600">{template.workflow.actions?.length || 0} actions</span>
                                  </div>
                                  
                                  {/* Action Preview */}
                                  {template.workflow.actions && template.workflow.actions.length > 0 && (
                                    <div className="bg-gray-50 rounded p-2 space-y-1">
                                      {template.workflow.actions.slice(0, 3).map((action, idx) => {
                                        const ActionIcon = actionIcons[action.type];
                                        return (
                                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                            <ActionIcon size={12} className="text-blue-600" />
                                            <span>{actionLabels[action.type]}</span>
                                          </div>
                                        );
                                      })}
                                      {template.workflow.actions.length > 3 && (
                                        <p className="text-xs text-gray-500 pl-5">
                                          +{template.workflow.actions.length - 3} more actions
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                    
                    {workflowTemplates.filter(t => category === 'all' || t.category === category).length === 0 && (
                      <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-600">No templates in this category yet</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>

        {/* Template Preview/Edit Modal */}
        <Dialog open={templatePreviewOpen} onOpenChange={setTemplatePreviewOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit size={20} className="text-purple-600" />
                Edit Template: {editingTemplate?.name}
              </DialogTitle>
              <DialogDescription>
                Customize this template before creating your workflow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingTemplate && (
                <>
                  {/* Basic Details */}
                  <div className="space-y-4">
                    <div>
                      <Label>Workflow Name</Label>
                      <Input
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          name: e.target.value
                        })}
                        placeholder="Enter workflow name"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editingTemplate.description}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          description: e.target.value
                        })}
                        placeholder="Describe what this workflow does"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={editingTemplate.category}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          category: e.target.value
                        })}
                        placeholder="e.g., Booking, Customer, Reminders"
                      />
                    </div>
                  </div>

                  {/* Trigger Configuration */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-green-600" />
                      Trigger Event
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Trigger Type</Label>
                        <Select
                          value={editingTemplate.workflow.trigger?.type}
                          onValueChange={(value) => setEditingTemplate({
                            ...editingTemplate,
                            workflow: {
                              ...editingTemplate.workflow,
                              trigger: {
                                ...editingTemplate.workflow.trigger!,
                                type: value as any,
                                label: triggerLabels[value as keyof typeof triggerLabels]
                              }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="booking_created">Booking Created</SelectItem>
                            <SelectItem value="booking_rescheduled">Booking Rescheduled</SelectItem>
                            <SelectItem value="booking_cancelled">Booking Cancelled</SelectItem>
                            <SelectItem value="booking_reminder">Booking Reminder</SelectItem>
                            <SelectItem value="payment_received">Payment Received</SelectItem>
                            <SelectItem value="customer_created">Customer Created</SelectItem>
                            <SelectItem value="time_based">Time Based</SelectItem>
                            <SelectItem value="custom_event">Custom Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editingTemplate.workflow.trigger?.type === 'booking_reminder' && (
                        <div>
                          <Label>Days Before Appointment</Label>
                          <Input
                            type="number"
                            value={editingTemplate.workflow.trigger?.config?.daysBeforeAppointment || 1}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate,
                              workflow: {
                                ...editingTemplate.workflow,
                                trigger: {
                                  ...editingTemplate.workflow.trigger!,
                                  config: {
                                    ...editingTemplate.workflow.trigger!.config,
                                    daysBeforeAppointment: parseInt(e.target.value)
                                  }
                                }
                              }
                            })}
                            placeholder="1"
                          />
                        </div>
                      )}
                      {editingTemplate.workflow.trigger?.type === 'time_based' && (
                        <div>
                          <Label>Scheduled Time</Label>
                          <Input
                            type="time"
                            value={editingTemplate.workflow.trigger?.config?.time || '09:00'}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate,
                              workflow: {
                                ...editingTemplate.workflow,
                                trigger: {
                                  ...editingTemplate.workflow.trigger!,
                                  config: {
                                    ...editingTemplate.workflow.trigger!.config,
                                    time: e.target.value
                                  }
                                }
                              }
                            })}
                          />
                        </div>
                      )}
                      {editingTemplate.workflow.trigger?.type === 'custom_event' && (
                        <div>
                          <Label>Custom Event Name</Label>
                          <Input
                            value={editingTemplate.workflow.trigger?.config?.customEventName || ''}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate,
                              workflow: {
                                ...editingTemplate.workflow,
                                trigger: {
                                  ...editingTemplate.workflow.trigger!,
                                  config: {
                                    ...editingTemplate.workflow.trigger!.config,
                                    customEventName: e.target.value
                                  }
                                }
                              }
                            })}
                            placeholder="e.g., customer_inactive_60days"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Preview */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Settings size={16} className="text-blue-600" />
                      Actions ({editingTemplate.workflow.actions?.length || 0})
                    </h4>
                    {editingTemplate.workflow.actions && editingTemplate.workflow.actions.length > 0 ? (
                      <div className="space-y-2">
                        {editingTemplate.workflow.actions.map((action, index) => {
                          const ActionIcon = actionIcons[action.type];
                          return (
                            <div key={action.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs font-semibold text-blue-600">
                                  {index + 1}
                                </div>
                                <ActionIcon size={16} className="text-blue-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{actionLabels[action.type]}</p>
                                  <p className="text-xs text-gray-500">
                                    {action.type === 'email' && `To: ${action.config?.to || 'Not set'}`}
                                    {action.type === 'sms' && `Phone: ${action.config?.phoneNumber || 'Not set'}`}
                                    {action.type === 'wait' && `${action.config?.delayAmount} ${action.config?.delayUnit}`}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const updatedActions = editingTemplate.workflow.actions!.filter((_, i) => i !== index);
                                    setEditingTemplate({
                                      ...editingTemplate,
                                      workflow: {
                                        ...editingTemplate.workflow,
                                        actions: updatedActions
                                      }
                                    });
                                  }}
                                >
                                  <Trash2 size={14} className="text-red-500" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">No actions configured</p>
                        <p className="text-xs text-gray-400 mt-1">You can add actions after creating the workflow</p>
                      </div>
                    )}
                  </div>

                  {/* Info Banner */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-purple-900">Template Customization</p>
                        <p className="text-xs text-purple-700 mt-1">
                          You can edit the basic details and trigger here. After creating the workflow,
                          use the workflow builder to add, edit, or remove actions.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setTemplatePreviewOpen(false);
                setEditingTemplate(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditedTemplate}>
                <CheckCircle2 size={16} className="mr-2" />
                Create Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
