import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
// Import relativo (no "~/"): drizzle-kit carga este archivo sin los alias de TypeScript.
import {
  DOCUMENT_CATEGORIES,
  EXPENSE_CATEGORIES,
  FEE_FREQUENCIES,
  MEMBER_STATUSES,
  MEMBER_TYPES,
  MESSAGE_STATUSES,
  PAYMENT_CONCEPTS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  RECORD_TYPES,
  REPORT_STATUSES,
  REPORT_TYPES,
  REQUEST_STATUSES,
  TENURE_TYPES,
  USER_ROLES,
} from "../lib/enums";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const memberStatusEnum = pgEnum("member_status", MEMBER_STATUSES);
export const memberTypeEnum = pgEnum("member_type", MEMBER_TYPES);
export const tenureTypeEnum = pgEnum("tenure_type", TENURE_TYPES);
export const feeFrequencyEnum = pgEnum("fee_frequency", FEE_FREQUENCIES);
export const paymentConceptEnum = pgEnum("payment_concept", PAYMENT_CONCEPTS);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);
export const expenseCategoryEnum = pgEnum("expense_category", EXPENSE_CATEGORIES);
export const recordTypeEnum = pgEnum("record_type", RECORD_TYPES);
export const documentCategoryEnum = pgEnum("document_category", DOCUMENT_CATEGORIES);
export const reportTypeEnum = pgEnum("report_type", REPORT_TYPES);
export const reportStatusEnum = pgEnum("report_status", REPORT_STATUSES);
export const requestStatusEnum = pgEnum("request_status", REQUEST_STATUSES);
export const messageStatusEnum = pgEnum("message_status", MESSAGE_STATUSES);

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---------------------------------------------------------------------------
// Usuarios del panel y sesiones
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: userRoleEnum().notNull().default("secretaria"),
  active: boolean().notNull().default(true),
  lastLoginAt: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 del token que viaja en la cookie (nunca guardamos el token en claro)
    id: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    userAgent: text(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_expires_at_idx").on(t.expiresAt)],
);

// ---------------------------------------------------------------------------
// Miembros y predios
// ---------------------------------------------------------------------------

export const members = pgTable(
  "members",
  {
    id: uuid().primaryKey().defaultRandom(),
    memberNumber: integer().generatedAlwaysAsIdentity().unique(),
    fullName: text().notNull(),
    memberType: memberTypeEnum().notNull().default("propietario"),
    status: memberStatusEnum().notNull().default("activo"),
    email: text(),
    phone: text(),
    address: text(),
    joinedOn: date({ mode: "string" }),
    notes: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("members_status_idx").on(t.status), index("members_email_idx").on(t.email)],
);

export const properties = pgTable(
  "properties",
  {
    id: uuid().primaryKey().defaultRandom(),
    memberId: uuid()
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    name: text().notNull(),
    municipality: text(),
    locality: text(),
    tenure: tenureTypeEnum().notNull().default("privada"),
    areaHa: numeric({ precision: 12, scale: 2 }),
    cadastralKey: text(),
    notes: text(),
    createdAt: createdAt(),
  },
  (t) => [index("properties_member_id_idx").on(t.memberId)],
);

// ---------------------------------------------------------------------------
// Finanzas
// ---------------------------------------------------------------------------

export const fees = pgTable(
  "fees",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text(),
    amountCents: integer().notNull(),
    frequency: feeFrequencyEnum().notNull().default("anual"),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("fees_amount_positive", sql`${t.amountCents} > 0`)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    folio: integer().generatedAlwaysAsIdentity().unique(),
    memberId: uuid().references(() => members.id, { onDelete: "restrict" }),
    payerName: text(),
    feeId: uuid().references(() => fees.id, { onDelete: "set null" }),
    concept: paymentConceptEnum().notNull().default("cuota"),
    period: text(),
    amountCents: integer().notNull(),
    paidOn: date({ mode: "string" }).notNull(),
    method: paymentMethodEnum().notNull().default("efectivo"),
    reference: text(),
    notes: text(),
    status: paymentStatusEnum().notNull().default("vigente"),
    cancelReason: text(),
    cancelledAt: timestamp({ withTimezone: true }),
    cancelledBy: uuid().references(() => users.id, { onDelete: "set null" }),
    recordedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("payments_member_id_idx").on(t.memberId),
    index("payments_paid_on_idx").on(t.paidOn),
    index("payments_fee_period_idx").on(t.feeId, t.period),
    check("payments_amount_positive", sql`${t.amountCents} > 0`),
    check("payments_payer_present", sql`${t.memberId} IS NOT NULL OR ${t.payerName} IS NOT NULL`),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid().primaryKey().defaultRandom(),
    category: expenseCategoryEnum().notNull().default("otro"),
    description: text().notNull(),
    amountCents: integer().notNull(),
    spentOn: date({ mode: "string" }).notNull(),
    supplier: text(),
    method: paymentMethodEnum().notNull().default("efectivo"),
    reference: text(),
    notes: text(),
    recordedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("expenses_spent_on_idx").on(t.spentOn),
    check("expenses_amount_positive", sql`${t.amountCents} > 0`),
  ],
);

// ---------------------------------------------------------------------------
// Bitácora de actividades
// ---------------------------------------------------------------------------

export const activityRecords = pgTable(
  "activity_records",
  {
    id: uuid().primaryKey().defaultRandom(),
    type: recordTypeEnum().notNull().default("otro"),
    title: text().notNull(),
    description: text(),
    occurredOn: date({ mode: "string" }).notNull(),
    location: text(),
    participants: integer(),
    isPublic: boolean().notNull().default(false),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("activity_records_occurred_on_idx").on(t.occurredOn),
    index("activity_records_public_idx").on(t.isPublic, t.occurredOn),
  ],
);

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

export const documents = pgTable(
  "documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text(),
    category: documentCategoryEnum().notNull().default("otro"),
    documentDate: date({ mode: "string" }),
    storageKey: text().notNull(),
    fileName: text().notNull(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    isPublic: boolean().notNull().default(false),
    uploadedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("documents_category_idx").on(t.category), index("documents_public_idx").on(t.isPublic)],
);

// ---------------------------------------------------------------------------
// Contenido del sitio público
// ---------------------------------------------------------------------------

export const posts = pgTable(
  "posts",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    slug: text().notNull().unique(),
    excerpt: text(),
    body: text().notNull(),
    coverKey: text(),
    coverAlt: text(),
    published: boolean().notNull().default(false),
    publishedAt: timestamp({ withTimezone: true }),
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("posts_published_idx").on(t.published, t.publishedAt)],
);

export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text(),
    location: text(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }),
    published: boolean().notNull().default(true),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("events_starts_at_idx").on(t.startsAt)],
);

// ---------------------------------------------------------------------------
// Bandeja: mensajes, solicitudes de ingreso y reportes ciudadanos
// ---------------------------------------------------------------------------

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text(),
    subject: text().notNull(),
    message: text().notNull(),
    status: messageStatusEnum().notNull().default("nuevo"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("contact_messages_status_idx").on(t.status, t.createdAt)],
);

export const membershipRequests = pgTable(
  "membership_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    fullName: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    memberType: memberTypeEnum().notNull().default("propietario"),
    propertyName: text(),
    municipality: text(),
    locality: text(),
    areaHa: numeric({ precision: 12, scale: 2 }),
    message: text(),
    status: requestStatusEnum().notNull().default("pendiente"),
    memberId: uuid().references(() => members.id, { onDelete: "set null" }),
    reviewedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("membership_requests_status_idx").on(t.status, t.createdAt)],
);

export const citizenReports = pgTable(
  "citizen_reports",
  {
    id: uuid().primaryKey().defaultRandom(),
    folio: integer().generatedAlwaysAsIdentity().unique(),
    type: reportTypeEnum().notNull().default("otro"),
    location: text().notNull(),
    occurredOn: date({ mode: "string" }),
    description: text().notNull(),
    reporterName: text(),
    reporterPhone: text(),
    reporterEmail: text(),
    photoKeys: jsonb().$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    status: reportStatusEnum().notNull().default("nuevo"),
    adminNotes: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("citizen_reports_status_idx").on(t.status, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Auditoría y configuración
// ---------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    entityType: text(),
    entityId: text(),
    summary: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_logs_created_at_idx").on(t.createdAt), index("audit_logs_user_id_idx").on(t.userId)],
);

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: updatedAt(),
});

export type User = typeof users.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Fee = typeof fees.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ActivityRecord = typeof activityRecords.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type MembershipRequest = typeof membershipRequests.$inferSelect;
export type CitizenReport = typeof citizenReports.$inferSelect;
