import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Outfit } from "next/font/google";
import Script from "next/script";
import { StoreHydrator } from "@/components/StoreHydrator";
import { APPEARANCE_BOOTSTRAP } from "@/lib/appearance";
import "./globals.css";

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Krunch — Restaurant Management",
  description:
    "Touch-first POS and restaurant operations for tills, kitchen, tables, and reporting.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${body.variable} ${display.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <Script
          id="krunch-appearance"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOTSTRAP }}
        />
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
