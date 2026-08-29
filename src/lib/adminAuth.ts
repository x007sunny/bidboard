import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "bidboard_admin";

export function adminToken(): string {
  const secret = process.env.ADMIN_PASSWORD || "";
  return createHmac("sha256", secret).update("bidboard-admin-v1").digest("hex");
}

export function passwordOk(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = adminToken();
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const ok = await isAdmin();
  if (!ok) {
    const { redirect } = await import("next/navigation");
    redirect("/admin");
  }
}
