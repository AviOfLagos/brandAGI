import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get database instance (singleton pattern)
 */
export function getDb() {
  if (!db) {
    // Use absolute path for database
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './local.db';
    const sqlite = new Database(dbPath);
    db = drizzle(sqlite, { schema });
  }
  return db;
}

/**
 * Initialize database and run migrations
 */
export async function initDb() {
  const database = getDb();
  // Migrations will be handled by drizzle-kit
  console.log('Database initialized');
  return database;
}

export { schema };
export default getDb;
