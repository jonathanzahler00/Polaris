import { NextResponse } from "next/server";

import { getTodayForAuthedUser } from "@/lib/services/today";

type Body = { text: string };

export async function POST(request: Request) {
  let body: Partial<Body> | null = null;
  try {
    body = (await request.json()) as Partial<Body>;
  } catch {
    body = null;
  }

  if (!body || typeof body.text !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const text = body.text.trim();
  if (text.length < 1 || text.length > 100) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const { supabase, user, today } = await getTodayForAuthedUser();

    const { data, error } = await supabase
      .from("daily_orientations")
      .insert({
        user_id: user.id,
        date: today,
        text,
        locked_at: new Date().toISOString(),
      })
      .select("text")
      .single();

    if (error) {
      // Unique violation (user_id, date)
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "Conflict" }, { status: 409 });
      }
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ text: data.text });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

