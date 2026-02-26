import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Polaris",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#fafafa] px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-neutral-400 mb-8">Last updated: February 2026</p>

      <section className="space-y-6 text-neutral-300 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">What Polaris Collects</h2>
          <p>
            When you use Polaris, we store the minimum data needed to operate the
            app:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Your email address (for authentication)</li>
            <li>Your daily orientation text (what you write each day)</li>
            <li>Your timezone preference</li>
            <li>Push notification subscription tokens (if you enable reminders)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">How Data Is Stored</h2>
          <p>
            All data is stored in a Supabase-hosted PostgreSQL database. Data is
            encrypted at rest and in transit. Your password is never stored —
            Polaris uses magic link (passwordless) authentication.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Data Sharing</h2>
          <p>
            We do not sell, rent, or share your personal data with any third
            parties. Your daily orientations are private to you.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Analytics</h2>
          <p>
            Polaris uses Sentry for error monitoring only. Sentry captures
            technical error data (stack traces, browser info) to help fix bugs.
            It does not track your behavior or personal content.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Your Rights</h2>
          <p>
            You can request deletion of your account and all associated data at
            any time by contacting us. Once deleted, your data cannot be
            recovered.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Cookies</h2>
          <p>
            Polaris uses essential cookies for authentication session management
            only. No tracking or advertising cookies are used.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. Changes will be
            reflected on this page with an updated date.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Contact</h2>
          <p>
            If you have questions about this policy or your data, reach out via
            the app or email the developer directly.
          </p>
        </div>
      </section>
    </main>
  );
}
