import { Menu, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Logo } from "~/components/brand";
import { buttonClasses } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { SITE_NAV } from "./nav";

export function SiteHeader() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const location = useLocation();

  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-forest-900/10 bg-cream/90 backdrop-blur-md supports-[backdrop-filter]:bg-cream/80 transition-shadow">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:shadow-lg focus:ring-2 focus:ring-forest-600"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Propietarios Unidos, ir al inicio" className="shrink-0 group">
          <Logo className="transition-transform group-hover:scale-[1.01]" />
        </Link>

        {/* Navegación en escritorio */}
        <nav aria-label="Navegación principal" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {SITE_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  prefetch="intent"
                  className={({ isActive }) =>
                    cn(
                      "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-forest-100/90 text-forest-950 font-semibold shadow-xs"
                        : "text-stone-700 hover:bg-forest-50/70 hover:text-forest-900",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Botones de acción directos */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <Link
            to="/reportar"
            className={buttonClasses({
              variant: "accent",
              size: "sm",
              className: "shadow-xs ring-1 ring-amber-500/20",
            })}
          >
            <TriangleAlert aria-hidden className="size-3.5" /> Reportar
          </Link>
          <Link to="/unete" className={buttonClasses({ size: "sm" })}>
            Únete
          </Link>
        </div>

        {/* Menú móvil desplegable */}
        <details ref={menuRef} className="group xl:hidden">
          <summary
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl text-forest-900 ring-1 ring-forest-900/15 transition-colors hover:bg-forest-50 [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="size-5 group-open:hidden" aria-hidden />
            <X className="hidden size-5 group-open:block" aria-hidden />
          </summary>
          <div className="absolute inset-x-0 top-full border-b border-forest-900/10 bg-cream shadow-xl animate-in slide-in-from-top-2 duration-150">
            <nav aria-label="Menú móvil" className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {[{ to: "/", label: "Inicio" }, ...SITE_NAV, { to: "/transparencia", label: "Transparencia" }].map(
                  (item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center rounded-xl px-4 py-3 text-base font-medium transition-colors",
                            isActive
                              ? "bg-forest-100 text-forest-900 font-semibold"
                              : "text-stone-700 hover:bg-forest-50",
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden pt-4 border-t border-forest-900/10">
                <Link to="/reportar" className={buttonClasses({ variant: "accent" })}>
                  <TriangleAlert aria-hidden className="size-4" /> Reportar
                </Link>
                <Link to="/unete" className={buttonClasses()}>
                  Únete
                </Link>
              </div>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
