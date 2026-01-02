# OpenAI API Setup Guide

## Task 0.3.5: OpenAI GPT-4 Configuration

OpenAI powers our LangGraph conversational agent with GPT-4o.

---

## Step 1: Create OpenAI Account

1. Go to https://platform.openai.com/signup
2. Sign up with your email or Google account
3. Verify your email address
4. Complete any required onboarding steps

---

## Step 2: Add Payment Method

**Important**: OpenAI requires a payment method for API access.

1. Go to https://platform.openai.com/account/billing/overview
2. Click **"Add payment method"**
3. Enter your credit/debit card information
4. **Optional but Recommended**: Set up a monthly budget limit
   - Go to **Billing** → **Usage limits**
   - Set **Hard limit** (e.g., $50/month to prevent unexpected charges)
   - Set **Soft limit** for email notifications (e.g., $25/month)

---

## Step 3: Generate API Key

1. Go to https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Settings:
   - **Name**: `GreenAcreAI Development`
   - **Permissions**: **All** (or restrict to specific models if you prefer)
   - **Project**: Default project (or create a new one)
4. Click **"Create secret key"**
5. **Copy the key immediately** (starts with `sk-proj-...` or `sk-...`)
6. You won't be able to see it again!

---

## Step 4: Get Organization ID (Optional)

If you're part of an organization:

1. Go to https://platform.openai.com/account/organization
2. Copy your **Organization ID** (starts with `org-...`)
3. This is optional but helpful for tracking usage by organization

---

## Step 5: Verify Model Access

Ensure you have access to GPT-4o (the model we're using):

1. Go to https://platform.openai.com/account/limits
2. Verify you see **GPT-4o** in the list
3. Check your rate limits:
   - **RPM** (Requests Per Minute)
   - **TPM** (Tokens Per Minute)
   - **RPD** (Requests Per Day)

**Default limits for new accounts:**
- GPT-4o: 500 RPM, 30,000 TPM

If you need higher limits, you can request an increase.

---

## Step 6: Set Up Usage Monitoring

1. Go to https://platform.openai.com/usage
2. Enable email notifications for:
   - Daily usage reports
   - Budget threshold alerts
3. Monitor your usage regularly during development

---

## Step 7: Understand Pricing

GPT-4o Pricing (as of 2026):
- **Input**: ~$2.50 per 1M tokens
- **Output**: ~$10.00 per 1M tokens

**Estimated costs for GreenAcre AI**:
- Average call: 5-10 minutes
- ~3,000-5,000 tokens per call
- **Cost per call**: $0.03 - $0.08
- **100 calls/month**: $3 - $8

**Note**: Actual costs may vary based on conversation complexity.

---

## Step 8: Update .env.local

Add OpenAI credentials to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxx  # or sk-xxxxx
OPENAI_ORG_ID=org-xxxxx  # Optional, only if part of organization
```

---

## Step 9: Test API Connection (Optional)

Test your API key with a simple curl command:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Say hello!"
      }
    ]
  }'
```

Should return a JSON response with GPT-4o's reply.

---

## Step 10: Configure Safety and Moderation (Recommended)

1. Go to https://platform.openai.com/account/safety
2. Review and configure:
   - Content filtering
   - Usage policies
   - Rate limiting preferences

---

## Checklist

- [ ] Created OpenAI account
- [ ] Added payment method
- [ ] Set up usage limits (hard limit and soft limit)
- [ ] Generated API key (sk-proj-... or sk-...)
- [ ] Saved API key securely
- [ ] Copied Organization ID (if applicable)
- [ ] Verified GPT-4o model access
- [ ] Enabled usage monitoring and email notifications
- [ ] Understood pricing structure
- [ ] Updated `.env.local` with OPENAI_API_KEY
- [ ] Updated `.env.local` with OPENAI_ORG_ID (if applicable)
- [ ] Tested API connection (optional)

---

## Model Selection for GreenAcre AI

We're using **GPT-4o** because:
- ✅ Best balance of cost and performance
- ✅ Fast response times (important for voice calls)
- ✅ Strong reasoning for complex lawn care scenarios
- ✅ Excellent at following structured outputs (for our MCP tools)
- ✅ Lower cost than GPT-4 Turbo

---

## What's Next?

After completing this checklist, let me know and I'll:
1. Mark Task 0.3.5 as complete
2. Continue with Regrid API Setup (Task 0.3.6)
