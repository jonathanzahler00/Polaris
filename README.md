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

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values:
   - Get Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api
   - Generate VAPID keys: `npx web-push generate-vapid-keys`
   - Generate cron secret: `openssl rand -base64 32` (or any random string)

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server only; used by cron and profile fallback)
- `VAPID_PUBLIC_KEY` - Web Push public key
- `VAPID_PRIVATE_KEY` - Web Push private key (server only)
- `CRON_SECRET` - Random secret for cron authentication (server only)

### Vercel Deployment

Add all environment variables in Vercel project settings:
- Go to: https://vercel.com/your-username/your-project/settings/environment-variables
- Add each variable for Production, Preview, and Development environments
- **Important:** `NEXT_PUBLIC_*` variables are exposed to the browser (safe)
- All other variables are server-only (keep secret)
- After adding variables, redeploy the application

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel cron

The `vercel.json` file configures a cron job that runs every minute to check for users who need notifications.

**Automatic setup:**
- The cron configuration is in `vercel.json`
- Vercel will automatically create the cron job on deployment
- Path: `/api/cron/send-notifications`
- Schedule: `* * * * *` (every minute)

**Security:**
- The cron endpoint requires a secret header: `x-cron-secret`
- This is automatically handled by Vercel Cron
- Make sure `CRON_SECRET` environment variable is set in Vercel

**Manual setup (if needed):**
If automatic cron doesn't work, manually create it in Vercel dashboard:
- Go to your project → Settings → Cron Jobs
- Add cron job with path `/api/cron/send-notifications`
- Schedule: `* * * * *`
- Headers: `x-cron-secret` = your `CRON_SECRET` value

