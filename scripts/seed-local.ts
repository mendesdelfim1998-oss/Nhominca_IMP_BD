/**
 * Carrega os dados iniciais na base de dados apontada por DATABASE_URL.
 * Uso: DATABASE_URL=... npx tsx scripts/seed-local.ts
 */
import { seedDatabaseIfEmpty } from '../src/db/queries.ts';

const result = await seedDatabaseIfEmpty();
console.log('SEED_RESULT', JSON.stringify(result));
