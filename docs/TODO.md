# Polaris — To Do

## Monthly Report (Email)

- [ ] Add `monthly_report_enabled` column to `profiles` table in Supabase:
  ```sql
  ALTER TABLE profiles ADD COLUMN monthly_report_enabled boolean NOT NULL DEFAULT false;
  ```
- [ ] Sign up at [resend.com](https://resend.com) and verify a sending domain
- [ ] Add env vars in Vercel dashboard:
  - `RESEND_API_KEY` — API key from Resend
  - `RESEND_FROM_EMAIL` — e.g. `Polaris <reports@yourdomain.com>`
- [ ] Add the same vars to `.env.local` for local testing
- [x] Wire up the opt-in toggle in the Settings UI — update `monthly_report_enabled` on the `profiles` row when a user turns it on (see `MonthlyReportSettings`)
