import Link from "next/link";

export default function AboutPage() {
  return (
    <main>
      <header className="mb-10">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          bidboard<span className="text-neutral-400">.com.au</span>
        </Link>
      </header>

      <h1 className="mb-6 text-3xl font-bold tracking-tight">About</h1>

      <div className="space-y-6 text-neutral-700">
        <p>
          bidboard.com.au is a simple pay-to-rank leaderboard for Australian businesses,
          restaurants, services, shops and online stores.
        </p>
        <p>
          No ads. No API keys. No revenue sharing.
          Just outbid your competition to rank higher — that’s it.
        </p>
        <p>Rank is the bid — nothing else.</p>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black">
          ← Back to leaderboard
        </Link>
      </div>
    </main>
  );
}
