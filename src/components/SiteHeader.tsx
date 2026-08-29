import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({
  onlineNow,
  totalVisitors,
}: {
  onlineNow?: number;
  totalVisitors?: number;
}) {
  return (
    <header className="mb-3 flex items-center justify-between gap-2 py-1">
      <Link href="/" className="shrink-0">
        <img
          src="/logo.png"
          alt="Bidboard"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain"
        />
      </Link>

      {onlineNow != null && totalVisitors != null && (
        <div className="min-w-0 flex-1 flex justify-center">
          <div className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white border border-neutral-200 px-2.5 sm:px-3.5 py-1 text-xs sm:text-sm text-neutral-500 shadow-sm dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400">
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500"></span>
            <span className="font-medium text-neutral-800 dark:text-neutral-100">{onlineNow} online</span>
            <span className="text-neutral-300">·</span>
            <span className="truncate">{totalVisitors.toLocaleString()} visitors since launch</span>
          </div>
        </div>
      )}

      <nav className="flex shrink-0 items-center gap-2 sm:gap-3 text-sm text-neutral-500 dark:text-neutral-400">
        <ThemeToggle />
        <Link href="/categories" className="hover:text-black dark:hover:text-white transition">
          Categories
        </Link>
        <Link href="/rules" className="hover:text-black dark:hover:text-white transition hidden sm:inline">
          Rules
        </Link>
        <Link href="/about" className="hover:text-black dark:hover:text-white transition">
          About
        </Link>
      </nav>
    </header>
  );
}
