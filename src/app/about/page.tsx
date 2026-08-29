import Link from "next/link";

export default function AboutPage() {
  return (
    <main>
      <header className="mb-8">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black dark:hover:text-white">
          ← Back
        </Link>
      </header>

      <h1 className="mb-4 text-2xl font-bold tracking-tight">About Bidboard</h1>

      <div className="space-y-4 text-neutral-700 text-sm leading-relaxed max-w-lg dark:text-neutral-300">
        <p>
          Bidboard is Australia&apos;s pay-to-rank business leaderboard.
        </p>
        <p>
          No ads. No subscriptions. No algorithms.
          Businesses compete for visibility by bidding for their position.
        </p>
        <p>
          The highest bid ranks highest. That&apos;s it.
        </p>
      </div>
    </main>
  );
}
