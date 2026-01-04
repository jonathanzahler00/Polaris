import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLocalDateISO } from "@/lib/date";
import { safeError } from "@/lib/errors";
import { getProfileForUser } from "@/lib/profile";

/**
 * Widget API endpoint for fetching today's orientation
 *
 * This endpoint can be used by third-party widget apps (KWGT, Widgetsmith, Scriptable)
 * to display the user's daily orientation on their home screen.
 *
 * Authentication: Uses Supabase session cookie OR widget token (Bearer token or ?token= query param)
 *
 * Returns JSON with:
 * - text: Today's orientation text (or null if not set)
 * - date: ISO date string
 * - locked: Boolean indicating if orientation is locked
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check for widget token in Authorization header or query param
    const authHeader = request.headers.get("authorization");
    const tokenFromHeader = authHeader?.replace("Bearer ", "");
    const tokenFromQuery = request.nextUrl.searchParams.get("token");
    const widgetToken = tokenFromHeader || tokenFromQuery;

    let user = null;

    // Try widget token authentication first
    if (widgetToken) {
      // Use admin client to search for user with matching widget token
      const adminClient = createSupabaseAdminClient();
      const { data: { users }, error: searchError } = await adminClient.auth.admin.listUsers();

      if (!searchError && users) {
        const matchedUser = users.find(
          (u) => u.user_metadata?.widget_token === widgetToken
        );
        if (matchedUser) {
          user = { id: matchedUser.id };
        }
      }
    }

    // Fallback to session authentication
    if (!user) {
      const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser();
      if (!authError && sessionUser) {
        user = sessionUser;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please sign in or provide a valid widget token" },
        { status: 401 }
      );
    }

    const profile = await getProfileForUser(user.id);
    if (!profile.onboarding_completed) {
      return NextResponse.json(
        { error: "Onboarding not completed", message: "Please complete onboarding first" },
        { status: 403 }
      );
    }

    const today = getLocalDateISO(profile.timezone);
    const { data: orientation, error: dbError } = await supabase
      .from("daily_orientations")
      .select("text, locked_at")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (dbError) {
      return NextResponse.json(
        safeError(dbError, "Failed to fetch orientation"),
        { status: 500 }
      );
    }

    // Widget-friendly response
    return NextResponse.json({
      text: orientation?.text || null,
      date: today,
      locked: !!orientation?.locked_at,
      timezone: profile.timezone,
      placeholder: orientation ? null : "Not set yet",
    }, {
      headers: {
        // Allow CORS for widget apps (they may use webview)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Widget API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
