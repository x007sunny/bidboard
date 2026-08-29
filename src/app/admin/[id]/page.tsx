import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminListingForm } from "@/components/AdminListingForm";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { refreshListingMetadata } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error, ok } = await searchParams;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();

  return (
    <main className="mx-auto max-w-lg pt-4">
      <Link href="/admin/dashboard" className="text-sm text-neutral-500 hover:text-black dark:hover:text-white">
        ← All listings
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight">Edit listing</h1>
      {ok && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Title and description refreshed from the website.
        </p>
      )}
      {error === "3" && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not fetch the website. Try again or edit the fields below.
        </p>
      )}
      <form action={refreshListingMetadata} className="mb-6">
        <input type="hidden" name="id" value={listing.id} />
        <button
          type="submit"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Refresh title & description from website
        </button>
      </form>
      <AdminListingForm listing={listing} error={error} />
      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <DeleteListingButton id={listing.id} label="Delete this listing" />
      </div>
    </main>
  );
}
