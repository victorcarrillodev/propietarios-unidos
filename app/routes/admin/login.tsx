import { LockKeyhole } from "lucide-react";
import { data, Form, Link, redirect } from "react-router";
import { z } from "zod";
import { LogoMark } from "~/components/brand";
import { Alert, SubmitButton, TextField } from "~/components/ui";
import { audit } from "~/server/audit.server";
import { authenticate, createUserSession, getSessionUser } from "~/server/auth.server";
import { getClientIp, rateLimit, resetRateLimit } from "~/server/rate-limit.server";
import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "Iniciar sesión · Panel Propietarios Unidos" }, { name: "robots", content: "noindex, nofollow" }];
}

/** Solo permite redirigir dentro del panel (evita redirecciones abiertas). */
function safeRedirect(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.startsWith("/admin") || value.startsWith("//")) return "/admin";
  if (value.startsWith("/login") || value.startsWith("/admin/login") || value.startsWith("/admin/logout")) return "/admin";
  return value;
}

export async function loader({ request, url }: Route.LoaderArgs) {
  const session = await getSessionUser(request);
  if (session) throw redirect("/admin");
  return { redirectTo: safeRedirect(url.searchParams.get("redirectTo")) };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Escribe tu correo").max(200),
  password: z.string().min(1, "Escribe tu contraseña").max(200),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return data({ error: "Escribe tu correo y contraseña." }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const ipKey = `login-ip:${getClientIp(request)}`;
  const emailKey = `login-email:${email}`;

  const byIp = rateLimit(ipKey, 20, 15 * 60_000);
  const byEmail = rateLimit(emailKey, 8, 15 * 60_000);
  if (!byIp.allowed || !byEmail.allowed) {
    const minutes = Math.ceil(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds) / 60);
    return data(
      { error: `Demasiados intentos. Espera ${minutes} minuto(s) antes de volver a intentarlo.` },
      { status: 429 },
    );
  }

  const user = await authenticate(email, password);
  if (!user) {
    return data({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  resetRateLimit(emailKey);
  const cookie = await createUserSession(user.id, request);
  await audit({ userId: user.id, action: "auth.login", summary: "Inició sesión" });
  return redirect(safeRedirect(formData.get("redirectTo")), { headers: { "Set-Cookie": cookie } });
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-forest-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <LogoMark className="mx-auto size-16" />
          <h1 className="mt-5 font-display text-2xl font-semibold text-white">Panel de administración</h1>
          <p className="mt-1 text-sm text-forest-200">Propietarios Unidos · Bosque La Primavera</p>
        </div>

        <Form method="post" className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <input type="hidden" name="redirectTo" value={loaderData.redirectTo} />
          {actionData?.error && <Alert tone="error">{actionData.error}</Alert>}
          <TextField label="Correo electrónico" name="email" type="email" autoComplete="username" required autoFocus />
          <TextField label="Contraseña" name="password" type="password" autoComplete="current-password" required />
          <SubmitButton className="w-full" size="lg" pendingText="Entrando…">
            <LockKeyhole aria-hidden /> Entrar
          </SubmitButton>
        </Form>

        <p className="mt-6 text-center text-sm text-forest-200">
          <Link to="/" className="hover:text-white">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </main>
  );
}
