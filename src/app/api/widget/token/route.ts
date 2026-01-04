import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { safeError } from "@/lib/utils/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Widget Token Management API
 *
 * Generates a secure token that users can use to access their widget data
 * without needing to authenticate via cookies (useful for third-party widgets)
 */

// Generate a new widget token
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");

    // Store token in user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { widget_token: token },
    });

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove token from user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { widget_token: null },
    });

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = user.user_metadata?.widget_token || null;

    return NextResponse.json({ token, exists: !!token });
  } catch (error) {
    console.error("Token fetch error:", error);
    return NextResponse.json(safeError(error, "Failed to fetch token"), { status: 500 });
  }
}
