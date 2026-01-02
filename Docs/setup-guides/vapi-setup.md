# VAPI Account Setup Guide

## Task 0.3.3: VAPI Voice Infrastructure Configuration

VAPI provides Speech-to-Text (STT) and Text-to-Speech (TTS) for our voice AI platform.

---

## Step 1: Create VAPI Account

1. Go to https://vapi.ai
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with your email or Google account
4. Verify your email address

---

## Step 2: Access Dashboard

1. Log in to https://dashboard.vapi.ai
2. You'll be taken to the main dashboard

---

## Step 3: Generate API Key

1. Click on **"API Keys"** in the sidebar (or Settings → API Keys)
2. Click **"Create API Key"**
3. Name: `GreenAcreAI Development`
4. Copy the API key (starts with `vapi_...`)
5. **Important**: Save this immediately - you won't see it again!

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
- VAPI provides a webhook secret for signature verification
- Go to **Settings** → **Webhooks**
- Copy the **Webhook Secret**
- Save this for `.env.local`

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
