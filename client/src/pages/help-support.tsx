import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import {
  MessageCircle,
  Phone,
  Mail,
  Search,
  ChevronRight,
  ChevronDown,
  Book,
  Video,
  FileText,
  Zap,
  Send,
  User,
  Bot,
  ExternalLink,
  CheckCircle,
  Clock,
  Star,
  MessageSquare,
  Headphones,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addNotification } from '@/components/NotificationDropdown';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  message: string;
  timestamp: Date;
}

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'chat' | 'contact'>('faq');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      message: 'Hello! 👋 I\'m here to help. You can ask me questions or connect with a live agent. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const faqs: FAQItem[] = [
    // Online Booking & Appointments
    {
      id: '1',
      question: 'How do I create a new booking page?',
      answer: 'Navigate to "Booking Pages" from the sidebar, click "Create New Page", fill in your service details (name, duration, price), customize the appearance, and publish. Your customers will receive a unique URL (e.g., zervos.com/your-business/service-name) to book appointments 24/7. You can customize colors, add your logo, set availability, and even embed the booking widget on your website.',
      category: 'Online Bookings',
    },
    {
      id: '2',
      question: 'Can customers book appointments online without calling me?',
      answer: 'Yes! That\'s the core feature of Zervos. Once you create a booking page, customers can browse available time slots, select their preferred date/time, fill in their details, and pay online (if enabled). You receive instant notifications via email, SMS, and in-app. No phone calls needed - it\'s all automated!',
      category: 'Online Bookings',
    },
    {
      id: '3',
      question: 'How do online session bookings work?',
      answer: 'Online bookings work in 5 steps: 1) Customer visits your booking page, 2) Selects service and available time slot, 3) Fills in name, email, phone, 4) Makes payment (optional), 5) Receives instant confirmation. You get notified immediately and the appointment appears in your dashboard. Customers can also reschedule or cancel based on your policies.',
      category: 'Online Bookings',
    },
    {
      id: '4',
      question: 'What information do customers need to provide for online bookings?',
      answer: 'Standard fields include: Full Name, Email Address, Phone Number, and any custom fields you add (e.g., "Special Requests", "Allergies", "Preferred Staff Member"). You can make fields required or optional. All data is encrypted and stored securely. Customers also receive booking confirmations and reminders automatically.',
      category: 'Online Bookings',
    },
    {
      id: '5',
      question: 'Can I accept online payments for bookings?',
      answer: 'Absolutely! Integrate Razorpay, Stripe, or PayPal in Admin Center > Payment Settings. You can charge full payment upfront, partial deposits, or allow pay-later. All transactions are secure with PCI-DSS compliance. Customers can pay via credit/debit cards, UPI, wallets, or net banking. You receive payment confirmations instantly.',
      category: 'Online Bookings',
    },
    {
      id: '6',
      question: 'Do I get notified when someone books online?',
      answer: 'Yes! You receive real-time notifications via: 1) In-app notifications (bell icon), 2) Email alerts, 3) SMS (if enabled), 4) WhatsApp notifications (optional). The notification includes customer details, service booked, date/time, and payment status. You can customize notification preferences in Settings.',
      category: 'Online Bookings',
    },
    {
      id: '7',
      question: 'Can customers see my real-time availability online?',
      answer: 'Yes! Your booking page shows only available time slots based on your calendar. It automatically blocks out: booked slots, breaks, holidays, and off-days. When you update your availability, it reflects immediately. This prevents double-bookings and gives customers accurate slot selection.',
      category: 'Online Bookings',
    },

    // Time Slot Management
    {
      id: '8',
      question: 'How do I manage time slots and availability?',
      answer: 'Click the clock icon ⏰ next to notifications to access Time Slot Management. You can: Add new slots, Set recurring availability (e.g., Mon-Fri 9am-5pm), Add breaks/lunch hours, Block specific dates, Set slot duration (15min, 30min, 1hr, etc.), Assign slots to team members. Changes reflect instantly on booking pages.',
      category: 'Time Management',
    },
    {
      id: '9',
      question: 'Can I set different availability for different services?',
      answer: 'Yes! Each booking page (service) can have unique availability. For example: "Haircuts" available Mon-Sat 9am-6pm, "Spa Services" available Tue-Fri 10am-8pm. You can also assign different team members with their own schedules to different services.',
      category: 'Time Management',
    },
    {
      id: '10',
      question: 'How do I handle breaks and lunch hours?',
      answer: 'In Time Slot Management, add "Break Slots" or "Day Breaks". For example, set 12:30 PM - 1:30 PM as lunch break daily. These slots will be automatically blocked from customer bookings. You can set recurring breaks or one-time blocks for specific dates.',
      category: 'Time Management',
    },

    // Appointment Management
    {
      id: '11',
      question: 'How do I track all my appointments?',
      answer: 'Go to "Appointments" in the sidebar. You see a list and calendar view of all bookings. Filter by: Status (Pending/Confirmed/Completed/Cancelled), Date range, Team member, Service type. Click any appointment to view full details, customer info, payment status, and add internal notes.',
      category: 'Appointments',
    },
    {
      id: '12',
      question: 'Can customers reschedule or cancel their online bookings?',
      answer: 'Yes! In Booking Page Settings, enable "Allow Rescheduling" and "Allow Cancellation". Set policies like "Cancel up to 24 hours before appointment". Customers receive a unique link in their confirmation email to manage their booking. You get notified of any changes.',
      category: 'Appointments',
    },
    {
      id: '13',
      question: 'What happens after a customer books online?',
      answer: 'Automated workflow: 1) Customer receives instant confirmation email with appointment details, 2) You receive notification, 3) Appointment appears in your dashboard and calendar, 4) Customer gets automated reminders (24hr, 1hr before), 5) After appointment, customer receives thank-you email with feedback form (optional).',
      category: 'Appointments',
    },

    // POS & Billing
    {
      id: '14',
      question: 'How does the POS system work for walk-in customers?',
      answer: 'Click "Open POS Register" button. Browse services/products, add to cart, enter customer details (optional), assign staff (Billing Staff, Service Attendee, Sales Agent), select payment method, and complete sale. Transaction is recorded with full details. You can export reports in CSV, Excel, or PDF format.',
      category: 'POS & Billing',
    },
    {
      id: '15',
      question: 'Can I track who performed the service vs who handled billing?',
      answer: 'Yes! The enhanced POS system has 3 staff fields: 1) Staff Handling Bill (who processed payment), 2) Service Attendee (who performed service), 3) Sales Agent (who made the sale). This helps track performance, commissions, and service quality. All data is included in export reports.',
      category: 'POS & Billing',
    },
    {
      id: '16',
      question: 'How do I export POS transaction reports?',
      answer: 'Click "Export" button in POS page. Choose format: CSV (for spreadsheets), Excel (multi-sheet with Summary, Transactions, Item Details, Staff Performance), PDF (professional report), or Print. All formats include complete transaction data with staff tracking, customer info, and payment details.',
      category: 'POS & Billing',
    },

    // Payments & Invoicing
    {
      id: '17',
      question: 'What payment methods are supported for online bookings?',
      answer: 'We support: Razorpay (India: UPI, Cards, Wallets, Net Banking), Stripe (Global: Cards, Apple Pay, Google Pay), PayPal (Worldwide), Manual Payments (Cash/Bank Transfer). Configure in Admin Center > Payment Settings. You can enable multiple payment methods and let customers choose.',
      category: 'Payments',
    },
    {
      id: '18',
      question: 'Can I send invoices for online bookings?',
      answer: 'Yes! Go to Invoices section, create invoice, select customer and items/services, add taxes, apply discounts. You can send invoices via email, SMS, or WhatsApp. Customers receive a payment link. Track invoice status (Draft/Sent/Paid/Overdue). System sends auto-reminders for unpaid invoices.',
      category: 'Payments',
    },

    // Team & Staff Management
    {
      id: '19',
      question: 'How do I add team members for online bookings?',
      answer: 'Go to Team Members section, click "Add New Member", enter: Name, Email, Role (Admin/Staff/Receptionist), Services they provide, Availability schedule. They receive login credentials. Customers can choose specific team members during online booking if you enable this feature.',
      category: 'Team Management',
    },
    {
      id: '20',
      question: 'Can customers choose specific staff when booking online?',
      answer: 'Yes! Enable "Staff Selection" in Booking Page Settings. Your booking page will show available staff with their photos (optional) and availability. Customers can pick their preferred team member. If staff is unavailable, only alternative options show.',
      category: 'Team Management',
    },

    // Customization & Branding
    {
      id: '21',
      question: 'Can I customize the online booking page with my branding?',
      answer: 'Absolutely! In Booking Page Settings, customize: Logo, Brand colors, Header image, Welcome message, Terms & conditions, Thank you message. You can also add custom fields, set minimum booking notice (e.g., 2 hours ahead), buffer time between appointments, and embed widget on your website.',
      category: 'Customization',
    },
    {
      id: '22',
      question: 'Can I change how services and staff are labeled?',
      answer: 'Yes! In Settings or during onboarding, customize terminology: Event Types (Sessions/Appointments/Classes/Consultations), Team Members (Staff/Therapists/Coaches/Artists). This personalizes the system to match your industry (salon, spa, gym, clinic, etc.).',
      category: 'Customization',
    },

    // Automation & Notifications
    {
      id: '23',
      question: 'How do automated reminders work for online bookings?',
      answer: 'Set up in Workflows section: Choose trigger (e.g., "24 hours before appointment"), Select action (Send Email/SMS), Customize message template. Common reminders: 24hr before, 1hr before, Thank you after service. Reduces no-shows by 60%! All reminders are sent automatically - you don\'t lift a finger.',
      category: 'Automation',
    },
    {
      id: '24',
      question: 'Do customers get confirmation after booking online?',
      answer: 'Yes, instant confirmation! Customers receive: Confirmation email with appointment details and calendar invite (.ics file), SMS confirmation (if phone provided), Reminder emails (24hr & 1hr before), Reschedule/Cancel link, "Add to Calendar" button. You can customize all email templates in Settings.',
      category: 'Automation',
    },

    // Reports & Analytics
    {
      id: '25',
      question: 'Can I see reports of all online bookings?',
      answer: 'Yes! Go to Reports section: View bookings by date range, service type, staff member, revenue generated, cancellation rates, popular time slots, customer retention. Export reports in CSV/Excel/PDF. Perfect for business insights, staff performance reviews, and financial planning.',
      category: 'Reports',
    },

    // Troubleshooting
    {
      id: '26',
      question: 'What if my online booking page is not showing available slots?',
      answer: 'Check: 1) Time Slots are added and activated (clock icon), 2) Service is linked to availability, 3) You haven\'t blocked all dates, 4) Minimum booking notice isn\'t too restrictive, 5) Time zone is set correctly. Still stuck? Contact support via Live Chat - we\'ll help debug immediately!',
      category: 'Troubleshooting',
    },
    {
      id: '27',
      question: 'How do I prevent double-bookings from online reservations?',
      answer: 'Zervos automatically prevents double-bookings! When a customer selects a slot online, it\'s temporarily reserved (5 minutes). If they complete booking, slot is permanently blocked. If they abandon, slot opens again. Your calendar syncs in real-time across all booking pages.',
      category: 'Troubleshooting',
    },
  ];

  const quickActions = [
    {
      icon: Book,
      title: 'Online Booking Setup',
      description: 'Enable 24/7 online appointments',
      color: 'from-blue-500 to-blue-600',
      action: () => {
        const tutorial = `
📚 ONLINE BOOKING SETUP GUIDE

✨ What You'll Learn:
• Create your first booking page
• Set availability & time slots
• Accept online payments
• Share booking link with customers

📝 Step-by-Step Process:

1️⃣ CREATE BOOKING PAGE
   • Go to Sidebar > Booking Pages
   • Click "Create New Page"
   • Enter service name (e.g., "Haircut", "Massage")
   • Set duration & price
   • Add description

2️⃣ SET AVAILABILITY
   • Click clock icon ⏰ (top right)
   • Add time slots (e.g., Mon-Fri 9am-5pm)
   • Set slot duration (30min, 1hr, etc.)
   • Add breaks if needed

3️⃣ CONFIGURE PAYMENTS
   • Admin Center > Payment Settings
   • Connect Razorpay/Stripe/PayPal
   • Set pricing: full payment or deposit
   • Enable invoicing

4️⃣ SHARE & GO LIVE
   • Copy booking page link
   • Share via email, social media, website
   • Customers book 24/7 instantly!
   • You get real-time notifications

🎯 Your booking URL format:
   zervos.com/your-business/service-name

💡 Pro Tips:
• Enable "Allow Rescheduling" for flexibility
• Set minimum notice (e.g., 2 hours ahead)
• Add custom fields for special requests
• Use automated reminders to reduce no-shows

Need help? Click "Live Chat" tab!`;
        alert(tutorial);
      },
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch setup demos & walkthroughs',
      color: 'from-red-500 to-red-600',
      action: () => {
        const videoGuide = `
🎥 VIDEO TUTORIAL LIBRARY

📺 Available Videos:

1. Getting Started (5 min)
   • Platform overview
   • Dashboard navigation
   • First booking setup

2. Online Bookings Deep Dive (12 min)
   • Creating booking pages
   • Customizing appearance
   • Payment integration
   • Customer experience walkthrough

3. Time Slot Management (8 min)
   • Adding availability
   • Recurring schedules
   • Managing breaks
   • Holiday blocking

4. POS System Tutorial (10 min)
   • Walk-in customer handling
   • Staff tracking
   • Receipt printing
   • Report exports

5. Team Management (7 min)
   • Adding staff members
   • Setting individual schedules
   • Performance tracking

6. Automation & Workflows (9 min)
   • Automated reminders
   • Email templates
   • SMS notifications

7. Reports & Analytics (11 min)
   • Export formats (CSV/Excel/PDF)
   • Revenue analysis
   • Staff performance

📱 Access videos at:
   zervos.com/tutorials

🔗 Or search "Zervos Tutorial" on YouTube!`;
        alert(videoGuide);
      },
    },
    {
      icon: FileText,
      title: 'FAQ & Knowledge Base',
      description: '27 detailed guides about bookings',
      color: 'from-purple-500 to-purple-600',
      action: () => setActiveTab('faq'),
    },
    {
      icon: Zap,
      title: '5-Minute Quick Start',
      description: 'Get online bookings live NOW',
      color: 'from-emerald-500 to-emerald-600',
      action: () => {
        const quickStart = `
⚡ 5-MINUTE QUICK START

🎯 Goal: Accept your first online booking!

⏱️ MINUTE 1: Create Booking Page
   • Sidebar > Booking Pages
   • Click "Create New"
   • Name: "Initial Consultation"
   • Duration: 30 minutes
   • Price: Free or ₹500
   • Click "Save"

⏱️ MINUTE 2: Set Availability
   • Click clock icon ⏰
   • Add slot: Mon-Fri, 9am-5pm
   • Duration: 30 min
   • Click "Activate"

⏱️ MINUTE 3: Test Booking
   • Copy your booking link
   • Open in incognito/private window
   • Select a time slot
   • Complete test booking
   • Check your dashboard!

⏱️ MINUTE 4: Share Link
   • Copy: zervos.com/yourname/consultation
   • Send via WhatsApp/Email/SMS
   • Post on social media
   • Add to website/bio

⏱️ MINUTE 5: Enable Notifications
   • Settings > Notifications
   • Enable email alerts
   • Enable SMS (optional)
   • Test with your test booking!

🎉 DONE! You're now accepting online bookings!

📱 Share this link with customers:
   "Book your appointment here: [your-link]"

💡 Next steps:
   • Add payment integration
   • Customize booking page design
   • Set up automated reminders
   • Add more services

🚀 Your first real customer is just minutes away!`;
        alert(quickStart);
      },
    },
  ];

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: messageInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setMessageInput('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        message: getBotResponse(messageInput),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    // Online Booking Related
    if (msg.includes('online booking') || msg.includes('book online') || msg.includes('online appointment')) {
      return '🎯 **Online Bookings Made Easy!**\n\nCustomers can book appointments 24/7 through your booking page. Here\'s how:\n\n1️⃣ Create a booking page (Sidebar > Booking Pages)\n2️⃣ Set your availability (Clock icon ⏰)\n3️⃣ Share your booking link\n4️⃣ Get instant notifications when customers book!\n\nYour booking page URL: zervos.com/your-business/service-name\n\nWant help setting this up? I can connect you to a live agent!';
    }
    
    // Appointment/Booking General
    else if (msg.includes('appointment') || msg.includes('booking')) {
      return '📅 **Managing Appointments**\n\nGo to **Appointments** section from sidebar to:\n• View all bookings (online & manual)\n• Filter by status, date, staff\n• See calendar view\n• Track payment status\n• Add notes to appointments\n\nCustomers can book online 24/7 through your booking pages! Want to enable online bookings? I can guide you or connect you to a live agent.';
    }
    
    // Time Slots & Availability
    else if (msg.includes('time slot') || msg.includes('availability') || msg.includes('schedule')) {
      return '⏰ **Time Slot Management**\n\nClick the **clock icon** next to notifications to:\n• Add/edit available time slots\n• Set recurring availability (e.g., Mon-Fri 9am-5pm)\n• Block dates for holidays\n• Add breaks/lunch hours\n• Assign slots to team members\n\nChanges reflect instantly on your online booking pages! Need detailed help? Connect with a live agent!';
    }
    
    // Customer/Client Questions
    else if (msg.includes('customer') || msg.includes('client') || msg.includes('people booking')) {
      return '👥 **Customer Booking Experience**\n\nWhen customers visit your booking page, they:\n1. See available time slots in real-time\n2. Select preferred date/time\n3. Fill in details (name, email, phone)\n4. Pay online (optional)\n5. Get instant confirmation via email/SMS\n\nYou receive notifications immediately! They can also reschedule/cancel if you enable it. Want to customize the booking experience?';
    }
    
    // Payment Related
    else if (msg.includes('payment') || msg.includes('invoice') || msg.includes('razorpay') || msg.includes('stripe')) {
      return '💳 **Payment Integration**\n\nNavigate to **Admin Center > Payment Settings**:\n• **Razorpay** (India: UPI, Cards, Wallets)\n• **Stripe** (Global: Cards, Apple Pay)\n• **PayPal** (Worldwide)\n• **Manual** (Cash/Bank Transfer)\n\nYou can charge full payment, deposits, or allow pay-later for online bookings. All transactions are secure and PCI-compliant. Need setup help?';
    }
    
    // POS Related
    else if (msg.includes('pos') || msg.includes('register') || msg.includes('sale') || msg.includes('walk-in')) {
      return '🛒 **POS System for Walk-ins**\n\nClick **"Open POS Register"** to:\n• Add services/products to cart\n• Enter customer details\n• Track Staff (Billing), Service Attendee, Sales Agent\n• Accept payments (Cash/Card/UPI)\n• Generate receipts\n• Export reports (CSV/Excel/PDF)\n\nPerfect for walk-in customers! Online bookings go directly to Appointments section. Questions?';
    }
    
    // Staff/Team Management
    else if (msg.includes('staff') || msg.includes('team') || msg.includes('employee') || msg.includes('member')) {
      return '👨‍💼 **Team Management**\n\nGo to **Team Members** section to:\n• Add new staff with their own schedules\n• Assign services to specific team members\n• Set individual availability\n• Track performance in reports\n\nCustomers can choose preferred staff during online booking if you enable it! Want to set up your team?';
    }
    
    // Reports & Analytics
    else if (msg.includes('report') || msg.includes('export') || msg.includes('analytics') || msg.includes('stats')) {
      return '📊 **Reports & Analytics**\n\n**POS Reports:** Click Export in POS page\n• CSV for spreadsheets\n• Excel with 4 sheets (Summary, Transactions, Items, Staff Performance)\n• PDF professional reports\n• Print preview\n\n**Booking Reports:** Go to Reports section\n• View bookings by date, service, staff\n• Revenue analysis\n• Popular time slots\n• Customer retention\n\nNeed help analyzing data?';
    }
    
    // Notifications
    else if (msg.includes('notification') || msg.includes('alert') || msg.includes('reminder')) {
      return '🔔 **Smart Notifications**\n\nYou receive alerts for:\n• New online bookings (instant)\n• Cancellations/Reschedules\n• Payments received\n• Upcoming appointments\n\nCustomers get:\n• Confirmation emails\n• SMS confirmations\n• Reminders (24hr & 1hr before)\n• Thank you messages\n\nCustomize in **Workflows** section! Want to set up automation?';
    }
    
    // Customization/Branding
    else if (msg.includes('customize') || msg.includes('brand') || msg.includes('logo') || msg.includes('color')) {
      return '🎨 **Customization & Branding**\n\nIn **Booking Page Settings**, customize:\n• Add your logo\n• Set brand colors\n• Custom header image\n• Welcome message\n• Terms & conditions\n• Thank you page\n\nMake your online booking page match your brand identity! Need design help?';
    }
    
    // Getting Started
    else if (msg.includes('start') || msg.includes('begin') || msg.includes('how to') || msg.includes('guide')) {
      return '🚀 **Quick Start Guide**\n\n**For Online Bookings:**\n1. Create booking page (Sidebar > Booking Pages)\n2. Set availability (Clock icon ⏰)\n3. Configure payments (Admin Center)\n4. Share booking link with customers\n\n**For Walk-ins:**\n1. Click "Open POS Register"\n2. Add services to cart\n3. Complete sale\n\nCheck **FAQ tab** for detailed guides! Want a personalized walkthrough?';
    }
    
    // Connect to Agent
    else if (msg.includes('agent') || msg.includes('human') || msg.includes('support') || msg.includes('help me')) {
      return '👤 **Connecting to Live Agent**\n\nI\'ll connect you with a support specialist right away! They typically respond within **2-3 minutes**.\n\nWhile you wait, feel free to browse our:\n• FAQ section (27 detailed guides)\n• Video tutorials\n• Documentation\n\nConnecting... 🔄';
    }
    
    // Default response
    else {
      return '👋 **How Can I Help?**\n\nI can assist you with:\n• 📅 Online booking setup\n• ⏰ Time slot management\n• 💳 Payment integration\n• 🛒 POS system\n• 👥 Team management\n• 📊 Reports & analytics\n• 🔔 Notifications & automation\n\nJust ask your question, or type "agent" to connect with a live support specialist!\n\n💡 **Quick tip:** Check the FAQ tab for 27 detailed guides about online bookings and appointments!';
    }
  };

  const connectToAgent = () => {
    setIsAgentConnected(true);
    const agentMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'agent',
      message: '👋 Hi! I\'m Sarah from the support team. I\'ve reviewed your conversation and I\'m here to help. What specific issue can I assist you with?',
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, agentMessage]);

    // Simulate agent typing
    setTimeout(() => {
      setAgentTyping(true);
      setTimeout(() => {
        setAgentTyping(false);
      }, 2000);
    }, 5000);
  };

  const openWhatsApp = () => {
    const phoneNumber = '1234567890'; // Replace with your WhatsApp business number
    const message = encodeURIComponent('Hi, I need help with my Zervos account.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Help & Support</h1>
            <p className="mt-1 text-slate-600">We're here to help you succeed</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const notificationTypes = [
                  {
                    title: 'New booking: Hair Styling',
                    body: 'John Doe booked Hair Styling at 2:00 PM',
                    category: 'bookings' as const,
                    path: '/dashboard/appointments',
                  },
                  {
                    title: 'Invoice paid',
                    body: 'Invoice INV-' + Date.now() + ' was paid (₹2,500)',
                    category: 'invoices' as const,
                    path: '/dashboard/invoices',
                  },
                  {
                    title: 'POS sale completed',
                    body: 'New sale of ₹1,850 recorded',
                    category: 'pos' as const,
                    path: '/dashboard/pos',
                  },
                  {
                    title: 'System update available',
                    body: 'New features and improvements are ready',
                    category: 'system' as const,
                  },
                ];
                const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
                addNotification(randomNotification);
              }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Bell className="h-5 w-5" />
              Test Notification
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openWhatsApp}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <MessageSquare className="h-5 w-5" />
              WhatsApp Support
            </motion.button>
          </div>
        </motion.div>

        {/* Online Booking Info Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent backdrop-blur-sm" />
          <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-white mb-3">
                🌐 Accept Online Bookings 24/7
              </h2>
              <p className="text-blue-100 text-lg mb-4">
                Your customers can book appointments anytime, anywhere! No phone calls needed - 
                it's all automated with instant notifications, automated reminders, and secure online payments.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-white font-medium">Real-time Availability</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-white font-medium">Instant Confirmations</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-white font-medium">Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-white font-medium">Auto Reminders</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">📋 Quick Checklist</h3>
              <div className="space-y-3">
                {[
                  'Create booking page',
                  'Set availability & time slots',
                  'Configure payment gateway',
                  'Share your booking link',
                  'Start receiving bookings!',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Support Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { icon: Clock, label: 'Avg Response', value: '< 5 min', color: 'from-blue-400 to-blue-500' },
            { icon: Star, label: 'Satisfaction', value: '4.9/5', color: 'from-yellow-400 to-orange-500' },
            { icon: CheckCircle, label: 'Resolved', value: '98%', color: 'from-emerald-400 to-emerald-500' },
            { icon: Headphones, label: 'Agents Online', value: '12', color: 'from-purple-400 to-purple-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-0 bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card
                  onClick={action.action}
                  className="group cursor-pointer border-0 bg-white p-6 shadow-lg transition-all hover:shadow-xl overflow-hidden relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`rounded-xl bg-gradient-to-br ${action.color} p-3 shadow-lg`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{action.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-6 flex gap-2">
            {[
              { id: 'faq', label: 'FAQ', icon: FileText },
              { id: 'chat', label: 'Live Chat', icon: MessageCircle },
              { id: 'contact', label: 'Contact Us', icon: Phone },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 shadow hover:shadow-md'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="border-0 bg-white p-6 shadow-lg">
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-lg"
                      />
                    </div>
                  </div>

                  {categories.map((category) => {
                    const categoryFAQs = filteredFAQs.filter((faq) => faq.category === category);
                    if (categoryFAQs.length === 0) return null;

                    return (
                      <div key={category} className="mb-6">
                        <h3 className="mb-3 text-lg font-semibold text-slate-900">{category}</h3>
                        <div className="space-y-3">
                          {categoryFAQs.map((faq) => (
                            <motion.div
                              key={faq.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                            >
                              <button
                                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-100"
                              >
                                <span className="font-medium text-slate-900">{faq.question}</span>
                                {expandedFAQ === faq.id ? (
                                  <ChevronDown className="h-5 w-5 text-slate-600" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-slate-600" />
                                )}
                              </button>
                              <AnimatePresence>
                                {expandedFAQ === faq.id && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="border-t border-slate-200 bg-white p-4 text-slate-700">
                                      {faq.answer}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {filteredFAQs.length === 0 && (
                    <div className="py-12 text-center">
                      <AlertCircle className="mx-auto h-16 w-16 text-slate-300" />
                      <h3 className="mt-4 text-lg font-semibold text-slate-900">No results found</h3>
                      <p className="mt-2 text-slate-600">
                        Try different keywords or contact our support team
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Live Chat Tab */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="border-0 bg-white shadow-lg">
                  <div className="flex h-[600px] flex-col">
                    {/* Chat Header */}
                    <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-white p-2">
                            {isAgentConnected ? (
                              <User className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Bot className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {isAgentConnected ? 'Sarah - Support Agent' : 'AI Assistant'}
                            </h3>
                            <p className="text-sm text-blue-100">
                              {isAgentConnected ? '🟢 Online' : 'Always available'}
                            </p>
                          </div>
                        </div>
                        {!isAgentConnected && (
                          <Button
                            onClick={connectToAgent}
                            variant="outline"
                            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                          >
                            Connect to Agent
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : msg.sender === 'agent'
                                ? 'bg-emerald-100 text-slate-900'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            {msg.sender !== 'user' && (
                              <div className="mb-1 flex items-center gap-2">
                                {msg.sender === 'agent' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                                <span className="text-xs font-semibold">
                                  {msg.sender === 'agent' ? 'Sarah' : 'AI Bot'}
                                </span>
                              </div>
                            )}
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`mt-1 text-xs ${
                                msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                              }`}
                            >
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      {agentTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-slate-600"
                        >
                          <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm">Sarah is typing...</span>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="border-t border-slate-200 p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendMessage}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Contact Us Tab */}
            {activeTab === 'contact' && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Contact Form */}
                  <Card className="border-0 bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-xl font-semibold text-slate-900">Send us a message</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Name</label>
                        <Input placeholder="Your name" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <Input type="email" placeholder="your@email.com" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Subject</label>
                        <Input placeholder="How can we help?" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Message</label>
                        <Textarea
                          placeholder="Tell us more about your issue..."
                          rows={5}
                          className="mt-1"
                        />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        Send Message
                      </Button>
                    </div>
                  </Card>

                  {/* Contact Methods */}
                  <div className="space-y-4">
                    <Card className="border-0 bg-gradient-to-br from-blue-500 to-purple-500 p-6 text-white shadow-lg">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-full bg-white/20 p-3">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">WhatsApp Support</h3>
                          <p className="text-sm text-blue-100">Instant messaging support</p>
                        </div>
                      </div>
                      <p className="mb-4 text-blue-50">
                        Get quick answers via WhatsApp. Our team is available 24/7.
                      </p>
                      <Button
                        onClick={openWhatsApp}
                        className="w-full border-2 border-white bg-white text-blue-600 hover:bg-blue-50"
                      >
                        Open WhatsApp
                      </Button>
                    </Card>

                    <Card className="border-0 bg-white p-6 shadow-lg">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-3">
                          <Phone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Phone Support</h3>
                          <p className="text-sm text-slate-600">Mon-Fri, 9am-6pm EST</p>
                        </div>
                      </div>
                      <p className="mb-2 text-2xl font-bold text-slate-900">+1 (555) 123-4567</p>
                      <p className="text-sm text-slate-600">Average wait time: 2 minutes</p>
                    </Card>

                    <Card className="border-0 bg-white p-6 shadow-lg">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-lg bg-purple-50 p-3">
                          <Mail className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Email Support</h3>
                          <p className="text-sm text-slate-600">We'll respond within 24 hours</p>
                        </div>
                      </div>
                      <p className="font-semibold text-slate-900">support@zervos.com</p>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default HelpSupport;
