import type { MetadataRoute } from "next";

import { site } from "@/content/site";
import { getPublishedSlugs } from "@/lib/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, events } = await getPublishedSlugs();

  return [
    { url: site.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...posts.map((post) => ({
      url: `${site.url}/news/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...events.map((event) => ({
      url: `${site.url}/event/${event.slug}`,
      lastModified: new Date(event.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
