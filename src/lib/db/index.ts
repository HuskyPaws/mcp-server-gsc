import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const client = postgres(process.env.DATABASE_URL);
  return drizzle(client, { schema });
}

let dbInstance: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(target, prop) {
    if (!dbInstance) {
      dbInstance = createDb();
    }
    return (dbInstance as any)[prop];
  }
});

