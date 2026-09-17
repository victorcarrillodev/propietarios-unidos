import { Outlet } from "react-router";
import { SiteFooter, SiteHeader } from "~/components/site/layout-parts";
import { currentYear } from "~/lib/format";
import { getSiteSettings } from "~/server/settings.server";
import type { Route } from "./+types/layout";

export async function loader() {
  const s = await getSiteSettings();
  return {
    settings: {
      orgName: s.orgName,
      shortName: s.shortName,
      tagline: s.tagline,
      address: s.address,
      phone: s.phone,
      whatsapp: s.whatsapp,
      email: s.email,
      facebookUrl: s.facebookUrl,
      mapsUrl: s.mapsUrl,
      hours: s.hours,
    },
    year: currentYear(),
  };
}

export default function SiteLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter settings={loaderData.settings} year={loaderData.year} />
    </div>
  );
}
