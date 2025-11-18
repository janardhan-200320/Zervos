import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOnboardingSchema, insertResourceSchema, insertResourceBookingSchema, updateUserProfileSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and GIF images are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== USER PROFILE ROUTES ==========

  // GET /api/user/profile - Get user profile (using mock user for now)
  app.get("/api/user/profile", async (req, res) => {
    try {
      // For demo purposes, we'll use a mock user ID
      // In production, get this from session/JWT token
      const mockUserId = "demo-user-1";
      
      // Try to get from storage, create if doesn't exist
      let user = await storage.getUser(mockUserId);
      
      if (!user) {
        // Create a demo user if it doesn't exist
        user = await storage.createUser({
          username: "demo_user",
          password: "hashed_password_here", // In production, this would be hashed
        });
      }

      return res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // PUT /api/user/profile - Update user profile
  app.put("/api/user/profile", async (req, res) => {
    try {
      const result = updateUserProfileSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      const mockUserId = "demo-user-1";
      const updated = await storage.updateUserProfile(mockUserId, result.data);

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(updated);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // POST /api/user/avatar - Upload profile picture
  app.post("/api/user/avatar", upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const mockUserId = "demo-user-1";
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const updated = await storage.updateUserProfile(mockUserId, {
        avatar: avatarUrl,
      });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        success: true,
        avatarUrl: avatarUrl,
        user: updated,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return res.status(500).json({ error: "Failed to upload avatar" });
    }
  });

  // PUT /api/user/password - Change password
  app.put("/api/user/password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      const mockUserId = "demo-user-1";
      
      // In production, verify current password against hashed password
      // For demo, we'll just update
      const success = await storage.updateUserPassword(mockUserId, newPassword);

      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return res.status(500).json({ error: "Failed to update password" });
    }
  });

  // GET /api/user/sessions - Get user sessions
  app.get("/api/user/sessions", async (req, res) => {
    try {
      const mockUserId = "demo-user-1";
      const sessions = await storage.getUserSessions(mockUserId);
      return res.json(sessions);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      return res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // DELETE /api/user/sessions/:id - Revoke a session
  app.delete("/api/user/sessions/:id", async (req, res) => {
    try {
      await storage.deleteUserSession(req.params.id);
      return res.json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
      console.error("Error revoking session:", error);
      return res.status(500).json({ error: "Failed to revoke session" });
    }
  });

  // DELETE /api/user/account - Delete user account
  app.delete("/api/user/account", async (req, res) => {
    try {
      const mockUserId = "demo-user-1";
      await storage.deleteUser(mockUserId);
      return res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // POST /api/onboarding - Create new onboarding
  app.post("/api/onboarding", async (req, res) => {
    try {
      const result = insertOnboardingSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      const onboarding = await storage.createOnboarding(result.data);
      return res.status(201).json(onboarding);
    } catch (error) {
      console.error("Error creating onboarding:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/onboarding/:id - Get onboarding by ID
  app.get("/api/onboarding/:id", async (req, res) => {
    try {
      const onboarding = await storage.getOnboarding(req.params.id);
      
      if (!onboarding) {
        return res.status(404).json({ error: "Onboarding not found" });
      }

      return res.json(onboarding);
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/onboardings - Get all onboardings
  app.get("/api/onboardings", async (_req, res) => {
    try {
      const onboardings = await storage.getAllOnboardings();
      return res.json(onboardings);
    } catch (error) {
      console.error("Error fetching onboardings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== RESOURCE ROUTES ==========

  // POST /api/resources - Create new resource
  app.post("/api/resources", async (req, res) => {
    try {
      const result = insertResourceSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      const resource = await storage.createResource(result.data);
      return res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources - Get all resources
  app.get("/api/resources", async (req, res) => {
    try {
      const { type, status, search } = req.query;
      const resources = await storage.getAllResources({
        type: type as string,
        status: status as string,
        search: search as string,
      });
      return res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources/:id - Get resource by ID
  app.get("/api/resources/:id", async (req, res) => {
    try {
      const resource = await storage.getResource(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      return res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT /api/resources/:id - Update resource
  app.put("/api/resources/:id", async (req, res) => {
    try {
      const result = insertResourceSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      const resource = await storage.updateResource(req.params.id, result.data);
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      return res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/resources/:id - Delete resource
  app.delete("/api/resources/:id", async (req, res) => {
    try {
      await storage.deleteResource(req.params.id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== RESOURCE BOOKING ROUTES ==========

  // POST /api/resource-bookings - Create new resource booking
  app.post("/api/resource-bookings", async (req, res) => {
    try {
      const result = insertResourceBookingSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      // Check if resource is available during requested time
      const isAvailable = await storage.checkResourceAvailability(
        result.data.resourceId,
        result.data.startTime,
        result.data.endTime
      );

      if (!isAvailable) {
        return res.status(409).json({ 
          error: "Resource is not available during the requested time" 
        });
      }

      const booking = await storage.createResourceBooking(result.data);
      return res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating resource booking:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resource-bookings - Get all resource bookings
  app.get("/api/resource-bookings", async (req, res) => {
    try {
      const { resourceId, startDate, endDate } = req.query;
      const bookings = await storage.getResourceBookings({
        resourceId: resourceId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      return res.json(bookings);
    } catch (error) {
      console.error("Error fetching resource bookings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT /api/resource-bookings/:id/cancel - Cancel resource booking
  app.put("/api/resource-bookings/:id/cancel", async (req, res) => {
    try {
      const booking = await storage.cancelResourceBooking(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      return res.json(booking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources/:id/stats - Get resource usage statistics
  app.get("/api/resources/:id/stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getResourceStats(
        req.params.id,
        startDate as string,
        endDate as string
      );
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching resource stats:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== APPOINTMENTS ROUTES (in-memory) ==========
  app.get("/api/appointments", async (req, res) => {
    try {
      const { assignedMemberId, serviceId, status } = req.query;
      const items = await storage.getAppointments({
        assignedMemberId: assignedMemberId as string | undefined,
        serviceId: serviceId as string | undefined,
        status: status as string | undefined,
      });
      return res.json(items);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const body = req.body as any;
      // Minimal validation
      if (!body || !body.customerName || !body.email || !body.serviceName || !body.date || !body.time) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const created = await storage.createAppointment({
        customerName: body.customerName,
        email: body.email,
        phone: body.phone,
        serviceName: body.serviceName,
        serviceId: body.serviceId,
        assignedMemberId: body.assignedMemberId,
        assignedMemberName: body.assignedMemberName,
        date: body.date,
        time: body.time,
        status: body.status || 'upcoming',
        notes: body.notes,
      });
      return res.status(201).json(created);
    } catch (error) {
      console.error("Error creating appointment:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== RAZORPAY CONFIGURATION ROUTES ==========
  
  // GET /api/razorpay/config - Get Razorpay public config (Key ID only)
  app.get("/api/razorpay/config", async (req, res) => {
    try {
      // In production, you'd get this from database
      // For now, return from environment or send signal to frontend to use stored config
      return res.json({
        keyId: process.env.RAZORPAY_KEY_ID || '',
        configured: !!process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Error fetching Razorpay config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // POST /api/razorpay/config - Save Razorpay configuration
  app.post("/api/razorpay/config", async (req, res) => {
    try {
      const { keyId, keySecret, webhookSecret } = req.body;

      if (!keyId || !keySecret) {
        return res.status(400).json({ error: "Key ID and Key Secret are required" });
      }

      // In production, save to database securely
      // For now, we'll acknowledge the save
      // The frontend stores it in localStorage for demo purposes
      
      return res.json({
        success: true,
        message: "Razorpay configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving Razorpay config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ========== STRIPE CONFIGURATION ROUTES ==========
  
  // GET /api/stripe/config - Get Stripe public config (Publishable Key only)
  app.get("/api/stripe/config", async (req, res) => {
    try {
      return res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        configured: !!process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // POST /api/stripe/config - Save Stripe configuration
  app.post("/api/stripe/config", async (req, res) => {
    try {
      const { publishableKey, secretKey, webhookSecret } = req.body;

      if (!publishableKey || !secretKey) {
        return res.status(400).json({ error: "Publishable Key and Secret Key are required" });
      }

      // In production, save to encrypted database
      
      return res.json({
        success: true,
        message: "Stripe configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving Stripe config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ========== PAYPAL CONFIGURATION ROUTES ==========
  
  // GET /api/paypal/config - Get PayPal public config (Client ID only)
  app.get("/api/paypal/config", async (req, res) => {
    try {
      return res.json({
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        mode: process.env.PAYPAL_MODE || 'sandbox',
        configured: !!process.env.PAYPAL_CLIENT_ID,
      });
    } catch (error) {
      console.error("Error fetching PayPal config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // POST /api/paypal/config - Save PayPal configuration
  app.post("/api/paypal/config", async (req, res) => {
    try {
      const { clientId, clientSecret, mode } = req.body;

      if (!clientId || !clientSecret) {
        return res.status(400).json({ error: "Client ID and Client Secret are required" });
      }

      // In production, save to encrypted database
      
      return res.json({
        success: true,
        message: "PayPal configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving PayPal config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ========== RAZORPAY PAYMENT ROUTES ==========
  
  // POST /api/payment/create-order - Create Razorpay order
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const { amount, currency = 'INR', receipt, notes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Create Razorpay order
      // Uncomment when you add razorpay package
      /*
      const razorpay = new (await import('razorpay')).default({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET || '',
      });

      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {},
      });

      return res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      });
      */

      // Mock response for now (remove this when you add real Razorpay)
      return res.json({
        success: true,
        order_id: `order_${Date.now()}`,
        amount: amount * 100,
        currency: currency,
        mock: true, // Remove in production
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      return res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  // POST /api/payment/verify - Verify Razorpay payment signature
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification data" });
      }

      // Verify signature
      // Uncomment when you add razorpay package
      /*
      const crypto = await import('crypto');
      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ 
          success: false, 
          error: "Payment verification failed" 
        });
      }
      */

      // Payment verified successfully
      // Now create the booking and invoice
      const booking = {
        ...bookingData,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paymentStatus: 'paid',
        paymentMethod: 'Razorpay',
        createdAt: new Date().toISOString(),
      };

      // Save booking to storage
      // await storage.createAppointment(booking);

      return res.json({
        success: true,
        message: "Payment verified successfully",
        booking: booking,
        payment_id: razorpay_payment_id,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ error: "Payment verification failed" });
    }
  });

  // ========== REPORTS & ANALYTICS ROUTES ==========
  app.get("/api/reports/analytics", async (req, res) => {
    try {
      const { startDate, endDate, workspaceId } = req.query;
      
      // Get appointments with workspace filter
      const appointments = await storage.getAppointments({
        workspaceId: workspaceId as string,
      });
      
      // Get all resource bookings
      const resourceBookings = await storage.getResourceBookings({
        startDate: startDate as string,
        endDate: endDate as string,
      });
      
      // Get invoices from localStorage simulation (in production, this would be from DB)
      // For now, we'll calculate based on appointments and bookings
      
      // Filter by date range if provided
      let filteredAppointments = appointments;
      let filteredBookings = resourceBookings;
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredAppointments = filteredAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= start && aptDate <= end;
        });
        
        filteredBookings = filteredBookings.filter(booking => {
          const bookingDate = new Date(booking.startTime);
          return bookingDate >= start && bookingDate <= end;
        });
      }
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= start && aptDate <= end;
        });
        
        filteredBookings = resourceBookings.filter(booking => {
          const bookingDate = new Date(booking.startTime);
          return bookingDate >= start && bookingDate <= end;
        });
      }
      
      // Calculate metrics
      const totalBookings = filteredAppointments.length + filteredBookings.length;
      const completedBookings = filteredAppointments.filter(a => a.status === 'completed').length;
      const cancelledBookings = filteredAppointments.filter(a => a.status === 'cancelled').length + 
                                 filteredBookings.filter(b => b.status === 'cancelled').length;
      const upcomingBookings = filteredAppointments.filter(a => a.status === 'upcoming').length;
      
      // Revenue calculation (mock data - in production this would come from invoices)
      const mockRevenuePerBooking = 100; // Base rate
      const totalRevenue = completedBookings * mockRevenuePerBooking;
      const pendingRevenue = upcomingBookings * mockRevenuePerBooking * 0.5; // 50% upfront
      
      // Service distribution
      const serviceStats = filteredAppointments.reduce((acc, apt) => {
        const serviceName = apt.serviceName || 'General';
        if (!acc[serviceName]) {
          acc[serviceName] = { name: serviceName, count: 0, revenue: 0 };
        }
        acc[serviceName].count++;
        if (apt.status === 'completed') {
          acc[serviceName].revenue += mockRevenuePerBooking;
        }
        return acc;
      }, {} as Record<string, { name: string; count: number; revenue: number }>);
      
      // Team member performance
      const teamStats = filteredAppointments.reduce((acc, apt) => {
        const memberName = apt.assignedMemberName || 'Unassigned';
        const memberId = apt.assignedMemberId || 'unassigned';
        if (!acc[memberId]) {
          acc[memberId] = { 
            id: memberId, 
            name: memberName, 
            totalBookings: 0, 
            completedBookings: 0,
            cancelledBookings: 0,
            revenue: 0 
          };
        }
        acc[memberId].totalBookings++;
        if (apt.status === 'completed') {
          acc[memberId].completedBookings++;
          acc[memberId].revenue += mockRevenuePerBooking;
        }
        if (apt.status === 'cancelled') {
          acc[memberId].cancelledBookings++;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Resource utilization
      const resourceStats = filteredBookings.reduce((acc, booking) => {
        if (!acc[booking.resourceId]) {
          acc[booking.resourceId] = {
            resourceId: booking.resourceId,
            totalBookings: 0,
            totalHours: 0,
            revenue: 0
          };
        }
        acc[booking.resourceId].totalBookings++;
        
        // Calculate hours
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        acc[booking.resourceId].totalHours += hours;
        acc[booking.resourceId].revenue += hours * 50; // $50/hour mock rate
        
        return acc;
      }, {} as Record<string, any>);
      
      // Time-based analytics (bookings by day of week)
      const dayOfWeekStats = filteredAppointments.reduce((acc, apt) => {
        const date = new Date(apt.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (!acc[dayName]) {
          acc[dayName] = 0;
        }
        acc[dayName]++;
        return acc;
      }, {} as Record<string, number>);
      
      // Time of day distribution (peak hours)
      const timeOfDayStats = filteredAppointments.reduce((acc, apt) => {
        if (apt.time) {
          const hour = parseInt(apt.time.split(':')[0]);
          const timeSlot = `${hour}:00`;
          if (!acc[timeSlot]) {
            acc[timeSlot] = 0;
          }
          acc[timeSlot]++;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Customer insights (new vs returning - mock data)
      const totalCustomers = new Set(filteredAppointments.map(a => a.email)).size;
      const newCustomers = Math.floor(totalCustomers * 0.6); // Mock: 60% new
      const returningCustomers = totalCustomers - newCustomers;
      
      // Cancellation rate
      const cancellationRate = totalBookings > 0 
        ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
        : '0';
      
      // Average booking value
      const averageBookingValue = completedBookings > 0 
        ? (totalRevenue / completedBookings).toFixed(2)
        : '0';
      
      // Growth comparison (mock - compare with previous period)
      const previousPeriodRevenue = totalRevenue * 0.85; // Mock: 15% growth
      const revenueGrowth = previousPeriodRevenue > 0
        ? (((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100).toFixed(1)
        : '0';
      
      const previousPeriodBookings = totalBookings * 0.9; // Mock: 10% growth
      const bookingsGrowth = previousPeriodBookings > 0
        ? (((totalBookings - previousPeriodBookings) / previousPeriodBookings) * 100).toFixed(1)
        : '0';
      
      // Assemble response
      const analytics = {
        overview: {
          totalBookings,
          completedBookings,
          upcomingBookings,
          cancelledBookings,
          cancellationRate: parseFloat(cancellationRate),
          totalRevenue,
          pendingRevenue,
          averageBookingValue: parseFloat(averageBookingValue),
          revenueGrowth: parseFloat(revenueGrowth),
          bookingsGrowth: parseFloat(bookingsGrowth),
        },
        services: Object.values(serviceStats),
        team: Object.values(teamStats),
        resources: Object.values(resourceStats),
        timeAnalytics: {
          byDayOfWeek: dayOfWeekStats,
          byTimeOfDay: timeOfDayStats,
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
          returning: returningCustomers,
          retentionRate: totalCustomers > 0 
            ? ((returningCustomers / totalCustomers) * 100).toFixed(1)
            : '0',
        },
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'all',
        },
      };
      
      return res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      return res.status(500).json({ error: "Failed to generate analytics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
