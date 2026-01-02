# Google Cloud Console Setup Guide

## Task 0.3.7: Google Calendar API Configuration

Google Calendar API enables our agent to check availability and book appointments.

---

## Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Click **"Select a project"** dropdown at the top
4. Click **"New Project"**
5. Settings:
   - **Project name**: `GreenAcreAI`
   - **Organization**: (leave as default or select if you have one)
   - **Location**: (leave as default)
6. Click **"Create"**
7. Wait for project creation (takes a few seconds)

---

## Step 2: Enable Google Calendar API

1. Make sure `GreenAcreAI` project is selected (top dropdown)
2. Go to **"APIs & Services"** → **"Library"**
   - Or visit: https://console.cloud.google.com/apis/library
3. Search for **"Google Calendar API"**
4. Click on **"Google Calendar API"**
5. Click **"Enable"**
6. Wait for API to be enabled

---

## Step 3: Configure OAuth Consent Screen

This is required before creating OAuth credentials.

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
   - Or visit: https://console.cloud.google.com/apis/credentials/consent
2. Choose user type:
   - **External** (for public access)
   - Click **"Create"**

3. **App Information**:
   - **App name**: `GreenAcre AI`
   - **User support email**: Your email
   - **App logo**: (optional, skip for now)
   - **Application home page**: `https://your-vercel-url.vercel.app`
   - **Application privacy policy link**: (skip for MVP, add later)
   - **Application terms of service link**: (skip for MVP, add later)

4. **Developer contact information**:
   - Enter your email address

5. Click **"Save and Continue"**

6. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - Search and select:
     - `https://www.googleapis.com/auth/calendar` - See, edit, share, and permanently delete all calendars
     - `https://www.googleapis.com/auth/calendar.events` - View and edit events on all calendars
   - Click **"Update"**
   - Click **"Save and Continue"**

7. **Test users** (Step 3):
   - Click **"Add Users"**
   - Add your email (and any team members' emails)
   - Click **"Add"**
   - Click **"Save and Continue"**

8. **Summary** (Step 4):
   - Review your settings
   - Click **"Back to Dashboard"**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
   - Or visit: https://console.cloud.google.com/apis/credentials
2. Click **"Create Credentials"** → **"OAuth client ID"**

3. Settings:
   - **Application type**: **Web application**
   - **Name**: `GreenAcreAI Web Client`

4. **Authorized JavaScript origins**:
   - Click **"Add URI"**
   - Add: `http://localhost:3000` (for local development)
   - Click **"Add URI"** again
   - Add: `https://your-vercel-url.vercel.app` (for production)

5. **Authorized redirect URIs**:
   - Click **"Add URI"**
   - Add: `http://localhost:3000/api/auth/callback/google`
   - Click **"Add URI"** again
   - Add: `https://your-vercel-url.vercel.app/api/auth/callback/google`

6. Click **"Create"**

7. **Copy your credentials**:
   - **Client ID** (ends with `.apps.googleusercontent.com`)
   - **Client Secret**
   - Click **"OK"**

**Important**: Save these credentials immediately!

---

## Step 5: Enable Additional APIs (Optional for Future)

For future features, you may want to enable:
- **Google Maps API** (for address validation)
- **Gmail API** (for email notifications)

Skip for now, enable when needed.

---

## Step 6: Set Up Service Account (Alternative Method)

**Note**: For server-to-server calendar access (if you want the agent to access a company calendar without user OAuth), you can create a service account.

### When to use Service Account:
- Company-wide calendar (e.g., "GreenAcre Availability Calendar")
- No per-user authentication needed
- Server-side only access

### When to use OAuth 2.0 (what we're using):
- Per-tenant calendars
- Users connect their own Google Calendars
- More flexible for multi-tenant SaaS

**For our MVP, we're using OAuth 2.0**. We can add Service Account support later if needed.

---

## Step 7: Update .env.local

Add Google Cloud credentials to your `.env.local` file:

```bash
# Google Cloud / Calendar API
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

**For production** (add to Vercel env vars):
```bash
GOOGLE_REDIRECT_URI=https://your-vercel-url.vercel.app/api/auth/callback/google
```

---

## Step 8: Configure Supabase Google OAuth (Complete Task 0.3.1.4)

Now that we have Google OAuth credentials, we can complete Supabase setup:

1. Go to Supabase: https://app.supabase.com/project/dausexigvmmppiijbzyb/auth/providers
2. Find **"Google"** provider
3. Enable it and enter:
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx`
   - **Authorized redirect URI**: Use the one shown by Supabase
     (e.g., `https://dausexigvmmppiijbzyb.supabase.co/auth/v1/callback`)
4. Click **"Save"**

5. Go back to Google Cloud Console
6. Add Supabase redirect URI to your OAuth client:
   - Go to **Credentials** → Click on your OAuth client
   - Under **Authorized redirect URIs**, click **"Add URI"**
   - Add: `https://dausexigvmmppiijbzyb.supabase.co/auth/v1/callback`
   - Click **"Save"**

---

## Step 9: Test OAuth Flow (Optional)

You can test the OAuth flow later when we build the calendar integration in Phase 4.

---

## Step 10: Understand Quotas and Limits

1. Go to **"APIs & Services"** → **"Quotas"**
2. Review Google Calendar API quotas:
   - **Queries per day**: 1,000,000 (free tier)
   - **Queries per 100 seconds per user**: 20,000

These limits are very generous and should be sufficient for our use case.

---

## Checklist

- [ ] Created Google Cloud project (`GreenAcreAI`)
- [ ] Enabled Google Calendar API
- [ ] Configured OAuth consent screen (External)
- [ ] Added required scopes (calendar, calendar.events)
- [ ] Added test users (your email)
- [ ] Created OAuth 2.0 Web Client credentials
- [ ] Copied Client ID (.apps.googleusercontent.com)
- [ ] Copied Client Secret (GOCSPX-...)
- [ ] Added authorized JavaScript origins (localhost and Vercel)
- [ ] Added authorized redirect URIs (localhost and Vercel)
- [ ] Updated `.env.local` with GOOGLE_CLIENT_ID
- [ ] Updated `.env.local` with GOOGLE_CLIENT_SECRET
- [ ] Updated `.env.local` with GOOGLE_REDIRECT_URI
- [ ] Configured Google OAuth in Supabase
- [ ] Added Supabase redirect URI to Google OAuth client

---

## How We'll Use Google Calendar in GreenAcre AI

### Integration Flow:
```
1. Tenant onboarding: Admin connects Google Calendar via OAuth
2. Calendar access token stored securely in Supabase
3. Customer calls and requests appointment
4. LangGraph agent calls Calendar MCP Server
5. MCP Server uses OAuth token to query Google Calendar
6. Agent presents available time slots
7. Customer chooses a slot
8. MCP Server creates calendar event
9. Confirmation sent to customer
```

### Example Conversation:
```
Customer: "I'd like to schedule a lawn mowing for next week"
Agent: "Let me check my availability... I have openings on
        Tuesday at 10 AM, Wednesday at 2 PM, or Thursday at 9 AM.
        Which works best for you?"
Customer: "Tuesday at 10 works great"
Agent: "Perfect! I've booked you for Tuesday, March 15th at 10 AM.
        You'll receive a confirmation shortly."
```

---

## Security Best Practices

1. **Refresh Tokens**: We'll implement token refresh in Phase 4
2. **Scope Limitation**: Only request necessary calendar scopes
3. **Token Storage**: Store encrypted in Supabase
4. **Expiration Handling**: Gracefully handle expired tokens
5. **Revocation**: Provide UI for users to disconnect calendar

---

## What's Next?

After completing this checklist, let me know and I'll:
1. Mark Task 0.3.7 as complete
2. Complete Task 0.3.1.4 (Google OAuth in Supabase) ✅
3. Summarize all completed external service setups
4. Prepare for Epic 0.4: Environment Variables Configuration
