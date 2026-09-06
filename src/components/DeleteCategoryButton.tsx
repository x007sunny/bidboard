"use client";

import { deleteCategory } from "@/app/admin/actions";

export function DeleteCategoryButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCategory}
      onSubmit={(e) => {
        if (!confirm("Delete this category? Listings in it must be moved first.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
      >
        Delete
      </button>
    </form>
  );
}
