import { and, desc, eq, lte } from "drizzle-orm";
import { posts } from "~/db/schema";
import { db } from "~/server/db.server";
import { env } from "~/server/env.server";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/quienes-somos", priority: "0.8", changefreq: "monthly" },
  { path: "/el-bosque", priority: "0.8", changefreq: "yearly" },
  { path: "/que-hacemos", priority: "0.8", changefreq: "weekly" },
  { path: "/noticias", priority: "0.7", changefreq: "weekly" },
  { path: "/eventos", priority: "0.7", changefreq: "weekly" },
  { path: "/galeria", priority: "0.6", changefreq: "monthly" },
  { path: "/transparencia", priority: "0.6", changefreq: "monthly" },
  { path: "/reportar", priority: "0.6", changefreq: "yearly" },
  { path: "/unete", priority: "0.6", changefreq: "yearly" },
  { path: "/contacto", priority: "0.6", changefreq: "yearly" },
  { path: "/aviso-de-privacidad", priority: "0.2", changefreq: "yearly" },
];

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`);
}

export async function loader() {
  const published = await db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(and(eq(posts.published, true), lte(posts.publishedAt, new Date())))
    .orderBy(desc(posts.publishedAt))
    .limit(1000);

  const urls = [
    ...STATIC_PAGES.map(
      (page) =>
        `<url><loc>${escapeXml(env.SITE_URL + page.path)}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`,
    ),
    ...published.map(
      (post) =>
        `<url><loc>${escapeXml(`${env.SITE_URL}/noticias/${post.slug}`)}</loc><lastmod>${post.updatedAt.toISOString()}</lastmod><priority>0.6</priority></url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
