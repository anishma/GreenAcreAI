# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Configuration
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Set **Site URL** to: `https://your-app.vercel.app`
- [ ] Add these **Redirect URLs**:
  - `http://localhost:3000/api/auth/callback`
  - `https://your-app.vercel.app/api/auth/callback`
  - `https://*.vercel.app/api/auth/callback`

### 2. Google OAuth Console
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [ ] Add to **Authorized redirect URIs**:
  - `http://localhost:3000/api/auth/google/callback`
  - `https://your-app.vercel.app/api/auth/google/callback`

### 3. Vercel Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables (for Production, Preview, Development):

#### Required Supabase Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dausexigvmmppiijbzyb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_zCUVoC1G-9ODpBbxp647OQ_Nq6j3iaO
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_zCUVoC1G-9ODpBbxp647OQ_Nq6j3iaO
SUPABASE_SECRET_KEY=sb_secret_0mQAGKfRVG5XkuN_ow6yQw_at7OUoK2
SUPABASE_DB_PASSWORD=9uo5MUPYGDAfPCCG
DATABASE_URL=postgresql://postgres:9uo5MUPYGDAfPCCG@db.dausexigvmmppiijbzyb.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:9uo5MUPYGDAfPCCG@db.dausexigvmmppiijbzyb.supabase.co:5432/postgres
```

#### Auth Configuration (CRITICAL!)
```bash
NEXT_PUBLIC_DISABLE_AUTH=false
DISABLE_AUTH=false
```

#### API Keys
```bash
OPENAI_API_KEY=<from .env file>
VAPI_API_KEY=<from .env file>
VAPI_WEBHOOK_SECRET=<from .env file>
VAPI_PHONE_NUMBER_ID=<from .env file>
REGRID_API_KEY=<from .env file>
TWILIO_ACCOUNT_SID=<from .env file>
TWILIO_AUTH_TOKEN=<from .env file>
TWILIO_PHONE_NUMBER=<from .env file>
```

#### Google OAuth (Update redirect URI!)
```bash
GOOGLE_CLIENT_ID=<from .env file>
GOOGLE_CLIENT_SECRET=<from .env file>
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
```

## Deployment Steps

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Deploy via GitHub Integration
1. Connect your GitHub repo to Vercel
2. Push to main branch
3. Vercel will auto-deploy

## Post-Deployment Verification

- [ ] Visit your production URL
- [ ] Test "Sign In with Google" flow
- [ ] Verify redirect works correctly
- [ ] Test onboarding flow for new users
- [ ] Test dashboard access for existing users
- [ ] Check that all API integrations work (VAPI, Twilio, etc.)

## Architecture Notes

### Why No Prisma in Middleware?
- Middleware runs in Vercel Edge Runtime (lightweight, fast, global)
- Prisma requires Node.js runtime (uses native database drivers)
- **Solution**: Onboarding checks moved to:
  1. Auth callback (`/api/auth/callback`) - handles initial routing
  2. Server Components (pages) - prevents direct URL access
- This architecture is **Edge Runtime compatible** and works on Vercel!

## Troubleshooting

### OAuth Errors
- Verify redirect URIs match exactly in both Supabase and Google Console
- Check that `NEXT_PUBLIC_DISABLE_AUTH=false` in production
- Look for errors in Vercel deployment logs

### Database Connection Issues
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Supabase project is not paused
- Verify database password hasn't changed

### Environment Variable Issues
- Ensure all variables are set for the correct environment (Production)
- Check for typos in variable names
- Redeploy after adding/changing variables

### Edge Runtime Errors
- If you see "PrismaClient is not configured to run in Edge Runtime":
  - This should NOT happen in production with current setup
  - Onboarding checks are in Server Components (Node.js runtime)
  - Middleware only does authentication (Edge compatible)
- If it still occurs, check that you haven't added Prisma to middleware
