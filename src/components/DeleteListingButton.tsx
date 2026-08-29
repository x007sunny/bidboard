"use client";

import { deleteListing } from "@/app/admin/actions";

export function DeleteListingButton({ id, label = "Delete" }: { id: string; label?: string }) {
  return (
    <form
      action={deleteListing}
      onSubmit={(e) => {
        if (!confirm("Delete this listing? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={label === "Delete" ? "rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300" : "text-sm font-medium text-red-600 hover:underline"}>
        {label}
      </button>
    </form>
  );
}
