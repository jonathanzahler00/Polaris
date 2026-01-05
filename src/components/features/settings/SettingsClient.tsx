"use client";

import Link from "next/link";
import { ReminderSettings } from "@/components/features/reminder/ReminderSettings";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default function SettingsClient() {
  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10">
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-sm font-medium tracking-wide text-neutral-900 hover:text-neutral-600"
          >
            ← Polaris
          </Link>
          <LogoutButton />
        </header>

        <main className="flex-1 space-y-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>

          <ReminderSettings />

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Widget
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Display your daily orientation on your home screen.
            </p>
            <Link
              href="/widget"
              className="inline-block px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Set Up Widget
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
