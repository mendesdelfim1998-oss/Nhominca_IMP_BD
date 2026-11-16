import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { isDatabaseConfigured } from './config.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!isDatabaseConfigured()) {
    return undefined;
  }
  if (!global._postgresPool) {
    if (process.env.DATABASE_URL) {
      // Standard connection string for deployments (Supabase/Neon/PostgreSQL)
      const connectionString = process.env.DATABASE_URL;
      const needsSsl =
        /sslmode=require/i.test(connectionString) ||
        /neon\.tech|supabase\.co|supabase\.com/i.test(connectionString);
      global._postgresPool = new Pool({
        connectionString,
        ssl: needsSsl ? { rejectUnauthorized: false } : false,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      // Cloud SQL Auth Proxy Object Method (must use ssl: false)
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || '127.0.0.1',
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: false,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema when configured.
export const db = pool ? drizzle(pool, { schema }) : (null as any);
export { isDatabaseConfigured };
