import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bidboard.com.au – Outbid your competition",
  description:
    "No ads, no API keys, no revenue sharing. Just outbid your competition to get to the top. Australia’s pay-to-rank leaderboard.",
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
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          {children}
        </div>
      </body>
    </html>
  );
}
