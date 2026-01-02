# Polaris - Features Documentation

## Core Features

### ✅ Authentication
- **Email Magic Link**: Passwordless authentication via Supabase
- **Session Management**: Automatic session refresh via middleware
- **Logout Functionality**: Users can sign out from the main page

### ✅ User Profiles
- **Auto-Creation**: Profiles automatically created on first login via database trigger
- **Timezone Support**: Users can set their local timezone during onboarding
- **Notification Preferences**: Customizable notification time and enable/disable toggle

### ✅ Daily Orientations
- **One Per Day**: Users can submit one orientation per day (immutable once locked)
- **Character Limit**: 1-100 characters
- **Timezone-Aware**: Dates calculated based on user's timezone
- **Duplicate Prevention**: Database constraint prevents multiple submissions per day

### ✅ Onboarding Flow
- **3-Step Process**:
  1. Welcome/Introduction
  2. Push Notification Setup (browser permission request)
  3. Timezone & Notification Time Configuration
- **Progressive**: Users can't access main app until onboarding is complete
- **Service Worker**: Automatic registration during onboarding

### ✅ Push Notifications
- **Daily Reminders**: Scheduled notifications at user-specified time
- **Timezone-Aware**: Notifications sent based on user's local time
- **Web Push API**: Standards-compliant push notifications
- **VAPID Keys**: Secure authentication for push notifications
- **Subscription Management**: Users can enable/disable notifications
- **Cleanup**: Inactive subscriptions automatically marked as inactive

### ✅ Cron Jobs
- **Frequency**: Runs every minute (configured in `vercel.json`)
- **Smart Scheduling**: Only sends notifications at user's specified time
- **Deduplication**: Tracks last notification date to prevent duplicates
- **Authentication**: Secured with `CRON_SECRET` via Authorization header
- **Error Handling**: Gracefully handles invalid/expired subscriptions

### ✅ Error Monitoring
- **Sentry Integration**: Production-ready error tracking
- **Source Maps**: Uploaded for better stack traces (optional)
- **Session Replay**: Capture user sessions on errors
- **Automatic Instrumentation**: Vercel Cron monitoring
- **Browser & Server**: Both client and server errors tracked

### ✅ Testing
- **Test Framework**: Vitest with React Testing Library
- **Unit Tests**: Coverage for utility functions (date, env)
- **API Tests**: Validation testing for API routes
- **Happy DOM**: Fast DOM environment for component tests
- **Test UI**: Visual test runner (`npm run test:ui`)
- **Coverage Reports**: Code coverage tracking

### ✅ Security
- **Row-Level Security**: All database tables have RLS policies
- **Immutable Data**: Daily orientations can't be updated or deleted
- **Server-Only Secrets**: Service role keys never exposed to client
- **Input Validation**: All API endpoints validate inputs
- **Cron Authentication**: Protected with secret header
- **HTTPS Required**: PWA and push notifications require secure origin

### ✅ Progressive Web App (PWA)
- **Manifest**: Configured for standalone display mode
- **Service Worker**: Handles push notifications and offline behavior
- **Installable**: Can be added to home screen on mobile devices
- **Icons**: SVG icons for scalability

## Developer Experience

### Code Quality
- **TypeScript**: Strict mode enabled throughout
- **Environment Types**: Full TypeScript definitions for `process.env`
- **Linting**: ESLint with Next.js configuration
- **Error Messages**: Helpful, actionable error messages

### Documentation
- **README.md**: Quick start and development guide
- **DEPLOYMENT.md**: Complete deployment instructions with troubleshooting
- **.env.example**: Template for all required environment variables
- **FEATURES.md**: This file - comprehensive feature list

### Configuration
- **vercel.json**: Automated cron setup
- **sentry.*.config.ts**: Pre-configured Sentry clients
- **vitest.config.ts**: Test configuration
- **next.config.ts**: Sentry-wrapped Next.js config

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/callback` | GET | OAuth callback handler |
| `/api/auth/logout` | POST | Sign out user |
| `/api/today` | GET | Get today's locked orientation |
| `/api/today/lock` | POST | Submit daily orientation |
| `/api/profile/complete-onboarding` | POST | Complete onboarding process |
| `/api/push/subscribe` | POST | Enable push notifications |
| `/api/push/unsubscribe` | POST | Disable push notifications |
| `/api/cron/send-notifications` | GET | Send daily reminders (Vercel Cron) |

## Database Schema

### Tables

#### profiles
- `user_id` (UUID, PK) - References auth.users
- `created_at` (timestamptz) - Account creation
- `timezone` (text) - User's timezone (default: 'America/New_York')
- `notification_time` (time) - Preferred notification time (default: '07:00')
- `notifications_enabled` (boolean) - Push notification toggle
- `last_notified_on` (date) - Last notification date (prevents duplicates)
- `onboarding_completed` (boolean) - Onboarding status

#### daily_orientations
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID) - References profiles
- `date` (date) - Date of orientation
- `text` (text) - Orientation text (1-100 chars)
- `locked_at` (timestamptz) - When orientation was locked
- `created_at` (timestamptz) - When record was created
- **Constraint**: Unique (user_id, date)
- **Note**: Immutable (no UPDATE/DELETE policies)

#### push_subscriptions
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID) - References profiles
- `endpoint` (text) - Push notification endpoint
- `p256dh` (text) - Encryption key
- `auth` (text) - Authentication secret
- `user_agent` (text, nullable) - Browser info
- `created_at` (timestamptz) - Subscription creation
- `is_active` (boolean) - Subscription status
- **Constraint**: Unique (user_id, endpoint)

### Triggers
- `on_auth_user_created`: Automatically creates profile row when user signs up

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (server-only)
- `VAPID_PUBLIC_KEY` - Web Push public key
- `VAPID_PRIVATE_KEY` - Web Push private key (server-only)
- `CRON_SECRET` - Cron endpoint authentication

### Optional
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry project DSN
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project name
- `SENTRY_AUTH_TOKEN` - Sentry API token (for source maps)

## Future Enhancements (Not Implemented)

### Potential Features
- 📊 Analytics dashboard (view orientation history)
- 📤 Data export (GDPR compliance)
- 🔄 Email digest (weekly summary)
- 🎨 Themes (dark mode)
- 📱 Native mobile app
- 👥 Social sharing
- 📈 Streak tracking
- 🏆 Achievements/badges

### Technical Improvements
- ⚡ Rate limiting (prevent API abuse)
- 🔐 Email verification (optional)
- 🧪 E2E tests (Playwright/Cypress)
- 📦 Bundle size optimization
- 🚀 Performance monitoring
- 🔄 Optimistic UI updates
- 💾 Offline support (service worker caching)

## Technology Stack

- **Frontend**: React 19, Next.js 16.1 (App Router), TypeScript 5
- **Styling**: Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (Magic Links)
- **Push Notifications**: Web Push API, web-push library
- **Error Tracking**: Sentry
- **Testing**: Vitest, Testing Library, Happy DOM
- **Deployment**: Vercel
- **Monitoring**: Sentry, Vercel Analytics (optional)
- **Date/Time**: Luxon (timezone support)

## Performance

- **Server Components**: Minimal JavaScript shipped to client
- **Code Splitting**: Automatic by Next.js
- **Image Optimization**: Next.js Image component
- **Database Indexes**: Optimized queries on date and user_id
- **Cron Efficiency**: O(n) where n = enabled users

## Accessibility

- **Semantic HTML**: Proper heading hierarchy
- **Focus Management**: Keyboard navigation support
- **Input Labels**: All form inputs properly labeled
- **Error Messages**: Clear, actionable feedback

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Push Notifications**: Requires HTTPS and browser support
- **Service Workers**: Required for push notifications
- **JavaScript**: Required (React application)

---

Last updated: 2026-01-02
