import { createClient } from "@/lib/supabase/server";

export type VerifiedSession = { userId: string; email: string };

/** JWT claims verified via getClaims — safe for route gating and user_id scoping. */
export async function getVerifiedSession(): Promise<VerifiedSession | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) return null;
    const sub = claims.sub;
    const email = claims.email;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    return { userId: sub, email };
  } catch {
    return null;
  }
}

export async function getVerifiedEmail(): Promise<string | null> {
  const s = await getVerifiedSession();
  return s?.email ?? null;
}

export async function getVerifiedUserId(): Promise<string | null> {
  const s = await getVerifiedSession();
  return s?.userId ?? null;
}
