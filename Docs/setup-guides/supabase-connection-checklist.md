# Supabase Connection Debugging Checklist

## Issue
```
PrismaClientInitializationError: Can't reach database server at `db.dausexigvmmppiijbzyb.supabase.co:5432`
```

## Checklist

### 1. Check Supabase Project Status

**Supabase Dashboard: https://supabase.com/dashboard**

- [ ] **Is the project paused?**
  - Free tier projects auto-pause after 7 days of inactivity
  - Go to: Dashboard → Your Project → Settings → General
  - Look for "Project Status" - should be "Active" (green), not "Paused" (yellow/orange)
  - If paused, click "Resume Project" (takes ~1-2 minutes)

- [ ] **Check database health**
  - Go to: Dashboard → Your Project → Database → Database Health
  - Verify "Database Status" shows "Healthy"
  - Check connection pool usage

### 2. Verify Vercel Environment Variables

**Vercel Dashboard: https://vercel.com → Your Project → Settings → Environment Variables**

Required variables for Production:

- [ ] **DATABASE_URL** (Supabase Connection Pooler)
  ```
  Format: postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
  ```
  - Get from: Supabase Dashboard → Settings → Database → Connection string → URI (Connection Pooling)
  - Mode: **Transaction** (important for Prisma)
  - **Environment:** Production (and Preview if needed)

- [ ] **DIRECT_URL** (Direct Supabase Connection)
  ```
  Format: postgresql://postgres.PROJECT_REF:[PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres
  ```
  - Get from: Supabase Dashboard → Settings → Database → Connection string → URI (Session Mode)
  - Used for Prisma migrations
  - **Environment:** Production (and Preview if needed)

### 3. Test Connection String Format

**Correct Format Check:**

```bash
# DATABASE_URL should contain:
✓ pooler.supabase.com
✓ port 6543
✓ ?pgbouncer=true

# DIRECT_URL should contain:
✓ db.PROJECT_REF.supabase.co
✓ port 5432
✓ No pgbouncer parameter
```

### 4. Verify Password Encoding

- [ ] **Check for special characters in password**
  - Passwords with special chars (`@`, `#`, `%`, etc.) must be URL-encoded
  - Example: `p@ssw0rd!` → `p%40ssw0rd%21`
  - Get encoded password from Supabase dashboard (it's already encoded in the connection strings)

### 5. Check Network Restrictions (Supabase)

**Supabase Dashboard → Settings → Database → Connection Security**

- [ ] **Verify IP restrictions**
  - If you have IP restrictions enabled, add Vercel's IP ranges
  - Vercel uses dynamic IPs, so it's better to:
    - Option A: Allow all IPs (0.0.0.0/0) for production
    - Option B: Use Vercel's static IP ranges (Enterprise only)

### 6. Test Connection from Vercel

**Option A: Add a test endpoint**

Create a simple endpoint to test database connectivity:

```typescript
// src/app/api/test-db/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'Connected', timestamp: new Date() })
  } catch (error) {
    console.error('DB Connection Error:', error)
    return NextResponse.json(
      {
        status: 'Failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
```

Then visit: `https://your-app.vercel.app/api/test-db`

**Option B: Check Vercel Logs**

- Go to: Vercel Dashboard → Your Deployment → Functions → Click on a function → Logs
- Look for Prisma initialization errors

### 7. Redeploy After Env Var Changes

- [ ] **Environment variables require redeployment**
  - After adding/updating env vars in Vercel
  - Go to: Deployments → Latest → ⋮ (three dots) → Redeploy
  - OR: Push a new commit to trigger automatic deployment

### 8. Check Supabase Connection Limits

**Supabase Dashboard → Settings → Database → Connection Limits**

- [ ] **Free Tier Limits:**
  - Max direct connections: 60
  - Connection pooler recommended for serverless
  - Verify you're using `DATABASE_URL` (pooler) in production, not `DIRECT_URL`

### 9. Verify Prisma Schema Configuration

**Check `prisma/schema.prisma`:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooler (for queries)
  directUrl = env("DIRECT_URL")        // Direct (for migrations)
}
```

- [ ] Both `url` and `directUrl` should be present
- [ ] Verify `provider` is `"postgresql"`

### 10. Check Build Logs for Prisma Generation

**Vercel Build Logs:**

- [ ] Verify `prisma generate` ran successfully
  - Look for: `✓ Generated Prisma Client`
  - If missing, check `package.json` has postinstall script:
    ```json
    "scripts": {
      "postinstall": "prisma generate"
    }
    ```

## Quick Fix Steps

### If Project is Paused:
1. Go to Supabase Dashboard
2. Click "Resume Project"
3. Wait 1-2 minutes
4. Redeploy on Vercel

### If Env Vars are Missing/Wrong:
1. Copy connection strings from Supabase Dashboard → Settings → Database
2. Update Vercel env vars (Production environment)
3. Redeploy

### If Connection Pool Exhausted:
1. Verify using `DATABASE_URL` (pooler), not `DIRECT_URL`
2. Add `connection_limit=1` to `DATABASE_URL`
3. Redeploy

## Common Mistakes

❌ **Using DIRECT_URL in production** → Use DATABASE_URL (pooler)
❌ **Missing `?pgbouncer=true`** → Add to DATABASE_URL
❌ **Env vars in wrong environment** → Set for "Production" not just "Development"
❌ **Forgot to redeploy after env var change** → Always redeploy
❌ **Special chars not URL-encoded** → Use encoded password from Supabase
❌ **Project paused** → Resume in Supabase dashboard

## Next Steps After Fixing

1. Test with `/api/test-db` endpoint
2. Monitor Vercel function logs for Prisma errors
3. Check Supabase Dashboard → Database → Connection Pooler stats
4. If still failing, check Vercel deployment logs for Prisma Client generation errors
