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

export const metadata: Metadata = {
  title: "H4GT Resource Library — Amref Health Africa Uganda",
  description:
    "Public resource library for the Heroes For Gender Transformative (H4GT) project: reports, abstracts, human interest stories, photos, IEC materials, and the impact series.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
