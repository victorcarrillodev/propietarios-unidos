// Valores permitidos que se comparten entre la base de datos y la interfaz.
// Si agregas un valor aquí, genera una migración con `npm run db:generate`.

export const USER_ROLES = ["admin", "tesoreria", "secretaria", "comunicacion"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBER_STATUSES = ["activo", "pendiente", "inactivo"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_TYPES = ["propietario", "ejidatario", "colaborador"] as const;
export type MemberType = (typeof MEMBER_TYPES)[number];

export const TENURE_TYPES = ["privada", "ejidal", "comunal", "otra"] as const;
export type TenureType = (typeof TENURE_TYPES)[number];

export const FEE_FREQUENCIES = ["anual", "mensual", "unica"] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

export const PAYMENT_CONCEPTS = ["cuota", "aportacion", "donativo", "otro"] as const;
export type PaymentConcept = (typeof PAYMENT_CONCEPTS)[number];

export const PAYMENT_METHODS = ["efectivo", "transferencia", "deposito", "tarjeta", "otro"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["vigente", "cancelado"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const EXPENSE_CATEGORIES = [
  "caminos",
  "incendios",
  "reforestacion",
  "vigilancia",
  "limpieza",
  "administracion",
  "legal",
  "eventos",
  "otro",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const RECORD_TYPES = [
  "vigilancia",
  "incendio",
  "brecha",
  "reforestacion",
  "limpieza",
  "caminos",
  "asamblea",
  "reunion",
  "capacitacion",
  "otro",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const DOCUMENT_CATEGORIES = [
  "acta",
  "estatutos",
  "informe",
  "financiero",
  "legal",
  "comunicado",
  "mapa",
  "otro",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const REPORT_TYPES = ["incendio", "tala", "basura", "invasion", "caceria", "caminos", "otro"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_STATUSES = ["nuevo", "en_revision", "atendido", "descartado"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REQUEST_STATUSES = ["pendiente", "aprobada", "rechazada"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const MESSAGE_STATUSES = ["nuevo", "leido", "atendido", "archivado"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

// No es un enum de base de datos: se guarda como texto para permitir otros valores.
export const MUNICIPALITIES = ["Tala", "Zapopan", "Tlajomulco de Zúñiga", "El Arenal", "Otro"] as const;
