import { Resend } from "resend";
import { env } from "./env.server";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/** Envía un correo con Resend. Si no hay RESEND_API_KEY configurada, solo lo registra en consola. */
export async function sendMail({ to, subject, html, replyTo }: SendMailInput) {
  if (!resend) {
    console.warn(`[mail] RESEND_API_KEY no configurada; no se envió "${subject}" a ${to}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: env.MAIL_FROM, to, subject, html, replyTo });
    if (error) console.error("[mail] Resend rechazó el envío:", error);
  } catch (err) {
    console.error("[mail] Error al enviar correo:", err);
  }
}
