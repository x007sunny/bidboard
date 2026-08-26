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
    <html lang="en-AU">
      <body className="min-h-screen antialiased bg-[#fafafa] text-neutral-900">
        <div className="mx-auto max-w-4xl px-4 pt-1 pb-6 sm:px-6 sm:pt-2">
          {children}
        </div>
      </body>
    </html>
  );
}
