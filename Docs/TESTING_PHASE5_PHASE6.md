# Testing Guide: Phase 5 & Phase 6

## Overview
This guide covers testing for:
- **Phase 5**: VAPI Integration & Post-Call Processing
- **Phase 6**: Dashboard & Analytics

---

## Pre-Testing Setup

### 1. Environment Variables

Ensure these are set in `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Required for storage

# VAPI
VAPI_API_KEY="your-vapi-api-key"
VAPI_WEBHOOK_SECRET="your-webhook-secret"  # Optional

# Twilio (for SMS)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# Google Calendar (already configured)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# OpenAI (for LangGraph agent)
OPENAI_API_KEY="sk-..."

# Regrid (for property lookup)
REGRID_API_KEY="..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Supabase Storage Bucket

Create the `call-recordings` bucket in Supabase:

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `call-recordings`
3. Set as **Private** (we use signed URLs)
4. (Optional) Set up RLS policies for tenant isolation

### 3. Database Migration

Ensure all migrations are applied:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

---

## Phase 5 Testing: VAPI Integration & Post-Call Processing

### Test 5.1: VAPI Webhook Endpoint

**Location**: `src/app/api/webhooks/vapi/route.ts`

#### Test 5.1.1: Call Started Event

**Simulate webhook**:
```bash
curl -X POST http://localhost:3000/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -d '{
    "type": "call-start",
    "call": {
      "id": "test-call-001",
      "status": "in-progress",
      "phoneNumber": {
        "id": "pn-123",
        "number": "+14155551234"
      },
      "customer": {
        "number": "+14155559999"
      },
      "startedAt": "2026-01-08T12:00:00Z"
    }
  }'
```

**Expected**:
- ✅ Call record created in `calls` table
- ✅ Webhook logged in `webhooks` table
- ✅ Response: `{"received": true}`

**Verify**:
```sql
SELECT * FROM calls WHERE vapi_call_id = 'test-call-001';
SELECT * FROM webhooks WHERE event_type = 'call-start' ORDER BY created_at DESC LIMIT 1;
```

#### Test 5.1.2: Call Ended with Booking

**Simulate webhook**:
```bash
curl -X POST http://localhost:3000/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -d '{
    "type": "end-of-call-report",
    "call": {
      "id": "test-call-001",
      "status": "ended",
      "endedReason": "assistant-ended-call",
      "startedAt": "2026-01-08T12:00:00Z",
      "endedAt": "2026-01-08T12:05:30Z",
      "transcript": "Customer: Hi, I need lawn mowing. Assistant: Great! Your appointment is scheduled for Monday at 10 AM. Customer: Perfect, thank you!",
      "recordingUrl": "https://example.com/recording.mp3",
      "cost": 0.45
    }
  }'
```

**Expected**:
- ✅ Call updated with `outcome = booking_made`
- ✅ `booking_made = true`
- ✅ Recording uploaded to Supabase (if URL is valid)
- ✅ SMS sent to owner (if Twilio configured)

#### Test 5.1.3: Call Ended with Quote Only

**Change transcript** to:
```
"transcript": "Customer: How much for weekly mowing? Assistant: For your property, it would be $45 per week. Customer: Let me think about it."
```

**Expected**:
- ✅ `outcome = quote_given`
- ✅ `lead_captured = true`
- ✅ `quote_amount = 45.00`
- ✅ Lead record created (if address provided)

### Test 5.2: SMS Notifications

**Location**: `src/lib/twilio/sms.ts`

#### Test 5.2.1: Customer Booking Confirmation

**Trigger**: Create a booking through the conversation graph

**Expected**:
- ✅ SMS sent to customer phone
- ✅ Notification logged in `notifications` table
- ✅ `confirmation_sent = true` in booking record

**Verify SMS Content**:
```
Hi [Customer Name], your lawn mowing appointment with [Business Name] is confirmed for [Date/Time]. We'll see you then!
```

#### Test 5.2.2: Owner Lead Alert

**Trigger**: Call ends with quote given but no booking

**Expected**:
- ✅ SMS sent to owner phone (from `tenants.phone`)
- ✅ Notification logged with `template = new_lead_alert`

**Verify SMS Content**:
```
[Business Name] New lead: [Customer] at [Address]. Quote: $XX.XX. Check your dashboard for details.
```

#### Test 5.2.3: Owner Booking Alert

**Trigger**: Call ends with booking made

**Expected**:
- ✅ SMS sent to owner phone
- ✅ Notification logged with `template = new_booking_alert`

**Verify SMS Content**:
```
[Business Name] New booking: [Customer] at [Address] on [Date]. Quote: $XX.XX.
```

#### Test 5.2.4: Notification Preferences

**Test respecting preferences**:

1. Set `notification_preferences`:
```sql
UPDATE tenants
SET notification_preferences = '{"sms_new_lead": false, "sms_new_booking": true}'
WHERE id = 'your-tenant-id';
```

2. Create a lead

**Expected**:
- ✅ NO SMS sent for lead
- ✅ SMS sent for booking

### Test 5.3: Call Recording Storage

**Location**: `src/lib/supabase/storage.ts`

#### Test 5.3.1: Recording Upload

**Trigger**: Call webhook with valid `recordingUrl`

**Expected**:
- ✅ Recording downloaded from VAPI
- ✅ Uploaded to Supabase Storage at `{tenant_id}/{call_id}.mp3`
- ✅ Signed URL generated (valid for 1 year)
- ✅ Call record updated with Supabase URL

**Verify**:
```sql
SELECT recording_url FROM calls WHERE vapi_call_id = 'test-call-001';
-- Should show Supabase signed URL, not VAPI URL
```

#### Test 5.3.2: Get Recording URL

**Test programmatically**:
```typescript
import { getRecordingUrl } from '@/lib/supabase/storage'

const url = await getRecordingUrl('tenant-id', 'call-id')
console.log(url) // Should return signed URL
```

#### Test 5.3.3: Recording Exists Check

```typescript
import { recordingExists } from '@/lib/supabase/storage'

const exists = await recordingExists('tenant-id', 'call-id')
console.log(exists) // true or false
```

---

## Phase 6 Testing: Dashboard & Analytics

### Test 6.1: Dashboard Home Page

**Location**: `src/app/(dashboard)/dashboard/page.tsx`

#### Test 6.1.1: Metrics Display

1. Navigate to `http://localhost:3000/dashboard`

**Expected UI**:
- ✅ 4 metric cards:
  - Calls Today (count of calls with `created_at >= today`)
  - Total Leads (all time count)
  - Total Bookings (all time count)
  - Conversion Rate (bookings/leads * 100)
- ✅ Recent calls list (last 10 calls)
- ✅ Color-coded status indicators

#### Test 6.1.2: Real-Time Updates

1. Create a new call via webhook
2. Refresh dashboard

**Expected**:
- ✅ "Calls Today" increments
- ✅ New call appears in recent list

#### Test 6.1.3: Empty State

**Clear all data**:
```sql
DELETE FROM calls WHERE tenant_id = 'your-tenant-id';
```

**Expected**:
- ✅ Shows "No calls yet" message
- ✅ All metrics show 0

### Test 6.2: Calls Page

**Location**: `src/app/(dashboard)/calls/page.tsx`

#### Test 6.2.1: Call List Display

1. Navigate to `http://localhost:3000/dashboard/calls`

**Expected**:
- ✅ List of all calls with:
  - Status indicator (green=booking, blue=lead, gray=other)
  - Caller phone number
  - Date and time
  - Duration
  - Outcome badge
  - Quote amount (if available)
- ✅ Sorted by created_at DESC

#### Test 6.2.2: Phone Number Search

1. Type phone number in search box (e.g., "415555")

**Expected**:
- ✅ Filters calls by matching phone numbers
- ✅ Updates count in real-time

#### Test 6.2.3: Empty Search Results

1. Search for non-existent phone number

**Expected**:
- ✅ Shows "No calls found" message
- ✅ Suggests trying different search term

### Test 6.3: Call Detail Page

**Location**: `src/app/(dashboard)/calls/[id]/page.tsx`

#### Test 6.3.1: Call Metadata Display

1. Click on a call from the list
2. Navigate to `/dashboard/calls/{call-id}`

**Expected**:
- ✅ 4 metadata cards:
  - Caller (phone number)
  - Duration (MM:SS format)
  - Quote (dollar amount)
  - Outcome (booking/lead/other)
- ✅ All fields populated correctly

#### Test 6.3.2: Audio Player

**If recording exists**:

**Expected**:
- ✅ Audio player component renders
- ✅ Play/pause button works
- ✅ Progress bar updates during playback
- ✅ Volume control works
- ✅ Time display shows current/total time

#### Test 6.3.3: Transcript Display

**If transcript exists**:

**Expected**:
- ✅ Chat-style bubbles for each message
- ✅ User messages on right (blue background)
- ✅ Assistant messages on left (gray background)
- ✅ Labels: "Customer" vs "Assistant"
- ✅ Proper formatting and line breaks

**Fallback**: If structured transcript not available, shows `transcript_text` as plain text

#### Test 6.3.4: Summary Display

**If summary exists**:

**Expected**:
- ✅ Summary card renders
- ✅ Text is readable and formatted

#### Test 6.3.5: Not Found Handling

1. Navigate to `/dashboard/calls/invalid-id`

**Expected**:
- ✅ Shows "Call Not Found" message
- ✅ "Back to Calls" button redirects to `/dashboard/calls`

### Test 6.4: Leads Page

**Location**: `src/app/(dashboard)/leads/page.tsx`

#### Test 6.4.1: Lead Cards Display

1. Navigate to `http://localhost:3000/dashboard/leads`

**Expected**:
- ✅ Grid of lead cards (3 columns on desktop)
- ✅ Each card shows:
  - Customer name
  - Status badge (colored by status)
  - Phone number
  - Address
  - Quote amount and frequency
  - Created date
  - Lot size (if available)
  - Notes (if available)

#### Test 6.4.2: Status Filter

1. Select different status from dropdown (New, Contacted, Quoted, Booked, Lost)

**Expected**:
- ✅ Filters leads by selected status
- ✅ "All Status" shows everything

#### Test 6.4.3: Search Functionality

1. Type customer name in search box

**Expected**:
- ✅ Filters by name, phone, OR address
- ✅ Case-insensitive search

#### Test 6.4.4: Status Badge Colors

**Verify colors**:
- New → Blue
- Contacted → Yellow
- Quoted → Purple
- Booked → Green
- Lost → Gray

### Test 6.5: Bookings Page

**Location**: `src/app/(dashboard)/bookings/page.tsx`

#### Test 6.5.1: Bookings List Display

1. Navigate to `http://localhost:3000/dashboard/bookings`

**Expected**:
- ✅ List of booking cards
- ✅ Each card shows:
  - Customer name
  - Status badge
  - Date and time (formatted nicely)
  - Phone number
  - Property address
  - Service type
  - Estimated price
  - Notes (if available)
  - Google Calendar indicator (if synced)

#### Test 6.5.2: Upcoming Filter

1. Select "Upcoming" filter

**Expected**:
- ✅ Shows only future bookings with `status = confirmed`
- ✅ Sorted chronologically (soonest first)
- ✅ Bookings have "Upcoming" badge

#### Test 6.5.3: Completed Filter

1. Select "Completed" filter

**Expected**:
- ✅ Shows past bookings OR `status = completed`
- ✅ Sorted chronologically

#### Test 6.5.4: Cancelled Filter

1. Select "Cancelled" filter

**Expected**:
- ✅ Shows only `status = cancelled` bookings

#### Test 6.5.5: Empty States

**Expected for each filter**:
- ✅ Shows appropriate message ("No upcoming bookings", etc.)
- ✅ Helpful subtext

### Test 6.6: Analytics Router

**Location**: `src/lib/trpc/routers/analytics.ts`

#### Test 6.6.1: getDashboardMetrics

**Test in browser console**:
```javascript
// Open dashboard page, then in console:
const metrics = await trpc.analytics.getDashboardMetrics.query()
console.log(metrics)
```

**Expected response**:
```json
{
  "callsToday": 5,
  "totalLeads": 23,
  "totalBookings": 12,
  "conversionRate": 52.2,
  "recentCalls": [...]
}
```

#### Test 6.6.2: Conversion Rate Calculation

**Verify math**:
```
conversionRate = (totalBookings / totalLeads) * 100
```

**Test edge cases**:
- 0 leads → `conversionRate = 0`
- More bookings than leads → Shows actual percentage

---

## Integration Testing Scenarios

### Scenario 1: Complete Call Flow

1. **Call starts** (webhook: call-start)
   - ✅ Call record created

2. **Customer conversation** happens
   - LangGraph agent handles it

3. **Call ends with booking** (webhook: end-of-call-report)
   - ✅ Call updated with outcome
   - ✅ Booking created
   - ✅ Lead created
   - ✅ Recording uploaded to Supabase
   - ✅ SMS sent to customer (booking confirmation)
   - ✅ SMS sent to owner (booking alert)

4. **Dashboard updates**
   - ✅ Metrics reflect new data
   - ✅ Call appears in calls list
   - ✅ Lead appears in leads page
   - ✅ Booking appears in bookings page

### Scenario 2: Quote-Only Flow

1. **Call ends with quote, no booking**
   - ✅ `outcome = quote_given`
   - ✅ Lead created
   - ✅ SMS sent to owner (lead alert)
   - ✅ NO customer SMS (no booking)

2. **Dashboard updates**
   - ✅ Lead count increases
   - ✅ Booking count stays same
   - ✅ Conversion rate updates

### Scenario 3: Large Lot Custom Quote

1. **Property lookup returns > 0.5 acres**
   - ✅ Agent detects no pricing tier
   - ✅ Asks for callback number
   - ✅ Call ends with custom quote outcome
   - ✅ SMS sent to owner with lot size info

---

## Performance Testing

### Test P.1: Dashboard Load Time

**Measure**:
```bash
# Use browser DevTools Network tab
# Measure Time to Interactive (TTI)
```

**Expected**:
- ✅ Initial load < 2 seconds
- ✅ tRPC queries cached appropriately

### Test P.2: Call List Pagination

**Create 100+ calls**, then check:
- ✅ List renders smoothly
- ✅ Scroll performance good
- (Future: Add pagination if needed)

---

## Error Handling Testing

### Test E.1: Webhook Failures

**Test invalid webhook payload**:
```bash
curl -X POST http://localhost:3000/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

**Expected**:
- ✅ Returns 500 error
- ✅ Error logged
- ✅ Webhook still logged to database

### Test E.2: Missing Recording URL

**Call webhook without recordingUrl**:

**Expected**:
- ✅ Call processed normally
- ✅ No storage upload attempt
- ✅ recording_url stays null

### Test E.3: Twilio SMS Failure

**Use invalid Twilio credentials**:

**Expected**:
- ✅ Booking/lead still created
- ✅ Notification logged with `status = failed`
- ✅ Error message captured
- ✅ Webhook doesn't fail

### Test E.4: Missing Audio File

**Navigate to call detail with no recording**:

**Expected**:
- ✅ Audio player section doesn't render
- ✅ Other sections still display
- ✅ No console errors

---

## Security Testing

### Test S.1: Tenant Isolation

**Try accessing another tenant's data**:

1. Get a call ID from tenant A
2. Log in as tenant B
3. Navigate to `/dashboard/calls/{tenant-a-call-id}`

**Expected**:
- ✅ Shows "Call Not Found"
- ✅ NO data leakage

### Test S.2: Webhook Signature Verification

**Future enhancement**: Implement VAPI signature verification

**Currently**:
- ⚠️ Webhook accepts all requests in development
- 📝 TODO: Add signature check in production

---

## Browser Compatibility

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

**Expected**:
- ✅ All features work
- ✅ Audio player works (HTML5 audio)
- ✅ Responsive design on mobile

---

## Cleanup After Testing

```bash
# Remove test data
npm run prisma:studio

# Or SQL:
DELETE FROM calls WHERE vapi_call_id LIKE 'test-%';
DELETE FROM webhooks WHERE payload->>'call'->>'id' LIKE 'test-%';
DELETE FROM notifications WHERE created_at > NOW() - INTERVAL '1 hour';

# Clear Supabase test recordings
# (Use Supabase Dashboard → Storage)
```

---

## Known Issues & Limitations

1. **No pagination** on calls/leads/bookings pages (OK for MVP, add if > 100 items)
2. **No real-time updates** (requires Supabase Realtime subscriptions - Epic 6.2)
3. **No analytics charts** (line/pie charts - Epic 6.1.6)
4. **No lead status updates** from UI (can only view)
5. **No booking cancellation** from UI (Google Calendar integration needed)

---

## Success Criteria

**Phase 5 is successful if**:
- ✅ Webhooks process all call events correctly
- ✅ SMS notifications work (when Twilio configured)
- ✅ Recordings upload to Supabase
- ✅ Lead and booking data captured accurately

**Phase 6 is successful if**:
- ✅ Dashboard shows real-time metrics
- ✅ All CRUD pages (calls, leads, bookings) display data
- ✅ Call detail page shows transcript and plays audio
- ✅ Search and filters work on all pages
- ✅ UI is responsive and performant

---

## Next Steps After Testing

1. **Fix any bugs discovered**
2. **Add pagination** if call volume is high
3. **Implement Epic 6.2**: Realtime subscriptions
4. **Implement Epic 6.1.6**: Analytics charts
5. **Add lead status updates** (inline editing)
6. **Add booking cancellation** (Google Calendar API)
7. **Deploy to staging** and test with real VAPI calls

---

## Questions or Issues?

- Check logs: `npm run dev` console output
- Check database: `npx prisma studio`
- Check Supabase logs: Supabase Dashboard → Logs
- Check browser console for client-side errors
