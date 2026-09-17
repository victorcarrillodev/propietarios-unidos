// Datos iniciales imprescindibles: usuario administrador y configuración del sitio.
// Uso:
//   bun run db:seed
//   bun run db:seed --email=tesoreria@ejemplo.mx --name="Tesorería" --password="una-clave-larga"
//   bun run db:seed --email=admin@ejemplo.mx --reset-password
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { settings, users } from "~/db/schema";
import { DEFAULT_SITE_SETTINGS } from "~/lib/site-settings";
import { hashPassword, PASSWORD_MIN_LENGTH } from "~/server/auth.server";
import { closeDb, db } from "~/server/db.server";

const { values: args } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
    "reset-password": { type: "boolean", default: false },
  },
});

async function main() {
  const email = (args.email ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = (args.name ?? process.env.ADMIN_NAME ?? "Administración").trim();
  let password = args.password ?? process.env.ADMIN_PASSWORD ?? "";
  let generated = false;

  if (!email || !email.includes("@")) {
    throw new Error("Define ADMIN_EMAIL en .env o usa --email=correo@ejemplo.mx");
  }
  if (!password) {
    password = randomBytes(12).toString("base64url");
    generated = true;
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing && !args["reset-password"]) {
    console.log(`ℹ️  El usuario ${email} ya existe (usa --reset-password para cambiar su contraseña).`);
  } else if (existing) {
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(password), active: true, role: "admin" })
      .where(eq(users.id, existing.id));
    console.log(`🔑 Contraseña restablecida para ${email}.`);
  } else {
    await db.insert(users).values({ name, email, role: "admin", passwordHash: await hashPassword(password) });
    console.log(`✅ Administrador creado: ${email}`);
  }

  if (!existing || args["reset-password"]) {
    console.log(
      generated
        ? `   Contraseña generada: ${password}\n   Guárdala en un lugar seguro y cámbiala desde "Mi cuenta".`
        : "   Contraseña: la definida en ADMIN_PASSWORD / --password.",
    );
  }

  const [site] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, "site")).limit(1);
  if (!site) {
    await db.insert(settings).values({ key: "site", value: DEFAULT_SITE_SETTINGS });
    console.log("✅ Configuración del sitio inicializada.");
  }
}

main()
  .catch((error) => {
    console.error(`❌ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
