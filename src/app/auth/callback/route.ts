import { NextResponse } from "next/server";

import { ensureProfileExists } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  await ensureProfileExists(data.user.id);

  return NextResponse.redirect(new URL("/", url.origin));
}

