# Vercel Deployment & Management Guide

## Your Current Setup

✅ **Vercel Project**: Already configured and deployed!
- **Production URL**: https://green-acre-ai.vercel.app
- **Auto-Deploy**: Enabled (deploys on every git push to main)

---

## How Auto-Deployment Works

```
┌─────────────────────────────────────────────────────────┐
│            Vercel Auto-Deployment Flow                   │
└─────────────────────────────────────────────────────────┘

1. You commit code:
   git add .
   git commit -m "Add feature"
   git push origin main
   ↓
2. GitHub receives push
   ↓
3. GitHub notifies Vercel (via webhook)
   ↓
4. Vercel starts build:
   - Installs dependencies (npm install)
   - Runs build (npm run build)
   - Checks for errors
   ↓
5. Build succeeds → Deploy to production
   ↓
6. Your app is live at: https://green-acre-ai.vercel.app
   ↓
7. You receive notification (email/Slack if configured)
```

---

## Monitoring Deployments

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**:
   ```
   https://vercel.com/dashboard
   ```

2. **Find your project**: Click on "GreenAcreAI" or "green-acre-ai"

3. **View Deployments**:
   - See all deployments (production + preview)
   - Check status: ✅ Ready, 🏗️ Building, ❌ Failed
   - View build logs
   - See deployment time

4. **Check Latest Deployment**:
   - Top of the list = most recent
   - Click to see:
     - Build logs
     - Runtime logs
     - Environment variables used
     - Deployment URL

### Method 2: GitHub Integration

1. **Go to your GitHub repo**:
   ```
   https://github.com/anishma/GreenAcreAI
   ```

2. **Check commit status**:
   - ✅ Green checkmark = Deployed successfully
   - 🟡 Yellow dot = Building
   - ❌ Red X = Failed

3. **Click the status icon** to see:
   - Vercel deployment details
   - Direct link to Vercel logs
   - Preview URL

### Method 3: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link this project to Vercel (one-time)
vercel link

# List recent deployments
vercel ls

# Get deployment details
vercel inspect [deployment-url]

# View logs for latest deployment
vercel logs
```

### Method 4: Vercel Mobile App

- Download "Vercel" from App Store/Play Store
- Get push notifications for deployments
- View logs on the go

---

## Checking if Latest Code is Deployed

### Quick Check

1. **Check the latest commit**:
   ```bash
   git log -1 --oneline
   ```

2. **Go to Vercel Dashboard** → Your project → Latest deployment

3. **Verify the commit hash matches**

### Using API Endpoints

Test if your latest changes are live:

```bash
# Check if VAPI endpoints are accessible
curl https://green-acre-ai.vercel.app/api/vapi-llm

# Should return: Method not allowed (we need POST)
# If you get 404, deployment might have failed

curl https://green-acre-ai.vercel.app/api/webhooks/vapi

# Should also return: Method not allowed
```

---

## Common Deployment Issues & Solutions

### Issue 1: Build Failed

**Symptoms**: ❌ Red X on GitHub, email from Vercel

**Check**:
1. Go to Vercel Dashboard → Deployments → Click failed deployment
2. Read build logs for errors

**Common Causes**:
- TypeScript errors
- Missing environment variables
- Import errors
- Build command failed

**Solution**:
```bash
# Test build locally first
npm run build

# Fix errors, then commit and push
git add .
git commit -m "Fix build errors"
git push
```

### Issue 2: Runtime Errors (Build Succeeds but App Crashes)

**Symptoms**: ✅ Deployed but endpoints return 500 errors

**Check**:
1. Vercel Dashboard → Runtime Logs
2. Look for errors

**Common Causes**:
- Missing environment variables in Vercel
- Database connection issues
- External API failures

**Solution**:
1. Verify all environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Check all required vars are set
   - Redeploy after adding vars

### Issue 3: Old Code Still Running

**Symptoms**: Changes not appearing on production

**Causes**:
- Vercel using cached build
- Wrong branch deployed
- Browser caching

**Solution**:
```bash
# Force redeploy
vercel --prod --force

# Or via dashboard: Deployments → ⋯ → Redeploy
```

### Issue 4: Environment Variables Not Working

**Symptoms**: `process.env.VAPI_API_KEY` is undefined

**Solution**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable:
   - Name: `VAPI_API_KEY`
   - Value: `your-key-here`
   - Environments: ✅ Production ✅ Preview ✅ Development
3. **Important**: Redeploy after adding variables!

---

## Vercel Environment Variables Setup

You need to add ALL your `.env.local` variables to Vercel:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# VAPI
VAPI_API_KEY="your-vapi-key"
VAPI_WEBHOOK_SECRET="your-webhook-secret"

# Twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# OpenAI
OPENAI_API_KEY="sk-..."

# Regrid
REGRID_API_KEY="..."

# Google Calendar
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."

# App Config
NEXT_PUBLIC_APP_URL="https://green-acre-ai.vercel.app"
```

### How to Add Variables

**Option A: Via Dashboard** (Easier)
1. https://vercel.com/dashboard → Your Project
2. Settings → Environment Variables
3. For each variable:
   - Click "Add New"
   - Name: `VAPI_API_KEY`
   - Value: Paste your key
   - Environments: Select all (Production, Preview, Development)
   - Save
4. Redeploy!

**Option B: Via CLI**
```bash
# Add one variable
vercel env add VAPI_API_KEY

# Pull variables from Vercel to local
vercel env pull .env.production.local
```

**Option C: Bulk Import**
1. Copy your `.env.local` content
2. Dashboard → Environment Variables → "Bulk Import"
3. Paste and import

---

## Manual Deployment (When Needed)

Sometimes you need to deploy without pushing to GitHub:

```bash
# Deploy to production
vercel --prod

# Deploy preview (doesn't affect production)
vercel

# Deploy with specific environment
vercel --prod --env VAPI_API_KEY=new-key
```

---

## Deployment Checklist

Before your first deployment after Phase 5/6:

- [ ] All environment variables added to Vercel
- [ ] Latest code pushed to GitHub
- [ ] Build passes locally: `npm run build`
- [ ] Database migrations applied
- [ ] Vercel deployment succeeds (check dashboard)
- [ ] Test VAPI endpoints are accessible
- [ ] Update VAPI assistant to use production URL
- [ ] Configure VAPI webhook URL
- [ ] Make test call

---

## Your Specific Next Steps

### 1. Verify Environment Variables in Vercel

```bash
# Check what's currently set
vercel env ls
```

Go through the list and ensure all required variables are present.

### 2. Trigger a Fresh Deployment

Your latest code should already be deployed, but let's verify:

```bash
# Check latest deployment
git log -1 --oneline

# If needed, trigger redeploy
vercel --prod --force
```

### 3. Update VAPI Assistant to Use Production URL

Run the update script:

```bash
npx tsx scripts/update-vapi-assistant-to-custom-llm.ts
```

This will:
- Update your VAPI assistant to use: `https://green-acre-ai.vercel.app/api/vapi-llm`
- Set metadata with your tenant_id

### 4. Configure VAPI Webhook

1. Go to https://dashboard.vapi.ai/settings
2. Click "Webhooks" tab
3. Add URL: `https://green-acre-ai.vercel.app/api/webhooks/vapi`
4. Select events:
   - ✅ `call-start`
   - ✅ `end-of-call-report`
5. Save

### 5. Test Your Deployment

```bash
# Test LLM endpoint (should return 405 Method Not Allowed)
curl -X GET https://green-acre-ai.vercel.app/api/vapi-llm

# Test webhook endpoint (should return 405 Method Not Allowed)
curl -X GET https://green-acre-ai.vercel.app/api/webhooks/vapi

# Both returning 405 means endpoints exist and Next.js is running
```

### 6. Make a Test Call

Call your VAPI phone number and verify:
- Conversation works (LLM endpoint)
- Call appears in database (webhook endpoint)
- Recording uploads to Supabase (webhook endpoint)
- SMS sent (webhook endpoint + Twilio)

---

## Viewing Logs in Production

### Real-time Logs

**Via CLI**:
```bash
# Stream production logs
vercel logs --follow

# Filter for errors only
vercel logs --follow | grep ERROR

# View logs for specific function
vercel logs api/vapi-llm --follow
```

**Via Dashboard**:
1. Project → Deployments → Latest
2. Click "Logs" tab
3. See real-time logs

### Debugging Production Issues

When something goes wrong:

1. **Check Runtime Logs**:
   ```bash
   vercel logs | grep -A 5 "error"
   ```

2. **Look for specific endpoints**:
   ```bash
   vercel logs | grep "vapi-llm"
   vercel logs | grep "webhooks/vapi"
   ```

3. **Check database queries**:
   - Prisma logs will appear in runtime logs
   - Look for `prisma:query` entries

4. **Common log patterns**:
   ```
   ERROR: fetch failed
   → Check if external API is down

   ERROR: Missing environment variable
   → Add to Vercel env vars

   ERROR: Database connection failed
   → Check DATABASE_URL in Vercel

   ERROR: 404 Not Found
   → Endpoint doesn't exist, check route
   ```

---

## Rollback to Previous Deployment

If something breaks:

1. **Via Dashboard**:
   - Deployments → Find last working deployment
   - Click ⋯ → "Promote to Production"

2. **Via CLI**:
   ```bash
   # List deployments
   vercel ls

   # Promote specific deployment
   vercel promote [deployment-url]
   ```

---

## Summary: Your Deployment is Already Set Up!

✅ **Current Status**:
- Vercel project created
- Auto-deploy on git push enabled
- Production URL: https://green-acre-ai.vercel.app

🔧 **What You Need to Do**:
1. Verify environment variables in Vercel dashboard
2. Run update script to configure VAPI assistant
3. Configure webhook URL in VAPI dashboard
4. Make a test call!

📖 **Resources**:
- Vercel Dashboard: https://vercel.com/dashboard
- VAPI Dashboard: https://dashboard.vapi.ai
- Your App: https://green-acre-ai.vercel.app
