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

          {/* API Endpoint */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">
              Widget API URL
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Use this URL in your widget app to fetch your daily orientation.
            </p>
            <div className="p-3 rounded bg-neutral-50 border border-neutral-200 font-mono text-xs break-all mb-4">
              {token ? `${widgetUrl}?token=${token}` : widgetUrl}
            </div>
            <button
              onClick={copyUrl}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">
              Setup Instructions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                  📱 Android (KWGT)
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-600">
                  <li>Install KWGT from Google Play Store</li>
                  <li>Add a KWGT widget to your home screen</li>
                  <li>Tap the widget → Create new widget</li>
                  <li>Add a Text element</li>
                  <li>Set text to: $wg("https://your-url?token=TOKEN", json, .text)$</li>
                  <li>Replace the URL with your Widget API URL above</li>
                  <li>Set refresh interval to 60 minutes</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                  📱 iOS (Widgetsmith)
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-600">
                  <li>Install Widgetsmith from App Store</li>
                  <li>Create a new widget (any size)</li>
                  <li>Tap "Add Widget" → "Web"</li>
                  <li>Enter your Widget API URL</li>
                  <li>Select "JSON" as format</li>
                  <li>Map the "text" field to display</li>
                  <li>Add to home screen</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                  📱 iOS (Scriptable)
                </h3>
                <p className="text-sm text-neutral-600 mb-2">
                  For advanced users, create a custom script in Scriptable:
                </p>
                <pre className="p-3 rounded bg-neutral-900 text-neutral-100 text-xs overflow-x-auto">
{`let url = "YOUR_WIDGET_URL_HERE";
let req = new Request(url);
let json = await req.loadJSON();
let widget = new ListWidget();
let text = widget.addText(json.text || "Not set");
text.font = Font.systemFont(16);
Script.setWidget(widget);
Script.complete();`}
                </pre>
              </div>
            </div>
          </div>

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
