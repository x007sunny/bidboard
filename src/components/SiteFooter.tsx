import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-neutral-200 pt-7 pb-5 text-center dark:border-neutral-800">
      <div className="flex items-center justify-center gap-4 text-sm text-neutral-500">
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
