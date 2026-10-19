import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Asset, Category } from "@/lib/types";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: assets }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("assets").select("id, category_id, status"),
  ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedAssets = (assets ?? []) as Pick<Asset, "id" | "category_id" | "status">[];

  const rows = typedCategories.map((c) => {
    const inCategory = typedAssets.filter((a) => a.category_id === c.id);
    return {
      category: c,
      total: inCategory.length,
      published: inCategory.filter((a) => a.status === "published").length,
      draft: inCategory.filter((a) => a.status === "draft").length,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-black">Categories</h1>
        <p className="mt-1 text-sm text-black/60">
          Browse resource counts per category. Categories themselves are managed outside this
          interface — this view is read-only.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-black/50">
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Draft</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ category, total, published, draft }) => (
              <tr key={category.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-brand-black">{category.name}</td>
                <td className="px-4 py-3 text-black/60">{total}</td>
                <td className="px-4 py-3 text-black/60">{published}</td>
                <td className="px-4 py-3 text-black/60">{draft}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/resources?category=${category.slug}`}
                    className="text-xs font-medium text-brand-orange hover:underline"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
