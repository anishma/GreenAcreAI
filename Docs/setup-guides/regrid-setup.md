# Regrid API Setup Guide

## Task 0.3.6: Regrid Property Data Configuration

Regrid provides property parcel data for lot size lookup - a critical feature for lawn care quoting.

---

## Step 1: Visit Regrid Website

1. Go to https://regrid.com
2. Look for **"Sign Up"**, **"Get Started"**, or **"Try API"** button
3. You may also see an option for **"API Sandbox"** for testing

---

## Step 2: Create Account and Start Trial

1. Click the sign-up option
2. Fill out the registration form (typically includes):
   - Name
   - Email address
   - Company name: `GreenAcre AI` (or your company name)
   - Use case or industry: `Lawn care services` or `Property data lookup`
3. Verify your email address
4. Complete any onboarding steps

**Note**: Regrid offers a **30-day free trial** for their API Sandbox. This is perfect for development and testing.

---

## Step 3: Choose a Plan

After your trial, you'll need to select a plan:

### Free Trial / Sandbox
- 30-day trial period
- Limited API calls
- Good for development and testing
- **Start here for MVP development**

### Monthly Plans
- Visit https://app.regrid.com/api/plans to see current pricing
- Plans vary based on:
  - Number of API calls per month
  - Support level
  - Additional features
- **Typical range**: $50-500/month depending on usage

### Enterprise
- Custom pricing for high-volume needs
- Contact Regrid team for quote

**Recommendation for MVP**:
- Start with **Free 30-day trial**
- Monitor your API usage during development
- Upgrade to paid plan when ready to launch

---

## Step 4: Access API Documentation

1. After signing up, look for **"API Documentation"**, **"Developer Docs"**, or **"Support"**
2. You may also find it at:
   - https://support.regrid.com (Support Center)
   - https://support.regrid.com/api/section/interactive-api-sandbox (Interactive Sandbox)
3. Review the **Parcel API** documentation
4. Key endpoints we'll use:
   - Parcel search by address
   - Parcel details by ID
5. Look for the **OpenAPI specification** (downloadable blueprint)

**Note**: The exact documentation location may vary. Check your account dashboard or email for links.

---

## Step 5: Generate API Key

1. Log in to your Regrid account (likely at https://app.regrid.com)
2. Look for **"API Keys"**, **"Credentials"**, or **"Settings"** section
   - This might be under Dashboard, Account, or Developer sections
3. Find the option to **"Create"** or **"Generate"** an API key
4. If prompted, give it a name: `GreenAcreAI Development`
5. Copy the API key immediately
6. Save it securely

**Note**: Regrid API keys are typically long alphanumeric strings without a specific prefix. The exact format and location may vary based on your account type.

---

## Step 6: Understand the API Response

Example API call for property lookup:

```bash
curl "https://app.regrid.com/api/v2/parcels?address=123+Main+St,+Austin,+TX+78701" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Example response (simplified):
```json
{
  "parcels": [
    {
      "id": "12345",
      "address": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "zip": "78701",
      "ll_gisacre": 0.25,  // Lot size in acres
      "ll_gissqft": 10890,  // Lot size in square feet
      "owner": "John Doe",
      "zoning": "Residential"
    }
  ]
}
```

**Key fields for our use**:
- `ll_gissqft` - Lot size in square feet (most important)
- `ll_gisacre` - Lot size in acres
- `address`, `city`, `state`, `zip` - Address validation

---

## Step 7: Understand Rate Limits

Check your plan's rate limits:
- Requests per minute
- Requests per month
- Concurrent requests

**Typical limits**:
- Free tier: 100-1000 requests/month
- Starter: 5,000-10,000 requests/month

---

## Step 8: Test the API

Test your API key with a sample address:

```bash
curl "https://app.regrid.com/api/v2/parcels?address=1600+Pennsylvania+Ave+NW,+Washington,+DC+20500" \
  -H "Authorization: Bearer YOUR_REGRID_API_KEY"
```

Should return parcel data for the White House!

---

## Step 9: Update .env.local

Add Regrid credentials to your `.env.local` file:

```bash
# Regrid API Configuration
REGRID_API_KEY=your-regrid-api-key-here
```

---

## Step 10: Plan for Production

For production, consider:

1. **Caching Strategy**:
   - Cache property lookups in Supabase
   - Avoid redundant API calls for the same address
   - Save costs and improve response times

2. **Error Handling**:
   - Handle addresses not found
   - Fallback to manual entry if API fails
   - Provide clear error messages to customers

3. **Rate Limiting**:
   - Implement request throttling
   - Queue requests if needed
   - Monitor usage to avoid overage charges

---

## Checklist

- [ ] Created Regrid account
- [ ] Chose appropriate pricing plan (Free/Starter recommended for MVP)
- [ ] Generated API key
- [ ] Saved API key securely
- [ ] Reviewed Parcel API documentation
- [ ] Understood response structure (ll_gissqft field)
- [ ] Checked rate limits for your plan
- [ ] Tested API with sample address
- [ ] Updated `.env.local` with REGRID_API_KEY
- [ ] Noted monthly request limit

---

## How We'll Use Regrid in GreenAcre AI

### Integration Flow:
```
1. Customer provides address via voice
2. LangGraph agent extracts address components
3. MCP Property Lookup Server calls Regrid API
4. Regrid returns lot size (square feet)
5. Agent uses lot size for quote calculation
6. Response sent back to customer
```

### Example Conversation:
```
Customer: "I need a quote for lawn mowing at 123 Oak Street"
Agent: "Let me look up your property... I see you have about
        10,000 square feet. Based on that, a one-time mowing
        would be $85, or we offer a monthly plan at $300."
```

---

## Alternative: Manual Entry Fallback

If Regrid API fails or address not found:
- Agent asks: "I couldn't find your property automatically.
               Do you know your lot size in square feet?"
- Customer provides manual input
- Agent proceeds with quote

---

## What's Next?

After completing this checklist, let me know and I'll:
1. Mark Task 0.3.6 as complete
2. Continue with Google Cloud Console Setup (Task 0.3.7)
