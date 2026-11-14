// src/db/config.ts
import * as dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfiguration {
  host: string;
  database: string;
  user: string;
  password?: string;
  adminUser?: string;
  adminPassword?: string;
  maxConnections: number;
  connectionTimeoutMs: number;
  ssl: boolean;
}

/**
 * Returns the verified PostgreSQL configuration using platform SQL_* variables.
 * Exclusively adheres to Cloud SQL Object Method guidelines.
 */
export const getDatabaseConfig = (): DatabaseConfiguration => {
  const host = process.env.SQL_HOST || '';
  const database = process.env.SQL_DB_NAME || '';
  const user = process.env.SQL_USER || '';
  const password = process.env.SQL_PASSWORD || '';

  return {
    host,
    database,
    user,
    password,
    adminUser: process.env.SQL_ADMIN_USER,
    adminPassword: process.env.SQL_ADMIN_PASSWORD,
    maxConnections: 10,
    connectionTimeoutMs: 15000,
    ssl: false, // False when connecting via Cloud SQL Auth Proxy
  };
};

/**
 * Checks if database connection variables are present.
 */
export const isDatabaseConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER)
  );
};
