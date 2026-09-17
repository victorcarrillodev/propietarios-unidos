import { Mail, MapPin, Menu, MessageCircle, Phone, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { FacebookIcon, Logo } from "~/components/brand";
import { buttonClasses } from "~/components/ui/button";
import type { SiteSettings } from "~/lib/site-settings";
import { cn, telLink, whatsappLink } from "~/lib/utils";

export const SITE_NAV = [
  { to: "/quienes-somos", label: "Quiénes somos" },
  { to: "/el-bosque", label: "El bosque" },
  { to: "/que-hacemos", label: "Qué hacemos" },
  { to: "/noticias", label: "Noticias" },
  { to: "/eventos", label: "Eventos" },
  { to: "/contacto", label: "Contacto" },
];

export function SiteHeader() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const location = useLocation();

  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-forest-900/10 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Propietarios Unidos, ir al inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {SITE_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  prefetch="intent"
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-forest-100 text-forest-900" : "text-stone-700 hover:bg-forest-50 hover:text-forest-900",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link to="/reportar" className={buttonClasses({ variant: "accent", size: "sm" })}>
            <TriangleAlert aria-hidden /> Reportar
          </Link>
          <Link to="/unete" className={buttonClasses({ size: "sm" })}>
            Únete
          </Link>
        </div>

        <details ref={menuRef} className="group xl:hidden">
          <summary
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg text-forest-900 ring-1 ring-forest-900/15 hover:bg-forest-50 [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5 group-open:hidden" aria-hidden />
            <X className="hidden size-5 group-open:block" aria-hidden />
          </summary>
          <div className="absolute inset-x-0 top-full border-b border-forest-900/10 bg-cream shadow-lg">
            <nav aria-label="Menú móvil" className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
              <ul className="grid gap-1 sm:grid-cols-2">
                {[{ to: "/", label: "Inicio" }, ...SITE_NAV, { to: "/transparencia", label: "Transparencia" }].map(
                  (item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                          cn(
                            "block rounded-lg px-3 py-2.5 text-base font-medium",
                            isActive ? "bg-forest-100 text-forest-900" : "text-stone-700 hover:bg-forest-50",
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                <Link to="/reportar" className={buttonClasses({ variant: "accent" })}>
                  <TriangleAlert aria-hidden /> Reportar
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

type FooterSettings = Pick<
  SiteSettings,
  "orgName" | "tagline" | "address" | "phone" | "whatsapp" | "email" | "facebookUrl" | "mapsUrl" | "hours"
>;

export function SiteFooter({ settings, year }: { settings: FooterSettings; year: number }) {
  return (
    <footer className="bg-forest-950 text-forest-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-forest-200">{settings.tagline}</p>
          {settings.facebookUrl && (
            <a
              href={settings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/10"
            >
              <FacebookIcon className="size-4" /> Síguenos en Facebook
            </a>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Conócenos</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SITE_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-forest-200 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Participa</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/unete" className="text-forest-200 hover:text-white">
                Únete a la asociación
              </Link>
            </li>
            <li>
              <Link to="/reportar" className="text-forest-200 hover:text-white">
                Reportar una incidencia
              </Link>
            </li>
            <li>
              <Link to="/transparencia" className="text-forest-200 hover:text-white">
                Transparencia
              </Link>
            </li>
            <li>
              <Link to="/aviso-de-privacidad" className="text-forest-200 hover:text-white">
                Aviso de privacidad
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Contacto</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.address && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-forest-400" aria-hidden />
                {settings.mapsUrl ? (
                  <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {settings.address}
                  </a>
                ) : (
                  <span>{settings.address}</span>
                )}
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-forest-400" aria-hidden />
                <a href={telLink(settings.phone)} className="hover:text-white">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.whatsapp && (
              <li className="flex gap-2">
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-forest-400" aria-hidden />
                <a
                  href={whatsappLink(settings.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-forest-400" aria-hidden />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-white">
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-forest-300 sm:px-6 lg:px-8">
          <p>
            © {year} {settings.orgName}.
          </p>
          <Link to="/admin" className="hover:text-white">
            Acceso para integrantes
          </Link>
        </div>
      </div>
    </footer>
  );
}
