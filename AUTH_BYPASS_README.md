# Authentication Bypass for Testing

## Overview

Authentication has been **temporarily disabled** to allow testing of all features while Google OAuth is being fixed. This allows you to test Phase 3 (Onboarding & Settings) and future phases without needing to log in.

## What's Been Changed

### 1. Environment Variables Added
Added to `.env.local`:
```bash
DISABLE_AUTH=true                    # Server-side auth bypass
NEXT_PUBLIC_DISABLE_AUTH=true        # Client-side auth bypass
```

### 2. Mock User Created
A mock user is automatically used when auth is disabled:
- **Email:** test@greenacreai.com
- **User ID:** 00000000-0000-0000-0000-000000000001
- **Tenant:** Auto-created during onboarding flow

### 3. Modified Files

#### `src/lib/trpc/context.ts`
- Checks `DISABLE_AUTH` environment variable
- Creates/finds test tenant automatically
- Provides mock user to all tRPC procedures

#### `src/lib/hooks/use-user.ts`
- Checks `NEXT_PUBLIC_DISABLE_AUTH` environment variable
- Returns mock user instead of checking Supabase auth
- Skips auth state subscriptions

#### `src/lib/supabase/middleware.ts`
- Route protection already commented out (was done earlier)
- All routes accessible without authentication

## How to Use

### Current State (Auth Disabled)
1. Just navigate to any page:
   ```
   http://localhost:3000/step-1-business
   http://localhost:3000/settings/business
   http://localhost:3000/dashboard
   ```

2. All pages will work with the mock user
3. All tRPC calls will have user + tenant context
4. Data will be saved to the test tenant in the database

### To Re-enable Authentication (When OAuth is Fixed)

1. **Remove or set to false** in `.env.local`:
   ```bash
   DISABLE_AUTH=false
   NEXT_PUBLIC_DISABLE_AUTH=false
   ```

2. **Restart the dev server:**
   ```bash
   # Kill current server
   # Restart with:
   npm run dev
   ```

3. **Uncomment route protection** in `src/lib/supabase/middleware.ts`:
   - Find the commented-out sections
   - Uncomment the route protection logic
   - This will redirect unauthenticated users to login

4. **Test OAuth flow:**
   - Navigate to `/login`
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should redirect to dashboard

## Testing Now

You can now test everything without authentication:

### Test Onboarding Flow
```
1. Go to http://localhost:3000/step-1-business
2. Fill out business information
3. Continue through all 5 steps
4. Data saves to test tenant
```

### Test Settings Pages
```
1. Go to http://localhost:3000/settings/business
2. Edit business info
3. Navigate to pricing, calendar, phone, notifications
4. All changes save to test tenant
```

### Test Dashboard
```
1. Go to http://localhost:3000/dashboard
2. View stats and account info
3. Use sidebar navigation
```

## Database

The mock tenant is stored in the database:
```sql
-- View test tenant
SELECT * FROM tenants WHERE email = 'test@greenacreai.com';

-- View test user
SELECT * FROM users WHERE auth_user_id = '00000000-0000-0000-0000-000000000001';
```

## Important Notes

1. **Single Test Tenant:** All requests use the same test tenant
   - Email: test@greenacreai.com
   - Auto-created during onboarding when you first submit business info
   - Data persists across server restarts

2. **Real Database:** Changes are saved to the real database
   - Not using mock data
   - Can be viewed in Prisma Studio or SQL client

3. **tRPC Context:** All procedures have full context
   - `ctx.user` = mock user
   - `ctx.tenantId` = test tenant ID
   - `ctx.prisma` = real Prisma client

4. **Production Safety:** This is disabled in production
   - Environment variables not set in Vercel
   - Auth will work normally in production

## Cleanup Test Data

To reset and start fresh:

### Option 1: Delete Test Tenant (Recommended)
```sql
-- This will cascade delete related records
DELETE FROM tenants WHERE email = 'test@greenacreai.com';
```

### Option 2: Delete All Related Data
```sql
-- Delete in correct order to avoid foreign key errors
DELETE FROM "Call" WHERE "tenantId" IN (
  SELECT id FROM tenants WHERE email = 'test@greenacreai.com'
);
DELETE FROM "Lead" WHERE "tenantId" IN (
  SELECT id FROM tenants WHERE email = 'test@greenacreai.com'
);
DELETE FROM "Booking" WHERE "tenantId" IN (
  SELECT id FROM tenants WHERE email = 'test@greenacreai.com'
);
DELETE FROM users WHERE "tenantId" IN (
  SELECT id FROM tenants WHERE email = 'test@greenacreai.com'
);
DELETE FROM tenants WHERE email = 'test@greenacreai.com';
```

### Option 3: Reset Specific Fields
```sql
-- Reset onboarding progress
UPDATE tenants
SET
  "onboardingCompleted" = false,
  "testCallCompleted" = false,
  "phoneNumber" = NULL,
  "vapiAgentId" = NULL
WHERE email = 'test@greenacreai.com';
```

## Troubleshooting

### Changes Not Appearing
1. Restart the dev server (environment variables changed)
2. Clear browser cache
3. Check `.env.local` has both flags set to `true`

### Still Getting Auth Errors
1. Check server logs for errors
2. Verify environment variables loaded: `echo $DISABLE_AUTH`
3. Check database - test tenant should exist
4. Look at Network tab - tRPC calls should have context

### Mock User Not Working
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_DISABLE_AUTH=true` in `.env.local`
3. Restart dev server
4. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

## Next Steps

Once Google OAuth is working:
1. Set both flags to `false`
2. Uncomment middleware route protection
3. Test complete auth flow
4. Delete test tenant data
5. Deploy to production with OAuth enabled
