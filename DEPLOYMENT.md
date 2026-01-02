# Polaris Deployment Guide

## Quick Fix for Current Error

Your site is showing `Missing environment variable: NEXT_PUBLIC_SUPABASE_URL` because Vercel doesn't have the required environment variables configured.

### Immediate Steps:

1. **Go to Vercel Project Settings**
   - Navigate to: https://vercel.com/your-username/polaris-iota-orcin/settings/environment-variables

2. **Add These Environment Variables:**

   | Variable Name | Where to Get It | Environment Scope |
   |--------------|----------------|-------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → Service Role (Secret!) | Production, Preview, Development |
   | `VAPID_PUBLIC_KEY` | Run `npx web-push generate-vapid-keys` locally | Production, Preview, Development |
   | `VAPID_PRIVATE_KEY` | Same as above (keep secret!) | Production, Preview, Development |
   | `CRON_SECRET` | Generate with `openssl rand -base64 32` | Production, Preview, Development |

3. **Redeploy**
   - Go to Deployments tab
   - Click "..." on latest deployment → "Redeploy"
   - Your site should work after this

---

## Full Deployment Checklist

### Prerequisites

- ✅ Supabase project created
- ✅ Vercel account connected to GitHub
- ✅ Repository pushed to GitHub

### 1. Supabase Setup

#### A. Enable Email Authentication
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. **Disable** "Confirm email" (or configure email templates)
4. Save changes

#### B. Configure Redirect URLs
1. Go to Authentication → URL Configuration
2. Add these redirect URLs:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://your-app.vercel.app/auth/callback` (production)
   - `https://*.vercel.app/auth/callback` (for preview deployments)

#### C. Run Database Migration
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/001_polaris.sql`
3. Run the SQL
4. Verify tables created:
   - `profiles`
   - `daily_orientations`
   - `push_subscriptions`

### 2. Generate VAPID Keys

Run this command locally:

```bash
npx web-push generate-vapid-keys
```

You'll get output like:

```
=======================================

Public Key:
BCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Private Key:
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

=======================================
```

**Save both keys!** You'll need them for environment variables.

### 3. Generate Cron Secret

Run this command:

```bash
openssl rand -base64 32
```

Or use any random string generator. This will be your `CRON_SECRET`.

### 4. Configure Vercel

#### A. Add Environment Variables

1. Go to: https://vercel.com/your-username/polaris-iota-orcin/settings/environment-variables

2. Add each variable:

   **Public Variables (exposed to browser):**
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Secret Variables (server-only):**
   ```
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VAPID_PUBLIC_KEY = BCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VAPID_PRIVATE_KEY = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CRON_SECRET = your-random-secret-here
   ```

3. For each variable, select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

#### B. Verify Cron Job

After deployment, check if cron job was created:

1. Go to: https://vercel.com/your-username/polaris-iota-orcin/settings/cron
2. You should see:
   - **Path:** `/api/cron/send-notifications`
   - **Schedule:** `* * * * *` (every minute)
   - **Status:** Active

If not visible, the `vercel.json` will create it on next deployment.

### 5. Deploy

#### Push to GitHub

```bash
git add .
git commit -m "Add environment configuration files"
git push origin main
```

#### Trigger Deployment

Vercel will automatically deploy. Monitor at:
- https://vercel.com/your-username/polaris-iota-orcin/deployments

#### Verify Deployment

1. Check build logs for errors
2. Visit your site: https://polaris-iota-orcin.vercel.app
3. Test login flow (enter your email)
4. Complete onboarding
5. Enter a daily orientation

---

## Troubleshooting

### "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"

**Cause:** Environment variables not set in Vercel
**Fix:** Add all variables in Vercel settings and redeploy

### "Invalid login credentials"

**Cause:** Magic link email not configured in Supabase
**Fix:**
1. Check Supabase → Authentication → Email Templates
2. Ensure email provider is configured
3. Try using a different email address

### "Unauthorized" on Cron Endpoint

**Cause:** `CRON_SECRET` mismatch or missing
**Fix:**
1. Verify `CRON_SECRET` is set in Vercel
2. Check cron job configuration has `Authorization: Bearer <CRON_SECRET>`
3. Test manually: `curl -H "Authorization: Bearer YOUR_SECRET" https://your-app.vercel.app/api/cron/send-notifications`

### Push Notifications Not Working

**Cause:** Multiple possible issues
**Fix:**
1. Verify `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set
2. Check browser console for service worker errors
3. Ensure site is HTTPS (localhost or Vercel are fine)
4. Try re-enabling notifications in onboarding

### Profile Not Created After Login

**Cause:** `SUPABASE_SERVICE_ROLE_KEY` missing or database trigger failed
**Fix:**
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
2. Verify database trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. Manually create profile if needed:
   ```sql
   INSERT INTO profiles (user_id) VALUES ('your-user-id');
   ```

---

## Security Checklist

- ✅ `SUPABASE_SERVICE_ROLE_KEY` is **NOT** exposed to client (no `NEXT_PUBLIC_` prefix)
- ✅ `VAPID_PRIVATE_KEY` is **NOT** exposed to client
- ✅ `CRON_SECRET` is **NOT** exposed to client
- ✅ Row-Level Security (RLS) enabled on all tables
- ✅ Supabase redirect URLs configured (prevents open redirect attacks)
- ✅ Email confirmation disabled or configured (prevents email spam)
- ✅ Daily orientation text limited to 100 characters (prevents abuse)

---

## Monitoring

### Check Cron Execution

1. View Vercel function logs:
   - Go to Deployments → Latest → Functions
   - Click on `/api/cron/send-notifications`
   - Check logs for errors

2. Verify notifications are being sent:
   - Check `profiles` table: `last_notified_on` should update
   - Check `push_subscriptions` table: `is_active` should be true

### Database Queries

**See all users who should receive notifications:**
```sql
SELECT user_id, timezone, notification_time, last_notified_on
FROM profiles
WHERE onboarding_completed = true
  AND notifications_enabled = true;
```

**Check today's orientations:**
```sql
SELECT user_id, date, text, locked_at
FROM daily_orientations
WHERE date = CURRENT_DATE
ORDER BY locked_at DESC;
```

**Active push subscriptions:**
```sql
SELECT user_id, endpoint, created_at, is_active
FROM push_subscriptions
WHERE is_active = true;
```

---

## Maintenance

### Rotate VAPID Keys

1. Generate new keys: `npx web-push generate-vapid-keys`
2. Update `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in Vercel
3. Redeploy
4. Users will need to re-enable notifications (old subscriptions become invalid)

### Rotate Cron Secret

1. Generate new secret: `openssl rand -base64 32`
2. Update `CRON_SECRET` in Vercel
3. Redeploy
4. Cron job will automatically use new secret

### Clean Up Inactive Subscriptions

Run periodically:
```sql
DELETE FROM push_subscriptions
WHERE is_active = false
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## Support

If you encounter issues:

1. Check Vercel function logs
2. Check Supabase logs (Dashboard → Logs)
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
5. Try redeploying with clean cache
