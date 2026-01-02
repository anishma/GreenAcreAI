# GreenAcre AI - User Conversation Flows
## Comprehensive Interaction Scenarios

**Version:** 1.0
**Date:** January 1, 2026
**Status:** Design Document
**Based on:** greenacre-prd-mvp.md

---

## Table of Contents

1. [Happy Path Flows (1-20)](#1-happy-path-flows)
2. [Edge Cases & Error Handling (21-35)](#2-edge-cases--error-handling)
3. [Onboarding & Account Management (36-42)](#3-onboarding--account-management)
4. [Advanced Features & Troubleshooting (43-50)](#4-advanced-features--troubleshooting)

---

## 1. Happy Path Flows

### Flow 1: Perfect Quote and Immediate Booking

**Actors:** Homeowner (Sarah), AI Agent
**Scenario:** Customer calls, provides clear address, accepts quote, books immediately

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded for quality
    assurance. I can help you get a quote for lawn mowing service. What's your address?

Sarah: Yes, I'm at 123 Oak Street in Springfield, 62701.

AI: Let me look that up... I found your property at 123 Oak Street. It looks like
    your lot is about 8,500 square feet, which is roughly a quarter acre. Weekly
    mowing would be $45 per visit. Would you like to schedule your first appointment?

Sarah: Yes, that sounds good!

AI: Great! I have a few openings this week: Tuesday at 9am or Thursday at 2pm.
    Which works better for you?

Sarah: Tuesday at 9am works perfect.

AI: Perfect! You're all set for Tuesday at 9am. I've sent you a confirmation text
    to this number. Is there anything else I can help you with?

Sarah: No, that's all. Thank you!

AI: You're welcome! We'll see you Tuesday. Have a great day!
```

**Expected Outcomes:**
- Lead created in database
- Booking added to Google Calendar
- SMS confirmations sent to customer and owner
- Call recording saved with positive outcome
- Quote: $45, Status: booked

---

### Flow 2: Quote Given, Customer Wants to Think About It

**Actors:** Homeowner (John), AI Agent
**Scenario:** Customer gets quote but needs time to decide

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

John: 456 Maple Drive, Springfield, 62702.

AI: Let me check that... Your property at 456 Maple Drive is about 12,000 square
    feet, which is about a third of an acre. Weekly mowing would be $55 per visit.
    Would you like to schedule your first appointment?

John: Hmm, let me think about it. I'm getting quotes from a few companies.

AI: No problem at all! I completely understand. I'll text you the quote details
    so you have them handy. We'd love to earn your business when you're ready.
    Feel free to call back anytime!

John: Great, thanks for the information.

AI: You're welcome! Have a great day!
```

**Expected Outcomes:**
- Lead created with status: "quoted"
- SMS sent with quote details
- Call transcript saved
- Follow-up flag set for owner review
- Quote: $55, Status: quoted

---

### Flow 3: Bi-weekly Service Request

**Actors:** Homeowner (Maria), AI Agent
**Scenario:** Customer asks about bi-weekly instead of weekly service

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Maria: 789 Pine Avenue, Springfield, 62703.

AI: Let me look that up... Your lot at 789 Pine Avenue is about 6,000 square
    feet. Weekly mowing would be $45 per visit. Would you like to schedule
    your first appointment?

Maria: Actually, I'm looking for bi-weekly service, not weekly. Do you do that?

AI: Absolutely! We offer bi-weekly service as well. For your 6,000 square foot
    lot, bi-weekly service would be $65 per visit. That includes mowing, trimming,
    edging, and cleanup. This price is an estimate and may vary by 5-10% after
    Mike inspects the property. Would you like to schedule your first bi-weekly
    appointment?

Maria: Yes, that sounds good. How about next Wednesday at 10am?

AI: Perfect! I've scheduled your first bi-weekly mowing for Wednesday, January 8th
    at 10:00 AM. You'll receive a confirmation text with all the details. Is
    there anything else?

Maria: No, that's all. Thank you!

AI: You're welcome! We'll see you Wednesday!
```

**Expected Outcomes:**
- Property lookup successful (6,000 sqft)
- Pricing tier matched: Quarter Acre (5,001-10,000 sqft)
- Bi-weekly quote calculated: $65 (from tenant pricing_tiers)
- Service inclusions displayed: mowing, trimming, edging, cleanup
- Pricing disclaimer added: "may vary 5-10%" (pricing_type: estimate)
- Lead created with status: "booked"
- Booking created for bi-weekly frequency
- Confirmation SMS sent
- Quote: $65, Frequency: bi-weekly, Status: booked

---

### Flow 4: Large Lot (Above Standard Tiers)

**Actors:** Homeowner (Robert), AI Agent
**Scenario:** Property exceeds standard pricing tiers

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Robert: 1500 Country Club Drive, Springfield, 62704.

AI: Let me check that property... Your lot at 1500 Country Club Drive is about
    35,000 square feet, which is just under an acre. For a property this size,
    I'd like to have Mike provide you with a custom quote. Can I get your phone
    number so he can call you back with an accurate estimate?

Robert: Yes, it's 555-0456.

AI: Perfect! I've noted your address and lot size. Mike will give you a call
    within 24 hours with a custom quote for your property. Is there anything
    else I can help with today?

Robert: No, that's fine. When can I expect his call?

AI: He typically returns calls within one business day, often sooner. You'll
    hear from him by tomorrow afternoon at the latest.

Robert: Great, thank you!

AI: You're welcome! Talk to you soon.
```

**Expected Outcomes:**
- Lead created with flag: "custom quote needed"
- Owner receives priority notification
- Property size noted: 35,000 sq ft
- Status: new, follow-up required

---

### Flow 5: Multiple Service Inquiries (Future Services)

**Actors:** Homeowner (Lisa), AI Agent
**Scenario:** Customer asks about additional services beyond mowing

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Lisa: 234 Birch Lane, Springfield, 62701.

AI: Let me look that up... Your lot is about 10,000 square feet. Weekly mowing
    would be $45 per visit. Would you like to schedule your first appointment?

Lisa: Yes, but I'm also interested in edging and maybe some landscaping. Do you
    offer those services?

AI: That's a great question! For lawn mowing, I can help you schedule right now
    at $45 per visit. For additional services like edging and landscaping, I'd
    like to have Mike call you to discuss what we can offer and provide accurate
    pricing. Would you like to book the mowing service first?

Lisa: Yes, let's do that. Tuesday morning if you have it.

AI: I have Tuesday at 9am available. Does that work?

Lisa: Perfect!

AI: Great! You're booked for Tuesday at 9am for mowing at $45. I've also noted
    that you're interested in edging and landscaping services. Mike will give
    you a call to discuss those additional options. You'll receive a confirmation
    text shortly. Anything else?

Lisa: No, that's all. Thank you!

AI: You're welcome! See you Tuesday!
```

**Expected Outcomes:**
- Booking created for mowing service
- Lead notes include: "interested in edging, landscaping"
- Owner notification includes upsell opportunity
- Calendar event created

---

### Flow 6: Same-Day or Rush Service Request

**Actors:** Homeowner (Tom), AI Agent
**Scenario:** Customer needs urgent service

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Tom: 567 Elm Street, Springfield, 62702. I need my lawn mowed today if possible
     - I have a party tomorrow.

AI: Let me check your property first... Your lot is about 9,000 square feet.
    Weekly mowing would be $45 per visit. For today's availability, let me see
    what we have... I don't see any openings available for today, but I do have
    tomorrow morning at 8am. Would that work before your party?

Tom: Tomorrow morning is cutting it close. Can Mike fit me in today somehow?

AI: I understand the urgency. Let me note this as a priority request. I'll have
    Mike call you right away to see if he can fit you in today. What's the best
    number to reach you?

Tom: 555-0789.

AI: Perfect! I've marked this as urgent. Mike will call you within the next hour
    to see if he can accommodate same-day service. Is there anything else?

Tom: No, just please have him call soon!

AI: Absolutely. He'll call you shortly. Thank you!
```

**Expected Outcomes:**
- Lead created with "URGENT" flag
- Owner receives immediate SMS alert
- Notes include: "party tomorrow, needs same-day"
- No booking created (pending owner confirmation)

---

### Flow 7: Referral from Neighbor

**Actors:** Homeowner (Jennifer), AI Agent
**Scenario:** Customer was referred by existing customer

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Jennifer: Hi, I'm at 890 Cedar Court, Springfield, 62703. My neighbor at 892
          recommended you guys - you do their lawn and it always looks great!

AI: Thank you so much for the referral! We love hearing that. Let me look up
    your property... You're at 890 Cedar Court, and your lot is about 8,000
    square feet. Weekly mowing would be $45 per visit. Would you like to schedule
    your first appointment?

Jennifer: Yes! Can you do Thursdays? I noticed you do my neighbor's lawn on Thursdays.

AI: Let me check Thursday availability... I have Thursday at 1pm available.
    Does that work for you?

Jennifer: Perfect! That way you can do both lawns on the same day.

AI: Excellent! You're all set for Thursday at 1pm. I've noted that you were
    referred by your neighbor. I'll send you a confirmation text shortly.
    Is there anything else I can help you with?

Jennifer: No, that's all. Thank you!

AI: You're welcome! See you Thursday!
```

**Expected Outcomes:**
- Booking created for Thursday 1pm
- Lead source noted: "referral from neighbor"
- Owner can see clustering opportunity (route optimization)
- Confirmation SMS sent

---

### Flow 8: Seasonal Service Inquiry

**Actors:** Homeowner (David), AI Agent
**Scenario:** Customer asks about seasonal vs. year-round service

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

David: 345 Willow Way, Springfield, 62704. I'm interested in mowing service,
       but only during the growing season - maybe April through October?

AI: That makes perfect sense. Let me look up your property... Your lot is about
    11,000 square feet. Weekly mowing would be $55 per visit. For seasonal service
    arrangements, I'd like to have Mike discuss the details with you - he can work
    out a schedule that fits your needs. Can I get your phone number?

David: Sure, 555-0234.

AI: Perfect! I've noted that you're interested in seasonal service from April
    through October at $55 per visit. Mike will give you a call to set up a
    schedule. Would you like to book your first appointment for when the season
    starts, or wait to hear from Mike first?

David: I'll wait to hear from Mike to work out the details.

AI: Sounds good! He'll be in touch within 24 hours. Is there anything else?

David: No, that's all. Thanks!

AI: You're welcome! Have a great day!
```

**Expected Outcomes:**
- Lead created with notes: "seasonal service, Apr-Oct"
- Owner notification for follow-up
- Quote provided: $55/visit
- Status: contacted

---

### Flow 9: New Construction/Move-in (with Sod Timing Check)

**Actors:** Homeowner (Amanda), AI Agent
**Scenario:** Customer just moved into new construction, needs to check sod readiness

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Amanda: Hi! We just moved to 678 Oakwood Drive, Springfield, 62701. It's new
        construction and we need someone to start mowing right away.

AI: Congratulations on your new home! Let me check your property... At 678 Oakwood
    Drive, your lot is about 7,500 square feet. Weekly mowing would be $45 per visit.

    Since this is new construction, I have a quick question - is the sod newly laid,
    or has it been down for a while? New sod typically needs 3-4 weeks to establish
    before the first mowing.

Amanda: Oh, good question. The builder laid the sod about two weeks ago.

AI: Perfect timing to ask! For newly laid sod, we typically recommend waiting about
    another 2 weeks before the first mowing to let the roots establish properly.
    Would you like me to schedule your first service for 2-3 weeks from now? That
    would be around January 22nd. In the meantime, if you'd like to send a photo
    via text, Mike can take a look and confirm the timing.

Amanda: Yes, that makes sense. Let's schedule for January 22nd, and I'll send a
        photo to get Mike's opinion.

AI: Excellent! I'll schedule your first mowing for Wednesday, January 22nd at 10am,
    and we'll set you up for weekly service from there. You'll get a confirmation
    text where you can reply with photos. What's your phone number?

Amanda: 555-0567.

AI: Perfect! Confirmation sent. You can reply to that text with photos of your
    lawn, and Mike will confirm whether January 22nd is the right timing or if
    we should adjust. Welcome to the neighborhood!

Amanda: Thank you so much! That's really helpful.

AI: You're welcome! Enjoy your new home!
```

**Expected Outcomes:**
- Property lookup successful (7,500 sqft)
- Sod timing check performed (newly laid sod identified)
- First service delayed appropriately (3-4 weeks from sod installation)
- Recurring booking created for weekly service starting Jan 22nd
- Photo request sent via SMS for owner verification
- Lead notes: "new construction, sod laid ~2 weeks ago, verify timing before first service"
- Owner notification to review photos and confirm service date
- Status: booked (with verification pending)

---

### Flow 10: Price Comparison (Competitive Shopping)

**Actors:** Homeowner (Kevin), AI Agent
**Scenario:** Customer is comparing prices from multiple companies

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Kevin: 123 Sycamore Street, Springfield, 62702. I'm getting quotes from a few
       companies - what's your price?

AI: I'd be happy to provide a quote! Let me look up your property size... At
    123 Sycamore Street, your lot is about 9,500 square feet. Weekly mowing
    would be $45 per visit. That includes mowing, basic trimming, and cleanup.
    How does that compare to other quotes you've received?

Kevin: That's actually very competitive. The other company quoted $50.

AI: Great! We pride ourselves on fair pricing and quality work. Would you like
    to schedule a first appointment to try us out?

Kevin: Let me finish getting my other quotes first. Can you send me this in writing?

AI: Absolutely! I'll text you the quote details right now so you have everything
    in writing. When you're ready to book, just give us a call back or reply to
    that text. Sound good?

Kevin: Perfect, thanks.

AI: You're welcome! We hope to work with you soon. Have a great day!
```

**Expected Outcomes:**
- Lead created with status: "quoted"
- SMS sent with quote details
- Notes include: "price shopping, quoted $50 by competitor"
- Owner can see competitive intelligence

---

### Flow 11: Rental Property Owner

**Actors:** Property Owner (Rachel), AI Agent
**Scenario:** Landlord needs bi-weekly service for rental property

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Rachel: I own a rental property at 456 Chestnut Avenue, Springfield, 62703.
        I need regular lawn service for my tenants.

AI: Perfect! Let me look that up... At 456 Chestnut Avenue, the lot is about
    8,000 square feet. For rental properties, would you like weekly or bi-weekly
    service?

Rachel: Bi-weekly is fine. I just need it to look maintained.

AI: Great choice! For bi-weekly service on your 8,000 square foot lot, the price
    would be $65 per visit. That includes mowing, trimming, edging, and cleanup.
    This price is an estimate and may vary by 5-10% after Mike inspects the property.
    Would you like us to coordinate directly with you or with your tenants?

Rachel: Coordinate with me. I pay the bill and I want to make sure it's done.
        The tenants can be there but I'll handle everything.

AI: That works perfectly. Would you like to schedule the first service?

Rachel: Yes, can we do it every other Friday?

AI: Absolutely! I have this Friday, January 10th at 2pm available for the first
    service. Does that work?

Rachel: Yes, and then every other Friday from there.

AI: Perfect! You're all set for bi-weekly service on Fridays at 2pm, starting
    this Friday at $65 per visit. I'll send confirmation to your number. Is
    there anything else?

Rachel: No, that's all. Thanks!

AI: You're welcome! We'll see you Friday!
```

**Expected Outcomes:**
- Property lookup successful (8,000 sqft)
- Bi-weekly pricing quoted: $65 (not weekly $45)
- Booking created for bi-weekly Fridays at 2pm
- Lead notes: "rental property, bill to owner, coordinate with Rachel not tenants"
- Contact is property owner, not resident
- Recurring schedule set (every other Friday)
- Service inclusions: mowing, trimming, edging, cleanup
- Pricing disclaimer: may vary 5-10%

---

### Flow 12: Spanish Street Address (Non-Standard Format)

**Actors:** Homeowner (Carlos), AI Agent
**Scenario:** Customer provides address in slightly different format

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Carlos: I'm at one two three four Oak Street, Springfield, Illinois, six two seven
        zero one.

AI: Let me verify that - is it 1234 Oak Street in Springfield, 62701?

Carlos: Yes, that's correct.

AI: Perfect! Let me look that up... Your lot at 1234 Oak Street is about 10,500
    square feet. Weekly mowing would be $55 per visit. Would you like to schedule
    your first appointment?

Carlos: Yes, I would. Wednesday afternoon if possible?

AI: I have Wednesday at 3pm available. Does that work?

Carlos: Yes, that's perfect.

AI: Great! You're all set for Wednesday at 3pm. I'll send you a confirmation text.
    Is there anything else I can help you with?

Carlos: No, thank you very much!

AI: You're welcome! See you Wednesday!
```

**Expected Outcomes:**
- Address normalized correctly (1234 Oak Street)
- LLM handles natural language number parsing
- Booking created for Wednesday 3pm
- Standard flow continues

---

### Flow 13: Callback Request During Business Hours

**Actors:** Homeowner (Nancy), AI Agent
**Scenario:** Customer prefers owner to call back with quote

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Nancy: 789 Maple Street, Springfield, 62704. Actually, can I have Mike call me
       back? I have some questions about the service.

AI: Of course! Let me get your property information first so Mike has all the
    details... Your lot at 789 Maple Street is about 9,000 square feet. Weekly
    mowing would be $45 per visit. What's the best number for Mike to call you back?

Nancy: 555-0890.

AI: Perfect! I've noted your address and lot size. Mike will give you a call
    within 24 hours to answer your questions. Is there anything quick I can help
    with right now?

Nancy: No, I'd rather just talk to Mike directly.

AI: No problem at all! He'll be in touch soon. Have a great day!

Nancy: Thank you!
```

**Expected Outcomes:**
- Lead created with quote information
- Owner notification: "callback requested"
- Customer phone number captured
- Status: contacted

---

### Flow 14: Neighbor Making Inquiry on Behalf of Homeowner

**Actors:** Neighbor (Patricia), AI Agent
**Scenario:** Someone calls on behalf of another person

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Patricia: Actually, I'm calling for my elderly neighbor. She's at 555 Birch Lane,
          Springfield, 62701. She needs help with her lawn but isn't great with
          phone calls.

AI: That's very kind of you to help! Let me look up that property... At 555 Birch
    Lane, the lot is about 7,000 square feet. Weekly mowing would be $45 per visit.
    Is your neighbor interested in scheduling service?

Patricia: Yes, she definitely needs it. Can someone call her to set it up? Her
          name is Dorothy and her number is 555-0345.

AI: Absolutely! I've noted all of that information. Mike will give Dorothy a call
    within 24 hours to introduce himself and schedule the first service. He'll
    mention that you referred us. Is there anything else?

Patricia: No, that's perfect. Thank you!

AI: Thank you for looking out for your neighbor! We'll take good care of Dorothy.
```

**Expected Outcomes:**
- Lead created for Dorothy (actual homeowner)
- Notes include: "referred by neighbor Patricia"
- Owner will call to confirm with actual homeowner
- Status: contacted

---

### Flow 15: Commercial Property (Small Business)

**Actors:** Business Owner (Frank), AI Agent
**Scenario:** Small business needs lawn care for their office

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Frank: This is for my business, Frank's Auto Repair at 1200 Industrial Drive,
       Springfield, 62704.

AI: Thank you! Let me check that property... At 1200 Industrial Drive, I'm showing
    about 15,000 square feet of lawn area. For commercial properties, I'd like to
    have Mike reach out to you directly to discuss your specific needs and provide
    an accurate quote. What's the best number to reach you?

Frank: 555-0678. When can he call?

AI: He typically returns calls within one business day. You'll hear from him by
    tomorrow afternoon at the latest. Is there anything else I can note for him?

Frank: Yeah, tell him we need it to look professional - we have customers coming in.

AI: Perfect! I've noted that. Mike will call you to discuss commercial service
    and make sure everything looks great for your customers. Anything else?

Frank: No, that's it. Thanks!

AI: You're welcome! Talk to you soon!
```

**Expected Outcomes:**
- Lead created with type: "commercial"
- Owner notification for custom quote
- Notes include business context
- Status: contacted

---

### Flow 16: Weekend/After Hours Service Request

**Actors:** Homeowner (Michelle), AI Agent
**Scenario:** Customer specifically requests weekend service

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Michelle: 890 Pine Street, Springfield, 62702. I work from home during the week,
          so I really need weekend service if that's possible.

AI: Let me check your property first... At 890 Pine Street, your lot is about
    8,500 square feet. Weekly mowing would be $45 per visit. Looking at weekend
    availability, I have Saturday at 11am open. Would that work for you?

Michelle: Saturday is perfect! Can we do every Saturday?

AI: Absolutely! You're all set for weekly service on Saturdays at 11am, starting
    this Saturday. I'll send you a confirmation text. Is there anything else?

Michelle: No, that's perfect. Thank you!

AI: You're welcome! See you Saturday!
```

**Expected Outcomes:**
- Recurring booking created (Saturdays at 11am)
- Notes include: "works from home, prefers weekends"
- Calendar shows weekend appointment
- Confirmation sent

---

### Flow 17: Existing Customer Adding Second Property (MVP: One Property Per Call)

**Actors:** Existing Customer (George), AI Agent
**Scenario:** Current customer calls about another property - handled as separate booking

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

George: Hi, this is George Miller. You already do my lawn at 123 Main Street.
        I just bought a second home at 456 Lake View Drive and need service there too.

AI: Hi George! Congratulations on the new property! I can definitely help you with
    that. For now, let me get the details for 456 Lake View Drive and I'll have
    Mike call you to coordinate both properties together. That way he can schedule
    them efficiently if they're close to each other. Let me look up your new
    property...

    Your lot at 456 Lake View Drive is about 20,000 square feet, which is about
    half an acre. Weekly mowing would be $70 per visit. I can see your Main Street
    property is only 2 miles away, so Mike can definitely service both on the same
    day for you. What's the best number for him to reach you?

George: This number is fine - 555-0123.

AI: Perfect! I've noted both addresses:
    - 123 Main Street (existing weekly service)
    - 456 Lake View Drive (new, $70/week, half acre)

    Mike will call you today to set up a combined schedule for both properties.
    He'll likely be able to do them back-to-back on the same day, which is more
    efficient. Is there anything else?

George: No, that sounds great. Thanks!

AI: You're welcome, George! Mike will be in touch soon about coordinating both
    properties!
```

**Expected Outcomes:**
- Property lookup successful for second property (20,000 sqft)
- Quote provided: $70/week for second property
- Proximity check performed: Properties are 2 miles apart (same-day service possible)
- MVP limitation: Cannot book both properties in one call
- Lead created for second property with status: "needs_owner_callback"
- Owner notification with context:
  - Existing customer: George Miller
  - First property: 123 Main Street (already serviced)
  - Second property: 456 Lake View Drive ($70/week quoted)
  - Distance: 2 miles (route optimization opportunity)
  - Action needed: Call George to coordinate combined schedule
- Notes: "multi-property customer, coordinate for same-day service"

---

### Flow 18: One-Time Service (Not Recurring)

**Actors:** Homeowner (Susan), AI Agent
**Scenario:** Customer only wants one-time service

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Susan: 678 Elm Avenue, Springfield, 62703. I just need a one-time cut - I'm
       selling the house and it needs to look good for showings.

AI: I understand! Let me look up your property... At 678 Elm Avenue, your lot is
    about 9,000 square feet. A one-time mowing would be $45. When do you need it done?

Susan: As soon as possible - showings start this weekend.

AI: Let me check availability... I have tomorrow at 3pm available. Would that work?

Susan: That's perfect!

AI: Great! You're scheduled for tomorrow at 3pm for a one-time mowing at $45.
    I'll send you a confirmation text. Is there anything else?

Susan: No, that's all I need. Thank you!

AI: You're welcome! Good luck with your sale!
```

**Expected Outcomes:**
- Single booking created (not recurring)
- Notes include: "one-time service, selling home"
- Calendar shows one appointment only
- Owner aware it's not ongoing customer

---

### Flow 19: Senior Citizen Discount Inquiry

**Actors:** Homeowner (Harold), AI Agent
**Scenario:** Customer asks about discounts

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Harold: 234 Cherry Lane, Springfield, 62704. Do you offer a senior discount? I'm 75.

AI: Let me look up your property first... At 234 Cherry Lane, your lot is about
    7,500 square feet. Our standard rate for weekly mowing is $45 per visit.
    For questions about discounts or special pricing, I'd like to have Mike call
    you to discuss what we can offer. What's your phone number?

Harold: 555-0789.

AI: Perfect! I've noted your address and that you're interested in senior pricing.
    Mike will give you a call within 24 hours to work something out. Sound good?

Harold: Yes, thank you.

AI: You're welcome! Mike will be in touch soon!
```

**Expected Outcomes:**
- Lead created with notes: "senior discount inquiry, age 75"
- Owner can decide on pricing
- Standard quote provided as baseline
- Status: contacted

---

### Flow 20: HOA/Community Recommendation

**Actors:** Homeowner (Brenda), AI Agent
**Scenario:** Customer was recommended by their HOA

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Brenda: 567 Meadowbrook Circle, Springfield, 62701. My HOA recommended you guys
        - you do several lawns in our neighborhood.

AI: Thank you! We're glad to work in Meadowbrook. Let me look up your property...
    At 567 Meadowbrook Circle, your lot is about 8,000 square feet. Weekly mowing
    would be $45 per visit. Would you like to schedule your first appointment?

Brenda: Yes! Can you do Tuesdays? I think you do other houses on our street on Tuesdays.

AI: Perfect! I have Tuesday at 2pm available. Does that work?

Brenda: That's great!

AI: Excellent! You're all set for Tuesdays at 2pm starting this week. I've noted
    that you're in the Meadowbrook community. You'll receive a confirmation text.
    Anything else?

Brenda: No, thank you!

AI: You're welcome! See you Tuesday!
```

**Expected Outcomes:**
- Booking created for Tuesday
- Notes: "HOA referral, Meadowbrook community"
- Owner sees neighborhood clustering
- Route optimization opportunity

---

### Flow 21: Generic Quote Request Without Address

**Actors:** Homeowner (Patricia), AI Agent
**Scenario:** Customer wants general pricing info before providing address

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Patricia: I don't want to give my address yet. Can you just tell me your general
          pricing? Like, what's the range?

AI: Absolutely! Our pricing varies based on property size. For weekly mowing,
    we typically range from $35 to $85 depending on lot size. If you provide
    your address, I can give you an exact quote for your specific property.
    Would you like to share your address?

Patricia: Okay, that's helpful. So for a normal-sized suburban lot, what would it be?

AI: For a typical quarter-acre lot - that's around 5,000 to 10,000 square feet -
    weekly mowing is usually $45 per visit. That includes mowing, trimming, edging,
    and cleanup. This is an estimate and may vary by 5-10% after we inspect the
    property. Would you like me to check your specific property size?

Patricia: Yes, let me give you my address. It's 345 Willow Street, Springfield, 62702.

AI: Perfect! Let me look that up... Your lot at 345 Willow Street is about 7,500
    square feet. Weekly mowing would be $45 per visit, just like I estimated. Would
    you like to schedule your first appointment?

Patricia: Yes, that sounds fair. What times do you have available?

AI: I have Thursday at 1pm or Friday at 10am. Which works better for you?

Patricia: Friday at 10am works.

AI: Excellent! You're all set for Friday at 10am. I'll send you a confirmation
    text. Is there anything else?

Patricia: No, that's perfect. Thanks!

AI: You're welcome! See you Friday!
```

**Expected Outcomes:**
- Generic price range provided: $35-$85 (from get_generic_price_range function)
- Typical lot size estimate given: $45 (quarter-acre tier example)
- Service inclusions mentioned: mowing, trimming, edging, cleanup
- Pricing disclaimer provided: "may vary 5-10%"
- Customer eventually provided address for exact quote
- Property lookup confirmed estimate was accurate (7,500 sqft → $45)
- Booking created for Friday 10am
- Lead notes: "initial hesitation to provide address, accepted quote after range"
- Status: booked

**Alternative Outcome (if customer never provides address):**
- Generic quote provided with tenant disclaimer
- Lead created with status: "generic_quote_only" and phone number if provided
- Follow-up opportunity for owner

---

## 2. Edge Cases & Error Handling

### Flow 22: Address Not Found in Property Database

**Actors:** Homeowner (Mark), AI Agent
**Scenario:** Property lookup fails (new construction, database gap)

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Mark: 999 New Construction Lane, Springfield, 62705.

AI: Let me look that up... I'm having trouble finding that property in our system.
    It might be new construction or a recently developed area. Can you tell me
    approximately how large your lot is? For example, is it about a quarter acre,
    half acre, or larger?

Mark: It's about a quarter acre, I think.

AI: Perfect! For a quarter acre lot, which is typically around 10,000 square feet,
    weekly mowing would be around $45-55 per visit. To give you an exact quote,
    I'd like to have Mike call you back. He can verify the lot size and provide
    accurate pricing. What's your phone number?

Mark: 555-0999.

AI: Great! I've noted your address and approximate lot size. Mike will call you
    within 24 hours with an exact quote. Is there anything else?

Mark: No, that works. Thanks!

AI: You're welcome! Talk to you soon!
```

**Expected Outcomes:**
- Lead created with flag: "property lookup failed"
- Approximate quote given based on customer estimate
- Owner follow-up required for verification
- Status: contacted

---

### Flow 22: Outside Service Area

**Actors:** Homeowner (Linda), AI Agent
**Scenario:** Property is not in serviceable ZIP codes

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Linda: 789 Country Road, Decatur, 62526.

AI: Let me check that... I see you're at 789 Country Road in Decatur. I'm sorry,
    but we don't currently service the Decatur area - we focus on Springfield and
    surrounding ZIP codes. However, I'd be happy to note your information in case
    we expand there in the future. Would you like me to do that?

Linda: Oh, that's too bad. Sure, you can note it. Maybe in the future.

AI: Absolutely! Can I get your phone number?

Linda: 555-0526.

AI: Perfect! I've saved your information. If we expand to the Decatur area, Mike
    will give you a call. In the meantime, I can have him recommend another service
    in your area if you'd like?

Linda: No, that's okay. I'll keep looking.

AI: Sounds good! Thank you for calling, and hopefully we can help you in the future!
```

**Expected Outcomes:**
- Lead created with status: "outside service area"
- ZIP code logged for expansion tracking
- Owner can see demand in new areas
- No booking created

---

### Flow 23: Extremely Poor Connection (Speech Recognition Failure)

**Actors:** Homeowner (Dan), AI Agent
**Scenario:** Call quality is very poor, AI cannot understand

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Dan: [Static/garbled] ...street... Springfield...

AI: I'm sorry, I'm having trouble hearing you clearly. It sounds like there might
    be a bad connection. Could you try speaking a bit louder or moving to a better
    location?

Dan: [Still garbled] ...can you hear...

AI: I'm still having difficulty hearing you clearly. I'd like to help you get a
    quote, but I want to make sure I get your information correctly. Would it be
    easier if Mike called you back? If you can hear me, just say yes or give me
    your phone number.

Dan: 555... [garbled]

AI: I apologize - the connection is too poor for me to help you accurately right
    now. Please try calling back when you have a better signal, or you can also
    text us at this number with your address and we'll respond with a quote.
    I'm sorry for the inconvenience!

[Call ends]
```

**Expected Outcomes:**
- Call logged with outcome: "poor connection"
- No lead created (insufficient information)
- System flags call quality issue
- Fallback to text/callback suggested

---

### Flow 24: Customer Hangs Up Mid-Conversation

**Actors:** Homeowner (Unknown), AI Agent
**Scenario:** Call disconnects before completion

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Caller: 123 Main...

[Call disconnects]
```

**Expected Outcomes:**
- Partial call record saved
- Phone number captured (from caller ID)
- Owner notification: "incomplete call, may want to follow up"
- Status: incomplete
- Transcript shows disconnect point

---

### Flow 25: Abusive or Inappropriate Caller

**Actors:** Inappropriate Caller, AI Agent
**Scenario:** Caller uses profanity or is abusive

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Caller: [Profanity/inappropriate content]

AI: I'm here to help you with lawn care service. If you'd like a quote or to
    schedule service, I'm happy to assist. If not, I'll need to end this call.

Caller: [Continues inappropriate behavior]

AI: I'm going to end this call now. If you need lawn care service in the future,
    please call back and we'll be happy to help. Have a good day.

[AI ends call]
```

**Expected Outcomes:**
- Call logged with flag: "inappropriate caller"
- Phone number may be blocked (owner decision)
- Recording saved for review if needed
- No lead created

---

### Flow 26: Wrong Number / Looking for Different Business

**Actors:** Confused Caller (Steve), AI Agent
**Scenario:** Caller meant to call a different business

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Steve: Wait, is this Mike's Auto Repair?

AI: No, this is Mike's Lawn Care - we provide lawn mowing services. You may have
    the wrong number. Have a good day!

Steve: Oh, sorry about that. Thanks!

AI: No problem! Goodbye!
```

**Expected Outcomes:**
- Call logged as "wrong number"
- Brief call duration (< 30 seconds)
- No lead created
- Recording saved but marked as non-business
- AI does NOT offer to help find other businesses (out of scope)

---

### Flow 27: No Calendar Availability (Fully Booked)

**Actors:** Homeowner (Paula), AI Agent
**Scenario:** Calendar has no openings in requested timeframe

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Paula: 456 Oak Street, Springfield, 62701.

AI: Let me look that up... Your lot is about 8,500 square feet. Weekly mowing
    would be $45 per visit. Would you like to schedule your first appointment?

Paula: Yes, do you have anything this week?

AI: Let me check availability... I'm showing that we're fully booked for this week.
    The next available opening is Monday of next week at 10am. Would that work, or
    would you prefer a different time?

Paula: Hmm, I really need it done this week. My grass is really overgrown.

AI: I understand the urgency. Let me note this as a priority request. I'll have
    Mike call you to see if he can fit you in sooner. What's the best number?

Paula: 555-0456.

AI: Perfect! Mike will call you within the hour to see what he can do. In the
    meantime, you're tentatively scheduled for Monday at 10am if we can't get you
    in sooner. Sound good?

Paula: Yes, thank you!

AI: You're welcome! Mike will be in touch soon.
```

**Expected Outcomes:**
- Lead created with "urgent" flag
- Tentative booking for soonest available slot
- Owner notification for potential squeeze-in
- Status: contacted

---

### Flow 28: Price Objection / Too Expensive

**Actors:** Homeowner (Jerry), AI Agent
**Scenario:** Customer thinks price is too high

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Jerry: 789 Maple Drive, Springfield, 62702.

AI: Let me check that property... Your lot is about 12,000 square feet. Weekly
    mowing would be $55 per visit. Would you like to schedule your first appointment?

Jerry: Fifty-five dollars? That seems really high. I can get it done for $35.

AI: I understand price is important. Our $55 includes mowing, trimming, edging,
    and cleanup, and this is an estimate that may vary by 5-10% after Mike inspects
    the property. The quality and reliability of service is important too. If you'd
    like to discuss the pricing or service details, I'd be happy to have Mike call
    you. He may be able to work with you. What's your number?

Jerry: Forget it, I'll go with the cheaper guy.

AI: No problem at all! If it doesn't work out or you change your mind, we're here.
    Have a great day!

Jerry: Thanks.
```

**Expected Outcomes:**
- Property lookup successful (12,000 sqft → Third Acre tier)
- Weekly price quoted: $55 from pricing_tiers
- Service inclusions from tenant config: "mowing, trimming, edging, cleanup"
- Pricing disclaimer added: "may vary 5-10%" (pricing_type: estimate)
- Lead created with status: "lost - price"
- Competitor pricing noted in lead notes: "$35 (64% cheaper)"
- Owner can see competitive intelligence
- No booking created

---

### Flow 29: Prank Call / Kids Calling

**Actors:** Prank Callers, AI Agent
**Scenario:** Non-serious call, likely children

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Caller: [Giggling] Uh... 123 Fake Street!

AI: I need a real address to provide a quote. What's your actual property address?

Caller: [More giggling, voices in background]

AI: If you need lawn care service, I'm here to help. Otherwise, I'll need to end
    this call so I can assist other customers. Do you have a real address?

Caller: [Hangs up or continues laughing]

AI: I'm going to end this call now. Thank you for calling Mike's Lawn Care.

[AI ends call]
```

**Expected Outcomes:**
- Call logged as "prank call"
- Very short duration
- No lead created
- Pattern recognition if same number calls multiple times

---

### Flow 30: Technical Issue During Booking

**Actors:** Homeowner (Carol), AI Agent
**Scenario:** Calendar integration fails mid-booking

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Carol: 567 Birch Lane, Springfield, 62703.

AI: Let me look that up... Your lot is about 9,000 square feet. Weekly mowing
    would be $45 per visit. Would you like to schedule your first appointment?

Carol: Yes, Thursday if you have it.

AI: Let me check Thursday availability... I'm experiencing a technical issue
    accessing the calendar right now. I apologize for the inconvenience. Let me
    get your contact information, and Mike will call you within the hour to
    schedule your Thursday appointment. What's your phone number?

Carol: 555-0567.

AI: Perfect! I have your quote at $45 for weekly mowing. Mike will call you shortly
    to confirm Thursday and get you scheduled. I apologize again for the technical issue.

Carol: No problem, thank you!

AI: You're welcome! You'll hear from Mike soon.
```

**Expected Outcomes:**
- Lead created with quote information
- System error logged for debugging
- Owner receives urgent notification
- Status: contacted (manual follow-up needed)

---

### Flow 31: Multiple Properties in One Call

**Actors:** Property Manager (Richard), AI Agent
**Scenario:** Caller manages multiple properties, wants quotes for all

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Richard: I manage several rental properties. Can you give me quotes for three addresses?

AI: Absolutely! Let's go through them one at a time. What's the first address?

Richard: 123 Oak Street, Springfield, 62701.

AI: Let me look that up... 123 Oak Street is about 8,000 square feet. Weekly
    mowing would be $45 per visit. What's the second address?

Richard: 456 Elm Avenue, Springfield, 62702.

AI: Checking... 456 Elm Avenue is about 10,000 square feet, so $55 per visit.
    And the third address?

Richard: 789 Maple Drive, same ZIP, 62702.

AI: Perfect... 789 Maple Drive is 7,500 square feet, so $45 per visit. That's
    $45, $55, and $45 respectively. For managing multiple properties, I'd like
    to have Mike call you to discuss scheduling and any volume pricing options.
    What's your phone number?

Richard: 555-0123.

AI: Great! I've noted all three properties and their quotes. Mike will call you
    to work out the best schedule and pricing for multiple properties. Anything else?

Richard: No, that's all. Thanks!

AI: You're welcome! Mike will be in touch soon.
```

**Expected Outcomes:**
- Three separate leads created (linked to same contact)
- Owner notification about multi-property opportunity
- Volume pricing discussion flagged
- Status: contacted (all three)

---

### Flow 32: Unclear or Mumbled Address

**Actors:** Homeowner (Walter), AI Agent
**Scenario:** Customer's speech is unclear or they mumble

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Walter: [Mumbling] ...three twenty... [unclear] ...street...

AI: I want to make sure I have your address correct. Did you say 320? What street
    was that?

Walter: [Still unclear] ...Oak... or was it... Oakwood...

AI: Just to confirm, is it 320 Oak Street or 320 Oakwood? I want to look up the
    right property.

Walter: Oh, sorry. 320 Oakwood Avenue.

AI: Perfect! 320 Oakwood Avenue in Springfield, right?

Walter: Yes, 62701.

AI: Great! Let me look that up now... [continues normally]
```

**Expected Outcomes:**
- LLM uses clarification strategy
- Multiple attempts to verify address
- Correct address eventually captured
- Booking proceeds normally

---

### Flow 33: Customer Requests Services Not Offered

**Actors:** Homeowner (Betty), AI Agent
**Scenario:** Customer asks for services beyond lawn mowing

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Betty: 456 Pine Street, Springfield, 62703. Do you do snow removal in the winter?

AI: Let me check your property first... At 456 Pine Street, your lot is about
    8,500 square feet. For lawn mowing, weekly service would be $45 per visit.
    Regarding snow removal, we focus on lawn care services. I can have Mike call
    you to discuss what services we offer and potentially recommend someone for
    snow removal. Would you like to schedule lawn mowing service?

Betty: Sure, let's do the lawn service for now.

AI: Great! When would you like your first appointment?

Betty: Wednesdays work well.

AI: I have Wednesday at 1pm available. Does that work?

Betty: Perfect!

AI: Excellent! You're all set for Wednesdays at 1pm. I've noted your question
    about snow removal, and Mike may be able to recommend someone. You'll get a
    confirmation text. Anything else?

Betty: No, thanks!

AI: You're welcome!
```

**Expected Outcomes:**
- Booking created for lawn mowing
- Notes include: "asked about snow removal"
- Owner can follow up with referral
- Core service successfully booked

---

### Flow 34: Voicemail Reached (No Live Person)

**Actors:** AI Agent
**Scenario:** AI detects it reached voicemail instead of a person

**Conversation:**
```
[Phone rings, goes to voicemail]

Voicemail: "You've reached Mike's Lawn Care. Please leave a message..."

AI: [Detects voicemail tone]

[AI does not leave a message, ends call]
```

**Expected Outcomes:**
- System recognizes voicemail detection
- Call logged as "reached voicemail"
- No message left (prevents confusion)
- May retry callback if configured

**Note:** This is for outbound calling in future versions. For MVP, this scenario doesn't apply as we only handle inbound calls.

---

### Flow 35: Caller Has Strong Accent (Comprehension Challenge)

**Actors:** Homeowner (Raj), AI Agent
**Scenario:** Heavy accent makes speech recognition difficult

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Raj: [Heavy accent] I am living at tree hundred twenty-five Cherry Street.

AI: Let me confirm - is that 325 Cherry Street?

Raj: Yes, yes. Tree-two-five Cherry Street, Springfield.

AI: Perfect! 325 Cherry Street in Springfield. Let me look that up... Your lot is
    about 9,500 square feet. Weekly mowing would be $45 per visit. Would you like
    to schedule your first appointment?

Raj: Yes, please. Tuesday is good for me.

AI: Great! I have Tuesday at 2pm available. Does that work?

Raj: Two PM? Yes, that is good.

AI: Perfect! You're all set for Tuesday at 2pm. I'll send you a confirmation text.
    Is there anything else I can help you with?

Raj: No, thank you very much!

AI: You're welcome! See you Tuesday!
```

**Expected Outcomes:**
- LLM successfully parses "tree" as "3"
- Verification step confirms understanding
- Booking completed successfully
- Normal flow continues

---

## 3. Onboarding & Account Management

### Flow 36: New Business Owner Sign-Up (Web Dashboard)

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** First-time setup of GreenAcre AI account

**Steps:**
```
1. Visit greenacre.ai
2. Click "Start Free Trial"
3. Enter email and password
4. Verify email via link
5. Enter business information:
   - Business name: "Mike's Lawn Care"
   - Owner name: Mike Johnson
   - Phone: 555-0100
6. Select subscription plan: Starter ($150/mo)
7. Enter payment info (Stripe Checkout)
8. Configure service areas:
   - Add ZIP codes: 62701, 62702, 62703, 62704
9. Set pricing tiers:
   - 0-5,000 sq ft: $35
   - 5,001-10,000 sq ft: $45
   - 10,001-15,000 sq ft: $55
   - 15,001-22,000 sq ft: $70
   - 22,001+ sq ft: $85
10. Connect Google Calendar (OAuth flow)
11. Provision phone number: Choose area code 217
12. Receive number: (217) 555-0199
13. Test call: Call the number, verify AI responds with business name
14. Complete onboarding ✓
```

**Expected Outcomes:**
- Tenant record created in database
- VAPI agent configured with business details
- Phone number linked to agent
- Google Calendar connected
- Subscription active
- Owner can see dashboard

---

### Flow 37: Updating Pricing Tiers

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Owner needs to adjust pricing

**Steps:**
```
1. Log into dashboard
2. Navigate to Settings → Pricing
3. View current tiers
4. Edit tier: 5,001-10,000 sq ft
   - Change from $45 to $50
5. Save changes
6. System validates: No gaps in ranges
7. Confirmation: "Pricing updated. New rates apply to all future calls."
8. Test: Make call, verify new pricing
```

**Expected Outcomes:**
- Database updated with new pricing
- Edge cache purged (instant effect)
- Next call uses $50 for that tier
- Historical data unchanged

---

### Flow 38: Adding/Removing Service Areas

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Expanding to new ZIP code

**Steps:**
```
1. Log into dashboard
2. Navigate to Settings → Service Areas
3. View current: 62701, 62702, 62703, 62704
4. Add new ZIP: 62705
5. Save changes
6. Confirmation: "Service area updated. Now accepting calls from 62705."
7. Test: Call from 62705 address, verify accepted
```

**Expected Outcomes:**
- Service area array updated
- AI immediately accepts new ZIP
- Owner receives notification of change
- Database logged

---

### Flow 39: Viewing Call History and Recordings

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Reviewing yesterday's calls

**Steps:**
```
1. Log into dashboard
2. Navigate to Calls tab
3. View list of recent calls:
   - Today: 3 calls
   - Yesterday: 5 calls
4. Click on call from yesterday
5. View details:
   - Customer: Sarah Johnson
   - Phone: 555-0123
   - Address: 123 Oak Street
   - Outcome: Booked
   - Quote: $45
   - Scheduled: Tuesday 9am
6. Click "Play Recording"
7. Listen to 1:30 call
8. Read transcript
9. View calendar event (link to Google Calendar)
```

**Expected Outcomes:**
- Dashboard loads call list quickly (<2s)
- Recording plays via signed URL
- Transcript displays formatted
- All data visible (RLS enforces tenant isolation)

---

### Flow 40: Manually Adding a Lead (Owner Follow-up)

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Owner spoke to someone offline, wants to add to system

**Steps:**
```
1. Log into dashboard
2. Navigate to Leads tab
3. Click "Add Lead Manually"
4. Enter details:
   - Name: Bob Smith
   - Phone: 555-0789
   - Address: 890 Elm Street, Springfield, 62703
   - Lot size: 10,000 sq ft (estimated)
   - Quote: $45
   - Source: "Neighbor referral"
   - Status: Quoted
   - Notes: "Wants to think about it"
5. Save lead
6. Lead appears in list
7. Owner can follow up later
```

**Expected Outcomes:**
- Lead record created manually
- All fields populated
- Shows in dashboard alongside AI-generated leads
- Can be converted to booking later

---

### Flow 41: Canceling Subscription

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Owner decides to stop using service

**Steps:**
```
1. Log into dashboard
2. Navigate to Settings → Billing
3. View current plan: Starter ($150/mo)
4. Click "Cancel Subscription"
5. Warning: "Are you sure? You'll lose access at the end of your billing period."
6. Confirm cancellation
7. Redirect to Stripe billing portal
8. Complete cancellation in Stripe
9. Confirmation: "Subscription will end on [date]. You have access until then."
10. After end date:
    - Phone number deactivated
    - Dashboard access removed (read-only for 30 days for data export)
    - Data retained for 90 days
```

**Expected Outcomes:**
- Stripe subscription canceled
- Database updated: status = "canceled"
- Grace period for data access
- Phone number released back to pool

---

### Flow 42: Reconnecting Google Calendar (Token Expired)

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** OAuth token expired, need to reconnect

**Steps:**
```
1. Owner notices bookings aren't appearing on calendar
2. Log into dashboard
3. Notice warning: "Google Calendar disconnected. Reconnect to enable booking."
4. Navigate to Settings → Integrations
5. Click "Reconnect Google Calendar"
6. OAuth flow: Redirect to Google
7. Select Google account
8. Grant permissions
9. Redirect back to dashboard
10. Success: "Google Calendar reconnected!"
11. Test: Make test call, verify booking appears
```

**Expected Outcomes:**
- New refresh token stored (encrypted)
- Access token refreshed
- Bookings resume working
- Owner notification cleared

---

## 4. Advanced Features & Troubleshooting

### Flow 43: Concurrent Call Handling (How the System Scales)

**Actors:** Three Homeowners (Sarah, John, Mark), AI Agent
**Scenario:** Multiple calls to the same phone number - understanding VAPI's concurrent call handling

**How It Works:**

VAPI supports concurrent calls using the same AI assistant. When multiple people call the same phone number:

**Call 1 (Sarah - 10:00:00 AM):**
```
[Sarah calls +1-217-555-LAWN]
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Sarah: 123 Oak Street, Springfield, 62701.
[Continues... call duration ~3 minutes]
```

**Call 2 (John - 10:00:15 AM - while Sarah is still on the phone):**
```
[John calls the SAME number: +1-217-555-LAWN]
[VAPI creates new call session with same assistant]
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

John: 456 Maple Drive, Springfield, 62702.
[Continues independently... no interference with Sarah's call]
```

**Call 3 (Mark - 10:01:00 AM - both still on):**
```
[Mark calls the SAME number: +1-217-555-LAWN]
[VAPI creates third independent session]
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Mark: 789 Pine Avenue, Springfield, 62703.
[Continues independently...]
```

**Key Technical Points:**
- VAPI supports concurrent inbound calls to the same phone number (subject to account limits)
- Default concurrency limits vary by plan; can be increased for higher volume
- If limit reached, VAPI can queue calls using Twilio queue management
- Each active call gets its own isolated LangGraph state (no cross-talk)
- Our LangGraph endpoint can handle multiple parallel requests (serverless scaling)
- Database transactions use row-level locking for calendar conflicts
- Each caller experiences individual, uninterrupted service

**Expected Outcomes:**
- Calls handled concurrently up to account's concurrency limit
- If limit exceeded, additional calls queue (Twilio queue management)
- No interference between conversations (isolated state)
- Each call has unique call_id and LangGraph session
- Concurrent bookings for the same time slot: Calendar lock prevents double-booking
  - First caller to complete booking wins the slot
  - Second caller gets "that time is no longer available" + offered next slot
- System scales horizontally via Vercel serverless functions
- Owner dashboard shows all active calls in real-time

**Note for MVP**: Check VAPI plan concurrency limits. For 10 tenants with ~500 calls/day, peak concurrency unlikely to exceed default limits. For scale (1000 tenants), request increased concurrency quota from VAPI.

---

### Flow 44: Calendar Conflict Detection

**Actors:** Two Homeowners (Anna, Brad), AI Agent
**Scenario:** Two callers try to book the same time slot

**Call 1 (Anna) - Starts first:**
```
AI: I have Tuesday at 2pm available. Does that work?

Anna: Yes!

AI: [Begins booking process, locks Tuesday 2pm]
```

**Call 2 (Brad) - Milliseconds behind:**
```
AI: Let me check Tuesday availability... I'm sorry, Tuesday at 2pm was just booked
    by another customer. I have Tuesday at 3pm or Wednesday at 2pm available.
    Which would you prefer?

Brad: Wednesday at 2pm works.

AI: Perfect! You're all set for Wednesday at 2pm.
```

**Expected Outcomes:**
- Calendar lock prevents double-booking
- Second caller offered alternative times
- Both bookings succeed without conflict
- Race condition handled gracefully

---

### Flow 45: Owner Intervenes During Call (Transfer Request)

**Actors:** Homeowner (Diane), AI Agent, Business Owner (Mike)
**Scenario:** Customer insists on speaking to a human

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care! This call may be recorded. I can help
    you get a quote for lawn mowing service. What's your address?

Diane: I'd really rather talk to a person. Is Mike available?

AI: I understand! I'm here to help you get a quick quote and schedule service.
    If you have specific questions that I can't answer, I'm happy to have Mike
    call you back. Would you like me to get a quote for you first, or would you
    prefer Mike to call you directly?

Diane: Just have him call me.

AI: No problem! What's your address so Mike has the information when he calls?

Diane: 234 Willow Lane, Springfield, 62703.

AI: Perfect! And your phone number?

Diane: 555-0890.

AI: Great! I've noted everything. Mike will call you within the hour. Is there
    anything specific you'd like him to know about?

Diane: I just have some questions about the service.

AI: I've noted that. Mike will call you shortly to answer your questions. Thank you!

Diane: Thanks.
```

**Expected Outcomes:**
- Lead created with flag: "requested owner callback"
- Owner receives immediate notification
- Customer info captured for follow-up
- AI handles gracefully without transfer capability

**Note:** Live transfer is out of scope for MVP. Future versions may support this.

---

### Flow 46: System Maintenance Mode

**Actors:** Homeowner (Caller), AI Agent
**Scenario:** System is under maintenance, limited functionality

**Conversation:**
```
AI: Thanks for calling Mike's Lawn Care. Our system is currently undergoing brief
    maintenance. I can still help you with a quote, but I may not be able to book
    appointments right now. What's your address?

Caller: 567 Oak Street, Springfield, 62701.

AI: Let me look that up... Your lot is about 9,000 square feet. Weekly mowing would
    be $45 per visit. I'm currently unable to access the calendar for booking, but
    I'll have Mike call you within the hour to schedule your first appointment.
    What's your phone number?

Caller: 555-0567.

AI: Perfect! I've noted your quote at $45 for weekly service. Mike will call you
    shortly to get you scheduled. I apologize for the inconvenience!

Caller: No problem, thanks!
```

**Expected Outcomes:**
- Quote provided normally
- Booking deferred to manual follow-up
- Owner notification sent
- System gracefully degrades

---

### Flow 47: Data Export (Owner Downloads All Leads)

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Owner wants to export all lead data

**Steps:**
```
1. Log into dashboard
2. Navigate to Leads tab
3. Click "Export to CSV"
4. Select date range: "All time"
5. Click "Download"
6. CSV file downloads:
   - Columns: Name, Phone, Email, Address, Lot Size, Quote, Status, Date, Notes
   - 150 rows of data
7. Owner opens in Excel/Google Sheets
8. Can analyze conversion rates, pricing effectiveness
```

**Expected Outcomes:**
- Export function generates CSV
- All leads for tenant included (RLS enforced)
- Data formatted for spreadsheet use
- Owner can do offline analysis

---

### Flow 48: Troubleshooting Failed Booking (Owner Review)

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Owner notices a call resulted in no booking, investigates

**Steps:**
```
1. Log into dashboard
2. Navigate to Calls tab
3. Filter: Status = "Quote Given, No Booking"
4. See call from yesterday
5. Click to view details:
   - Customer: Tom Wilson
   - Phone: 555-0678
   - Address: 345 Maple Drive
   - Quote: $55
   - Outcome: Quote given, customer wanted to think about it
6. Listen to recording
7. Hear: "Let me think about it and call you back"
8. Add follow-up task: "Call Tom in 3 days"
9. Owner manually calls customer later
```

**Expected Outcomes:**
- Dashboard provides visibility into non-bookings
- Recordings help owner understand objections
- Owner can take manual action
- Conversion funnel analysis possible

---

### Flow 49: Scaling: Owner Adds Second Team Member

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Business growing, Mike wants to give access to assistant

**Steps:**
```
1. Log into dashboard
2. Navigate to Settings → Team (Future feature)
3. Click "Invite Team Member"
4. Enter email: assistant@mikeslawncare.com
5. Set permissions: "View only" (can see calls/leads, cannot edit settings)
6. Send invitation
7. Assistant receives email
8. Assistant creates account
9. Assistant can now log in and view calls/leads
```

**Expected Outcomes:**
- User record created linked to same tenant
- RLS ensures data isolation
- Permission levels enforced
- Collaboration enabled

**Note:** Team features are out of scope for MVP but shown for completeness.

---

### Flow 50: Seasonal Shutdown and Reactivation

**Actors:** Business Owner (Mike), Dashboard
**Scenario:** Owner pauses service for winter, reactivates in spring

**Shutdown (November):**
```
1. Log into dashboard
2. Navigate to Settings → Account
3. Click "Pause Service"
4. Confirm: "Pause until March 1st"
5. Phone number deactivated
6. AI stops answering calls
7. Dashboard remains accessible (read-only)
8. Billing paused (no charges)
```

**Reactivation (March):**
```
1. Owner receives email: "Ready to reactivate?"
2. Log into dashboard
3. Click "Reactivate Service"
4. Review settings (pricing, service areas)
5. Update if needed
6. Click "Reactivate"
7. Phone number reactivated
8. AI starts answering calls
9. Billing resumes
```

**Expected Outcomes:**
- Subscription status: "paused"
- Data retained during pause
- Reactivation smooth and quick
- No loss of historical data

**Note:** Pause feature is out of scope for MVP. Owner would need to cancel and re-signup. Future enhancement.

---

## Summary Statistics

**Total Flows:** 50

**By Category:**
- Happy Path Flows: 20 (40%)
- Edge Cases & Error Handling: 15 (30%)
- Onboarding & Account Management: 7 (14%)
- Advanced Features & Troubleshooting: 8 (16%)

**Key Themes Covered:**
- ✅ Standard quote and booking (multiple variations)
- ✅ Different customer types (homeowner, renter, property manager, commercial)
- ✅ Error scenarios (bad connection, wrong number, system failures)
- ✅ Pricing scenarios (discounts, objections, competitive quotes)
- ✅ Calendar management (conflicts, availability, scheduling)
- ✅ Service area validation (in/out of area)
- ✅ Property lookup (success and failure cases)
- ✅ Owner workflows (dashboard, settings, data export)
- ✅ Edge cases (prank calls, abusive callers, accents)
- ✅ Advanced scenarios (multi-property, same-day service, seasonal)

---

**End of User Conversation Flows Document**
