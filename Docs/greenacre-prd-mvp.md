# GreenAcre AI
## Product Requirements Document (PRD)
### MVP Release

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Status:** Draft  
**Product Owner:** [TBD]  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Market](#3-target-market)
4. [Product Vision](#4-product-vision)
5. [MVP Scope](#5-mvp-scope)
6. [User Personas](#6-user-personas)
7. [User Journeys](#7-user-journeys)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Success Metrics](#10-success-metrics)
11. [Out of Scope](#11-out-of-scope-for-mvp)
12. [Risks & Assumptions](#12-risks--assumptions)
13. [Release Criteria](#13-release-criteria)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

GreenAcre AI is an AI-powered voice agent platform that enables lawn care businesses to automate customer phone calls. The platform handles inbound calls 24/7, providing instant quotes based on property data, booking appointments directly on the business owner's calendar, and sending confirmations—all without human intervention.

### 1.2 Business Opportunity

The lawn care industry in the United States represents a $130+ billion market with over 600,000 businesses, predominantly small operators (1-5 employees). These businesses face a critical challenge: missed calls directly translate to lost revenue. Industry data suggests:

- 62% of calls to small businesses go unanswered
- 85% of callers who can't reach a business won't call back
- The average lawn care lead is worth $500-2,000 annually

GreenAcre AI addresses this gap by providing an affordable, always-available AI receptionist that can handle the most common customer interactions: getting quotes and booking service.

### 1.3 MVP Goal

Launch a functional multi-tenant platform that allows lawn care business owners to:
1. Sign up and configure their AI agent in under 15 minutes
2. Receive a dedicated phone number
3. Have the AI handle quote requests and appointment bookings
4. View leads and call history in a dashboard

**Target:** 10 paying pilot customers within 60 days of launch.

---

## 2. Problem Statement

### 2.1 The Problem

Small lawn care business owners are losing customers because they can't answer every phone call. When they're mowing lawns, driving between jobs, or simply after hours, calls go to voicemail—and most potential customers hang up and call a competitor instead.

### 2.2 Current Solutions & Limitations

| Current Solution | Limitation |
|-----------------|------------|
| Voicemail | 85% of callers won't leave a message |
| Answering services | $200-500/month, can't give quotes or book appointments |
| Hiring staff | $3,000+/month, not viable for small operators |
| Call back later | Customer has already called a competitor |
| Website forms | Most customers prefer to call, low conversion |

### 2.3 Impact of the Problem

For a typical lawn care business:
- Missing 5 calls per week = 20 calls per month
- If 30% would have converted = 6 lost customers
- Average customer value = $1,200/year
- **Annual lost revenue: $7,200+**

### 2.4 Problem Validation

Through customer discovery interviews with 25+ lawn care business owners:
- 92% identified missed calls as a significant problem
- 76% said they lose at least 3-5 potential customers per month to missed calls
- 84% expressed interest in an AI solution if it could accurately quote and book
- Price sensitivity centered around $100-200/month

---

## 3. Target Market

### 3.1 Primary Market

**Solo operators and small lawn care businesses (1-5 employees)**

Characteristics:
- Annual revenue: $50,000 - $500,000
- Service area: Single metro area or region
- Services: Primarily lawn mowing, may include basic landscaping
- Technology: Smartphone-centric, limited office infrastructure
- Pain point intensity: Highest (owner is usually the one mowing)

### 3.2 Market Size

| Metric | Value |
|--------|-------|
| Total lawn care businesses in US | 600,000+ |
| Small operators (target segment) | ~500,000 |
| Serviceable market (tech-ready) | ~200,000 |
| Initial target (early adopters) | ~20,000 |
| MVP target | 10-50 customers |

### 3.3 Geographic Focus (MVP)

- United States only
- English language only
- Focus on suburban markets with single-family homes

---

## 4. Product Vision

### 4.1 Vision Statement

*"Every lawn care business, regardless of size, should be able to capture every lead—even when they're behind a mower."*

### 4.2 Product Principles

1. **Simple Setup**: Business owners should be able to configure and launch their AI agent without technical knowledge, in under 15 minutes.

2. **Accuracy Over Speed**: The AI should give accurate quotes based on real property data rather than guessing. A slightly longer call with an accurate quote beats a fast, wrong answer.

3. **Natural Conversation**: The AI should sound like a friendly, helpful human—not a robotic IVR system. Customers should feel comfortable talking to it.

4. **Transparent Operations**: Business owners should have full visibility into every call, quote, and booking. No black box.

5. **Owner Control**: Pricing, service areas, availability, and messaging should be fully configurable by the business owner.

### 4.3 Long-Term Vision (Post-MVP)

- Expand to adjacent home services (landscaping, pest control, cleaning)
- Outbound calling (appointment reminders, follow-ups)
- Multi-language support
- Integration with field service management software
- AI-powered route optimization
- Customer relationship management (CRM) features

---

## 5. MVP Scope

### 5.1 What's Included in MVP

#### Core Capabilities

| Capability | Description |
|-----------|-------------|
| Inbound call handling | AI answers calls 24/7, engages in natural conversation |
| Property-based quoting | Looks up property lot size to calculate accurate quotes |
| Service area validation | Confirms caller is within serviceable area |
| Appointment booking | Books directly on owner's Google Calendar |
| SMS confirmations | Sends confirmation texts to customer and owner |
| Lead capture | Saves all caller information and call details |

#### Tenant (Business Owner) Features

| Feature | Description |
|---------|-------------|
| Self-service onboarding | Sign up and configure agent without assistance |
| Dedicated phone number | Unique number for their business |
| Pricing configuration | Set prices based on lot size tiers |
| Service area setup | Define ZIP codes served |
| Calendar integration | Connect Google Calendar |
| Dashboard | View calls, leads, and basic metrics |
| Call recordings | Listen to recordings of all calls |
| Transcripts | Read transcripts of all calls |

### 5.2 MVP Limitations

| Limitation | Rationale |
|-----------|-----------|
| Google Calendar only | Most common among target users; others in V2 |
| English only | Focus on US market for MVP |
| Lawn mowing only | Core service; landscaping/extras in V2 |
| Inbound calls only | Outbound calling (reminders, follow-ups) in V2 |
| No CRM integrations | Standalone system for MVP |
| Basic reporting | Advanced analytics in V2 |

---

## 6. User Personas

### 6.1 Primary Persona: Mike the Mower

**Demographics**
- Age: 35-55
- Role: Owner/operator of small lawn care business
- Business size: Solo or 1-2 helpers
- Revenue: $75,000-200,000/year
- Location: Suburban area

**Goals**
- Grow the business without hiring office staff
- Never miss a potential customer
- Spend more time doing work, less time on the phone
- Provide professional customer experience

**Pain Points**
- Can't answer calls while mowing
- Loses customers to competitors who answer faster
- Evenings/weekends spent returning missed calls
- Existing answering services can't give quotes

**Technology Profile**
- Primary device: iPhone or Android smartphone
- Uses Google Calendar for scheduling
- Comfortable with basic apps
- Limited patience for complex setup

**Quote**
> *"I know I'm losing jobs every week because I can't answer my phone. But I can't afford to hire someone just to answer calls."*

---

### 6.2 Secondary Persona: Sarah the Homeowner (Caller)

**Demographics**
- Age: 30-60
- Role: Homeowner seeking lawn care service
- Location: Suburban single-family home

**Goals**
- Get a quick, accurate price quote
- Schedule service at a convenient time
- Avoid phone tag and voicemail loops
- Find reliable, professional service

**Pain Points**
- Calling multiple companies to compare prices
- Waiting for callbacks that never come
- Uncertainty about pricing until someone visits
- Difficulty scheduling around work hours

**Behavior**
- Prefers phone over online forms for service inquiries
- Makes decisions quickly if given enough information
- Values responsiveness as a proxy for reliability

**Quote**
> *"If I call and nobody answers, I just move on to the next one. I don't have time to wait around."*

---

## 7. User Journeys

### 7.1 Business Owner: Onboarding Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    OWNER ONBOARDING JOURNEY                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DISCOVER                                                       │
│  ────────                                                       │
│  Owner learns about GreenAcre AI through:                      │
│  • Word of mouth from another lawn care owner                  │
│  • Facebook/social media ad                                    │
│  • Google search for "lawn care answering service"             │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  EVALUATE                                                       │
│  ────────                                                       │
│  Owner visits website and sees:                                │
│  • Clear value proposition ("Never miss a lead")               │
│  • Demo video showing AI in action                             │
│  • Transparent pricing                                         │
│  • Testimonials from similar businesses                        │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  SIGN UP (5 minutes)                                           │
│  ───────────────────                                           │
│  1. Create account (email, password)                           │
│  2. Enter business name and owner info                         │
│  3. Choose subscription plan                                   │
│  4. Enter payment information                                  │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  CONFIGURE (10 minutes)                                        │
│  ──────────────────────                                        │
│  5. Define service area (enter ZIP codes)                      │
│  6. Set pricing tiers (by lot size)                           │
│  7. Connect Google Calendar                                    │
│  8. Get dedicated phone number                                 │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  TEST                                                          │
│  ────                                                          │
│  9. Make test call to new number                              │
│  10. Verify AI uses correct business name                      │
│  11. Test quote accuracy                                       │
│  12. Verify appointment appears on calendar                    │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  LAUNCH                                                        │
│  ──────                                                        │
│  13. Start using number on website/ads                        │
│  14. Forward existing number (optional)                        │
│  15. Monitor dashboard for incoming calls                      │
│                                                                 │
│                                                                 │
│  Success Criteria:                                             │
│  • Complete setup in under 15 minutes                         │
│  • Make successful test call                                   │
│  • Feel confident the AI represents their business            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7.2 Homeowner: Getting a Quote Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER CALL JOURNEY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRIGGER                                                        │
│  ───────                                                        │
│  Homeowner decides they need lawn care service:                │
│  • Grass is overgrown                                          │
│  • Moving to new home                                          │
│  • Previous service quit/unreliable                            │
│  • Saw truck in neighborhood, liked their work                 │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  SEARCH                                                        │
│  ──────                                                        │
│  Homeowner finds lawn care company:                            │
│  • Google search "lawn mowing near me"                         │
│  • Nextdoor recommendation                                     │
│  • Truck sign / yard sign                                      │
│  • Facebook local services                                     │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  CALL                                                          │
│  ────                                                          │
│  Homeowner calls the phone number                              │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  AI GREETING (0:00)                                            │
│  ─────────────────                                             │
│  "Thanks for calling Mike's Lawn Care! I can help you          │
│   get a quote or schedule service. What's your address?"       │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  CUSTOMER PROVIDES ADDRESS (0:15)                              │
│  ────────────────────────────────                              │
│  "I'm at 123 Oak Street in Springfield, 62701"                 │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  AI LOOKS UP PROPERTY (0:20)                                   │
│  ───────────────────────────                                   │
│  [AI queries property database for lot size]                   │
│  [Verifies ZIP code is in service area]                        │
│  [Calculates price based on owner's pricing tiers]             │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  AI PROVIDES QUOTE (0:30)                                      │
│  ────────────────────────                                      │
│  "Great! Your lot is about a quarter acre, so weekly           │
│   mowing would be $55 per visit. Would you like to             │
│   schedule your first appointment?"                            │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  CUSTOMER RESPONDS                                             │
│  ────────────────                                              │
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │   "Yes, I'd     │              │   "Let me think │          │
│  │   like to book" │              │   about it"     │          │
│  └────────┬────────┘              └────────┬────────┘          │
│           │                                │                    │
│           ▼                                ▼                    │
│                                                                 │
│  AI OFFERS TIMES (0:45)            AI OFFERS FOLLOW-UP         │
│  ──────────────────────            ──────────────────          │
│  "I have Tuesday at 9am            "No problem! I'll text      │
│   or Thursday at 2pm.              you the quote details.      │
│   Which works better?"             We'd love to earn your      │
│                                    business!"                  │
│           │                                │                    │
│           ▼                                ▼                    │
│                                                                 │
│  BOOKING CONFIRMED (1:00)          LEAD CAPTURED               │
│  ────────────────────────          ────────────                │
│  "You're all set for               [Save to dashboard]         │
│   Tuesday at 9am!                  [Send quote via SMS]        │
│   I've sent you a                  [Owner notified]            │
│   confirmation text."                                          │
│           │                                                     │
│           ▼                                                     │
│                                                                 │
│  POST-CALL ACTIONS                                             │
│  ─────────────────                                             │
│  • Appointment added to owner's Google Calendar                │
│  • Confirmation SMS sent to customer                           │
│  • Notification SMS sent to owner                              │
│  • Lead record created in dashboard                            │
│  • Call recording saved                                        │
│  • Transcript generated                                        │
│                                                                 │
│                                                                 │
│  Success Criteria:                                             │
│  • Call completed in under 2 minutes                          │
│  • Customer received accurate quote                            │
│  • Appointment successfully booked (if desired)                │
│  • Customer felt they were talking to helpful human            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7.3 Business Owner: Daily Operations Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    OWNER DAILY OPERATIONS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MORNING (6:00 AM)                                             │
│  ────────────────                                              │
│  Owner wakes up, checks phone:                                 │
│  • Sees SMS notifications for 2 overnight leads                │
│  • One booking, one quote request                              │
│  • Opens dashboard to see details                              │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  DURING WORK (8:00 AM - 5:00 PM)                              │
│  ───────────────────────────────                               │
│  Owner is mowing lawns:                                        │
│  • AI handles all incoming calls                               │
│  • Owner receives SMS for each new lead                        │
│  • Bookings automatically appear on calendar                   │
│  • No interruption to work                                     │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  END OF DAY (5:30 PM)                                          │
│  ────────────────────                                          │
│  Owner reviews dashboard:                                      │
│  • 5 total calls today                                         │
│  • 3 quotes given                                              │
│  • 2 appointments booked                                       │
│  • 1 outside service area (noted for expansion)               │
│                                                                 │
│  Owner actions:                                                │
│  • Listens to one call recording (customer had question)       │
│  • Follows up on quote that didn't book                       │
│  • Checks tomorrow's schedule on calendar                     │
│                                                                 │
│                         ▼                                       │
│                                                                 │
│  EVENING / AFTER HOURS                                         │
│  ─────────────────────                                         │
│  • AI continues handling calls                                 │
│  • Owner sees "new lead" notifications                        │
│  • No need to interrupt dinner or family time                 │
│                                                                 │
│                                                                 │
│  Success Criteria:                                             │
│  • Zero missed calls during work hours                        │
│  • Owner can review all activity in < 5 minutes               │
│  • New bookings appear correctly on calendar                  │
│  • Owner feels confident AI is representing them well         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Functional Requirements

### 8.1 Onboarding & Account Setup

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| ONB-01 | User can create account with email and password | Must Have | Account created, verification email sent |
| ONB-02 | User can enter business information (name, owner name, phone) | Must Have | Data saved and displayed correctly |
| ONB-03 | User can select subscription plan | Must Have | Plan selected, reflected in billing |
| ONB-04 | User can enter payment information | Must Have | Stripe checkout completes successfully |
| ONB-05 | User can define service area by ZIP codes | Must Have | ZIP codes saved, used for area validation |
| ONB-06 | User can configure pricing tiers by lot size | Must Have | Tiers saved, used for quote calculation |
| ONB-07 | User can connect Google Calendar via OAuth | Must Have | Calendar connected, test event created |
| ONB-08 | User receives dedicated phone number | Must Have | Number provisioned and associated with account |
| ONB-09 | User can make test call to verify setup | Should Have | Test call works end-to-end |
| ONB-10 | Onboarding progress is saved if user leaves mid-flow | Should Have | User can resume where they left off |

---

### 8.2 AI Voice Agent Capabilities

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| AI-01 | Agent answers calls with business name greeting | Must Have | Correct business name spoken |
| AI-02 | Agent engages in natural, conversational dialogue | Must Have | Conversation feels human, not robotic |
| AI-03 | Agent can understand various ways of stating an address | Must Have | Handles "123 Main St", "one twenty three main street", etc. |
| AI-04 | Agent looks up property to determine lot size | Must Have | Accurate lot size retrieved in >90% of calls |
| AI-05 | Agent validates caller is in service area | Must Have | Correctly accepts/rejects based on ZIP |
| AI-06 | Agent calculates quote based on owner's pricing | Must Have | Quote matches configured pricing tiers |
| AI-07 | Agent presents quote naturally in conversation | Must Have | Quote communicated clearly |
| AI-08 | Agent can offer available appointment times | Must Have | Times offered match calendar availability |
| AI-09 | Agent can book appointment on calendar | Must Have | Event created with correct details |
| AI-10 | Agent sends SMS confirmation to customer | Must Have | SMS received with correct details |
| AI-11 | Agent notifies owner of new lead/booking | Must Have | Owner receives SMS notification |
| AI-12 | Agent handles "not interested" gracefully | Must Have | Polite close, lead still captured |
| AI-13 | Agent handles off-topic questions appropriately | Should Have | Redirects or offers owner callback |
| AI-14 | Agent handles interruptions mid-sentence | Should Have | Conversation continues naturally |
| AI-15 | Agent can handle caller asking to speak to human | Should Have | Offers callback, captures info |

---

### 8.3 Dashboard & Reporting

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DASH-01 | User can view list of all calls | Must Have | Calls listed with date, time, duration, outcome |
| DASH-02 | User can view call details (recording, transcript) | Must Have | Recording plays, transcript displays |
| DASH-03 | User can view list of all leads | Must Have | Leads listed with contact info and status |
| DASH-04 | User can see lead details (property, quote, status) | Must Have | All relevant info displayed |
| DASH-05 | User can see basic metrics (calls, leads, bookings) | Must Have | Metrics accurate and current |
| DASH-06 | Dashboard updates in real-time or near-real-time | Should Have | New calls appear within 30 seconds |
| DASH-07 | User can filter calls by date range | Should Have | Filter works correctly |
| DASH-08 | User can filter leads by status | Should Have | Filter works correctly |
| DASH-09 | User can export leads to CSV | Could Have | Export includes all lead fields |

---

### 8.4 Settings & Configuration

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-01 | User can update business information | Must Have | Changes saved and reflected in AI |
| SET-02 | User can update service area (add/remove ZIPs) | Must Have | Changes effective immediately |
| SET-03 | User can update pricing tiers | Must Have | New pricing used on next call |
| SET-04 | User can view/manage Google Calendar connection | Must Have | Can see status, reconnect if needed |
| SET-05 | User can view their phone number | Must Have | Number displayed |
| SET-06 | User can view/update billing information | Must Have | Stripe billing portal accessible |
| SET-07 | User can cancel subscription | Must Have | Cancellation processed |
| SET-08 | User can customize greeting message | Could Have | Custom greeting used by AI |
| SET-09 | User can set business hours for availability | Could Have | AI behavior differs after hours |

---

### 8.5 Notifications

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| NOT-01 | Owner receives SMS for new booking | Must Have | SMS within 30 seconds of booking |
| NOT-02 | Owner receives SMS for new lead (no booking) | Must Have | SMS within 30 seconds of call end |
| NOT-03 | Customer receives SMS confirmation for booking | Must Have | SMS within 30 seconds of booking |
| NOT-04 | Customer receives SMS with quote details | Should Have | SMS within 30 seconds if requested |
| NOT-05 | Owner can configure notification preferences | Could Have | Can disable specific notifications |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Call answer time | < 2 seconds | Time from ring to AI greeting |
| Voice response latency | < 1 second | Time from user speech end to AI response start |
| Quote calculation time | < 3 seconds | Time from address given to quote provided |
| Dashboard load time | < 2 seconds | Time to initial render |
| SMS delivery | < 30 seconds | Time from trigger to delivery |

### 9.2 Reliability

| Requirement | Target |
|-------------|--------|
| System uptime | 99.9% (8.7 hours downtime/year max) |
| Call success rate | > 98% of calls answered without technical failure |
| Data durability | Zero data loss for call records, leads, settings |
| Disaster recovery | Restore service within 4 hours of major incident |

### 9.3 Scalability

| Requirement | Target |
|-------------|--------|
| Concurrent calls per tenant | Up to 3 simultaneous calls |
| Total concurrent calls (system) | Up to 100 for MVP |
| Tenants supported | Up to 100 for MVP |
| Call volume | Up to 1,000 calls/day system-wide |

### 9.4 Security

| Requirement | Description |
|-------------|-------------|
| Data encryption | All data encrypted at rest and in transit |
| Authentication | Secure login with password requirements |
| Payment security | PCI-compliant via Stripe |
| Access control | Tenants can only access their own data |
| Call recordings | Stored securely, accessible only to tenant |

### 9.5 Usability

| Requirement | Target |
|-------------|--------|
| Onboarding completion rate | > 70% of signups complete setup |
| Time to complete onboarding | < 15 minutes |
| Mobile responsiveness | Dashboard usable on smartphone |
| Accessibility | WCAG 2.1 AA compliance |

---

## 10. Success Metrics

### 10.1 Business Metrics

| Metric | Target (30 days post-launch) | Target (90 days) |
|--------|------------------------------|------------------|
| Paying customers | 10 | 50 |
| Monthly recurring revenue | $1,500 | $7,500 |
| Customer acquisition cost | < $100 | < $75 |
| Churn rate | < 10% monthly | < 5% monthly |

### 10.2 Product Metrics

| Metric | Target |
|--------|--------|
| Onboarding completion rate | > 70% |
| Calls handled successfully | > 95% |
| Accurate quotes delivered | > 90% |
| Booking conversion rate | > 30% of calls |
| Customer satisfaction (caller) | > 4.0/5.0 rating |
| Owner satisfaction | > 4.5/5.0 rating |

### 10.3 Engagement Metrics

| Metric | Target |
|--------|--------|
| Daily active users (dashboard) | > 50% of customers |
| Average calls per customer per week | > 5 |
| Feature adoption (call recording playback) | > 60% |
| Settings customization rate | > 80% adjust pricing |

---

## 11. Out of Scope (for MVP)

The following features are explicitly **NOT** included in MVP and will be considered for future releases:

### 11.1 Future Features (V2+)

| Feature | Rationale for Exclusion |
|---------|------------------------|
| Outbound calling (reminders, follow-ups) | Focus MVP on inbound; high value but adds complexity |
| Additional calendar integrations (Outlook, Apple) | Google Calendar covers majority of target users |
| Multi-language support | US English market sufficient for MVP validation |
| CRM integrations (Jobber, Service Titan) | Standalone system sufficient for MVP |
| Advanced analytics and reporting | Basic metrics sufficient for MVP |
| Custom AI voice selection | Default voice sufficient for MVP |
| Multiple service types (landscaping, etc.) | Lawn mowing only to start; expand post-validation |
| Team/employee accounts | Solo operators are primary MVP target |
| White-labeling | Not needed for MVP |
| API access | Not needed for MVP |
| Mobile app | Responsive web sufficient for MVP |

### 11.2 Explicit Non-Goals

- Replacing all human interaction (AI should complement, not replace owner)
- Handling complex estimates requiring on-site visits
- Processing payments (booking only; payment handled separately)
- Managing ongoing customer relationships (CRM functionality)
- Dispatching or route optimization

---

## 12. Risks & Assumptions

### 12.1 Assumptions

| Assumption | Impact if Wrong | Mitigation |
|------------|-----------------|------------|
| Lawn care owners will trust AI to represent their business | Low adoption | Extensive testing, easy rollback, human backup option |
| Property data (lot sizes) is accurate enough for quoting | Inaccurate quotes, unhappy customers | Validate data sources, allow manual override |
| Google Calendar is sufficient for MVP | Limits addressable market | Prioritize other calendars in V2 |
| $150/month price point is acceptable | Low conversion | Test pricing, offer trial period |
| Owners can complete setup without assistance | High abandonment | Provide setup assistance option |
| SMS notifications are sufficient (vs. email) | Missed notifications | Add email in V2 if needed |

### 12.2 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI gives incorrect quotes | Medium | High | Validate against real data, test extensively |
| AI sounds too robotic | Medium | High | Invest in voice quality, test with real users |
| Call quality issues (latency, dropouts) | Low | High | Use reliable providers, monitor quality |
| Property data unavailable for some addresses | Medium | Medium | Graceful fallback (ask customer for lot size) |
| Regulatory issues (call recording consent) | Low | Medium | Implement proper consent announcements |
| Competition from larger players | Medium | Medium | Focus on niche, build relationships |
| Difficulty acquiring first customers | Medium | High | Leverage networks, offer free trials |

---

## 13. Release Criteria

### 13.1 MVP Launch Criteria

The following must be true before MVP launch:

**Functional Completeness**
- [ ] All "Must Have" requirements implemented and tested
- [ ] End-to-end flow works: signup → setup → call → booking → notification
- [ ] No critical or high-severity bugs open

**Quality**
- [ ] Call success rate > 95% in testing
- [ ] Quote accuracy > 90% in testing
- [ ] Voice latency < 1 second in 95% of calls
- [ ] Dashboard loads in < 2 seconds

**Operations**
- [ ] Monitoring and alerting in place
- [ ] Error tracking configured
- [ ] Backup and recovery tested
- [ ] Support process defined

**Business**
- [ ] Pricing finalized
- [ ] Terms of service and privacy policy published
- [ ] Payment processing tested
- [ ] Support documentation created

### 13.2 Beta Testing Requirements

Before general availability:
- [ ] Minimum 5 beta customers using system for 2+ weeks
- [ ] Each beta customer handles 10+ real calls
- [ ] Beta customer satisfaction > 4.0/5.0
- [ ] No critical issues reported in final week of beta

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| Tenant | A lawn care business using the GreenAcre platform |
| Lead | A potential customer who called, whether or not they booked |
| Booking | An appointment scheduled on the owner's calendar |
| Quote | The price provided to a caller based on their property |
| Service Area | ZIP codes where a tenant provides service |
| Lot Size | Square footage of a property, used for pricing |
| Dashboard | Web interface where owners manage their account |

### 14.2 Pricing Tiers (Default)

| Lot Size | Default Price (Weekly) |
|----------|----------------------|
| Up to 5,000 sq ft | $35 |
| 5,001 - 10,000 sq ft | $45 |
| 10,001 - 15,000 sq ft | $55 |
| 15,001 - 22,000 sq ft | $70 |
| 22,001+ sq ft | $85+ (custom) |

*Owners can customize these tiers during setup.*

### 14.3 Sample Call Script

**AI Greeting:**
> "Thanks for calling [Business Name]! I can help you get a quote for lawn mowing service. What's your address?"

**After Address:**
> "Let me look that up... I found your property at [Address]. It looks like your lot is about [X] square feet, which is roughly [quarter acre/half acre/etc]. Weekly mowing would be $[Price] per visit. Would you like to schedule your first appointment?"

**Offering Times:**
> "I have a few openings this week: [Day] in the morning or [Day] in the afternoon. Which works better for you?"

**Confirming Booking:**
> "Perfect! You're all set for [Day] at [Time]. I've sent you a confirmation text. Is there anything else I can help you with?"

**If Outside Service Area:**
> "I'm sorry, but we don't currently service your area. Would you like me to take your information so [Owner Name] can reach out if we expand there?"

---

### 14.4 Competitive Landscape

| Competitor | Type | Pricing | Limitations |
|------------|------|---------|-------------|
| Ruby Receptionists | Human answering | $349+/mo | Can't give quotes, limited hours |
| Smith.ai | Human + AI | $255+/mo | Generic, not industry-specific |
| Bland AI | AI platform | Usage-based | Requires technical setup |
| Synthflow | AI platform | $29+/mo | Generic, no property lookup |
| Goodcall | AI for SMB | $59+/mo | Limited customization |

**GreenAcre Differentiation:**
- Purpose-built for lawn care (understands the business)
- Property data integration for accurate quotes
- Simple setup (no technical knowledge required)
- Calendar integration for instant booking
- Competitive pricing for small operators

---

*End of Document*
