import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router";
import { FacebookIcon, Logo } from "~/components/brand";
import type { SiteSettings } from "~/lib/site-settings";
import { telLink, whatsappLink } from "~/lib/utils";
import { SITE_NAV } from "./nav";

export type FooterSettings = Pick<
  SiteSettings,
  "orgName" | "tagline" | "address" | "phone" | "whatsapp" | "email" | "facebookUrl" | "mapsUrl" | "hours"
>;

export function SiteFooter({ settings, year }: { settings: FooterSettings; year: number }) {
  return (
    <footer className="bg-forest-950 text-forest-100 transition-colors">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Identidad */}
        <div className="lg:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-forest-200">{settings.tagline}</p>
          {settings.facebookUrl && (
            <a
              href={settings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 active:scale-95"
            >
              <FacebookIcon className="size-4 text-blue-400" />
              <span>Síguenos en Facebook</span>
            </a>
          )}
        </div>

        {/* Conócenos */}
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-amber-300 uppercase">Conócenos</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SITE_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-forest-200 transition-colors hover:text-white hover:underline underline-offset-4">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Participa */}
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-amber-300 uppercase">Participa</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/unete" className="text-forest-200 transition-colors hover:text-white hover:underline underline-offset-4">
                Únete a la asociación
              </Link>
            </li>
            <li>
              <Link to="/reportar" className="text-forest-200 transition-colors hover:text-white hover:underline underline-offset-4">
                Reportar una incidencia
              </Link>
            </li>
            <li>
              <Link to="/transparencia" className="text-forest-200 transition-colors hover:text-white hover:underline underline-offset-4">
                Transparencia y cuentas
              </Link>
            </li>
            <li>
              <Link to="/aviso-de-privacidad" className="text-forest-200 transition-colors hover:text-white hover:underline underline-offset-4">
                Aviso de privacidad
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacto directo */}
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-amber-300 uppercase">Contacto</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.address && (
              <li className="flex items-start gap-2.5 text-forest-200">
                <MapPin className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                {settings.mapsUrl ? (
                  <a
                    href={settings.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white hover:underline"
                  >
                    {settings.address}
                  </a>
                ) : (
                  <span>{settings.address}</span>
                )}
              </li>
            )}
            {settings.phone && (
              <li className="flex items-center gap-2.5 text-forest-200">
                <Phone className="size-4 shrink-0 text-amber-400" aria-hidden />
                <a href={telLink(settings.phone)} className="transition-colors hover:text-white hover:underline">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.whatsapp && (
              <li className="flex items-center gap-2.5 text-forest-200">
                <MessageCircle className="size-4 shrink-0 text-emerald-400" aria-hidden />
                <a
                  href={whatsappLink(settings.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white hover:underline"
                >
                  WhatsApp directo
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex items-center gap-2.5 text-forest-200">
                <Mail className="size-4 shrink-0 text-amber-400" aria-hidden />
                <a
                  href={`mailto:${settings.email}`}
                  className="break-all transition-colors hover:text-white hover:underline"
                >
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Franja de créditos */}
      <div className="border-t border-white/10 bg-forest-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-forest-300 sm:px-6 lg:px-8">
          <p>
            © {year} {settings.orgName}. Todos los derechos reservados.
          </p>
          <Link
            to="/admin"
            className="rounded-md px-2 py-1 transition-colors hover:bg-white/5 hover:text-white"
          >
            Acceso para integrantes →
          </Link>
        </div>
      </div>
    </footer>
  );
}
