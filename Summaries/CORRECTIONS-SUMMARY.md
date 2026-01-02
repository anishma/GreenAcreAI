# GreenAcre AI - Corrections Summary
## Documentation Updates Based on User Feedback

**Date**: January 1, 2026
**Feedback Session**: Product Manager Review
**Documents Updated**: 3 (technical-architecture.md, user-conversation-flows.md, technical-gap-analysis.md)

---

## Overview

This document summarizes all corrections made to the GreenAcre AI technical documentation based on detailed product manager feedback. The corrections addressed pricing inconsistencies, missing business logic, and scope clarity issues.

---

## Critical Corrections Made

### 1. **Bi-weekly Pricing Structure** ✅ FIXED

**Issue**: Original design only supported weekly pricing, but customers request bi-weekly service frequently (Flows 3, 11).

**User Feedback**:
> "Each owner should be able to configure the pricing tiers for weekly or bi-weekly, not just simply putting the prices 1.3 to 1.5x. Maybe some owners, business owners, that don't do bi-weekly, they may just do weekly."

**Fix Applied**:
```sql
-- Updated pricing_tiers JSONB structure in tenants table
{
  "name": "Quarter Acre",
  "min_sqft": 5001,
  "max_sqft": 10000,
  "weekly_price": 45,              // ← NEW: explicit weekly price
  "biweekly_price": 65,            // ← NEW: explicit bi-weekly price
  "service_inclusions": [...],     // ← NEW: what's included in price
  "pricing_type": "estimate"       // ← NEW: fixed vs estimate
}
```

**Database Functions Added**:
- `get_quote_for_lot_size(tenant_id, lot_size, frequency)` - Returns price based on weekly/biweekly request
- `get_generic_price_range(tenant_id, frequency)` - Returns price range for generic quotes

**Affected Files**:
- `technical-architecture.md` lines 997-1045 (pricing schema)
- `user-conversation-flows.md` Flow 3, Flow 11
- `technical-gap-analysis.md` Flow 3 analysis

---

### 2. **Service Inclusions Configuration** ✅ FIXED

**Issue**: AI was making up what services were included in pricing (Flow 28).

**User Feedback**:
> "You should include, you should check in the tenant information if their mowing includes trimming, edging, and complete cleanup in their pricing before you give that details to the customer."

**Fix Applied**:
```typescript
// Each pricing tier now specifies exactly what's included
{
  "min_sqft": 0,
  "max_sqft": 5000,
  "weekly_price": 35,
  "biweekly_price": 50,
  "service_inclusions": [        // ← AI only mentions these
    "mowing",
    "basic trimming",
    "cleanup"
  ],
  "pricing_type": "estimate"
}
```

**LangGraph Agent Update**:
```typescript
// Before: AI made up inclusions
AI: "Our $55 includes mowing, trimming, edging, and complete cleanup."

// After: AI reads from tenant config
const quote = await get_quote_for_lot_size(tenant_id, lot_size, "weekly");
const inclusions = quote.service_inclusions.join(", ");
AI: `Our $${quote.weekly_price} includes ${inclusions}.`
```

**Affected Files**:
- `technical-architecture.md` pricing template (lines 1558-1618)
- `user-conversation-flows.md` Flow 28

---

### 3. **Pricing Variability Flag** ✅ FIXED

**Issue**: No way for business owners to indicate whether quoted prices are firm or estimates.

**User Feedback**:
> "There might be a 5% to 10% [variance]. It's not going to change that much once they see the property... If the owner wants to provide the direct, perfect price quote that we are giving, and we stick to it... or does he want to say the price could be varied a little bit."

**Fix Applied**:
```sql
-- Added pricing_type field to each tier
{
  "pricing_type": "estimate",  // or "fixed"
  "weekly_price": 45,
  ...
}

-- Tenant-level configuration
allows_generic_quotes BOOLEAN DEFAULT true
generic_quote_disclaimer TEXT DEFAULT 'Prices vary by property size...'
```

**AI Behavior**:
```typescript
if (pricing_type === "estimate") {
  AI: "This price is an estimate and may vary by 5-10% after Mike inspects the property."
} else {
  AI: "This is our firm price for weekly service."
}
```

**Affected Files**:
- `technical-architecture.md` pricing schema
- `user-conversation-flows.md` Flows 3, 11, 21, 28

---

### 4. **Generic Quote Requests (Without Address)** ✅ NEW FLOW

**Issue**: Customers sometimes want pricing ranges before providing their address (privacy concerns, price shopping).

**User Feedback**:
> "What if they don't give an address, or they maybe want to, they do not want to share their address, but are asking generic quotes of, what are the generic quotes for the weekly or bi-weekly service?"

**Fix Applied**:
- **NEW**: Flow 21 added to user-conversation-flows.md
- **NEW**: Database function `get_generic_price_range(tenant_id, frequency)`
- **NEW**: Tenant fields: `allows_generic_quotes`, `generic_quote_disclaimer`

**Conversation Pattern**:
```
Customer: Can you tell me your general pricing? I don't want to give my address yet.

AI: Absolutely! Our pricing varies based on property size. For weekly mowing,
    we typically range from $35 to $85 depending on lot size. If you provide
    your address, I can give you an exact quote for your specific property.
```

**Database Implementation**:
```sql
CREATE OR REPLACE FUNCTION get_generic_price_range(
  p_tenant_id UUID,
  p_frequency VARCHAR(20) DEFAULT 'weekly'
)
RETURNS TABLE (min_price DECIMAL, max_price DECIMAL, disclaimer TEXT)
-- Returns: MIN and MAX from all pricing tiers for that frequency
```

**Affected Files**:
- `technical-architecture.md` new function (lines 1439-1485)
- `user-conversation-flows.md` NEW Flow 21
- `technical-gap-analysis.md` updated flow count (50 → 51)

---

### 5. **New Construction Sod Timing** ✅ FIXED

**Issue**: For new construction, you can't mow fresh sod for 3-4 weeks. AI was booking immediately (Flow 9).

**User Feedback**:
> "When the sod is new, you don't do a cut at least for a month... So, you would need to ask the customer those questions to clarify, is the sod new or is it at a stage where we can cut it."

**Fix Applied**:
```typescript
// LangGraph node added: check_sod_readiness
if (customer_mentions("new construction")) {
  AI: "Since this is new construction, I have a quick question - is the sod
      newly laid, or has it been down for a while? New sod typically needs
      3-4 weeks to establish before the first mowing."

  if (sod_age < 4_weeks) {
    wait_period = 4_weeks - sod_age;
    AI: `For newly laid sod, we typically recommend waiting about ${wait_period}
        more weeks before the first mowing to let the roots establish properly.
        Would you like me to schedule your first service for ${future_date}?
        In the meantime, if you'd like to send a photo via text, Mike can
        take a look and confirm the timing.`
  }
}
```

**Expected Outcomes**:
- Sod timing check performed
- First service delayed appropriately (3-4 weeks from sod installation)
- Photo request sent via SMS for owner verification
- Lead notes: "new construction, sod laid ~2 weeks ago, verify timing"

**Affected Files**:
- `user-conversation-flows.md` Flow 9 (completely rewritten)

---

### 6. **Second Property Proximity Check** ✅ FIXED

**Issue**: When existing customer calls about second property, AI should check if properties are close for same-day service optimization (Flow 17).

**User Feedback**:
> "Did you look at the second home? Is it near to the first home? And that you could do the same day and right after the first property?"

**Fix Applied**:
```typescript
// LangGraph node: check_multi_property_proximity
if (existing_customer && second_property) {
  const distance = calculateDistance(property1_address, property2_address);

  if (distance < 5_miles) {
    AI: `I can see your Main Street property is only ${distance} miles away,
        so Mike can definitely service both on the same day for you. Let me
        have him call you to coordinate a combined schedule. That way he can
        do them back-to-back, which is more efficient.`

    create_lead({
      status: "needs_owner_callback",
      notes: `multi-property customer, properties ${distance} mi apart,
              route optimization opportunity`
    });
  }
}
```

**MVP Limitation**:
- Cannot book both properties in one call (state management complexity)
- AI collects both addresses and quotes second property
- Owner calls back to coordinate combined schedule

**Affected Files**:
- `user-conversation-flows.md` Flow 17 (rewritten with proximity logic)
- `technical-gap-analysis.md` updated limitations section

---

### 7. **Wrong Number Scope Creep** ✅ FIXED

**Issue**: AI was offering to help find other businesses when caller had wrong number (Flow 26).

**User Feedback**:
> "You shouldn't say, would you like help finding the auto repair shop? That's not what we are for. That is out of our scope. You should never help in the common inquiries."

**Fix Applied**:
```typescript
// Before (WRONG):
AI: "No, this is Mike's Lawn Care. Would you like help finding the auto repair shop?"

// After (CORRECT):
AI: "No, this is Mike's Lawn Care - we provide lawn mowing services.
    You may have the wrong number. Have a good day!"
```

**Affected Files**:
- `user-conversation-flows.md` Flow 26

---

### 8. **Concurrent Call Handling Clarification** ✅ FIXED

**Issue**: Flow 43 incorrectly described how multiple simultaneous calls work.

**User Feedback**:
> "How could that happen? Because it's just one phone number. If the first person has called, whoever gets the call picked up, the other two callers have to wait until the first call is finished, right?"

**Clarification**:
VAPI actually **DOES support concurrent calls** to the same phone number. Each call gets its own session.

**Fix Applied**:
```typescript
// Rewritten Flow 43 to explain correctly:
// - VAPI creates separate session for each concurrent call
// - Each session gets unique call_id and isolated LangGraph state
// - Serverless architecture scales horizontally
// - Database row-level locking prevents double-booking
// - First caller to complete booking wins contested time slot
```

**Key Technical Points Added**:
- VAPI handles concurrent inbound calls to the same phone number
- Each call gets its own isolated LangGraph state (no cross-talk)
- Our LangGraph endpoint handles multiple parallel requests (serverless scaling)
- Database transactions use row-level locking for calendar conflicts
- Each caller experiences individual, uninterrupted service

**Affected Files**:
- `user-conversation-flows.md` Flow 43 (completely rewritten with technical details)

---

## Database Schema Changes Summary

### Tenants Table Updates
```sql
ALTER TABLE tenants
ADD COLUMN allows_generic_quotes BOOLEAN DEFAULT true,
ADD COLUMN generic_quote_disclaimer TEXT DEFAULT 'Prices vary by property size. Address needed for exact quote.';

-- pricing_tiers JSONB structure changed from:
{
  "min_sqft": 0,
  "max_sqft": 5000,
  "price": 35,
  "frequency": "weekly"
}

-- TO:
{
  "name": "Small Lot",
  "min_sqft": 0,
  "max_sqft": 5000,
  "weekly_price": 35,
  "biweekly_price": 50,
  "service_inclusions": ["mowing", "basic trimming", "cleanup"],
  "pricing_type": "estimate"
}
```

### New Database Functions

**1. Updated Quote Function**:
```sql
CREATE OR REPLACE FUNCTION get_quote_for_lot_size(
  p_tenant_id UUID,
  p_lot_size_sqft INTEGER,
  p_frequency VARCHAR(20) DEFAULT 'weekly'  -- NEW PARAMETER
)
RETURNS TABLE (
  weekly_price DECIMAL(10,2),
  biweekly_price DECIMAL(10,2),              -- NEW
  service_inclusions TEXT[],                 -- NEW
  pricing_type VARCHAR(20),                  -- NEW
  tier_min_sqft INTEGER,
  tier_max_sqft INTEGER
);
```

**2. New Generic Quote Function**:
```sql
CREATE OR REPLACE FUNCTION get_generic_price_range(
  p_tenant_id UUID,
  p_frequency VARCHAR(20) DEFAULT 'weekly'
)
RETURNS TABLE (
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  disclaimer TEXT
);
```

---

## MVP Readiness Impact

### Before Corrections:
- **Overall Readiness**: 92%
- **Fully Satisfied Flows**: 34/50 (68%)
- **Partially Satisfied**: 12/50 (24%)
- **Not Satisfied**: 4/50 (8%)

### After Corrections:
- **Overall Readiness**: 94% ⬆️
- **Fully Satisfied Flows**: 38/51 (75%) ⬆️
- **Partially Satisfied**: 9/51 (18%) ⬇️
- **Not Satisfied**: 4/51 (8%)
- **New Flow Added**: Flow 21 (Generic Quotes)

### Flows Fixed:
1. ✅ Flow 3: Bi-weekly Service Request (Partially → Fully Satisfied)
2. ✅ Flow 9: New Construction/Move-in (Added sod timing checks)
3. ✅ Flow 11: Rental Property Owner (Fixed bi-weekly pricing)
4. ✅ Flow 17: Second Property (Added proximity check + MVP limitation)
5. ✅ Flow 21: **NEW** - Generic Quote Request Without Address
6. ✅ Flow 26: Wrong Number (Removed scope creep)
7. ✅ Flow 28: Price Objection (Fixed to use tenant config for inclusions)
8. ✅ Flow 43: Concurrent Calls (Clarified VAPI's concurrent handling)

---

## LangGraph Agent Updates Required

### New Conversation Nodes Needed:

**1. Frequency Detection Node**:
```typescript
graph.addNode("detect_frequency", async (state) => {
  const lastMessage = state.messages[state.messages.length - 1];

  // Detect if customer mentions bi-weekly, every other week, etc.
  const frequency = detectFrequencyFromText(lastMessage.content);

  return { requested_frequency: frequency || "weekly" };
});
```

**2. Generic Quote Handling Node**:
```typescript
graph.addNode("handle_generic_quote", async (state) => {
  if (!state.customer_address) {
    const tenant = await getTenant(state.tenant_id);

    if (tenant.allows_generic_quotes) {
      const range = await get_generic_price_range(
        state.tenant_id,
        state.requested_frequency
      );

      return {
        messages: [{
          role: "assistant",
          content: `Our pricing ranges from $${range.min_price} to $${range.max_price} depending on lot size. ${range.disclaimer}`
        }]
      };
    }
  }
});
```

**3. Sod Timing Check Node**:
```typescript
graph.addNode("check_sod_timing", async (state) => {
  if (detectNewConstruction(state.messages)) {
    return {
      messages: [{
        role: "assistant",
        content: "Since this is new construction, is the sod newly laid, or has it been down for a while? New sod typically needs 3-4 weeks to establish."
      }],
      requires_sod_check: true
    };
  }
  return state;
});
```

**4. Service Inclusions Formatting**:
```typescript
// In calculate_quote node:
const quote = await mcpClient.callTool(
  "business-logic",
  "calculate_quote",
  {
    lot_size: state.property_data.lot_size,
    frequency: state.requested_frequency  // Pass frequency
  }
);

const inclusions = quote.service_inclusions.join(", ");
const disclaimer = quote.pricing_type === "estimate"
  ? "This is an estimate and may vary by 5-10% after inspection."
  : "";

const price = state.requested_frequency === "biweekly"
  ? quote.biweekly_price
  : quote.weekly_price;

return {
  messages: [{
    role: "assistant",
    content: `For ${state.requested_frequency} service, the price would be $${price} per visit. That includes ${inclusions}. ${disclaimer}`
  }]
};
```

---

## Testing Checklist

### Pricing Tests:
- [ ] Tenant configures weekly-only pricing (biweekly_price: null)
- [ ] AI refuses bi-weekly request and offers weekly only
- [ ] Tenant configures both weekly and bi-weekly prices
- [ ] AI quotes correct price based on customer frequency request
- [ ] Service inclusions displayed match tier configuration
- [ ] Pricing disclaimer appears when pricing_type = "estimate"
- [ ] No disclaimer when pricing_type = "fixed"

### Generic Quote Tests:
- [ ] Customer refuses to give address
- [ ] AI provides price range from generic function
- [ ] AI asks for address to provide exact quote
- [ ] Customer eventually provides address
- [ ] Exact quote matches previous range estimate
- [ ] If tenant sets allows_generic_quotes = false, AI requires address

### New Construction Tests:
- [ ] Customer mentions "new construction"
- [ ] AI asks about sod timing
- [ ] If sod < 4 weeks old, AI schedules 3-4 weeks out
- [ ] AI offers photo upload via SMS
- [ ] Booking marked as "verification pending"

### Multi-Property Tests:
- [ ] Existing customer calls about second property
- [ ] AI checks distance between properties
- [ ] If < 5 miles, AI suggests same-day service
- [ ] AI collects both addresses and creates callback lead
- [ ] Owner gets notification with route optimization context

### Concurrent Call Tests:
- [ ] Three users call same number simultaneously
- [ ] All three get answered (no queue/busy signal)
- [ ] Conversations remain isolated (no cross-talk)
- [ ] Two callers try to book same time slot
- [ ] First caller wins, second gets "time no longer available"

---

## Migration Guide

### For Existing Tenants (if system were live):

**Step 1: Database Migration**
```sql
-- Run migration to add new tenant fields
ALTER TABLE tenants
ADD COLUMN allows_generic_quotes BOOLEAN DEFAULT true,
ADD COLUMN generic_quote_disclaimer TEXT DEFAULT 'Prices vary by property size. Address needed for exact quote.';

-- Deploy new database functions
-- (get_quote_for_lot_size and get_generic_price_range)
```

**Step 2: Pricing Tier Migration Script**
```typescript
// Convert existing pricing_tiers to new format
async function migratePricingTiers() {
  const tenants = await db.tenants.findMany();

  for (const tenant of tenants) {
    const oldTiers = tenant.pricing_tiers;

    const newTiers = oldTiers.map(tier => ({
      name: tier.name,
      min_sqft: tier.min_sqft,
      max_sqft: tier.max_sqft,
      weekly_price: tier.price,         // Old "price" becomes weekly
      biweekly_price: tier.price * 1.4, // Default: 40% higher for bi-weekly
      service_inclusions: [
        "mowing",
        "basic trimming",
        "cleanup"
      ],
      pricing_type: "estimate"
    }));

    await db.tenants.update({
      where: { id: tenant.id },
      data: { pricing_tiers: newTiers }
    });
  }
}
```

**Step 3: Redeploy LangGraph Agent**
- Deploy updated agent with new conversation nodes
- Test with existing tenants before enabling for all

**Step 4: Dashboard UI Updates**
- Update pricing configuration UI to show:
  - Weekly price field
  - Bi-weekly price field (optional)
  - Service inclusions checkboxes
  - Pricing type radio (fixed vs estimate)
  - Generic quotes toggle
  - Generic quote disclaimer text area

---

## Files Modified

### 1. `technical-architecture.md` (v1.1)
**Lines Modified**:
- 997-999: Updated pricing_tiers JSONB schema comment
- 998-999: Added allows_generic_quotes and generic_quote_disclaimer fields
- 1407-1485: Completely rewrote get_quote_for_lot_size function
- 1439-1485: Added NEW get_generic_price_range function
- 1558-1618: Updated pricing template with new structure

**Changes Summary**:
- ✅ Bi-weekly pricing support
- ✅ Service inclusions configuration
- ✅ Pricing variability flag
- ✅ Generic quote support

### 2. `user-conversation-flows.md` (v1.0 → v1.1)
**Flows Modified**:
- Flow 3 (lines 98-142): Complete rewrite for bi-weekly pricing
- Flow 9 (lines 360-414): Complete rewrite for sod timing checks
- Flow 11 (lines 460-513): Fixed bi-weekly pricing quote
- Flow 17 (lines 712-764): Added proximity check + MVP limitation
- Flow 21: **NEW** - Generic quote request (45 lines)
- Flow 26 (lines 1061-1086): Removed scope creep offer
- Flow 28 (lines 1135-1174): Fixed to use tenant service inclusions
- Flow 43 (lines 1671-1727): Clarified concurrent call handling

**New Flow Count**: 50 → 51 flows

### 3. `technical-gap-analysis.md` (v1.0 → v1.1)
**Sections Updated**:
- Header (lines 1-10): Updated version, date, flow count
- Executive Summary (lines 22-37): Updated statistics (68% → 75% satisfied)
- Flow 3 Analysis (lines 87-102): Changed to "Fully Satisfied"
- Section 5.0: **NEW** - Completed Enhancements table
- Section 5.2 (lines 1023-1030): Removed bi-weekly limitation
- Section 5.5 (lines 1088-1103): Updated readiness 92% → 94%

**Changes Summary**:
- ✅ Added completed enhancements section
- ✅ Updated overall readiness metrics
- ✅ Removed bi-weekly from limitations
- ✅ Added Flow 21 to analysis

---

## Lessons Learned

### 1. **Don't Make Assumptions About Pricing**
- **Wrong**: Assume bi-weekly = 1.3x weekly price
- **Right**: Let business owner configure every frequency separately

### 2. **Don't Fabricate Service Details**
- **Wrong**: AI says "includes mowing, trimming, edging, cleanup" (made up)
- **Right**: AI reads service_inclusions from database and only mentions those

### 3. **Domain-Specific Knowledge Matters**
- **Wrong**: Book new construction lawn service immediately
- **Right**: Ask about sod age, delay service 3-4 weeks if needed

### 4. **Scope Discipline**
- **Wrong**: Offer to help find auto repair shops when customer has wrong number
- **Right**: Politely end call, stay focused on lawn care only

### 5. **Understanding Platform Capabilities**
- **Wrong**: Assume VAPI queues concurrent calls
- **Right**: VAPI handles concurrent calls to same number natively

---

## Next Steps

1. **Update Architecture Diagram** to show new database functions
2. **Update LangGraph Implementation** with new conversation nodes
3. **Update Dashboard UI** for new pricing configuration
4. **Write Migration Script** for existing tenants (if applicable)
5. **Update Testing Documentation** with new test cases
6. **Review with Development Team** before implementation

---

## Approval

**Product Manager**: [Your Name]
**Date**: January 1, 2026
**Status**: ✅ Ready for Implementation

---

**End of Corrections Summary**
