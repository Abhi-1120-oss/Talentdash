import { createHash, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Verifies a Bearer API key against the api_keys table.
 * Returns the api_key id on success, or null on failure.
 */
export async function verifyApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const key = authHeader.slice(7).trim();
  if (!key) return null;

  const incomingHash = hashApiKey(key);

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, key_hash, revoked_at")
    .eq("key_hash", incomingHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;

  // Timing-safe compare on the hashes (already equal by query, but defense in depth)
  const a = Buffer.from(data.key_hash, "hex");
  const b = Buffer.from(incomingHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Best-effort last_used_at touch (don't await failures)
  void supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data.id;
}
