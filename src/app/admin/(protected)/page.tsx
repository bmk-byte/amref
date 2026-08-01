import { createClient } from "@/lib/supabase/server";
import { CATEGORIES_REQUIRING_CONSENT, type Asset, type Category, type ConsentRecord } from "@/lib/types";
import UploadForm from "./upload-form";
import AssetRow from "./asset-row";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: categories }, { data: assets }, { data: consentRecords }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("assets")
      .select("*, categories(id, slug, name, sort_order)")
      .order("created_at", { ascending: false }),
    supabase.from("consent_records").select("*").eq("status", "active").order("subject"),
  ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedAssets = (assets ?? []) as Asset[];
  const typedConsent = (consentRecords ?? []) as ConsentRecord[];

  const paths = typedAssets.map((a) => a.storage_path);
  let signedUrlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("h4gt-assets").createSignedUrls(paths, 3600);
    signedUrlMap = new Map(
      (signedUrls ?? [])
        .map((s): [string, string] => [s.path ?? "", s.signedUrl ?? ""])
        .filter(([p]) => p)
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-brand-black">Assets</h1>

      <UploadForm categories={typedCategories} />

      {typedCategories.map((category) => {
        const categoryAssets = typedAssets.filter((a) => a.category_id === category.id);
        if (categoryAssets.length === 0) return null;
        const requiresConsent = CATEGORIES_REQUIRING_CONSENT.includes(category.slug);

        return (
          <div key={category.id} className="mb-8">
            <h2 className="mb-2 text-sm font-semibold text-brand-black">
              {category.name}{" "}
              <span className="font-normal text-black/40">({categoryAssets.length})</span>
            </h2>
            <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-xs text-black/50">
                    <th className="px-4 py-2 font-medium">Asset</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Consent</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryAssets.map((asset) => (
                    <AssetRow
                      key={asset.id}
                      asset={asset}
                      requiresConsent={requiresConsent}
                      consentRecords={typedConsent}
                      publicUrl={signedUrlMap.get(asset.storage_path) ?? null}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {typedAssets.length === 0 && (
        <p className="text-sm text-black/50">No assets uploaded yet.</p>
      )}
    </div>
  );
}
