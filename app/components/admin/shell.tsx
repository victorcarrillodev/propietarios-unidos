import { ExternalLink, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Form, Link, NavLink, useLocation, useNavigation } from "react-router";
import { LogoMark } from "~/components/brand";
import type { UserRole } from "~/lib/enums";
import { ROLE_LABELS } from "~/lib/labels";
import { can } from "~/lib/permissions";
import { cn } from "~/lib/utils";
import { ADMIN_NAV, type BadgeKey } from "./nav";

type ShellUser = { name: string; email: string; role: UserRole };
type Badges = Record<BadgeKey, number>;

function AdminNav({ role, badges }: { role: UserRole; badges: Badges }) {
  return (
    <nav aria-label="Panel" className="space-y-6">
      {ADMIN_NAV.map((group, index) => {
        const items = group.items.filter((item) => !item.module || can(role, item.module));
        if (items.length === 0) return null;
        return (
          <div key={group.label ?? index}>
            {group.label && (
              <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-forest-300/80 uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map(({ to, label, icon: Icon, end, badge }) => {
                const count = badge ? badges[badge] : 0;
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      prefetch="intent"
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive ? "bg-white/10 text-white" : "text-forest-100 hover:bg-white/5 hover:text-white",
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1">{label}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-xs leading-none font-semibold text-forest-950">
                          {count}
                          <span className="sr-only"> pendientes</span>
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
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
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-forest-100">
          <UserRound className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-forest-300">{ROLE_LABELS[user.role]}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-0.5">
        <Link
          to="/admin/mi-cuenta"
          className="rounded-lg px-3 py-2 text-sm text-forest-100 hover:bg-white/5 hover:text-white"
        >
          Mi cuenta
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-forest-100 hover:bg-white/5 hover:text-white"
        >
          Ver sitio público <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <Form method="post" action="/admin/logout">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-forest-100 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden /> Cerrar sesión
          </button>
        </Form>
      </div>
    </div>
  );
}

/** Barra de progreso superior mientras se carga una página o se envía un formulario. */
function NavigationProgress() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";
  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-amber-400 transition-transform duration-500 print:hidden",
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
    <div className="min-h-screen bg-stone-100 lg:flex">
      <NavigationProgress />

      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-64 shrink-0 bg-forest-950 print:hidden lg:block">
        <div className="sticky top-0 flex h-screen flex-col gap-6 overflow-y-auto px-3 py-5">
          <Link to="/admin" className="flex items-center gap-3 px-3">
            <LogoMark className="size-9" />
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold text-white">Propietarios Unidos</span>
              <span className="block text-xs text-forest-300">Panel de administración</span>
            </span>
          </Link>
          <div className="flex-1">
            <AdminNav role={user.role} badges={badges} />
          </div>
          <UserPanel user={user} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Barra superior (móvil) */}
        <header className="sticky top-0 z-40 bg-forest-950 print:hidden lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/admin" className="flex items-center gap-2">
              <LogoMark className="size-8" />
              <span className="font-display font-semibold text-white">Panel</span>
            </Link>
            <details ref={mobileMenu} className="group">
              <summary
                className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5 group-open:hidden" aria-hidden />
                <X className="hidden size-5 group-open:block" aria-hidden />
              </summary>
              <div className="absolute inset-x-0 top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto bg-forest-950 px-3 pt-2 pb-6 shadow-xl">
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
