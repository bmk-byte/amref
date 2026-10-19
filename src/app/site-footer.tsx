import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-brand-line bg-brand-gray/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm sm:grid-cols-2 sm:px-6">
        <div>
          <h3 className="mb-2 font-display text-base font-semibold text-brand-black">Terms of use</h3>
          <p className="leading-relaxed text-brand-muted">
            Materials in this library are © Amref Health Africa in Uganda and may be viewed here for
            learning, reference, and advocacy purposes related to gender transformative work.
            Downloading, copying, or redistributing files outside this site is not permitted without
            prior written permission.{" "}
            <Link href="/terms" className="font-medium text-brand-orange hover:underline">
              Read the full Terms of Use →
            </Link>
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-display text-base font-semibold text-brand-black">Consent &amp; takedowns</h3>
          <p className="leading-relaxed text-brand-muted">
            Photos and personal stories are published only where consent was given by the individuals
            featured. If you believe material should not be public, contact the Amref Uganda
            Communications Unit — see the{" "}
            <Link href="/terms" className="font-medium text-brand-orange hover:underline">
              Terms of Use
            </Link>{" "}
            for details.
          </p>
        </div>
      </div>
    </footer>
  );
}
