# Vercel Database Configuration Guide

## Problem Identified
```
directUrl: "Missing"
Error: Can't reach database server at port 5432
```

**Root Cause:** Vercel serverless functions require connection pooling (port 6543), but the app was trying to use direct connection (port 5432) for queries.

## ✅ Step 1: Fix Prisma Schema (COMPLETED)

The `prisma/schema.prisma` has been updated to:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Connection Pooler (Port 6543)
  directUrl = env("DIRECT_URL")        // Direct Connection (Port 5432)
}
```

## Step 2: Get Connection Strings from Supabase

### Quick Access Method (Recommended)

1. Go to: **https://supabase.com/dashboard**
2. Select your project: **GreenAcre AI**
3. Click the **"Connect"** button at the top of your project dashboard (usually in the top-right area)

This opens a dialog with all connection string options in one place.

### Alternative Method

If you prefer to navigate manually:
1. Click: **Settings** (gear icon in sidebar)
2. Click: **Database**
3. Scroll down to: **Connection string** section

### Copy Both Connection Strings

You'll see a dropdown with different connection modes. You need **TWO** different strings:

---

### 🔹 DATABASE_URL (Transaction Mode - Port 6543)

**In Supabase Connect Dialog:**
1. Click the **"Connect"** button at top of your project dashboard
2. Select mode: **Transaction** (recommended for serverless)
3. Copy the URI connection string

**Alternative path:** Settings → Database → Connection string → Select "Transaction"

**Format:**
```
postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Key characteristics:**
- ✅ Contains: `pooler.supabase.com`
- ✅ Port: `6543` (Transaction mode)
- ✅ Uses Supavisor connection pooler
- ❌ Note: Transaction mode does NOT support prepared statements

**Why:** Vercel serverless functions are "transient" (short-lived). The transaction mode pooler efficiently manages connections from auto-scaling systems by sharing database connections between clients.

**CRITICAL - Prepared Statements Fix:**

To prevent "prepared statement 's0' already exists" errors, you MUST add these parameters to your DATABASE_URL:

```
?pgbouncer=true&connection_limit=1
```

**Complete DATABASE_URL format for Vercel:**
```
postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**What these parameters do:**
- `pgbouncer=true` - Tells Prisma to disable prepared statements (required for pgBouncer/Supavisor)
- `connection_limit=1` - Limits connections per Prisma Client instance (required for serverless)

---

### 🔹 DIRECT_URL (Session Mode - Port 5432)

**In Supabase Connect Dialog:**
1. Click the **"Connect"** button at top of your project dashboard
2. Select mode: **Session** (for migrations)
3. Copy the URI connection string

**Alternative path:** Settings → Database → Connection string → Select "Session"

**Format:**
```
postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**Alternative (Direct, no pooler):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Key characteristics:**
- ✅ Port: `5432` (Session mode)
- ✅ Can use either pooled Session mode OR direct connection
- ✅ Supports prepared statements (required for migrations)
- ⚠️ Direct connection uses IPv6 by default

**Why:** Prisma needs a connection that supports prepared statements for migrations and schema introspection. This URL is primarily used during build time for migrations, not for runtime queries.

**Note:** You can use either the pooled Session mode (port 5432 via pooler) or the direct connection (db.PROJECT-REF.supabase.co). Both support prepared statements.

---

## Step 3: Add Environment Variables to Vercel

### Navigate to Vercel Dashboard

1. Go to: **https://vercel.com**
2. Select your project: **GreenAcre AI**
3. Click: **Settings** tab
4. Click: **Environment Variables** in sidebar

### Add DATABASE_URL

1. Click: **Add New** button
2. **Key:** `DATABASE_URL`
3. **Value:** Paste the **Transaction Mode** connection string from Supabase (port 6543)
   ```
   postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click: **Save**

**Note:** Copy the URL exactly as shown in Supabase dashboard - no need to add extra parameters.

### Add DIRECT_URL

1. Click: **Add New** button
2. **Key:** `DIRECT_URL`
3. **Value:** Paste the **Session Mode** connection string from Supabase (port 5432)
   ```
   postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
4. **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click: **Save**

**Note:** Copy the URL exactly as shown in Supabase dashboard - both Transaction and Session modes use the pooler by default.

---

## ⚠️ Step 4: Redeploy (CRITICAL!)

**Important:** Environment variables are NOT applied to existing deployments automatically.

### Option A: Manual Redeploy (Recommended)

1. Go to: **Deployments** tab in Vercel
2. Find your latest deployment
3. Click: **⋮** (three dots menu)
4. Click: **Redeploy**
5. Confirm: **Redeploy**

This will rebuild with the new environment variables.

### Option B: Git Push (Alternative)

Make a small commit (like updating a comment) and push to trigger redeployment:

```bash
git commit --allow-empty -m "Trigger redeploy with new env vars"
git push
```

---

## Step 5: Verify Connection

After redeployment completes (~2-3 minutes):

### Test Database Endpoint

Visit: **https://greenacreai.vercel.app/api/test-db**

**Expected Success Response:**
```json
{
  "status": "Connected ✅",
  "timestamp": "2026-01-11T...",
  "diagnostics": {
    "queryTest": [{"test": 1}],
    "queryTime": "XXXms",
    "tenantCount": 1,
    "databaseUrl": "Set",      // ✅ Should be "Set"
    "directUrl": "Set",        // ✅ Should be "Set" (not "Missing")
    "nodeEnv": "production"
  }
}
```

**If Still Failing:**
```json
{
  "status": "Failed ❌",
  "error": {
    "message": "Error message here"
  }
}
```

Check:
1. Verify both env vars are saved in Vercel Settings → Environment Variables
2. Verify you clicked "Redeploy" after adding env vars
3. Check Supabase project is not paused (Dashboard → General Settings)
4. Verify passwords are correct (no typos)

---

## Common Issues & Solutions

### Issue: "prepared statement 's0' already exists"
**Root Cause:** pgBouncer/Supavisor connection pooler in Transaction mode doesn't support prepared statements, but Prisma tries to use them by default.

**Solution:**
1. Add `?pgbouncer=true&connection_limit=1` to your `DATABASE_URL` in Vercel
2. Full format:
   ```
   postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
3. Redeploy to Vercel
4. The code has been updated in `src/lib/prisma.ts` to handle serverless connections properly

**Technical Details:**
- `pgbouncer=true` disables Prisma's prepared statements
- `connection_limit=1` prevents connection pool exhaustion in serverless
- The updated `prisma.ts` includes query timeouts and proper cleanup

### Issue: "directUrl: Missing"
**Solution:** Add `DIRECT_URL` to Vercel env vars and redeploy

### Issue: "Can't reach database server at :6543"
**Solution:** Check if Supabase project is paused (free tier auto-pauses after 7 days)

### Issue: "remaining connection slots reserved"
**Solution:** You're using direct connection instead of pooler. Switch to Transaction mode (port 6543) which uses Supavisor pooling.

### Issue: "Password authentication failed"
**Solution:**
- Get fresh connection strings from Supabase (passwords are pre-encoded)
- Don't manually edit the password
- Copy the entire string as-is

### Issue: Changes not applying
**Solution:** Must redeploy after changing env vars

---

## Quick Reference

| Variable | Port | Contains | Used For |
|----------|------|----------|----------|
| `DATABASE_URL` | 6543 | `pooler.supabase.com` (Transaction mode) | All queries (runtime) |
| `DIRECT_URL` | 5432 | `pooler.supabase.com` (Session mode) | Migrations (build time) |

**Note:** Modern Supabase projects use Supavisor pooler for both modes. The key difference is the port:
- Port 6543 = Transaction mode (no prepared statements, ideal for serverless)
- Port 5432 = Session mode (supports prepared statements, needed for migrations)

---

## Verification Checklist

After setup, verify:

- [ ] `prisma/schema.prisma` has `directUrl = env("DIRECT_URL")`
- [ ] Vercel has both `DATABASE_URL` and `DIRECT_URL` set
- [ ] Both env vars are enabled for "Production" environment
- [ ] You redeployed after adding env vars
- [ ] `/api/test-db` shows `"directUrl": "Set"`
- [ ] Supabase project status is "Active" (not paused)

---

## Need Help?

If connection still fails after following all steps:

1. Check Vercel deployment logs for Prisma errors
2. Verify Supabase project health in Dashboard
3. Test connection strings locally first
4. Check `supabase-connection-checklist.md` for detailed debugging
