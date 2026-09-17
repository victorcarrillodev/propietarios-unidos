import { env } from "~/server/env.server";

export function loader() {
  const body = ["User-agent: *", "Allow: /", "Disallow: /admin", "", `Sitemap: ${env.SITE_URL}/sitemap.xml`, ""].join(
    "\n",
  );
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
