import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bidboard.com.au – Buy your position. Get seen.",
  description:
    "Australia's pay-to-rank business leaderboard. No ads. No subscriptions. Your bid determines your rank.",
  metadataBase: new URL("https://bidboard.com.au"),
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
        <div className="mx-auto max-w-5xl px-4 pt-0 pb-6 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
}
