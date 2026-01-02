export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}\n\n` +
        `This variable must be configured in your environment.\n` +
        `For local development: Add it to .env.local\n` +
        `For Vercel deployment: Add it in Project Settings → Environment Variables\n\n` +
        `See .env.example for required variables.`
    );
  }
  return value;
}

