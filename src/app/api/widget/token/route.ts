import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { getAuthUser } from "@/lib/services/auth";
import { safeError } from "@/lib/utils/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Widget Token Management API
 *
 * Generates a secure token that users can use to access their widget data
 * without needing to authenticate via cookies (useful for third-party widgets)
 */

// Generate a new widget token
export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    const token = randomBytes(32).toString("hex");

    // Store in user metadata (for display/revocation) and in the lookup table (for fast auth)
    const [{ error: updateError }] = await Promise.all([
      supabase.auth.updateUser({ data: { widget_token: token } }),
      admin.from("widget_tokens").upsert({ token, user_id: user.id }, { onConflict: "token" }),
    ]);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(safeError(error, "Failed to generate token"), { status: 500 });
  }
}

// Revoke widget token
export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createSupabaseAdminClient();

    // Get the current token before clearing it so we can remove it from the lookup table
    const currentToken = user.user_metadata?.widget_token as string | undefined;

    const [{ error: updateError }] = await Promise.all([
      supabase.auth.updateUser({ data: { widget_token: null } }),
      currentToken
        ? admin.from("widget_tokens").delete().eq("token", currentToken)
        : Promise.resolve({ error: null }),
    ]);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to revoke token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token revocation error:", error);
    return NextResponse.json(safeError(error, "Failed to revoke token"), { status: 500 });
  }
}

// Get current token (for display purposes)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = user.user_metadata?.widget_token ?? null;

    return NextResponse.json({ token, exists: !!token });
  } catch (error) {
    console.error("Token fetch error:", error);
    return NextResponse.json(safeError(error, "Failed to fetch token"), { status: 500 });
  }
}
