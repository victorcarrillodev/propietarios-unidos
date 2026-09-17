import type {
  DocumentCategory,
  ExpenseCategory,
  FeeFrequency,
  MemberStatus,
  MemberType,
  MessageStatus,
  PaymentConcept,
  PaymentMethod,
  PaymentStatus,
  RecordType,
  ReportStatus,
  ReportType,
  RequestStatus,
  TenureType,
  UserRole,
} from "./enums";

export type Tone = "gray" | "green" | "amber" | "red" | "blue" | "earth";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administración general",
  tesoreria: "Tesorería",
  secretaria: "Secretaría",
  comunicacion: "Comunicación",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  activo: "Activo",
  pendiente: "Pendiente",
  inactivo: "Inactivo",
};
export const MEMBER_STATUS_TONES: Record<MemberStatus, Tone> = {
  activo: "green",
  pendiente: "amber",
  inactivo: "gray",
};

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  propietario: "Propietario(a)",
  ejidatario: "Ejidatario(a)",
  colaborador: "Colaborador(a)",
};

export const TENURE_LABELS: Record<TenureType, string> = {
  privada: "Propiedad privada",
  ejidal: "Ejidal",
  comunal: "Comunal",
  otra: "Otra",
};

export const FEE_FREQUENCY_LABELS: Record<FeeFrequency, string> = {
  anual: "Anual",
  mensual: "Mensual",
  unica: "Única",
};

export const PAYMENT_CONCEPT_LABELS: Record<PaymentConcept, string> = {
  cuota: "Cuota",
  aportacion: "Aportación para mejoras",
  donativo: "Donativo",
  otro: "Otro",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  deposito: "Depósito bancario",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  vigente: "Vigente",
  cancelado: "Cancelado",
};
export const PAYMENT_STATUS_TONES: Record<PaymentStatus, Tone> = {
  vigente: "green",
  cancelado: "red",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  caminos: "Caminos y accesos",
  incendios: "Prevención de incendios",
  reforestacion: "Reforestación",
  vigilancia: "Vigilancia",
  limpieza: "Limpieza",
  administracion: "Administración",
  legal: "Trámites legales",
  eventos: "Eventos y reuniones",
  otro: "Otro",
};

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  vigilancia: "Recorrido de vigilancia",
  incendio: "Incendio / conato",
  brecha: "Brecha cortafuego",
  reforestacion: "Reforestación",
  limpieza: "Limpieza",
  caminos: "Mejora de caminos",
  asamblea: "Asamblea",
  reunion: "Reunión",
  capacitacion: "Capacitación",
  otro: "Otro",
};
export const RECORD_TYPE_TONES: Record<RecordType, Tone> = {
  vigilancia: "blue",
  incendio: "red",
  brecha: "amber",
  reforestacion: "green",
  limpieza: "green",
  caminos: "earth",
  asamblea: "gray",
  reunion: "gray",
  capacitacion: "blue",
  otro: "gray",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  acta: "Actas de asamblea",
  estatutos: "Estatutos y reglamentos",
  informe: "Informes",
  financiero: "Finanzas",
  legal: "Legal y permisos",
  comunicado: "Comunicados",
  mapa: "Mapas y planos",
  otro: "Otros",
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  incendio: "Incendio o humo",
  tala: "Tala ilegal",
  basura: "Basura o descargas",
  invasion: "Invasión o construcción",
  caceria: "Cacería o saqueo de flora/fauna",
  caminos: "Daño a caminos o cercas",
  otro: "Otro",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  atendido: "Atendido",
  descartado: "Descartado",
};
export const REPORT_STATUS_TONES: Record<ReportStatus, Tone> = {
  nuevo: "red",
  en_revision: "amber",
  atendido: "green",
  descartado: "gray",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};
export const REQUEST_STATUS_TONES: Record<RequestStatus, Tone> = {
  pendiente: "amber",
  aprobada: "green",
  rechazada: "gray",
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  nuevo: "Nuevo",
  leido: "Leído",
  atendido: "Atendido",
  archivado: "Archivado",
};
export const MESSAGE_STATUS_TONES: Record<MessageStatus, Tone> = {
  nuevo: "red",
  leido: "blue",
  atendido: "green",
  archivado: "gray",
};

/** Convierte un mapa de etiquetas en opciones para un <select>. */
export function toOptions<K extends string>(labels: Record<K, string>) {
  return (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
}
