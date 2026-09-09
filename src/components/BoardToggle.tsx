import Link from "next/link";
import type { BoardTab } from "@/lib/foundingRank";
import { boardHref } from "@/lib/boardHref";

export function BoardToggle({
  board,
  locked,
  category,
  subcategory,
  state,
  basePath = "/",
}: {
  board: BoardTab;
  locked: boolean;
  category: string;
  subcategory: string;
  state: string;
  basePath?: string;
}) {
  const keep = {
    category,
    subcategory: subcategory || null,
    state: state || null,
    basePath,
  };

  const btn = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition ${
      active
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
    }`;

  return (
    <div className="mb-5 flex justify-center">
      <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800">
        <Link
          href={
            basePath === "/founding"
              ? boardHref({ ...keep, basePath: "/founding" })
              : boardHref({ ...keep, board: "founding" })
          }
          className={btn(board === "founding")}
        >
          {!locked ? "🏆 " : ""}
          Founding 50
        </Link>
        <Link
          href={
            basePath === "/founding"
              ? boardHref({ board: "leaderboard", category, subcategory: subcategory || null, state: state || null })
              : boardHref({ ...keep, board: "leaderboard" })
          }
          className={btn(board === "leaderboard")}
        >
          {locked ? "🏆 " : ""}
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
