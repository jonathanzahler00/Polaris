import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLocalDateISO, normalizeTimeToHHmm } from "@/lib/utils/date";
import { safeError } from "@/lib/utils/errors";
import { getProfileForUser, ensureProfileExists } from "@/lib/services/profile";

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
      try {
        // Use admin client to search for user with matching widget token
        const adminClient = createSupabaseAdminClient();

        // Paginate through users to find matching widget token
        let page = 1;
        const perPage = 1000; // Supabase max per page
        let foundUser = false;

        while (!foundUser && page <= 10) { // Max 10,000 users
          const { data, error: searchError } = await adminClient.auth.admin.listUsers({
            page,
            perPage,
          });

          if (searchError) {
            console.error("Error listing users:", searchError);
            break;
          }

          if (data?.users) {
            const matchedUser = data.users.find(
              (u) => u.user_metadata?.widget_token === widgetToken
            );
            if (matchedUser) {
              user = { id: matchedUser.id };
              foundUser = true;
              break;
            }
          }

          // If we got fewer users than perPage, we've reached the end
          if (!data?.users || data.users.length < perPage) {
            break;
          }

          page++;
        }
      } catch (tokenError) {
        console.error("Widget token authentication error:", tokenError);
        // Don't fail here, fall through to session auth
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

    // Ensure profile exists (auto-create if missing)
    await ensureProfileExists(user.id);

    const profile = await getProfileForUser(user.id);
    if (!profile) {
      return NextResponse.json(
        { error: "Profile error", message: "Unable to load profile" },
        { status: 500 }
      );
    }

    // Note: We don't require onboarding_completed for widget API
    // Users should be able to see their orientations via widget even if they haven't
    // completed full onboarding in the PWA

    const today = getLocalDateISO(profile.timezone);

    // Use admin client to bypass RLS for widget token authentication
    const adminClient = createSupabaseAdminClient();

    // Return the most recently locked orientation regardless of date, so the widget
    // keeps displaying the last set focus until the user sets a new one.
    const { data: orientation, error: dbError } = await adminClient
      .from("daily_orientations")
      .select("text, date, locked_at")
      .eq("user_id", user.id)
      .not("locked_at", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) {
      return NextResponse.json(
        safeError(dbError, "Failed to fetch orientation"),
        { status: 500 }
      );
    }

    // Widget-friendly response (reminder_time only when notifications enabled)
    const reminderTime =
      profile.notifications_enabled && profile.notification_time
        ? normalizeTimeToHHmm(String(profile.notification_time))
        : null;
    return NextResponse.json({
      text: orientation?.text || null,
      date: orientation?.date || today,
      locked: !!orientation?.locked_at,
      timezone: profile.timezone,
      placeholder: orientation ? null : "Not set yet",
      ...(reminderTime && { reminder_time: reminderTime }),
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
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined
        })
      },
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
