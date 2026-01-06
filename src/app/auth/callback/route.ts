import { NextResponse } from "next/server";

import { ensureProfileExists } from "@/lib/services/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Check if an email is allowed to use the app.
 * 
 * Set ALLOWED_EMAILS in your environment variables as a comma-separated list:
 * e.g., "alice@gmail.com,bob@company.com,*@yourcompany.com"
 * 
 * Supports:
 * - Exact emails: "user@example.com"
 * - Domain wildcards: "*@company.com" (allows anyone with that domain)
 * - Empty/unset = allow everyone (no restrictions)
 */
function isEmailAllowed(email: string | undefined): boolean {
  const allowedList = process.env.ALLOWED_EMAILS;
  
  // If no allowlist is configured, allow everyone
  if (!allowedList || allowedList.trim() === "") {
    return true;
  }

  if (!email) {
    return false;
  }

  const emailLower = email.toLowerCase();
  const domain = emailLower.split("@")[1];

  const allowed = allowedList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  for (const pattern of allowed) {
    // Domain wildcard: *@company.com
    if (pattern.startsWith("*@") && pattern.slice(2) === domain) {
      return true;
    }
    // Exact match
    if (pattern === emailLower) {
      return true;
    }
  }

  return false;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    console.error("[Auth Callback] No code provided");
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Auth Callback] Error exchanging code:", error.message);
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  if (!data.user) {
    console.error("[Auth Callback] No user in response");
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  // Check if email is allowed
  if (!isEmailAllowed(data.user.email)) {
    console.log("[Auth Callback] Email not allowed:", data.user.email);
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=not_authorized", url.origin));
  }

  await ensureProfileExists(data.user.id);

  return NextResponse.redirect(new URL("/", url.origin));
}

