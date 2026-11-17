import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { isDatabaseConfigured } from './config.ts';

// Cache pools across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
  var _remotePostgresPool: Pool | undefined;
  var _syncWorkerStarted: boolean | undefined;
}

const sslFor = (connectionString: string) =>
  /sslmode=require/i.test(connectionString) ||
  /neon\.tech|supabase\.co|supabase\.com/i.test(connectionString);

const makePool = (connectionString: string) => {
  const pool = new Pool({
    connectionString,
    ssl: sslFor(connectionString) ? { rejectUnauthorized: false } : false,
    max: 10,
    connectionTimeoutMillis: 15000,
  });
  pool.on('error', (err) => {
    console.error('Unexpected error on idle SQL pool client:', err);
  });
  return pool;
};

// Local/primary pool: prefer LOCAL_DATABASE_URL, fallback to DATABASE_URL or SQL_*.
export const createPool = () => {
  if (!isDatabaseConfigured()) return undefined;
  if (!global._postgresPool) {
    const localUrl = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
    if (localUrl) {
      global._postgresPool = makePool(localUrl);
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || '127.0.0.1',
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: false,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
      global._postgresPool.on('error', (err) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
    }
  }
  return global._postgresPool;
};

export const createRemotePool = () => {
  const remoteUrl = process.env.NEON_DATABASE_URL || process.env.REMOTE_DATABASE_URL || process.env.SYNC_DATABASE_URL;
  if (!remoteUrl) return undefined;
  if (!global._remotePostgresPool) {
    global._remotePostgresPool = makePool(remoteUrl);
  }
  return global._remotePostgresPool;
};

const pool = createPool();
const remotePool = createRemotePool();

// Primary DB used by the app (local/offline-capable when LOCAL_DATABASE_URL is local)
export const db = pool ? drizzle(pool, { schema }) : (null as any);
// Remote DB (Neon/cloud) for synchronization
export const remoteDb = remotePool ? drizzle(remotePool, { schema }) : (null as any);

export const isRemoteDatabaseConfigured = () => Boolean(remotePool && remoteDb);
export const isSyncEnabled = () => (process.env.SYNC_ENABLED || '').toLowerCase() !== 'false' && isRemoteDatabaseConfigured();
export { isDatabaseConfigured, schema };
