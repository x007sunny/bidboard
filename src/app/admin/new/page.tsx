import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminListingForm } from "@/components/AdminListingForm";

export const dynamic = "force-dynamic";

export default async function AdminNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-lg pt-4">
      <Link href="/admin/dashboard" className="text-sm text-neutral-500 hover:text-black dark:hover:text-white">
        ← All listings
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight">Add listing</h1>
      <AdminListingForm error={error} />
    </main>
  );
}
