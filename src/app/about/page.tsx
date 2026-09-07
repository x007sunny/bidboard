import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getVisitorStats } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { onlineNow, totalVisitors } = await getVisitorStats();

  return (
    <main>
      <SiteHeader onlineNow={onlineNow} totalVisitors={totalVisitors} />

      <h1 className="mb-4 text-2xl font-bold tracking-tight">About Bidboard</h1>

      <div className="space-y-4 text-neutral-700 text-sm leading-relaxed max-w-lg dark:text-neutral-300">
        <p>
          Bidboard is Australia's pay-to-rank business leaderboard.
        </p>
        <p>
          No ads. No subscriptions. No algorithms.
          Businesses compete for visibility by bidding for their position.
        </p>
        <p>
          The highest bid ranks highest. That's it.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
