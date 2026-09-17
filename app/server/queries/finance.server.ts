import { and, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { expenses, members, payments } from "~/db/schema";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_CONCEPTS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type ExpenseCategory,
  type PaymentConcept,
  type PaymentMethod,
  type PaymentStatus,
} from "~/lib/enums";
import { likeEscape, pickEnum } from "~/lib/validation";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pick = pickEnum;

function dateParam(value: string | null) {
  return value && DATE_RE.test(value) ? value : "";
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

export type PaymentFilters = {
  q: string;
  memberId: string;
  concept: PaymentConcept | "";
  method: PaymentMethod | "";
  status: PaymentStatus | "";
  from: string;
  to: string;
};

export function readPaymentFilters(url: URL): PaymentFilters {
  const p = url.searchParams;
  const memberId = p.get("miembro") ?? "";
  return {
    q: (p.get("q") ?? "").trim().slice(0, 100),
    memberId: UUID_RE.test(memberId) ? memberId : "",
    concept: pick(p.get("concepto"), PAYMENT_CONCEPTS),
    method: pick(p.get("metodo"), PAYMENT_METHODS),
    status: pick(p.get("estado"), PAYMENT_STATUSES),
    from: dateParam(p.get("desde")),
    to: dateParam(p.get("hasta")),
  };
}

/** Condiciones de filtro. Requiere un LEFT JOIN con members. */
export function paymentWhere(f: PaymentFilters) {
  const conditions: SQL[] = [];
  if (f.memberId) conditions.push(eq(payments.memberId, f.memberId));
  if (f.concept) conditions.push(eq(payments.concept, f.concept));
  if (f.method) conditions.push(eq(payments.method, f.method));
  if (f.status) conditions.push(eq(payments.status, f.status));
  if (f.from) conditions.push(gte(payments.paidOn, f.from));
  if (f.to) conditions.push(lte(payments.paidOn, f.to));
  if (f.q) {
    const like = `%${likeEscape(f.q)}%`;
    const options: SQL[] = [
      sql`f_unaccent(coalesce(${members.fullName}, ${payments.payerName}, '')) ilike f_unaccent(${like})`,
      ilike(payments.reference, like),
    ];
    if (/^\d{1,9}$/.test(f.q)) options.push(eq(payments.folio, Number(f.q)));
    conditions.push(or(...options)!);
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

// ---------------------------------------------------------------------------
// Gastos
// ---------------------------------------------------------------------------

export type ExpenseFilters = { q: string; category: ExpenseCategory | ""; from: string; to: string };

export function readExpenseFilters(url: URL): ExpenseFilters {
  const p = url.searchParams;
  return {
    q: (p.get("q") ?? "").trim().slice(0, 100),
    category: pick(p.get("categoria"), EXPENSE_CATEGORIES),
    from: dateParam(p.get("desde")),
    to: dateParam(p.get("hasta")),
  };
}

export function expenseWhere(f: ExpenseFilters) {
  const conditions: SQL[] = [];
  if (f.category) conditions.push(eq(expenses.category, f.category));
  if (f.from) conditions.push(gte(expenses.spentOn, f.from));
  if (f.to) conditions.push(lte(expenses.spentOn, f.to));
  if (f.q) {
    const like = `%${likeEscape(f.q)}%`;
    conditions.push(
      or(
        sql`f_unaccent(${expenses.description}) ilike f_unaccent(${like})`,
        ilike(expenses.supplier, like),
        ilike(expenses.reference, like),
      )!,
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
