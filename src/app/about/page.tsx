import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getVisitorStats } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { onlineNow, totalVisitors } = await getVisitorStats();

  return (
    <main>
      <SiteHeader />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">About Bidboard</h1>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed max-w-lg dark:text-neutral-300">
        <section>
          <p>
            Bidboard is Australia's pay-to-rank business leaderboard. No ads. No
            subscriptions. No algorithms. Your bid is your rank.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">How it works</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Enter your website, Facebook page, or Instagram page.</li>
            <li>
              Bidboard reads the public name, description, category, and location,
              then you check and edit those details before paying.
            </li>
            <li>Pay through Stripe. Your listing goes live only after payment succeeds.</li>
            <li>Highest bid ranks highest. That is the only ranking rule.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">The Founding 50</h2>
          <p>
            The first 50 unique businesses to successfully join Bidboard become the
            Founding 50 — a one-time launch group, not a second ranking system.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li>
              Until the 50th business joins, Founding 50 and the Leaderboard show the
              same live board.
            </li>
            <li>
              When the 50th business joins, Founding 50 locks as a historical archive.
              Those founding ranks never change.
            </li>
            <li>
              The normal Leaderboard continues forever. Raising your bid can move you
              on the Leaderboard without changing your Founding rank.
            </li>
          </ul>
          <p className="mt-3">
            See{" "}
            <a href="/founding" className="underline hover:text-black dark:hover:text-white">
              The Founding 50
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">Bidding</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>New listings start at $5 AUD.</li>
            <li>
              Already listed? Enter the same URL and raise your bid by at least $1.
              You only pay the difference.
            </li>
            <li>You can bid less than #1 and still appear at the rank that amount reaches.</li>
            <li>If two bids are equal, the older listing keeps the higher rank.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">Categories and location</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Listings are grouped by category and subcategory.</li>
            <li>
              Location is Australia-wide, or the states you serve: NSW, VIC, QLD, WA,
              SA, TAS, ACT, NT.
            </li>
            <li>No cities, suburbs, or postcodes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">The fine print</h2>
          <p>
            Listings are paid placements, not reviews or endorsements. Full details are
            in the{" "}
            <a href="/rules" className="underline hover:text-black dark:hover:text-white">
              Rules
            </a>
            ,{" "}
            <a href="/terms" className="underline hover:text-black dark:hover:text-white">
              Terms
            </a>
            , and{" "}
            <a href="/privacy" className="underline hover:text-black dark:hover:text-white">
              Privacy Policy
            </a>
            .
          </p>
          <p className="mt-3">
            Questions:{" "}
            <a href="mailto:sunny.singh@outlook.com" className="underline hover:text-black dark:hover:text-white">
              sunny.singh@outlook.com
            </a>
          </p>
        </section>
      </div>
      <SiteFooter onlineNow={onlineNow} totalVisitors={totalVisitors} />
    </main>
  );
}
