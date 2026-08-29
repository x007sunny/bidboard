import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { loginAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin/dashboard");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-sm pt-16">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mb-6 text-sm text-neutral-500">Enter the admin password to manage listings.</p>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Wrong password.
        </p>
      )}
      <form action={loginAdmin} className="space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Password"
          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
