declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase - Public (exposed to browser)
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Supabase - Server only
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Web Push (VAPID keys)
    VAPID_PUBLIC_KEY: string;
    VAPID_PRIVATE_KEY: string;

    // Cron authentication
    CRON_SECRET: string;

    // Next.js built-in
    NODE_ENV: "development" | "production" | "test";
  }
}
