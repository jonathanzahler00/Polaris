# Polaris

Polaris is a daily orientation check. Set your intention before the day takes over.

**✨ New:** Home screen widgets for Android & iOS! See [WIDGETS.md](./WIDGETS.md) for setup instructions.

## Features

- 📝 Daily orientation text (1-100 characters)
- 🔒 Immutable once locked (one per day)
- 🌍 Timezone-aware
- 📱 Progressive Web App (install on home screen)
- 🔔 Push notifications (optional)
- 📲 **Home screen widgets** (Android & iOS via third-party apps)
- 🔐 Secure token-based widget API
- 👤 User accounts with magic link auth
- 🎨 Clean, minimal interface

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- Web Push (PWA) + VAPID keys
- Widget API with secure tokens
- Sentry error monitoring
- Vitest + Testing Library for tests

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

## Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Vercel cron

The `vercel.json` file configures a cron job that runs every hour to check for users who need notifications.

**Automatic setup:**
- The cron configuration is in `vercel.json`
- Vercel will automatically create the cron job on deployment
- Path: `/api/cron/send-notifications`
- Schedule: `0 * * * *` (every hour at minute 0)
- **Note:** Vercel Hobby plan only supports hourly or daily cron jobs

**Security:**
- The cron endpoint requires a secret header: `x-cron-secret`
- This is automatically handled by Vercel Cron
- Make sure `CRON_SECRET` environment variable is set in Vercel

**Manual setup (if needed):**
If automatic cron doesn't work, manually create it in Vercel dashboard:
- Go to your project → Settings → Cron Jobs
- Add cron job with path `/api/cron/send-notifications`
- Schedule: `0 * * * *` (hourly) or `0 0 * * *` (daily at midnight UTC)
- Headers: `x-cron-secret` = your `CRON_SECRET` value

