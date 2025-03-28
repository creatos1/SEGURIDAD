import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "@shared/schema";

const createConnection = () => {
  return postgres(process.env.DATABASE_URL!, {
    max: 1,
    ssl: 'require',
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connection: {
      timeout: 10
    }
  });
};

let queryClient = createConnection();

export const db = drizzle(queryClient, { schema });

// Reconexión automática
queryClient.on('error', async (err) => {
  console.error('Database connection error:', err);
  try {
    await queryClient.end();
    queryClient = createConnection();
    console.log('Database reconnected successfully');
  } catch (error) {
    console.error('Failed to reconnect:', error);
  }
});


// Function to initialize the database
export async function initializeDatabase() {
  const client = await queryClient.connect();

  try {
    console.log("Inicializando base de datos...");

    // Verificar si existen las tablas
    const checkTableExists = async (tableName) => {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = $1
        )`, [tableName]);
      return result.rows[0].exists;
    };

    // Crear las tablas necesarias si no existen

    // Tabla users
    if (!await checkTableExists('users')) {
      console.log("Creando tabla users...");
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          full_name VARCHAR(255),
          profile_image VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Tabla vehicles
    if (!await checkTableExists('vehicles')) {
      console.log("Creando tabla vehicles...");
      await client.query(`
        CREATE TABLE vehicles (
          id SERIAL PRIMARY KEY,
          vehicle_number VARCHAR(50) NOT NULL UNIQUE,
          vehicle_type VARCHAR(50) NOT NULL,
          capacity INTEGER NOT NULL,
          status VARCHAR(50) NOT NULL,
          fuel_status INTEGER,
          last_maintenance TIMESTAMP,
          next_maintenance TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Tabla routes
    if (!await checkTableExists('routes')) {
      console.log("Creando tabla routes...");
      await client.query(`
        CREATE TABLE routes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          description TEXT,
          start_location VARCHAR(255) NOT NULL,
          end_location VARCHAR(255) NOT NULL,
          waypoints TEXT[], 
          frequency INTEGER NOT NULL,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Tabla route_stops
    if (!await checkTableExists('route_stops')) {
      console.log("Creando tabla route_stops...");
      await client.query(`
        CREATE TABLE route_stops (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          route_id INTEGER NOT NULL REFERENCES routes(id),
          location VARCHAR(255) NOT NULL,
          arrival_time VARCHAR(50),
          departure_time VARCHAR(50),
          "order" INTEGER NOT NULL
        )
      `);
    }

    // Tabla assignments
    if (!await checkTableExists('assignments')) {
      console.log("Creando tabla assignments...");
      await client.query(`
        CREATE TABLE assignments (
          id SERIAL PRIMARY KEY,
          route_id INTEGER NOT NULL REFERENCES routes(id),
          driver_id INTEGER NOT NULL REFERENCES users(id),
          vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Tabla driver_ratings
    if (!await checkTableExists('driver_ratings')) {
      console.log("Creando tabla driver_ratings...");
      await client.query(`
        CREATE TABLE driver_ratings (
          id SERIAL PRIMARY KEY,
          driver_id INTEGER NOT NULL REFERENCES users(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          rating INTEGER NOT NULL,
          comment TEXT,
          assignment_id INTEGER REFERENCES assignments(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Tabla location_updates
    if (!await checkTableExists('location_updates')) {
      console.log("Creando tabla location_updates...");
      await client.query(`
        CREATE TABLE location_updates (
          id SERIAL PRIMARY KEY,
          assignment_id INTEGER NOT NULL REFERENCES assignments(id),
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          status VARCHAR(50) NOT NULL,
          speed DECIMAL(8, 2),
          heading INTEGER,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Verificar si existen usuarios en la BD
    const usersResult = await client.query('SELECT * FROM users');
    const users = usersResult.rows;

    if (users.length === 0) {
      console.log("No se encontraron usuarios, creando usuarios por defecto...");

      // Crear usuario administrador
      await client.query(`
        INSERT INTO users (username, email, password, role, full_name) 
        VALUES ('admin', 'admin@transitpro.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'admin', 'Admin User')
      `);

      // Crear usuario normal
      await client.query(`
        INSERT INTO users (username, email, password, role, full_name) 
        VALUES ('user', 'user@example.com', '$2b$10$//S6uA4Qe./bZOp6PcWJ9eUOdlDrADjaM1JrybQOPZxkyFHi.kGdy', 'user', 'Regular User')
      `);

      // Crear usuario conductor
      await client.query(`
        INSERT INTO users (username, email, password, role, full_name) 
        VALUES ('driver', 'driver@transitpro.com', '$2b$10$jmXg2oNxYrwHgdMGPBIp5uh1fJXMwSKpTCxP8WdUgPGCNhXZZkAEW', 'driver', 'Carlos Mendez')
      `);

      console.log("Usuarios por defecto creados");
    } else {
      console.log(`Se encontraron ${users.length} usuarios en la base de datos`);
    }

    // Verificar si existen rutas en la BD
    const routesResult = await client.query('SELECT * FROM routes');
    const routes = routesResult.rows;

    if (routes.length === 0) {
      console.log("No se encontraron rutas, creando rutas de ejemplo...");

      // Crear rutas de ejemplo
      const route1Result = await client.query(`
        INSERT INTO routes (name, status, description, start_location, end_location, waypoints, frequency, created_by) 
        VALUES ('Ruta Norte-Sur', 'active', 'Ruta principal que conecta la zona norte con la zona sur', 'Terminal Norte', 'Terminal Sur', 
        ARRAY['Estación Central', 'Plaza Mayor', 'Hospital General'], 15, 1)
        RETURNING id
      `);

      const route2Result = await client.query(`
        INSERT INTO routes (name, status, description, start_location, end_location, waypoints, frequency, created_by) 
        VALUES ('Ruta Este-Oeste', 'active', 'Ruta que conecta los barrios del este con el centro comercial oeste', 'Terminal Este', 'Centro Comercial Oeste', 
        ARRAY['Parque Industrial', 'Universidad', 'Mercado Central'], 20, 1)
        RETURNING id
      `);

      const route1Id = route1Result.rows[0].id;
      const route2Id = route2Result.rows[0].id;

      // Crear paradas para las rutas
      if (route1Id) {
        await client.query(`
          INSERT INTO route_stops (name, route_id, location, arrival_time, departure_time, "order") VALUES
          ('Terminal Norte', $1, 'Av. Norte 123', '06:00', '06:05', 1),
          ('Estación Central', $1, 'Calle Central 456', '06:15', '06:18', 2),
          ('Plaza Mayor', $1, 'Plaza Mayor s/n', '06:25', '06:28', 3),
          ('Hospital General', $1, 'Av. Salud 789', '06:35', '06:38', 4),
          ('Terminal Sur', $1, 'Av. Sur 321', '06:50', '07:00', 5)
        `, [route1Id]);
      }

      if (route2Id) {
        await client.query(`
          INSERT INTO route_stops (name, route_id, location, arrival_time, departure_time, "order") VALUES
          ('Terminal Este', $1, 'Av. Este 567', '07:00', '07:05', 1),
          ('Parque Industrial', $1, 'Zona Industrial A-12', '07:15', '07:18', 2),
          ('Universidad', $1, 'Campus Universitario', '07:30', '07:35', 3),
          ('Mercado Central', $1, 'Calle Comercio 890', '07:45', '07:48', 4),
          ('Centro Comercial Oeste', $1, 'Av. Oeste 432', '08:00', '08:10', 5)
        `, [route2Id]);
      }

      console.log("Rutas y paradas de ejemplo creadas");
    } else {
      console.log(`Se encontraron ${routes.length} rutas en la base de datos`);
    }

    // Verificar si existen vehículos en la BD
    const vehiclesResult = await client.query('SELECT * FROM vehicles');
    const vehicles = vehiclesResult.rows;

    if (vehicles.length === 0) {
      console.log("No se encontraron vehículos, creando vehículos de ejemplo...");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sixtyDaysLater = new Date();
      sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const seventyFiveDaysLater = new Date();
      seventyFiveDaysLater.setDate(seventyFiveDaysLater.getDate() + 75);

      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const eightyDaysLater = new Date();
      eightyDaysLater.setDate(eightyDaysLater.getDate() + 80);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

      // Crear vehículos de ejemplo
      await client.query(`
        INSERT INTO vehicles (vehicle_number, vehicle_type, capacity, status, fuel_status, last_maintenance, next_maintenance) VALUES
        ('BUS-001', 'Bus', 40, 'active', 95, $1, $2),
        ('BUS-002', 'Bus', 40, 'active', 85, $3, $4),
        ('MIN-001', 'Minibus', 25, 'active', 90, $5, $6),
        ('MIN-002', 'Minibus', 25, 'maintenance', 50, $7, $8)
      `, [thirtyDaysAgo, sixtyDaysLater, fifteenDaysAgo, seventyFiveDaysLater, tenDaysAgo, eightyDaysLater, ninetyDaysAgo, fiveDaysLater]);

      console.log("Vehículos de ejemplo creados");
    } else {
      console.log(`Se encontraron ${vehicles.length} vehículos en la base de datos`);
    }

    // Verificar si existen asignaciones en la BD
    const assignmentsResult = await client.query('SELECT * FROM assignments');
    const assignments = assignmentsResult.rows;

    if (assignments.length === 0) {
      console.log("No se encontraron asignaciones, creando asignaciones de ejemplo...");

      const driversResult = await client.query("SELECT id FROM users WHERE role = 'driver'");
      const drivers = driversResult.rows;

      if (drivers.length > 0) {
        const routesDataResult = await client.query("SELECT id FROM routes LIMIT 1");
        const vehiclesDataResult = await client.query("SELECT id FROM vehicles WHERE status = 'active' LIMIT 1");

        const routesData = routesDataResult.rows;
        const vehiclesData = vehiclesDataResult.rows;

        if (routesData.length > 0 && vehiclesData.length > 0) {
          await client.query(`
            INSERT INTO assignments (route_id, driver_id, vehicle_id, start_time, status)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'in-progress')
          `, [routesData[0].id, drivers[0].id, vehiclesData[0].id]);

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
  } finally {
    client.release();
  }
}