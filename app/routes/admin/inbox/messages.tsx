import { count, desc, eq, ne } from "drizzle-orm";
import { Archive, CheckCheck, Eye, Mail, Phone, Reply, Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import { FilterBar, FilterSelect } from "~/components/admin/filters";
import { Button, ConfirmButton } from "~/components/ui/button";
import { Badge, EmptyState, PageHeader, Pagination } from "~/components/ui/data";
import { contactMessages } from "~/db/schema";
import { MESSAGE_STATUSES, type MessageStatus } from "~/lib/enums";
import { formatDateTime } from "~/lib/format";
import { MESSAGE_STATUS_LABELS, MESSAGE_STATUS_TONES, toOptions } from "~/lib/labels";
import { messageStatusSchema } from "~/lib/schemas/admin";
import { telLink } from "~/lib/utils";
import { pageParam, validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/messages";

const PAGE_SIZE = 20;

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "inbox");
  const statusParam = url.searchParams.get("estado") ?? "";
  const status = (MESSAGE_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as MessageStatus) : "";
  const page = pageParam(url);
  // Sin filtro se ocultan los archivados.
  const where = status ? eq(contactMessages.status, status) : ne(contactMessages.status, "archivado");

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(contactMessages)
      .where(where)
      .orderBy(desc(contactMessages.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(contactMessages).where(where),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), status };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "inbox");
  const formData = await request.formData();

  if (getIntent(formData) === "delete") {
    const id = requireId(String(formData.get("id") ?? ""));
    const [deleted] = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning({ name: contactMessages.name, subject: contactMessages.subject });
    if (deleted) {
      await audit({ userId: user.id, action: "message.delete", summary: `Eliminó el mensaje "${deleted.subject}" de ${deleted.name}` });
    }
    return redirectWithToast("/admin/mensajes", { type: "success", message: "Mensaje eliminado." });
  }

  const result = validateForm(messageStatusSchema, formData);
  if (!result.success) throw data("Solicitud inválida", { status: 400 });
  await db.update(contactMessages).set({ status: result.data.status }).where(eq(contactMessages.id, result.data.id));
  return redirectWithToast("/admin/mensajes", {
    type: "success",
    message: `Mensaje marcado como "${MESSAGE_STATUS_LABELS[result.data.status].toLowerCase()}".`,
  });
}

export default function Messages({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, status } = loaderData;

  return (
    <>
      <PageHeader title="Mensajes" description="Mensajes recibidos desde el formulario de contacto del sitio." />

      <FilterBar hasFilters={Boolean(status)}>
        <FilterSelect
          name="estado"
          label="Estado"
          options={toOptions(MESSAGE_STATUS_LABELS)}
          defaultValue={status}
          allLabel="Todos (sin archivados)"
        />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <ul className="space-y-4">
            {rows.map((message) => (
              <li
                key={message.id}
                className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${message.status === "nuevo" ? "ring-amber-300" : "ring-stone-200"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-stone-900">{message.subject}</h2>
                      <Badge tone={MESSAGE_STATUS_TONES[message.status]}>{MESSAGE_STATUS_LABELS[message.status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {message.name} · {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1 text-forest-700 hover:underline">
                      <Mail className="size-4" aria-hidden /> {message.email}
                    </a>
                    {message.phone && (
                      <a href={telLink(message.phone)} className="inline-flex items-center gap-1 text-forest-700 hover:underline">
                        <Phone className="size-4" aria-hidden /> {message.phone}
                      </a>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm whitespace-pre-line text-stone-800">{message.message}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-forest-700 px-3 text-sm font-medium text-white hover:bg-forest-800"
                  >
                    <Reply className="size-4" aria-hidden /> Responder
                  </a>
                  {(
                    [
                      { status: "leido", label: "Leído", icon: Eye },
                      { status: "atendido", label: "Atendido", icon: CheckCheck },
                      { status: "archivado", label: "Archivar", icon: Archive },
                    ] as const
                  )
                    .filter((option) => option.status !== message.status)
                    .map(({ status: nextStatus, label, icon: Icon }) => (
                      <Form method="post" key={nextStatus}>
                        <input type="hidden" name="id" value={message.id} />
                        <input type="hidden" name="status" value={nextStatus} />
                        <Button type="submit" variant="secondary" size="sm">
                          <Icon aria-hidden /> {label}
                        </Button>
                      </Form>
                    ))}
                  <Form method="post" className="ml-auto">
                    <input type="hidden" name="id" value={message.id} />
                    <ConfirmButton name="intent" value="delete" variant="ghost" size="sm" message="¿Eliminar este mensaje?" aria-label="Eliminar mensaje">
                      <Trash2 aria-hidden />
                    </ConfirmButton>
                  </Form>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState icon={Mail} title="Sin mensajes" description="Los mensajes enviados desde la página de contacto aparecerán aquí." />
      )}
    </>
  );
}
