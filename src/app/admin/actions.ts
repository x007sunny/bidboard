"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminToken, isAdmin, passwordOk } from "@/lib/adminAuth";
import { normalizeUrlOrHandle } from "@/lib/ranking";
import { fetchWebsiteMetadata } from "@/lib/fetchWebsiteMetadata";
import { classifyListing } from "@/lib/classifyListing";
import { parseStates, isKnownSubcategory } from "@/lib/categories";

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
  const subcategoryRaw = String(formData.get("subcategory") || "").trim();
  const subcategory = isKnownSubcategory(category, subcategoryRaw) ? subcategoryRaw : null;
  const states = parseStates(
    formData.getAll("states").map((v) => String(v)).join(",")
  );
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
          subcategory,
          states,
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
          subcategory,
          states,
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

export async function refreshListingMetadata(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/dashboard");

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) redirect("/admin/dashboard");

  try {
    const meta = await fetchWebsiteMetadata(listing.url);
    const classified = classifyListing({
      category: listing.category,
      title: meta.title || listing.title,
      description: meta.description || listing.description,
      url: meta.canonicalUrl || listing.url,
      signals: meta.signals,
    });
    await prisma.listing.update({
      where: { id },
      data: {
        title: meta.title || listing.title,
        description: meta.description || listing.description,
        logoUrl: meta.imageUrl || listing.logoUrl,
        url: meta.canonicalUrl || listing.url,
        category: classified.category || listing.category,
        subcategory: classified.subcategory || listing.subcategory,
        states: classified.states.length ? classified.states : listing.states,
      },
    });
  } catch {
    redirect(`/admin/${id}?error=3`);
  }

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/${id}`);
  redirect(`/admin/${id}?ok=1`);
}
