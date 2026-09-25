import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // ---------------------------------------------------------------------------
  // Sitio público
  // ---------------------------------------------------------------------------
  layout("routes/site/layout.tsx", [
    index("routes/site/home.tsx"),
    route("quienes-somos", "routes/site/about.tsx"),
    route("el-bosque", "routes/site/forest.tsx"),
    route("que-hacemos", "routes/site/work.tsx"),
    route("noticias", "routes/site/news.tsx"),
    route("noticias/:slug", "routes/site/news-post.tsx"),
    route("eventos", "routes/site/events.tsx"),
    route("transparencia", "routes/site/transparency.tsx"),
    route("reportar", "routes/site/report.tsx"),
    route("unete", "routes/site/join.tsx"),
    route("contacto", "routes/site/contact.tsx"),
    route("aviso-de-privacidad", "routes/site/privacy.tsx"),
    route("*", "routes/site/not-found.tsx"),
  ]),

  // Recursos (sin interfaz)
  route("media/*", "routes/resources/media.ts"),
  route("documentos/:documentId", "routes/resources/public-document.ts"),
  route("sitemap.xml", "routes/resources/sitemap.ts"),
  route("robots.txt", "routes/resources/robots.ts"),
  route("healthz", "routes/resources/healthz.ts"),

  // ---------------------------------------------------------------------------
  // Panel de administración y autenticación
  // ---------------------------------------------------------------------------
  route("login", "routes/admin/login.tsx"),
  route("admin/login", "routes/admin/login-redirect.ts"),
  route("admin/logout", "routes/admin/logout.ts"),
  route("admin", "routes/admin/layout.tsx", [
    layout("routes/admin/boundary.tsx", [
      index("routes/admin/dashboard.tsx"),

      route("miembros", "routes/admin/members/list.tsx"),
      route("miembros/nuevo", "routes/admin/members/new.tsx"),
      route("miembros/exportar", "routes/admin/members/export.ts"),
      route("miembros/:memberId", "routes/admin/members/detail.tsx"),
      route("miembros/:memberId/editar", "routes/admin/members/edit.tsx"),

      route("pagos", "routes/admin/payments/list.tsx"),
      route("pagos/nuevo", "routes/admin/payments/new.tsx"),
      route("pagos/exportar", "routes/admin/payments/export.ts"),
      route("pagos/adeudos", "routes/admin/payments/debts.tsx"),
      route("pagos/:paymentId", "routes/admin/payments/detail.tsx"),
      route("cuotas", "routes/admin/fees.tsx"),

      route("gastos", "routes/admin/expenses/list.tsx"),
      route("gastos/nuevo", "routes/admin/expenses/new.tsx"),
      route("gastos/exportar", "routes/admin/expenses/export.ts"),
      route("gastos/:expenseId", "routes/admin/expenses/edit.tsx"),

      route("bitacora", "routes/admin/records/list.tsx"),
      route("bitacora/nuevo", "routes/admin/records/new.tsx"),
      route("bitacora/:recordId", "routes/admin/records/edit.tsx"),

      route("documentos", "routes/admin/documents/list.tsx"),
      route("documentos/subir", "routes/admin/documents/upload.tsx"),
      route("documentos/:documentId", "routes/admin/documents/edit.tsx"),
      route("documentos/:documentId/archivo", "routes/admin/documents/file.ts"),

      route("reportes", "routes/admin/inbox/reports.tsx"),
      route("reportes/:reportId", "routes/admin/inbox/report-detail.tsx"),
      route("reportes/:reportId/fotos/:index", "routes/admin/inbox/report-photo.ts"),
      route("solicitudes", "routes/admin/inbox/requests.tsx"),
      route("mensajes", "routes/admin/inbox/messages.tsx"),

      route("noticias", "routes/admin/posts/list.tsx"),
      route("noticias/nueva", "routes/admin/posts/new.tsx"),
      route("noticias/:postId", "routes/admin/posts/edit.tsx"),

      route("eventos", "routes/admin/events/list.tsx"),
      route("eventos/nuevo", "routes/admin/events/new.tsx"),
      route("eventos/:eventId", "routes/admin/events/edit.tsx"),

      route("usuarios", "routes/admin/users/list.tsx"),
      route("usuarios/nuevo", "routes/admin/users/new.tsx"),
      route("usuarios/:userId", "routes/admin/users/edit.tsx"),

      route("configuracion", "routes/admin/settings.tsx"),
      route("auditoria", "routes/admin/audit.tsx"),
      route("mi-cuenta", "routes/admin/account.tsx"),
      route("*", "routes/admin/not-found.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
