"use client";

import { useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";

type Props = {
  initialToken: string | null;
  widgetUrl: string;
};

export default function WidgetClient({ initialToken, widgetUrl }: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/widget/token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeToken = async () => {
    setIsRevoking(true);
    try {
      const res = await fetch("/api/widget/token", { method: "DELETE" });
      if (res.ok) {
        setToken(null);
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyUrl = () => {
    const fullUrl = token ? `${widgetUrl}?token=${token}` : widgetUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10 gap-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium tracking-wide text-neutral-900 hover:underline">
            ← Polaris
          </Link>
          <LogoutButton />
        </header>

        <main className="flex flex-1 flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
              Widget Setup
            </h1>
            <p className="text-neutral-600">
              Display your daily orientation on your home screen using third-party widget apps.
            </p>
          </div>

          {/* Widget Token */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">
              Widget Access Token
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Generate a secure token to allow widget apps to access your daily orientation.
            </p>

            {!token ? (
              <button
                onClick={generateToken}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Token"}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded bg-neutral-50 border border-neutral-200 font-mono text-xs break-all">
                  {token}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyToken}
                    className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    {copied ? "Copied!" : "Copy Token"}
                  </button>
                  <button
                    onClick={revokeToken}
                    disabled={isRevoking}
                    className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {isRevoking ? "Revoking..." : "Revoke Token"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Setup Instructions - Simplified */}
          {token && (
            <div className="rounded-lg border-2 border-neutral-900 bg-neutral-50 p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                Quick Setup (Android)
              </h2>
              <p className="text-sm text-neutral-600 mb-4">
                The easiest way to add your daily orientation to your home screen:
              </p>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <p className="text-sm text-neutral-700 flex-1">
                      Install <a
                        href="https://play.google.com/store/apps/details?id=com.djinnworks.webviewwidget"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline hover:text-neutral-900"
                      >
                        WebView Widget
                      </a> from Google Play Store (free)
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-700 mb-2">
                        Copy your widget URL:
                      </p>
                      <div className="p-3 rounded bg-neutral-50 border border-neutral-200 font-mono text-xs break-all mb-2">
                        {widgetUrl.replace('/api/widget/today', '/widget-view')}?token={token}
                      </div>
                      <button
                        onClick={() => {
                          const htmlUrl = `${widgetUrl.replace('/api/widget/today', '/widget-view')}?token=${token}`;
                          navigator.clipboard.writeText(htmlUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
                      >
                        {copied ? "Copied!" : "Copy Widget URL"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <p className="text-sm text-neutral-700 flex-1">
                      Long-press home screen → Add widget → Select WebView Widget
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <p className="text-sm text-neutral-700 flex-1">
                      Tap widget → Paste URL → Set refresh to 60 minutes → Done!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Options - Collapsed by default */}
          {token && (
            <details className="rounded-lg border border-neutral-200 bg-white">
              <summary className="p-4 cursor-pointer text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Other widget options (iOS, advanced Android)
              </summary>
              <div className="px-4 pb-4 space-y-4 text-sm text-neutral-600">
                <div>
                  <p className="font-medium text-neutral-900 mb-1">iOS (Widgetsmith)</p>
                  <p className="text-xs">
                    Install Widgetsmith → Add Web widget → Use URL: <code className="text-xs bg-neutral-100 px-1 rounded">{widgetUrl}?token={token}</code> → Map "text" field
                  </p>
                </div>
                <div>
                  <p className="font-medium text-neutral-900 mb-1">Android (HTTP Request Widget)</p>
                  <p className="text-xs">
                    Install HTTP Request Widget → Use URL: <code className="text-xs bg-neutral-100 px-1 rounded">{widgetUrl}?token={token}</code> → Set field to "text"
                  </p>
                </div>
              </div>
            </details>
          )}

          {/* Security Notice */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-900">
              <strong>Security Note:</strong> Keep your widget token private. Anyone with this token can view your daily orientations. Revoke and regenerate if compromised.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
