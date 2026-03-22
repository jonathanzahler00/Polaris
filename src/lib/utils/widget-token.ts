import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve a widget token to a user ID.
 *
 * Fast path: looks up the token in the `widget_tokens` table (O(1) indexed lookup).
 * Fallback: if not found there, scans user metadata for tokens issued before the
 *   widget_tokens table existed, and backfills the table on a match so the fast
 *   path is used on every subsequent call.
 *
 * Returns the user ID string, or null if the token is invalid.
 */
export async function resolveWidgetToken(token: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();

  // Fast path — O(1) indexed lookup
  const { data: row } = await admin
    .from("widget_tokens")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();

  if (row?.user_id) return row.user_id;

  // Fallback — scan user metadata for tokens predating the widget_tokens table
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;

    const match = data?.users.find((u) => u.user_metadata?.widget_token === token);
    if (match) {
      // Backfill so the fast path is used next time
      await admin
        .from("widget_tokens")
        .upsert({ token, user_id: match.id }, { onConflict: "token" });
      return match.id;
    }

    if (!data?.users || data.users.length < perPage) break;
    page++;
  }

  return null;
}
