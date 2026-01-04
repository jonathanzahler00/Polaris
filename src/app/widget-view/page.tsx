import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLocalDateISO } from "@/lib/utils/date";
import { getProfileForUser } from "@/lib/services/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Simple HTML view for widgets
 * Use this URL in WebView widgets for easier setup
 */
export default async function WidgetViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  let orientation = null;
  let error = null;
  let date = new Date().toISOString().split("T")[0];

  if (token) {
    try {
      // Authenticate with token
      const adminClient = createSupabaseAdminClient();
      const { data: { users } } = await adminClient.auth.admin.listUsers();
      const matchedUser = users?.find((u) => u.user_metadata?.widget_token === token);

      if (matchedUser) {
        const profile = await getProfileForUser(matchedUser.id);
        const today = getLocalDateISO(profile.timezone);
        date = today;

        const supabase = await createSupabaseServerClient();
        const { data } = await supabase
          .from("daily_orientations")
          .select("text")
          .eq("user_id", matchedUser.id)
          .eq("date", today)
          .maybeSingle();

        orientation = data?.text || null;
      } else {
        error = "Invalid token";
      }
    } catch (e) {
      error = "Error loading";
      console.error(e);
    }
  } else {
    error = "No token provided";
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Polaris Widget</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
            color: #0a0a0a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 16px;
          }
          .container {
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .text {
            font-size: 18px;
            line-height: 1.6;
            font-weight: 500;
            margin-bottom: 8px;
          }
          .placeholder {
            color: #737373;
            font-style: italic;
          }
          .error {
            color: #dc2626;
            font-size: 14px;
          }
          .date {
            font-size: 12px;
            color: #737373;
            margin-top: 8px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {error ? (
            <div className="error">{error}</div>
          ) : orientation ? (
            <>
              <div className="text">{orientation}</div>
              <div className="date">{date}</div>
            </>
          ) : (
            <div className="text placeholder">Not set yet</div>
          )}
        </div>
      </body>
    </html>
  );
}
