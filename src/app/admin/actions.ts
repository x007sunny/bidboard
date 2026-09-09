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
import { ensureTaxonomy, normalizeSubcategories, taxonomyMap } from "@/lib/taxonomy";
import { lockFounding50IfReady } from "@/lib/founding";

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

function revalidateBoard() {
  revalidatePath("/");
  revalidatePath("/founding");
  revalidatePath("/categories");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/categories");
}

export async function saveListing(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("id") || "");
  const url = String(formData.get("url") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "");
  const category = String(formData.get("category") || "Other");
  const subcategoryRaw = String(formData.get("subcategory") || "").trim();
  const map = await taxonomyMap();
  const subcategory = isKnownSubcategory(category, subcategoryRaw, map) ? subcategoryRaw : null;
  const states = parseStates(
    formData
      .getAll("states")
      .map((v) => String(v))
      .join(",")
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
      try {
        await lockFounding50IfReady();
      } catch {
        // Listing is already saved; lock can retry on the next request.
      }
    }
  } catch {
    redirect(id ? `/admin/${id}?error=2` : "/admin/new?error=2");
  }

  revalidateBoard();
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
  await prisma.foundingMember.updateMany({
    where: { listingId: id },
    data: { listingId: null },
  });
  await prisma.listing.delete({ where: { id } });

  revalidateBoard();
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

  revalidateBoard();
  revalidatePath(`/admin/${id}`);
  redirect(`/admin/${id}?ok=1`);
}

export async function createCategory(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const name = String(formData.get("name") || "").trim();
  const subs = normalizeSubcategories(String(formData.get("subcategories") || ""));
  if (!name) redirect("/admin/categories?error=name");

  try {
    const rows = await ensureTaxonomy();
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sortOrder), -1);
    await prisma.category.create({
      data: { name, subcategories: subs, sortOrder: maxSort + 1 },
    });
  } catch {
    redirect("/admin/categories?error=exists");
  }

  revalidateBoard();
  redirect("/admin/categories?ok=created");
}

export async function updateCategory(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const subs = normalizeSubcategories(String(formData.get("subcategories") || ""));
  if (!id || !name) redirect("/admin/categories?error=name");

  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) redirect("/admin/categories");

  if (current.name === "Other" && name !== "Other") {
    redirect("/admin/categories?error=other");
  }

  try {
    await prisma.category.update({
      where: { id },
      data: { name, subcategories: subs },
    });
    if (current.name !== name) {
      await prisma.listing.updateMany({
        where: { category: current.name },
        data: { category: name },
      });
    }
  } catch {
    redirect("/admin/categories?error=exists");
  }

  revalidateBoard();
  redirect("/admin/categories?ok=saved");
}

export async function deleteCategory(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/categories");

  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) redirect("/admin/categories");
  if (current.name === "Other") redirect("/admin/categories?error=other");

  const used = await prisma.listing.count({ where: { category: current.name } });
  if (used > 0) redirect("/admin/categories?error=inuse");

  await prisma.category.delete({ where: { id } });
  revalidateBoard();
  redirect("/admin/categories?ok=deleted");
}

export async function moveCategory(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") || "");
  const direction = String(formData.get("direction") || "");
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const idx = rows.findIndex((r) => r.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= rows.length) {
    redirect("/admin/categories");
  }
  const a = rows[idx];
  const b = rows[swapWith];
  await prisma.$transaction([
    prisma.category.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.category.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidateBoard();
  redirect("/admin/categories");
}
