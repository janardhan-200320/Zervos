import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  User, 
  Mail, 
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  Globe,
  Building2,
  Download,
  ExternalLink,
  DollarSign,
  Star,
  Sparkles,
  Gift,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Banknote,
  Share2,
  Copy,
  Heart,
  ThumbsUp,
  ChevronDown,
  MapPinned,
  Users,
  Zap,
  Award,
  Lock,
  Shield,
  Shuffle,
  Timer,
  Percent,
  Tag,
  Search,
  AlertCircle,
  Bell,
  UserPlus,
  MinusCircle,
  PlusCircle,
  Edit3,
  RefreshCw,
  MessageCircle,
  Ticket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl, 
  downloadICalFile,
  createEventDate,
  type CalendarEvent 
} from '@/lib/calendar-utils';

interface BookingPageSettings {
  businessName: string;
  bookingUrl: string;
  welcomeMessage: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  showLogo: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  socialImage: string;
  // Extended company details
  logo?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  workingHours?: string;
  rating?: number;
  reviewCount?: number;
  establishedYear?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  isActive: boolean;
}

type DynamicFieldType = 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
interface LoginField {
  id: string;
  name: string;
  type: DynamicFieldType;
  required: boolean;
  placeholder?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  durationMinutes: number;
  locationType: 'in-person' | 'phone' | 'video' | 'custom';
  hostName: string;
  color: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilitySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface BookingPayload {
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  serviceId: string;
  assignedMemberId: string;
  assignedMemberName: string;
  date: string;
  time: string;
  status: 'upcoming';
  notes: string;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeBreakMap = (input: any): Record<string, Array<{ startTime: string; endTime: string }>> => {
  const map: Record<string, Array<{ startTime: string; endTime: string }>> = {};
  WEEK_DAYS.forEach(day => {
    const entries = Array.isArray(input?.[day]) ? input[day] : [];
    map[day] = entries
      .map((entry: any) => ({
        startTime: typeof entry?.startTime === 'string' ? entry.startTime : '',
        endTime: typeof entry?.endTime === 'string' ? entry.endTime : '',
      }))
      .filter(b => b.startTime && b.endTime);
  });
  return map;
};

const convertHHMMToMinutes = (time24?: string) => {
  if (!time24 || typeof time24 !== 'string') return null;
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export default function PublicBookingPage() {
  // Support both /book/:serviceId and /booking/:workspaceId routes
  const [, bookParams] = useRoute('/book/:serviceId');
  const [, bookingParams] = useRoute('/booking/:workspaceId');
  
  const serviceId = bookParams?.serviceId;
  const urlWorkspaceId = bookingParams?.workspaceId;
  
  // Get workspaceId from URL or localStorage
  const workspaceId = urlWorkspaceId || localStorage.getItem('zervos_current_workspace') || 'default';

  // Steps: 1-Branch, 2-Services/Products/Attendee, 3-Time, 4-Details, 5-Payment, 6-Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [callData, setCallData] = useState<any | null>(null);
  // Dynamic booking form fields driven by Admin Center -> Customer Login Preferences
  const [loginFields, setLoginFields] = useState<LoginField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [orgSchedule, setOrgSchedule] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({});
  const [specialHours, setSpecialHours] = useState<Array<{ date: string; startTime: string; endTime: string }>>([]);
  const [unavailability, setUnavailability] = useState<Array<{ startDate: string; endDate: string }>>([]);
  const [bookingSettings, setBookingSettings] = useState<BookingPageSettings | null>(null);
  const [orgBreaks, setOrgBreaks] = useState<Record<string, Array<{ startTime: string; endTime: string }>>>({});
  const [callBreaks, setCallBreaks] = useState<Record<string, Array<{ startTime: string; endTime: string }>>>({});
  const [memberSchedule, setMemberSchedule] = useState<Record<string, { enabled: boolean; start: string; end: string }> | null>(null);
  const [assignedMemberId, setAssignedMemberId] = useState<string | null>(null);
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const [useManagedTimeSlots, setUseManagedTimeSlots] = useState(false);
  
  // New state for enhanced features
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [recommendedServices, setRecommendedServices] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [bookingConfirmationId, setBookingConfirmationId] = useState<string>('');
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [likedServices, setLikedServices] = useState<Set<string>>(new Set());
  
  // New state for multi-select services/products
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  
  // Enhanced features state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; type: 'percent' | 'fixed' } | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [groupSize, setGroupSize] = useState(1);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [customerReviews] = useState([
    { id: '1', name: 'Sarah M.', rating: 5, text: 'Excellent service! Very professional and friendly staff.', date: '2 days ago' },
    { id: '2', name: 'James K.', rating: 5, text: 'Best experience ever. Highly recommended!', date: '1 week ago' },
    { id: '3', name: 'Priya R.', rating: 4, text: 'Great quality and reasonable prices. Will visit again.', date: '2 weeks ago' },
  ]);
  
  // Promo codes database (in production, this would come from backend)
  const promoCodes: Record<string, { discount: number; type: 'percent' | 'fixed'; minAmount?: number }> = {
    'FIRST10': { discount: 10, type: 'percent' },
    'SAVE50': { discount: 50, type: 'fixed', minAmount: 200 },
    'VIP20': { discount: 20, type: 'percent' },
    'WELCOME': { discount: 15, type: 'percent' },
  };

  const persistAppointmentLocally = useCallback((appointment: BookingPayload) => {
    const record = {
      id: `apt-${Date.now()}`,
      ...appointment,
      assignedSalespersonId: appointment.assignedMemberId,
      workspaceId: (callData as any)?.workspaceId ?? null,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingRaw = localStorage.getItem('zervos_appointments');
      const parsed = existingRaw ? JSON.parse(existingRaw) : [];
      const next = Array.isArray(parsed) ? [...parsed, record] : [record];
      localStorage.setItem('zervos_appointments', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('appointments-updated', { detail: { workspaceId: record.workspaceId } }));

      window.dispatchEvent(new CustomEvent('timeslots-updated'));
    } catch (error) {
      console.warn('Failed to persist appointment locally:', error);
    }
  }, [callData]);

  // Load branches
  useEffect(() => {
    try {
      const branchesRaw = localStorage.getItem('zervos_branches');
      if (branchesRaw) {
        const parsed = JSON.parse(branchesRaw);
        const activeBranches = Array.isArray(parsed) ? parsed.filter((b: Branch) => b.isActive !== false) : [];
        setBranches(activeBranches);
        if (activeBranches.length > 0 && !selectedBranch) {
          setSelectedBranch(activeBranches[0].id);
        }
      } else {
        // Default branches if none configured
        const defaultBranches: Branch[] = [
          { id: 'main', name: 'Main Branch', address: 'Downtown', city: 'City Center', isActive: true },
        ];
        setBranches(defaultBranches);
        setSelectedBranch('main');
      }
    } catch {}
  }, []);

  // Load team members for attendee selection
  useEffect(() => {
    try {
      const membersRaw = localStorage.getItem('zervos_team_members');
      if (membersRaw) {
        const parsed = JSON.parse(membersRaw);
        setTeamMembers(Array.isArray(parsed) ? parsed.filter((m: any) => m.status === 'active' || !m.status) : []);
      }
    } catch {}
  }, []);

  // Load all services and products for recommendations
  useEffect(() => {
    try {
      // Load services
      const servicesRaw = localStorage.getItem('zervos_services_default') || localStorage.getItem('zervos_services');
      if (servicesRaw) {
        const parsed = JSON.parse(servicesRaw);
        const enabledServices = Array.isArray(parsed) ? parsed.filter((s: any) => s.isEnabled !== false) : [];
        setAllServices(enabledServices);
        
        // Generate random recommendations (3-5 services)
        const shuffled = [...enabledServices].sort(() => 0.5 - Math.random());
        setRecommendedServices(shuffled.slice(0, Math.min(4, shuffled.length)));
      }
      
      // Load products
      const productsRaw = localStorage.getItem('zervos_products_default') || localStorage.getItem('zervos_products');
      if (productsRaw) {
        const parsed = JSON.parse(productsRaw);
        const enabledProducts = Array.isArray(parsed) ? parsed.filter((p: any) => p.isActive !== false) : [];
        setAllProducts(enabledProducts);
        
        // Generate random product recommendations (2-4 products)
        const shuffled = [...enabledProducts].sort(() => 0.5 - Math.random());
        setRecommendedProducts(shuffled.slice(0, Math.min(3, shuffled.length)));
      }
    } catch {}
  }, []);

  // Listen for time slot updates
  useEffect(() => {
    const handleSlotsUpdate = () => {
      setSlotsRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('timeslots-updated', handleSlotsUpdate);
    return () => window.removeEventListener('timeslots-updated', handleSlotsUpdate);
  }, []);

  // Load booking form field configuration
  useEffect(() => {
    // Helper to load organization defaults
    const loadOrgDefaults = () => {
      try {
        const raw = localStorage.getItem('zervos_login_prefs');
        if (raw) {
          const prefs = JSON.parse(raw);
          let fields: LoginField[] = Array.isArray(prefs.loginFields) ? prefs.loginFields : [];
          // Ensure email is never required
          fields = fields.map(f => f.type === 'email' ? { ...f, required: false, name: f.name.includes('Optional') ? f.name : `${f.name} (Optional)` } : f);
          setLoginFields(fields);
          const init: Record<string, string> = {};
          fields.forEach((f) => { init[f.id] = ''; });
          setFormData((prev) => ({ ...init, ...prev }));
          return;
        }
      } catch {}
      // Default fields when none configured or on error - Email is now optional
      const defaults: LoginField[] = [
        { id: 'full_name', name: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { id: 'email', name: 'Email Address (Optional)', type: 'email', required: false, placeholder: 'your@email.com' },
        { id: 'phone', name: 'Contact Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'notes', name: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Anything we should know?' },
      ];
      setLoginFields(defaults);
      const init: Record<string, string> = {};
      defaults.forEach((f) => { init[f.id] = ''; });
      setFormData((prev) => ({ ...init, ...prev }));
    };

    // Prefer per-call custom fields when explicitly set
    if (callData && callData.useOrgFormFields === false && Array.isArray(callData.customFormFields) && callData.customFormFields.length > 0) {
      let fields: LoginField[] = callData.customFormFields;
      // Ensure email is never required
      fields = fields.map(f => f.type === 'email' ? { ...f, required: false, name: f.name.includes('Optional') ? f.name : `${f.name} (Optional)` } : f);
      setLoginFields(fields);
      const init: Record<string, string> = {};
      fields.forEach((f) => { init[f.id] = ''; });
      setFormData((prev) => ({ ...init, ...prev }));
    } else {
      loadOrgDefaults();
    }
  }, [callData]);

  // Decide whether managed time slots should override business hours
  useEffect(() => {
    const determineTimeSlotMode = () => {
      try {
        // Per-call preference takes highest priority
        const callPref = callData?.useManagedTimeSlots === true
          || callData?.timeSlotStrategy === 'managed'
          || callData?.schedulingMode === 'time-slots';

        if (callPref) {
          setUseManagedTimeSlots(true);
          return;
        }

        // Organization-wide toggle stored in localStorage (set from Admin > Time Slots)
        const settingsRaw = localStorage.getItem('zervos_timeslot_settings');
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw);
          if (settings?.applyToPublicBooking === true || settings?.enabled === true) {
            setUseManagedTimeSlots(true);
            return;
          }
        }

        // Legacy toggle key
        const legacyToggle = localStorage.getItem('zervos_timeslots_enabled');
        if (legacyToggle === 'true') {
          setUseManagedTimeSlots(true);
          return;
        }
      } catch (err) {
        console.warn('Failed to determine time slot mode:', err);
      }

      setUseManagedTimeSlots(false);
    };

    determineTimeSlotMode();
  }, [callData]);

  // Load organization business hours
  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_business_hours');
      console.log('📋 Loading business hours from localStorage:', raw);
      if (raw) {
        const data = JSON.parse(raw);
        console.log('📋 Parsed business hours data:', data);
        const scheduleArr = Array.isArray(data?.schedule) ? data.schedule : [];
        const map: Record<string, { enabled: boolean; start: string; end: string }> = {};
        const byDay: Record<string, any> = {};
        scheduleArr.forEach((d: any) => { byDay[d.day] = d; });
        WEEK_DAYS.forEach(day => {
          const entry = byDay[day];
          if (entry) {
            map[day] = { enabled: !!entry.enabled, start: entry.startTime || '09:00', end: entry.endTime || '17:00' };
          }
        });
        console.log('📋 Processed organization schedule:', map);
        const breaksData = data?.breaks && typeof data.breaks === 'object' ? data.breaks : {};
        const breakMap = normalizeBreakMap(breaksData);
        setOrgSchedule(map);
        setOrgBreaks(breakMap);
        setSpecialHours(Array.isArray(data?.specialHours) ? data.specialHours : []);
        setUnavailability(Array.isArray(data?.unavailability) ? data.unavailability : []);
      } else {
        console.log('⚠️ No business hours found in localStorage');
      }
    } catch (err) {
      console.error('❌ Error loading business hours:', err);
    }
  }, []);

  // Load booking page settings (branding/SEO)
  useEffect(() => {
    try {
      // Try workspace-scoped key first
      let raw = localStorage.getItem(`zervos_booking_page::${workspaceId}`);
      
      // Fallback to global key
      if (!raw) {
        raw = localStorage.getItem('zervos_booking_page');
      }
      
      // Try to find any booking page settings
      if (!raw) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('zervos_booking_page')) {
            raw = localStorage.getItem(key);
            if (raw) break;
          }
        }
      }
      
      if (raw) {
        const s: BookingPageSettings = JSON.parse(raw);
        setBookingSettings(s);
        if (s.metaTitle) document.title = s.metaTitle;
        if (s.metaDescription) {
          let tag = document.querySelector('meta[name="description"]');
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('name', 'description');
            document.head.appendChild(tag);
          }
          tag.setAttribute('content', s.metaDescription);
        }
      } else {
        // Try multiple sources for organization/business data
        let org: any = null;
        
        // 1. Try workspace-scoped organization
        const orgWorkspaceRaw = localStorage.getItem(`zervos_organization::${workspaceId}`);
        if (orgWorkspaceRaw) {
          org = JSON.parse(orgWorkspaceRaw);
        }
        
        // 2. Try global organization
        if (!org) {
          const orgRaw = localStorage.getItem('zervos_organization');
          if (orgRaw) org = JSON.parse(orgRaw);
        }
        
        // 3. Try zervos_company (onboarding data)
        if (!org || !org.businessName) {
          const companyRaw = localStorage.getItem('zervos_company');
          if (companyRaw) {
            const company = JSON.parse(companyRaw);
            org = { ...org, ...company };
          }
        }
        
        // 4. Try business profile (onboarding data)
        if (!org || !org.businessName) {
          const businessRaw = localStorage.getItem(`zervos_business_profile::${workspaceId}`) || 
                             localStorage.getItem('zervos_business_profile');
          if (businessRaw) {
            const business = JSON.parse(businessRaw);
            org = { ...org, ...business };
          }
        }
        
        // 5. Try onboarding data
        if (!org || !org.businessName) {
          const onboardingRaw = localStorage.getItem(`zervos_onboarding::${workspaceId}`) ||
                               localStorage.getItem('zervos_onboarding') ||
                               localStorage.getItem('zervos_onboarding_data');
          if (onboardingRaw) {
            const onboarding = JSON.parse(onboardingRaw);
            const details = onboarding.businessDetails || onboarding.business || onboarding;
            org = { ...org, ...details };
          }
        }
        
        // 6. Try booking page settings 
        if (!org || !org.businessName) {
          const bookingRaw = localStorage.getItem('zervos_booking_settings');
          if (bookingRaw) {
            const booking = JSON.parse(bookingRaw);
            org = { ...org, ...booking };
          }
        }
        
        // 7. Scan for any business-related keys
        if (!org || !org.businessName) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('business') || key.includes('company') || key.includes('organization') || key.includes('onboarding'))) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.businessName || data.name || data.companyName) {
                  org = { ...org, ...data };
                  break;
                }
              } catch {}
            }
          }
        }
        
        // Debug logging
        console.log('📋 Loaded business data:', org);
        
        if (org) {
          const businessName = org.businessName || org.name || org.companyName || 'Business';
          setBookingSettings({
            businessName: businessName,
            bookingUrl: `${businessName.toLowerCase().replace(/\s+/g, '')}.zervos.com`,
            welcomeMessage: org.tagline || org.description || `Welcome to ${businessName}! Book your appointment with us.`,
            backgroundColor: org.brandColor || org.primaryColor || '#7C3AED',
            textColor: '#FFFFFF',
            buttonColor: '#FFFFFF',
            showLogo: true,
            metaTitle: `Book Appointment | ${businessName}`,
            metaDescription: `Schedule your appointment at ${businessName}`,
            metaKeywords: 'booking, appointment',
            socialImage: org.logo || '',
            logo: org.logo || org.logoUrl || '',
            tagline: org.tagline || org.description || '',
            phone: org.phone || org.contactPhone || org.phoneNumber || '',
            email: org.email || org.contactEmail || '',
            website: org.website || org.websiteUrl || '',
            address: org.address || org.location || '',
            workingHours: org.workingHours || org.hours || 'Mon-Sat: 9AM - 7PM',
            rating: org.rating || 4.9,
            reviewCount: org.reviewCount || 500,
            establishedYear: org.establishedYear || org.foundedYear || '',
            socialLinks: org.socialLinks || {}
          });
        }
      }
    } catch {}
  }, [workspaceId]);

  useEffect(() => {
    if (!callData) {
      setCallBreaks(normalizeBreakMap(undefined));
      return;
    }
    setCallBreaks(normalizeBreakMap((callData as any)?.breaks));
  }, [callData]);

  // Load service data dynamically from localStorage (workspace-aware)
  useEffect(() => {
    try {
      if (!serviceId) {
        // No serviceId - show demo service
        setService({
          id: 'demo-service',
          name: 'Hair Styling & Treatment',
          description: 'Professional hair styling session with our expert stylists. Includes wash, cut, and styling.',
          duration: '45 mins',
          durationMinutes: 45,
          locationType: 'in-person',
          hostName: 'Sarah Johnson',
          color: 'from-purple-500 to-pink-500'
        });
        setCallData({
          price: 'paid',
          priceAmount: '75',
          currency: 'INR'
        });
        return;
      }

      // Helper: get all localStorage keys that match prefix
      const getKeysByPrefix = (prefix: string) => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) keys.push(k);
        }
        return keys;
      };

      // 1) First check if it's a service from the Services page
      const serviceKeys = [
        ...getKeysByPrefix('zervos_services_'),
      ];

      let foundService: any | null = null;
      for (const key of serviceKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const svc = arr.find((s: any) => s?.id === serviceId && s?.isEnabled);
            if (svc) {
              foundService = svc;
              break;
            }
          }
        } catch {}
      }

      // If found a service from Services page, use it
      if (foundService) {
        // Parse duration to extract minutes
        const durationMatch = foundService.duration.match(/(\d+)/);
        const durationMinutes = durationMatch ? parseInt(durationMatch[0]) : 30;
        
        setService({
          id: foundService.id,
          name: foundService.name,
          description: foundService.description || 'Book your appointment for this service',
          duration: foundService.duration,
          durationMinutes: durationMinutes,
          locationType: 'in-person',
          hostName: 'Service Provider',
          color: 'from-purple-500 to-pink-500'
        });
        // Store service data with price and currency for booking confirmation
        setCallData({
          ...foundService,
          price: foundService.price,
          currency: foundService.currency
        });
        return;
      }

      // 2) Otherwise, find the sales call by id across all workspace-scoped keys
      const callKeys = [
        ...getKeysByPrefix('zervos_sales_calls::'),
        'zervos_sales_calls'
      ];

      let salesCall: any | null = null;
      let workspaceIdForCall: string | null = null;
      for (const key of callKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const found = arr.find((c: any) => c?.id === serviceId);
            if (found) {
              salesCall = found;
              workspaceIdForCall = key.includes('::') ? key.split('::')[1] : null;
              break;
            }
          }
        } catch {}
      }

      if (!salesCall) {
        // Fallback default if not found
        setService({
          id: serviceId,
          name: 'Premium Salon Service',
          description: 'Book your appointment for our premium salon services. Professional care and expert styling.',
          duration: '30 mins',
          durationMinutes: 30,
          locationType: 'in-person',
          hostName: 'Expert Stylist',
          color: 'from-purple-500 to-pink-500'
        });
        setCallData({
          price: 'paid',
          priceAmount: '50',
          currency: 'INR'
        });
        return;
      }

      // 2) Resolve host name from assignedSalespersons via workspace/global member lists
      const primaryAssigneeId = Array.isArray(salesCall.assignedSalespersons) && salesCall.assignedSalespersons.length > 0
        ? salesCall.assignedSalespersons[0]
        : null;

      const resolveMemberName = (id: string | null): string => {
        if (!id) return 'Team Member';
        const candidateKeys: string[] = [];
        if (workspaceIdForCall) {
          candidateKeys.push(`zervos_team_members::${workspaceIdForCall}`);
          candidateKeys.push(`zervos_salespersons::${workspaceIdForCall}`);
        }
        // Add globals
        candidateKeys.push('zervos_team_members');
        candidateKeys.push('zervos_salespersons');
        // As a last resort, scan all potential team member keys across all workspaces
        const allMemberKeys = [
          ...getKeysByPrefix('zervos_team_members::'),
          ...getKeysByPrefix('zervos_salespersons::')
        ];
        for (const k of allMemberKeys) if (!candidateKeys.includes(k)) candidateKeys.push(k);

        for (const key of candidateKeys) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const m = arr.find((x: any) => x?.id === id || x?.email === id);
              if (m) return m.name || m.email || 'Team Member';
            }
          } catch {}
        }
        return 'Team Member';
      };

  const hostName = resolveMemberName(primaryAssigneeId);

      // 3) Map meeting mode to location type
      let locationType: 'in-person' | 'phone' | 'video' | 'custom' = 'video';
      if (salesCall.meetingMode === 'phone') locationType = 'phone';
      else if (salesCall.meetingMode === 'in-person') locationType = 'in-person';
      else if (salesCall.meetingMode === 'custom') locationType = 'custom';
      else if (salesCall.meetingMode === 'video') locationType = 'video';

      // 4) Format duration and compute minutes
      const hours = parseInt(salesCall.duration?.hours || '0');
      const minutes = parseInt(salesCall.duration?.minutes || '30');
      const totalMinutes = (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
      let durationText = '';
      if ((hours || 0) > 0) durationText += `${hours} hour${hours > 1 ? 's' : ''}`;
      if ((minutes || 0) > 0) durationText += `${hours > 0 ? ' ' : ''}${minutes} mins`;
      if (!durationText) durationText = '30 mins';

      // 5) Set service and expose raw call data
      setService({
        id: salesCall.id,
        name: salesCall.name,
        description: salesCall.description || 'Book your appointment for this service',
        duration: durationText,
        durationMinutes: totalMinutes || 30,
        locationType,
        hostName,
        color: 'from-purple-500 to-pink-500'
      });
      setCallData(salesCall);

      // 5b) Resolve primary assignee weekly schedule from Admin Salespersons
        const resolveMemberSchedule = (id: string | null) => {
        if (!id) return null;
        try {
          const raw = localStorage.getItem('zervos_salespersons');
          if (!raw) return null;
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) return null;
          const person = arr.find((p: any) => p?.id === id || p?.email === id);
          const schedule: AvailabilitySchedule[] | undefined = person?.availabilitySchedule;
          if (!schedule || !Array.isArray(schedule)) return null;
          const map: Record<string, { enabled: boolean; start: string; end: string }> = {};
          for (const d of schedule) {
            map[d.day] = { enabled: !!d.enabled, start: d.startTime || '09:00', end: d.endTime || '17:00' };
          }
          return map;
        } catch { return null; }
      };
  setMemberSchedule(resolveMemberSchedule(primaryAssigneeId));
  setAssignedMemberId(primaryAssigneeId);
    } catch (error) {
      // Fallback to default on error
      setService({
        id: serviceId || '1',
        name: 'Lead Qualification Session',
        description: 'Initial consultation to understand your needs and see how we can help',
        duration: '30 mins',
        durationMinutes: 30,
        locationType: 'video',
        hostName: 'Bharath Reddy',
        color: 'from-purple-500 to-pink-500'
      });
      setCallData(null);
    }
  }, [serviceId]);

  // Refresh member schedule if admin data changes in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'zervos_salespersons' && callData && Array.isArray(callData.assignedSalespersons) && callData.assignedSalespersons[0]) {
        try {
          const raw = localStorage.getItem('zervos_salespersons');
          if (!raw) return;
          const arr = JSON.parse(raw);
          const person = Array.isArray(arr) ? arr.find((p: any) => p?.id === callData.assignedSalespersons[0] || p?.email === callData.assignedSalespersons[0]) : null;
          const schedule: AvailabilitySchedule[] | undefined = person?.availabilitySchedule;
          if (schedule && Array.isArray(schedule)) {
            const map: Record<string, { enabled: boolean; start: string; end: string }> = {};
            for (const d of schedule) {
              map[d.day] = { enabled: !!d.enabled, start: d.startTime || '09:00', end: d.endTime || '17:00' };
            }
            setMemberSchedule(map);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [callData]);

  // Generate calendar days for current month
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  // Load branches from localStorage
  useEffect(() => {
    try {
      const branchesKey = `zervos_branches::${workspaceId}`;
      const raw = localStorage.getItem(branchesKey);
      if (raw) {
        const parsedBranches = JSON.parse(raw);
        if (Array.isArray(parsedBranches) && parsedBranches.length > 0) {
          setBranches(parsedBranches);
          // Auto-select first branch
          setSelectedBranch(parsedBranches[0].id);
        }
      } else {
        // Fallback demo branches
        const demoBranches: Branch[] = [
          { id: 'main', name: 'Main Branch', address: '123 Main St, Downtown', city: 'Downtown', phone: '+1234567890', isActive: true },
          { id: 'west', name: 'West Side', address: '456 West Ave, Westside', city: 'Westside', phone: '+1234567891', isActive: true },
          { id: 'mall', name: 'City Mall', address: 'Shop 12, City Mall', city: 'Central', phone: '+1234567892', isActive: true },
        ];
        setBranches(demoBranches);
        setSelectedBranch(demoBranches[0].id);
      }
    } catch {}
  }, [workspaceId]);

  // Generate random recommendations for services and products
  useEffect(() => {
    try {
      // Load services
      const servicesKey = `zervos_services_${workspaceId}`;
      const servicesRaw = localStorage.getItem(servicesKey);
      if (servicesRaw) {
        const allServices = JSON.parse(servicesRaw);
        if (Array.isArray(allServices)) {
          const enabled = allServices.filter((s: any) => s.isEnabled && s.id !== serviceId);
          // Shuffle and pick top 4
          const shuffled = enabled.sort(() => Math.random() - 0.5);
          setRecommendedServices(shuffled.slice(0, 4));
        }
      } else {
        // Demo recommendations
        setRecommendedServices([
          { id: 'demo1', name: 'Premium Hair Styling', duration: '45 mins', price: 'paid', priceAmount: '80', category: 'Hair' },
          { id: 'demo2', name: 'Spa Massage', duration: '60 mins', price: 'paid', priceAmount: '120', category: 'Spa' },
          { id: 'demo3', name: 'Manicure & Pedicure', duration: '30 mins', price: 'paid', priceAmount: '50', category: 'Nails' },
        ]);
      }

      // Load products
      const productsKey = `zervos_products_${workspaceId}`;
      const productsRaw = localStorage.getItem(productsKey);
      if (productsRaw) {
        const allProducts = JSON.parse(productsRaw);
        if (Array.isArray(allProducts)) {
          const shuffled = allProducts.sort(() => Math.random() - 0.5);
          setRecommendedProducts(shuffled.slice(0, 4));
        }
      } else {
        // Demo products
        setRecommendedProducts([
          { id: 'prod1', name: 'Hair Serum', price: 25, image: '💆' },
          { id: 'prod2', name: 'Nail Polish Set', price: 15, image: '💅' },
          { id: 'prod3', name: 'Face Mask Pack', price: 30, image: '🧖' },
        ]);
      }
    } catch {}
  }, [workspaceId, serviceId]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 35; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const slotDurationMinutes = useMemo(() => {
    if (callData?.duration) {
      const hours = parseInt(callData.duration.hours || '0', 10) || 0;
      const minutes = parseInt(callData.duration.minutes || '0', 10) || 0;
      const total = hours * 60 + minutes;
      if (total > 0) return total;
    }
    if (service?.durationMinutes) return service.durationMinutes;
    return 60;
  }, [callData, service]);

  const getBreaksForDay = useCallback((dayName: string) => {
    const callDayBreaks = callBreaks?.[dayName];
    if (callDayBreaks && callDayBreaks.length > 0) return callDayBreaks;
    return orgBreaks[dayName] || [];
  }, [callBreaks, orgBreaks]);

  // Dynamic time slots from Time Slot Management
  const timeSlots: TimeSlot[] = useMemo(() => {
    if (!selectedDate) return [];

    try {
      const slots = useManagedTimeSlots ? localStorage.getItem('zervos_timeslots') : null;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDayName = dayNames[selectedDate.getDay()];

      const breaksForDay = getBreaksForDay(selectedDayName);

      const overlapsBreak = (slotStartMinutes: number, durationMinutes: number, breaks: Array<{ startTime: string; endTime: string }>) => {
        const slotEndMinutes = slotStartMinutes + durationMinutes;
        return breaks.some(breakWindow => {
          const breakStart = convertHHMMToMinutes(breakWindow?.startTime);
          const breakEnd = convertHHMMToMinutes(breakWindow?.endTime);
          if (breakStart === null || breakEnd === null) return false;
          return slotStartMinutes < breakEnd && slotEndMinutes > breakStart;
        });
      };

      // Convert 24h time to 12h format
      const formatTime = (time24: string) => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      // Generate time slots from a time range using meeting duration as interval
      const generateSlotsFromRange = (startTime: string, endTime: string, intervalMinutes: number, breaks: Array<{ startTime: string; endTime: string }> = []) => {
        const slots: TimeSlot[] = [];
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        // Convert times to minutes for easier calculation
        const startTotalMinutes = startHour * 60 + startMin;
        const endTotalMinutes = endHour * 60 + endMin;
        
        if (intervalMinutes <= 0) return slots;

        // Only supply start times whose meeting end is still within the available window
        for (let currentMinutes = startTotalMinutes; currentMinutes + intervalMinutes <= endTotalMinutes; currentMinutes += intervalMinutes) {
          const currentHour = Math.floor(currentMinutes / 60);
          const currentMin = currentMinutes % 60;

          const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
          if (!overlapsBreak(currentMinutes, intervalMinutes, breaks)) {
            slots.push({ time: formatTime(time24), available: true });
          } else {
            console.log(`⛔ Skipping slot ${time24} due to break window`, breaks);
          }
        }
        
        return slots;
      };

      // If time slots are configured in Time Slot Management, use those
      if (slots) {
        const parsedSlots = JSON.parse(slots);
        const daySlots = parsedSlots.filter((slot: any) => 
          slot.dayOfWeek === selectedDayName && slot.isActive
        );

        if (daySlots.length > 0) {
          const filteredSlots = daySlots.filter((slot: any) => {
            if (breaksForDay.length === 0) return true;
            const startMinutes = convertHHMMToMinutes(slot?.startTime ?? '');
            const endMinutes = convertHHMMToMinutes(slot?.endTime ?? '');
            if (startMinutes === null) return true;
            const duration = endMinutes !== null && endMinutes > startMinutes
              ? endMinutes - startMinutes
              : slotDurationMinutes;
            return !overlapsBreak(startMinutes, duration, breaksForDay);
          });

          return filteredSlots.map((slot: any) => ({
            time: formatTime(slot.startTime),
            available: slot.currentBookings < slot.maxBookings,
          })).sort((a: TimeSlot, b: TimeSlot) => {
            return a.time.localeCompare(b.time);
          });
        }
      }

      // Fallback: Generate slots from organization business hours
      console.log('📅 Generating time slots for', selectedDayName);
      console.log('🔍 All available schedules:', { 
        memberSchedule: memberSchedule, 
        callDataAvailability: callData?.availability,
        orgSchedule: orgSchedule,
        selectedDay: {
          member: memberSchedule?.[selectedDayName], 
          call: callData?.availability?.[selectedDayName],
          org: orgSchedule[selectedDayName]
        }
      });
      
      // Priority 1: Check member schedule first (highest priority for assigned salesperson)
      if (memberSchedule && memberSchedule[selectedDayName]) {
        const daySchedule = memberSchedule[selectedDayName];
        console.log('🔍 Checking member schedule for', selectedDayName, ':', daySchedule);
        if (daySchedule.enabled && daySchedule.start && daySchedule.end) {
          console.log('✅ Using member schedule:', daySchedule.start, 'to', daySchedule.end);
          const generatedSlots = generateSlotsFromRange(daySchedule.start, daySchedule.end, slotDurationMinutes, breaksForDay);
          console.log('📋 Generated', generatedSlots.length, 'slots:', generatedSlots.map(s => s.time).join(', '));
          return generatedSlots;
        } else {
          console.log('❌ Member schedule exists but day is disabled or incomplete:', daySchedule);
        }
      } else {
        console.log('ℹ️ No member schedule for', selectedDayName);
      }

      // Priority 2: Check call-specific availability
      if (callData?.availability && callData.availability[selectedDayName]) {
        const daySchedule = callData.availability[selectedDayName];
        console.log('🔍 Checking call availability for', selectedDayName, ':', daySchedule);
        if (daySchedule.enabled && daySchedule.start && daySchedule.end) {
          console.log('✅ Using call-specific availability:', daySchedule.start, 'to', daySchedule.end);
          const generatedSlots = generateSlotsFromRange(daySchedule.start, daySchedule.end, slotDurationMinutes, breaksForDay);
          console.log('📋 Generated', generatedSlots.length, 'slots:', generatedSlots.map(s => s.time).join(', '));
          return generatedSlots;
        } else {
          console.log('❌ Call availability exists but day is disabled or incomplete:', daySchedule);
        }
      } else {
        console.log('ℹ️ No call-specific availability for', selectedDayName);
      }

      // Priority 3: Fallback to organization schedule
      console.log('🔍 Checking organization schedule for', selectedDayName);
      console.log('🔍 orgSchedule object:', orgSchedule);
      console.log('🔍 orgSchedule keys:', Object.keys(orgSchedule));
      
      if (Object.keys(orgSchedule).length > 0 && orgSchedule[selectedDayName]) {
        const daySchedule = orgSchedule[selectedDayName];
        console.log('🔍 Found org schedule for', selectedDayName, ':', daySchedule);
        if (daySchedule.enabled && daySchedule.start && daySchedule.end) {
          console.log('✅ Using organization schedule:', daySchedule.start, 'to', daySchedule.end);
          const generatedSlots = generateSlotsFromRange(daySchedule.start, daySchedule.end, slotDurationMinutes, breaksForDay);
          console.log('📋 Generated', generatedSlots.length, 'slots:', generatedSlots.map(s => s.time).join(', '));
          return generatedSlots;
        } else {
          console.log('❌ Organization schedule exists but day is disabled or incomplete:', daySchedule);
          return []; // Return empty if org schedule has this day but it's disabled
        }
      } else {
        console.log('⚠️ No organization schedule found for', selectedDayName);
      }

    console.log('⚠️ No schedule found for', selectedDayName, '- using default 9 AM to 5 PM slots');
    // Final fallback if no schedule is configured
    const defaultSlots = generateSlotsFromRange('09:00', '17:00', slotDurationMinutes, breaksForDay);
      console.log('📋 Generated default slots:', defaultSlots.map(s => s.time).join(', '));
      return defaultSlots;

    } catch (error) {
      console.error('Error loading time slots:', error);
      // Error fallback
      return [
        { time: '09:00 AM', available: true },
        { time: '10:00 AM', available: true },
        { time: '11:00 AM', available: true },
        { time: '01:00 PM', available: true },
        { time: '02:00 PM', available: true },
        { time: '03:00 PM', available: true },
        { time: '04:00 PM', available: true },
      ];
    }
  }, [selectedDate, slotsRefreshKey, memberSchedule, callData, orgSchedule, useManagedTimeSlots, service, slotDurationMinutes, getBreaksForDay]);

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Not in the past
    if (date < today) return false;

    // Enforce booking window if set
    const bookingWindowDays = callData?.limits?.bookingWindowDays;
    if (typeof bookingWindowDays === 'number' && bookingWindowDays > 0) {
      const lastDate = new Date(today);
      lastDate.setDate(lastDate.getDate() + bookingWindowDays);
      if (date > lastDate) return false;
    }

    // Unavailability overrides (org-wide)
    for (const u of unavailability) {
      if (!u.startDate || !u.endDate) continue;
      const start = new Date(u.startDate); start.setHours(0,0,0,0);
      const end = new Date(u.endDate); end.setHours(23,59,59,999);
      if (date >= start && date <= end) return false;
    }

    const dayName = dayNames[date.getDay()];

    // Member schedule must allow the day if present
    if (memberSchedule) {
      const m = memberSchedule[dayName];
      if (!m || m.enabled === false) {
        console.log(`🚫 Date ${date.toDateString()} (${dayName}) blocked by member schedule:`, m);
        return false;
      }
    }

    // Per-call availability (if present) must also allow the day
    if (callData?.availability) {
      const cfg = callData.availability[dayName];
      if (!cfg || cfg.enabled === false) {
        console.log(`🚫 Date ${date.toDateString()} (${dayName}) blocked by call availability:`, cfg);
        return false;
      }
      return true;
    }

    // Fallback to organization schedule (if set)
    const org = orgSchedule[dayName];
    if (org) {
      const isEnabled = !!org.enabled;
      if (!isEnabled) {
        console.log(`🚫 Date ${date.toDateString()} (${dayName}) blocked by org schedule:`, org);
      }
      return isEnabled;
    }

    // Default allow if no specific restrictions
    console.log(`✅ Date ${date.toDateString()} (${dayName}) allowed by default (no schedule configured)`);
    return true;
  };

  // Helper to format date to YYYY-MM-DD without timezone issues
  const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseTimeToDate = (date: Date, time12: string) => {
    // time like '09:30 AM'
    const [timePart, meridian] = time12.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const isSlotWithinAvailability = (date: Date, slot: string) => {
    const dayName = dayNames[date.getDay()];
    const slotDate = parseTimeToDate(date, slot);
    const within = (startHHMM?: string, endHHMM?: string, enabled?: boolean) => {
      if (enabled === false) return false;
      if (!startHHMM || !endHHMM) return true;
      const [sH, sM] = startHHMM.split(':').map((n: string) => parseInt(n, 10));
      const [eH, eM] = endHHMM.split(':').map((n: string) => parseInt(n, 10));
      const start = new Date(date); start.setHours(sH || 0, sM || 0, 0, 0);
      const end = new Date(date); end.setHours(eH || 0, eM || 0, 0, 0);
      return slotDate >= start && slotDate <= end;
    };

    // Special hours intersect: if exists for this date, the slot must be within special hours
    // Use local date format to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateISO = `${year}-${month}-${day}`;
    const special = specialHours.find(sh => sh.date === dateISO);
    const allowedBySpecial = special ? within(special.startTime, special.endTime, true) : true;

    // Call-specific window
    let allowedByCall = true;
    if (callData?.availability) {
      const cfg = callData.availability[dayName];
      if (!cfg || cfg.enabled === false) {
        console.log(`🚫 Slot ${slot} on ${dayName} blocked by call availability`, cfg);
        return false; // if call disables day, slot is not allowed
      }
      allowedByCall = within(cfg.start, cfg.end, cfg.enabled !== false);
    }

    // Org schedule (only used when call availability is absent)
    let allowedByOrg = true;
    if (!callData?.availability) {
      const org = orgSchedule[dayName];
      if (!org || org.enabled === false) {
        console.log(`🚫 Slot ${slot} on ${dayName} blocked by org schedule`, org);
        return false;
      }
      allowedByOrg = within(org.start, org.end, org.enabled);
    }

    // Member schedule must also allow
    let allowedByMember = true;
    if (memberSchedule) {
      const m = memberSchedule[dayName];
      if (!m || m.enabled === false) {
        console.log(`🚫 Slot ${slot} on ${dayName} blocked by member schedule`, m);
        return false;
      }
      allowedByMember = within(m.start, m.end, m.enabled);
    }

    if (slotDurationMinutes > 0) {
      const breaksForDay = getBreaksForDay(dayName);
      if (breaksForDay.length > 0) {
        const slotStartMinutes = slotDate.getHours() * 60 + slotDate.getMinutes();
        const slotEndMinutes = slotStartMinutes + slotDurationMinutes;
        const conflicts = breaksForDay.some(window => {
          const start = convertHHMMToMinutes(window?.startTime);
          const end = convertHHMMToMinutes(window?.endTime);
          if (start === null || end === null) return false;
          return slotStartMinutes < end && slotEndMinutes > start;
        });
        if (conflicts) {
          console.log(`🚫 Slot ${slot} on ${dayName} blocked by break window`, breaksForDay);
          return false;
        }
      }
    }

    const result = allowedBySpecial && allowedByCall && allowedByOrg && allowedByMember;
    if (!result) {
      console.log(`🚫 Slot ${slot} on ${dayName} (${dateISO}) blocked - special: ${allowedBySpecial}, call: ${allowedByCall}, org: ${allowedByOrg}, member: ${allowedByMember}`);
    }
    return result;
  };

  const passesMinNotice = (date: Date, slot: string) => {
    const minNoticeHours = callData?.limits?.minNoticeHours || 0;
    if (!minNoticeHours) return true;
    const now = new Date();
    const minDateTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
    const slotDate = parseTimeToDate(date, slot);
    return slotDate >= minDateTime;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDateSelect = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinue = async () => {
    if (step === 1 && selectedDate && selectedTime) {
      setStep(2);
    } else if (step === 2) {
      // Validate required dynamic fields
      const allValid = loginFields.every((f) => !f.required || (formData[f.id] && formData[f.id].trim().length > 0));
      if (!allValid) return;

      // Check if this is a paid service
      const isPaidService = callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0;
      
      if (isPaidService) {
        // Go to payment step
        setStep(3);
        return;
      }

      // For free services, proceed directly

      // Persist appointment to backend
      const emailField = loginFields.find(f => f.type === 'email');
      const nameField = loginFields.find(f => f.name.toLowerCase().includes('name'));
      const phoneField = loginFields.find(f => f.type === 'tel');

      const payload = {
        customerName: (nameField && formData[nameField.id]) || formData['full_name'] || 'Customer',
        email: (emailField && formData[emailField.id]) || '',
        phone: (phoneField && formData[phoneField.id]) || formData['phone'] || '',
        serviceName: service?.name || 'Service',
        serviceId: callData?.id || serviceId || '',
        assignedMemberId: assignedMemberId || '',
        assignedMemberName: service?.hostName || '',
        date: selectedDate ? formatDateISO(selectedDate) : '',
        time: selectedTime || '',
        status: 'upcoming' as const,
        notes: (() => {
          // Concatenate non-standard fields as notes
          const exclude = new Set([emailField?.id, nameField?.id, phoneField?.id, 'full_name', 'email', 'phone'].filter(Boolean) as string[]);
          const parts = Object.entries(formData)
            .filter(([k, v]) => !exclude.has(k) && (v ?? '').toString().trim().length > 0)
            .map(([k, v]) => `${k}: ${v}`);
          return parts.join('\n');
        })(),
      };

      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => { /* ignore for now */ });

      persistAppointmentLocally({
        ...payload,
        assignedMemberId: assignedMemberId || '',
      });

      // Generate invoice if this is a paid booking
      if (callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0) {
        const { createInvoice } = await import('@/lib/invoice-utils');
        const companySettings = JSON.parse(localStorage.getItem('zervos_company') || '{}');
        const orgSettings = JSON.parse(localStorage.getItem('zervos_organization_settings') || '{}');
        
        const invoice = createInvoice({
          bookingId: payload.serviceId + '-' + Date.now(),
          customer: {
            name: payload.customerName,
            email: payload.email,
            phone: payload.phone,
          },
          service: {
            name: payload.serviceName,
            duration: callData.duration ? `${callData.duration.hours}h ${callData.duration.minutes}m` : service?.duration || '30 mins',
            price: parseFloat(callData.priceAmount),
          },
          amount: parseFloat(callData.priceAmount),
          paymentMethod: 'Online Payment',
          currency: '₹',
          status: 'Paid',
          company: {
            name: companySettings.name || orgSettings.organizationName || 'Zervos',
            email: companySettings.email || orgSettings.email || '',
            logo: orgSettings.logo || '',
            brandColor: orgSettings.brandColor || '#6366f1',
          },
          bookingDate: payload.date,
          bookingTime: payload.time,
          subtotal: parseFloat(callData.priceAmount),
          notes: 'Thank you for your booking!',
        });

        // Show toast notification
        setTimeout(() => {
          const toastEvent = new CustomEvent('show-toast', {
            detail: {
              title: 'Invoice Generated',
              description: `Invoice ${invoice.invoiceId} created successfully`,
            }
          });
          window.dispatchEvent(toastEvent);
        }, 1000);
      }

      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleAddToGoogleCalendar = () => {
    if (!selectedDate || !selectedTime || !service) return;
    
    const { start, end} = createEventDate(
      formatDateISO(selectedDate),
      selectedTime,
      service?.durationMinutes || 30 // Use actual duration
    );

    const event: CalendarEvent = {
      title: service.name,
      description: `Meeting with ${service.hostName}`,
      location: getLocationText(),
      startTime: start,
      endTime: end,
      url: window.location.href
    };

    window.open(generateGoogleCalendarUrl(event), '_blank');
  };

  const handleAddToOutlook = () => {
    if (!selectedDate || !selectedTime || !service) return;
    
    const { start, end } = createEventDate(
      formatDateISO(selectedDate),
      selectedTime,
      service?.durationMinutes || 30
    );

    const event: CalendarEvent = {
      title: service.name,
      description: `Meeting with ${service.hostName}`,
      location: getLocationText(),
      startTime: start,
      endTime: end,
      url: window.location.href
    };

    window.open(generateOutlookCalendarUrl(event), '_blank');
  };

  const handleDownloadICal = () => {
    if (!selectedDate || !selectedTime || !service) return;
    
    const { start, end } = createEventDate(
      formatDateISO(selectedDate),
      selectedTime,
      service?.durationMinutes || 30
    );

    const event: CalendarEvent = {
      title: service.name,
      description: `Meeting with ${service.hostName}`,
      location: getLocationText(),
      startTime: start,
      endTime: end,
      url: window.location.href
    };

    downloadICalFile(event, `${service.name.replace(/\s+/g, '_')}.ics`);
  };

  const getLocationIcon = () => {
    if (!service) return null;
    switch (service.locationType) {
      case 'video': return <Video size={16} className="text-purple-600" />;
      case 'phone': return <Phone size={16} className="text-purple-600" />;
      case 'in-person': return <MapPin size={16} className="text-purple-600" />;
      default: return <Globe size={16} className="text-purple-600" />;
    }
  };

  const getLocationText = () => {
    if (!service) return '';
    switch (service.locationType) {
      case 'video': return 'Video Conference';
      case 'phone': return 'Phone Call';
      case 'in-person': return 'In Person';
      default: return 'Custom Location';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Apply promo code function
  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    
    const promo = promoCodes[code];
    if (!promo) {
      alert('Invalid promo code');
      return;
    }
    
    const subtotal = (selectedServices.reduce((sum, s) => sum + (parseFloat(s.price || s.priceAmount || '0') || 0), 0) +
      selectedProducts.reduce((sum, p) => sum + (parseFloat(p.price || '0') || 0), 0)) * groupSize;
    
    if (promo.minAmount && subtotal < promo.minAmount) {
      alert(`Minimum order of ₹${promo.minAmount} required for this code`);
      return;
    }
    
    setAppliedPromo({ code, discount: promo.discount, type: promo.type });
  };
  
  // Remove promo code
  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  // Calculate total price from selected services and products with group size and discount
  const subtotalPrice = useMemo(() => {
    const servicesTotal = selectedServices.reduce((sum, s) => sum + (parseFloat(s.price || s.priceAmount || '0') || 0), 0);
    const productsTotal = selectedProducts.reduce((sum, p) => sum + (parseFloat(p.price || '0') || 0), 0);
    return (servicesTotal + productsTotal) * groupSize;
  }, [selectedServices, selectedProducts, groupSize]);
  
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'percent') {
      return (subtotalPrice * appliedPromo.discount) / 100;
    }
    return appliedPromo.discount;
  }, [subtotalPrice, appliedPromo]);
  
  const totalPrice = useMemo(() => {
    return Math.max(0, subtotalPrice - discountAmount);
  }, [subtotalPrice, discountAmount]);
  
  // Count available slots for urgency indicator
  const availableSlotsCount = useMemo(() => {
    return timeSlots.filter(s => s.available).length;
  }, [timeSlots]);

  // Join waitlist function
  const joinWaitlist = () => {
    if (!waitlistEmail) {
      alert('Please enter your email');
      return;
    }
    // In production, this would save to backend
    const waitlistData = {
      email: waitlistEmail,
      date: selectedDate?.toISOString(),
      services: selectedServices.map(s => s.id),
      branch: selectedBranch,
      timestamp: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('zervos_waitlist') || '[]');
    localStorage.setItem('zervos_waitlist', JSON.stringify([...existing, waitlistData]));
    setIsOnWaitlist(true);
    setShowWaitlistModal(false);
  };

  // Filter services and products by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return allServices;
    const q = searchQuery.toLowerCase();
    return allServices.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.category?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [allServices, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase();
    return allProducts.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.category?.toLowerCase().includes(q)
    );
  }, [allProducts, searchQuery]);

  // Step labels for progress indicator
  const stepLabels = ['Branch', 'Services', 'Time', 'Details', 'Payment', 'Confirmed'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Enhanced Header with Company Details */}
      <div 
        className="relative overflow-hidden"
        style={bookingSettings ? { backgroundColor: bookingSettings.backgroundColor } : { backgroundColor: '#7C3AED' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2"></div>
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white rounded-full translate-y-1/2"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Top Bar - Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-white/90 text-sm">
            {bookingSettings?.phone && (
              <a href={`tel:${bookingSettings.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone size={14} />
                <span>{bookingSettings.phone}</span>
              </a>
            )}
            {bookingSettings?.email && (
              <a href={`mailto:${bookingSettings.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Mail size={14} />
                <span>{bookingSettings.email}</span>
              </a>
            )}
            {bookingSettings?.website && (
              <a href={bookingSettings.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Globe size={14} />
                <span>{bookingSettings.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>

          {/* Main Company Info */}
          <div className="text-center">
            {/* Logo */}
            {bookingSettings?.logo ? (
              <div className="mb-4 flex justify-center">
                <img 
                  src={bookingSettings.logo} 
                  alt={bookingSettings.businessName} 
                  className="h-16 w-16 rounded-2xl object-cover bg-white p-1 shadow-lg"
                />
              </div>
            ) : (
              <div className="mb-4 flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <Building2 size={32} className="text-white" />
                </div>
              </div>
            )}
            
            {/* Business Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {bookingSettings?.businessName || 'Book Your Appointment'}
            </h1>
            
            {/* Tagline */}
            <p className="text-white/80 text-lg mb-4">
              {bookingSettings?.tagline || bookingSettings?.welcomeMessage || 'Complete your booking in a few easy steps'}
            </p>
            
            {/* Rating & Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold">{bookingSettings?.rating || 4.9}</span>
                <span className="text-white/70 text-sm">({bookingSettings?.reviewCount || 500}+ reviews)</span>
              </div>
              {bookingSettings?.establishedYear && (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                  <Award size={16} className="text-white" />
                  <span className="text-white text-sm">Since {bookingSettings.establishedYear}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                <Shield size={16} className="text-green-400" />
                <span className="text-white text-sm">Verified Business</span>
              </div>
            </div>

            {/* Address & Working Hours */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm">
              {bookingSettings?.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  <span>{bookingSettings.address}</span>
                </div>
              )}
              {bookingSettings?.workingHours && (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{bookingSettings.workingHours}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              const isPaymentStep = stepNum === 5;
              // Skip payment step if no paid items
              if (isPaymentStep && totalPrice === 0 && step !== 5) {
                return null;
              }
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-purple-600 text-white ring-4 ring-purple-100' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={18} /> : stepNum}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block ${isActive ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* STEP 1: Select Branch */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Location</h2>
              <p className="text-gray-600">Choose the branch nearest to you</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {branches.map(branch => (
                <Card 
                  key={branch.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedBranch === branch.id 
                      ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50' 
                      : 'hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedBranch(branch.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedBranch === branch.id ? 'bg-purple-600' : 'bg-purple-100'
                      }`}>
                        <MapPin size={24} className={selectedBranch === branch.id ? 'text-white' : 'text-purple-600'} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{branch.name}</h3>
                        <p className="text-sm text-gray-600">{branch.address}</p>
                        <p className="text-xs text-gray-500 mt-1">{branch.city}</p>
                      </div>
                      {selectedBranch === branch.id && (
                        <CheckCircle2 className="text-purple-600" size={24} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users size={18} className="text-purple-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">10K+</div>
                  <div className="text-xs text-gray-500">Customers</div>
                </div>
                <div className="p-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star size={18} className="text-green-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">4.9★</div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
                <div className="p-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award size={18} className="text-blue-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">8+ Yrs</div>
                  <div className="text-xs text-gray-500">Experience</div>
                </div>
                <div className="p-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Timer size={18} className="text-orange-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">&lt;5min</div>
                  <div className="text-xs text-gray-500">Wait Time</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 px-8"
                onClick={() => setStep(2)}
                disabled={!selectedBranch}
              >
                Continue to Services
                <ArrowLeft size={18} className="ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Services, Products & Attendee */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose Services & Products</h2>
                <p className="text-gray-600">Select what you'd like to book</p>
              </div>
            </div>

            {/* Service Attendee Selection */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Select Service Attendee</h3>
                  <p className="text-sm text-gray-600">Choose who will perform your service</p>
                </div>
              </div>
              <Select value={selectedAttendee || ''} onValueChange={(value) => setSelectedAttendee(value)}>
                <SelectTrigger className="w-full bg-white border-2 border-purple-200 focus:border-purple-500 h-12">
                  <SelectValue placeholder="Select a service provider..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-600" />
                      <span>Any Available</span>
                      <span className="text-xs text-gray-500 ml-2">— First available attendee</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                          {member.name?.charAt(0) || 'T'}
                        </div>
                        <span>{member.name}</span>
                        {member.role && <span className="text-xs text-gray-500 ml-2">— {member.role}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAttendee && selectedAttendee !== 'any' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-purple-700">
                  <CheckCircle2 size={16} />
                  <span>Selected: <strong>{teamMembers.find(m => m.id === selectedAttendee)?.name}</strong></span>
                </div>
              )}
            </div>

            {/* Group Booking */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <UserPlus size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Group Booking</h3>
                    <p className="text-sm text-gray-600">Book for multiple people</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full border-2"
                    onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                    disabled={groupSize <= 1}
                  >
                    <MinusCircle size={20} />
                  </Button>
                  <span className="text-2xl font-bold w-8 text-center">{groupSize}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full border-2"
                    onClick={() => setGroupSize(Math.min(10, groupSize + 1))}
                    disabled={groupSize >= 10}
                  >
                    <PlusCircle size={20} />
                  </Button>
                </div>
              </div>
              {groupSize > 1 && (
                <div className="mt-3 text-sm text-blue-700 bg-blue-100 rounded-lg p-2">
                  <span className="font-medium">Booking for {groupSize} people</span> — All services will be multiplied
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Input 
                type="text"
                placeholder="Search services or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-lg rounded-xl border-2 focus:border-purple-500"
              />
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                className={`px-6 py-3 font-medium transition-all border-b-2 ${
                  activeTab === 'services' 
                    ? 'border-purple-600 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('services')}
              >
                <Sparkles size={16} className="inline mr-2" />
                Services ({filteredServices.length})
              </button>
              <button
                className={`px-6 py-3 font-medium transition-all border-b-2 ${
                  activeTab === 'products' 
                    ? 'border-purple-600 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('products')}
              >
                <ShoppingBag size={16} className="inline mr-2" />
                Products ({filteredProducts.length})
              </button>
            </div>

            {/* Services List */}
            {activeTab === 'services' && (
              <div className="grid gap-3">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No services found</p>
                  </div>
                ) : (
                  filteredServices.map(svc => {
                    const isSelected = selectedServices.some(s => s.id === svc.id);
                    return (
                      <div
                        key={svc.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServices(prev => prev.filter(s => s.id !== svc.id));
                          } else {
                            setSelectedServices(prev => [...prev, svc]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                          }`}>
                            {isSelected ? (
                              <CheckCircle2 size={24} className="text-white" />
                            ) : (
                              <span className="text-white font-bold">{svc.name?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{svc.name}</h4>
                            <p className="text-sm text-gray-500">{svc.duration} • {svc.category || 'Service'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              ₹{svc.price || svc.priceAmount || '0'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Products List */}
            {activeTab === 'products' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const isSelected = selectedProducts.some(p => p.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300 bg-white'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
                          } else {
                            setSelectedProducts(prev => [...prev, product]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-orange-500' : 'bg-orange-100'
                          }`}>
                            {isSelected ? (
                              <CheckCircle2 size={20} className="text-white" />
                            ) : (
                              <ShoppingBag size={20} className="text-orange-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.category || 'Product'}</p>
                          </div>
                          <div className="text-orange-600 font-bold">₹{product.price || '0'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Service Attendee Selection */}
            {selectedServices.length > 0 && teamMembers.length > 0 && (
              <div className="bg-white rounded-xl border p-4 mt-4">
                <Label className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
                  <User size={18} className="text-purple-600" />
                  Select Service Attendee (Optional)
                </Label>
                <Select value={selectedAttendee} onValueChange={setSelectedAttendee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any available attendee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Available Attendee</SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role || 'Team Member'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selection Summary */}
            {(selectedServices.length > 0 || selectedProducts.length > 0) && (
              <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Your Selection</h4>
                <div className="space-y-2">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-600" />
                        {s.name}
                      </span>
                      <span className="font-medium">₹{s.price || s.priceAmount || '0'}</span>
                    </div>
                  ))}
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-orange-500" />
                        {p.name}
                      </span>
                      <span className="font-medium">₹{p.price || '0'}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-purple-600">₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 px-8"
                onClick={() => setStep(3)}
                disabled={selectedServices.length === 0 && selectedProducts.length === 0}
              >
                Choose Time
                <ArrowLeft size={18} className="ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Select Time */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose Date & Time</h2>
                <p className="text-gray-600">Select your preferred appointment slot</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={previousMonth}>
                      <ArrowLeft size={18} />
                    </Button>
                    <CardTitle className="text-lg">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={nextMonth}>
                      <ArrowLeft size={18} className="rotate-180" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-xs font-medium text-gray-500 py-2">{day}</div>
                    ))}
                    {calendarDays.map((day, idx) => {
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                      const isToday = day.toDateString() === new Date().toDateString();
                      const isSelected = selectedDate?.toDateString() === day.toDateString();
                      const isPast = day < new Date(new Date().setHours(0,0,0,0));
                      
                      return (
                        <button
                          key={idx}
                          disabled={isPast || !isCurrentMonth}
                          onClick={() => setSelectedDate(day)}
                          className={`p-2 text-sm rounded-lg transition-all ${
                            !isCurrentMonth ? 'text-gray-300' :
                            isPast ? 'text-gray-300 cursor-not-allowed' :
                            isSelected ? 'bg-purple-600 text-white' :
                            isToday ? 'bg-purple-100 text-purple-600 font-bold' :
                            'hover:bg-gray-100'
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock size={20} className="text-purple-600" />
                      Available Times
                    </CardTitle>
                    {selectedDate && availableSlotsCount > 0 && availableSlotsCount <= 5 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium animate-pulse">
                        🔥 Only {availableSlotsCount} slots left!
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                      <p>Please select a date first</p>
                    </div>
                  ) : timeSlots.length === 0 || availableSlotsCount === 0 ? (
                    <div className="text-center py-8">
                      <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 mb-4">No available slots for this date</p>
                      
                      {/* Waitlist Option */}
                      {!isOnWaitlist ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3 justify-center">
                            <Bell size={20} className="text-yellow-600" />
                            <h4 className="font-semibold text-yellow-800">Join the Waitlist</h4>
                          </div>
                          <p className="text-sm text-yellow-700 mb-4">
                            Get notified when a slot becomes available
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              value={waitlistEmail}
                              onChange={(e) => setWaitlistEmail(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              size="sm" 
                              className="bg-yellow-500 hover:bg-yellow-600"
                              onClick={joinWaitlist}
                            >
                              Notify Me
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 justify-center">
                            <CheckCircle2 size={20} className="text-green-600" />
                            <span className="font-medium text-green-700">You're on the waitlist!</span>
                          </div>
                          <p className="text-sm text-green-600 mt-2">We'll notify you when a slot opens up.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {timeSlots.map(slot => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-3 text-sm rounded-lg border-2 transition-all ${
                            !slot.available ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' :
                            selectedTime === slot.time ? 'bg-purple-600 text-white border-purple-600' :
                              'border-gray-200 hover:border-purple-400'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            {selectedDate && selectedTime && (
              <div className="bg-green-50 rounded-xl border-2 border-green-200 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Appointment Selected</p>
                    <p className="text-sm text-green-700">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTime}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 px-8"
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
              >
                Enter Details
                <ArrowLeft size={18} className="ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Your Details */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
                <p className="text-gray-600">Please provide your contact information</p>
              </div>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                {loginFields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label className="font-medium">
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="min-h-[100px]"
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                
                {/* Special Requests / Customer Notes */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="font-medium flex items-center gap-2">
                    <MessageCircle size={16} className="text-purple-600" />
                    Special Requests (Optional)
                  </Label>
                  <Textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Any allergies, preferences, or special requirements..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Promo Code Section */}
            <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ticket size={20} className="text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Have a Promo Code?</h3>
                </div>
                {appliedPromo ? (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <span className="font-medium text-green-700">
                        {appliedPromo.code} applied! 
                        {appliedPromo.type === 'percent' ? ` ${appliedPromo.discount}% off` : ` ₹${appliedPromo.discount} off`}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={removePromoCode}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., FIRST10)"
                      className="flex-1 uppercase"
                    />
                    <Button 
                      onClick={applyPromoCode}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Apply
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Try: FIRST10, VIP20, WELCOME, SAVE50</p>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Branch</span>
                  <span className="font-medium">{branches.find(b => b.id === selectedBranch)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium">
                    {selectedDate?.toLocaleDateString()} at {selectedTime}
                  </span>
                </div>
                {groupSize > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Group Size</span>
                    <span className="font-medium">{groupSize} people</span>
                  </div>
                )}
                {selectedServices.map(s => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {s.name} {groupSize > 1 && `x${groupSize}`}
                    </span>
                    <span className="font-medium">₹{((s.price || s.priceAmount || 0) * groupSize).toFixed(0)}</span>
                  </div>
                ))}
                {selectedProducts.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {p.name} {groupSize > 1 && `x${groupSize}`}
                    </span>
                    <span className="font-medium">₹{((p.price || 0) * groupSize).toFixed(0)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotalPrice.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedPromo.code})</span>
                    <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-purple-600">₹{totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 px-8"
                onClick={() => {
                  // Check required fields
                  const requiredMissing = loginFields.filter(f => f.required && !formData[f.id]);
                  if (requiredMissing.length > 0) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  // Go to payment if total > 0, else confirmation
                  if (totalPrice > 0) {
                    setStep(5);
                  } else {
                    setBookingConfirmationId(`ZRV-${Date.now().toString(36).toUpperCase()}`);
                    setStep(6);
                  }
                }}
              >
                {totalPrice > 0 ? 'Proceed to Payment' : 'Confirm Booking'}
                <ArrowLeft size={18} className="ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Payment */}
        {step === 5 && totalPrice > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(4)}>
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Secure Payment</h2>
                <p className="text-gray-600">Complete your booking payment</p>
              </div>
            </div>

            {/* Payment Summary */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700">Total Amount</span>
                  <span className="text-3xl font-bold text-purple-600">₹{totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Select Payment Method</h3>
              
              {[
                { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay', icon: CreditCard, color: 'purple' },
                { id: 'upi', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone, color: 'blue' },
                { id: 'netbanking', name: 'Net Banking', desc: 'All major banks', icon: Building2, color: 'green' },
                { id: 'wallet', name: 'Wallets', desc: 'Amazon Pay, Mobikwik', icon: Gift, color: 'orange' },
                { id: 'venue', name: 'Pay at Venue', desc: 'Cash or card at appointment', icon: MapPin, color: 'gray' },
              ].map(method => (
                <div
                  key={method.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id 
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${method.color}-100`}>
                      <method.icon size={24} className={`text-${method.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.desc}</div>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <CheckCircle2 size={24} className="text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={16} className="text-green-500" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lock size={16} className="text-blue-500" />
                <span>PCI Compliant</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 px-8"
                onClick={() => {
                  if (!selectedPaymentMethod) {
                    alert('Please select a payment method');
                    return;
                  }
                  setBookingConfirmationId(`ZRV-${Date.now().toString(36).toUpperCase()}`);
                  setStep(6);
                }}
                disabled={!selectedPaymentMethod}
              >
                Complete Payment
                <ArrowLeft size={18} className="ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: Confirmation */}
        {step === 6 && (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle2 size={48} className="text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Booking Confirmed!</h2>
              <p className="text-gray-600">Your appointment at <span className="font-semibold text-purple-600">{bookingSettings?.businessName || 'our business'}</span> has been successfully scheduled</p>
            </div>

            {/* Booking ID */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-purple-600 font-mono">{bookingConfirmationId}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(bookingConfirmationId)}
                  className="gap-1 text-purple-600"
                >
                  <Copy size={14} />
                  Copy
                </Button>
              </div>
            </div>

            {/* Company Info Card */}
            <Card className="max-w-md mx-auto text-left border-2 border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {bookingSettings?.logo ? (
                    <img 
                      src={bookingSettings.logo} 
                      alt={bookingSettings.businessName} 
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Building2 size={24} className="text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{bookingSettings?.businessName || 'Business'}</h3>
                    {bookingSettings?.tagline && (
                      <p className="text-sm text-gray-500">{bookingSettings.tagline}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-gray-600">{bookingSettings?.rating || 4.9} ({bookingSettings?.reviewCount || 500}+ reviews)</span>
                    </div>
                  </div>
                </div>
                {(bookingSettings?.phone || bookingSettings?.email) && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t text-sm">
                    {bookingSettings?.phone && (
                      <a href={`tel:${bookingSettings.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-purple-600">
                        <Phone size={12} />
                        {bookingSettings.phone}
                      </a>
                    )}
                    {bookingSettings?.email && (
                      <a href={`mailto:${bookingSettings.email}`} className="flex items-center gap-1 text-gray-600 hover:text-purple-600">
                        <Mail size={12} />
                        {bookingSettings.email}
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card className="max-w-md mx-auto text-left">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award size={20} />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <MapPin size={18} className="text-purple-600" />
                  <div>
                    <p className="font-medium">{branches.find(b => b.id === selectedBranch)?.name}</p>
                    <p className="text-sm text-gray-500">{branches.find(b => b.id === selectedBranch)?.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Calendar size={18} className="text-purple-600" />
                  <div>
                    <p className="font-medium">{selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <p className="text-sm text-gray-500">{selectedTime}</p>
                  </div>
                </div>
                {selectedServices.map(s => (
                  <div key={s.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <Sparkles size={18} className="text-purple-600" />
                    <div className="flex-1">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.duration}</p>
                    </div>
                    <span className="font-bold text-purple-600">₹{s.price || s.priceAmount || '0'}</span>
                  </div>
                ))}
                {selectedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-orange-50 p-3 rounded-lg">
                    <ShoppingBag size={18} className="text-orange-600" />
                    <div className="flex-1">
                      <p className="font-medium">{p.name}</p>
                    </div>
                    <span className="font-bold text-orange-600">₹{p.price || '0'}</span>
                  </div>
                ))}
                {selectedAttendee && selectedAttendee !== 'any' && (
                  <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                    <User size={18} className="text-blue-600" />
                    <div>
                      <p className="font-medium">Service Attendee</p>
                      <p className="text-sm text-gray-500">
                        {teamMembers.find(m => m.id === selectedAttendee)?.name || 'Staff Member'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span className="text-green-600">₹{totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Add to Calendar */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Add to your calendar:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink size={14} />
                  Google Calendar
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink size={14} />
                  Outlook
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download size={14} />
                  Apple Calendar
                </Button>
              </div>
            </div>

            {/* Manage Booking / Reschedule */}
            <div className="bg-yellow-50 rounded-xl p-4 max-w-md mx-auto border border-yellow-200">
              <div className="flex items-center gap-3 justify-center mb-3">
                <Edit3 size={18} className="text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Need to make changes?</h4>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={() => {
                    // In production, this would open a reschedule flow
                    alert(`To reschedule, please contact us with your booking reference: ${bookingConfirmationId}`);
                  }}
                >
                  <RefreshCw size={14} />
                  Reschedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    // In production, this would open a cancellation flow
                    alert(`To cancel, please contact us with your booking reference: ${bookingConfirmationId}`);
                  }}
                >
                  <AlertCircle size={14} />
                  Cancel Booking
                </Button>
              </div>
              <p className="text-xs text-yellow-700 mt-2 text-center">
                Free cancellation up to 24 hours before appointment
              </p>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 rounded-xl p-5 max-w-md mx-auto text-left">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap size={18} className="text-blue-600" />
                What's Next?
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                  <span>Confirmation sent to your email/phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                  <span>Reminder 24 hours before</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                  <span>Arrive 5 minutes early</span>
                </li>
              </ul>
            </div>

            {/* Customer Reviews Section */}
            <div className="max-w-lg mx-auto">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 justify-center">
                <Star size={18} className="text-yellow-500 fill-yellow-500" />
                What Our Customers Say
              </h4>
              <div className="space-y-3">
                {customerReviews.map(review => (
                  <div key={review.id} className="bg-white rounded-lg p-4 shadow-sm border text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                          {review.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{review.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.text}</p>
                    <p className="text-xs text-gray-400 mt-2">{review.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                <Calendar size={16} />
                Book Another
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 gap-2" onClick={() => window.print()}>
                <Download size={16} />
                Download Receipt
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Features Bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-full px-6 py-3 border border-gray-200 flex items-center gap-4 z-50">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Secure Booking</span>
        </div>
        <div className="w-px h-4 bg-gray-300"></div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span>4.9 Rating</span>
        </div>
        <div className="w-px h-4 bg-gray-300"></div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <ThumbsUp size={14} className="text-blue-500" />
          <span>Instant Confirm</span>
        </div>
      </div>
    </div>
  );
}
