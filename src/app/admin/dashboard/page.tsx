import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatAUD } from "@/lib/ranking";
import Link from "next/link";
import { AdminListingActions } from "@/components/AdminListingActions";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");

  if (auth?.value !== "true") {
    redirect("/admin");
  }

  const listings = await prisma.listing.findMany({
    orderBy: [{ bidCents: "desc" }, { lastBidAt: "asc" }],
  });

  return (
    <main>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link
          href="/admin/dashboard/new"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Add free listing
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="pb-3 font-medium">Rank</th>
              <th className="pb-3 font-medium">Title</th>
              <th className="pb-3 font-medium">Bid</th>
              <th className="pb-3 font-medium">Clicks</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing, i) => (
              <tr key={listing.id} className="border-b border-neutral-100">
                <td className="py-3 text-neutral-400">#{i + 1}</td>
                <td className="py-3 font-medium">{listing.title}</td>
                <td className="py-3">{formatAUD(listing.bidCents)}</td>
                <td className="py-3">{listing.clicks}</td>
                <td className="py-3 text-neutral-500">{listing.category}</td>
                <td className="py-3">
                  <AdminListingActions id={listing.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {listings.length === 0 && (
        <p className="py-10 text-center text-neutral-500">No listings yet.</p>
      )}
    </main>
  );
}
