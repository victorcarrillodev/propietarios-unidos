import { ChevronRight, ExternalLink, LogOut, Menu, UserRound, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, NavLink, useLocation, useNavigation } from "react-router";
import { LogoMark } from "~/components/brand";
import type { UserRole } from "~/lib/enums";
import { ROLE_LABELS } from "~/lib/labels";
import { can } from "~/lib/permissions";
import { cn } from "~/lib/utils";
import { ADMIN_NAV, type BadgeKey } from "./nav";

export type ShellUser = { name: string; email: string; role: UserRole };
export type Badges = Record<BadgeKey, number>;

function NavItemLink({
  to,
  label,
  icon: Icon,
  end,
  count,
  indent = false,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  count: number;
  indent?: boolean;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        prefetch="intent"
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-xl py-2 text-sm font-medium transition-all duration-150",
            indent ? "pr-3 pl-8" : "px-3",
            isActive
              ? "bg-white/12 text-white shadow-xs font-semibold"
              : "text-forest-100/90 hover:bg-white/6 hover:text-white",
          )
        }
      >
        <Icon className="size-4 shrink-0 text-forest-300" aria-hidden />
        <span className="flex-1">{label}</span>
        {count > 0 && (
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs leading-none font-bold text-forest-950 shadow-xs">
            {count}
            <span className="sr-only"> pendientes</span>
          </span>
        )}
      </NavLink>
    </li>
  );
}

/** Grupos con nombre se colapsan; el grupo de la sección activa se abre solo la primera vez, luego el clic del usuario manda. */
function AdminNav({ role, badges }: { role: UserRole; badges: Badges }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Navegación del panel" className="space-y-1">
      {ADMIN_NAV.map((group, index) => {
        const items = group.items.filter((item) => !item.module || can(role, item.module));
        if (items.length === 0) return null;

        if (!group.label) {
          return (
            <ul key={index} className="space-y-0.5 pb-5">
              {items.map((item) => (
                <NavItemLink key={item.to} to={item.to} label={item.label} icon={item.icon} end={item.end} count={item.badge ? badges[item.badge] : 0} />
              ))}
            </ul>
          );
        }

        const isActiveGroup = items.some((item) =>
          item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
        );
        const isOpen = expanded[group.label] ?? isActiveGroup;
        const pendingCount = items.reduce((sum, item) => sum + (item.badge ? badges[item.badge] : 0), 0);

        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [group.label!]: !isOpen }))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold tracking-wider text-forest-300/70 uppercase transition-colors hover:text-forest-100"
            >
              <ChevronRight className={cn("size-3 shrink-0 transition-transform duration-150", isOpen && "rotate-90")} aria-hidden />
              <span className="flex-1">{group.label}</span>
              {!isOpen && pendingCount > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 py-px text-[10px] leading-none font-bold text-forest-950">
                  {pendingCount}
                </span>
              )}
            </button>
            {isOpen && (
              <ul className="space-y-0.5 pb-4">
                {items.map((item) => (
                  <NavItemLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    end={item.end}
                    count={item.badge ? badges[item.badge] : 0}
                    indent
                  />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function UserPanel({ user }: { user: ShellUser }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <div className="flex items-center gap-3 px-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-forest-100 shadow-xs">
          <UserRound className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-forest-300">{ROLE_LABELS[user.role]}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-0.5">
        <Link
          to="/admin/mi-cuenta"
          className="rounded-xl px-3 py-2 text-sm text-forest-100/90 transition-colors hover:bg-white/6 hover:text-white"
        >
          Mi cuenta
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-forest-100/90 transition-colors hover:bg-white/6 hover:text-white"
        >
          <span>Ver sitio público</span>
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
        <Form method="post" action="/admin/logout">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-forest-100/90 transition-colors hover:bg-white/6 hover:text-white cursor-pointer"
          >
            <LogOut className="size-4" aria-hidden /> Cerrar sesión
          </button>
        </Form>
      </div>
    </div>
  );
}

/** Barra de progreso superior durante cargas de navegación. */
function NavigationProgress() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";
  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-sm transition-transform duration-500 print:hidden",
        active ? "scale-x-75" : "scale-x-0 duration-150",
      )}
    />
  );
}

export function AdminShell({
  user,
  badges,
  children,
}: {
  user: ShellUser;
  badges: Badges;
  children: React.ReactNode;
}) {
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const location = useLocation();

  useEffect(() => {
    mobileMenu.current?.removeAttribute("open");
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-stone-100/90 lg:flex">
      <NavigationProgress />

      {/* Barra lateral escritorio */}
      <aside className="hidden w-64 shrink-0 bg-forest-950 print:hidden lg:block">
        <div className="sticky top-0 flex h-screen flex-col gap-6 overflow-y-auto px-3.5 py-6">
          <Link to="/admin" className="flex items-center gap-3 px-2 group">
            <LogoMark className="size-9 transition-transform group-hover:scale-105" />
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold text-white tracking-tight">
                Propietarios Unidos
              </span>
              <span className="block text-xs text-forest-300">Panel administrativo</span>
            </span>
          </Link>
          <div className="flex-1">
            <AdminNav role={user.role} badges={badges} />
          </div>
          <UserPanel user={user} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Barra superior móvil */}
        <header className="sticky top-0 z-40 bg-forest-950 print:hidden lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/admin" className="flex items-center gap-2.5">
              <LogoMark className="size-8" />
              <span className="font-display font-semibold text-white tracking-tight">Panel</span>
            </Link>
            <details ref={mobileMenu} className="group">
              <summary
                className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5 group-open:hidden" aria-hidden />
                <X className="hidden size-5 group-open:block" aria-hidden />
              </summary>
              <div className="absolute inset-x-0 top-16 max-h-[calc(100vh-4rem)] overflow-y-auto bg-forest-950 px-4 pt-3 pb-8 shadow-2xl">
                <AdminNav role={user.role} badges={badges} />
                <div className="mt-6">
                  <UserPanel user={user} />
                </div>
              </div>
            </details>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
