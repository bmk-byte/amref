import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";
import SectionNav from "./section-nav";
import MobileNav from "./mobile-nav";
import ThemeToggle from "./theme-toggle";

export default function SiteHeader({ categories }: { categories: Category[] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-4">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <Image
                src="/heroes-logo.png"
                alt="Heroes for Gender Transformative Action"
                width={660}
                height={640}
                priority
                className="h-9 w-auto shrink-0"
              />
              <span className="hidden whitespace-nowrap text-sm font-semibold text-brand-black sm:inline">
                H4GT Resource Library
              </span>
            </Link>
            <span className="hidden h-6 w-px shrink-0 bg-brand-line lg:inline-block" aria-hidden="true" />
            <img
              src="https://i0.wp.com/amref.org/uganda/wp-content/uploads/sites/4/2020/03/white.png?fit=1460%2C862&ssl=1"
              alt="Amref Health Africa"
              width={1460}
              height={862}
              className="hidden h-5 w-auto shrink-0 aspect-[1460/862] opacity-80 lg:block"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {categories.length > 0 && <MobileNav categories={categories} />}
          </div>
        </div>
        {/* Full-width row so every category name is always visible — nine names
            don't fit on one line within the header's own max-width at any
            viewport size, so this wraps onto a second line instead of hiding
            anything behind a scroll a visitor would have no reason to find. */}
        {categories.length > 0 && (
          <div className="hidden pb-3 lg:block">
            <SectionNav categories={categories} />
          </div>
        )}
      </div>
    </header>
  );
}
