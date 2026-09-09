import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { VisitBeacon } from "@/components/VisitBeacon";

const SITE_URL = "https://bidboard.com.au";
const OG_IMAGE = `${SITE_URL}/og.png`;
const TITLE = "bidboard.com.au – Buy your position. Get seen.";
const DESCRIPTION =
  "Australia's pay-to-rank business leaderboard. No ads. No subscriptions. Your bid determines your rank.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Bidboard",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_AU",
    images: [
      {
        url: OG_IMAGE,
        secureUrl: OG_IMAGE,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "Bidboard – Australia's business leaderboard. Buy your position. Get seen.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('bidboard-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-[#fafafa] text-neutral-900 dark:bg-[#0f0f12] dark:text-neutral-100">
        <VisitBeacon />
        <div className="mx-auto max-w-5xl px-4 pt-0 pb-6 sm:px-6">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
