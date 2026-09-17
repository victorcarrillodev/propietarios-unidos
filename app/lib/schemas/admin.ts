import { z } from "zod";
import {
  DOCUMENT_CATEGORIES,
  EXPENSE_CATEGORIES,
  FEE_FREQUENCIES,
  MEMBER_STATUSES,
  MEMBER_TYPES,
  MESSAGE_STATUSES,
  PAYMENT_CONCEPTS,
  PAYMENT_METHODS,
  RECORD_TYPES,
  REPORT_STATUSES,
  TENURE_TYPES,
  USER_ROLES,
} from "../enums";
import {
  checkbox,
  moneyCents,
  newPassword,
  optionalDate,
  optionalDateTime,
  optionalDecimal,
  optionalEmail,
  optionalInt,
  optionalMatch,
  optionalPhone,
  optionalText,
  optionalUuid,
  requiredDate,
  requiredDateTime,
  requiredEmail,
  requiredText,
  selectEnum,
} from "../validation";

export const memberSchema = z.object({
  fullName: requiredText("El nombre", 150),
  memberType: selectEnum(MEMBER_TYPES, "el tipo de miembro"),
  status: selectEnum(MEMBER_STATUSES, "el estado"),
  email: optionalEmail,
  phone: optionalPhone,
  address: optionalText(300),
  joinedOn: optionalDate,
  notes: optionalText(4000),
});

export const propertySchema = z.object({
  name: requiredText("El nombre del predio", 150),
  municipality: optionalText(80),
  locality: optionalText(150),
  tenure: selectEnum(TENURE_TYPES, "el régimen de propiedad"),
  areaHa: optionalDecimal,
  cadastralKey: optionalText(80),
  notes: optionalText(1000),
});

export const feeSchema = z.object({
  name: requiredText("El nombre", 120),
  description: optionalText(500),
  amount: moneyCents("El monto"),
  frequency: selectEnum(FEE_FREQUENCIES, "la periodicidad"),
});

export const paymentSchema = z
  .object({
    memberId: optionalUuid,
    payerName: optionalText(150),
    feeId: optionalUuid,
    concept: selectEnum(PAYMENT_CONCEPTS, "el concepto"),
    period: optionalMatch(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "Usa el formato AAAA o AAAA-MM (ej. 2026 o 2026-09)", 7),
    amount: moneyCents("El monto"),
    paidOn: requiredDate("La fecha de pago"),
    method: selectEnum(PAYMENT_METHODS, "el método de pago"),
    reference: optionalText(120),
    notes: optionalText(1000),
  })
  .refine((value) => value.memberId !== null || value.payerName !== null, {
    message: "Selecciona un miembro o escribe el nombre de quien realiza el pago",
    path: ["payerName"],
  });

export const cancelPaymentSchema = z.object({
  reason: requiredText("El motivo", 300),
});

export const expenseSchema = z.object({
  category: selectEnum(EXPENSE_CATEGORIES, "la categoría"),
  description: requiredText("La descripción", 300),
  amount: moneyCents("El monto"),
  spentOn: requiredDate("La fecha"),
  supplier: optionalText(150),
  method: selectEnum(PAYMENT_METHODS, "el método de pago"),
  reference: optionalText(120),
  notes: optionalText(1000),
});

export const recordSchema = z.object({
  type: selectEnum(RECORD_TYPES, "el tipo de actividad"),
  title: requiredText("El título", 200),
  description: optionalText(5000),
  occurredOn: requiredDate("La fecha"),
  location: optionalText(200),
  participants: optionalInt(10000),
  isPublic: checkbox,
});

export const documentSchema = z.object({
  title: requiredText("El título", 200),
  description: optionalText(1000),
  category: selectEnum(DOCUMENT_CATEGORIES, "la categoría"),
  documentDate: optionalDate,
  isPublic: checkbox,
});

export const postSchema = z.object({
  title: requiredText("El título", 200),
  slug: optionalMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej. jornada-de-limpieza)", 80),
  excerpt: optionalText(400),
  body: requiredText("El contenido", 50000),
  coverAlt: optionalText(200),
  published: checkbox,
  publishedAt: optionalDateTime,
  removeCover: checkbox,
});

export const eventSchema = z
  .object({
    title: requiredText("El título", 200),
    description: optionalText(4000),
    location: optionalText(200),
    startsAt: requiredDateTime("La fecha de inicio"),
    endsAt: optionalDateTime,
    published: checkbox,
  })
  .refine((value) => !value.endsAt || value.endsAt > value.startsAt, {
    message: "El término debe ser posterior al inicio",
    path: ["endsAt"],
  });

export const reportUpdateSchema = z.object({
  status: selectEnum(REPORT_STATUSES, "el estado"),
  adminNotes: optionalText(5000),
});

export const messageStatusSchema = z.object({
  id: z.uuid(),
  status: selectEnum(MESSAGE_STATUSES, "el estado"),
});

export const newUserSchema = z.object({
  name: requiredText("El nombre", 120),
  email: requiredEmail,
  role: selectEnum(USER_ROLES, "el rol"),
  password: newPassword,
});

export const editUserSchema = z.object({
  name: requiredText("El nombre", 120),
  email: requiredEmail,
  role: selectEnum(USER_ROLES, "el rol"),
  active: checkbox,
  password: z.preprocess((value) => (value === "" ? undefined : value), newPassword.optional()),
});

export const profileSchema = z.object({
  name: requiredText("Tu nombre", 120),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ error: "Escribe tu contraseña actual" }).min(1, "Escribe tu contraseña actual"),
    newPassword,
    confirmPassword: z.string({ error: "Confirma la contraseña" }),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
