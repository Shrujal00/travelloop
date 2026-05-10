import { createClient } from "@/lib/supabase/server";

/** Verified email from JWT via getClaims (safe for gating routes). */
export async function getVerifiedEmail(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const email = data?.claims?.email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}
