import { and, asc, eq, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db, remoteDb, isSyncEnabled, schema } from './index.ts';

const SYNC_BATCH = 25;

type SyncEntity = keyof typeof entityConfig;

const entityConfig = {
  users: { table: schema.users, key: 'uid' as const },
  faturas: { table: schema.faturas, key: 'faturaUid' as const },
  recibos: { table: schema.recibos, key: 'reciboUid' as const },
  caixa_movs: { table: schema.caixaMovs, key: 'movUid' as const },
  auditoria_logs: { table: schema.auditoriaLogs, key: 'logUid' as const },
  embarcacoes: { table: schema.embarcacoes, key: 'embarcacaoUid' as const },
  agencias: { table: schema.agencias, key: 'agenciaUid' as const },
  armadores: { table: schema.armadores, key: 'armadorUid' as const },
  atracacoes: { table: schema.atracacoes, key: 'atracacaoUid' as const },
  deleted_data: { table: schema.deletedData, key: 'trashUid' as const },
} as const;

export async function enqueueSync(entity: string, entityId: string, operation: 'upsert' | 'delete', payload: any = {}) {
  if (!db) return;
  try {
    await db.insert(schema.syncOutbox).values({
      entity,
      entityId,
      operation,
      payload: payload ?? {},
      status: 'pending',
      attempts: 0,
    });
  } catch (err) {
    console.warn('Failed to enqueue sync job:', entity, entityId, err);
  }
}

async function upsertRemote(entity: SyncEntity, entityId: string) {
  if (!db || !remoteDb) return;
  const cfg = entityConfig[entity];
  if (!cfg) return;
  const rows = await db.select().from(cfg.table as any).where(eq((cfg.table as any)[cfg.key], entityId)).limit(1);
  if (!rows[0]) return; // nothing to sync
  const row = { ...rows[0] } as any;
  delete row.id; // let remote serial/identity be independent? keep stable by unique uid conflict
  await remoteDb.insert(cfg.table as any).values(row).onConflictDoUpdate({
    target: (cfg.table as any)[cfg.key],
    set: row,
  });
}

export async function processSyncOutbox() {
  if (!db || !remoteDb || !isSyncEnabled()) {
    return { ok: false, reason: !db ? 'local_db_unavailable' : !remoteDb ? 'remote_db_unavailable' : 'sync_disabled', processed: 0, synced: 0, failed: 0 };
  }
  let processed = 0, synced = 0, failed = 0;
  try {
    const jobs = await db.select().from(schema.syncOutbox)
      .where(eq(schema.syncOutbox.status, 'pending'))
      .orderBy(asc(schema.syncOutbox.id))
      .limit(SYNC_BATCH);

    for (const job of jobs) {
      processed++;
      try {
        if (job.operation === 'upsert' && job.entity in entityConfig) {
          await upsertRemote(job.entity as SyncEntity, job.entityId);
        } else if (job.operation === 'delete' && job.entity in entityConfig) {
          // For delete sync we currently rely on trash/soft-delete records; hard remote delete not implemented generically.
          // Mark as synced to avoid blocking queue.
        }
        await db.update(schema.syncOutbox)
          .set({ status: 'synced', syncedAt: new Date(), lastError: null })
          .where(eq(schema.syncOutbox.id, job.id));
        synced++;
      } catch (err: any) {
        failed++;
        await db.update(schema.syncOutbox)
          .set({ status: 'pending', attempts: (job.attempts || 0) + 1, lastError: String(err?.message || err) })
          .where(eq(schema.syncOutbox.id, job.id));
        // stop early on connectivity-like failures to retry later
        if (/ECONN|ETIMEDOUT|ENOTFOUND|timeout|connection/i.test(String(err?.message || err))) break;
      }
    }
  } catch (err) {
    console.warn('Sync outbox processing error:', err);
    return { ok: false, reason: 'processing_error', processed, synced, failed };
  }
  return { ok: true, processed, synced, failed };
}

export async function getSyncStatus() {
  const localUrl = process.env.LOCAL_DATABASE_URL || '';
  const dbUrl = process.env.DATABASE_URL || '';
  const neonUrl = process.env.NEON_DATABASE_URL || '';
  const directNeon = /neon\.tech/i.test(dbUrl) && (!localUrl || localUrl === dbUrl) && !isSyncEnabled();
  const mode = directNeon ? 'direct_neon' : (localUrl && neonUrl ? 'local_with_neon_sync' : 'single_database');

  let dbConnected = false;
  let dbError: string | null = null;
  if (db) {
    try {
      await db.execute(sql`select 1`);
      dbConnected = true;
    } catch (e: any) {
      dbError = String(e?.message || e);
    }
  }

  if (!db) return { enabled: false, pending: 0, failed: 0, synced: 0, mode, remoteConfigured: Boolean(remoteDb), dbConnected, dbError, healthy: false };

  try {
    const rows = await db.select().from(schema.syncOutbox);
    const pending = rows.filter(r => r.status === 'pending').length;
    const failed = rows.filter(r => (r.attempts || 0) > 0 && r.status === 'pending').length;
    const synced = rows.filter(r => r.status === 'synced').length;

    let remoteConnected = false;
    if (remoteDb) {
      try { await remoteDb.execute(sql`select 1`); remoteConnected = true; } catch {}
    }

    let healthy = false;
    if (mode === 'direct_neon') {
      healthy = dbConnected; // direct writes to Neon
    } else if (mode === 'local_with_neon_sync') {
      healthy = dbConnected && isSyncEnabled() && pending === 0 && failed === 0 && remoteConnected;
    } else {
      healthy = dbConnected;
    }

    return {
      enabled: isSyncEnabled(),
      pending, failed, synced,
      total: rows.length,
      remoteConfigured: Boolean(remoteDb),
      remoteConnected,
      mode,
      primary: /neon\.tech/i.test(dbUrl) ? 'neon' : 'local',
      dbConnected,
      dbError,
      healthy,
    };
  } catch (e: any) {
    let remoteConnected = false;
    if (remoteDb) {
      try { await remoteDb.execute(sql`select 1`); remoteConnected = true; } catch {}
    }
    return {
      enabled: isSyncEnabled(),
      pending: 0, failed: 0, synced: 0,
      remoteConfigured: Boolean(remoteDb),
      remoteConnected,
      mode,
      primary: /neon\.tech/i.test(dbUrl) ? 'neon' : 'local',
      dbConnected,
      dbError: String(e?.message || e),
      healthy: mode === 'direct_neon' ? dbConnected : false,
    };
  }
}

let worker: NodeJS.Timeout | null = null;
export function startSyncWorker(intervalMs = 15000) {
  if (worker) return;
  if ((global as any)._syncWorkerStarted) return;
  (global as any)._syncWorkerStarted = true;
  const tick = async () => {
    try { await processSyncOutbox(); } catch {}
  };
  tick();
  worker = setInterval(tick, intervalMs);
}

export async function cleanupExpiredTrash() {
  if (!db) return { deleted: 0 };
  try {
    const now = new Date();
    const expired = await db.select().from(schema.deletedData).where(and(lte(schema.deletedData.expiresAt, now), isNull(schema.deletedData.restoredAt)));
    if (expired.length === 0) return { deleted: 0 };
    const ids = expired.map(e => e.id);
    await db.delete(schema.deletedData).where(inArray(schema.deletedData.id, ids));
    return { deleted: expired.length };
  } catch (err) {
    console.warn('cleanupExpiredTrash error:', err);
    return { deleted: 0 };
  }
}
