import { sqliteTable as table, text, integer, blob, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const serial = () => integer("id").primaryKey({ autoIncrement: true });
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const UserRole = {
  ADMIN: "admin",
  USER: "user",
  DRIVER: "driver"
} as const;

// Users table
export const users = table("users", {
  id: serial(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: Object.values(UserRole) }).notNull().default(UserRole.USER),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Vehicles table
export const vehicles = table("vehicles", {
  id: serial(),
  vehicleNumber: text("vehicle_number").notNull().unique(),
  vehicleType: text("vehicle_type").notNull(),
  capacity: integer("capacity").notNull(),
  fuelStatus: integer("fuel_status").notNull().default(100),
  lastMaintenance: text("last_maintenance"),
  nextMaintenance: text("next_maintenance"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Routes table
export const routes = table("routes", {
  id: serial(),
  name: text("name").notNull(),
  description: text("description"),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  coordinates: text("coordinates"), // Stored as JSON string
  waypoints: text("waypoints"),
  frequency: integer("frequency").notNull(), // in minutes
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer("created_by").references(() => users.id),
});

export const routeCoordinateSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

// Route stops table
export const routeStops = table("route_stops", {
  id: serial(),
  routeId: integer("route_id").notNull().references(() => routes.id),
  name: text("name").notNull(),
  location: text("location").notNull(),
  arrivalTime: text("arrival_time"), // scheduled arrival time
  departureTime: text("departure_time"), // scheduled departure time
  order: integer("order").notNull(),
});

// Drivers-Vehicles-Routes assignment table
export const assignments = table("assignments", {
  id: serial(),
  driverId: integer("driver_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  routeId: integer("route_id").notNull().references(() => routes.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  status: text("status").notNull().default("scheduled"), // scheduled, in-progress, completed, cancelled
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Driver ratings table
export const driverRatings = table("driver_ratings", {
  id: serial(),
  driverId: integer("driver_id").notNull().references(() => users.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  assignmentId: integer("assignment_id").references(() => assignments.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Location updates table (for real-time tracking)
export const locationUpdates = table("location_updates", {
  id: serial(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
  speed: real("speed"),
  heading: real("heading"),
  status: text("status").notNull().default("on-time"), // on-time, delayed, issue
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters")
  });

export const insertVehicleSchema = createInsertSchema(vehicles)
  .omit({ id: true, createdAt: true });

export const routeStopInputSchema = z.object({
  name: z.string(),
  location: z.string(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional()
});

export const insertRouteSchema = createInsertSchema(routes)
  .omit({ id: true, createdAt: true })
  .extend({
    stops: z.array(routeStopInputSchema).optional()
  });

export const insertRouteStopSchema = createInsertSchema(routeStops)
  .omit({ id: true });

export const insertAssignmentSchema = createInsertSchema(assignments)
  .omit({ id: true, createdAt: true });

export const insertDriverRatingSchema = createInsertSchema(driverRatings)
  .omit({ id: true, createdAt: true });

export const insertLocationUpdateSchema = createInsertSchema(locationUpdates)
  .omit({ id: true, timestamp: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type RouteStop = typeof routeStops.$inferSelect;
export type InsertRouteStop = z.infer<typeof insertRouteStopSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type DriverRating = typeof driverRatings.$inferSelect;
export type InsertDriverRating = z.infer<typeof insertDriverRatingSchema>;

export type LocationUpdate = typeof locationUpdates.$inferSelect;
export type InsertLocationUpdate = z.infer<typeof insertLocationUpdateSchema>;