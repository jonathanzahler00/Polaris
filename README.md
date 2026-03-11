# Polaris

A daily orientation check. Set your intention before the day takes over.

## Features

- **Daily orientation** – Write one focus for the day and lock it (immutable once locked).
- **Progressive Web App** – Install on your phone or desktop; works offline for the core flow.
- **Daily reminder** – Optional push notification once per day (runs at 6:00 UTC via cron). Set or resync in Settings.
- **Home screen widget** – Native Android widget shows today’s orientation ([android-widget/](android-widget/)).
- **Clean, minimal interface** – No streaks, no pressure.

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Copy [.env.example](.env.example) to `.env.local` and set Supabase and (for reminders) VAPID and `CRON_SECRET`. See the comments in `.env.example`.

## Deployment

Designed for **Vercel**. The cron in [vercel.json](vercel.json) hits `/api/cron/send-notifications` once daily at 6:00 UTC to send reminder pushes. Configure `CRON_SECRET`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` in the Vercel project.

## License

Private – All rights reserved.
