# VAPI Account Setup Guide

## Task 0.3.3: VAPI Voice Infrastructure Configuration

VAPI provides Speech-to-Text (STT) and Text-to-Speech (TTS) for our voice AI platform.

---

## Step 1: Create VAPI Account

1. Go to https://dashboard.vapi.ai (or https://vapi.ai and click "Sign up")
2. Sign up with your email or Google account
3. Verify your email address
4. Complete any onboarding steps

---

## Step 2: Access Dashboard

1. Once logged in, you'll be at the main dashboard: https://dashboard.vapi.ai
2. Take a moment to explore the interface
3. You should see options for creating agents, phone numbers, and settings

---

## Step 3: Generate API Key

1. Look for **"Settings"**, **"API Keys"**, or **"Credentials"** in the dashboard
   - This is typically in the sidebar or top navigation
2. Find the option to **"Create"** or **"Generate"** a new API key
3. If prompted, give it a name: `GreenAcreAI Development`
4. Copy the API key immediately (typically starts with a prefix)
5. **Important**: Save this in a secure location - you may not be able to see it again!

**Note**: If you can't find the API key section, check VAPI's help documentation or contact their support.

---

## Step 4: Understand VAPI Architecture

For our implementation:
- **VAPI Role**: Handles STT (Speech-to-Text) and TTS (Text-to-Speech) only
- **Our Custom Agent**: LangGraph agent handles all conversation logic
- **Integration**: VAPI will call our custom webhook endpoint (`/api/vapi-llm`)

We are **NOT** using VAPI's built-in GPT-4 agent. We're using VAPI for voice infrastructure only.

---

## Step 5: Note Webhook Requirements

VAPI will need to communicate with our Next.js API:

### Webhook Endpoint
```
https://your-vercel-url.vercel.app/api/vapi-llm
```

**Note**: We'll configure this endpoint in Phase 5 (Voice Infrastructure Integration)

### Webhook Secret
- VAPI may provide a webhook secret for signature verification
- Look for **Settings**, **Webhooks**, or **Security** section in the dashboard
- If available, copy any **Webhook Secret** or **Signing Secret**
- Save this for `.env.local`
- If not available now, you can set this up later when configuring webhooks

---

## Step 6: Explore Agent Configuration (Optional)

**Important**: We won't be creating VAPI agents in the dashboard since we're using our custom LangGraph agent. However, it's useful to understand VAPI's interface:

1. Go to **"Agents"** in sidebar
2. Click **"Create Agent"** to see the configuration options
3. Note the available settings:
   - Voice selection (TTS providers)
   - STT providers
   - Language settings
   - Custom server URL (this is where we'll point to our LangGraph agent)

**Don't create an agent yet** - we'll do this programmatically in Phase 5.

---

## Step 7: Review Pricing and Usage

1. Go to **Settings** → **Billing**
2. Understand VAPI pricing:
   - Per-minute charges for voice calls
   - STT and TTS costs
   - Monthly commitment options
3. Add a payment method if required
4. Set up usage alerts (recommended)

---

## Step 8: Update .env.local

Add VAPI credentials to your `.env.local` file:

```bash
# VAPI Configuration
VAPI_API_KEY=vapi_xxxxx
VAPI_WEBHOOK_SECRET=xxxxx
VAPI_PHONE_NUMBER_ID=  # Will be set after purchasing phone number in Phase 5
```

---

## Step 9: Test API Connection (Optional)

You can test the API key with a simple curl command:

```bash
curl --request GET \
  --url https://api.vapi.ai/call \
  --header 'Authorization: Bearer vapi_xxxxx'
```

Should return an empty array `[]` or list of calls (if any exist).

---

## Checklist

- [ ] Created VAPI account
- [ ] Generated API key and saved securely
- [ ] Copied webhook secret
- [ ] Explored dashboard interface
- [ ] Understood VAPI's role in our architecture (STT/TTS only)
- [ ] Updated `.env.local` with VAPI_API_KEY
- [ ] Updated `.env.local` with VAPI_WEBHOOK_SECRET
- [ ] Added payment method (if required)
- [ ] Set up usage alerts

---

## Important Notes

### Our Architecture
```
Customer Phone Call
        ↓
    VAPI (STT)
        ↓
    Speech → Text
        ↓
Our Custom Endpoint (/api/vapi-llm)
        ↓
LangGraph Agent (Custom Logic)
        ↓
    MCP Tools
        ↓
    Response Text
        ↓
    VAPI (TTS)
        ↓
Text → Speech
        ↓
    Customer Hears Response
```

### What We'll Build in Phase 5
- Custom webhook endpoint (`/api/vapi-llm`)
- VAPI agent configuration (programmatic)
- Phone number purchase and setup
- Call handling and recording
- Integration with LangGraph agent

---

## What's Next?

After completing this checklist, let me know and I'll:
1. Mark Task 0.3.3 as complete
2. Continue with OpenAI API Setup (Task 0.3.5)
