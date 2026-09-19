import { hash, verify } from "@node-rs/argon2";
import { and, eq, lt, ne } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { createCookie } from "react-router";
import { sessions, users } from "~/db/schema";
import type { UserRole } from "~/lib/enums";
import { db } from "./db.server";
import { env } from "./env.server";

const DAY = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 14 * DAY;
const REFRESH_WHEN_LESS_THAN_MS = 7 * DAY;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

// La cookie solo guarda un token aleatorio firmado. La sesión real vive en la base
// de datos, así se puede cerrar desde el servidor (p. ej. al desactivar un usuario).
const sessionCookie = createCookie("pu_session", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: env.secureCookies,
  secrets: [env.SESSION_SECRET],
  maxAge: SESSION_TTL_MS / 1000,
});

// Parámetros recomendados por OWASP para Argon2id.
const ARGON_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };

export function hashPassword(password: string) {
  return hash(password, ARGON_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Hash de relleno para que un correo inexistente tarde lo mismo que uno existente.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticate(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  if (!user) {
    await verifyPassword(await getDummyHash(), password);
    return null;
  }
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid || !user.active) return null;
  return user;
}

/** Crea una sesión y devuelve el encabezado Set-Cookie. */
export async function createUserSession(userId: string, request: Request) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: request.headers.get("user-agent")?.slice(0, 255) ?? null,
  });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  // Limpieza oportunista de sesiones vencidas.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  return sessionCookie.serialize(token);
}

/**
 * Obtiene el usuario de la sesión actual. Si la sesión está por vencer, la extiende
 * y devuelve un nuevo Set-Cookie para renovarla en el navegador.
 */
export async function getSessionUser(
  request: Request,
): Promise<{ user: SessionUser; setCookie: string | null } | null> {
  const token = await sessionCookie.parse(request.headers.get("Cookie"));
  if (typeof token !== "string" || token.length === 0) return null;

  const sessionId = hashToken(token);
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      user: { id: users.id, name: users.name, email: users.email, role: users.role, active: users.active },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) return null;

  const remaining = row.expiresAt.getTime() - Date.now();
  if (remaining <= 0 || !row.user.active) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  let setCookie: string | null = null;
  if (remaining < REFRESH_WHEN_LESS_THAN_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(sessions.id, sessionId));
    setCookie = await sessionCookie.serialize(token);
  }

  const { active: _active, ...user } = row.user;
  return { user, setCookie };
}

/** Cierra la sesión actual y devuelve el Set-Cookie que borra la cookie. */
export async function destroyUserSession(request: Request) {
  const token = await sessionCookie.parse(request.headers.get("Cookie"));
  if (typeof token === "string" && token.length > 0) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  return sessionCookie.serialize("", { maxAge: 0 });
}

/** Cierra todas las sesiones de un usuario (opcionalmente conservando la actual). */
export async function destroyOtherSessions(userId: string, request?: Request) {
  const token = request ? await sessionCookie.parse(request.headers.get("Cookie")) : null;
  if (typeof token === "string" && token.length > 0) {
    await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, hashToken(token))));
  } else {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

export const PASSWORD_MIN_LENGTH = 10;
