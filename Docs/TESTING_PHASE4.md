# Testing Phase 4: Intelligence Layer

This guide explains how to test the Intelligence Layer (Phase 4) of GreenAcre AI, including MCP servers, LangGraph agent, and VAPI integration.

## Prerequisites

Before testing, make sure you have:

### 1. Environment Variables
Ensure these are set in your `.env.local`:

```bash
# Database
DATABASE_URL="your-postgres-url"

# Supabase (for auth)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"

# OpenAI (for LangGraph agent)
OPENAI_API_KEY="your-openai-key"

# Regrid (for property lookup)
REGRID_API_KEY="your-regrid-key"

# VAPI (for voice AI)
VAPI_API_KEY="your-vapi-key"

# Google Calendar OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### 2. Complete Onboarding

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Complete all onboarding steps:
   - Step 1: Business info
   - Step 2: Service areas and pricing
   - Step 3: Google Calendar OAuth
   - Step 4: Phone number provisioning

### 3. Database Setup

Make sure you have:
- A tenant with `onboarding_completed = true`
- Service areas configured
- Pricing tiers configured
- Google Calendar credentials stored

You can verify this in Prisma Studio:
```bash
npx prisma studio
```

## Testing Overview

Phase 4 has three main components to test:

1. **MCP Servers** - Property lookup, calendar, and business logic
2. **LangGraph Agent** - Conversation state machine
3. **VAPI Endpoint** - Integration with VAPI voice AI

## 1. Testing MCP Servers

### Start MCP Servers

In a separate terminal:
```bash
npm run mcp:start
```

You should see:
```
Starting MCP servers...
Started property-lookup MCP server
Started calendar MCP server
Started business-logic MCP server
Property Lookup MCP Server running on stdio
Calendar MCP Server running on stdio
Business Logic MCP Server running on stdio
```

**How It Works:**
- MCP servers run TypeScript directly using `tsx` (no build step needed)
- Each server runs as a separate Node.js child process
- Communication via stdio (stdin/stdout) using MCP protocol (JSON-RPC)
- TypeScript path aliases (`@/lib/...`) work automatically with `tsx`

**Note:** MCP servers run as background processes. Use `Ctrl+C` to stop them.

### Run MCP Tests

In another terminal:
```bash
npm run test:mcp
```

This tests:
- ✅ Property lookup with Regrid API
- ✅ Service area validation
- ✅ Quote calculation based on lot size
- ✅ Generic price range
- ✅ Get available calendar slots
- ✅ Book appointment
- ✅ Cancel appointment

**Important: Regrid API Trial Coverage**

The Regrid API trial (30-day free) only supports **7 sample counties**:
- Marion County, Indiana
- Dallas County, Texas ✅ (used in tests)
- Wilson County, Tennessee
- Durham County, North Carolina
- Fillmore County, Nebraska
- Clark County, Wisconsin
- Gurabo Municipio, Puerto Rico

Test addresses use **Dallas, TX** (1200 Main Street, Dallas, TX 75202) to ensure they work with your trial API key.

See: https://developer.regrid.com/reference/list-of-restricted-counties

**Expected Output:**
```
=== Testing Property Lookup Server ===
✓ Property lookup successful:
{
  "lot_size_sqft": 5000,
  "parcel_id": "ABC123",
  "address": "1200 Main Street, Dallas, TX 75202",
  "zoning": "Commercial"
}

=== Testing Business Logic Server ===
✓ Service area validation successful
✓ Quote calculation successful
✓ Generic price range successful

=== Testing Calendar Server ===
✓ Get available slots successful
✓ Book appointment successful
✓ Cancel appointment successful
```

### Manual MCP Testing

You can also test individual MCP tools using the client:

```typescript
// Test property lookup
import { mcpClient } from './src/lib/mcp/client'

const result = await mcpClient.callTool(
  'property-lookup',
  'lookup_property',
  {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zip: '62701'
  }
)
console.log(result)
```

## 2. Testing LangGraph Agent

### Run Agent Tests

Make sure:
- Dev server is running (`npm run dev`)
- MCP servers are running (`npm run mcp:start`)

Then run:
```bash
npm run test:agent
```

This simulates a complete conversation:
1. 🧑 User initiates conversation
2. 🤖 Assistant greets and asks for address
3. 🧑 User provides address
4. 🤖 Assistant looks up property and provides quote
5. 🧑 User wants to book
6. 🤖 Assistant schedules appointment

**Expected Output:**
```
=== LangGraph Agent Test ===

Testing with tenant: Mike's Lawn Care
Tenant ID: abc-123-def

--- Starting Conversation ---

🧑 User initiates conversation
USER: "Hi, I need a quote"
🤖 ASSISTANT: "Thanks for calling Mike's Lawn Care! I can help you get a quote for lawn mowing service. What's your address?"

📊 State: address_collection

🧑 User provides address
USER: "123 Main St, Springfield, IL 62701"
🤖 ASSISTANT: "Great! I found your property. It's about 5,000 square feet."

📊 State: quoting
📍 Address: 123 Main St, Springfield, IL 62701
🏡 Property: 5000 sqft (parcel: ABC123)

...
```

### Manual Agent Testing

You can test the conversation graph directly:

```typescript
import { conversationGraph } from './src/lib/agents/conversation-graph'

const result = await conversationGraph.invoke({
  messages: [{ role: 'user', content: 'Hi' }],
  tenant_id: 'your-tenant-id',
  call_id: 'test-call-123',
  stage: 'greeting',
  attempts: { address_extraction: 0, property_lookup: 0 }
})

console.log(result.messages[result.messages.length - 1])
```

## 3. Testing VAPI Endpoint

### Get Your Tenant ID

Find your tenant ID in Prisma Studio or from the database:
```sql
SELECT id, business_name FROM tenants WHERE onboarding_completed = true;
```

### Run VAPI Endpoint Tests

```bash
TEST_TENANT_ID=your-tenant-id npm run test:vapi
```

This tests the API endpoint that VAPI will call during voice conversations.

**Expected Output:**
```
=== Testing VAPI LLM Endpoint ===

Testing endpoint: http://localhost:3000/api/vapi-llm
Using tenant ID: abc-123-def

--- Initial greeting ---
USER: "Hi, I need help with lawn mowing"
✓ ASSISTANT: "Thanks for calling Mike's Lawn Care! I can help you get a quote for lawn mowing service. What's your address?"

--- Provide address ---
USER: "123 Main Street, Springfield, IL 62701"
✓ ASSISTANT: "Great! I found your property. It's about 5,000 square feet. Based on your property size, I can offer you weekly lawn mowing service for $45 per visit..."
```

### Manual VAPI Endpoint Testing

You can also test with `curl`:

```bash
curl -X POST http://localhost:3000/api/vapi-llm \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "content": "Hi, I need a quote"
    },
    "call": {
      "id": "test_call_123",
      "customer": {
        "number": "+15551234567"
      }
    },
    "model": {
      "metadata": {
        "tenant_id": "your-tenant-id"
      }
    }
  }'
```

## 4. End-to-End Testing with VAPI

### Configure VAPI Agent

1. Log in to VAPI dashboard: https://dashboard.vapi.ai
2. Go to your agent settings
3. Set custom LLM endpoint to: `https://your-domain.vercel.app/api/vapi-llm`
4. Configure metadata to include `tenant_id`

### Make a Test Call

1. Call your VAPI phone number
2. Have a conversation:
   - "Hi, I need a quote for lawn mowing"
   - Provide your address
   - Accept or decline the quote
   - Schedule an appointment

### Verify Results

Check the database for:
- Conversation record in `conversations` table
- Booking record in `bookings` table
- Google Calendar event created

```bash
npx prisma studio
```

## Troubleshooting

### MCP Servers Won't Start

**Error:** `Address already in use`
- Kill existing MCP processes: `pkill -f "tsx.*mcp"`
- Try starting again: `npm run mcp:start`

**Error:** `REGRID_API_KEY not found`
- Add to `.env.local`: `REGRID_API_KEY=your-key`
- Restart servers

### Property Lookup Fails

**Error:** `Property not found`
- Try a different address (Regrid has limited coverage)
- Check your Regrid API key is valid
- The agent will fall back to generic pricing

### Calendar Operations Fail

**Error:** `Invalid token`
- Re-authenticate Google Calendar in onboarding
- Check `google_calendar_refresh_token` in database
- Verify OAuth credentials in Google Cloud Console

### Agent Tests Timeout

**Error:** `Timeout waiting for response`
- Make sure MCP servers are running
- Check OpenAI API key is valid
- Increase timeout in test script

### VAPI Endpoint Returns 404

**Error:** `Tenant not found`
- Verify `TEST_TENANT_ID` is correct
- Check tenant exists and `onboarding_completed = true`
- Make sure dev server is running

## Running All Phase 4 Tests

To run all tests at once:

```bash
# Start prerequisites
npm run dev          # Terminal 1
npm run mcp:start    # Terminal 2

# Run tests
npm run test:phase4  # Terminal 3
```

This will run:
1. MCP server tests
2. LangGraph agent tests

## Next Steps

After successful testing:

1. ✅ Phase 4 (Intelligence Layer) is complete
2. → Deploy to Vercel/production
3. → Configure production VAPI webhooks
4. → Test with real phone calls
5. → Move to Phase 5 (Analytics & Monitoring)

## Test Coverage Summary

| Component | Test Coverage |
|-----------|--------------|
| Property Lookup MCP | ✅ Full |
| Calendar MCP | ✅ Full |
| Business Logic MCP | ✅ Full |
| Greeting Node | ✅ Full |
| Address Extraction | ✅ Full |
| Property Lookup Node | ✅ Full |
| Quote Calculation | ✅ Full |
| Booking Node | ✅ Full |
| Closing Node | ✅ Full |
| Conversation Graph | ✅ Full |
| VAPI Endpoint | ✅ Full |
| Error Handling | ✅ Partial |
| Edge Cases | ✅ Partial |

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [VAPI Documentation](https://docs.vapi.ai/)
- [Regrid API Docs](https://developer.regrid.com/)
