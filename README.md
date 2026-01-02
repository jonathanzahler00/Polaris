# Polaris

Polaris is a daily orientation check.

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- Web Push (PWA) + VAPID keys
- Cron endpoint for scheduled sends

## Supabase setup

- **Create a Supabase project**
- **Enable email magic link** in Supabase Auth settings
- **Add redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - your production URL + `/auth/callback`
- **Run the SQL migration** in the Supabase SQL editor:
  - `supabase/migrations/001_polaris.sql`

## Web Push / VAPID keys

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Use the output to set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

## Environment variables

Create `.env.local` (see `.env.example`).

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; used by cron and profile fallback)
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` (server only)
- `CRON_SECRET` (server only)

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel cron

Schedule a request every minute to:

- `GET /api/cron/send-notifications`

Include header:

- `x-cron-secret: <CRON_SECRET>`

Vercel Cron example:

- Path: `/api/cron/send-notifications`
- Schedule: `* * * * *`
- Headers: `x-cron-secret` = `CRON_SECRET`

