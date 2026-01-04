import { NextResponse } from "next/server";

import { getTodayForAuthedUser } from "@/lib/services/today";

export async function GET() {
  try {
    const { orientation } = await getTodayForAuthedUser();
    return NextResponse.json({ text: orientation?.text ?? null });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

