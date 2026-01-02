# Regrid API Setup Guide

## Task 0.3.6: Regrid Property Data Configuration

Regrid provides property parcel data for lot size lookup - a critical feature for lawn care quoting.

---

## Step 1: Visit Regrid Website

1. Go to https://regrid.com
2. Click **"Sign Up"** or **"Get Started"**

---

## Step 2: Create Account

1. Fill out the registration form:
   - Name
   - Email
   - Company: `GreenAcre AI` (or your company name)
   - Use case: `Lawn care service property lookup`
2. Verify your email address

---

## Step 3: Choose a Plan

Regrid offers different pricing tiers:

### Free Tier (if available)
- Limited API calls per month
- Good for development and testing

### Paid Plans
- **Starter**: ~$50-100/month
- **Professional**: ~$200-500/month
- **Enterprise**: Custom pricing

**Recommendation for MVP**:
- Start with **Free Tier** or **Starter Plan**
- Upgrade as call volume increases

---

## Step 4: Access API Documentation

1. Go to https://regrid.com/api
2. Review the **Parcel API** documentation
3. Key endpoints we'll use:
   - `/parcels` - Search parcels by address
   - `/parcels/{id}` - Get parcel details

---

## Step 5: Generate API Key

1. Log in to your Regrid account
2. Go to **Dashboard** → **API Keys** (or Account Settings)
3. Click **"Create API Key"**
4. Name: `GreenAcreAI Development`
5. Copy the API key
6. Save it securely

**Note**: Regrid API keys typically don't have a specific prefix, they're usually long alphanumeric strings.

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
