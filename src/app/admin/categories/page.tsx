import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { ensureTaxonomy } from "@/lib/taxonomy";
import { createCategory, updateCategory, moveCategory } from "../actions";
import { DeleteCategoryButton } from "@/components/DeleteCategoryButton";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { error, ok } = await searchParams;
  const categories = await ensureTaxonomy();
  const counts = await prisma.listing.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.category] = c._count._all;

  const errorText =
    error === "name"
      ? "Category name is required."
      : error === "exists"
        ? "That category name already exists."
        : error === "inuse"
          ? "That category still has listings. Move or reassign them first."
          : error === "other"
            ? "The Other category cannot be renamed or deleted."
            : null;

  const okText =
    ok === "created"
      ? "Category added."
      : ok === "saved"
        ? "Category saved."
        : ok === "deleted"
          ? "Category deleted."
          : null;

  return (
    <main className="pt-4">
      <Link
        href="/admin/dashboard"
        className="text-sm text-neutral-500 hover:text-black dark:hover:text-white"
      >
        ← Listings
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-bold tracking-tight">Categories</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Add, rename, reorder, or delete categories. Subcategories are a comma-separated list.
        &ldquo;Other&rdquo; is always kept as a subcategory.
      </p>

      {errorText && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {errorText}
        </p>
      )}
      {okText && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {okText}
        </p>
      )}

      <form
        action={createCategory}
        className="mb-8 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <h2 className="mb-3 text-sm font-semibold">Add a category</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input
            name="name"
            required
            placeholder="Name, e.g. Pets"
            className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <input
            name="subcategories"
            placeholder="Subcategories, e.g. Dogs, Cats, Other"
            className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {categories.map((cat, i) => {
          const used = countMap[cat.name] || 0;
          const locked = cat.name === "Other";
          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <form action={updateCategory} className="space-y-3">
                <input type="hidden" name="id" value={cat.id} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-neutral-400">
                    {used} listing{used === 1 ? "" : "s"}
                    {locked ? " · protected" : ""}
                  </p>
                  <div className="flex gap-1">
                    <button
                      formAction={moveCategory}
                      name="direction"
                      value="up"
                      disabled={i === 0}
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30 dark:border-neutral-700"
                    >
                      Up
                    </button>
                    <button
                      formAction={moveCategory}
                      name="direction"
                      value="down"
                      disabled={i === categories.length - 1}
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30 dark:border-neutral-700"
                    >
                      Down
                    </button>
                  </div>
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block text-neutral-500">Name</span>
                  <input
                    name="name"
                    required
                    defaultValue={cat.name}
                    readOnly={locked}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-neutral-500">Subcategories</span>
                  <textarea
                    name="subcategories"
                    rows={2}
                    defaultValue={cat.subcategories.join(", ")}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  {!locked && <DeleteCategoryButton id={cat.id} />}
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}
