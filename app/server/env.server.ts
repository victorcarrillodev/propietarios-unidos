import { existsSync } from "node:fs";
import { z } from "zod";

// Carga .env si existe. Las variables ya definidas en el entorno tienen prioridad.
if (existsSync(".env")) process.loadEnvFile(".env");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
  SITE_URL: z.url().default("http://localhost:5173"),
  STORAGE_DIR: z.string().min(1).default("./storage"),
  TRUST_PROXY: z.stringbool().default(false),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("Propietarios Unidos <notificaciones@propietariosunidosblp.com.mx>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`\n❌ Configuración inválida en variables de entorno:\n${z.prettifyError(parsed.error)}\n`);
  throw new Error("Variables de entorno inválidas. Revisa tu archivo .env (usa .env.example como guía).");
}

export const env = {
  ...parsed.data,
  SITE_URL: parsed.data.SITE_URL.replace(/\/+$/, ""),
  isProduction: parsed.data.NODE_ENV === "production",
  secureCookies: parsed.data.SITE_URL.startsWith("https://"),
};
