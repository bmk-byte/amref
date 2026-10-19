import { createPublicClient } from "@/lib/supabase/public";
import type { Category } from "@/lib/types";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata = {
  title: "Terms of Use — H4GT Resource Library",
};

const LAST_UPDATED = "19 October 2026";

export default async function TermsPage() {
  const supabase = createPublicClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");
  const typedCategories = (categories ?? []) as Category[];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader categories={typedCategories} />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-black">Terms of Use</h1>
        <p className="mt-2 text-sm text-brand-muted">Last updated {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-brand-muted">
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">1. About this library</h2>
            <p>
              The H4GT Resource Library (this "Site") is published by Amref Health Africa in Uganda
              ("Amref," "we," "us," or "our") as part of the Heroes For Gender Transformative Action
              (H4GT) programme. It exists to preserve and share programme materials — reports,
              technical briefs, abstracts, human interest stories, photographs, IEC materials, and
              videos — with partners, donors, researchers, and the public.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">2. Acceptance of these terms</h2>
            <p>
              By accessing or using this Site, you agree to these Terms of Use. If you do not agree,
              please do not use the Site. We may update these terms from time to time (see Section
              10); continued use of the Site after a change takes effect means you accept the revised
              terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">3. Ownership of materials</h2>
            <p>
              Unless a specific item states otherwise, materials published on this Site are © Amref
              Health Africa in Uganda. Publishing an item here does not transfer ownership or any
              intellectual property rights in it to you, and does not waive Amref's rights in it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">4. Permitted use</h2>
            <p>You may view, read, and reference materials on this Site for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>personal learning and research;</li>
              <li>
                reference, citation, and advocacy work directly related to gender transformative
                action, provided the source is credited (see Section 7); and
              </li>
              <li>sharing a direct link to a specific item on this Site with others.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">5. Prohibited use</h2>
            <p>Without Amref's prior written permission, you may not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                download, copy, reproduce, republish, or redistribute any file from this Site outside
                of it (sharing a link to the Site is fine; copying the file itself is not);
              </li>
              <li>modify, adapt, or create derivative works from any material on this Site;</li>
              <li>use any material for commercial purposes;</li>
              <li>
                use any material, especially photographs or personal stories, in a way that
                misrepresents its original context or the individuals or communities featured in it;
              </li>
              <li>
                systematically scrape, bulk-download, or otherwise harvest content from the Site
                outside of ordinary browsing; or
              </li>
              <li>
                use the Site in any way that could damage, disable, or impair it, or interfere with
                anyone else's use of it.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">
              6. Personal stories, photographs &amp; consent
            </h2>
            <p>
              Some materials on this Site — particularly photographs and human interest stories —
              feature identifiable individuals and communities. Amref publishes this kind of material
              only where consent has been obtained from the individuals featured (or, where
              applicable, their guardians) prior to publication, as part of the programme's own
              safeguarding and consent process carried out before material reaches this Site.
            </p>
            <p className="mt-2">
              If you are featured in material published here and have concerns about it, see Section
              8 (Takedown and correction requests) below.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">
              7. Requesting permission to reuse material
            </h2>
            <p>
              To request permission to use, reproduce, or republish a specific item beyond what
              Section 4 already permits, contact the Amref Uganda Communications Unit, identifying
              the specific item (title and, if possible, a link to it) and your intended use. Amref
              will review requests and respond at its discretion; permission is not automatic and may
              be refused, limited, or granted subject to attribution or other conditions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">
              8. Takedown &amp; correction requests
            </h2>
            <p>
              If you believe material on this Site should not be public — including if you are
              featured in it and did not consent, or no longer wish to be featured — or if you believe
              something published here is factually inaccurate, contact the Amref Uganda
              Communications Unit. Amref will review such requests and take appropriate action,
              which may include correcting, unpublishing, or removing the material.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">
              9. No warranty; informational purpose only
            </h2>
            <p>
              Materials on this Site are provided for informational purposes only, on an "as is"
              basis, without warranty of any kind, express or implied, including as to accuracy,
              completeness, or fitness for a particular purpose. Programme data, figures, and
              descriptions may become outdated after publication and are not updated retroactively
              unless a correction is made under Section 8.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">
              10. External &amp; embedded content
            </h2>
            <p>
              Some videos on this Site are hosted on Google Drive and embedded here for convenience.
              Viewing that content is also subject to Google's own terms of service, and Amref is not
              responsible for the availability, performance, or content of third-party platforms
              linked or embedded on this Site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">11. Changes to these terms</h2>
            <p>
              Amref may revise these Terms of Use from time to time. The "Last updated" date at the
              top of this page reflects the most recent revision. Material changes will be reflected
              here; we encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">12. Governing law</h2>
            <p>These Terms of Use are governed by the laws of the Republic of Uganda.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-brand-black">13. Contact</h2>
            <p>
              For permission requests, takedown or correction requests, or any other question about
              these terms, contact the Amref Uganda Communications Unit.
            </p>
          </section>

          <p className="border-t border-brand-line pt-6 text-xs text-brand-muted/70">
            This page is a working draft prepared to give the Site a complete, specific Terms of Use.
            It has not been reviewed by Amref's legal or compliance function and should be reviewed
            internally — particularly Sections 6–9 — before being treated as final.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
