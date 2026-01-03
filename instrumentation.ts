/**
 * Instrumentation File (Next.js 14+)
 *
 * This file is automatically called by Next.js when the server starts.
 * We use it to validate environment variables before the app runs.
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and validate environment variables
    // This will throw an error if validation fails, preventing the app from starting
    await import('./src/lib/env')
  }
}
