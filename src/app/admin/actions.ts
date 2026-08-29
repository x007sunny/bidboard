"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminToken, isAdmin, passwordOk } from "@/lib/adminAuth";
import { normalizeUrlOrHandle } from "@/lib/ranking";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!passwordOk(password)) {
    redirect("/admin?error=1");
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin");
}

function dollarsToCents(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export async function saveListing(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("id") || "");
  const url = String(formData.get("url") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "");
  const category = String(formData.get("category") || "Other");
  const logoUrl = String(formData.get("logoUrl") || "").trim() || null;
  const clicks = Math.max(0, parseInt(String(formData.get("clicks") || "0"), 10) || 0);
  const bidCents = dollarsToCents(String(formData.get("bid") || "0"));

  if (!url || !title) {
    redirect(id ? `/admin/${id}?error=1` : "/admin/new?error=1");
  }

  const { uniqueKey } = normalizeUrlOrHandle(url);

  try {
    if (id) {
      await prisma.listing.update({
        where: { id },
        data: {
          url,
          title,
          description,
          category,
          logoUrl,
          clicks,
          bidCents,
          uniqueKey,
        },
      });
    } else {
      await prisma.listing.create({
        data: {
          url,
          title,
          description,
          category,
          logoUrl,
          clicks,
          bidCents,
          uniqueKey,
          lastBidAt: new Date(),
        },
      });
    }
  } catch {
    redirect(id ? `/admin/${id}?error=2` : "/admin/new?error=2");
  }

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function deleteListing(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/dashboard");

  await prisma.payment.updateMany({
    where: { listingId: id },
    data: { listingId: null },
  });
  await prisma.listing.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}
