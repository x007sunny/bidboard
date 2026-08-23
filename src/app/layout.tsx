import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bidboard.com.au – Outbid your competition",
  description:
    "No ads, no API keys, no revenue sharing. Just outbid your competition to get to the top. Australia’s pay-to-rank leaderboard for local businesses, restaurants, services and shops.",
  metadataBase: new URL("https://bidboard.com.au"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
}
