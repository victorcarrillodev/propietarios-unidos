// Aplica las migraciones pendientes de la carpeta ./drizzle.
// Uso: bun run db:migrate
import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (existsSync(".env")) process.loadEnvFile(".env");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ Falta DATABASE_URL. Copia .env.example a .env y complétalo.");
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });

try {
  console.log("⏳ Aplicando migraciones…");
  await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
  console.log("✅ Base de datos actualizada.");
} catch (error) {
  console.error("❌ Error al migrar:", error);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
