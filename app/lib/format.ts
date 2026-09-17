// Formatos para México. Se usan igual en servidor y navegador, por eso fijamos
// la zona horaria: así el HTML del servidor coincide con el del cliente.
export const TIME_ZONE = "America/Mexico_City";
const LOCALE = "es-MX";

const moneyFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "MXN" });
const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatMoney(cents: number) {
  return moneyFormatter.format(cents / 100);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

/**
 * Convierte "1,234.50" o "$1234.5" en centavos (123450). Devuelve null si no es válido.
 * Evita decimales flotantes trabajando con la parte entera y decimal por separado.
 */
export function parseMoneyToCents(input: string): number | null {
  const clean = input.replace(/[\s,$]/g, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, decimals = ""] = clean.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

const dateOnlyFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const longDateOnlyFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});
const timestampDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});
const monthYearFormatter = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });
const monthShortFormatter = new Intl.DateTimeFormat(LOCALE, { month: "short", timeZone: "UTC" });

function parseDateOnly(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}

/** "2026-09-16" → "16 sept 2026" */
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return dateOnlyFormatter.format(parseDateOnly(value));
}

/** "2026-09-16" → "miércoles, 16 de septiembre de 2026" */
export function formatLongDate(value: string) {
  return longDateOnlyFormatter.format(parseDateOnly(value));
}

/** Fecha y hora en horario del centro de México. */
export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}

/** Solo la fecha de un timestamp, en horario del centro de México. */
export function formatTimestampDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return timestampDateFormatter.format(new Date(value));
}

export function formatTime(value: Date | string) {
  return timeFormatter.format(new Date(value));
}

/** "2026-09" → "septiembre de 2026" */
export function formatMonth(value: string) {
  return monthYearFormatter.format(parseDateOnly(`${value}-01`));
}

export function formatMonthShort(value: string) {
  return monthShortFormatter.format(parseDateOnly(`${value}-01`)).replace(".", "");
}

/** Partes de una fecha (en horario de México) útiles para tarjetas de eventos. */
export function dateParts(value: Date | string) {
  const parts = new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    weekday: "short",
    timeZone: TIME_ZONE,
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month").replace(".", ""), weekday: get("weekday").replace(".", "") };
}

function zonedParts(date: Date, timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Fecha de hoy en México como "YYYY-MM-DD". */
export function todayISO(now = new Date()) {
  const p = zonedParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Año actual en México. */
export function currentYear(now = new Date()) {
  return Number(zonedParts(now).year);
}

/** Mes actual en México como "YYYY-MM". */
export function currentMonth(now = new Date()) {
  const p = zonedParts(now);
  return `${p.year}-${p.month}`;
}

/** Suma (o resta) meses a "YYYY-MM". */
export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

const compactMoneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1250000 centavos → "$12.5 mil" */
export function formatMoneyCompact(cents: number) {
  return compactMoneyFormatter.format(cents / 100);
}

/** Convierte el valor de un <input type="datetime-local"> (hora de México) a Date UTC. */
export function localInputToDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const p = zonedParts(new Date(guess));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  const offset = asUtc - guess;
  return new Date(guess - offset);
}

/** Convierte un Date a valor para <input type="datetime-local"> en hora de México. */
export function dateToLocalInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const p = zonedParts(new Date(value));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
