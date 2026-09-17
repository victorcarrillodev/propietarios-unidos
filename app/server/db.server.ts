import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "~/db/schema";
import { env } from "./env.server";

type SqlClient = ReturnType<typeof postgres>;

// En desarrollo el servidor se recarga con cada cambio: reutilizamos el pool
// para no abrir conexiones nuevas en cada recarga.
const globalForDb = globalThis as typeof globalThis & { __pgClient?: SqlClient };

const client: SqlClient =
  globalForDb.__pgClient ??
  postgres(env.DATABASE_URL, {
    max: env.isProduction ? 10 : 5,
    idle_timeout: 30,
    connect_timeout: 10,
    onnotice: () => {},
  });

if (!env.isProduction) globalForDb.__pgClient = client;

export const db = drizzle({ client, schema, casing: "snake_case" });
export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function closeDb() {
  await client.end({ timeout: 5 });
}
