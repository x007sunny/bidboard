import Link from "next/link";

export default function RulesPage() {
  return (
    <main>
      <header className="mb-10">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          bidboard<span className="text-neutral-400">.com.au</span>
        </Link>
      </header>

      <h1 className="mb-6 text-3xl font-bold tracking-tight">Rules</h1>

      <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700">
        <p>
          Bidboard is a public leaderboard for Australian businesses.
          There are no ads, no API keys, and no revenue share.
          You pay to stand above everyone else.
          Rank is the bid — nothing else.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-black">How ranking works</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              New listings are whole Australian dollars, $5 minimum, $999,999 maximum, $1 at a time.
              Bids already on the board keep their amount until they raise or get outranked.
            </li>
            <li>
              Taking #1 costs at least $5 more than the current top bid.
              Paying less still puts you on the board at whatever rank that bid can take.
              Equal bids stay in the order they were placed — the older bid keeps the higher rank.
            </li>
            <li>
              Enter the same website or @handle again to raise that listing to any rank.
              The new bid must be at least $1 above your current bid; you only pay the difference.
              Someone else cannot take your rank by paying that difference.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-black">What you can list</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>A business website, online shop, or an X @handle.</li>
            <li>
              Chat and invite links are not allowed — Telegram, WhatsApp, Discord, etc.
              The board is for businesses and profiles, not group chats.
            </li>
            <li>
              Links to illegal or adult content are not allowed.
            </li>
            <li>
              Query parameters are stripped from listing links.
              Affiliate, referral, and tracking URLs will not work.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-black">After you pay</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Your listing is public. Clicks go to the URL or profile you submitted,
              without query parameters.
            </li>
            <li>A completed payment is what claims the rank.</li>
          </ul>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black">
          ← Back to leaderboard
        </Link>
      </div>
    </main>
  );
}
