# VAPI Configuration Guide

## Overview

Before you can test Phase 5, you need to configure VAPI to use your custom endpoints. This guide walks you through the complete setup.

## Understanding VAPI Integration

GreenAcreAI uses VAPI in a **custom LLM mode**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    VAPI Integration Flow                         │
└─────────────────────────────────────────────────────────────────┘

1. Customer calls VAPI number
        ↓
2. VAPI sends audio → Speech-to-Text (Deepgram)
        ↓
3. VAPI calls YOUR LLM endpoint: POST /api/vapi-llm
        ↓ (sends user message)
        ↓
4. Your LangGraph agent processes → returns AI response
        ↓
5. VAPI receives response → Text-to-Speech (ElevenLabs)
        ↓
6. Customer hears AI response
        ↓
7. (Repeat steps 2-6 for each turn)
        ↓
8. Call ends → VAPI sends webhook: POST /api/webhooks/vapi
        ↓
9. Your system processes call data, uploads recording, sends SMS
```

## The Two Endpoints

### 1. LLM Endpoint: `/api/vapi-llm`

**Purpose**: Real-time conversation handling (DURING the call)

**What it does**:
- Receives user messages from VAPI
- Routes to LangGraph conversation agent
- Returns AI response back to VAPI
- Saves conversation state to database

**VAPI calls this**: Every time the customer speaks

**Example Request from VAPI**:
```json
{
  "message": {
    "role": "user",
    "content": "Hi, I need a quote for lawn mowing"
  },
  "call": {
    "id": "call_abc123",
    "customer": {
      "number": "+15551234567"
    }
  },
  "model": {
    "metadata": {
      "tenant_id": "tenant_xyz"
    }
  }
}
```

**Example Response to VAPI**:
```json
{
  "message": {
    "role": "assistant",
    "content": "Hello! I'd be happy to help you with a lawn mowing quote. May I have your name please?"
  }
}
```

### 2. Webhook Endpoint: `/api/webhooks/vapi`

**Purpose**: Post-call processing (AFTER the call)

**What it does**:
- Receives call lifecycle events from VAPI
- Creates/updates call records in database
- Downloads recording from VAPI
- Uploads recording to Supabase Storage
- Triggers SMS notifications (booking confirmations, lead alerts)
- Creates lead and booking records

**VAPI calls this**: For these events:
- `call-start`: When call begins
- `end-of-call-report`: When call ends (includes recording URL)
- `transcript`: Real-time transcript updates (optional)
- `status-update`: Call status changes (optional)

**Most Important Event: `end-of-call-report`**:
```json
{
  "type": "end-of-call-report",
  "call": {
    "id": "call_abc123",
    "status": "ended",
    "endedReason": "customer-ended-call",
    "duration": 180,
    "cost": 0.25,
    "recordingUrl": "https://vapi.ai/recordings/abc123.mp3",
    "transcript": [
      {
        "role": "user",
        "content": "Hi, I need a quote"
      },
      {
        "role": "assistant",
        "content": "I'd be happy to help!"
      }
    ]
  }
}
```

---

## Configuration Steps

### Step 1: Deploy Your Application (Required for VAPI)

VAPI needs to be able to reach your endpoints via HTTPS. You have two options:

#### Option A: Use ngrok (For Local Testing)

1. Install ngrok:
```bash
brew install ngrok  # macOS
# or download from https://ngrok.com/download
```

2. Start your Next.js app:
```bash
npm run dev
```

3. In another terminal, start ngrok:
```bash
ngrok http 3000
```

4. ngrok will give you a URL like: `https://abc123.ngrok.io`

5. Your endpoints will be:
   - LLM: `https://abc123.ngrok.io/api/vapi-llm`
   - Webhook: `https://abc123.ngrok.io/api/webhooks/vapi`

**Important**: ngrok URLs change each time you restart. For persistent URLs, sign up for a free ngrok account.

#### Option B: Deploy to Vercel (Recommended)

1. Push your code to GitHub (already done!)

2. Deploy to Vercel:
```bash
npm install -g vercel
vercel --prod
```

3. Your endpoints will be:
   - LLM: `https://your-app.vercel.app/api/vapi-llm`
   - Webhook: `https://your-app.vercel.app/api/webhooks/vapi`

4. Make sure all environment variables are set in Vercel dashboard

---

### Step 2: Create VAPI Assistant (Agent)

You need to create a VAPI assistant configured to use your custom LLM endpoint.

#### Option A: Using VAPI Dashboard (Easier)

1. Go to https://dashboard.vapi.ai/

2. Click **"Assistants"** → **"Create Assistant"**

3. **Configure Assistant**:

   **Basic Settings**:
   - Name: `GreenAcre Lawn Mowing Assistant`
   - Description: `AI assistant for lawn mowing quotes and bookings`

   **Model Configuration** (MOST IMPORTANT):
   - Provider: Select **"Custom LLM"**
   - URL: `https://your-app.vercel.app/api/vapi-llm` (or ngrok URL)
   - Method: `POST`
   - Metadata: Add this JSON:
     ```json
     {
       "tenant_id": "your-tenant-id-from-database"
     }
     ```
     (Get your tenant_id by running: `SELECT id FROM tenants LIMIT 1;` in your database)

   **Voice Settings**:
   - Provider: `ElevenLabs` (or `11Labs`)
   - Voice: Choose a professional voice (e.g., "Rachel" or "Josh")
   - Model: `eleven_turbo_v2` (fastest, cheapest)

   **Transcriber Settings**:
   - Provider: `Deepgram`
   - Model: `nova-2` (most accurate)
   - Language: `en-US`

   **First Message** (optional):
   - "Thank you for calling [Your Business Name]. How can I help you today?"

4. Click **"Save"**

5. Copy the **Assistant ID** (you'll need this for the phone number)

#### Option B: Using VAPI API (For Multiple Tenants)

Create a script to create assistants programmatically:

```bash
npm run create-vapi-assistant
```

I can create this script if you want to automate tenant onboarding.

---

### Step 3: Get a VAPI Phone Number

1. In VAPI Dashboard, go to **"Phone Numbers"** → **"Buy Number"**

2. Select a phone number (free on trial, ~$1/month after)

3. **Configure the phone number**:
   - Assistant: Select the assistant you created in Step 2
   - This links the phone number to your custom LLM endpoint

4. **Copy the Phone Number ID** and update your database:
   ```sql
   UPDATE tenants
   SET vapi_phone_number_id = 'your-phone-number-id'
   WHERE id = 'your-tenant-id';
   ```

---

### Step 4: Configure Webhook URL

1. In VAPI Dashboard, go to **"Settings"** → **"Webhooks"**

2. Add webhook URL: `https://your-app.vercel.app/api/webhooks/vapi`

3. Select events to receive:
   - ✅ `call-start`
   - ✅ `end-of-call-report` (MOST IMPORTANT)
   - ⚠️ `transcript` (optional - can be noisy)
   - ⚠️ `status-update` (optional)

4. (Optional) Copy the webhook secret and add to `.env.local`:
   ```bash
   VAPI_WEBHOOK_SECRET="your-webhook-secret"
   ```

---

### Step 5: Verify Configuration

Create a test script to verify everything is configured:

**File**: `scripts/verify-vapi-config.ts`

```typescript
import { prisma } from '@/lib/prisma'

async function verifyConfig() {
  console.log('🔍 Verifying VAPI Configuration...\n')

  // 1. Check environment variables
  console.log('1. Environment Variables:')
  console.log('   VAPI_API_KEY:', process.env.VAPI_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('   VAPI_WEBHOOK_SECRET:', process.env.VAPI_WEBHOOK_SECRET ? '✅ Set' : '⚠️  Optional')

  // 2. Check database
  console.log('\n2. Database Configuration:')
  const tenant = await prisma.tenants.findFirst()

  if (!tenant) {
    console.log('   ❌ No tenant found. Please create a tenant first.')
    return
  }

  console.log('   Tenant ID:', tenant.id)
  console.log('   VAPI Phone Number ID:', tenant.vapi_phone_number_id || '❌ Not set')
  console.log('   VAPI Agent ID:', tenant.vapi_agent_id || '⚠️  Not set (optional)')
  console.log('   Owner Phone:', tenant.phone_number || '⚠️  Not set')

  // 3. Check endpoints
  console.log('\n3. Endpoints Status:')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  console.log('   LLM Endpoint:', `${baseUrl}/api/vapi-llm`)
  console.log('   Webhook Endpoint:', `${baseUrl}/api/webhooks/vapi`)

  console.log('\n✅ Configuration check complete!')
  console.log('\n📋 Next Steps:')
  console.log('   1. Deploy app to Vercel or start ngrok')
  console.log('   2. Create VAPI assistant with custom LLM URL')
  console.log('   3. Buy VAPI phone number and link to assistant')
  console.log('   4. Configure webhook URL in VAPI dashboard')
  console.log('   5. Update tenant.vapi_phone_number_id in database')
}

verifyConfig()
  .catch(console.error)
  .finally(() => process.exit(0))
```

Run it:
```bash
npx tsx scripts/verify-vapi-config.ts
```

---

## Testing Checklist

Before making your first test call:

- [ ] ✅ Twilio credentials added to `.env.local`
- [ ] ✅ App deployed to Vercel or ngrok running
- [ ] ✅ VAPI assistant created with custom LLM endpoint
- [ ] ✅ VAPI phone number purchased and linked to assistant
- [ ] ✅ Webhook URL configured in VAPI dashboard
- [ ] ✅ Tenant record has `vapi_phone_number_id` set
- [ ] ✅ Tenant record has `phone_number` set (for SMS alerts)
- [ ] ✅ Database migrations applied
- [ ] ✅ MCP servers running (for property lookup, calendar, pricing)

---

## Common Issues

### Issue 1: "VAPI can't reach my LLM endpoint"

**Symptoms**: VAPI doesn't call your endpoint, or you see timeout errors

**Solutions**:
- Ensure your app is publicly accessible (Vercel or ngrok)
- Check VAPI dashboard logs for error messages
- Test endpoint manually: `curl -X POST https://your-app.vercel.app/api/vapi-llm`

### Issue 2: "Webhook not receiving events"

**Symptoms**: Call completes but no webhook received

**Solutions**:
- Verify webhook URL in VAPI dashboard
- Check if events are selected (especially `end-of-call-report`)
- Check your app logs for incoming requests
- Verify webhook endpoint is publicly accessible

### Issue 3: "LangGraph agent not responding"

**Symptoms**: VAPI calls endpoint but gets errors

**Solutions**:
- Check that MCP servers are running
- Verify OpenAI API key is set
- Check app logs for LangGraph errors
- Ensure tenant_id is passed in metadata

### Issue 4: "Recording not uploading to Supabase"

**Symptoms**: Call ends but no recording in Supabase Storage

**Solutions**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- Check that `call-recordings` bucket exists
- Check app logs for upload errors
- Verify VAPI includes `recordingUrl` in webhook

### Issue 5: "SMS not sending"

**Symptoms**: Call completes but no SMS received

**Solutions**:
- Verify Twilio credentials in `.env.local`
- Check that `tenants.phone_number` is set
- For Twilio trial, verify your phone number in Twilio console
- Check app logs for SMS errors

---

## What Happens During a Test Call

Understanding the complete flow:

```
1. You call VAPI number: +1-XXX-XXX-XXXX
   ↓
2. VAPI receives call → Webhook: call-start
   ↓ (your app creates call record in database)
   ↓
3. You speak: "Hi, I need a lawn mowing quote"
   ↓
4. VAPI transcribes (Deepgram) → POST /api/vapi-llm
   ↓ (LangGraph greeting node responds)
   ↓
5. VAPI speaks (ElevenLabs): "Hello! May I have your name?"
   ↓
6. You respond: "My name is John"
   ↓
7. VAPI → POST /api/vapi-llm
   ↓ (LangGraph extracts name, asks for address)
   ↓
8. VAPI speaks: "Great! What's your property address?"
   ↓
9. You provide address → Property lookup → Quote calculation
   ↓
10. Booking made
   ↓
11. Call ends → VAPI → Webhook: end-of-call-report
    ↓
12. Your app:
    - Downloads recording from VAPI
    - Uploads to Supabase Storage
    - Creates lead record
    - Creates booking record
    - Sends SMS to customer (booking confirmation)
    - Sends SMS to owner (booking alert)
```

---

## Next Steps

Once configured, proceed to:
- `Docs/TESTING_PHASE5_PHASE6.md` for detailed testing procedures
- Make your first test call!
- Check database for call records
- Verify SMS notifications
- Check Supabase Storage for recording

---

## Need Help?

Common questions:
- "Where do I find my tenant_id?" → Run: `SELECT id FROM tenants LIMIT 1;`
- "Where's my VAPI API key?" → VAPI Dashboard → Settings → API Keys
- "How do I get my Vercel URL?" → After `vercel --prod`, it shows the URL
- "My ngrok URL keeps changing" → Sign up for free ngrok account for persistent URLs
