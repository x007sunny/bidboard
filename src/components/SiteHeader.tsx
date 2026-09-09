import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="mb-3">
      <div className="flex items-center justify-between gap-2 py-1">
        <Link href="/" className="shrink-0">
          <img
            src="/logo.png"
            alt="Bidboard"
            className="h-15 w-25 rounded-md object-contain"
          />
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-black dark:hover:text-white transition">
            Leaderboard
          </Link>
          <Link href="/categories" className="hover:text-black dark:hover:text-white transition">
            Category
          </Link>
          <Link href="/rules" className="hover:text-black dark:hover:text-white transition">
            Rules
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
