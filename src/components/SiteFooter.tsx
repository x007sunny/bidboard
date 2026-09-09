import Link from "next/link";

export function SiteFooter({
  onlineNow,
  totalVisitors,
}: {
  onlineNow?: number;
  totalVisitors?: number;
}) {
  const showVisitors = onlineNow != null && totalVisitors != null;

  return (
    <footer className="mt-14 border-t border-neutral-200 pt-7 pb-5 text-center dark:border-neutral-800">
      {showVisitors && (
        <p className="mb-4 inline-flex max-w-full items-center justify-center gap-1.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500"></span>
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {onlineNow} online
          </span>
          <span className="text-neutral-300">·</span>
          <span className="truncate">{totalVisitors.toLocaleString()} visitors since launch</span>
        </p>
      )}
      <div className="flex items-center justify-center gap-4 text-sm text-neutral-500">
        <Link href="/founding" className="hover:text-black dark:hover:text-white">
          Founding 50
        </Link>
        <Link href="/terms" className="hover:text-black dark:hover:text-white">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-black dark:hover:text-white">
          Privacy
        </Link>
        <Link href="/about" className="hover:text-black dark:hover:text-white">
          About
        </Link>
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        bidboard.com.au · Australia's pay-to-rank leaderboard
      </p>
    </footer>
  );
}
