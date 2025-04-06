import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { UserRole, insertVehicleSchema, insertRouteSchema, insertRouteStopSchema, insertAssignmentSchema, insertDriverRatingSchema, insertLocationUpdateSchema } from "@shared/schema";
import { setupAuth, checkRole } from "./auth";
// Removed: import { setupWebSocketServer } from "./websocket";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // API routes
  // Vehicles
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/active", async (req, res) => {
    try {
      const vehicles = await storage.getActiveVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);

      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicleData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, vehicleData);

      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVehicle(id);

      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.get("/api/routes/active", async (req, res) => {
    try {
      const routes = await storage.getActiveRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active routes" });
    }
  });

  app.get("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.getRoute(id);

      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }

      res.json(route);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch route" });
    }
  });

  app.post("/api/routes", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const routeData = insertRouteSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const route = await storage.createRoute(routeData);
      res.status(201).json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create route" });
    }
  });

  app.put("/api/routes/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const routeData = insertRouteSchema.partial().parse(req.body);
      const route = await storage.updateRoute(id, routeData);

      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }

      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update route" });
    }
  });

  app.delete("/api/routes/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoute(id);

      if (!success) {
        return res.status(404).json({ message: "Route not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete route" });
    }
  });

  // Route Stops
  app.get("/api/routes/:routeId/stops", async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const stops = await storage.getRouteStopsByRouteId(routeId);
      res.json(stops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch route stops" });
    }
  });

  app.post("/api/routes/:routeId/stops", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const stopData = insertRouteStopSchema.parse({
        ...req.body,
        routeId
      });
      const stop = await storage.createRouteStop(stopData);
      res.status(201).json(stop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route stop data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create route stop" });
    }
  });

  app.put("/api/route-stops/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stopData = insertRouteStopSchema.partial().parse(req.body);
      const stop = await storage.updateRouteStop(id, stopData);

      if (!stop) {
        return res.status(404).json({ message: "Route stop not found" });
      }

      res.json(stop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route stop data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update route stop" });
    }
  });

  app.delete("/api/route-stops/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRouteStop(id);

      if (!success) {
        return res.status(404).json({ message: "Route stop not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete route stop" });
    }
  });

  // Assignments
  app.get("/api/assignments", async (req, res) => {
    try {
      const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
      const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
      const routeId = req.query.routeId ? parseInt(req.query.routeId as string) : undefined;

      let assignments = [];

      if (driverId) {
        assignments = await storage.getAssignmentsByDriverId(driverId);
      } else if (vehicleId) {
        assignments = await storage.getAssignmentsByVehicleId(vehicleId);
      } else if (routeId) {
        assignments = await storage.getAssignmentsByRouteId(routeId);
      } else {
        // Check if user is admin, otherwise return only relevant assignments
        if (req.user && req.user.role === UserRole.ADMIN) {
          assignments = await storage.getActiveAssignments();
        } else if (req.user && req.user.role === UserRole.DRIVER) {
          assignments = await storage.getAssignmentsByDriverId(req.user.id);
        } else {
          assignments = await storage.getActiveAssignments();
        }
      }

      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const assignmentData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignmentData = insertAssignmentSchema.partial().parse(req.body);

      // Check if user is authorized to update this assignment
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Only admin or the assigned driver can update assignment
      if (req.user.role !== UserRole.ADMIN && 
          !(req.user.role === UserRole.DRIVER && assignment.driverId === req.user.id)) {
        return res.status(403).json({ message: "Unauthorized to update this assignment" });
      }

      const updatedAssignment = await storage.updateAssignment(id, assignmentData);
      res.json(updatedAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssignment(id);

      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Driver Ratings
  app.get("/api/driver-ratings", async (req, res) => {
    try {
      const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;

      let ratings = [];

      if (driverId) {
        ratings = await storage.getDriverRatingsByDriverId(driverId);
      } else if (req.user && req.user.role === UserRole.USER) {
        ratings = await storage.getDriverRatingsByUserId(req.user.id);
      } else if (req.user && req.user.role === UserRole.DRIVER) {
        ratings = await storage.getDriverRatingsByDriverId(req.user.id);
      } else {
        return res.status(403).json({ message: "Unauthorized to view ratings" });
      }

      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver ratings" });
    }
  });

  app.get("/api/driver-ratings/average/:driverId", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const average = await storage.getAverageDriverRating(driverId);

      if (average === null) {
        return res.status(404).json({ message: "No ratings found for this driver" });
      }

      res.json({ driverId, averageRating: average });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch average driver rating" });
    }
  });

  app.post("/api/driver-ratings", checkRole(UserRole.USER), async (req, res) => {
    try {
      const ratingData = insertDriverRatingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const rating = await storage.createDriverRating(ratingData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver rating data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create driver rating" });
    }
  });

  // Location Updates
  app.get("/api/location-updates/:assignmentId", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const updates = await storage.getLocationUpdatesByAssignmentId(assignmentId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location updates" });
    }
  });

  app.get("/api/location-updates/:assignmentId/latest", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const update = await storage.getLatestLocationUpdateByAssignmentId(assignmentId);

      if (!update) {
        return res.status(404).json({ message: "No location updates found for this assignment" });
      }

      res.json(update);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest location update" });
    }
  });

  app.post("/api/location-updates", checkRole(UserRole.DRIVER), async (req, res) => {
    try {
      const locationData = insertLocationUpdateSchema.parse(req.body);

      // Check if driver is assigned to this assignment
      const assignment = await storage.getAssignment(locationData.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (assignment.driverId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update location for this assignment" });
      }

      const locationUpdate = await storage.createLocationUpdate(locationData);
      res.status(201).json(locationUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid location update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create location update" });
    }
  });

  // Statistics for admin dashboard
  app.get("/api/stats", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const activeRoutes = await storage.getActiveRoutes();
      const activeVehicles = await storage.getActiveVehicles();
      const drivers = await storage.getUsersByRole(UserRole.DRIVER);
      const users = await storage.getUsersByRole(UserRole.USER);

      res.json({
        activeRoutesCount: activeRoutes.length,
        activeVehiclesCount: activeVehicles.length,
        driversCount: drivers.length,
        usersCount: users.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Users management (admin only)
  app.get("/api/users", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const role = req.query.role as string;

      let users = [];

      if (role) {
        users = await storage.getUsersByRole(role);
      } else {
        users = await storage.getAllUsers();
      }

      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/drivers', async (req, res) => {
    try {
      const driver = await storage.createDriver(req.body);
      res.json({ success: true, data: driver });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return httpServer;
}