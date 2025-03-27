import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

// Create a PostgreSQL connection
export const sql = postgres(process.env.DATABASE_URL || '', {
  max: 10,
  ssl: true,
});

// Create a database connection with Drizzle
export const db = drizzle(sql, { schema });

// Function to initialize the database
export async function initializeDatabase() {
  try {
    console.log("Inicializando base de datos...");
    
    // Verificar si existen usuarios en la BD
    const users = await db.select().from(schema.users);
    
    if (users.length === 0) {
      console.log("No se encontraron usuarios, creando usuarios por defecto...");
      
      // Crear usuario administrador
      await db.insert(schema.users).values({
        username: "admin",
        email: "admin@transitpro.com",
        password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // 'admin123'
        role: "admin",
        fullName: "Admin User",
        profileImage: null,
        createdAt: new Date()
      });
      
      // Crear usuario normal
      await db.insert(schema.users).values({
        username: "user",
        email: "user@example.com",
        password: "$2b$10$//S6uA4Qe./bZOp6PcWJ9eUOdlDrADjaM1JrybQOPZxkyFHi.kGdy", // 'user123'
        role: "user", 
        fullName: "Regular User",
        profileImage: null,
        createdAt: new Date()
      });
      
      // Crear usuario conductor
      await db.insert(schema.users).values({
        username: "driver",
        email: "driver@transitpro.com",
        password: "$2b$10$jmXg2oNxYrwHgdMGPBIp5uh1fJXMwSKpTCxP8WdUgPGCNhXZZkAEW", // 'driver123'
        role: "driver",
        fullName: "Carlos Mendez",
        profileImage: null,
        createdAt: new Date()
      });
      
      console.log("Usuarios por defecto creados");
    } else {
      console.log(`Se encontraron ${users.length} usuarios en la base de datos`);
    }
    
    // Verificar si existen rutas en la BD
    const routes = await db.select().from(schema.routes);
    
    if (routes.length === 0) {
      console.log("No se encontraron rutas, creando rutas de ejemplo...");
      
      // Crear rutas de ejemplo
      const route1 = await db.insert(schema.routes).values({
        name: "Ruta Norte-Sur",
        status: "active",
        description: "Ruta principal que conecta la zona norte con la zona sur",
        startLocation: "Terminal Norte",
        endLocation: "Terminal Sur",
        waypoints: ["Estación Central", "Plaza Mayor", "Hospital General"],
        frequency: 15, // Cada 15 minutos
        createdBy: 1, // Admin
        createdAt: new Date()
      }).returning();
      
      const route2 = await db.insert(schema.routes).values({
        name: "Ruta Este-Oeste",
        status: "active",
        description: "Ruta que conecta los barrios del este con el centro comercial oeste",
        startLocation: "Terminal Este",
        endLocation: "Centro Comercial Oeste",
        waypoints: ["Parque Industrial", "Universidad", "Mercado Central"],
        frequency: 20, // Cada 20 minutos
        createdBy: 1, // Admin
        createdAt: new Date()
      }).returning();
      
      // Crear paradas para las rutas
      if (route1.length > 0) {
        await db.insert(schema.routeStops).values([
          {
            name: "Terminal Norte",
            routeId: route1[0].id,
            location: "Av. Norte 123",
            arrivalTime: "06:00",
            departureTime: "06:05",
            order: 1
          },
          {
            name: "Estación Central",
            routeId: route1[0].id,
            location: "Calle Central 456",
            arrivalTime: "06:15",
            departureTime: "06:18",
            order: 2
          },
          {
            name: "Plaza Mayor",
            routeId: route1[0].id,
            location: "Plaza Mayor s/n",
            arrivalTime: "06:25",
            departureTime: "06:28",
            order: 3
          },
          {
            name: "Hospital General",
            routeId: route1[0].id,
            location: "Av. Salud 789",
            arrivalTime: "06:35",
            departureTime: "06:38",
            order: 4
          },
          {
            name: "Terminal Sur",
            routeId: route1[0].id,
            location: "Av. Sur 321",
            arrivalTime: "06:50",
            departureTime: "07:00",
            order: 5
          }
        ]);
      }
      
      if (route2.length > 0) {
        await db.insert(schema.routeStops).values([
          {
            name: "Terminal Este",
            routeId: route2[0].id,
            location: "Av. Este 567",
            arrivalTime: "07:00",
            departureTime: "07:05",
            order: 1
          },
          {
            name: "Parque Industrial",
            routeId: route2[0].id,
            location: "Zona Industrial A-12",
            arrivalTime: "07:15",
            departureTime: "07:18",
            order: 2
          },
          {
            name: "Universidad",
            routeId: route2[0].id,
            location: "Campus Universitario",
            arrivalTime: "07:30",
            departureTime: "07:35",
            order: 3
          },
          {
            name: "Mercado Central",
            routeId: route2[0].id,
            location: "Calle Comercio 890",
            arrivalTime: "07:45",
            departureTime: "07:48",
            order: 4
          },
          {
            name: "Centro Comercial Oeste",
            routeId: route2[0].id,
            location: "Av. Oeste 432",
            arrivalTime: "08:00",
            departureTime: "08:10",
            order: 5
          }
        ]);
      }
      
      console.log("Rutas y paradas de ejemplo creadas");
    } else {
      console.log(`Se encontraron ${routes.length} rutas en la base de datos`);
    }
    
    // Verificar si existen vehículos en la BD
    const vehicles = await db.select().from(schema.vehicles);
    
    if (vehicles.length === 0) {
      console.log("No se encontraron vehículos, creando vehículos de ejemplo...");
      
      // Crear vehículos de ejemplo
      await db.insert(schema.vehicles).values([
        {
          vehicleNumber: "BUS-001",
          vehicleType: "Bus",
          capacity: 40,
          status: "active",
          fuelStatus: 95,
          lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Hace 30 días
          nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // En 60 días
          createdAt: new Date()
        },
        {
          vehicleNumber: "BUS-002",
          vehicleType: "Bus",
          capacity: 40,
          status: "active",
          fuelStatus: 85,
          lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Hace 15 días
          nextMaintenance: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // En 75 días
          createdAt: new Date()
        },
        {
          vehicleNumber: "MIN-001",
          vehicleType: "Minibus",
          capacity: 25,
          status: "active",
          fuelStatus: 90,
          lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Hace 10 días
          nextMaintenance: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000), // En 80 días
          createdAt: new Date()
        },
        {
          vehicleNumber: "MIN-002",
          vehicleType: "Minibus",
          capacity: 25,
          status: "maintenance",
          fuelStatus: 50,
          lastMaintenance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Hace 90 días
          nextMaintenance: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // En 5 días
          createdAt: new Date()
        }
      ]);
      
      console.log("Vehículos de ejemplo creados");
    } else {
      console.log(`Se encontraron ${vehicles.length} vehículos en la base de datos`);
    }
    
    // Crear asignaciones entre conductores, rutas y vehículos
    const assignments = await db.select().from(schema.assignments);
    
    if (assignments.length === 0 && vehicles.length > 0 && routes.length > 0) {
      console.log("No se encontraron asignaciones, creando asignaciones de ejemplo...");
      
      // Obtener el conductor 
      const drivers = await db.select().from(schema.users).where(eq(schema.users.role, "driver"));
      
      if (drivers.length > 0) {
        // Obtener los IDs necesarios
        const routesData = await db.select().from(schema.routes);
        const vehiclesData = await db.select().from(schema.vehicles).where(eq(schema.vehicles.status, "active"));
        
        if (routesData.length > 0 && vehiclesData.length > 0) {
          // Crear una asignación
          await db.insert(schema.assignments).values({
            routeId: routesData[0].id,
            driverId: drivers[0].id,
            vehicleId: vehiclesData[0].id,
            startTime: new Date(),
            endTime: null, // Aún en progreso
            status: "in-progress",
            createdAt: new Date()
          });
          
          console.log("Asignaciones de ejemplo creadas");
        }
      }
    } else {
      console.log(`Se encontraron ${assignments.length} asignaciones en la base de datos`);
    }
    
    console.log("Inicialización de la base de datos completada");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
}
