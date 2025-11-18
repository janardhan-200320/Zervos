import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  timezone: text("timezone").default("America/New_York"),
  avatar: text("avatar"),
  emailVerified: text("email_verified").default("false"),
  twoFactorEnabled: text("two_factor_enabled").default("false"),
  twoFactorSecret: text("two_factor_secret"),
  notificationPreferences: jsonb("notification_preferences").default(sql`'{"email": true, "sms": true, "push": false}'`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const onboarding = pgTable("onboarding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  websiteUrl: text("website_url").notNull(),
  currency: text("currency").notNull(),
  industries: text("industries").array().notNull(),
  businessNeeds: text("business_needs").array().notNull(),
  timezone: text("timezone").notNull(),
  availableDays: text("available_days").array().notNull(),
  availableTimeStart: text("available_time_start").notNull(),
  availableTimeEnd: text("available_time_end").notNull(),
  eventTypeLabel: text("event_type_label").notNull(),
  teamMemberLabel: text("team_member_label").notNull(),
});

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // Room, Equipment, Zoom Account, Vehicle, Other
  description: text("description"),
  status: text("status").notNull().default("available"), // available, under_maintenance, booked
  capacity: text("capacity"), // Optional number field stored as text
  assignedUsers: text("assigned_users").array().default(sql`'{}'`), // Array of user IDs
  availabilitySchedule: jsonb("availability_schedule"), // [{day: string, startTime: string, endTime: string}]
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const resourceBookings = pgTable("resource_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  bookedBy: varchar("booked_by").notNull(), // User ID or name
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  location: text("location"),
  lastActive: text("last_active").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertOnboardingSchema = createInsertSchema(onboarding).omit({
  id: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceBookingSchema = createInsertSchema(resourceBookings).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  lastActive: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  phone: true,
  timezone: true,
  avatar: true,
  notificationPreferences: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOnboarding = z.infer<typeof insertOnboardingSchema>;
export type Onboarding = typeof onboarding.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResourceBooking = z.infer<typeof insertResourceBookingSchema>;
export type ResourceBooking = typeof resourceBookings.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
