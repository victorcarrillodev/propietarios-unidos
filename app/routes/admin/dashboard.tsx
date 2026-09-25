import {
  BadgeDollarSign,
  CalendarDays,
  Flag,
  Mail,
  NotebookPen,
  Plus,
  Receipt,
  Scale,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router";
import { MonthlyFinanceChart, StatTile } from "~/components/admin/charts";
import { Badge, ButtonLink, Card, PageHeader } from "~/components/ui";
import {
  formatDate,
  formatDateTime,
  formatLongDate,
  formatMoney,
  formatNumber,
  todayISO,
} from "~/lib/format";
import {
  PAYMENT_CONCEPT_LABELS,
  RECORD_TYPE_LABELS,
  RECORD_TYPE_TONES,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_TONES,
  REPORT_TYPE_LABELS,
} from "~/lib/labels";
import { can } from "~/lib/permissions";
import { getUser } from "~/server/guards.server";
import {
  getDashboardFinanceSummary,
  getDashboardInboxSummary,
  getDashboardMembersSummary,
  getDashboardRecordsSummary,
  getDashboardUpcomingEvents,
} from "~/server/queries/dashboard.server";
import type { Route } from "./+types/dashboard";

export async function loader({ context }: Route.LoaderArgs) {
  const user = getUser(context);
  const role = user.role;

  const [membersByStatus, finance, inbox, records, upcoming] = await Promise.all([
    can(role, "members") ? getDashboardMembersSummary() : null,
    can(role, "finance") ? getDashboardFinanceSummary() : null,
    can(role, "inbox") ? getDashboardInboxSummary() : null,
    can(role, "records") ? getDashboardRecordsSummary() : null,
    getDashboardUpcomingEvents(),
  ]);

  return { user, today: todayISO(), membersByStatus, finance, inbox, records, upcoming };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, today, membersByStatus, finance, inbox, records, upcoming } = loaderData;
  const firstName = user.name.split(" ")[0];
  const role = user.role;

  return (
    <>
      <PageHeader
        title={`Hola, ${firstName}`}
        description={<span className="first-letter:uppercase">Resumen al {formatLongDate(today)}</span>}
        actions={
          <>
            {can(role, "finance") && (
              <ButtonLink to="/admin/pagos/nuevo">
                <Plus aria-hidden /> Registrar pago
              </ButtonLink>
            )}
            {can(role, "members") && (
              <ButtonLink to="/admin/miembros/nuevo" variant="secondary">
                <UserPlus aria-hidden /> Nuevo miembro
              </ButtonLink>
            )}
            {can(role, "records") && (
              <ButtonLink to="/admin/bitacora/nuevo" variant="secondary">
                <NotebookPen aria-hidden /> Registrar actividad
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {membersByStatus && (
          <StatTile
            label="Miembros activos"
            value={formatNumber(membersByStatus.activo)}
            hint={`${formatNumber(membersByStatus.pendiente)} pendientes · ${formatNumber(membersByStatus.inactivo)} inactivos`}
            icon={Users}
            to="/admin/miembros"
          />
        )}
        {finance && (
          <>
            <StatTile
              label="Ingresos del mes"
              value={formatMoney(finance.monthIncome)}
              icon={Wallet}
              to="/admin/pagos"
            />
            <StatTile
              label={`Ingresos ${finance.year}`}
              value={formatMoney(finance.yearIncome)}
              hint={`Gastos: ${formatMoney(finance.yearExpenses)}`}
              icon={BadgeDollarSign}
            />
            <StatTile
              label={`Balance ${finance.year}`}
              value={formatMoney(finance.yearIncome - finance.yearExpenses)}
              hint="Ingresos menos gastos del año"
              icon={Scale}
              to="/admin/gastos"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {finance && (
          <Card
            title="Ingresos y gastos"
            description="Últimos 12 meses (pagos vigentes y gastos registrados)"
            className="xl:col-span-2"
          >
            <MonthlyFinanceChart data={finance.monthly} />
          </Card>
        )}

        {inbox && (
          <Card
            title="Reportes ciudadanos"
            description="Lo más reciente del sitio público"
            actions={
              <Link to="/admin/reportes" className="text-sm font-medium text-forest-700 hover:text-forest-900">
                Ver todos
              </Link>
            }
            bodyClassName="p-0"
          >
            {inbox.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {inbox.map((report) => (
                  <li key={report.id}>
                    <Link to={`/admin/reportes/${report.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-stone-50">
                      <Flag className="mt-0.5 size-4 shrink-0 text-stone-400" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-900">
                          #{report.folio} · {REPORT_TYPE_LABELS[report.type]}
                        </p>
                        <p className="truncate text-xs text-stone-500">{report.location}</p>
                      </div>
                      <Badge tone={REPORT_STATUS_TONES[report.status]}>{REPORT_STATUS_LABELS[report.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-stone-500">Sin reportes por ahora.</p>
            )}
          </Card>
        )}

        {finance && (
          <Card
            title="Últimos pagos"
            actions={
              <Link to="/admin/pagos" className="text-sm font-medium text-forest-700 hover:text-forest-900">
                Ver todos
              </Link>
            }
            bodyClassName="p-0"
            className={inbox ? "xl:col-span-2" : undefined}
          >
            {finance.latestPayments.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {finance.latestPayments.map((payment) => (
                  <li key={payment.id}>
                    <Link
                      to={`/admin/pagos/${payment.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-stone-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {payment.memberName ?? payment.payerName}
                        </p>
                        <p className="text-xs text-stone-500">
                          Folio {payment.folio} · {PAYMENT_CONCEPT_LABELS[payment.concept]} · {formatDate(payment.paidOn)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-stone-900 tabular-nums">
                        {formatMoney(payment.amountCents)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-stone-500">Aún no hay pagos registrados.</p>
            )}
          </Card>
        )}

        {records && (
          <Card
            title="Bitácora"
            actions={
              <Link to="/admin/bitacora" className="text-sm font-medium text-forest-700 hover:text-forest-900">
                Ver todo
              </Link>
            }
            bodyClassName="p-0"
          >
            {records.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {records.map((record) => (
                  <li key={record.id}>
                    <Link to={`/admin/bitacora/${record.id}`} className="block px-5 py-3 hover:bg-stone-50">
                      <p className="text-sm font-medium text-stone-900">{record.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                        {formatDate(record.occurredOn)}
                        <Badge tone={RECORD_TYPE_TONES[record.type]}>{RECORD_TYPE_LABELS[record.type]}</Badge>
                        {record.isPublic && <Badge tone="blue">Pública</Badge>}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-stone-500">Sin actividades registradas.</p>
            )}
          </Card>
        )}

        <Card
          title="Próximos eventos"
          actions={
            can(role, "content") ? (
              <Link to="/admin/eventos" className="text-sm font-medium text-forest-700 hover:text-forest-900">
                Administrar
              </Link>
            ) : undefined
          }
          bodyClassName="p-0"
        >
          {upcoming.length > 0 ? (
            <ul className="divide-y divide-stone-100">
              {upcoming.map((event) => (
                <li key={event.id} className="flex gap-3 px-5 py-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-stone-400" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-stone-900">{event.title}</p>
                    <p className="text-xs text-stone-500">
                      {formatDateTime(event.startsAt)}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-stone-500">No hay eventos programados.</p>
          )}
        </Card>

        {!finance && !inbox && !records && (
          <Card title="Accesos rápidos">
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/admin/mi-cuenta" variant="secondary">
                <Mail aria-hidden /> Mi cuenta
              </ButtonLink>
              <ButtonLink to="/admin/noticias" variant="secondary">
                <Receipt aria-hidden /> Noticias
              </ButtonLink>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
