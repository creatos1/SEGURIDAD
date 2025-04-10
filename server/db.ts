import fs from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });

export async function initializeDatabase() {
  try {
    console.log("Inicializando base de datos...");

    // Ensure the drizzle folder exists
    if (!fs.existsSync('./drizzle')) {
      fs.mkdirSync('./drizzle', { recursive: true });
    }

    // Create tables if needed
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        full_name TEXT,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert demo users if they don't exist
    const demoUsers = [
      {
        username: 'admin',
        email: 'admin@transitpro.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm',
        role: 'admin',
        fullName: 'Admin User'
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: '$2b$10$//S6uA4Qe./bZOp6PcWJ9eUOdlDrADjaM1JrybQOPZxkyFHi.kGdy',
        role: 'user',
        fullName: 'Demo User'
      },
      {
        username: 'driver',
        email: 'driver@transitpro.com',
        password: '$2b$10$jmXg2oNxYrwHgdMGPBIp5uh1fJXMwSKpTCxP8WdUgPGCNhXZZkAEW',
        role: 'driver',
        fullName: 'Demo Driver'
      }
    ];

    for (const user of demoUsers) {
      sqlite.exec(`
        INSERT OR IGNORE INTO users (username, email, password, role, full_name)
        VALUES ('${user.username}', '${user.email}', '${user.password}', '${user.role}', '${user.fullName}');
      `);
    }

    // Create vehicles table
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_number TEXT NOT NULL UNIQUE,
        vehicle_type TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        fuel_status INTEGER DEFAULT 100,
        last_maintenance TEXT,
        next_maintenance TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create routes table
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_location TEXT NOT NULL,
        end_location TEXT NOT NULL,
        coordinates TEXT,
        waypoints TEXT,
        frequency INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        vehicle_id INTEGER REFERENCES vehicles(id)
      );
    `);

    // Create route_stops table
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS route_stops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id INTEGER NOT NULL REFERENCES routes(id),
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        arrival_time TEXT,
        departure_time TEXT,
        "order" INTEGER NOT NULL
      );
    `);

    console.log("Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
}