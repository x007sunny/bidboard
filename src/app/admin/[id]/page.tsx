import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminListingForm } from "@/components/AdminListingForm";
import { DeleteListingButton } from "@/components/DeleteListingButton";

export const dynamic = "force-dynamic";

export default async function AdminEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();

  return (
    <main className="mx-auto max-w-lg pt-4">
      <Link href="/admin/dashboard" className="text-sm text-neutral-500 hover:text-black dark:hover:text-white">
        ← All listings
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight">Edit listing</h1>
      <AdminListingForm listing={listing} error={error} />
      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <DeleteListingButton id={listing.id} label="Delete this listing" />
      </div>
    </main>
  );
}
