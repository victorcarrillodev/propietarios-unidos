import {
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  FileText,
  Flag,
  HandCoins,
  LayoutDashboard,
  Mail,
  Newspaper,
  NotebookPen,
  Receipt,
  ScrollText,
  Settings,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { AppModule } from "~/lib/permissions";

export type BadgeKey = "reports" | "requests" | "messages";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  module?: AppModule;
  end?: boolean;
  badge?: BadgeKey;
};

export type NavGroup = { label?: string; items: NavItem[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    items: [{ to: "/admin", label: "Panel", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Asociación",
    items: [
      { to: "/admin/miembros", label: "Miembros", icon: Users, module: "members" },
      { to: "/admin/bitacora", label: "Bitácora", icon: NotebookPen, module: "records" },
      { to: "/admin/documentos", label: "Documentos", icon: FileText, module: "documents" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { to: "/admin/pagos", label: "Pagos", icon: BadgeDollarSign, module: "finance" },
      { to: "/admin/pagos/adeudos", label: "Adeudos", icon: ClipboardList, module: "finance", end: true },
      { to: "/admin/cuotas", label: "Cuotas", icon: HandCoins, module: "finance" },
      { to: "/admin/gastos", label: "Gastos", icon: Receipt, module: "finance" },
    ],
  },
  {
    label: "Bandeja",
    items: [
      { to: "/admin/reportes", label: "Reportes", icon: Flag, module: "inbox", badge: "reports" },
      { to: "/admin/solicitudes", label: "Solicitudes", icon: UserPlus, module: "inbox", badge: "requests" },
      { to: "/admin/mensajes", label: "Mensajes", icon: Mail, module: "inbox", badge: "messages" },
    ],
  },
  {
    label: "Sitio web",
    items: [
      { to: "/admin/noticias", label: "Noticias", icon: Newspaper, module: "content" },
      { to: "/admin/eventos", label: "Eventos", icon: CalendarDays, module: "content" },
      { to: "/admin/configuracion", label: "Configuración", icon: Settings, module: "settings" },
    ],
  },
  {
    label: "Administración",
    items: [
      { to: "/admin/usuarios", label: "Usuarios", icon: UsersRound, module: "users" },
      { to: "/admin/auditoria", label: "Auditoría", icon: ScrollText, module: "audit" },
    ],
  },
];
