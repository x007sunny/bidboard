import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { formatAUD } from "@/lib/ranking";
import { deleteListing, logoutAdmin } from "../actions";
import { DeleteListingButton } from "@/components/DeleteListingButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const listings = await prisma.listing.findMany({
    orderBy: [{ bidCents: "desc" }, { lastBidAt: "asc" }],
  });

  return (
    <main className="pt-4">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
          <p className="text-sm text-neutral-500">{listings.length} on the board</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            View site
          </Link>
          <Link
            href="/admin/new"
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add listing
          </Link>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Sub</th>
              <th className="px-3 py-2">States</th>
              <th className="px-3 py-2">Bid</th>
              <th className="px-3 py-2">Clicks</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-neutral-500">
                  No listings yet.
                </td>
              </tr>
            )}
            {listings.map((listing, i) => (
              <tr key={listing.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="px-3 py-2 text-neutral-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{listing.title}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-neutral-500">{listing.url}</td>
                <td className="px-3 py-2">{listing.category}</td>
                <td className="px-3 py-2 text-neutral-500">{listing.subcategory || "—"}</td>
                <td className="px-3 py-2 text-neutral-500">
                  {(listing.states || []).join(" ") || "—"}
                </td>
                <td className="px-3 py-2 font-semibold">{formatAUD(listing.bidCents)}</td>
                <td className="px-3 py-2">{listing.clicks}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/${listing.id}`}
                      className="rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium hover:bg-neutral-200 dark:bg-neutral-800"
                    >
                      Edit
                    </Link>
                    <DeleteListingButton id={listing.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
