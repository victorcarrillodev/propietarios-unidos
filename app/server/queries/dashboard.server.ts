import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { activityRecords, citizenReports, events, expenses, members, payments } from "~/db/schema";
import type { PaymentConcept } from "~/lib/enums";
import { currentMonth, currentYear, shiftMonth } from "~/lib/format";
import { db } from "../db.server";

export type MonthlyPoint = {
  month: string;
  income: number;
  expenses: number;
};

export type DashboardFinanceSummary = {
  monthIncome: number;
  yearIncome: number;
  yearExpenses: number;
  year: number;
  monthly: MonthlyPoint[];
  latestPayments: {
    id: string;
    folio: number;
    amountCents: number;
    paidOn: string;
    concept: PaymentConcept;
    payerName: string | null;
    memberName: string | null;
  }[];
};

export type DashboardMembersSummary = {
  activo: number;
  pendiente: number;
  inactivo: number;
};

export async function getDashboardFinanceSummary(): Promise<DashboardFinanceSummary> {
  const month = currentMonth();
  const year = currentYear();
  const firstMonth = shiftMonth(month, -11);
  const vigente = eq(payments.status, "vigente");

  const [[totals], [expenseTotals], incomeByMonth, expensesByMonth, latestPayments] = await Promise.all([
    db
      .select({
        month: sql<number>`coalesce(sum(${payments.amountCents}) filter (where ${payments.paidOn} >= ${`${month}-01`} and ${payments.paidOn} < ${`${shiftMonth(month, 1)}-01`}), 0)::float8`.mapWith(Number),
        year: sql<number>`coalesce(sum(${payments.amountCents}) filter (where ${payments.paidOn} >= ${`${year}-01-01`} and ${payments.paidOn} < ${`${year + 1}-01-01`}), 0)::float8`.mapWith(Number),
      })
      .from(payments)
      .where(vigente),
    db
      .select({
        year: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::float8`.mapWith(Number),
      })
      .from(expenses)
      .where(and(gte(expenses.spentOn, `${year}-01-01`), lt(expenses.spentOn, `${year + 1}-01-01`))),
    db
      .select({
        month: sql<string>`to_char(${payments.paidOn}, 'YYYY-MM')`,
        total: sql<number>`sum(${payments.amountCents})::float8`.mapWith(Number),
      })
      .from(payments)
      .where(and(vigente, gte(payments.paidOn, `${firstMonth}-01`)))
      .groupBy(sql`1`),
    db
      .select({
        month: sql<string>`to_char(${expenses.spentOn}, 'YYYY-MM')`,
        total: sql<number>`sum(${expenses.amountCents})::float8`.mapWith(Number),
      })
      .from(expenses)
      .where(gte(expenses.spentOn, `${firstMonth}-01`))
      .groupBy(sql`1`),
    db
      .select({
        id: payments.id,
        folio: payments.folio,
        amountCents: payments.amountCents,
        paidOn: payments.paidOn,
        concept: payments.concept,
        payerName: payments.payerName,
        memberName: members.fullName,
      })
      .from(payments)
      .leftJoin(members, eq(members.id, payments.memberId))
      .where(vigente)
      .orderBy(desc(payments.paidOn), desc(payments.folio))
      .limit(5),
  ]);

  const incomeMap = new Map(incomeByMonth.map((row) => [row.month, row.total]));
  const expenseMap = new Map(expensesByMonth.map((row) => [row.month, row.total]));
  const monthly: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => {
    const key = shiftMonth(firstMonth, i);
    return { month: key, income: incomeMap.get(key) ?? 0, expenses: expenseMap.get(key) ?? 0 };
  });

  return {
    monthIncome: totals?.month ?? 0,
    yearIncome: totals?.year ?? 0,
    yearExpenses: expenseTotals?.year ?? 0,
    year,
    monthly,
    latestPayments,
  };
}

export async function getDashboardMembersSummary(): Promise<DashboardMembersSummary> {
  const memberCounts = await db
    .select({ status: members.status, total: count() })
    .from(members)
    .groupBy(members.status);

  return {
    activo: memberCounts.find((row) => row.status === "activo")?.total ?? 0,
    pendiente: memberCounts.find((row) => row.status === "pendiente")?.total ?? 0,
    inactivo: memberCounts.find((row) => row.status === "inactivo")?.total ?? 0,
  };
}

export async function getDashboardInboxSummary() {
  return db
    .select({
      id: citizenReports.id,
      folio: citizenReports.folio,
      type: citizenReports.type,
      location: citizenReports.location,
      status: citizenReports.status,
      createdAt: citizenReports.createdAt,
    })
    .from(citizenReports)
    .orderBy(desc(citizenReports.createdAt))
    .limit(5);
}

export async function getDashboardRecordsSummary() {
  return db
    .select({
      id: activityRecords.id,
      type: activityRecords.type,
      title: activityRecords.title,
      occurredOn: activityRecords.occurredOn,
      isPublic: activityRecords.isPublic,
    })
    .from(activityRecords)
    .orderBy(desc(activityRecords.occurredOn), desc(activityRecords.createdAt))
    .limit(5);
}

export async function getDashboardUpcomingEvents() {
  return db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      location: events.location,
    })
    .from(events)
    .where(gte(events.startsAt, new Date()))
    .orderBy(asc(events.startsAt))
    .limit(3);
}
