"use client";

import { useRouter } from "next/navigation";

export function AdminListingActions({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this listing?")) return;

    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete");
    }
  }

  return (
    <div className="flex gap-3">
      <a
        href={`/admin/dashboard/edit/${id}`}
        className="text-blue-600 hover:underline text-xs"
      >
        Edit
      </a>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:underline text-xs"
      >
        Delete
      </button>
    </div>
  );
}
