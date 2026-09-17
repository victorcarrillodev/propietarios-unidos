import { z } from "zod";

// Textos y datos de contacto del sitio público. Se editan desde
// Panel → Configuración, sin tocar el código.

const DEFAULT_ABOUT = `Somos la **Asociación de Propietarios Unidos en Mejoras del Bosque La Primavera**: propietarias y propietarios de predios en el bosque que decidimos organizarnos para cuidarlo, mejorarlo y defenderlo.

Quienes tenemos tierra en La Primavera tenemos también la responsabilidad —y la oportunidad— de protegerla. Por eso trabajamos en la prevención de incendios, el mantenimiento de caminos y accesos, la vigilancia del territorio y la atención de denuncias.

Estamos creando canales para establecer comunicación entre usuarios y propietarios. Queremos escuchar sus comentarios y denuncias, y construir juntos acuerdos claros para disfrutar el bosque de manera responsable.`;

const DEFAULT_MISSION =
  "Proteger, conservar y mejorar el Bosque La Primavera desde la organización de sus propietarios, promoviendo el uso responsable del territorio, la prevención de daños y la colaboración con usuarios, comunidades y autoridades.";

const DEFAULT_VISION =
  "Ser una asociación referente en conservación participativa, donde propietarios, usuarios y autoridades trabajan juntos para que el Bosque La Primavera siga siendo fuente de vida para las próximas generaciones.";

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

export const siteSettingsSchema = z.object({
  orgName: text(160).min(3, "Escribe el nombre de la asociación"),
  shortName: text(60).min(2, "Escribe un nombre corto"),
  tagline: text(220),
  aboutText: text(6000),
  mission: text(1500),
  vision: text(1500),
  history: text(8000),
  board: text(3000),
  address: text(300),
  phone: text(40),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .regex(/^\d*$/, "Solo números, con lada de país (ej. 523312345678)"),
  email: z.union([z.literal(""), z.email("Correo inválido").max(200)]),
  facebookUrl: z.union([z.literal(""), z.url("URL inválida").max(300)]),
  mapsUrl: z.union([z.literal(""), z.url("URL inválida").max(500)]),
  hours: text(120),
  donationInfo: text(3000),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  orgName: "Propietarios Unidos en Mejoras del Bosque La Primavera",
  shortName: "Propietarios Unidos",
  tagline: "Propietarios que cuidan, mejoran y defienden el Bosque La Primavera.",
  aboutText: DEFAULT_ABOUT,
  mission: DEFAULT_MISSION,
  vision: DEFAULT_VISION,
  history: "",
  board: "",
  address: "Prol. M. Otero km 10.5, Tala Centro, Jalisco, México",
  phone: "33 1638 7462",
  whatsapp: "523316387462",
  email: "propietariosunidosblp2025@gmail.com",
  facebookUrl: "https://www.facebook.com/CRDBLP/",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Prol.+M.+Otero+km+10.5+Tala+Jalisco",
  hours: "Siempre abierto",
  donationInfo: "",
};

/** Combina lo guardado con los valores por defecto, ignorando campos inválidos. */
export function resolveSiteSettings(stored: unknown): SiteSettings {
  const result = { ...DEFAULT_SITE_SETTINGS };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(DEFAULT_SITE_SETTINGS) as (keyof SiteSettings)[]) {
      const value = (stored as Record<string, unknown>)[key];
      const parsed = siteSettingsSchema.shape[key].safeParse(value);
      if (parsed.success) result[key] = parsed.data;
    }
  }
  return result;
}

/** "Presidencia | Nombre" por línea → lista de integrantes. */
export function parseBoard(board: string) {
  return board
    .split(/\r?\n/)
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
    .map(([role, name]) => ({ role: role!, name: name! }));
}
