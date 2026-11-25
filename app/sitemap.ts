import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getRepo } from "@/lib/repo";
import { SITE_URL } from "@/lib/site-url";

// لا يوجد حقل updatedAt في الـ schema، لذلك نثبّت التاريخ بدل اختراعه.
const STATIC_LAST_MOD = "2026-11-25";

const PUBLIC_PAGES: { path: string; frequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", frequency: "weekly", priority: 1 },
  { path: "/search", frequency: "weekly", priority: 0.9 },
  { path: "/terms", frequency: "monthly", priority: 0.5 },
  { path: "/terms/guest", frequency: "monthly", priority: 0.5 },
  { path: "/terms/owner", frequency: "monthly", priority: 0.5 },
  { path: "/terms/platform", frequency: "monthly", priority: 0.5 },
  { path: "/terms/units", frequency: "monthly", priority: 0.5 },
  { path: "/privacy", frequency: "monthly", priority: 0.5 },
  { path: "/favorites", frequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // يمنع قراءة قاعدة البيانات أثناء الـ build؛ الـ sitemap يُولَّد عند الطلب.
  await connection();

  const properties = await getRepo().then((repo) => repo.listProperties());
  const units: MetadataRoute.Sitemap = properties
    .filter((property) => property.status === "PUBLISHED")
    .map((property) => ({
      url: `${SITE_URL}/stay/${property.slug}`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    ...PUBLIC_PAGES.map(({ path, frequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: frequency,
      priority,
    })),
    ...units,
  ];
}
