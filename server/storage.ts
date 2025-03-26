import { 
  users, vehicles, routes, routeStops, assignments, driverRatings, locationUpdates,
  type User, type InsertUser, type Vehicle, type InsertVehicle, type Route, type InsertRoute,
  type RouteStop, type InsertRouteStop, type Assignment, type InsertAssignment,
  type DriverRating, type InsertDriverRating, type LocationUpdate, type InsertLocationUpdate,
  UserRole
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql as drizzleSql } from "drizzle-orm";
import * as expressSession from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private vehiclesMap: Map<number, Vehicle>;
  private routesMap: Map<number, Route>;
  private routeStopsMap: Map<number, RouteStop>;
  private assignmentsMap: Map<number, Assignment>;
  private driverRatingsMap: Map<number, DriverRating>;
  private locationUpdatesMap: Map<number, LocationUpdate>;
  private currentId: { [key: string]: number };
  sessionStore: any; // Using 'any' type for session store

  constructor() {
    this.usersMap = new Map();
    this.vehiclesMap = new Map();
    this.routesMap = new Map();
    this.routeStopsMap = new Map();
    this.assignmentsMap = new Map();
    this.driverRatingsMap = new Map();
    this.locationUpdatesMap = new Map();
    this.currentId = {
      users: 1,
      vehicles: 1,
      routes: 1,
      routeStops: 1,
      assignments: 1,
      driverRatings: 1,
      locationUpdates: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    // Initialize the database with default users
    this.initializeDefaultData();
  }

  // Initialize default data
  private async initializeDefaultData() {
    try {
      // Create default admin user
      await this.createUser({
        username: "admin",
        email: "admin@transitpro.com",
        password: "admin123",
        role: UserRole.ADMIN,
        fullName: "Admin User"
      });

      // Create default normal user
      await this.createUser({
        username: "user",
        email: "user@example.com",
        password: "user123",
        role: UserRole.USER,
        fullName: "Regular User"
      });

      // Create default driver user
      await this.createUser({
        username: "driver",
        email: "driver@transitpro.com",
        password: "driver123",
        role: UserRole.DRIVER,
        fullName: "Carlos Mendez"
      });
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const timestamp = new Date();
    
    // Hash the password before storing
    const hashedPassword = await hashPassword(insertUser.password);
    
    const user: User = { 
      ...insertUser, 
      password: hashedPassword,
      id, 
      createdAt: timestamp,
      role: insertUser.role || UserRole.USER, // Ensure role is not undefined
      fullName: insertUser.fullName || null,
      profileImage: insertUser.profileImage || null
    };
    
    this.usersMap.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(
      (user) => user.role === role
    );
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    // If password is being updated, hash it
    if (userData.password) {
      userData = { 
        ...userData, 
        password: await hashPassword(userData.password) 
      };
    }
    
    const updatedUser: User = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehiclesMap.get(id);
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentId.vehicles++;
    const timestamp = new Date();
    const newVehicle: Vehicle = { ...vehicle, id, createdAt: timestamp };
    this.vehiclesMap.set(id, newVehicle);
    return newVehicle;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehiclesMap.values());
  }

  async getActiveVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehiclesMap.values()).filter(
      (vehicle) => vehicle.status === "active"
    );
  }

  async updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehiclesMap.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle: Vehicle = { ...vehicle, ...vehicleData };
    this.vehiclesMap.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehiclesMap.delete(id);
  }

  // Route methods
  async getRoute(id: number): Promise<Route | undefined> {
    return this.routesMap.get(id);
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const id = this.currentId.routes++;
    const timestamp = new Date();
    const newRoute: Route = { ...route, id, createdAt: timestamp };
    this.routesMap.set(id, newRoute);
    return newRoute;
  }

  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routesMap.values());
  }

  async getActiveRoutes(): Promise<Route[]> {
    return Array.from(this.routesMap.values()).filter(
      (route) => route.status === "active"
    );
  }

  async updateRoute(id: number, routeData: Partial<InsertRoute>): Promise<Route | undefined> {
    const route = this.routesMap.get(id);
    if (!route) return undefined;
    
    const updatedRoute: Route = { ...route, ...routeData };
    this.routesMap.set(id, updatedRoute);
    return updatedRoute;
  }

  async deleteRoute(id: number): Promise<boolean> {
    return this.routesMap.delete(id);
  }

  // RouteStop methods
  async getRouteStop(id: number): Promise<RouteStop | undefined> {
    return this.routeStopsMap.get(id);
  }

  async createRouteStop(routeStop: InsertRouteStop): Promise<RouteStop> {
    const id = this.currentId.routeStops++;
    const newRouteStop: RouteStop = { ...routeStop, id };
    this.routeStopsMap.set(id, newRouteStop);
    return newRouteStop;
  }

  async getRouteStopsByRouteId(routeId: number): Promise<RouteStop[]> {
    return Array.from(this.routeStopsMap.values())
      .filter((stop) => stop.routeId === routeId)
      .sort((a, b) => a.order - b.order);
  }

  async updateRouteStop(id: number, routeStopData: Partial<InsertRouteStop>): Promise<RouteStop | undefined> {
    const routeStop = this.routeStopsMap.get(id);
    if (!routeStop) return undefined;
    
    const updatedRouteStop: RouteStop = { ...routeStop, ...routeStopData };
    this.routeStopsMap.set(id, updatedRouteStop);
    return updatedRouteStop;
  }

  async deleteRouteStop(id: number): Promise<boolean> {
    return this.routeStopsMap.delete(id);
  }

  // Assignment methods
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignmentsMap.get(id);
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentId.assignments++;
    const timestamp = new Date();
    const newAssignment: Assignment = { ...assignment, id, createdAt: timestamp };
    this.assignmentsMap.set(id, newAssignment);
    return newAssignment;
  }

  async getAssignmentsByDriverId(driverId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      (assignment) => assignment.driverId === driverId
    );
  }

  async getAssignmentsByVehicleId(vehicleId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      (assignment) => assignment.vehicleId === vehicleId
    );
  }

  async getAssignmentsByRouteId(routeId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      (assignment) => assignment.routeId === routeId
    );
  }

  async getActiveAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      (assignment) => assignment.status === "in-progress"
    );
  }

  async updateAssignment(id: number, assignmentData: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const assignment = this.assignmentsMap.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment: Assignment = { ...assignment, ...assignmentData };
    this.assignmentsMap.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignmentsMap.delete(id);
  }

  // DriverRating methods
  async getDriverRating(id: number): Promise<DriverRating | undefined> {
    return this.driverRatingsMap.get(id);
  }

  async createDriverRating(driverRating: InsertDriverRating): Promise<DriverRating> {
    const id = this.currentId.driverRatings++;
    const timestamp = new Date();
    const newDriverRating: DriverRating = { ...driverRating, id, createdAt: timestamp };
    this.driverRatingsMap.set(id, newDriverRating);
    return newDriverRating;
  }

  async getDriverRatingsByDriverId(driverId: number): Promise<DriverRating[]> {
    return Array.from(this.driverRatingsMap.values()).filter(
      (rating) => rating.driverId === driverId
    );
  }

  async getDriverRatingsByUserId(userId: number): Promise<DriverRating[]> {
    return Array.from(this.driverRatingsMap.values()).filter(
      (rating) => rating.userId === userId
    );
  }

  async getAverageDriverRating(driverId: number): Promise<number | null> {
    const ratings = await this.getDriverRatingsByDriverId(driverId);
    if (ratings.length === 0) return null;
    
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  }

  async updateDriverRating(id: number, driverRatingData: Partial<InsertDriverRating>): Promise<DriverRating | undefined> {
    const driverRating = this.driverRatingsMap.get(id);
    if (!driverRating) return undefined;
    
    const updatedDriverRating: DriverRating = { ...driverRating, ...driverRatingData };
    this.driverRatingsMap.set(id, updatedDriverRating);
    return updatedDriverRating;
  }

  async deleteDriverRating(id: number): Promise<boolean> {
    return this.driverRatingsMap.delete(id);
  }

  // LocationUpdate methods
  async getLocationUpdate(id: number): Promise<LocationUpdate | undefined> {
    return this.locationUpdatesMap.get(id);
  }

  async createLocationUpdate(locationUpdate: InsertLocationUpdate): Promise<LocationUpdate> {
    const id = this.currentId.locationUpdates++;
    const timestamp = new Date();
    const newLocationUpdate: LocationUpdate = { ...locationUpdate, id, timestamp };
    this.locationUpdatesMap.set(id, newLocationUpdate);
    return newLocationUpdate;
  }

  async getLatestLocationUpdateByAssignmentId(assignmentId: number): Promise<LocationUpdate | undefined> {
    const updates = await this.getLocationUpdatesByAssignmentId(assignmentId);
    if (updates.length === 0) return undefined;
    
    return updates.reduce((latest, current) => 
      latest.timestamp > current.timestamp ? latest : current
    );
  }

  async getLocationUpdatesByAssignmentId(assignmentId: number): Promise<LocationUpdate[]> {
    return Array.from(this.locationUpdatesMap.values())
      .filter((update) => update.assignmentId === assignmentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
