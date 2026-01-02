# Vercel Project Setup Guide

## Task 0.3.2: Vercel Deployment Configuration

Vercel will host our Next.js application with automatic deployments from GitHub.

---

## Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with your GitHub account (recommended for easier integration)
3. Authorize Vercel to access your GitHub repositories

---

## Step 2: Import GitHub Repository

1. From Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select: `anishma/GreenAcreAI`
4. Click **"Import"**

---

## Step 3: Configure Project Settings

### Framework Detection
- Vercel should auto-detect **Next.js**
- If not, manually select: **Framework Preset: Next.js**

### Root Directory
- Leave as default (root of repository)

### Build Settings
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Environment Variables
**Important**: We'll add environment variables after deployment. For now, deploy without them.

Click **"Deploy"**

---

## Step 4: Wait for Initial Deployment

- First deployment will take 2-3 minutes
- It will likely **fail** because we haven't added environment variables yet
- This is expected and normal!

---

## Step 5: Configure Environment Variables

1. Go to your project dashboard
2. Click **Settings** → **Environment Variables**
3. Add the following variables for **Production, Preview, and Development**:

### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://dausexigvmmppiijbzyb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_SECRET_KEY=<your-secret-key>
DATABASE_URL=<your-database-url>
```

### Next.js Variables
```
NEXT_PUBLIC_APP_URL=<your-vercel-url>  (e.g., https://greenacreai.vercel.app)
```

### OpenAI Variables (add after Task 0.3.5)
```
OPENAI_API_KEY=<your-openai-key>
```

### VAPI Variables (add after Task 0.3.3)
```
VAPI_API_KEY=<your-vapi-key>
VAPI_WEBHOOK_SECRET=<your-webhook-secret>
```

### Google Cloud Variables (add after Task 0.3.7)
```
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=<your-vercel-url>/api/auth/callback/google
```

### Regrid Variables (add after Task 0.3.6)
```
REGRID_API_KEY=<your-regrid-key>
```

### Application Secrets
```
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
JWT_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>
```

**Tip**: Generate secrets locally with:
```bash
openssl rand -base64 32
```

---

## Step 6: Get Vercel Project IDs

1. Go to **Settings** → **General**
2. Scroll down and copy:
   - **Project ID** (e.g., `prj_xxxxx`)
   - **Team/Organization ID** (click on your profile → Settings → General)

3. Update `.env.local`:
```bash
VERCEL_PROJECT_ID=prj_xxxxx
VERCEL_ORG_ID=team_xxxxx or your-username
```

---

## Step 7: Generate Vercel Deploy Token (for GitHub Actions)

1. Go to your account: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `GreenAcreAI CI/CD`
4. Scope: **Full Account**
5. Expiration: **No Expiration** (or 1 year)
6. Click **"Create"**
7. Copy the token (you won't see it again!)

8. Add to **GitHub Secrets**:
   - Go to: https://github.com/anishma/GreenAcreAI/settings/secrets/actions
   - Click **"New repository secret"**
   - Name: `VERCEL_TOKEN`
   - Value: `<your-vercel-token>`
   - Click **"Add secret"**

9. Add Vercel Project ID to GitHub Secrets:
   - Name: `VERCEL_PROJECT_ID`
   - Value: `<your-project-id>`

10. Add Vercel Org ID to GitHub Secrets:
    - Name: `VERCEL_ORG_ID`
    - Value: `<your-org-id>`

---

## Step 8: Configure Preview Deployments

1. Go to **Settings** → **Git**
2. Enable:
   - ✅ **Production Branch**: `main`
   - ✅ **Preview Deployments**: All branches
   - ✅ **Auto-deploy on push**: Enabled
   - ✅ **Comments on Pull Requests**: Enabled

---

## Step 9: Update Environment Variables in .env.local

Update your local `.env.local` file with Vercel information:

```bash
VERCEL_PROJECT_ID=prj_xxxxx
VERCEL_ORG_ID=team_xxxxx
VERCEL_TOKEN=xxxxx (only needed for local deployments)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

---

## Step 10: Trigger Redeploy

1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**
4. Once env vars are added, deployment should succeed!

---

## Checklist

- [ ] Created Vercel account
- [ ] Imported GitHub repository (anishma/GreenAcreAI)
- [ ] Confirmed Next.js framework preset
- [ ] Deployed project (initial deployment - may fail)
- [ ] Added Supabase environment variables to Vercel
- [ ] Added Next.js environment variables to Vercel
- [ ] Generated application secrets (NEXTAUTH_SECRET, JWT_SECRET, ENCRYPTION_KEY)
- [ ] Copied Vercel Project ID to `.env.local`
- [ ] Copied Vercel Org ID to `.env.local`
- [ ] Created Vercel deploy token
- [ ] Added VERCEL_TOKEN to GitHub Secrets
- [ ] Added VERCEL_PROJECT_ID to GitHub Secrets
- [ ] Added VERCEL_ORG_ID to GitHub Secrets
- [ ] Enabled preview deployments for all branches
- [ ] Triggered successful redeploy with env vars

---

## What's Next?

After completing this checklist:
1. Your app should be live at `https://your-project.vercel.app`
2. Any push to `main` will trigger production deployment
3. Any push to other branches will create preview deployments
4. GitHub Actions will also deploy via our workflow files

Let me know when completed, and I'll mark Task 0.3.2 as done!
