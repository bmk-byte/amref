import { createClient } from "@/lib/supabase/server";
import type { Asset, Category, ConsentRecord } from "@/lib/types";
import UploadForm from "./upload-form";
import AdminBoard from "./admin-board";

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
  const signedUrlMap: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("h4gt-assets").createSignedUrls(paths, 3600);
    for (const s of signedUrls ?? []) {
      if (s.path && s.signedUrl) signedUrlMap[s.path] = s.signedUrl;
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-brand-black">Assets</h1>

      <UploadForm categories={typedCategories} />

      <AdminBoard
        categories={typedCategories}
        assets={typedAssets}
        consentRecords={typedConsent}
        signedUrlMap={signedUrlMap}
      />
    </div>
  );
}
