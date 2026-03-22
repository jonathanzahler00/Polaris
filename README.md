# Polaris

A daily orientation check. Set your intention before the day takes over.

## Features

- **Daily orientation** – Write one focus for the day and lock it (immutable once locked).
- **Progressive Web App** – Install on your phone or desktop; works offline for the core flow.
- **Daily reminder** – Optional 6:00 AM push notification in your local time. Enable during onboarding or in Settings; one cron fires daily at 6:00 UTC and sends to everyone with reminders on.
- **Home screen widget** – Native Android widget shows today's orientation ([android-widget/](android-widget/)). Refreshes instantly via FCM when an orientation is locked.
- **Clean, minimal interface** – No streaks, no pressure.

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Copy [.env.example](.env.example) to `.env.local` and fill in the required values. See the comments in `.env.example` for each variable:

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Everything |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `CRON_SECRET` | Push reminders |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Error monitoring (optional) |
| `NEXT_PUBLIC_SITE_URL` | Widget URL generation |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Android widget FCM instant refresh |

To generate VAPID keys: `npx web-push generate-vapid-keys`

To set up Firebase (for Android widget push): create a project at [console.firebase.google.com](https://console.firebase.google.com), go to **Project Settings → Service Accounts → Generate new private key**, and paste the full JSON (single line) as `FIREBASE_SERVICE_ACCOUNT_JSON`. Add the same project's `google-services.json` to `android-widget/app/`.

## Deployment

Designed for **Vercel**. The cron in [vercel.json](vercel.json) hits `/api/cron/send-notifications` once daily at 6:00 UTC to send reminder pushes. Configure `CRON_SECRET`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` in the Vercel project. Add `FIREBASE_SERVICE_ACCOUNT_JSON` to enable instant Android widget refresh on orientation lock.

**Versioning:** See [docs/VERSIONING.md](docs/VERSIONING.md) (web `package.json`, widget `android-widget/version.properties`, CI artifacts).

## License

Private – All rights reserved.
