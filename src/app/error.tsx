"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV === "development") {
    console.error("Route error:", error);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-neutral-50 text-neutral-900">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-neutral-600 mb-6 text-center max-w-sm">
        This page couldn’t be loaded. Try again or go back home.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
