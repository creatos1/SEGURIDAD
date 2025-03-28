
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";

const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
  ssl: 'require',
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connection: {
    timeout: 10
  },
  onError: (err) => {
    console.error('Database connection error:', err);
  }
});

export const db = drizzle(sql, { schema });

// Function to initialize the database
export async function initializeDatabase() {
  try {
    console.log("Inicializando base de datos...");
    await sql`SELECT 1`; // Test connection
    console.log("Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
}
