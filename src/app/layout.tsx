import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Brand guidelines specify Helvetica Neue; it isn't available on Google Fonts
// (commercial Adobe/Linotype font), so Inter is used as the closest free
// substitute — matched metrics, built for screens, same single-family approach
// for both headings and body text that the guidelines call for.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const TITLE = "H4GT Resource Library — Amref Health Africa Uganda";
const DESCRIPTION =
  "Public resource library for the Heroes For Gender Transformative (H4GT) project: reports, abstracts, human interest stories, photos, IEC materials, and the impact series.";

export const metadata: Metadata = {
  metadataBase: new URL("https://h4gt-resource-library.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "H4GT Resource Library",
    images: [{ url: "/heroes-logo.png", width: 660, height: 640 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/heroes-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved/system theme before first paint so there's no
            flash of the wrong theme. Runs before hydration, so the <html>
            className it sets can differ from the server-rendered markup —
            that's why suppressHydrationWarning is set above. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var dark=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
        {/* Video previews embed Drive's player on demand — warming this connection
            ahead of the click shaves off DNS/TLS time when the modal opens. */}
        <link rel="preconnect" href="https://drive.google.com" />
        <link rel="dns-prefetch" href="https://drive.google.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
