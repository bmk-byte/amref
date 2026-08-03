import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const BASE_URL = "https://h4gt-resource-library.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .order("sort_order");

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily" },
    ...(categories ?? []).map((c) => ({
      url: `${BASE_URL}/#${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
    })),
  ];
}
