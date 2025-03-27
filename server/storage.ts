import { 
  type User, type InsertUser, type Vehicle, type InsertVehicle, type Route, type InsertRoute,
  type RouteStop, type InsertRouteStop, type Assignment, type InsertAssignment,
  type DriverRating, type InsertDriverRating, type LocationUpdate, type InsertLocationUpdate,
  UserRole
} from "@shared/schema";
import { pool } from "./db";
import * as expressSession from "express-session";
// @ts-ignore
import pgPkg from "connect-pg-simple";
const connectPgSimple = pgPkg;
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

// Implementación de la interfaz IStorage con la base de datos PostgreSQL
export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using 'any' type for session store

  constructor() {
    // Inicializar session store con PostgreSQL
    const PostgresStore = connectPgSimple(expressSession.default);
    
    this.sessionStore = new PostgresStore({
      pool: pool,
      createTableIfMissing: true
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
      createdAt: row.created_at
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
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Encriptar la contraseña antes de almacenarla
      const hashedPassword = await hashPassword(insertUser.password);
      
      const result = await pool.query(`
        INSERT INTO users (username, email, password, role, full_name, profile_image)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        insertUser.username,
        insertUser.email,
        hashedPassword,
        insertUser.role || UserRole.USER,
        insertUser.fullName || null,
        insertUser.profileImage || null
      ]);
      
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users');
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE role = $1', [role]);
      return result.rows.map(row => this.mapRowToUser(row));
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
      
      // Construir la consulta SQL dinámicamente
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      if (userData.username) {
        setClauses.push(`username = $${paramCount}`);
        values.push(userData.username);
        paramCount++;
      }
      
      if (userData.email) {
        setClauses.push(`email = $${paramCount}`);
        values.push(userData.email);
        paramCount++;
      }
      
      if (userData.password) {
        setClauses.push(`password = $${paramCount}`);
        values.push(userData.password);
        paramCount++;
      }
      
      if (userData.role) {
        setClauses.push(`role = $${paramCount}`);
        values.push(userData.role);
        paramCount++;
      }
      
      if (userData.fullName !== undefined) {
        setClauses.push(`full_name = $${paramCount}`);
        values.push(userData.fullName);
        paramCount++;
      }
      
      if (userData.profileImage !== undefined) {
        setClauses.push(`profile_image = $${paramCount}`);
        values.push(userData.profileImage);
        paramCount++;
      }
      
      // Si no hay nada que actualizar, retornar el usuario actual
      if (setClauses.length === 0) {
        return this.getUser(id);
      }
      
      // Añadir el ID del usuario al array de valores
      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      console.error('Error in updateUser:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return false;
    }
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    try {
      const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToVehicle(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getVehicle:', error);
      return undefined;
    }
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    try {
      const result = await pool.query(`
        INSERT INTO vehicles (vehicle_number, vehicle_type, capacity, status, fuel_status, last_maintenance, next_maintenance)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.capacity,
        vehicle.status || 'inactive',
        vehicle.fuelStatus || 0,
        vehicle.lastMaintenance || null,
        vehicle.nextMaintenance || null
      ]);
      
      return this.mapRowToVehicle(result.rows[0]);
    } catch (error) {
      console.error('Error in createVehicle:', error);
      throw error;
    }
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const result = await pool.query('SELECT * FROM vehicles');
      return result.rows.map(row => this.mapRowToVehicle(row));
    } catch (error) {
      console.error('Error in getAllVehicles:', error);
      return [];
    }
  }

  async getActiveVehicles(): Promise<Vehicle[]> {
    try {
      const result = await pool.query("SELECT * FROM vehicles WHERE status = 'active'");
      return result.rows.map(row => this.mapRowToVehicle(row));
    } catch (error) {
      console.error('Error in getActiveVehicles:', error);
      return [];
    }
  }

  async updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    try {
      // Construir la consulta SQL dinámicamente
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      if (vehicleData.vehicleNumber) {
        setClauses.push(`vehicle_number = $${paramCount}`);
        values.push(vehicleData.vehicleNumber);
        paramCount++;
      }
      
      if (vehicleData.vehicleType) {
        setClauses.push(`vehicle_type = $${paramCount}`);
        values.push(vehicleData.vehicleType);
        paramCount++;
      }
      
      if (vehicleData.capacity !== undefined) {
        setClauses.push(`capacity = $${paramCount}`);
        values.push(vehicleData.capacity);
        paramCount++;
      }
      
      if (vehicleData.status) {
        setClauses.push(`status = $${paramCount}`);
        values.push(vehicleData.status);
        paramCount++;
      }
      
      if (vehicleData.fuelStatus !== undefined) {
        setClauses.push(`fuel_status = $${paramCount}`);
        values.push(vehicleData.fuelStatus);
        paramCount++;
      }
      
      if (vehicleData.lastMaintenance !== undefined) {
        setClauses.push(`last_maintenance = $${paramCount}`);
        values.push(vehicleData.lastMaintenance);
        paramCount++;
      }
      
      if (vehicleData.nextMaintenance !== undefined) {
        setClauses.push(`next_maintenance = $${paramCount}`);
        values.push(vehicleData.nextMaintenance);
        paramCount++;
      }
      
      // Si no hay nada que actualizar, retornar el vehículo actual
      if (setClauses.length === 0) {
        return this.getVehicle(id);
      }
      
      // Añadir el ID del vehículo al array de valores
      values.push(id);
      
      const query = `
        UPDATE vehicles 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToVehicle(result.rows[0]);
    } catch (error) {
      console.error('Error in updateVehicle:', error);
      return undefined;
    }
  }

  async deleteVehicle(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteVehicle:', error);
      return false;
    }
  }

  // Route methods
  async getRoute(id: number): Promise<Route | undefined> {
    try {
      const result = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToRoute(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getRoute:', error);
      return undefined;
    }
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert the route
      const routeResult = await client.query(`
        INSERT INTO routes (name, status, description, start_location, end_location, waypoints, frequency, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        route.name,
        route.status || 'active',
        route.description || null,
        route.startLocation,
        route.endLocation,
        route.waypoints || [],
        route.frequency,
        route.createdBy || null
      ]);

      // If route stops are provided, insert them
      if (route.stops && Array.isArray(route.stops)) {
        for (let i = 0; i < route.stops.length; i++) {
          const stop = route.stops[i];
          await client.query(`
            INSERT INTO route_stops (route_id, name, location, arrival_time, departure_time, "order")
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            routeResult.rows[0].id,
            stop.name,
            stop.location,
            stop.arrivalTime,
            stop.departureTime,
            i + 1
          ]);
        }
      }

      await client.query('COMMIT');
      return this.mapRowToRoute(routeResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in createRoute:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllRoutes(): Promise<Route[]> {
    try {
      const result = await pool.query('SELECT * FROM routes');
      return result.rows.map(row => this.mapRowToRoute(row));
    } catch (error) {
      console.error('Error in getAllRoutes:', error);
      return [];
    }
  }

  async getActiveRoutes(): Promise<Route[]> {
    try {
      const result = await pool.query("SELECT * FROM routes WHERE status = 'active'");
      return result.rows.map(row => this.mapRowToRoute(row));
    } catch (error) {
      console.error('Error in getActiveRoutes:', error);
      return [];
    }
  }

  async updateRoute(id: number, routeData: Partial<InsertRoute>): Promise<Route | undefined> {
    try {
      // Construir la consulta SQL dinámicamente
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      if (routeData.name) {
        setClauses.push(`name = $${paramCount}`);
        values.push(routeData.name);
        paramCount++;
      }
      
      if (routeData.status) {
        setClauses.push(`status = $${paramCount}`);
        values.push(routeData.status);
        paramCount++;
      }
      
      if (routeData.description !== undefined) {
        setClauses.push(`description = $${paramCount}`);
        values.push(routeData.description);
        paramCount++;
      }
      
      if (routeData.startLocation) {
        setClauses.push(`start_location = $${paramCount}`);
        values.push(routeData.startLocation);
        paramCount++;
      }
      
      if (routeData.endLocation) {
        setClauses.push(`end_location = $${paramCount}`);
        values.push(routeData.endLocation);
        paramCount++;
      }
      
      if (routeData.waypoints !== undefined) {
        setClauses.push(`waypoints = $${paramCount}`);
        values.push(routeData.waypoints);
        paramCount++;
      }
      
      if (routeData.frequency !== undefined) {
        setClauses.push(`frequency = $${paramCount}`);
        values.push(routeData.frequency);
        paramCount++;
      }
      
      if (routeData.createdBy !== undefined) {
        setClauses.push(`created_by = $${paramCount}`);
        values.push(routeData.createdBy);
        paramCount++;
      }
      
      // Si no hay nada que actualizar, retornar la ruta actual
      if (setClauses.length === 0) {
        return this.getRoute(id);
      }
      
      // Añadir el ID de la ruta al array de valores
      values.push(id);
      
      const query = `
        UPDATE routes 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToRoute(result.rows[0]);
    } catch (error) {
      console.error('Error in updateRoute:', error);
      return undefined;
    }
  }

  async deleteRoute(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM routes WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteRoute:', error);
      return false;
    }
  }

  // RouteStop methods
  async getRouteStop(id: number): Promise<RouteStop | undefined> {
    try {
      const result = await pool.query('SELECT * FROM route_stops WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToRouteStop(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getRouteStop:', error);
      return undefined;
    }
  }

  async createRouteStop(routeStop: InsertRouteStop): Promise<RouteStop> {
    try {
      const result = await pool.query(`
        INSERT INTO route_stops (name, route_id, location, arrival_time, departure_time, "order")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        routeStop.name,
        routeStop.routeId,
        routeStop.location,
        routeStop.arrivalTime || null,
        routeStop.departureTime || null,
        routeStop.order
      ]);
      
      return this.mapRowToRouteStop(result.rows[0]);
    } catch (error) {
      console.error('Error in createRouteStop:', error);
      throw error;
    }
  }

  async getRouteStopsByRouteId(routeId: number): Promise<RouteStop[]> {
    try {
      const result = await pool.query('SELECT * FROM route_stops WHERE route_id = $1 ORDER BY "order"', [routeId]);
      return result.rows.map(row => this.mapRowToRouteStop(row));
    } catch (error) {
      console.error('Error in getRouteStopsByRouteId:', error);
      return [];
    }
  }

  async updateRouteStop(id: number, routeStopData: Partial<InsertRouteStop>): Promise<RouteStop | undefined> {
    try {
      // Construir la consulta SQL dinámicamente
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      if (routeStopData.name) {
        setClauses.push(`name = $${paramCount}`);
        values.push(routeStopData.name);
        paramCount++;
      }
      
      if (routeStopData.routeId !== undefined) {
        setClauses.push(`route_id = $${paramCount}`);
        values.push(routeStopData.routeId);
        paramCount++;
      }
      
      if (routeStopData.location) {
        setClauses.push(`location = $${paramCount}`);
        values.push(routeStopData.location);
        paramCount++;
      }
      
      if (routeStopData.arrivalTime !== undefined) {
        setClauses.push(`arrival_time = $${paramCount}`);
        values.push(routeStopData.arrivalTime);
        paramCount++;
      }
      
      if (routeStopData.departureTime !== undefined) {
        setClauses.push(`departure_time = $${paramCount}`);
        values.push(routeStopData.departureTime);
        paramCount++;
      }
      
      if (routeStopData.order !== undefined) {
        setClauses.push(`"order" = $${paramCount}`);
        values.push(routeStopData.order);
        paramCount++;
      }
      
      // Si no hay nada que actualizar, retornar la parada actual
      if (setClauses.length === 0) {
        return this.getRouteStop(id);
      }
      
      // Añadir el ID de la parada al array de valores
      values.push(id);
      
      const query = `
        UPDATE route_stops 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToRouteStop(result.rows[0]);
    } catch (error) {
      console.error('Error in updateRouteStop:', error);
      return undefined;
    }
  }

  async deleteRouteStop(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM route_stops WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteRouteStop:', error);
      return false;
    }
  }

  // Assignment methods
  async getAssignment(id: number): Promise<Assignment | undefined> {
    try {
      const result = await pool.query('SELECT * FROM assignments WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToAssignment(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getAssignment:', error);
      return undefined;
    }
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    try {
      const result = await pool.query(`
        INSERT INTO assignments (route_id, driver_id, vehicle_id, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        assignment.routeId,
        assignment.driverId,
        assignment.vehicleId,
        assignment.startTime,
        assignment.endTime || null,
        assignment.status || 'pending'
      ]);
      
      return this.mapRowToAssignment(result.rows[0]);
    } catch (error) {
      console.error('Error in createAssignment:', error);
      throw error;
    }
  }

  async getAssignmentsByDriverId(driverId: number): Promise<Assignment[]> {
    try {
      const result = await pool.query('SELECT * FROM assignments WHERE driver_id = $1', [driverId]);
      return result.rows.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getAssignmentsByDriverId:', error);
      return [];
    }
  }

  async getAssignmentsByVehicleId(vehicleId: number): Promise<Assignment[]> {
    try {
      const result = await pool.query('SELECT * FROM assignments WHERE vehicle_id = $1', [vehicleId]);
      return result.rows.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getAssignmentsByVehicleId:', error);
      return [];
    }
  }

  async getAssignmentsByRouteId(routeId: number): Promise<Assignment[]> {
    try {
      const result = await pool.query('SELECT * FROM assignments WHERE route_id = $1', [routeId]);
      return result.rows.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getAssignmentsByRouteId:', error);
      return [];
    }
  }

  async getActiveAssignments(): Promise<Assignment[]> {
    try {
      const result = await pool.query("SELECT * FROM assignments WHERE status = 'in-progress'");
      return result.rows.map(row => this.mapRowToAssignment(row));
    } catch (error) {
      console.error('Error in getActiveAssignments:', error);
      return [];
    }
  }

  async updateAssignment(id: number, assignmentData: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    try {
      // Construir la consulta SQL dinámicamente
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      if (assignmentData.routeId !== undefined) {
        setClauses.push(`route_id = $${paramCount}`);
        values.push(assignmentData.routeId);
        paramCount++;
      }
      
      if (assignmentData.driverId !== undefined) {
        setClauses.push(`driver_id = $${paramCount}`);
        values.push(assignmentData.driverId);
        paramCount++;
      }
      
      if (assignmentData.vehicleId !== undefined) {
        setClauses.push(`vehicle_id = $${paramCount}`);
        values.push(assignmentData.vehicleId);
        paramCount++;
      }
      
      if (assignmentData.startTime !== undefined) {
        setClauses.push(`start_time = $${paramCount}`);
        values.push(assignmentData.startTime);
        paramCount++;
      }
      
      if (assignmentData.endTime !== undefined) {
        setClauses.push(`end_time = $${paramCount}`);
        values.push(assignmentData.endTime);
        paramCount++;
      }
      
      if (assignmentData.status !== undefined) {
        setClauses.push(`status = $${paramCount}`);
        values.push(assignmentData.status);
        paramCount++;
      }
      
      // Si no hay nada que actualizar, retornar la asignación actual
      if (setClauses.length === 0) {
        return this.getAssignment(id);
      }
      
      // Añadir el ID de la asignación al array de valores
      values.push(id);
      
      const query = `
        UPDATE assignments 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToAssignment(result.rows[0]);
    } catch (error) {
      console.error('Error in updateAssignment:', error);
      return undefined;
    }
  }

  async deleteAssignment(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM assignments WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteAssignment:', error);
      return false;
    }
  }

  // DriverRating methods
  async getDriverRating(id: number): Promise<DriverRating | undefined> {
    try {
      const result = await pool.query('SELECT * FROM driver_ratings WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToDriverRating(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getDriverRating:', error);
      return undefined;
    }
  }

  async createDriverRating(driverRating: InsertDriverRating): Promise<DriverRating> {
    try {
      const result = await pool.query(`
        INSERT INTO driver_ratings (driver_id, user_id, rating, comment, assignment_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        driverRating.driverId,
        driverRating.userId,
        driverRating.rating,
        driverRating.comment || null,
        driverRating.assignmentId || null
      ]);
      
      return this.mapRowToDriverRating(result.rows[0]);
    } catch (error) {
      console.error('Error in createDriverRating:', error);
      throw error;
    }
  }

  async getDriverRatingsByDriverId(driverId: number): Promise<DriverRating[]> {
    try {
      const result = await pool.query('SELECT * FROM driver_ratings WHERE driver_id = $1', [driverId]);
      return result.rows.map(row => this.mapRowToDriverRating(row));
    } catch (error) {
      console.error('Error in getDriverRatingsByDriverId:', error);
      return [];
    }
  }

  async getDriverRatingsByUserId(userId: number): Promise<DriverRating[]> {
    try {
      const result = await pool.query('SELECT * FROM driver_ratings WHERE user_id = $1', [userId]);
      return result.rows.map(row => this.mapRowToDriverRating(row));
    } catch (error) {
      console.error('Error in getDriverRatingsByUserId:', error);
      return [];
    }
  }

  async getAverageDriverRating(driverId: number): Promise<number | null> {
    try {
      const result = await pool.query('SELECT AVG(rating) as average FROM driver_ratings WHERE driver_id = $1', [driverId]);
      const average = result.rows[0]?.average;
      return average ? parseFloat(parseFloat(average).toFixed(1)) : null;
    } catch (error) {
      console.error('Error in getAverageDriverRating:', error);
      return null;
    }
  }

  async updateDriverRating(id: number, driverRatingData: Partial<InsertDriverRating>): Promise<DriverRating | undefined> {
    try {
      // Construir la consulta SQL dinámicamente
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      if (driverRatingData.driverId !== undefined) {
        setClauses.push(`driver_id = $${paramCount}`);
        values.push(driverRatingData.driverId);
        paramCount++;
      }
      
      if (driverRatingData.userId !== undefined) {
        setClauses.push(`user_id = $${paramCount}`);
        values.push(driverRatingData.userId);
        paramCount++;
      }
      
      if (driverRatingData.rating !== undefined) {
        setClauses.push(`rating = $${paramCount}`);
        values.push(driverRatingData.rating);
        paramCount++;
      }
      
      if (driverRatingData.comment !== undefined) {
        setClauses.push(`comment = $${paramCount}`);
        values.push(driverRatingData.comment);
        paramCount++;
      }
      
      if (driverRatingData.assignmentId !== undefined) {
        setClauses.push(`assignment_id = $${paramCount}`);
        values.push(driverRatingData.assignmentId);
        paramCount++;
      }
      
      // Si no hay nada que actualizar, retornar la calificación actual
      if (setClauses.length === 0) {
        return this.getDriverRating(id);
      }
      
      // Añadir el ID de la calificación al array de valores
      values.push(id);
      
      const query = `
        UPDATE driver_ratings 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToDriverRating(result.rows[0]);
    } catch (error) {
      console.error('Error in updateDriverRating:', error);
      return undefined;
    }
  }

  async deleteDriverRating(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM driver_ratings WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteDriverRating:', error);
      return false;
    }
  }

  // LocationUpdate methods
  async getLocationUpdate(id: number): Promise<LocationUpdate | undefined> {
    try {
      const result = await pool.query('SELECT * FROM location_updates WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToLocationUpdate(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getLocationUpdate:', error);
      return undefined;
    }
  }

  async createLocationUpdate(locationUpdate: InsertLocationUpdate): Promise<LocationUpdate> {
    try {
      const result = await pool.query(`
        INSERT INTO location_updates (assignment_id, latitude, longitude, status, speed, heading)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        locationUpdate.assignmentId,
        locationUpdate.latitude,
        locationUpdate.longitude,
        locationUpdate.status || 'active',
        locationUpdate.speed || null,
        locationUpdate.heading || null
      ]);
      
      return this.mapRowToLocationUpdate(result.rows[0]);
    } catch (error) {
      console.error('Error in createLocationUpdate:', error);
      throw error;
    }
  }

  async getLatestLocationUpdateByAssignmentId(assignmentId: number): Promise<LocationUpdate | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM location_updates WHERE assignment_id = $1 ORDER BY timestamp DESC LIMIT 1',
        [assignmentId]
      );
      return result.rows.length > 0 ? this.mapRowToLocationUpdate(result.rows[0]) : undefined;
    } catch (error) {
      console.error('Error in getLatestLocationUpdateByAssignmentId:', error);
      return undefined;
    }
  }

  async getLocationUpdatesByAssignmentId(assignmentId: number): Promise<LocationUpdate[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM location_updates WHERE assignment_id = $1 ORDER BY timestamp DESC',
        [assignmentId]
      );
      return result.rows.map(row => this.mapRowToLocationUpdate(row));
    } catch (error) {
      console.error('Error in getLocationUpdatesByAssignmentId:', error);
      return [];
    }
  }
}

// Usar almacenamiento en base de datos en lugar de memoria
export const storage = new DatabaseStorage();