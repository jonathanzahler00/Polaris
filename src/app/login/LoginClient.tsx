"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginClient() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const sendLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("sending");
    await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus("sent");
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <header className="text-sm font-medium tracking-wide text-neutral-900">
          Polaris
        </header>

        <main className="flex flex-1 flex-col justify-center gap-6">
          <div className="text-base text-neutral-700">Sign in with email.</div>

          <div className="flex flex-col gap-3">
            <label className="text-xs text-neutral-600" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 text-base text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={sendLink}
              disabled={!email.trim() || status === "sending"}
              className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {status === "sending" ? "Sending…" : "Send link"}
            </button>
            {status === "sent" ? (
              <div className="text-sm text-neutral-600">Check your email.</div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

