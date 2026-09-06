import { prisma } from "./prisma";
import {
  CATEGORY_DISPLAY_ORDER,
  SUBCATEGORIES,
  type TaxonomyMap,
} from "./categories";

export type CategoryRecord = {
  id: string;
  name: string;
  subcategories: string[];
  sortOrder: number;
};

export const DEFAULT_CATEGORY_SEED: Array<{
  name: string;
  subcategories: string[];
  sortOrder: number;
}> = CATEGORY_DISPLAY_ORDER.map((name, i) => ({
  name,
  subcategories: [...(SUBCATEGORIES[name] || ["Other"])],
  sortOrder: i,
}));

export function toTaxonomyMap(rows: CategoryRecord[]): TaxonomyMap {
  const map: Record<string, string[]> = {};
  for (const row of rows) map[row.name] = row.subcategories;
  return map;
}

export function normalizeSubcategories(raw: string | string[]): string[] {
  const parts = Array.isArray(raw)
    ? raw
    : raw.split(/[,|\n]/).map((s) => s.trim());
  const out: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const name = part.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  if (!out.some((s) => s.toLowerCase() === "other")) out.push("Other");
  return out;
}

function fallbackRows(): CategoryRecord[] {
  return DEFAULT_CATEGORY_SEED.map((s, i) => ({
    id: `seed_${i}`,
    name: s.name,
    subcategories: s.subcategories,
    sortOrder: s.sortOrder,
  }));
}

/** Load categories from the database, seeding the defaults if the table is empty. */
export async function ensureTaxonomy(): Promise<CategoryRecord[]> {
  try {
    const existing = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    if (existing.length > 0) return existing;

    await prisma.category.createMany({
      data: DEFAULT_CATEGORY_SEED.map((s) => ({
        name: s.name,
        subcategories: s.subcategories,
        sortOrder: s.sortOrder,
      })),
    });
    return prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  } catch (err) {
    console.error("ensureTaxonomy failed, using built-in defaults", err);
    return fallbackRows();
  }
}

export async function taxonomyMap(): Promise<TaxonomyMap> {
  return toTaxonomyMap(await ensureTaxonomy());
}
