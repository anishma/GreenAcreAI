# Quick Test Guide - Auth Disabled

## Authentication is NOW DISABLED ✅

You can now access and test all features without logging in!

---

## How to Test Right Now

### 1. Open Your Browser
The dev server is running at: **http://localhost:3000**

### 2. Test Onboarding Flow (Step by Step)

#### Step 1: Business Information
```
URL: http://localhost:3000/step-1-business

Test:
1. Should load without requiring login ✅
2. Email should be pre-filled: test@greenacreai.com
3. Fill in:
   - Business Name: "Green Acres Lawn Care"
   - Owner Name: "John Doe"
   - Add ZIP: 10001, 10002, 10003
4. Click "Continue to Pricing"
5. Should save and redirect to Step 2 ✅
```

#### Step 2: Pricing Configuration
```
URL: http://localhost:3000/step-2-pricing

Test:
1. Should show 4 default pricing tiers
2. Edit tier 1 weekly price to $30
3. Toggle "Allow generic quotes" ON/OFF
4. Click "Continue to Calendar"
5. Should save and redirect to Step 3 ✅
```

#### Step 3: Google Calendar
```
URL: http://localhost:3000/step-3-calendar

Test:
1. Should show calendar connection UI
2. NOTE: OAuth won't work (that's fine for now)
3. Just click "Continue to Phone Setup"
4. Should redirect to Step 4 ✅
```

#### Step 4: Phone Number
```
URL: http://localhost:3000/step-4-phone

Test:
1. Should show phone provisioning UI
2. NOTE: VAPI integration may not work yet
3. Just click "Continue to Test Call"
4. Should redirect to Step 5 ✅
```

#### Step 5: Test Call
```
URL: http://localhost:3000/step-5-test

Test:
1. Should show test call instructions
2. Click "Mark as Complete" (manual fallback)
3. Should update tenant and redirect to /dashboard ✅
```

### 3. Test Settings Pages

#### Settings Navigation
```
URL: http://localhost:3000/settings/business

Test:
1. Should show settings layout with 5 tabs
2. Click each tab - should navigate correctly:
   - Business (/settings/business)
   - Pricing (/settings/pricing)
   - Calendar (/settings/calendar)
   - Phone (/settings/phone)
   - Notifications (/settings/notifications)
```

#### Business Settings
```
URL: http://localhost:3000/settings/business

Test:
1. Should load test tenant data
2. Edit business name to "Green Acres Pro"
3. Add ZIP code: 10004
4. Change timezone to Pacific Time
5. Edit business hours:
   - Toggle Monday closed
   - Change Tuesday: 08:00 - 18:00
6. Click "Save Changes"
7. Should show success toast ✅
8. Reload page - changes should persist ✅
```

#### Pricing Settings
```
URL: http://localhost:3000/settings/pricing

Test:
1. Should load pricing tiers from database
2. Edit tier 1 weekly price to $35
3. Click "Add Tier"
4. Fill in new tier: 20000-25000, $70/$80/$250
5. Click "Save Changes"
6. Should show success toast ✅
```

#### Calendar Settings
```
URL: http://localhost:3000/settings/calendar

Test:
1. Should show connection status
2. Click buttons (they're placeholders - that's OK)
3. Should display integration help ✅
```

#### Phone Settings
```
URL: http://localhost:3000/settings/phone

Test:
1. Should display phone info (if provisioned)
2. Click "Test Call" - should show toast
3. "Change Number" should be disabled ✅
```

#### Notification Settings
```
URL: http://localhost:3000/settings/notifications

Test:
1. Should load preferences from database
2. Toggle "New lead captured" ON/OFF
3. Toggle "New booking made" ON/OFF
4. Click "Save Preferences"
5. Should show success toast ✅
6. Reload - preferences should persist ✅
```

### 4. Test Dashboard
```
URL: http://localhost:3000/dashboard

Test:
1. Should load without authentication
2. Should display user info (test@greenacreai.com)
3. Sidebar navigation should work
4. Click Settings → Should navigate ✅
```

---

## Verify in Browser DevTools

### 1. Check Network Tab (tRPC Calls)
Open DevTools → Network → Filter: "trpc"

Should see calls like:
- ✅ `tenant.getCurrent` - Returns test tenant
- ✅ `tenant.updateBusinessInfo` - Saves successfully
- ✅ `tenant.updatePricing` - Saves successfully

### 2. Check Console
Should NOT see auth errors ✅

If you see:
- ❌ "Not authenticated" → Environment variables not loaded, restart server
- ❌ "User not found" → Database issue, check Prisma connection

---

## Verify in Database

### Option 1: Prisma Studio
```bash
npx prisma studio
```

Open http://localhost:5555
- Click "Tenant" table
- Find tenant with email: test@greenacreai.com
- Should see all your changes ✅

### Option 2: SQL Client
```sql
-- View test tenant
SELECT
  id,
  email,
  "businessName",
  "ownerName",
  "onboardingCompleted",
  "serviceAreas",
  "pricingTiers",
  "notificationPreferences"
FROM tenants
WHERE email = 'test@greenacreai.com';
```

---

## What's Working Now

✅ **No Login Required** - All pages accessible
✅ **Mock User** - Automatically used (test@greenacreai.com)
✅ **Mock Tenant** - Auto-created on first request
✅ **tRPC Context** - All procedures have user + tenant
✅ **Data Persistence** - Saves to real database
✅ **Onboarding Flow** - Can test all 5 steps
✅ **Settings Pages** - All 5 settings pages work
✅ **Dashboard** - Loads without auth

---

## What's NOT Working (Expected)

⚠️ **Google OAuth** - Still blocked (this is why we disabled auth)
⚠️ **VAPI Integration** - Phone provisioning may not work yet
⚠️ **Real Calls** - Can't make test calls yet
⚠️ **Calendar Sync** - OAuth needed for this

These features will work once OAuth is fixed and VAPI is configured.

---

## Troubleshooting

### "Not authenticated" errors
**Solution:** Restart the dev server
```bash
# Kill server (Ctrl+C in terminal)
# Start again:
npm run dev
```

### Changes not saving
**Solution:** Check browser console and Network tab
- Look for tRPC errors
- Check if mutations return success

### Page shows loading forever
**Solution:**
1. Check server logs for errors
2. Verify database is running
3. Check Prisma connection

### Mock user not working
**Solution:**
1. Verify `.env.local` has both flags:
   ```
   DISABLE_AUTH=true
   NEXT_PUBLIC_DISABLE_AUTH=true
   ```
2. Restart dev server
3. Hard refresh browser (Cmd+Shift+R)

---

## Testing Checklist

Use this checklist to verify everything works:

### Onboarding Flow
- [ ] Step 1: Business info saves
- [ ] Step 1: ZIP codes add/remove
- [ ] Step 2: Pricing tiers edit
- [ ] Step 2: Generic quotes toggle
- [ ] Step 3: Calendar page loads
- [ ] Step 4: Phone page loads
- [ ] Step 5: Can mark complete
- [ ] Step 5: Redirects to dashboard

### Settings Pages
- [ ] Business: Loads data
- [ ] Business: Can edit and save
- [ ] Business: Business hours work
- [ ] Pricing: Loads tiers
- [ ] Pricing: Can add/edit/remove tiers
- [ ] Calendar: Shows status
- [ ] Phone: Shows info (if available)
- [ ] Notifications: Can toggle preferences
- [ ] All tabs navigate correctly

### Data Persistence
- [ ] Changes save to database
- [ ] Success toasts appear
- [ ] Reload persists changes
- [ ] Can view in Prisma Studio

---

## Ready to Test!

1. **Server is running** at http://localhost:3000
2. **Auth is disabled** - no login needed
3. **Mock tenant created** - data will save
4. **All pages accessible** - test everything

Start with:
```
http://localhost:3000/step-1-business
```

or jump to settings:
```
http://localhost:3000/settings/business
```

---

## When You're Done Testing

To re-enable authentication later:

1. Edit `.env.local`:
   ```bash
   DISABLE_AUTH=false
   NEXT_PUBLIC_DISABLE_AUTH=false
   ```

2. Restart server:
   ```bash
   npm run dev
   ```

3. Uncomment route protection in `src/lib/supabase/middleware.ts`

See `AUTH_BYPASS_README.md` for full details.
