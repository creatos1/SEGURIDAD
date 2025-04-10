import { 
  type User, type InsertUser, type Vehicle, type InsertVehicle, type Route, type InsertRoute,
  type RouteStop, type InsertRouteStop, type Assignment, type InsertAssignment,
  type DriverRating, type InsertDriverRating, type LocationUpdate, type InsertLocationUpdate,
  UserRole
} from "@shared/schema";
import { db } from "./db";
import * as expressSession from "express-session";
import createMemoryStore from "memorystore";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import {
  users, vehicles, routes, routeStops, assignments,
  driverRatings, locationUpdates
} from "@shared/schema";


// Create a memory store using the express-session module
const MemoryStore = createMemoryStore(expressSession.default);
const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Vehicle methods
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getAllVehicles(): Promise<Vehicle[]>;
  getActiveVehicles(): Promise<Vehicle[]>;
  updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Route methods
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  getAllRoutes(): Promise<Route[]>;
  getActiveRoutes(): Promise<Route[]>;
  updateRoute(id: number, routeData: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: number): Promise<boolean>;

  // RouteStop methods
  getRouteStop(id: number): Promise<RouteStop | undefined>;
  createRouteStop(routeStop: InsertRouteStop): Promise<RouteStop>;
  getRouteStopsByRouteId(routeId: number): Promise<RouteStop[]>;
  updateRouteStop(id: number, routeStopData: Partial<InsertRouteStop>): Promise<RouteStop | undefined>;
  deleteRouteStop(id: number): Promise<boolean>;

  // Assignment methods
  getAssignment(id: number): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignmentsByDriverId(driverId: number): Promise<Assignment[]>;
  getAssignmentsByVehicleId(vehicleId: number): Promise<Assignment[]>;
  getAssignmentsByRouteId(routeId: number): Promise<Assignment[]>;
  getActiveAssignments(): Promise<Assignment[]>;
  updateAssignment(id: number, assignmentData: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;

  // DriverRating methods
  getDriverRating(id: number): Promise<DriverRating | undefined>;
  createDriverRating(driverRating: InsertDriverRating): Promise<DriverRating>;
  getDriverRatingsByDriverId(driverId: number): Promise<DriverRating[]>;
  getDriverRatingsByUserId(userId: number): Promise<DriverRating[]>;
  getAverageDriverRating(driverId: number): Promise<number | null>;
  updateDriverRating(id: number, driverRatingData: Partial<InsertDriverRating>): Promise<DriverRating | undefined>;
  deleteDriverRating(id: number): Promise<boolean>;

  // LocationUpdate methods
  getLocationUpdate(id: number): Promise<LocationUpdate | undefined>;
  createLocationUpdate(locationUpdate: InsertLocationUpdate): Promise<LocationUpdate>;
  getLatestLocationUpdateByAssignmentId(assignmentId: number): Promise<LocationUpdate | undefined>;
  getLocationUpdatesByAssignmentId(assignmentId: number): Promise<LocationUpdate[]>;

  // Session store
  sessionStore: any; // Using 'any' type for session store
}

// Implementación de la interfaz IStorage con la base de datos PostgreSQL
export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using 'any' type for session store

  constructor() {
    // Inicializar session store con memoria para desarrollo
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // Helper methods to map database rows to objects
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role,
      fullName: row.full_name,
      profileImage: row.profile_image,
      createdAt: row.created_at
    };
  }

  private mapRowToVehicle(row: any): Vehicle {
    return {
      id: row.id,
      vehicleNumber: row.vehicle_number,
      vehicleType: row.vehicle_type,
      capacity: row.capacity,
      status: row.status,
      fuelStatus: row.fuel_status,
      lastMaintenance: row.last_maintenance,
      nextMaintenance: row.next_maintenance,
      createdAt: row.created_at
    };
  }

  private mapRowToRoute(row: any): Route {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      description: row.description,
      startLocation: row.start_location,
      endLocation: row.end_location,
      waypoints: row.waypoints,
      frequency: row.frequency,
      createdBy: row.created_by,
      createdAt: row.created_at,
      vehicleId: row.vehicle_id // Added vehicleId
    };
  }

  private mapRowToRouteStop(row: any): RouteStop {
    return {
      id: row.id,
      name: row.name,
      routeId: row.route_id,
      location: row.location,
      arrivalTime: row.arrival_time,
      departureTime: row.departure_time,
      order: row.order
    };
  }

  private mapRowToAssignment(row: any): Assignment {
    return {
      id: row.id,
      routeId: row.route_id,
      driverId: row.driver_id,
      vehicleId: row.vehicle_id,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      createdAt: row.created_at
    };
  }

  private mapRowToDriverRating(row: any): DriverRating {
    return {
      id: row.id,
      driverId: row.driver_id,
      userId: row.user_id,
      rating: row.rating,
      comment: row.comment,
      assignmentId: row.assignment_id,
      createdAt: row.created_at
    };
  }

  private mapRowToLocationUpdate(row: any): LocationUpdate {
    return {
      id: row.id,
      assignmentId: row.assignment_id,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      speed: row.speed,
      heading: row.heading,
      timestamp: row.timestamp
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id)
      });
      return result ? this.mapRowToUser(result) : undefined;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result.length > 0 ? this.mapRowToUser(result[0]) : undefined;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result.length > 0 ? this.mapRowToUser(result[0]) : undefined;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Generar salt y hash de la contraseña
      const salt = randomBytes(16).toString('hex');
      const hashedBuffer = (await scryptAsync(insertUser.password, salt, 64)) as Buffer;
      const hashedPassword = `${hashedBuffer.toString('hex')}.${salt}`;

      const newUser = await db.insert(users).values({
        ...insertUser,
        password: hashedPassword,
        role: insertUser.role || UserRole.USER,
        fullName: insertUser.fullName || null,
        profileImage: insertUser.profileImage || null,
        createdAt: new Date().toISOString()
      }).returning();

      return newUser[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users);
      return result.map(row => this.mapRowToUser(row));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const result = await db.select().from(users).where(eq(users.role, role));
      return result.map(row => this.mapRowToUser(row));
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      return [];
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Si se va a actualizar la contraseña, hashearla primero
      if (userData.password) {
        userData = {
          ...userData,
          password: await hashPassword(userData.password)
        };
      }

      const updatedUser = await db.update(users).set(userData).where(eq(users.id,id)).returning();
      return updatedUser.length > 0 ? this.mapRowToUser(updatedUser[0]) : undefined;

    } catch (error) {
      console.error('Error in updateUser:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return false;
    }
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    try {
      const result = await db.query.vehicles.findFirst({
        where: (vehicles, { eq }) => eq(vehicles.id, id)
      });
      return result ? this.mapRowToVehicle(result) : undefined;
    } catch (error) {
      console.error('Error in getVehicle:', error);
      return undefined;
    }
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    try {
      const result = await db.insert(vehicles).values({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        status: vehicle.status || 'inactive',
        fuelStatus: vehicle.fuelStatus || 0,
        lastMaintenance: vehicle.lastMaintenance || null,
        nextMaintenance: vehicle.nextMaintenance || null
      }).returning();

      return this.mapRowToVehicle(result[0]);
    } catch (error) {
      console.error('Error in createVehicle:', error);
      throw error;
    }
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const result = await db.select().from(vehicles);
      return result.map(row => this.mapRowToVehicle(row));
    } catch (error) {
      console.error('Error in getAllVehicles:', error);
      return [];
    }
  }

  async getActiveVehicles(): Promise<Vehicle[]> {
    try {
      const result = await db.select({id: vehicles.id, vehicle_number: vehicles.vehicleNumber, vehicle_type: vehicles.vehicleType, capacity: vehicles.capacity, status: vehicles.status}).from(vehicles).where(eq(vehicles.status, 'active'));
      return result.map(row => this.mapRowToVehicle(row));
    } catch (error) {
      console.error('Error in getActiveVehicles:', error);
      return [];
    }
  }

  async updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    try {
      const updatedVehicle = await db.update(vehicles).set(vehicleData).where(eq(vehicles.id, id)).returning();
      return updatedVehicle.length > 0 ? this.mapRowToVehicle(updatedVehicle[0]) : undefined;
    } catch (error) {
      console.error('Error in updateVehicle:', error);
      return undefined;
    }
  }

  async deleteVehicle(id: number): Promise<boolean> {
    try {
      const result = await db.delete(vehicles).where(eq(vehicles.id, id));
      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteVehicle:', error);
      return false;
    }
  }

  // Route methods
  async getRoute(id: number): Promise<Route | undefined> {
    try {
      const result = await db.query.routes.findFirst({
        where: (routes, { eq }) => eq(routes.id, id)
      });
      return result ? this.mapRowToRoute(result) : undefined;
    } catch (error) {
      console.error('Error in getRoute:', error);
      return undefined;
    }
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    try {
      // Verify vehicle exists if vehicleId is provided
      if (route.vehicleId) {
        const vehicle = await this.getVehicle(route.vehicleId);
        if (!vehicle) {
          throw new Error('Vehicle not found');
        }
      }
      const result = await db.insert(routes).values(route).returning();
      return this.mapRowToRoute(result[0]);
    } catch (error) {
      console.error('Error in createRoute:', error);
      throw error;
    }
  }

  async getAllRoutes(): Promise<Route[]> {
    try {
      const result = await db.select().from(routes);
      return result.map(row => this.mapRowToRoute(row));
    } catch (error) {
      console.error('Error in getAllRoutes:', error);
      return [];
    }
  }

  async getActiveRoutes(): Promise<Route[]> {
    try {
      const result = await db.select().from(routes).where(eq(routes.status, 'active'));
      return result.map(row => this.mapRowToRoute(row));
    } catch (error) {
      console.error('Error in getActiveRoutes:', error);
      return [];
    }
  }

  async updateRoute(id: number, routeData: Partial<InsertRoute>): Promise<Route | undefined> {
    try {
      const updatedRoute = await db.update(routes).set(routeData).where(eq(routes.id, id)).returning();
      return updatedRoute.length > 0 ? this.mapRowToRoute(updatedRoute[0]) : undefined;
    } catch (error) {
      console.error('Error in updateRoute:', error);
      return undefined;
    }
  }

  async deleteRoute(id: number): Promise<boolean> {
    try {
      await db.delete(routes).where(eq(routes.id, id));
      return true;
    } catch (error) {
      console.error('Error in deleteRoute:', error);
      return false;
    }
  }

  // RouteStop methods
  async getRouteStop(id: number): Promise<RouteStop | undefined> {
    try {
      const result = await db.query.routeStops.findFirst({
        where: (routeStops, { eq }) => eq(routeStops.id, id)
      });
      return result ? this.mapRowToRouteStop(result) : undefined;
    } catch (error) {
      console.error('Error in getRouteStop:', error);
      return undefined;
    }
  }

  async createRouteStop(routeStop: InsertRouteStop): Promise<RouteStop> {
    try {
      const result = await db.insert(routeStops).values(routeStop).returning();
      return this.mapRowToRouteStop(result[0]);
    } catch (error) {
      console.error('Error in createRouteStop:', error);
      throw error;
    }
  }

  async getRouteStopsByRouteId(routeId: number): Promise<RouteStop[]> {
    try {
      const result = await db.select().from(routeStops).where(eq(routeStops.routeId, routeId)).orderBy(routeStops.order);
      return result.map(row => this.mapRowToRouteStop(row));
    } catch (error) {
      console.error('Error in getRouteStopsByRouteId:', error);
      return [];
    }
  }

  async updateRouteStop(id: number, routeStopData: Partial<InsertRouteStop>): Promise<RouteStop | undefined> {
    try {
      const updatedRouteStop = await db.update(routeStops).set(routeStopData).where(eq(routeStops.id, id)).returning();
      return updatedRouteStop.length > 0 ? this.mapRowToRouteStop(updatedRouteStop[0]) : undefined;
    } catch (error) {
      console.error('Error in updateRouteStop:', error);
      return undefined;
    }
  }

  async deleteRouteStop(id: number): Promise<boolean> {
    try {
      const result = await db.delete(routeStops).where(eq(routeStops.id, id));
      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteRouteStop:', error);
      return false;
    }
  }

  // Assignment methods
  async getAssignment(id: number): Promise<Assignment | undefined> {
    try {
      const result = await db.query.assignments.findFirst({
        where: (assignments, { eq }) => eq(assignments.id, id)
      });
      return result ? this.mapRowToAssignment(result) : undefined;
    } catch (error) {
      console.error('Error in getAssignment:', error);
      return undefined;
    }
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    try {
      const result = await db.insert(assignments).values(assignment).returning();
      return this.mapRowToAssignment(result[0]);
    } catch (error) {
      console.error('Error in createAssignment:', error);
      throw error;
    }
  }

  async getAssignmentsByDriverId(driverId: number): Promise<Assignment[]> {
    try {
      const result = await db.select().from(assignments).where(eq(assignments.driverId, driverId));
      return result.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getAssignmentsByDriverId:', error);
      return [];
    }
  }

  async getAssignmentsByVehicleId(vehicleId: number): Promise<Assignment[]> {
    try {
      const result = await db.select().from(assignments).where(eq(assignments.vehicleId, vehicleId));
      return result.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getAssignmentsByVehicleId:', error);
      return [];
    }
  }

  async getAssignmentsByRouteId(routeId: number): Promise<Assignment[]> {
    try {
      const result = await db.select().from(assignments).where(eq(assignments.routeId, routeId));
      return result.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getAssignmentsByRouteId:', error);
      return [];
    }
  }

  async getActiveAssignments(): Promise<Assignment[]> {
    try {
      const result = await db.select().from(assignments).where(eq(assignments.status, 'in-progress'));
      return result.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getActiveAssignments:', error);
      return [];
    }
  }

  async updateAssignment(id: number, assignmentData: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    try {
      const updatedAssignment = await db.update(assignments).set(assignmentData).where(eq(assignments.id, id)).returning();
      return updatedAssignment.length > 0 ? this.mapRowToAssignment(updatedAssignment[0]) : undefined;
    } catch (error) {
      console.error('Error in updateAssignment:', error);
      return undefined;
    }
  }

  async deleteAssignment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assignments).where(eq(assignments.id, id));
      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteAssignment:', error);
      return false;
    }
  }

  // DriverRating methods
  async getDriverRating(id: number): Promise<DriverRating | undefined> {
    try {
      const result = await db.query.driverRatings.findFirst({
        where: (driverRatings, { eq }) => eq(driverRatings.id, id)
      });
      return result ? this.mapRowToDriverRating(result) : undefined;
    } catch (error) {
      console.error('Error in getDriverRating:', error);
      return undefined;
    }
  }

  async createDriverRating(driverRating: InsertDriverRating): Promise<DriverRating> {
    try {
      const result = await db.insert(driverRatings).values(driverRating).returning();
      return this.mapRowToDriverRating(result[0]);
    } catch (error) {
      console.error('Error in createDriverRating:', error);
      throw error;
    }
  }

  async getDriverRatingsByDriverId(driverId: number): Promise<DriverRating[]> {
    try {
      const result = await db.select().from(driverRatings).where(eq(driverRatings.driverId, driverId));
      return result.map(row => this.mapRowToDriverRating(row));
    } catch (error) {
      console.error('Error in getDriverRatingsByDriverId:', error);
      return [];
    }
  }

  async getDriverRatingsByUserId(userId: number): Promise<DriverRating[]> {
    try {
      const result = await db.select().from(driverRatings).where(eq(driverRatings.userId, userId));
      return result.map(row => this.mapRowToDriverRating(row));
    } catch (error) {
      console.error('Error in getDriverRatingsByUserId:', error);
      return [];
    }
  }

  async getAverageDriverRating(driverId: number): Promise<number | null> {
    try {
      const result = await db.query.driverRatings.aggregate({
        avgRating: db.sql`AVG(rating)`,
      }).where(eq(driverRatings.driverId, driverId));
      return result.avgRating;
    } catch (error) {
      console.error('Error in getAverageDriverRating:', error);
      return null;
    }
  }

  async updateDriverRating(id: number, driverRatingData: Partial<InsertDriverRating>): Promise<DriverRating | undefined> {
    try {
      const updatedDriverRating = await db.update(driverRatings).set(driverRatingData).where(eq(driverRatings.id, id)).returning();
      return updatedDriverRating.length > 0 ? this.mapRowToDriverRating(updatedDriverRating[0]) : undefined;
    } catch (error) {
      console.error('Error in updateDriverRating:', error);
      return undefined;
    }
  }

  async deleteDriverRating(id: number): Promise<boolean> {
    try {
      const result = await db.delete(driverRatings).where(eq(driverRatings.id, id));
      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteDriverRating:', error);
      return false;
    }
  }

  // LocationUpdate methods
  async getLocationUpdate(id: number): Promise<LocationUpdate | undefined> {
    try {
      const result = await db.query.locationUpdates.findFirst({
        where: (locationUpdates, { eq }) => eq(locationUpdates.id, id)
      });
      return result ? this.mapRowToLocationUpdate(result) : undefined;
    } catch (error) {
      console.error('Error in getLocationUpdate:', error);
      return undefined;
    }
  }

  async createLocationUpdate(locationUpdate: InsertLocationUpdate): Promise<LocationUpdate> {
    try {
      const result = await db.insert(locationUpdates).values(locationUpdate).returning();
      return this.mapRowToLocationUpdate(result[0]);
    } catch (error) {
      console.error('Error in createLocationUpdate:', error);
      throw error;
    }
  }

  async getLatestLocationUpdateByAssignmentId(assignmentId: number): Promise<LocationUpdate | undefined> {
    try {
      const result = await db.select().from(locationUpdates).where(eq(locationUpdates.assignmentId, assignmentId)).orderBy(locationUpdates.timestamp, {direction: 'desc'}).limit(1);
      return result.length > 0 ? this.mapRowToLocationUpdate(result[0]) : undefined;
    } catch (error) {
      console.error('Error in getLatestLocationUpdateByAssignmentId:', error);
      return undefined;
    }
  }

  async getLocationUpdatesByAssignmentId(assignmentId: number): Promise<LocationUpdate[]> {
    try {
      const result = await db.select().from(locationUpdates).where(eq(locationUpdates.assignmentId, assignmentId)).orderBy(locationUpdates.timestamp, {direction: 'desc'});
      return result.map(row => this.mapRowToLocationUpdate(row));
    } catch (error) {
      console.error('Error in getLocationUpdatesByAssignmentId:', error);
      return [];
    }
  }
}

// Usar almacenamiento en base de datos en lugar de memoria
export const storage = new DatabaseStorage();