# Phase 3 Testing Guide
## Tenant Onboarding & Management

This guide walks through testing all features in Phase 3, including the onboarding flow and settings pages.

---

## Prerequisites

1. **Database Setup**
   - Ensure PostgreSQL is running
   - Database migrations applied: `npx prisma db push`
   - Supabase project configured

2. **Environment Variables**
   - All required env vars in `.env.local`
   - VAPI API key configured
   - Google OAuth credentials set up

3. **Dev Server Running**
   ```bash
   npm run dev
   ```
   - Server should be running at `http://localhost:3000`

---

## Testing Flow

### Part 1: User Authentication

#### Test 1.1: Sign Up Flow
1. Navigate to `http://localhost:3000`
2. Click "Sign Up" or go to `/signup`
3. **Test with Google OAuth:**
   - Click "Sign up with Google"
   - Should redirect to Google consent screen
   - After authorization, should create user in Supabase Auth
   - Should create user record in database (via webhook or callback)
   - Should redirect to onboarding Step 1

**Expected Results:**
- ✅ User created in Supabase Auth
- ✅ User record in database with `authUserId`
- ✅ Tenant record created (linked to user)
- ✅ Redirected to `/step-1-business`

**Check Database:**
```sql
-- Check if user was created
SELECT * FROM users WHERE "authUserId" = '<supabase-user-id>';

-- Check if tenant was created
SELECT * FROM tenants WHERE id = '<tenant-id>';
```

#### Test 1.2: Login Flow
1. Sign out if logged in
2. Navigate to `/login`
3. Click "Sign in with Google"
4. Should redirect to dashboard or onboarding (depending on completion status)

**Expected Results:**
- ✅ Authenticated session created
- ✅ Redirected correctly based on onboarding status

---

### Part 2: Onboarding Flow

#### Test 2.1: Step 1 - Business Information

1. **Navigate to Step 1:**
   - After signup, should auto-redirect to `/step-1-business`
   - Or manually navigate: `http://localhost:3000/step-1-business`

2. **Fill out the form:**
   - **Business Name:** "Green Acres Lawn Care" (required)
   - **Owner Name:** "John Doe" (required)
   - **Email:** Should be pre-filled from auth (required)
   - **Phone:** "+15551234567" (optional)
   - **Service Areas:** Add multiple ZIP codes
     - Enter: "10001" → Click "Add"
     - Enter: "10002" → Click "Add"
     - Enter: "10003" → Click "Add"

3. **Test Validations:**
   - Try submitting with empty business name → Should show error
   - Try adding invalid ZIP (e.g., "123") → Should show error
   - Try adding duplicate ZIP → Should show error
   - Remove a ZIP code → Should work

4. **Submit:**
   - Click "Continue to Pricing"
   - Should save data and redirect to `/step-2-pricing`

**Expected Results:**
- ✅ Form validates correctly
- ✅ ZIP codes can be added/removed
- ✅ Data saved to database
- ✅ Redirected to Step 2

**Check Database:**
```sql
SELECT
  "businessName",
  "ownerName",
  email,
  phone,
  "serviceAreas"
FROM tenants
WHERE id = '<tenant-id>';
```

**Check tRPC Network Tab:**
- Look for `tenant.updateBusinessInfo` mutation
- Look for `tenant.updateServiceAreas` mutation
- Look for `tenant.completeOnboardingStep` mutation

---

#### Test 2.2: Step 2 - Pricing Configuration

1. **Navigate to Step 2:**
   - Should auto-redirect from Step 1
   - Or manually: `http://localhost:3000/step-2-pricing`

2. **Review Default Pricing Tiers:**
   - Should show 4 default tiers
   - Each tier has: min sqft, max sqft, weekly, biweekly, monthly prices

3. **Edit a Tier:**
   - Change tier 1 weekly price to $30
   - Change tier 2 biweekly price to $50

4. **Add a New Tier:**
   - Click "Add Tier"
   - Fill in: min 20000, max 25000, weekly $70, biweekly $80, monthly $250
   - Should add successfully

5. **Remove a Tier:**
   - Click trash icon on tier 3
   - Should remove (must keep at least 1 tier)

6. **Test Generic Quotes:**
   - Toggle "Allow generic quotes" ON
   - Edit disclaimer text: "Custom pricing disclaimer message"
   - Toggle OFF → Disclaimer should hide

7. **Submit:**
   - Click "Continue to Calendar"
   - Should save and redirect to `/step-3-calendar`

**Expected Results:**
- ✅ Can add/edit/remove tiers
- ✅ Generic quote toggle works
- ✅ Data saved to database
- ✅ Redirected to Step 3

**Check Database:**
```sql
SELECT
  "pricingTiers",
  "allowsGenericQuotes",
  "genericQuoteDisclaimer"
FROM tenants
WHERE id = '<tenant-id>';
```

---

#### Test 2.3: Step 3 - Google Calendar Integration

1. **Navigate to Step 3:**
   - Should auto-redirect from Step 2
   - Or manually: `http://localhost:3000/step-3-calendar`

2. **Connect Calendar:**
   - Click "Connect Google Calendar"
   - Should redirect to Google OAuth consent screen
   - Select Google account
   - Grant calendar permissions
   - Should redirect back with success message

3. **Verify Connection:**
   - Should show "Connected" status
   - Should display calendar ID
   - Should show connected email

4. **Test Disconnect (optional):**
   - Click "Disconnect"
   - Should clear calendar tokens
   - Status changes to "Not Connected"

5. **Submit:**
   - Click "Continue to Phone Setup"
   - Should redirect to `/step-4-phone`

**Expected Results:**
- ✅ OAuth flow works
- ✅ Calendar tokens saved (encrypted)
- ✅ Connection status displays correctly
- ✅ Redirected to Step 4

**Check Database:**
```sql
SELECT
  "calendarId",
  "googleCalendarRefreshToken",
  "googleCalendarAccessToken",
  "googleCalendarTokenExpiresAt"
FROM tenants
WHERE id = '<tenant-id>';
```

**Note:** Refresh token should be encrypted, access token may be visible.

---

#### Test 2.4: Step 4 - Phone Number Setup

1. **Navigate to Step 4:**
   - Should auto-redirect from Step 3
   - Or manually: `http://localhost:3000/step-4-phone`

2. **Provision Phone Number:**
   - (Optional) Enter area code preference: "212"
   - Click "Provision Number"
   - Should call VAPI API to:
     - Create phone number
     - Create VAPI agent
     - Link phone to agent
   - Should show provisioned number

3. **Verify:**
   - Phone number displayed (e.g., +1-555-123-4567)
   - Agent ID shown
   - Phone number ID shown

4. **Submit:**
   - Click "Continue to Test Call"
   - Should redirect to `/step-5-test`

**Expected Results:**
- ✅ Phone number provisioned via VAPI
- ✅ VAPI agent created
- ✅ Data saved to database
- ✅ Redirected to Step 5

**Check Database:**
```sql
SELECT
  "phoneNumber",
  "phoneNumberSid",
  "vapiAgentId",
  "vapiPhoneNumberId"
FROM tenants
WHERE id = '<tenant-id>';
```

**Check VAPI Dashboard:**
- Log in to VAPI dashboard
- Verify phone number exists
- Verify agent exists and is linked

---

#### Test 2.5: Step 5 - Test Call & Go Live

1. **Navigate to Step 5:**
   - Should auto-redirect from Step 4
   - Or manually: `http://localhost:3000/step-5-test`

2. **View Instructions:**
   - Should display provisioned phone number
   - Should show "Call this number to test"

3. **Make Test Call:**
   - Using your phone, call the provisioned number
   - Should connect to VAPI AI assistant
   - Have a brief conversation
   - Page should detect the call (via real-time subscription)

4. **Real-time Call Detection:**
   - Page subscribes to `calls` table
   - When call is created, should show success message
   - Should show "Test call completed" status

5. **Complete Onboarding:**
   - Either wait for call detection OR
   - Click "Mark as Complete" (manual fallback)
   - Should update tenant record
   - Should redirect to `/dashboard`

**Expected Results:**
- ✅ Can make test call to number
- ✅ Real-time detection works (if call made)
- ✅ Manual completion works
- ✅ Onboarding marked complete
- ✅ Redirected to dashboard

**Check Database:**
```sql
SELECT
  "testCallCompleted",
  "testCallCompletedAt",
  "onboardingCompleted"
FROM tenants
WHERE id = '<tenant-id>';

-- Check if call was logged
SELECT * FROM calls
WHERE "tenantId" = '<tenant-id>'
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

### Part 3: Settings Pages

After completing onboarding, test all settings pages:

#### Test 3.1: Settings Navigation

1. **Navigate to Settings:**
   - From dashboard, click "Settings" in sidebar
   - Or go to: `http://localhost:3000/settings/business`

2. **Verify Tab Navigation:**
   - Should see 5 tabs: Business, Pricing, Calendar, Phone, Notifications
   - Click each tab → Should navigate correctly
   - Active tab should be highlighted

**Expected Results:**
- ✅ All tabs visible
- ✅ Navigation works
- ✅ Active state displays correctly

---

#### Test 3.2: Business Settings

1. **Navigate to Business Settings:**
   - Click "Business" tab
   - Or go to: `http://localhost:3000/settings/business`

2. **Verify Pre-filled Data:**
   - Business name, owner, email, phone should load from database
   - Service areas should be displayed as badges
   - Timezone should be selected
   - Business hours should load (or show defaults)

3. **Edit Business Info:**
   - Change business name to "Green Acres Pro Lawn Care"
   - Update phone to "+15559876543"
   - Add new ZIP code: "10004"
   - Remove one existing ZIP

4. **Edit Business Hours:**
   - Toggle Monday to "Closed"
   - Change Tuesday open time to 08:00
   - Change Wednesday close time to 18:00
   - Toggle Saturday to "Open", set 09:00 - 13:00

5. **Change Timezone:**
   - Select "Pacific Time (PT)"

6. **Submit:**
   - Click "Save Changes"
   - Should show success toast
   - Reload page → Changes should persist

**Expected Results:**
- ✅ Data loads correctly
- ✅ Can edit all fields
- ✅ Business hours editor works
- ✅ Changes saved to database
- ✅ Success toast displayed

**Check Database:**
```sql
SELECT
  "businessName",
  phone,
  timezone,
  "serviceAreas",
  "businessHours"
FROM tenants
WHERE id = '<tenant-id>';
```

---

#### Test 3.3: Pricing Settings

1. **Navigate to Pricing Settings:**
   - Click "Pricing" tab
   - Or go to: `http://localhost:3000/settings/pricing`

2. **Verify Pre-filled Data:**
   - Pricing tiers should load from database
   - Generic quotes toggle should reflect saved state

3. **Edit Tiers:**
   - Modify tier 1 weekly price to $35
   - Add a new tier: 25000-30000, $75/$85/$300
   - Remove tier 4

4. **Edit Generic Quotes:**
   - Toggle ON
   - Change disclaimer text
   - Toggle OFF

5. **Submit:**
   - Click "Save Changes"
   - Should show success toast
   - Reload → Changes should persist

**Expected Results:**
- ✅ Pricing tiers load correctly
- ✅ Can add/edit/remove tiers
- ✅ Generic quotes toggle works
- ✅ Changes saved
- ✅ Pricing history placeholder visible

**Check Database:**
```sql
SELECT
  "pricingTiers",
  "allowsGenericQuotes",
  "genericQuoteDisclaimer"
FROM tenants
WHERE id = '<tenant-id>';
```

---

#### Test 3.4: Calendar Settings

1. **Navigate to Calendar Settings:**
   - Click "Calendar" tab
   - Or go to: `http://localhost:3000/settings/calendar`

2. **Verify Connection Status:**
   - Should show "Connected" badge if calendar connected
   - Should display calendar ID
   - Should show last sync time (if available)

3. **Test Disconnect:**
   - Click "Disconnect"
   - TODO: This should call disconnect procedure (currently placeholder)
   - Status should change to "Not Connected"

4. **Test Reconnect:**
   - Click "Connect Google Calendar"
   - TODO: Should trigger OAuth flow (currently placeholder)

**Expected Results:**
- ✅ Connection status displays correctly
- ✅ Calendar info shown
- ✅ Integration help visible
- ⚠️ Disconnect/Reconnect TODOs noted

**Check Database:**
```sql
SELECT
  "calendarId",
  "calendarLastSyncedAt"
FROM tenants
WHERE id = '<tenant-id>';
```

---

#### Test 3.5: Phone Settings

1. **Navigate to Phone Settings:**
   - Click "Phone" tab
   - Or go to: `http://localhost:3000/settings/phone`

2. **Verify Phone Info:**
   - Should display formatted phone number
   - Should show "Active" status
   - Should display VAPI Agent ID and Phone ID

3. **Test Actions:**
   - Click "Test Call" → Should show toast with number
   - Click "Change Number" → Should show "Coming soon" message (disabled)

4. **Verify Agent Status:**
   - Should show "Operational" badge
   - Should display agent capabilities list

**Expected Results:**
- ✅ Phone number displayed correctly
- ✅ Status badges work
- ✅ VAPI IDs shown
- ✅ Agent capabilities listed
- ⚠️ Change number is placeholder (as expected)

**Check Database:**
```sql
SELECT
  "phoneNumber",
  "vapiAgentId",
  "vapiPhoneNumberId"
FROM tenants
WHERE id = '<tenant-id>';
```

---

#### Test 3.6: Notification Settings

1. **Navigate to Notification Settings:**
   - Click "Notifications" tab
   - Or go to: `http://localhost:3000/settings/notifications`

2. **Verify Pre-filled Preferences:**
   - Should load notification preferences from database
   - Toggles should reflect saved state

3. **Edit Preferences:**
   - Toggle "New lead captured" OFF
   - Toggle "New booking made" ON
   - Try toggling "Daily summary email" → Should be disabled

4. **Verify Contact Info:**
   - Should show phone number where SMS will be sent
   - Should show email where emails will be sent

5. **Submit:**
   - Click "Save Preferences"
   - Should show success toast
   - Reload → Changes should persist

**Expected Results:**
- ✅ Preferences load correctly
- ✅ Can toggle SMS notifications
- ✅ Email toggle disabled (future feature)
- ✅ Contact info displayed
- ✅ Changes saved

**Check Database:**
```sql
SELECT
  "notificationPreferences"
FROM tenants
WHERE id = '<tenant-id>';
```

---

## Testing tRPC Procedures

Open browser DevTools (Network tab) and verify these tRPC calls:

### Onboarding Procedures
- ✅ `tenant.updateBusinessInfo`
- ✅ `tenant.updateServiceAreas`
- ✅ `tenant.updatePricing`
- ✅ `tenant.connectCalendar`
- ✅ `tenant.provisionPhoneNumber`
- ✅ `tenant.completeOnboardingStep`

### Settings Procedures
- ✅ `tenant.getCurrent` (loads tenant data)
- ✅ `tenant.updateBusinessInfo`
- ✅ `tenant.updateServiceAreas`
- ✅ `tenant.updateBusinessHours`
- ✅ `tenant.updatePricing`
- ✅ `tenant.updateNotificationPreferences`

---

## Testing Checklist

### User Authentication
- [ ] Sign up with Google OAuth works
- [ ] User and tenant created in database
- [ ] Login redirects correctly

### Onboarding Flow
- [ ] Step 1: Business info saves correctly
- [ ] Step 1: ZIP code validation works
- [ ] Step 2: Pricing tiers can be added/edited/removed
- [ ] Step 2: Generic quotes toggle works
- [ ] Step 3: Google Calendar OAuth works
- [ ] Step 3: Calendar tokens saved (encrypted)
- [ ] Step 4: Phone number provisioned via VAPI
- [ ] Step 4: VAPI agent created
- [ ] Step 5: Real-time call detection works
- [ ] Step 5: Onboarding completion redirects to dashboard

### Settings Pages
- [ ] Settings layout with tabs displays
- [ ] Business settings loads and saves data
- [ ] Business hours editor works
- [ ] Timezone selector works
- [ ] Pricing settings loads and saves
- [ ] Calendar settings shows connection status
- [ ] Phone settings displays VAPI info
- [ ] Notification settings loads and saves preferences

### Database Integrity
- [ ] All tenant fields populated correctly
- [ ] Service areas stored as JSON array
- [ ] Pricing tiers stored as JSON array
- [ ] Business hours stored as JSON array
- [ ] Notification preferences stored as JSON
- [ ] Calendar tokens encrypted
- [ ] Onboarding flags set correctly

### UI/UX
- [ ] All forms validate input
- [ ] Error messages display for invalid input
- [ ] Success toasts show after saves
- [ ] Loading states display during async operations
- [ ] Navigation between pages works
- [ ] Responsive design works on mobile

---

## Common Issues & Debugging

### Issue: OAuth redirects to error page

**Solution:**
1. Check `.env.local` has correct Supabase URL and keys
2. Verify Google OAuth credentials in Supabase dashboard
3. Check Google Cloud Console redirect URIs
4. Look at browser console for errors

### Issue: tRPC mutations fail

**Solution:**
1. Check browser DevTools Network tab for error details
2. Verify authentication (user must be logged in)
3. Check server logs for Prisma errors
4. Verify database schema is up to date: `npx prisma db push`

### Issue: Data not persisting

**Solution:**
1. Check if mutations return success
2. Verify database connection
3. Check Prisma schema matches database
4. Look for validation errors in tRPC responses

### Issue: Real-time subscription not working

**Solution:**
1. Verify Supabase Realtime is enabled
2. Check RLS policies allow reads
3. Check browser console for subscription errors
4. Verify WebSocket connection in Network tab

---

## Next Steps

After completing Phase 3 testing:

1. **Phase 4: Intelligence Layer (LangGraph + MCP)**
   - MCP servers for property lookup, calendar, business logic
   - LangGraph conversation flow
   - Integration with VAPI

2. **Phase 5: Voice Infrastructure**
   - VAPI webhook handlers
   - Call logging
   - Lead and booking creation

3. **Phase 6: Dashboard & Analytics**
   - Calls page
   - Leads page
   - Bookings page
   - Analytics charts

---

## Test Data Cleanup

To reset and test again:

```sql
-- Delete test tenant and related data
DELETE FROM "Call" WHERE "tenantId" = '<tenant-id>';
DELETE FROM "Lead" WHERE "tenantId" = '<tenant-id>';
DELETE FROM "Booking" WHERE "tenantId" = '<tenant-id>';
DELETE FROM "User" WHERE "tenantId" = '<tenant-id>';
DELETE FROM "Tenant" WHERE id = '<tenant-id>';

-- Delete from Supabase Auth (via Supabase Dashboard)
-- Go to Authentication > Users > Delete user
```

Or use Supabase dashboard to delete the test user, which should cascade delete related records.
