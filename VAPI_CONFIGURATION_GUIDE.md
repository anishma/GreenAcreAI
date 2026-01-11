# VAPI Configuration Guide

## Environment Variables for Vercel Deployment

### 1. `VAPI_WEBHOOK_SECRET` (Optional but Recommended)

**What it is:** A credential-based authentication secret to verify webhook requests from VAPI.

**Where to find it:**

#### Option A: Using Custom Credentials (Modern Approach)
1. Navigate to: **https://dashboard.vapi.ai/settings** (Organization Settings)
2. Click on **"Custom Credentials"**
3. Click **"Create New Credential"**
4. Select **"Bearer Token"**
5. Configure:
   - **Header Name:** `X-Vapi-Secret`
   - **Token:** Generate a secure random string (e.g., `openssl rand -hex 32`)
   - **Include Bearer Prefix:** `Disabled`
6. Click **"Create"**
7. **IMPORTANT:** Copy the credential ID (format: `cred_abc123`) - you'll need this in VAPI dashboard
8. **CRITICAL:** Save your secret token NOW - it cannot be viewed later after creation

**Store in Vercel:**
```bash
VAPI_WEBHOOK_SECRET=your_secure_random_string_here
```

#### Option B: Legacy Approach (If Available)
Some VAPI accounts may have a webhook secret visible at:
- **https://dashboard.vapi.ai/settings/integrations**
- Look for "HMAC Authentication" or "Webhook Secret"

**Security Note:**
- Once created, secrets are encrypted in VAPI and cannot be viewed again
- Store your secret securely in a password manager
- Never commit secrets to version control

---

### 2. `VAPI_PHONE_NUMBER_ID`

**What it is:** The UUID identifier for your registered VAPI phone number.

**Format:** UUID string (e.g., `123e4567-e89b-12d3-a456-426614174000`)

**NOT to be confused with:**
- The actual phone number string (e.g., `+15551234567`)
- This is the **internal VAPI ID**, not the phone number itself

**Where to find it:**

1. Navigate to: **https://dashboard.vapi.ai/phone-numbers**
2. Click on your phone number
3. In the URL bar or phone number details, you'll see the ID
4. **OR** Use the VAPI API:

```bash
curl -X GET "https://api.vapi.ai/phone-number" \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY"
```

Response:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",  // ← This is VAPI_PHONE_NUMBER_ID
    "number": "+15551234567",                       // ← This is the actual phone number
    "provider": "twilio",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Store in Vercel:**
```bash
VAPI_PHONE_NUMBER_ID=123e4567-e89b-12d3-a456-426614174000
```

---

### 3. Other VAPI Environment Variables

```bash
# VAPI API Key (for making API calls to VAPI)
VAPI_API_KEY=your_vapi_api_key_here

# VAPI Assistant ID (if you have a specific assistant)
VAPI_ASSISTANT_ID=your_assistant_id_here

# Organization ID (if needed for multi-tenant setups)
VAPI_ORG_ID=your_org_id_here
```

---

## VAPI Dashboard Configuration

### Custom LLM Endpoint Setup

1. Navigate to: **https://dashboard.vapi.ai/assistants**
2. Click on your assistant
3. Go to **"Model"** section
4. Select **"Custom LLM"**
5. Enter URL: `https://greenacreai.vercel.app/api/vapi-llm`
   - VAPI will automatically append `/chat/completions`
   - Final endpoint: `https://greenacreai.vercel.app/api/vapi-llm/chat/completions` ✅

### Webhook (Server URL) Setup

#### Organization-Wide (Recommended)
1. Navigate to: **https://dashboard.vapi.ai/vapi-api**
2. Find **"Server URL"** field
3. Enter: `https://greenacreai.vercel.app/api/webhooks/vapi`
4. If using authentication:
   - Select your credential from dropdown (the `cred_abc123` from earlier)
   - OR enter your secret directly (legacy)

#### Per-Assistant
1. Navigate to: **https://dashboard.vapi.ai/assistants**
2. Click on your assistant
3. Click **"Advanced"** tab
4. Find **"Server URL"** field
5. Enter: `https://greenacreai.vercel.app/api/webhooks/vapi`
6. Configure authentication if needed

---

## Key Differences: Phone Number ID vs Phone Number String

| Context | Use Phone Number ID (UUID) | Use Phone Number String (E.164) |
|---------|---------------------------|--------------------------------|
| **Making Outbound Calls** | ✅ `phoneNumberId` field | The recipient's number in `customer.number` |
| **Environment Variables** | ✅ `VAPI_PHONE_NUMBER_ID` | Store separately if needed |
| **Database Storage** | ✅ `vapi_phone_number_id` | ✅ `phone_number` (for display) |
| **VAPI API Calls** | ✅ References your VAPI number | Customer/recipient numbers |

**Example API Call:**
```javascript
// Create outbound call
fetch('https://api.vapi.ai/call', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_VAPI_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumberId: '123e4567-e89b-12d3-a456-426614174000', // Your VAPI number ID
    customer: {
      number: '+15551234567' // The customer's phone number (E.164 format)
    },
    assistantId: 'your_assistant_id'
  })
})
```

---

## Metadata Passing to Custom LLM

VAPI can pass custom metadata to your LLM endpoint in multiple ways:

### Method 1: Headers (Recommended)
Configure your assistant to send custom headers:
- `x-vapi-call-id`: The VAPI call ID
- `x-vapi-customer-number`: Customer phone number
- Custom headers you define

### Method 2: System Message
Inject metadata into the system message:
```
You are a helpful assistant for lawn care quotes.

tenant_id: tenant_abc123
call_id: call_xyz789
customer_phone: +15551234567
```

Our code at `src/app/api/vapi-llm/chat/completions/route.ts:42-60` handles both methods.

---

## Testing Your Configuration

### 1. Test Custom LLM Endpoint
```bash
curl -X POST "https://greenacreai.vercel.app/api/vapi-llm/chat/completions" \
  -H "Content-Type: application/json" \
  -H "x-vapi-call-id: test_call_123" \
  -d '{
    "model": "custom",
    "messages": [
      {
        "role": "system",
        "content": "tenant_id: test_tenant call_id: test_call_123"
      },
      {
        "role": "user",
        "content": "Hello, I need a lawn care quote"
      }
    ],
    "temperature": 0.7
  }'
```

Expected response format:
```json
{
  "id": "chatcmpl-test_call_123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "custom-langgraph",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'd be happy to help you get a lawn care quote..."
      },
      "finish_reason": "stop"
    }
  ]
}
```

### 2. Test Webhook Endpoint
```bash
curl -X POST "https://greenacreai.vercel.app/api/webhooks/vapi" \
  -H "Content-Type: application/json" \
  -H "x-vapi-signature: your_secret" \
  -d '{
    "type": "call-start",
    "call": {
      "id": "test_call_123",
      "phoneNumber": {
        "id": "phone_123",
        "number": "+15551234567"
      },
      "customer": {
        "number": "+15559876543"
      },
      "status": "in-progress",
      "startedAt": "2024-01-01T12:00:00.000Z"
    }
  }'
```

---

## Troubleshooting

### Issue: VAPI can't reach my custom LLM endpoint
- ✅ Verify URL in dashboard: `https://greenacreai.vercel.app/api/vapi-llm` (no trailing slash)
- ✅ Check Vercel deployment logs for errors
- ✅ Ensure route file exists at: `src/app/api/vapi-llm/chat/completions/route.ts`

### Issue: Getting "Missing tenant_id" errors
- ✅ Configure VAPI assistant to pass metadata in system message or headers
- ✅ Check logs to see what VAPI is sending: `console.log('[VAPI LLM] Request body:', body)`

### Issue: Webhook signature verification failing
- ✅ Ensure `VAPI_WEBHOOK_SECRET` in Vercel matches the credential in VAPI dashboard
- ✅ Check header name matches: `X-Vapi-Secret` or `x-vapi-signature`

### Issue: "No response generated" errors
- ✅ Check LangGraph agent is running properly
- ✅ Verify Prisma client is initialized
- ✅ Check conversation state is being created/loaded correctly

---

## Additional Resources

- **VAPI Dashboard:** https://dashboard.vapi.ai
- **VAPI API Docs:** https://docs.vapi.ai
- **VAPI Custom LLM Guide:** https://docs.vapi.ai/customization/custom-llm/using-your-server
- **VAPI Server URLs Guide:** https://docs.vapi.ai/server-url/setting-server-urls
