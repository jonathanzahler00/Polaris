# Polaris Admin Guide

This file is for your reference only—it's not visible to users.

---

## Managing Allowed Users

Polaris uses an email allowlist to control who can sign up. This is managed via the `ALLOWED_EMAILS` environment variable in Vercel.

### Setting Up the Allowlist

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `ALLOWED_EMAILS`
   - **Value:** Comma-separated list of emails (see examples below)
3. Click **Save**
4. **Redeploy** for changes to take effect

### Format Examples

| Value | Who Can Access |
|-------|----------------|
| `alice@gmail.com,bob@yahoo.com` | Only Alice and Bob |
| `*@yourcompany.com` | Anyone with @yourcompany.com email |
| `you@gmail.com,*@company.com` | You + anyone at company.com |
| *(empty or not set)* | Everyone (no restrictions) |

### Adding a New User

1. Vercel → Settings → Environment Variables
2. Find `ALLOWED_EMAILS` → Click **Edit**
3. Add the new email to the list:
   ```
   existing@email.com,newuser@email.com
   ```
4. Save → Redeploy

### Removing a User

1. Vercel → Settings → Environment Variables
2. Find `ALLOWED_EMAILS` → Click **Edit**
3. Remove the email from the list
4. Save → Redeploy

> **Note:** Removing someone from the allowlist doesn't delete their account or data. It just prevents them from logging in again. To fully remove a user, delete them from Supabase Authentication dashboard.

---

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |
| `CRON_SECRET` | Secret for cron job authentication |

### Optional

| Variable | Description |
|----------|-------------|
| `ALLOWED_EMAILS` | Comma-separated email allowlist |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |

---

## Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **App URL:** https://polarisapp.vercel.app

---

## Quick Commands

```bash
# Generate new VAPID keys (if needed)
npx web-push generate-vapid-keys

# Generate a secure CRON_SECRET
openssl rand -base64 32

# Regenerate PWA icons after changing icon.svg
npm run generate-icons
```

