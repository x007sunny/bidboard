import type { BoardTab } from "./foundingRank";

export function boardHref(opts: {
  board?: BoardTab;
  category?: string;
  subcategory?: string | null;
  state?: string | null;
  page?: number;
  basePath?: string;
}): string {
  const p = new URLSearchParams();
  const base = opts.basePath || "/";
  if (base === "/" && opts.board) p.set("board", opts.board);
  if (opts.category && opts.category !== "All") p.set("category", opts.category);
  if (opts.subcategory) p.set("subcategory", opts.subcategory);
  if (opts.state) p.set("state", opts.state);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const q = p.toString();
  if (base === "/founding") return q ? `/founding?${q}` : "/founding";
  return q ? `/?${q}` : "/";
}
