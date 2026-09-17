import { z } from "zod";
import { localInputToDate, parseMoneyToCents } from "./format";

export type FieldErrors = Partial<Record<string, string[]>>;

const blankToNull = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
};

/** Texto obligatorio, recortado. */
export const requiredText = (label: string, max = 200) =>
  z
    .string({ error: `${label} es obligatorio` })
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(max, `${label}: máximo ${max} caracteres`);

/** Texto opcional: cadena vacía → null. */
export const optionalText = (max = 1000) =>
  z.preprocess(
    (value) => (typeof value === "string" ? blankToNull(value.trim()) : blankToNull(value)),
    z.string().max(max, `Máximo ${max} caracteres`).nullable(),
  );

export const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" ? blankToNull(value.trim().toLowerCase()) : blankToNull(value)),
  z.email("Correo electrónico inválido").max(200).nullable(),
);

export const requiredEmail = z
  .string({ error: "El correo es obligatorio" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Correo electrónico inválido").max(200));

export const optionalPhone = z.preprocess(
  (value) => (typeof value === "string" ? blankToNull(value.trim()) : blankToNull(value)),
  z
    .string()
    .max(30, "Teléfono demasiado largo")
    .regex(/^[\d\s()+-]{7,}$/, "Teléfono inválido")
    .nullable(),
);

export const requiredPhone = z
  .string({ error: "El teléfono es obligatorio" })
  .trim()
  .min(1, "El teléfono es obligatorio")
  .max(30, "Teléfono demasiado largo")
  .regex(/^[\d\s()+-]{7,}$/, "Teléfono inválido");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const requiredDate = (label = "La fecha") =>
  z
    .string({ error: `${label} es obligatoria` })
    .regex(DATE_RE, `${label} no es válida`)
    .refine((value) => !Number.isNaN(Date.parse(value)), `${label} no es válida`);

export const optionalDate = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(DATE_RE, "Fecha inválida")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida")
    .nullable(),
);

/** Checkbox HTML: "on" cuando está marcado, ausente cuando no. */
export const checkbox = z.preprocess((value) => value === "on" || value === "true" || value === "1", z.boolean());

/** Monto en pesos ("1,250.50") → centavos (125050). */
export const moneyCents = (label = "El monto") =>
  z
    .string({ error: `${label} es obligatorio` })
    .trim()
    .refine((value) => {
      const cents = parseMoneyToCents(value);
      return cents !== null && cents > 0;
    }, `${label} no es válido`)
    .transform((value) => parseMoneyToCents(value)!);

export const optionalUuid = z.preprocess(blankToNull, z.uuid("Selección inválida").nullable());

export const optionalInt = (max = 100000) =>
  z.preprocess(
    blankToNull,
    z.coerce.number({ error: "Número inválido" }).int("Debe ser un número entero").min(0).max(max).nullable(),
  );

/** Decimal con hasta 2 cifras (ej. superficie en hectáreas) como texto. */
export const optionalDecimal = z.preprocess(
  (value) => (typeof value === "string" ? blankToNull(value.trim().replace(/,/g, "")) : blankToNull(value)),
  z
    .string()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "Número inválido (usa punto decimal)")
    .nullable(),
);

export const selectEnum = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { error: `Selecciona ${label}` });

/** Texto opcional que debe cumplir un patrón (vacío → null). */
export const optionalMatch = (pattern: RegExp, message: string, max = 200) =>
  z.preprocess(
    (value) => (typeof value === "string" ? blankToNull(value.trim()) : blankToNull(value)),
    z.string().max(max).regex(pattern, message).nullable(),
  );

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Valor de <input type="datetime-local"> (hora de México) → Date. */
export const requiredDateTime = (label = "La fecha") =>
  z
    .string({ error: `${label} es obligatoria` })
    .regex(DATETIME_RE, `${label} no es válida`)
    .transform((value, ctx) => {
      const date = localInputToDate(value);
      if (!date) {
        ctx.issues.push({ code: "custom", message: `${label} no es válida`, input: value });
        return z.NEVER;
      }
      return date;
    });

export const optionalDateTime = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(DATETIME_RE, "Fecha inválida")
    .transform((value) => localInputToDate(value))
    .nullable(),
);

export const newPassword = z
  .string({ error: "Escribe una contraseña" })
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .max(200, "La contraseña es demasiado larga");

type FormResult<T> =
  | { success: true; data: T }
  | { success: false; errors: FieldErrors; values: Record<string, string> };

/** Valores de texto de un FormData (para volver a llenar el formulario tras un error). */
export function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** Valida un FormData con un esquema de Zod y devuelve errores listos para la UI. */
export function validateForm<S extends z.ZodType>(schema: S, formData: FormData): FormResult<z.output<S>> {
  const raw: Record<string, unknown> = {};
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    raw[key] = value;
    values[key] = value;
  }
  const result = schema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: z.flattenError(result.error).fieldErrors as FieldErrors, values };
}

/** Devuelve el valor si pertenece a la lista permitida; si no, "". */
export function pickEnum<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | "" {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

/** Parámetro de página seguro a partir de la URL. */
export function pageParam(url: URL, name = "page") {
  const page = Number.parseInt(url.searchParams.get(name) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1;
}

/** Escapa comodines de LIKE/ILIKE. */
export function likeEscape(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
