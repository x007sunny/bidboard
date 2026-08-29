import Link from "next/link";
import { formatAUD } from "@/lib/ranking";

export function SiteFooter({
  revenueCents,
  hoursSinceLaunch,
}: {
  revenueCents?: number;
  hoursSinceLaunch?: number;
}) {
  return (
    <footer className="mt-14 border-t border-neutral-200 pt-7 pb-5 text-center dark:border-neutral-800">
      {revenueCents != null && hoursSinceLaunch != null && (
        <>
          <p className="text-sm text-neutral-500">This simple side project made</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatAUD(revenueCents)}</p>
          <p className="mt-1 text-sm text-neutral-400">
            since its launch {hoursSinceLaunch} hours ago
          </p>
        </>
      )}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm text-neutral-500">
        <Link href="/terms" className="hover:text-black dark:hover:text-white">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-black dark:hover:text-white">
          Privacy
        </Link>
        <Link href="/rules" className="hover:text-black dark:hover:text-white">
          Rules
        </Link>
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        bidboard.com.au · Australia's pay-to-rank leaderboard
      </p>
    </footer>
  );
}
