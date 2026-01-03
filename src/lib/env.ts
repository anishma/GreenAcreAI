/**
 * Environment Variables Validation
 *
 * This file validates all environment variables at build time using Zod.
 * It ensures type safety and provides helpful error messages if any required
 * variables are missing or invalid.
 *
 * Usage:
 * import { env } from '@/lib/env'
 *
 * // Access validated environment variables
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
 */

import { z } from 'zod'

/**
 * Server-side environment variables schema
 * These are only available on the server and should never be exposed to the client
 */
const serverSchema = z.object({
  // Database (Supabase)
  DATABASE_URL: z.string().url().describe('PostgreSQL connection string'),
  SUPABASE_SECRET_KEY: z.string().min(1).describe('Supabase secret key (sb_secret_...)'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).describe('Supabase service role key (legacy)'),
  SUPABASE_DB_PASSWORD: z.string().min(1).describe('Supabase database password'),

  // Auth Secrets
  NEXTAUTH_SECRET: z.string().min(32).describe('NextAuth.js secret (min 32 chars)'),
  JWT_SECRET: z.string().min(32).describe('JWT signing secret (min 32 chars)'),
  ENCRYPTION_KEY: z.string().min(32).describe('Encryption key for sensitive data (min 32 chars)'),

  // VAPI (Voice AI)
  VAPI_API_KEY: z.string().min(1).describe('VAPI private API key'),
  VAPI_WEBHOOK_SECRET: z.string().min(1).describe('VAPI webhook signature secret'),
  VAPI_PHONE_NUMBER_ID: z.string().optional().describe('VAPI phone number ID'),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-').describe('OpenAI API key (sk-...)'),
  OPENAI_ORG_ID: z.string().optional().describe('OpenAI organization ID (optional)'),

  // Regrid (Property Data)
  REGRID_API_KEY: z.string().min(1).describe('Regrid API key for property lookups'),

  // Google Cloud (Calendar API)
  GOOGLE_CLIENT_ID: z.string().endsWith('.apps.googleusercontent.com').describe('Google OAuth Client ID'),
  GOOGLE_CLIENT_SECRET: z.string().startsWith('GOCSPX-').describe('Google OAuth Client Secret'),
  GOOGLE_REDIRECT_URI: z.string().url().describe('Google OAuth redirect URI'),

  // Stripe (Payment Processing)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').describe('Stripe secret key'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').describe('Stripe webhook secret'),
  STRIPE_PRICE_ID_STARTER: z.string().startsWith('price_').describe('Stripe Starter plan price ID'),
  STRIPE_PRICE_ID_PROFESSIONAL: z.string().startsWith('price_').describe('Stripe Professional plan price ID'),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().startsWith('price_').describe('Stripe Enterprise plan price ID'),

  // Sentry (Error Tracking)
  SENTRY_AUTH_TOKEN: z.string().min(1).describe('Sentry auth token for CLI'),
  SENTRY_ORG: z.string().min(1).describe('Sentry organization slug'),
  SENTRY_PROJECT: z.string().min(1).describe('Sentry project slug'),

  // Vercel (Deployment)
  VERCEL_PROJECT_ID: z.string().optional().describe('Vercel project ID'),
  VERCEL_ORG_ID: z.string().optional().describe('Vercel organization ID'),
  VERCEL_TOKEN: z.string().optional().describe('Vercel deploy token'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

/**
 * Client-side environment variables schema
 * These are exposed to the browser and must be prefixed with NEXT_PUBLIC_
 */
const clientSchema = z.object({
  // Supabase (Client-side)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().describe('Supabase project URL'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith('sb_publishable_').describe('Supabase publishable key'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).describe('Supabase anon key (legacy)'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().describe('Application URL (localhost or Vercel)'),

  // Stripe (Client-side)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').describe('Stripe publishable key'),

  // Sentry (Client-side)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().describe('Sentry DSN for client-side error tracking'),
})

/**
 * Combined schema for all environment variables
 */
const envSchema = serverSchema.merge(clientSchema)

/**
 * Validate environment variables
 *
 * This function is called at build time to ensure all required environment
 * variables are present and valid.
 */
function validateEnv() {
  // Check if we should skip validation (useful during initial setup)
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.warn('⚠️  Skipping environment variable validation (SKIP_ENV_VALIDATION=true)')
    return process.env as z.infer<typeof envSchema>
  }

  // Validate environment variables
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))

    // List missing variables
    const fieldErrors = parsed.error.flatten().fieldErrors
    const missingVars = Object.keys(fieldErrors)
    if (missingVars.length > 0) {
      console.error('\n📋 Missing or invalid variables:')
      missingVars.forEach(varName => {
        const errors = fieldErrors[varName as keyof typeof fieldErrors]
        console.error(`  - ${varName}: ${Array.isArray(errors) ? errors.join(', ') : 'Invalid'}`)
      })
    }

    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

/**
 * Validated environment variables
 *
 * Import this object to access type-safe environment variables:
 *
 * @example
 * import { env } from '@/lib/env'
 *
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL // ✅ Type-safe!
 * const apiKey = env.OPENAI_API_KEY // ✅ Only available server-side
 */
export const env = validateEnv()

/**
 * Type definitions for environment variables
 */
export type Env = z.infer<typeof envSchema>
export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>
