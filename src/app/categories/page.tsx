import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { formatAUD, timeAgo } from "@/lib/ranking";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

function faviconFor(url: string) {
  try {
    let domain = url;
    if (!domain.startsWith("http")) domain = `https://${domain}`;
    const host = new URL(domain).hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

export default async function CategoriesPage() {
  const listings = await prisma.listing.findMany({
    orderBy: [{ bidCents: "desc" }, { lastBidAt: "asc" }],
  });

  const launchDate = new Date("2026-08-23T00:00:00Z");
  const hoursSinceLaunch = Math.floor((Date.now() - launchDate.getTime()) / (1000 * 60 * 60));
  const totalVisitors = 1327 + Math.floor(hoursSinceLaunch * 12);
  const onlineNow = 3 + Math.floor(Math.random() * 8);

  const groups = CATEGORIES.map((name) => {
    const items = listings.filter((l) => l.category === name);
    const last = items.reduce<Date | null>((acc, l) => {
      if (!acc || l.lastBidAt > acc) return l.lastBidAt;
      return acc;
    }, null);
    return { name, items, last };
  }).filter((g) => g.items.length > 0);

  const mostActive = [...groups]
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 3);

  return (
    <main>
      <SiteHeader onlineNow={onlineNow} totalVisitors={totalVisitors} />

      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
      <p className="mt-2 mb-6 text-sm text-neutral-500">
        Every category has its own ranking. Pick one to see who leads it.
      </p>

      {mostActive.length > 0 && (
        <section className="mb-6">
          <p className="mb-3 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500 align-middle"></span>
            Most active categories
          </p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible">
            {mostActive.map((g) => (
              <Link
                key={g.name}
                href={`/?category=${encodeURIComponent(g.name)}`}
                className="min-w-[70%] shrink-0 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 hover:border-neutral-300 sm:min-w-0 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="font-medium truncate">{g.name}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {g.items.length} listing{g.items.length === 1 ? "" : "s"}
                  {g.last ? ` · ${timeAgo(g.last)}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {groups.map((g) => (
          <Link
            key={g.name}
            href={`/?category=${encodeURIComponent(g.name)}`}
            className="rounded-2xl border border-neutral-200 bg-white p-3.5 hover:border-neutral-300 sm:p-4 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <h2 className="mb-3 truncate font-semibold">{g.name}</h2>
            <ul className="space-y-2">
              {g.items.slice(0, 3).map((item, i) => {
                const icon = item.logoUrl || faviconFor(item.url);
                return (
                  <li key={item.id} className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="w-5 shrink-0 text-xs font-semibold text-neutral-400">#{i + 1}</span>
                    {icon ? (
                      <img src={icon} alt="" className="h-5 w-5 shrink-0 rounded-md object-contain bg-white" />
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold">
                        {item.title.charAt(0)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 sm:text-sm">
                      {formatAUD(item.bidCents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Link>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-neutral-500">No listings yet.</p>
      )}
      <SiteFooter />
    </main>
  );
}
