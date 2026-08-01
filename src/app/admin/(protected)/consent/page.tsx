import { createClient } from "@/lib/supabase/server";
import type { ConsentRecord } from "@/lib/types";
import ConsentForm from "./consent-form";

export default async function ConsentPage() {
  const supabase = await createClient();
  const { data: consentRecords } = await supabase
    .from("consent_records")
    .select("*")
    .order("created_at", { ascending: false });

  const typed = (consentRecords ?? []) as ConsentRecord[];

  let signedFormUrls = new Map<string, string>();
  const formPaths = typed.map((c) => c.consent_form_path).filter((p): p is string => !!p);
  if (formPaths.length > 0) {
    const { data } = await supabase.storage.from("h4gt-consent-forms").createSignedUrls(formPaths, 3600);
    signedFormUrls = new Map(
      (data ?? [])
        .map((s): [string, string] => [s.path ?? "", s.signedUrl ?? ""])
        .filter(([p]) => p)
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-brand-black">Consent Records</h1>
      <p className="mb-6 max-w-2xl text-sm text-black/60">
        Consent records are staff-only and never exposed on the public site. Link a record to an asset
        from the Assets page before it can be published in a category that requires consent (Human
        Interest Stories, Photos, Impact Series).
      </p>

      <ConsentForm />

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-black/50">
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Scope</th>
              <th className="px-4 py-2 font-medium">Date signed</th>
              <th className="px-4 py-2 font-medium">Form</th>
            </tr>
          </thead>
          <tbody>
            {typed.map((c) => (
              <tr key={c.id} className="border-b border-black/5">
                <td className="px-4 py-3 font-medium text-brand-black">{c.subject}</td>
                <td className="px-4 py-3 text-black/70">{c.scope ?? "—"}</td>
                <td className="px-4 py-3 text-black/70">{c.date_signed ?? "—"}</td>
                <td className="px-4 py-3">
                  {c.consent_form_path && signedFormUrls.get(c.consent_form_path) ? (
                    <a
                      href={signedFormUrls.get(c.consent_form_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-red hover:underline"
                    >
                      View form
                    </a>
                  ) : (
                    <span className="text-black/30">—</span>
                  )}
                </td>
              </tr>
            ))}
            {typed.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-black/40">
                  No consent records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
