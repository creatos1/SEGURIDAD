import { pgTable, text, serial, integer, boolean, timestamp, real, doublePrecision, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const UserRole = {
  ADMIN: "admin",
  USER: "user",
  DRIVER: "driver"
} as const;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: Object.values(UserRole) }).notNull().default(UserRole.USER),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleNumber: text("vehicle_number").notNull().unique(),
  vehicleType: text("vehicle_type").notNull(),
  capacity: integer("capacity").notNull(),
  fuelStatus: integer("fuel_status").notNull().default(100),
  lastMaintenance: timestamp("last_maintenance"),
  nextMaintenance: timestamp("next_maintenance"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Routes table
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  coordinates: text("coordinates").array(), // Array of [lat,lng] coordinates
  waypoints: text("waypoints").array(),
  frequency: integer("frequency").notNull(), // in minutes
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const routeCoordinateSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

// Route stops table
export const routeStops = pgTable("route_stops", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => routes.id),
  name: text("name").notNull(),
  location: text("location").notNull(),
  arrivalTime: text("arrival_time"), // scheduled arrival time
  departureTime: text("departure_time"), // scheduled departure time
  order: integer("order").notNull(),
});

// Drivers-Vehicles-Routes assignment table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  routeId: integer("route_id").notNull().references(() => routes.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("scheduled"), // scheduled, in-progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver ratings table
export const driverRatings = pgTable("driver_ratings", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => users.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  assignmentId: integer("assignment_id").references(() => assignments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Location updates table (for real-time tracking)
export const locationUpdates = pgTable("location_updates", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
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
