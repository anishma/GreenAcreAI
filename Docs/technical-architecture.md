# GreenAcre AI - Technical Architecture Document
## Enterprise-Grade Multi-Tenant Voice AI Platform

**Version:** 1.2 (High-Priority Enhancements)
**Date:** January 1, 2026
**Status:** Design Document
**Architecture Owner:** [TBD]

---

## 🔄 Document Updates

### v1.2 - High-Priority Database Enhancements (January 1, 2026)

**Added from Database Gap Analysis:**

1. **Business Hours Validation Function** (SET-09)
   - Created `is_within_business_hours()` function for appointment scheduling
   - Used to determine which time slots are available for booking
   - Supports timezone-aware scheduling across different time zones
   - **IMPORTANT:** AI answers calls 24/7; business_hours only limits appointment availability
   - Example: Customer calls at 10pm → AI answers, provides quote, books next available slot during business hours

2. **Test Call Completion Tracking** (ONB-09)
   - Added `test_call_completed` BOOLEAN field to tenants table
   - Added `test_call_completed_at` TIMESTAMPTZ field
   - Tracks onboarding test call completion status
   - Improves onboarding analytics and UX

### v1.1 - Key Changes from Original Design

1. **LLM Strategy** → Changed from VAPI built-in to **Custom LangGraph Agent**
   - Build state-managed conversation flow from day 1
   - Full control, better debugging, 40% cost savings
   - Complexity trade-off: 2-3 weeks vs 1 week build time

2. **Storage** → Changed from Vercel Blob to **Supabase Storage**
   - Free tier (1GB) vs paid-only
   - 7x cheaper ($0.021/GB vs $0.15/GB)
   - Integrated with existing Supabase infrastructure

3. **Infrastructure Pricing** → Start with **free tiers**
   - Vercel: Hobby (free) instead of Pro ($20/mo)
   - Supabase: Free tier instead of Pro ($25/mo)
   - **Saves $45/mo** at MVP scale

4. **PCI Compliance** → Clarified Stripe is for **platform subscriptions only**
   - Business owners pay GreenAcre (not customers paying during calls)
   - Customer payments happen after service (business owner's workflow)

5. **Cost Analysis** → Updated with LangGraph economics
   - MVP: $3,967/mo (down from $4,022/mo)
   - Scale (1k tenants): $169k/mo with LangGraph (vs $375k with VAPI full stack)
   - 59% cost reduction using custom agent

**Architecture Philosophy**: Invest in custom LangGraph agent upfront for long-term control, cost efficiency, and product differentiation. Use managed services (VAPI STT/TTS, Supabase) to accelerate launch.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Requirements Analysis](#2-requirements-analysis)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Data Architecture](#5-data-architecture)
6. [API Design](#6-api-design)
7. [Security Architecture](#7-security-architecture)
8. [Scalability Strategy](#8-scalability-strategy)
9. [Cost Analysis](#9-cost-analysis)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Trade-Off Analysis](#11-trade-off-analysis)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Architecture Overview

GreenAcre AI is a multi-tenant, cloud-native voice AI platform built on modern serverless and managed services. The architecture prioritizes:

- **Multi-tenancy**: Complete data isolation, per-tenant customization
- **Scalability**: Horizontal scaling from 10 to 50,000+ tenants
- **Cost-efficiency**: Pay-per-use model optimized for MVP (<$1k/month)
- **Low latency**: <1s voice response times via edge computing and caching
- **High reliability**: 99.9% uptime through managed services and redundancy

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Voice Infrastructure | VAPI (STT/TTS only) | Managed telephony, speech services; we handle LLM |
| LLM Strategy | Custom LangGraph Agent | Full control, state management, 40% cost savings, better debugging |
| Tool Integration | MCP (Model Context Protocol) | Future-proof, standardized, better isolation than function calling |
| Application Framework | Next.js 14 (App Router) | Full-stack, SSR, API routes, excellent DX |
| Database | PostgreSQL (Supabase Free) | Robust multi-tenancy, RLS, auth, real-time, managed, free tier |
| Storage | Supabase Storage (Free) | 7x cheaper than alternatives, integrated auth/RLS, 1GB free |
| Hosting | Vercel (Hobby Free) | Serverless, edge functions, zero-config, 100GB bandwidth free |
| Authentication | Supabase Auth | Managed, secure, multi-tenant ready |
| Payment Processing | Stripe | PCI-compliant, subscription management (platform billing only) |
| Monitoring | Sentry + Vercel Analytics | Error tracking, performance monitoring, free tiers |

### 1.3 Architecture Principles

1. **Simplicity First**: Use managed services to reduce operational complexity
2. **Pay-as-you-grow**: Serverless architecture scales with demand
3. **Security by Default**: Multi-tenant isolation, encryption, least privilege
4. **Observability**: Comprehensive logging, monitoring, and alerting
5. **Developer Experience**: Fast iteration, type safety, modern tooling

---

## 2. Requirements Analysis

### 2.1 Functional Requirements Summary

From the PRD, the system must support:

**Tenant Management**
- Self-service onboarding (<15 min)
- Business configuration (name, service areas, pricing)
- Calendar integration (Google Calendar OAuth)
- Phone number provisioning
- Dashboard for calls, leads, recordings

**Voice AI Agent**
- Inbound call handling (24/7)
- Natural conversation flow
- Address parsing and property lookup
- Quote calculation based on lot size
- Service area validation
- Appointment booking
- SMS confirmations

**Notifications**
- SMS to customer (booking confirmation)
- SMS to owner (new lead/booking)
- Real-time dashboard updates

### 2.2 Non-Functional Requirements

| Category | Requirement | Target | Impact on Architecture |
|----------|-------------|--------|------------------------|
| **Performance** | Voice response latency | <1s | Edge functions, caching, optimized LLM |
| | Call answer time | <2s | VAPI managed telephony |
| | Quote calculation | <3s | Fast property API, caching |
| | Dashboard load | <2s | SSR, edge caching, optimized queries |
| **Scalability** | Concurrent calls | 100 (MVP) → 10,000+ | VAPI auto-scales, stateless design |
| | Tenants | 10 (MVP) → 50,000+ | Horizontal scaling, sharding strategy |
| | Calls/day | 1,000 → 500,000+ | Event-driven, async processing |
| **Reliability** | Uptime | 99.9% | Managed services, multi-region, redundancy |
| | Call success rate | >98% | Error handling, fallbacks, retry logic |
| **Security** | Data encryption | At rest & transit | TLS, database encryption, secrets management |
| | Multi-tenant isolation | Complete | Row-level security, tenant scoping |
| | PCI compliance | Via Stripe | No card data touches our servers |
| **Cost** | MVP operational | <$1k/month | Serverless, pay-per-use pricing |

### 2.3 Critical User Flows

**Flow 1: Tenant Onboarding**
```
Sign up → Configure business → Set pricing → Connect calendar → Get phone number → Test call → Go live
```
- Must complete in <15 minutes
- Zero technical knowledge required
- Progressive disclosure of complexity

**Flow 2: Inbound Call Handling**
```
Call received → AI answers → Collect address → Lookup property → Calculate quote → Offer booking → Confirm via SMS
```
- Must feel natural and human
- <2 minute total call duration
- >90% quote accuracy

**Flow 3: Dashboard Monitoring**
```
Owner logs in → See real-time calls → View lead details → Listen to recordings → Review daily metrics
```
- Mobile-responsive
- Real-time updates
- <2s load time

---

## 3. High-Level Architecture

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GREENACRE AI ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                        │
│  │  Homeowners      │         │  Business Owners │                        │
│  │  (Phone Calls)   │         │  (Web Dashboard) │                        │
│  └────────┬─────────┘         └────────┬─────────┘                        │
│           │                             │                                  │
│           │ PSTN/VoIP                   │ HTTPS                           │
└───────────┼─────────────────────────────┼──────────────────────────────────┘
            │                             │
            │                             │
┌───────────▼─────────────────────────────▼──────────────────────────────────┐
│                           EDGE/CDN LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                     VAPI (Voice Infrastructure)                  │       │
│  │  • Telephony (Twilio/Vonage)                                   │       │
│  │  • Speech-to-Text (Deepgram)                                   │       │
│  │  • Text-to-Speech (ElevenLabs/PlayHT)                          │       │
│  │  • LLM Integration (GPT-4 Turbo)                               │       │
│  │  • Call Routing & Management                                   │       │
│  └──────────────────────────────┬──────────────────────────────────┘       │
│                                 │                                          │
│  ┌──────────────────────────────▼──────────────────────────────────┐       │
│  │              Vercel Edge Network (CDN + Edge Functions)          │       │
│  │  • Next.js SSR/SSG pages                                        │       │
│  │  • API routes (serverless functions)                            │       │
│  │  • Edge middleware (auth, rate limiting)                        │       │
│  └──────────────────────────────┬──────────────────────────────────┘       │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
                                  │
┌─────────────────────────────────▼──────────────────────────────────────────┐
│                         APPLICATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    Next.js Application (Vercel)                  │       │
│  │                                                                  │       │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │       │
│  │  │  Web Dashboard │  │   API Routes   │  │  Webhook Handler │  │       │
│  │  │                │  │                │  │                  │  │       │
│  │  │  • Auth        │  │  • Tenant CRUD │  │  • VAPI events   │  │       │
│  │  │  • Calls list  │  │  • Call logs   │  │  • Stripe events │  │       │
│  │  │  • Leads mgmt  │  │  • Lead mgmt   │  │  • Calendar sync │  │       │
│  │  │  • Settings    │  │  • Webhooks    │  │                  │  │       │
│  │  │  • Recordings  │  │  • Analytics   │  │                  │  │       │
│  │  └────────────────┘  └────────────────┘  └──────────────────┘  │       │
│  │                                                                  │       │
│  └──────────────────────────────┬───────────────────────────────────┘       │
│                                 │                                          │
│  ┌──────────────────────────────▼──────────────────────────────────┐       │
│  │                     MCP Server Infrastructure                    │       │
│  │                                                                  │       │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │       │
│  │  │  Property   │  │   Calendar   │  │   Business Logic     │   │       │
│  │  │  Lookup MCP │  │   MCP Server │  │   MCP Server         │   │       │
│  │  │             │  │              │  │                      │   │       │
│  │  │  • Address  │  │  • Get slots │  │  • Quote calc        │   │       │
│  │  │    parsing  │  │  • Book appt │  │  • Service area      │   │       │
│  │  │  • Lot size │  │  • Conflict  │  │    validation        │   │       │
│  │  │    lookup   │  │    check     │  │  • Pricing tiers     │   │       │
│  │  └─────────────┘  └──────────────┘  └──────────────────────┘   │       │
│  │                                                                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │
┌─────────────────────────────────▼──────────────────────────────────────────┐
│                           DATA/SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐     │
│  │   Supabase       │  │     Stripe       │  │  Google Calendar API │     │
│  │   (PostgreSQL)   │  │                  │  │                      │     │
│  │                  │  │  • Subscriptions │  │  • OAuth 2.0         │     │
│  │  • Tenant data   │  │  • Payments      │  │  • Events CRUD       │     │
│  │  • Call records  │  │  • Invoicing     │  │  • Availability      │     │
│  │  • Lead data     │  │  • Webhooks      │  │                      │     │
│  │  • Auth/Users    │  │                  │  │                      │     │
│  │  • RLS policies  │  │                  │  │                      │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘     │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐     │
│  │   Twilio/VAPI    │  │  Property Data   │  │  Supabase Storage    │     │
│  │   Phone Numbers  │  │   API (Regrid)   │  │   (S3-compatible)    │     │
│  │                  │  │                  │  │                      │     │
│  │  • Number mgmt   │  │  • Lot size      │  │  • Call recordings   │     │
│  │  • SMS (Twilio)  │  │  • Parcel data   │  │  • Transcripts       │     │
│  │  • Call routing  │  │  • GIS lookup    │  │  • Assets            │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       OBSERVABILITY & OPERATIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐     │
│  │     Sentry       │  │ Vercel Analytics │  │   PostHog/Mixpanel   │     │
│  │                  │  │                  │  │                      │     │
│  │  • Error track   │  │  • Performance   │  │  • Product analytics │     │
│  │  • Performance   │  │  • Web vitals    │  │  • User behavior     │     │
│  │  • Alerting      │  │  • Edge metrics  │  │  • Feature flags     │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Interaction Flow

#### Flow 1: Inbound Call Processing

```
┌─────────┐
│ Caller  │
└────┬────┘
     │
     │ (1) Makes call to tenant's number
     ▼
┌────────────┐
│    VAPI    │
│  Telephony │
└─────┬──────┘
      │
      │ (2) Routes to tenant-specific agent config
      ▼
┌────────────────────┐
│   VAPI AI Agent    │
│   (GPT-4 + Tools)  │
└──────────┬─────────┘
           │
           │ (3) Greeting: "Thanks for calling [Business Name]..."
           │
           │ (4) Customer provides address
           │
           │ (5) Call MCP tool: property_lookup(address)
           ▼
┌─────────────────────┐
│  Property Lookup    │
│     MCP Server      │
└──────────┬──────────┘
           │
           │ (6) Query Regrid API for lot size
           ▼
┌─────────────────────┐
│   Regrid Property   │
│       Data API      │
└──────────┬──────────┘
           │
           │ (7) Return: { lot_size: 10000, address: "..." }
           ▼
┌─────────────────────┐
│  Property Lookup    │
│     MCP Server      │
└──────────┬──────────┘
           │
           │ (8) Return structured data to AI
           ▼
┌────────────────────┐
│   VAPI AI Agent    │
└──────────┬─────────┘
           │
           │ (9) Call MCP tool: calculate_quote(tenant_id, lot_size)
           ▼
┌─────────────────────┐
│  Business Logic     │
│     MCP Server      │
└──────────┬──────────┘
           │
           │ (10) Load tenant pricing config from DB
           ▼
┌─────────────────────┐
│     Supabase        │
│    (PostgreSQL)     │
└──────────┬──────────┘
           │
           │ (11) Return pricing tiers
           ▼
┌─────────────────────┐
│  Business Logic     │
│     MCP Server      │
└──────────┬──────────┘
           │
           │ (12) Calculate: $55 for 10k sq ft
           │      Return: { price: 55, frequency: "weekly" }
           ▼
┌────────────────────┐
│   VAPI AI Agent    │
└──────────┬─────────┘
           │
           │ (13) "Your lot is 10,000 sq ft, weekly mowing is $55"
           │
           │ (14) Customer: "Yes, I'd like to book"
           │
           │ (15) Call MCP tool: get_available_slots(tenant_id)
           ▼
┌─────────────────────┐
│   Calendar MCP      │
│      Server         │
└──────────┬──────────┘
           │
           │ (16) Query Google Calendar API
           ▼
┌─────────────────────┐
│  Google Calendar    │
│        API          │
└──────────┬──────────┘
           │
           │ (17) Return available slots
           ▼
┌────────────────────┐
│   VAPI AI Agent    │
└──────────┬─────────┘
           │
           │ (18) "I have Tuesday 9am or Thursday 2pm..."
           │
           │ (19) Customer chooses Tuesday 9am
           │
           │ (20) Call MCP tool: book_appointment(...)
           ▼
┌─────────────────────┐
│   Calendar MCP      │
│      Server         │
└──────────┬──────────┘
           │
           │ (21) Create event in Google Calendar
           │ (22) Save lead record to Supabase
           │ (23) Trigger SMS notifications (Twilio)
           │
           ▼
┌────────────────────┐
│   VAPI AI Agent    │
└──────────┬─────────┘
           │
           │ (24) "You're all set for Tuesday at 9am!"
           │
           ▼
      ┌────────┐
      │ Caller │
      └────────┘
```

### 3.3 Data Flow Patterns

**Pattern 1: Synchronous (Real-time)**
- Voice interactions (VAPI ↔ MCP ↔ External APIs)
- Dashboard queries (User ↔ Next.js ↔ Supabase)
- Property lookups during calls

**Pattern 2: Asynchronous (Event-driven)**
- Call completion → Process recording → Generate transcript
- Booking creation → Send SMS → Update dashboard
- Webhook processing (Stripe, VAPI, Google Calendar)

**Pattern 3: Batch Processing**
- Daily analytics aggregation
- Monthly billing calculations
- Call recording archival

---

## 4. Technology Stack

### 4.1 Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    GREENACRE AI TECH STACK                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Next.js 14 (App Router, React 18)                     │  │
│  │  • TypeScript 5.x                                        │  │
│  │  • Tailwind CSS + shadcn/ui                              │  │
│  │  • React Hook Form + Zod                                 │  │
│  │  • TanStack Query (React Query)                          │  │
│  │  • Zustand (client state)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Backend                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Next.js API Routes (serverless functions)             │  │
│  │  • TypeScript 5.x                                        │  │
│  │  • tRPC (type-safe APIs)                                 │  │
│  │  • Zod (validation)                                      │  │
│  │  • Prisma (ORM)                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Voice AI Infrastructure                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • VAPI (managed voice platform)                         │  │
│  │    - Telephony: Twilio/Vonage                            │  │
│  │    - STT: Deepgram Nova 2                                │  │
│  │    - TTS: ElevenLabs Turbo v2                            │  │
│  │    - LLM: GPT-4 Turbo (0125 or later)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Tool Integration (MCP)                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • MCP SDK (TypeScript)                                  │  │
│  │  • Custom MCP servers:                                   │  │
│  │    - Property lookup (Regrid API)                        │  │
│  │    - Calendar management (Google Calendar)               │  │
│  │    - Business logic (quotes, validation)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Database & Storage                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Supabase (PostgreSQL 15)                              │  │
│  │  • Prisma ORM                                            │  │
│  │  • Supabase Storage (call recordings, transcripts)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Authentication & Authorization                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Supabase Auth                                         │  │
│  │  • Row-Level Security (RLS)                              │  │
│  │  • JWT tokens                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  External Services                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Stripe (payments, subscriptions)                      │  │
│  │  • Twilio (SMS notifications)                            │  │
│  │  • Google Calendar API (scheduling)                      │  │
│  │  • Regrid API (property data)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Hosting & Infrastructure                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Vercel (Next.js hosting, serverless functions)        │  │
│  │  • Supabase Cloud (database, auth)                       │  │
│  │  • VAPI Cloud (voice infrastructure)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Monitoring & Observability                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Sentry (error tracking, performance)                  │  │
│  │  • Vercel Analytics (web vitals, edge metrics)           │  │
│  │  • PostHog (product analytics, feature flags)            │  │
│  │  • Better Stack (logging aggregation)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Development & DevOps                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • GitHub (version control)                              │  │
│  │  • GitHub Actions (CI/CD)                                │  │
│  │  • Vercel (preview deployments)                          │  │
│  │  • ESLint + Prettier (code quality)                      │  │
│  │  • Jest + Playwright (testing)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Rationale

#### 4.2.1 Voice Infrastructure: VAPI

**Decision**: Use VAPI as the managed voice platform

**Alternatives Considered**:
1. **Build custom with LiveKit/Twilio**
   - Pros: More control, potentially lower cost at scale
   - Cons: Significant engineering effort, complex orchestration, 3-6 month delay

2. **Other managed platforms (Bland AI, Synthflow)**
   - Pros: Managed service
   - Cons: Less flexible, not as robust for enterprise

3. **VAPI (Selected)**
   - Pros:
     - Managed telephony, STT, TTS, LLM orchestration
     - Built-in tool/function calling support
     - MCP integration possible
     - Excellent latency (<1s response time achievable)
     - Scales automatically
     - Developer-friendly API
   - Cons:
     - Vendor lock-in (mitigated by standard interfaces)
     - Cost at extreme scale (transition plan for 10k+ tenants)

**Rationale**:
- MVP needs to launch in weeks, not months
- VAPI handles the complex orchestration of voice components
- Cost-effective at MVP scale (~$0.20-0.40/min)
- Migration path exists if needed (VAPI abstractions are standard)

#### 4.2.2 LLM Strategy: Custom LangGraph Agent

**Decision**: Build custom LangGraph agent with state management, exposed via custom LLM endpoint to VAPI

**Architecture**:
```
Call → VAPI (STT/TTS only) → Custom LangGraph Agent (LLM + State) → MCP Tools
```

**Why Custom LangGraph vs VAPI Built-in?**

| Factor | VAPI Built-in LLM | Custom LangGraph Agent ✅ |
|--------|-------------------|---------------------------|
| **Control** | Limited (VAPI's prompt) | Full control over conversation flow |
| **State Management** | VAPI-managed (black box) | Explicit state graph (transparent) |
| **Complex Logic** | Single LLM call per turn | Multi-step reasoning with loops |
| **Cost (per call)** | $0.25/min (VAPI markup) | $0.15/min (STT+TTS+OpenAI direct) |
| **Debugging** | Limited (VAPI logs only) | Full visibility into state transitions |
| **Latency** | <500ms (VAPI optimized) | 600-800ms (extra hop to our endpoint) |
| **Time to Build** | 1 week | 2-3 weeks |
| **Flexibility** | Fixed pipeline | Custom retry logic, fallbacks, branching |

**Rationale for Custom LangGraph**:
1. **State Management**: Complex conversation requires tracking context (address collected, quote given, calendar checked)
2. **Multi-step Logic**: "Check property → Calculate quote → Validate service area → Check calendar → Book" needs explicit orchestration
3. **Cost Savings**: 40% cheaper at scale ($0.15 vs $0.25/min)
4. **Full Control**: Can implement custom prompts, retry logic, error handling
5. **Debugging**: See exactly which node failed, inspect state at each step
6. **Long-term Value**: Own the core IP (conversation logic), not vendor-locked

**Implementation**:

```typescript
// app/api/vapi-llm/route.ts
import { StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Define conversation state
interface ConversationState {
  messages: Array<{ role: string; content: string }>;
  tenant_id: string;
  call_id: string;
  customer_address?: string;
  property_data?: { lot_size: number; parcel_id: string };
  quote?: { price: number; frequency: string };
  booking?: { scheduled_at: string; calendar_event_id: string };
  stage: 'greeting' | 'address_collection' | 'quoting' | 'booking' | 'closing';
}

// Create LangGraph workflow
const createConversationGraph = (tenantId: string) => {
  const llm = new ChatOpenAI({
    model: "gpt-4-turbo",
    temperature: 0.7
  });

  const graph = new StateGraph<ConversationState>({
    channels: {
      messages: { value: (x, y) => x.concat(y) },
      tenant_id: { value: (x, y) => y ?? x },
      call_id: { value: (x, y) => y ?? x },
      customer_address: { value: (x, y) => y ?? x },
      property_data: { value: (x, y) => y ?? x },
      quote: { value: (x, y) => y ?? x },
      booking: { value: (x, y) => y ?? x },
      stage: { value: (x, y) => y ?? x },
    },
  });

  // Define nodes (conversation steps)
  graph.addNode("greet", async (state) => {
    const tenant = await getTenant(state.tenant_id);
    return {
      messages: [{
        role: "assistant",
        content: `Thanks for calling ${tenant.businessName}! I can help you get a quote for lawn mowing service. What's your address?`
      }],
      stage: "address_collection"
    };
  });

  graph.addNode("extract_address", async (state) => {
    // Use LLM to extract address from user's message
    const lastMessage = state.messages[state.messages.length - 1];
    const extraction = await llm.invoke([
      { role: "system", content: "Extract street address, city, state, and ZIP from the user's message. Return as JSON." },
      { role: "user", content: lastMessage.content }
    ]);

    const address = JSON.parse(extraction.content);
    return { customer_address: address };
  });

  graph.addNode("lookup_property", async (state) => {
    // Call MCP tool to get property data
    const propertyData = await mcpClient.callTool("property-lookup", "lookup_property", {
      address: state.customer_address
    });

    return { property_data: propertyData };
  });

  graph.addNode("calculate_quote", async (state) => {
    // Call MCP tool to calculate quote
    const quote = await mcpClient.callTool("business-logic", "calculate_quote", {
      tenant_id: state.tenant_id,
      lot_size_sqft: state.property_data.lot_size
    });

    return {
      quote,
      stage: "quoting",
      messages: [{
        role: "assistant",
        content: `Great! Your lot is about ${state.property_data.lot_size} square feet. ${quote.frequency} mowing would be $${quote.price} per visit. Would you like to schedule your first appointment?`
      }]
    };
  });

  graph.addNode("check_interest", async (state) => {
    // Use LLM to determine if user wants to book
    const lastMessage = state.messages[state.messages.length - 1];
    const intent = await llm.invoke([
      { role: "system", content: "Does the user want to book an appointment? Return 'yes' or 'no'." },
      { role: "user", content: lastMessage.content }
    ]);

    return { user_wants_booking: intent.content.toLowerCase().includes("yes") };
  });

  graph.addNode("offer_times", async (state) => {
    // Call MCP tool to get available slots
    const slots = await mcpClient.callTool("calendar", "get_available_slots", {
      tenant_id: state.tenant_id,
      date_start: new Date().toISOString(),
      date_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    return {
      stage: "booking",
      messages: [{
        role: "assistant",
        content: `I have ${slots.available_slots[0].start} or ${slots.available_slots[1].start}. Which works better for you?`
      }]
    };
  });

  graph.addNode("book_appointment", async (state) => {
    // Extract chosen time, then book
    const booking = await mcpClient.callTool("calendar", "book_appointment", {
      tenant_id: state.tenant_id,
      start_time: state.chosen_time,
      customer_name: state.customer_name,
      customer_phone: state.customer_phone,
      property_address: state.customer_address,
      estimated_price: state.quote.price
    });

    return {
      booking,
      stage: "closing",
      messages: [{
        role: "assistant",
        content: `Perfect! You're all set for ${state.chosen_time}. I've sent you a confirmation text. Is there anything else I can help you with?`
      }]
    };
  });

  // Define edges (conversation flow)
  graph.addEdge("greet", "extract_address");
  graph.addConditionalEdges("extract_address", (state) => {
    return state.customer_address ? "lookup_property" : "extract_address";
  });
  graph.addEdge("lookup_property", "calculate_quote");
  graph.addEdge("calculate_quote", "check_interest");
  graph.addConditionalEdges("check_interest", (state) => {
    return state.user_wants_booking ? "offer_times" : "closing";
  });
  graph.addEdge("offer_times", "book_appointment");
  graph.addEdge("book_appointment", "closing");

  graph.setEntryPoint("greet");

  return graph.compile();
};

// API endpoint for VAPI
export async function POST(req: Request) {
  const { messages, metadata } = await req.json();
  const { call_id, tenant_id } = metadata;

  // Get or create graph for this call
  const graph = createConversationGraph(tenant_id);

  // Run the graph with current state
  const result = await graph.invoke({
    messages,
    tenant_id,
    call_id,
    stage: "greeting"
  });

  // Return response in VAPI's expected format
  return Response.json({
    message: result.messages[result.messages.length - 1].content,
    metadata: {
      stage: result.stage,
      quote: result.quote,
      booking: result.booking
    }
  });
}
```

**Key Benefits**:
1. **Explicit State**: See exactly where conversation is (greeting → address → quote → booking)
2. **Conditional Logic**: Different paths based on user responses
3. **Error Handling**: Retry address extraction if unclear, fallback to human if stuck
4. **Testable**: Each node can be unit tested independently
5. **Observable**: Log state transitions, debug conversation flow

**Complexity Trade-off**:
- More upfront engineering (2-3 weeks vs 1 week)
- But long-term benefits: lower cost, full control, better debugging
- Worth it for a core product feature (conversation is the product)

**Integration with VAPI**:
1. Configure VAPI to use custom LLM endpoint: `POST /api/vapi-llm`
2. VAPI handles STT (speech → text) and TTS (text → speech)
3. Our LangGraph agent handles all conversation logic
4. MCP tools provide data (property lookup, calendar, quotes)

#### 4.2.3 Tool Integration: MCP vs Function Calling

**Decision**: Use MCP (Model Context Protocol) for tool integration

**Comparison**:

| Approach | Standardization | Modularity | Security | Debugging | Future-proof | Complexity |
|----------|----------------|------------|----------|-----------|--------------|------------|
| **Function Calling (Native)** | ⭐⭐ (vendor-specific) | ⭐⭐ (tightly coupled) | ⭐⭐⭐ (inline) | ⭐⭐⭐ (simple) | ⭐⭐ (proprietary) | ⭐⭐⭐⭐⭐ (low) |
| **LangChain Tools** | ⭐⭐⭐ (framework-specific) | ⭐⭐⭐⭐ (reusable) | ⭐⭐⭐ (depends) | ⭐⭐ (complex) | ⭐⭐⭐ (evolving) | ⭐⭐⭐ (medium) |
| **MCP** | ⭐⭐⭐⭐⭐ (open protocol) | ⭐⭐⭐⭐⭐ (truly modular) | ⭐⭐⭐⭐⭐ (isolated) | ⭐⭐⭐⭐ (structured) | ⭐⭐⭐⭐⭐ (Anthropic-backed) | ⭐⭐⭐⭐ (medium-low) |

**MCP Advantages**:
1. **Standardization**: Open protocol, not tied to specific LLM vendor
2. **Modularity**: Each MCP server is independent, can be versioned/deployed separately
3. **Security**: Process isolation, separate auth, resource limits
4. **Reusability**: Same MCP server can be used by multiple agents/applications
5. **Future-proof**: Anthropic + industry backing, designed for enterprise
6. **Debugging**: Structured logging, clear boundaries

**MCP Implementation**:
```typescript
// Property Lookup MCP Server
export const propertyLookupServer = {
  name: 'property-lookup',
  version: '1.0.0',
  tools: {
    lookup_property: {
      description: 'Look up property lot size by address',
      input_schema: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Full street address' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' }
        },
        required: ['address', 'city', 'state', 'zip']
      },
      handler: async (input) => {
        // Call Regrid API
        const result = await regridAPI.lookup(input);
        return {
          lot_size_sqft: result.lot_size,
          parcel_id: result.parcel_id,
          zoning: result.zoning
        };
      }
    }
  }
};
```

**Fallback Plan**: If VAPI doesn't support MCP natively:
1. Implement MCP servers as Next.js API routes
2. Use VAPI's function calling to invoke MCP endpoints
3. Transform function calls to MCP protocol
4. This hybrid gives us MCP benefits with VAPI compatibility

#### 4.2.4 Application Framework: Next.js 14

**Decision**: Next.js 14 (App Router) + TypeScript

**Rationale**:
- **Full-stack**: Frontend + API routes in one codebase
- **SSR/SSG**: Fast initial loads, SEO-friendly
- **Edge functions**: Low-latency webhook processing
- **Developer experience**: Hot reload, TypeScript, great ecosystem
- **Deployment**: Zero-config Vercel deployment
- **Type safety**: End-to-end with tRPC

**Alternatives**:
- **Separate frontend (React) + backend (Node/Express)**: More complex deployment
- **Remix**: Great DX but smaller ecosystem
- **SvelteKit**: Less mature ecosystem for enterprise

#### 4.2.5 Database & Storage: PostgreSQL (Supabase)

**Decision**: Supabase (managed PostgreSQL + Storage) + Prisma ORM

**Rationale**:
- **Multi-tenancy**: Row-Level Security (RLS) for tenant isolation
- **Integrated auth**: Supabase Auth handles JWT, sessions
- **Real-time**: Built-in subscriptions for dashboard updates
- **Managed**: Automatic backups, scaling, monitoring
- **Cost-effective**: Free tier for MVP (500MB DB + 1GB storage)
- **PostgreSQL**: Robust, ACID, excellent JSON support
- **Integrated Storage**: Same RLS policies, auth, cheaper than alternatives

**Storage Strategy (Supabase Storage)**:
- **Call recordings**: Stored in Supabase Storage buckets
- **Transcripts**: Stored in database (searchable) + backup in storage
- **Cost**: Free tier (1GB), then $0.021/GB (vs Vercel Blob $0.15/GB)
- **Security**: Same RLS policies as database, signed URLs
- **Migration path**: S3-compatible API, easy to migrate if needed

**Free Tier Limits** (Sufficient for MVP with 10-50 tenants):
- Database: 500MB (plenty for thousands of calls)
- Storage: 1GB (100+ hours of call recordings)
- Bandwidth: 2GB/month
- When to upgrade: Database > 500MB or storage > 1GB

**Schema Design Principles**:
- Single database, tenant_id on all tables (shared schema)
- RLS policies enforce data isolation
- Indexes on tenant_id + common query patterns
- JSONB for flexible metadata

**Alternatives**:
- **MongoDB**: Less suited for relational data (calls ↔ leads ↔ tenants)
- **PlanetScale (MySQL)**: Good but less feature-rich than Postgres
- **AWS RDS**: More expensive, less integrated
- **Cloudflare R2**: Cheaper storage at scale but requires separate auth

#### 4.2.6 Hosting: Vercel

**Decision**: Vercel for application hosting

**Rationale**:
- **Serverless**: Auto-scaling, pay-per-use
- **Edge network**: Global CDN, low latency
- **Zero config**: Push to deploy
- **Preview deployments**: Per-PR environments
- **Monitoring**: Built-in analytics, web vitals
- **Cost**: Free (Hobby tier) for MVP, upgrade as needed

**Hobby (Free) Tier** (Sufficient for MVP):
- Unlimited deployments
- 100GB bandwidth/month (plenty for 10-50 tenants)
- Serverless function executions
- 1 team member
- Preview deployments on PRs

**When to upgrade to Pro ($20/mo)**:
- Bandwidth > 100GB/month (typically at 100+ tenants)
- Need team collaboration (multiple developers)
- Want advanced analytics
- Need password protection on preview deployments

**Alternatives**:
- **AWS (ECS/Lambda)**: More complex, higher ops burden
- **Railway/Render**: Good but less mature ecosystem
- **Self-hosted**: Not worth the ops complexity for MVP

### 4.3 Technology Decision Matrix

| Category | Technology | Confidence | Risk | Migration Path |
|----------|-----------|------------|------|----------------|
| Voice Infrastructure | VAPI | High | Medium | Custom LiveKit solution at >10k tenants |
| LLM (MVP) | VAPI GPT-4 | High | Low | Custom endpoint in V2 |
| Tool Protocol | MCP | Medium | Low | Works with any LLM, future-proof |
| App Framework | Next.js 14 | High | Very Low | Industry standard, not going anywhere |
| Database | Supabase | High | Low | Postgres is portable |
| Hosting | Vercel | High | Low | Next.js is portable to any host |
| Payments | Stripe | High | Very Low | Industry standard, PCI compliant |
| SMS | Twilio | High | Low | Can swap for SNS/SendGrid |
| Monitoring | Sentry | High | Very Low | Standard error tracking |

---

## 5. Data Architecture

### 5.1 Database Schema

```sql
-- =====================================================
-- GREENACRE AI DATABASE SCHEMA
-- PostgreSQL 15 + Supabase
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Tenants (Business Owners)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Business Info
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),

  -- Service Configuration
  service_areas JSONB NOT NULL DEFAULT '[]', -- Array of ZIP codes
  pricing_tiers JSONB NOT NULL DEFAULT '[]', -- Array of {min_sqft, max_sqft, weekly_price, biweekly_price, service_inclusions[], pricing_type}
  allows_generic_quotes BOOLEAN DEFAULT true, -- Can quote without address?
  generic_quote_disclaimer TEXT DEFAULT 'Prices vary by property size. Address needed for exact quote.'

  -- Integration Credentials (encrypted)
  google_calendar_refresh_token TEXT,
  google_calendar_access_token TEXT,
  google_calendar_token_expires_at TIMESTAMPTZ,
  calendar_id VARCHAR(255),

  -- Phone Number
  phone_number VARCHAR(20) UNIQUE,
  phone_number_sid VARCHAR(255), -- Twilio/VAPI identifier

  -- VAPI Configuration
  vapi_agent_id VARCHAR(255),
  vapi_phone_number_id VARCHAR(255),

  -- Subscription
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trialing', -- trialing, active, past_due, canceled
  subscription_plan VARCHAR(50) DEFAULT 'starter', -- starter, pro, enterprise
  trial_ends_at TIMESTAMPTZ,

  -- Settings
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  business_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}}', -- For appointment scheduling only, AI answers 24/7
  notification_preferences JSONB DEFAULT '{"sms_new_lead": true, "sms_new_booking": true}',

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, canceled
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step VARCHAR(50) DEFAULT 'signup', -- signup, business_info, pricing, calendar, phone, complete
  test_call_completed BOOLEAN DEFAULT FALSE,
  test_call_completed_at TIMESTAMPTZ

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_phone_number ON tenants(phone_number);
CREATE INDEX idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================

-- Users (for auth, mapped to tenants)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'owner', -- owner, admin, member (for future team accounts)

  -- Supabase auth integration
  auth_user_id UUID UNIQUE, -- Links to auth.users

  -- Profile
  full_name VARCHAR(255),
  avatar_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================

-- Calls (all inbound calls)
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Call Metadata
  vapi_call_id VARCHAR(255) UNIQUE,
  phone_number_called VARCHAR(20), -- Tenant's number
  caller_phone_number VARCHAR(20), -- Customer's number

  -- Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Call Details
  status VARCHAR(50), -- queued, ringing, in-progress, completed, failed, busy, no-answer
  end_reason VARCHAR(100), -- customer-hung-up, agent-error, etc.

  -- Conversation Data
  transcript JSONB, -- Full conversation with timestamps
  transcript_text TEXT, -- Plain text for search
  summary TEXT, -- AI-generated summary

  -- Call Outcome
  outcome VARCHAR(50), -- quote_given, booking_made, outside_area, not_interested, hang_up
  quote_amount DECIMAL(10,2),
  booking_made BOOLEAN DEFAULT FALSE,
  lead_captured BOOLEAN DEFAULT FALSE,

  -- Recordings
  recording_url TEXT,
  recording_duration INTEGER,

  -- Cost Tracking
  cost_total DECIMAL(10,4), -- Total cost of call (VAPI billing)
  cost_breakdown JSONB, -- {llm: 0.05, tts: 0.02, stt: 0.01, telephony: 0.02}

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_calls_tenant_id ON calls(tenant_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX idx_calls_vapi_call_id ON calls(vapi_call_id);
CREATE INDEX idx_calls_caller_phone_number ON calls(caller_phone_number);
CREATE INDEX idx_calls_outcome ON calls(outcome);
CREATE INDEX idx_calls_tenant_created ON calls(tenant_id, created_at DESC);

-- Full-text search on transcript
CREATE INDEX idx_calls_transcript_text ON calls USING gin(to_tsvector('english', transcript_text));

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================

-- Leads (potential customers from calls)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,

  -- Contact Info
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),

  -- Property Info
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  lot_size_sqft INTEGER,
  parcel_id VARCHAR(100),

  -- Quote Details
  quote_amount DECIMAL(10,2),
  quote_frequency VARCHAR(50), -- weekly, biweekly, monthly
  service_type VARCHAR(100) DEFAULT 'lawn_mowing',

  -- Lead Status
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, quoted, booked, lost, customer
  source VARCHAR(50) DEFAULT 'phone_call', -- phone_call, web_form, referral

  -- Follow-up
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_at TIMESTAMPTZ,
  notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_call_id ON leads(call_id);
CREATE INDEX idx_leads_phone_number ON leads(phone_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================

-- Bookings (appointments scheduled)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Booking Details
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- Service Info
  service_type VARCHAR(100) DEFAULT 'lawn_mowing',
  estimated_price DECIMAL(10,2),

  -- Customer Info
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),

  -- Property
  property_address TEXT,
  property_city VARCHAR(100),
  property_state VARCHAR(2),
  property_zip VARCHAR(10),

  -- Integration IDs
  google_calendar_event_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, completed, canceled, no_show
  cancellation_reason TEXT,

  -- Notifications
  confirmation_sent BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT
);

-- Indexes
CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_call_id ON bookings(call_id);
CREATE INDEX idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_tenant_scheduled ON bookings(tenant_id, scheduled_at);

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================

-- Notifications (SMS/email sent)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Notification Details
  type VARCHAR(50) NOT NULL, -- sms, email
  template VARCHAR(100), -- booking_confirmation, new_lead_alert, etc.
  recipient VARCHAR(255) NOT NULL, -- phone or email

  -- Content
  subject VARCHAR(255),
  body TEXT,

  -- Delivery
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
  provider VARCHAR(50), -- twilio, sendgrid, etc.
  provider_message_id VARCHAR(255),
  error_message TEXT,

  -- Timing
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_status ON notifications(status);

-- =====================================================

-- Webhooks (incoming webhook logs)
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source
  source VARCHAR(50) NOT NULL, -- vapi, stripe, google_calendar
  event_type VARCHAR(100) NOT NULL,

  -- Payload
  payload JSONB NOT NULL,
  headers JSONB,

  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Related Records
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_webhooks_source ON webhooks(source);
CREATE INDEX idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at DESC);
CREATE INDEX idx_webhooks_processed ON webhooks(processed);

-- =====================================================

-- Analytics (aggregated metrics for performance)
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Call Metrics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  avg_call_duration_seconds INTEGER DEFAULT 0,

  -- Outcome Metrics
  quotes_given INTEGER DEFAULT 0,
  bookings_made INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,

  -- Conversion Metrics
  quote_to_booking_rate DECIMAL(5,2), -- percentage

  -- Cost Metrics
  total_cost DECIMAL(10,2),
  avg_cost_per_call DECIMAL(10,4),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(date, tenant_id)
);

-- Indexes
CREATE INDEX idx_analytics_daily_tenant_date ON analytics_daily(tenant_id, date DESC);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);

-- =====================================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's data
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY calls_tenant_isolation ON calls
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY leads_tenant_isolation ON leads
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY bookings_tenant_isolation ON bookings
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY notifications_tenant_isolation ON notifications
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY analytics_tenant_isolation ON analytics_daily
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Get tenant's pricing for a given lot size and frequency
CREATE OR REPLACE FUNCTION get_quote_for_lot_size(
  p_tenant_id UUID,
  p_lot_size_sqft INTEGER,
  p_frequency VARCHAR(20) DEFAULT 'weekly' -- 'weekly' or 'biweekly'
)
RETURNS TABLE (
  weekly_price DECIMAL(10,2),
  biweekly_price DECIMAL(10,2),
  service_inclusions TEXT[],
  pricing_type VARCHAR(20),
  tier_min_sqft INTEGER,
  tier_max_sqft INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (tier->>'weekly_price')::DECIMAL(10,2) AS weekly_price,
    (tier->>'biweekly_price')::DECIMAL(10,2) AS biweekly_price,
    ARRAY(SELECT jsonb_array_elements_text(tier->'service_inclusions')) AS service_inclusions,
    COALESCE(tier->>'pricing_type', 'estimate')::VARCHAR(20) AS pricing_type,
    (tier->>'min_sqft')::INTEGER AS tier_min_sqft,
    (tier->>'max_sqft')::INTEGER AS tier_max_sqft
  FROM tenants,
       jsonb_array_elements(pricing_tiers) AS tier
  WHERE tenants.id = p_tenant_id
    AND (tier->>'min_sqft')::INTEGER <= p_lot_size_sqft
    AND (COALESCE(tier->>'max_sqft', '999999999'))::INTEGER >= p_lot_size_sqft
  ORDER BY (tier->>'min_sqft')::INTEGER DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Get generic price range for tenant (without specific address)
CREATE OR REPLACE FUNCTION get_generic_price_range(
  p_tenant_id UUID,
  p_frequency VARCHAR(20) DEFAULT 'weekly'
)
RETURNS TABLE (
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  disclaimer TEXT
) AS $$
DECLARE
  v_disclaimer TEXT;
  v_allows_generic BOOLEAN;
BEGIN
  SELECT allows_generic_quotes, generic_quote_disclaimer
  INTO v_allows_generic, v_disclaimer
  FROM tenants
  WHERE id = p_tenant_id;

  IF NOT v_allows_generic THEN
    RETURN QUERY SELECT NULL::DECIMAL(10,2), NULL::DECIMAL(10,2), 'Address required for quote'::TEXT;
    RETURN;
  END IF;

  IF p_frequency = 'weekly' THEN
    RETURN QUERY
    SELECT
      MIN((tier->>'weekly_price')::DECIMAL(10,2)) AS min_price,
      MAX((tier->>'weekly_price')::DECIMAL(10,2)) AS max_price,
      v_disclaimer
    FROM tenants,
         jsonb_array_elements(pricing_tiers) AS tier
    WHERE tenants.id = p_tenant_id
      AND tier->>'weekly_price' IS NOT NULL;
  ELSE
    RETURN QUERY
    SELECT
      MIN((tier->>'biweekly_price')::DECIMAL(10,2)) AS min_price,
      MAX((tier->>'biweekly_price')::DECIMAL(10,2)) AS max_price,
      v_disclaimer
    FROM tenants,
         jsonb_array_elements(pricing_tiers) AS tier
    WHERE tenants.id = p_tenant_id
      AND tier->>'biweekly_price' IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if address is in service area
CREATE OR REPLACE FUNCTION is_in_service_area(
  p_tenant_id UUID,
  p_zip VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
  service_areas JSONB;
BEGIN
  SELECT tenants.service_areas INTO service_areas
  FROM tenants
  WHERE id = p_tenant_id;

  RETURN service_areas @> to_jsonb(p_zip);
END;
$$ LANGUAGE plpgsql;

-- Function: Check if timestamp falls within business hours (for appointment scheduling)
-- NOTE: This does NOT limit when AI answers calls - AI is available 24/7
-- This function is used to determine available appointment times only
CREATE OR REPLACE FUNCTION is_within_business_hours(
  p_tenant_id UUID,
  p_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_business_hours JSONB;
  v_timezone VARCHAR(50);
  v_day_of_week TEXT;
  v_current_time TIME;
  v_day_hours JSONB;
BEGIN
  SELECT business_hours, timezone
  INTO v_business_hours, v_timezone
  FROM tenants
  WHERE id = p_tenant_id;

  -- Convert timestamp to tenant's timezone and get day of week
  v_day_of_week := LOWER(TO_CHAR(p_timestamp AT TIME ZONE v_timezone, 'Day'));
  v_current_time := (p_timestamp AT TIME ZONE v_timezone)::TIME;

  -- Get hours for this day of week (trim spaces from day name)
  v_day_hours := v_business_hours->TRIM(v_day_of_week);

  -- If no hours configured for this day, not available for appointments
  IF v_day_hours IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if time slot is within service hours
  RETURN v_current_time >= (v_day_hours->>'start')::TIME
    AND v_current_time <= (v_day_hours->>'end')::TIME;
END;
$$ LANGUAGE plpgsql;

-- Function: Update lead status when booking is made
CREATE OR REPLACE FUNCTION update_lead_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE leads
    SET status = 'booked',
        updated_at = NOW()
    WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_updates_lead AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION update_lead_on_booking();

-- =====================================================
-- VIEWS (for common queries)
-- =====================================================

-- View: Call summary with lead/booking info
CREATE VIEW call_summary AS
SELECT
  c.id,
  c.tenant_id,
  c.created_at,
  c.caller_phone_number,
  c.duration_seconds,
  c.outcome,
  c.quote_amount,
  l.id AS lead_id,
  l.name AS lead_name,
  l.address AS lead_address,
  b.id AS booking_id,
  b.scheduled_at AS booking_time,
  b.status AS booking_status
FROM calls c
LEFT JOIN leads l ON c.id = l.call_id
LEFT JOIN bookings b ON c.id = b.call_id;

-- =====================================================
-- SEED DATA (for development)
-- =====================================================

-- Insert default pricing tiers
-- (Will be customized by each tenant during onboarding)
CREATE TABLE pricing_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  tiers JSONB NOT NULL
);

INSERT INTO pricing_templates (name, tiers) VALUES
('Standard Lawn Care', '[
  {
    "name": "Small Lot",
    "min_sqft": 0,
    "max_sqft": 5000,
    "weekly_price": 35,
    "biweekly_price": 50,
    "service_inclusions": ["mowing", "basic trimming", "cleanup"],
    "pricing_type": "estimate"
  },
  {
    "name": "Quarter Acre",
    "min_sqft": 5001,
    "max_sqft": 10000,
    "weekly_price": 45,
    "biweekly_price": 65,
    "service_inclusions": ["mowing", "trimming", "edging", "cleanup"],
    "pricing_type": "estimate"
  },
  {
    "name": "Third Acre",
    "min_sqft": 10001,
    "max_sqft": 15000,
    "weekly_price": 55,
    "biweekly_price": 75,
    "service_inclusions": ["mowing", "trimming", "edging", "cleanup"],
    "pricing_type": "estimate"
  },
  {
    "name": "Half Acre",
    "min_sqft": 15001,
    "max_sqft": 22000,
    "weekly_price": 70,
    "biweekly_price": 95,
    "service_inclusions": ["mowing", "trimming", "edging", "cleanup", "blowing"],
    "pricing_type": "estimate"
  },
  {
    "name": "Large Lot",
    "min_sqft": 22001,
    "max_sqft": 99999999,
    "weekly_price": 85,
    "biweekly_price": null,
    "service_inclusions": ["mowing", "trimming", "edging", "cleanup", "blowing"],
    "pricing_type": "estimate"
  }
]');

-- Notes on pricing_tiers structure:
-- - weekly_price: Required. Price for weekly service
-- - biweekly_price: Optional. If null, tenant doesn't offer biweekly for this tier
-- - service_inclusions: Array of services included in price (shown to customer)
-- - pricing_type: "fixed" (exact price) or "estimate" (may vary 5-10% after inspection)
--
-- Example tenant configuration:
-- {
--   "pricing_tiers": [...as above],
--   "allows_generic_quotes": true,
--   "generic_quote_disclaimer": "Prices vary by property size. Address needed for exact quote.",
--   "business_hours": {
--     "monday": {"start": "08:00", "end": "18:00"},
--     "tuesday": {"start": "08:00", "end": "18:00"},
--     "wednesday": {"start": "08:00", "end": "18:00"},
--     "thursday": {"start": "08:00", "end": "18:00"},
--     "friday": {"start": "08:00", "end": "18:00"},
--     "saturday": {"start": "09:00", "end": "14:00"}
--     // NOTE: AI answers calls 24/7, business_hours only used for appointment availability
--     // If someone calls at 10pm, AI still takes the call and books for next available slot
--   },
--   "test_call_completed": false,
--   "test_call_completed_at": null
-- }
```

### 5.2 Data Model Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GREENACRE AI DATA MODEL                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   TENANTS    │
                              │──────────────│
                              │ id (PK)      │
                              │ business_name│
                              │ email        │
                              │ service_areas│
                              │ pricing_tiers│
                              │ phone_number │
                              │ vapi_agent_id│
                              │ stripe_cust_id│
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌────────────┐   ┌────────────┐   ┌────────────┐
           │   USERS    │   │   CALLS    │   │ ANALYTICS  │
           │────────────│   │────────────│   │────────────│
           │ id (PK)    │   │ id (PK)    │   │ id (PK)    │
           │ tenant_id  │   │ tenant_id  │   │ tenant_id  │
           │ email      │   │ vapi_call_id│  │ date       │
           │ role       │   │ caller_phone│  │ total_calls│
           │ auth_user_id│  │ transcript │   │ bookings   │
           └────────────┘   │ outcome    │   └────────────┘
                            │ quote_amt  │
                            └──────┬─────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
           ┌────────────┐  ┌────────────┐  ┌──────────────┐
           │   LEADS    │  │  BOOKINGS  │  │ NOTIFICATIONS│
           │────────────│  │────────────│  │──────────────│
           │ id (PK)    │  │ id (PK)    │  │ id (PK)      │
           │ tenant_id  │  │ tenant_id  │  │ tenant_id    │
           │ call_id    │  │ call_id    │  │ call_id      │
           │ phone      │  │ lead_id    │  │ booking_id   │
           │ address    │  │ scheduled_at│ │ type (sms)   │
           │ lot_size   │  │ google_evt_id│ │ status       │
           │ quote_amt  │  │ status     │  │ body         │
           │ status     │  └────────────┘  └──────────────┘
           └────────────┘

Relationships:
─────────────
• Tenants (1) ──── (N) Users
• Tenants (1) ──── (N) Calls
• Tenants (1) ──── (N) Leads
• Tenants (1) ──── (N) Bookings
• Calls (1) ──── (0..1) Lead
• Calls (1) ──── (0..1) Booking
• Leads (1) ──── (0..N) Bookings
```

### 5.3 State Management Architecture

#### 5.3.1 Server State (Database + Cache)

**Primary Source of Truth**: PostgreSQL (Supabase)

**Caching Strategy**:
```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1: Client-side Cache (React Query)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Tenant config: 5 min TTL                          │  │
│  │  • Call list: 30s TTL, real-time invalidation        │  │
│  │  • Stale-while-revalidate pattern                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  L2: Edge Cache (Vercel Edge Config)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Tenant pricing tiers: 1 hr TTL                    │  │
│  │  • Service areas: 1 hr TTL                           │  │
│  │  • Purge on update via API                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  L3: Database Query Cache (Supabase)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Connection pooling (PgBouncer)                    │  │
│  │  • Query result cache (auto)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cache Invalidation**:
- Webhook received → Invalidate related cache keys
- User updates settings → Purge edge cache + client cache
- Real-time subscription → Push update to connected clients

#### 5.3.2 Client State (Browser)

**State Management**: Zustand (lightweight, TypeScript-first)

```typescript
// Client state structure
interface AppState {
  // UI State
  sidebarOpen: boolean;
  currentTenant: Tenant | null;

  // Optimistic Updates
  pendingCalls: Call[];
  pendingLeads: Lead[];

  // Actions
  setSidebarOpen: (open: boolean) => void;
  addOptimisticCall: (call: Call) => void;
}

// Server state via React Query
const useCallsQuery = (tenantId: string) => {
  return useQuery({
    queryKey: ['calls', tenantId],
    queryFn: () => api.calls.list({ tenantId }),
    staleTime: 30_000, // 30s
    refetchOnWindowFocus: true,
  });
};
```

#### 5.3.3 Real-time State Synchronization

**Technology**: Supabase Realtime (WebSocket)

```typescript
// Subscribe to new calls in real-time
const subscription = supabase
  .channel('calls')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'calls',
      filter: `tenant_id=eq.${tenantId}`,
    },
    (payload) => {
      queryClient.invalidateQueries(['calls', tenantId]);
      toast.success('New call received!');
    }
  )
  .subscribe();
```

### 5.4 Data Flow Examples

#### Example 1: Inbound Call → Lead Creation

```
1. VAPI receives call → Webhook to /api/webhooks/vapi
2. Webhook handler:
   - Extract call data
   - Insert into `calls` table
   - If lead captured → Insert into `leads` table
   - Trigger SMS notification
3. Real-time: Push update to connected dashboard clients
4. Client: React Query invalidates cache, refetches call list
5. Dashboard: Shows new call in real-time
```

#### Example 2: Tenant Updates Pricing

```
1. User submits pricing form
2. API route: /api/tenants/[id]/pricing
   - Validate input (Zod schema)
   - Update `tenants.pricing_tiers` (JSONB)
   - Purge edge cache
3. React Query: Optimistic update → Immediate UI change
4. Server confirms → UI stays updated
5. Next call: Uses new pricing (fetched from updated DB)
```

---

## 6. API Design

### 6.1 API Architecture

**Approach**: tRPC for type-safe APIs + REST webhooks

**Why tRPC?**
- End-to-end type safety (client knows exact API shape)
- Auto-generated types from server schemas
- Better DX than REST for internal APIs
- Works seamlessly with Next.js

**Why REST for webhooks?**
- External services (VAPI, Stripe) expect REST
- Standard HTTP semantics
- Easy to test with curl/Postman

### 6.2 tRPC API Structure

```typescript
// =====================================================
// API ROUTER STRUCTURE
// =====================================================

import { router } from './trpc';
import { authRouter } from './routers/auth';
import { tenantRouter } from './routers/tenant';
import { callRouter } from './routers/call';
import { leadRouter } from './routers/lead';
import { bookingRouter } from './routers/booking';
import { analyticsRouter } from './routers/analytics';

export const appRouter = router({
  auth: authRouter,
  tenant: tenantRouter,
  call: callRouter,
  lead: leadRouter,
  booking: bookingRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

// =====================================================
// TENANT ROUTER
// =====================================================

export const tenantRouter = router({
  // Get current tenant
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.tenant.findUnique({
        where: { id: ctx.user.tenantId },
      });
    }),

  // Update business info
  updateBusinessInfo: protectedProcedure
    .input(z.object({
      businessName: z.string().min(1).max(255),
      ownerName: z.string().min(1).max(255),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tenant.update({
        where: { id: ctx.user.tenantId },
        data: input,
      });
    }),

  // Update service areas
  updateServiceAreas: protectedProcedure
    .input(z.object({
      zipCodes: z.array(z.string().length(5)),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tenant.update({
        where: { id: ctx.user.tenantId },
        data: { serviceAreas: input.zipCodes },
      });
    }),

  // Update pricing tiers
  updatePricing: protectedProcedure
    .input(z.object({
      tiers: z.array(z.object({
        name: z.string(),
        minSqft: z.number().int().min(0),
        maxSqft: z.number().int().optional(),
        price: z.number().min(0),
        frequency: z.enum(['weekly', 'biweekly', 'monthly']),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate: no gaps in tiers
      validatePricingTiers(input.tiers);

      return await ctx.db.tenant.update({
        where: { id: ctx.user.tenantId },
        data: { pricingTiers: input.tiers },
      });
    }),

  // Connect Google Calendar
  connectCalendar: protectedProcedure
    .input(z.object({
      code: z.string(), // OAuth authorization code
    }))
    .mutation(async ({ ctx, input }) => {
      // Exchange code for tokens
      const tokens = await googleOAuth.getTokens(input.code);

      // Encrypt and store
      const encrypted = await encrypt(tokens.refresh_token);

      return await ctx.db.tenant.update({
        where: { id: ctx.user.tenantId },
        data: {
          googleCalendarRefreshToken: encrypted,
          googleCalendarAccessToken: tokens.access_token,
          googleCalendarTokenExpiresAt: tokens.expiry_date,
          calendarId: tokens.calendar_id,
        },
      });
    }),

  // Provision phone number
  provisionPhoneNumber: protectedProcedure
    .input(z.object({
      areaCode: z.string().length(3).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Buy number from VAPI/Twilio
      const number = await vapi.phoneNumbers.buy({
        areaCode: input.areaCode,
      });

      // Create VAPI agent for this tenant
      const agent = await vapi.agents.create({
        name: ctx.tenant.businessName,
        firstMessage: `Thanks for calling ${ctx.tenant.businessName}! I can help you get a quote for lawn mowing service. What's your address?`,
        model: {
          provider: 'openai',
          model: 'gpt-4-turbo',
          temperature: 0.7,
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: 'rachel', // Friendly, professional female voice
        },
        functions: [
          // MCP tools (or function calling fallback)
        ],
      });

      // Link phone number to agent
      await vapi.phoneNumbers.update(number.id, {
        agentId: agent.id,
      });

      // Save to DB
      return await ctx.db.tenant.update({
        where: { id: ctx.user.tenantId },
        data: {
          phoneNumber: number.number,
          phoneNumberSid: number.id,
          vapiAgentId: agent.id,
          vapiPhoneNumberId: number.id,
        },
      });
    }),
});

// =====================================================
// CALL ROUTER
// =====================================================

export const callRouter = router({
  // List calls
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      outcome: z.enum(['quote_given', 'booking_made', 'outside_area', 'not_interested']).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        tenantId: ctx.user.tenantId,
      };

      if (input.outcome) where.outcome = input.outcome;
      if (input.dateFrom) where.createdAt = { gte: input.dateFrom };
      if (input.dateTo) where.createdAt = { ...where.createdAt, lte: input.dateTo };

      const [calls, total] = await Promise.all([
        ctx.db.call.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
          include: {
            lead: true,
            booking: true,
          },
        }),
        ctx.db.call.count({ where }),
      ]);

      return { calls, total };
    }),

  // Get call details
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const call = await ctx.db.call.findUnique({
        where: { id: input.id },
        include: {
          lead: true,
          booking: true,
        },
      });

      // Ensure tenant owns this call
      if (!call || call.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return call;
    }),

  // Get recording URL (signed)
  getRecordingUrl: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const call = await ctx.db.call.findUnique({
        where: { id: input.id },
        select: { recordingUrl: true, tenantId: true },
      });

      if (!call || call.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Generate signed URL (expires in 1 hour)
      const signedUrl = await storage.getSignedUrl(call.recordingUrl, {
        expiresIn: 3600,
      });

      return { url: signedUrl };
    }),
});

// =====================================================
// LEAD ROUTER
// =====================================================

export const leadRouter = router({
  // List leads
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['new', 'contacted', 'quoted', 'booked', 'lost']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.user.tenantId };
      if (input.status) where.status = input.status;

      const [leads, total] = await Promise.all([
        ctx.db.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
          include: {
            call: { select: { id: true, createdAt: true } },
            bookings: true,
          },
        }),
        ctx.db.lead.count({ where }),
      ]);

      return { leads, total };
    }),

  // Update lead
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.enum(['new', 'contacted', 'quoted', 'booked', 'lost']).optional(),
      notes: z.string().optional(),
      followUpAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const lead = await ctx.db.lead.findUnique({
        where: { id },
        select: { tenantId: true },
      });

      if (!lead || lead.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return await ctx.db.lead.update({
        where: { id },
        data,
      });
    }),

  // Export to CSV
  exportCsv: protectedProcedure
    .input(z.object({
      status: z.enum(['new', 'contacted', 'quoted', 'booked', 'lost']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.user.tenantId };
      if (input.status) where.status = input.status;

      const leads = await ctx.db.lead.findMany({ where });

      const csv = convertToCSV(leads, [
        'name',
        'phone',
        'email',
        'address',
        'lotSize',
        'quoteAmount',
        'status',
        'createdAt',
      ]);

      return { csv };
    }),
});

// =====================================================
// ANALYTICS ROUTER
// =====================================================

export const analyticsRouter = router({
  // Get dashboard metrics
  getDashboard: protectedProcedure
    .input(z.object({
      dateFrom: z.date(),
      dateTo: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const stats = await ctx.db.analyticsDaily.findMany({
        where: {
          tenantId: ctx.user.tenantId,
          date: {
            gte: input.dateFrom,
            lte: input.dateTo,
          },
        },
        orderBy: { date: 'asc' },
      });

      // Aggregate
      const totals = stats.reduce((acc, day) => ({
        totalCalls: acc.totalCalls + day.totalCalls,
        quotesGiven: acc.quotesGiven + day.quotesGiven,
        bookingsMade: acc.bookingsMade + day.bookingsMade,
        totalCost: acc.totalCost + parseFloat(day.totalCost.toString()),
      }), {
        totalCalls: 0,
        quotesGiven: 0,
        bookingsMade: 0,
        totalCost: 0,
      });

      return {
        daily: stats,
        totals,
        conversionRate: totals.totalCalls > 0
          ? (totals.bookingsMade / totals.totalCalls) * 100
          : 0,
      };
    }),
});
```

### 6.3 REST API Endpoints (Webhooks)

```typescript
// =====================================================
// WEBHOOK ENDPOINTS (REST)
// =====================================================

// POST /api/webhooks/vapi
export async function POST(request: Request) {
  const signature = request.headers.get('x-vapi-signature');
  const payload = await request.json();

  // Verify webhook signature
  if (!verifyVapiSignature(signature, payload)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Log webhook
  await db.webhook.create({
    data: {
      source: 'vapi',
      eventType: payload.type,
      payload,
      headers: Object.fromEntries(request.headers),
    },
  });

  // Handle event
  switch (payload.type) {
    case 'call.started':
      await handleCallStarted(payload);
      break;

    case 'call.ended':
      await handleCallEnded(payload);
      break;

    case 'function.called':
      // MCP tool invocation
      return await handleFunctionCall(payload);

    default:
      console.log('Unhandled VAPI event:', payload.type);
  }

  return new Response('OK', { status: 200 });
}

// POST /api/webhooks/stripe
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Handle event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    default:
      console.log('Unhandled Stripe event:', event.type);
  }

  return new Response('OK', { status: 200 });
}

// POST /api/webhooks/google-calendar
export async function POST(request: Request) {
  // Google Calendar webhook (for calendar changes)
  const channelId = request.headers.get('x-goog-channel-id');
  const resourceState = request.headers.get('x-goog-resource-state');

  if (resourceState === 'sync') {
    // Initial sync, acknowledge
    return new Response('OK', { status: 200 });
  }

  // Find tenant by channel ID
  const tenant = await db.tenant.findFirst({
    where: { calendarWebhookChannelId: channelId },
  });

  if (!tenant) {
    return new Response('Not found', { status: 404 });
  }

  // Fetch updated calendar events
  await syncCalendarEvents(tenant.id);

  return new Response('OK', { status: 200 });
}
```

### 6.4 MCP Server API

```typescript
// =====================================================
// MCP SERVER: PROPERTY LOOKUP
// =====================================================

import { MCPServer } from '@modelcontextprotocol/sdk';

const propertyLookupServer = new MCPServer({
  name: 'property-lookup',
  version: '1.0.0',
});

propertyLookupServer.tool({
  name: 'lookup_property',
  description: 'Look up property information (lot size, parcel ID) by address',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Street address (e.g., "123 Main St")',
      },
      city: {
        type: 'string',
        description: 'City name',
      },
      state: {
        type: 'string',
        description: 'Two-letter state code (e.g., "CA")',
      },
      zip: {
        type: 'string',
        description: 'ZIP code',
      },
    },
    required: ['address', 'city', 'state', 'zip'],
  },
  handler: async (input) => {
    // Normalize address
    const fullAddress = `${input.address}, ${input.city}, ${input.state} ${input.zip}`;

    try {
      // Call Regrid API (or alternative: Zillow, Attom Data)
      const response = await fetch(
        `https://api.regrid.com/v2/parcels?address=${encodeURIComponent(fullAddress)}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.REGRID_API_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (data.parcels && data.parcels.length > 0) {
        const parcel = data.parcels[0];

        return {
          success: true,
          data: {
            lot_size_sqft: parcel.fields.llarea || parcel.fields.acres * 43560,
            parcel_id: parcel.id,
            address_normalized: parcel.fields.address,
            city: parcel.fields.city,
            state: parcel.fields.state,
            zip: parcel.fields.zip,
            county: parcel.fields.county,
            zoning: parcel.fields.zoning,
            year_built: parcel.fields.year_built,
          },
        };
      } else {
        return {
          success: false,
          error: 'Property not found. Could you provide the lot size in square feet?',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Unable to look up property. Could you provide the lot size in square feet?',
      };
    }
  },
});

// =====================================================
// MCP SERVER: CALENDAR MANAGEMENT
// =====================================================

const calendarServer = new MCPServer({
  name: 'calendar',
  version: '1.0.0',
});

calendarServer.tool({
  name: 'get_available_slots',
  description: 'Get available appointment time slots for a tenant',
  inputSchema: {
    type: 'object',
    properties: {
      tenant_id: {
        type: 'string',
        description: 'Tenant UUID',
      },
      date_start: {
        type: 'string',
        description: 'Start date (ISO 8601)',
      },
      date_end: {
        type: 'string',
        description: 'End date (ISO 8601)',
      },
      duration_minutes: {
        type: 'number',
        description: 'Appointment duration in minutes',
        default: 60,
      },
    },
    required: ['tenant_id', 'date_start', 'date_end'],
  },
  handler: async (input) => {
    // Get tenant's calendar credentials
    const tenant = await db.tenant.findUnique({
      where: { id: input.tenant_id },
    });

    if (!tenant || !tenant.googleCalendarRefreshToken) {
      return {
        success: false,
        error: 'Calendar not connected',
      };
    }

    // Get access token (refresh if needed)
    const accessToken = await getValidAccessToken(tenant);

    // Fetch busy times from Google Calendar
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: input.date_start,
          timeMax: input.date_end,
          items: [{ id: tenant.calendarId }],
        }),
      }
    );

    const data = await response.json();
    const busySlots = data.calendars[tenant.calendarId].busy;

    // Generate available slots (integrates business hours + calendar availability)
    const availableSlots = await generateAvailableSlots(
      input.tenant_id,
      input.date_start,
      input.date_end,
      busySlots,
      input.duration_minutes
    );

    return {
      success: true,
      data: {
        available_slots: availableSlots.slice(0, 10), // Return next 10 slots
      },
    };
  },
});

calendarServer.tool({
  name: 'book_appointment',
  description: 'Book an appointment on the tenant\'s calendar',
  inputSchema: {
    type: 'object',
    properties: {
      tenant_id: { type: 'string' },
      start_time: { type: 'string', description: 'ISO 8601' },
      end_time: { type: 'string', description: 'ISO 8601' },
      customer_name: { type: 'string' },
      customer_phone: { type: 'string' },
      customer_email: { type: 'string' },
      property_address: { type: 'string' },
      service_type: { type: 'string', default: 'lawn_mowing' },
      estimated_price: { type: 'number' },
    },
    required: ['tenant_id', 'start_time', 'end_time', 'customer_name', 'customer_phone', 'property_address'],
  },
  handler: async (input) => {
    const tenant = await db.tenant.findUnique({
      where: { id: input.tenant_id },
    });

    // Validate appointment time is within business hours
    const isWithinHours = await db.query(
      'SELECT is_within_business_hours($1, $2) AS result',
      [input.tenant_id, input.start_time]
    );

    if (!isWithinHours.rows[0].result) {
      return {
        success: false,
        error: 'Requested time is outside business hours',
      };
    }

    const accessToken = await getValidAccessToken(tenant);

    // Create event in Google Calendar
    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${tenant.calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: `Lawn Mowing - ${input.customer_name}`,
          description: `
            Service: ${input.service_type}
            Customer: ${input.customer_name}
            Phone: ${input.customer_phone}
            Email: ${input.customer_email || 'N/A'}
            Address: ${input.property_address}
            Estimated Price: $${input.estimated_price}
          `.trim(),
          location: input.property_address,
          start: {
            dateTime: input.start_time,
            timeZone: tenant.timezone,
          },
          end: {
            dateTime: input.end_time,
            timeZone: tenant.timezone,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
            ],
          },
        }),
      }
    );

    const event = await eventResponse.json();

    // Save booking to database
    const booking = await db.booking.create({
      data: {
        tenantId: input.tenant_id,
        scheduledAt: new Date(input.start_time),
        durationMinutes: Math.round(
          (new Date(input.end_time).getTime() - new Date(input.start_time).getTime()) / 60000
        ),
        customerName: input.customer_name,
        customerPhone: input.customer_phone,
        customerEmail: input.customer_email,
        propertyAddress: input.property_address,
        serviceType: input.service_type,
        estimatedPrice: input.estimated_price,
        googleCalendarEventId: event.id,
        status: 'confirmed',
      },
    });

    // Send SMS confirmations
    await Promise.all([
      // To customer
      sendSMS({
        to: input.customer_phone,
        body: `Your lawn mowing appointment is confirmed for ${formatDate(input.start_time)}. ${tenant.businessName} will see you then!`,
      }),
      // To owner
      sendSMS({
        to: tenant.phone,
        body: `New booking: ${input.customer_name} at ${input.property_address} on ${formatDate(input.start_time)}. $${input.estimated_price}`,
      }),
    ]);

    return {
      success: true,
      data: {
        booking_id: booking.id,
        calendar_event_id: event.id,
        confirmation_sent: true,
      },
    };
  },
});

// =====================================================
// HELPER: GENERATE AVAILABLE SLOTS
// =====================================================
// Integrates is_within_business_hours() with Google Calendar availability
//
// INTEGRATION FLOW:
// 1. AI receives customer request: "Can I schedule for Friday at 2pm?"
// 2. AI calls MCP tool: calendar.get_available_slots()
// 3. MCP tool fetches busy slots from Google Calendar API
// 4. For each potential time slot (30-min increments):
//    a. Check is_within_business_hours() FIRST (database, <5ms)
//       - If FALSE (outside hours), skip to next slot
//       - If TRUE, proceed to step b
//    b. Check if slot conflicts with busySlots from Calendar API
//       - If conflict exists, skip to next slot
//       - If no conflict, add to available slots
// 5. Return available slots to AI
// 6. AI presents options to customer: "I have 2pm, 3pm, or 4pm available"
//
// WHY TWO-STEP CHECK:
// - Business hours check is fast (database query, <5ms)
// - Calendar API check is slow (external API, 200-500ms per call)
// - Checking business hours FIRST prevents wasteful Calendar API calls
// - Example: Customer asks for Sunday slot → business hours returns FALSE immediately
//   → Skip expensive Calendar API call for a slot that's not available anyway
//
// IMPORTANT: AI answers calls 24/7
// - Customer can call at 10pm (outside business hours)
// - AI still answers, provides quote, captures lead
// - AI offers: "Our first available slot is tomorrow at 9am"
// - Business hours only limits appointment times, NOT when AI responds
//
async function generateAvailableSlots(
  tenantId: string,
  dateStart: string,
  dateEnd: string,
  busySlots: Array<{ start: string; end: string }>,
  durationMinutes: number = 60
): Promise<Array<{ start: string; end: string }>> {
  const availableSlots: Array<{ start: string; end: string }> = [];

  // Generate time slots in 30-minute increments
  let currentTime = new Date(dateStart);
  const endTime = new Date(dateEnd);

  while (currentTime < endTime) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

    // STEP 1: Check business hours FIRST (fast database check)
    const isWithinHours = await db.query(
      'SELECT is_within_business_hours($1, $2) AS result',
      [tenantId, slotStart.toISOString()]
    );

    if (!isWithinHours.rows[0].result) {
      // Outside business hours - skip this slot (don't check calendar)
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000); // Next 30-min slot
      continue;
    }

    // STEP 2: Check Google Calendar for conflicts (slower API check)
    const hasConflict = busySlots.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      // Check if slot overlaps with busy time
      return (slotStart < busyEnd && slotEnd > busyStart);
    });

    if (!hasConflict) {
      // Slot is within business hours AND calendar is free
      availableSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    // Move to next 30-minute slot
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }

  return availableSlots;
}

// =====================================================
// MCP SERVER: BUSINESS LOGIC
// =====================================================

const businessLogicServer = new MCPServer({
  name: 'business-logic',
  version: '1.0.0',
});

businessLogicServer.tool({
  name: 'calculate_quote',
  description: 'Calculate a quote based on tenant pricing and lot size',
  inputSchema: {
    type: 'object',
    properties: {
      tenant_id: { type: 'string' },
      lot_size_sqft: { type: 'number' },
    },
    required: ['tenant_id', 'lot_size_sqft'],
  },
  handler: async (input) => {
    // Get tenant's pricing tiers
    const result = await db.$queryRaw`
      SELECT * FROM get_quote_for_lot_size(
        ${input.tenant_id}::UUID,
        ${input.lot_size_sqft}::INTEGER
      )
    `;

    if (result.length === 0) {
      return {
        success: false,
        error: 'No pricing configured for this lot size',
      };
    }

    const quote = result[0];

    return {
      success: true,
      data: {
        price: parseFloat(quote.price),
        frequency: quote.frequency,
        tier_name: quote.tier_name,
        lot_size_sqft: input.lot_size_sqft,
      },
    };
  },
});

businessLogicServer.tool({
  name: 'check_service_area',
  description: 'Check if a ZIP code is in the tenant\'s service area',
  inputSchema: {
    type: 'object',
    properties: {
      tenant_id: { type: 'string' },
      zip: { type: 'string' },
    },
    required: ['tenant_id', 'zip'],
  },
  handler: async (input) => {
    const result = await db.$queryRaw`
      SELECT is_in_service_area(
        ${input.tenant_id}::UUID,
        ${input.zip}
      ) AS in_area
    `;

    const inArea = result[0].in_area;

    return {
      success: true,
      data: {
        in_service_area: inArea,
      },
    };
  },
});
```

### 6.5 API Authentication

**Dashboard/Web API (tRPC)**:
- Supabase Auth → JWT token → RLS policies
- Token in Authorization header
- Server verifies via Supabase

**Webhooks**:
- VAPI: HMAC signature verification
- Stripe: Stripe signature verification
- Google: Channel ID validation

**MCP Servers**:
- Internal only (not exposed to internet)
- Called via VAPI function calling (authenticated by VAPI)
- Or called via backend API routes (tenant context)

---

## 7. Security Architecture

### 7.1 Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal permissions for all components
3. **Data Isolation**: Complete tenant separation
4. **Encryption Everywhere**: At rest and in transit
5. **Auditability**: All actions logged

### 7.2 Multi-Tenant Security

```
┌─────────────────────────────────────────────────────────────────┐
│              MULTI-TENANT SECURITY ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Application-Level Isolation                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Every query includes WHERE tenant_id = ?              │  │
│  │  • Context middleware extracts tenant from auth token    │  │
│  │  • tRPC procedures auto-scope to current tenant          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 2: Database Row-Level Security (RLS)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • PostgreSQL RLS policies on all tables                 │  │
│  │  • Even with direct SQL, can't access other tenants     │  │
│  │  • Policies enforced at database level                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 3: API Authorization Middleware                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • JWT token validation                                  │  │
│  │  • Tenant ID extracted from token claims                 │  │
│  │  • Injected into request context                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 4: Resource-Level Checks                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Before returning data, verify tenant ownership        │  │
│  │  • Throw 404 (not 403) to avoid info leakage            │  │
│  │  • Log unauthorized access attempts                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// tRPC context with tenant scoping
export const createContext = async ({ req }: { req: NextRequest }) => {
  // Get auth token
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return { user: null, tenant: null, db };
  }

  // Verify with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, tenant: null, db };
  }

  // Get user's tenant
  const dbUser = await db.user.findUnique({
    where: { authUserId: user.id },
    include: { tenant: true },
  });

  return {
    user: dbUser,
    tenant: dbUser?.tenant,
    db: db, // Prisma client with RLS
  };
};

// Protected procedure (requires auth)
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      tenant: ctx.tenant,
    },
  });
});
```

### 7.3 Data Encryption

| Data Type | Encryption Method | Key Management |
|-----------|------------------|----------------|
| **At Rest** |
| Database | AES-256 (Supabase managed) | Supabase key rotation |
| Call recordings | AES-256 (Supabase Storage) | Supabase managed |
| Env variables | Encrypted in Vercel | Vercel managed |
| **In Transit** |
| API requests | TLS 1.3 | Let's Encrypt certs (auto) |
| Webhooks | TLS 1.3 + signature | HMAC verification |
| **Application-Level** |
| Google refresh tokens | AES-256-GCM | KMS (AWS or Vercel) |
| Stripe keys | Environment vars (encrypted) | Vercel Secrets |
| VAPI keys | Environment vars (encrypted) | Vercel Secrets |

**Secrets Management**:
```typescript
// Use Vercel Environment Variables (encrypted at rest)
// Access via process.env in runtime

// For sensitive tenant data (e.g., OAuth tokens), use additional encryption
import { encrypt, decrypt } from '@/lib/crypto';

async function storeOAuthToken(tenantId: string, refreshToken: string) {
  const encrypted = await encrypt(refreshToken, process.env.ENCRYPTION_KEY);

  await db.tenant.update({
    where: { id: tenantId },
    data: { googleCalendarRefreshToken: encrypted },
  });
}

async function getOAuthToken(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { googleCalendarRefreshToken: true },
  });

  return await decrypt(tenant.googleCalendarRefreshToken, process.env.ENCRYPTION_KEY);
}
```

### 7.4 PCI Compliance (Payments)

**Important Clarification**: Stripe is for **platform subscription billing only**, NOT for customer payments during calls.

**Payment Flows**:

1. **Business Owner → GreenAcre (Platform Subscription)**
   - Business owner pays $150/mo to use the platform
   - Uses Stripe Checkout (hosted payment page)
   - We store Stripe customer/subscription IDs only (no card data)
   - Recurring billing handled by Stripe

2. **Homeowner → Business Owner (Lawn Service Payment)**
   - Happens AFTER the call, NOT during
   - Business owner collects payment:
     - In person (cash, check, card reader)
     - Or sends Stripe invoice link via email/SMS after service
     - Or uses their own payment processor
   - **GreenAcre does not touch customer payments**

**PCI Compliance**:
- We only handle platform subscriptions (business → us)
- Stripe Checkout = PCI DSS SAQ A compliant (lowest burden)
- No card data ever touches our servers
- Customer payment processing is business owner's responsibility

**Why this matters**:
- Avoids complex payment processing during calls
- No need for PCI DSS Level 1 certification
- Simpler compliance, lower risk
- Business owners keep existing payment workflows

### 7.5 Call Recording Compliance

**Legal Requirements**:
- Two-party consent in some states (CA, FL, etc.)
- Must announce recording

**Implementation**:
```typescript
// VAPI agent first message
firstMessage: `Thanks for calling ${businessName}. This call may be recorded for quality assurance. I can help you get a quote for lawn mowing service. What's your address?`

// Storage (Supabase Storage)
- Recordings stored in Supabase Storage buckets (encrypted AES-256)
- Access via signed URLs (time-limited, 1 hour expiry)
- RLS policies: Tenant can only access their own recordings
- Recordings auto-delete after 90 days (configurable via bucket lifecycle)
- Cost: Free tier (1GB), then $0.021/GB (7x cheaper than Vercel Blob)
```

### 7.6 Security Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY MONITORING STACK                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Sentry (Application Security)                              │
│     • Unhandled exceptions                                     │
│     • Failed auth attempts                                     │
│     • Suspicious API activity                                  │
│                                                                 │
│  2. Vercel Logs (Infrastructure)                               │
│     • Failed webhook signatures                                │
│     • Rate limit violations                                    │
│     • DDoS attempts                                            │
│                                                                 │
│  3. Supabase Audit Logs (Database)                             │
│     • RLS policy violations                                    │
│     • Unauthorized access attempts                             │
│     • Schema changes                                           │
│                                                                 │
│  4. Custom Alerts                                              │
│     • Failed login > 5 in 10 min → Alert                       │
│     • Webhook signature failures → Alert                       │
│     • Unusual API patterns → Alert                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.7 Vulnerability Mitigation

| Vulnerability | Mitigation |
|---------------|------------|
| **SQL Injection** | Prisma ORM (parameterized queries), input validation (Zod) |
| **XSS** | React auto-escaping, CSP headers, sanitization |
| **CSRF** | SameSite cookies, CORS configuration, token verification |
| **Injection (LLM)** | Input validation, prompt sandboxing, output filtering |
| **Rate Limiting** | Vercel rate limits, per-tenant API quotas |
| **DDoS** | Vercel DDoS protection, rate limiting, WAF |
| **Dependency Vulnerabilities** | Dependabot, npm audit, automated updates |
| **Secrets in Code** | .env files (gitignored), Vercel secrets, no hardcoded keys |

---

## 8. Scalability Strategy

### 8.1 Scaling Dimensions

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCALING ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: MVP (10-100 tenants, 1k calls/day)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Vercel: Serverless functions (auto-scale)             │  │
│  │  • Supabase: Starter plan → $25/mo                       │  │
│  │  • VAPI: Pay-per-use                                     │  │
│  │  • No caching needed yet                                 │  │
│  │  • Single-region (US-East)                               │  │
│  │                                                           │  │
│  │  Bottleneck: None (over-provisioned)                     │  │
│  │  Cost: ~$500-1k/mo                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Phase 2: Growth (100-1,000 tenants, 10k calls/day)           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Vercel: Edge functions for hot paths                  │  │
│  │  • Supabase: Pro plan ($25 → $200/mo)                    │  │
│  │  • Redis: Cache tenant configs (Upstash)                 │  │
│  │  • CDN: Call recordings on edge                          │  │
│  │                                                           │  │
│  │  Bottleneck: Database connection pool                    │  │
│  │  Mitigation: PgBouncer, read replicas                    │  │
│  │  Cost: ~$2-5k/mo                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Phase 3: Scale (1k-10k tenants, 100k calls/day)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Database: Read replicas (3x)                          │  │
│  │  • Caching: Redis cluster (Upstash or AWS ElastiCache)   │  │
│  │  • Search: Elasticsearch for call transcripts            │  │
│  │  • Queue: Bull/BullMQ for async jobs                     │  │
│  │  • Multi-region: US-East, US-West                        │  │
│  │                                                           │  │
│  │  Bottleneck: VAPI cost ($0.30/min * 100k = $30k/mo)     │  │
│  │  Mitigation: Negotiate volume pricing or migrate to      │  │
│  │              custom LiveKit + GPT-4 (40% savings)        │  │
│  │  Cost: ~$20-40k/mo                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Phase 4: Enterprise (10k-50k+ tenants, 500k calls/day)       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Database: Sharding by tenant_id (e.g., Citus)         │  │
│  │  • Voice: Custom LiveKit + GPT-4 Turbo (lower cost)      │  │
│  │  • CDN: Multi-region, edge computing                     │  │
│  │  • Microservices: Split into voice, dashboard, billing   │  │
│  │  • Kubernetes: Self-managed infrastructure (cost opt)    │  │
│  │                                                           │  │
│  │  Bottleneck: Operational complexity                      │  │
│  │  Mitigation: Hire DevOps team, SRE practices             │  │
│  │  Cost: ~$100-200k/mo                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Database Scaling Strategy

**Phases**:

1. **MVP (0-1k tenants)**: Single Postgres instance
   - Supabase Starter: 500MB, 50 connections
   - Sufficient for ~1k calls/day

2. **Growth (1k-10k tenants)**: Vertical + read replicas
   - Supabase Pro: 8GB, 200 connections
   - Add 1-2 read replicas for analytics queries
   - Use connection pooling (PgBouncer)

3. **Scale (10k-50k tenants)**: Sharding
   - Shard by tenant_id (hash-based)
   - Use Citus for distributed Postgres
   - Or migrate to CockroachDB (auto-sharding)

4. **Enterprise (50k+ tenants)**: Multi-database
   - Primary DB: Tenant metadata, config
   - Sharded DBs: Call data, leads, bookings
   - Analytics DB: Clickhouse for time-series

**Indexing Strategy**:
```sql
-- Critical indexes for performance at scale

-- Tenant lookup (fastest possible)
CREATE INDEX CONCURRENTLY idx_tenants_phone_number_hash
ON tenants USING hash(phone_number);

-- Call queries (most common pattern)
CREATE INDEX CONCURRENTLY idx_calls_tenant_created_outcome
ON calls(tenant_id, created_at DESC, outcome)
INCLUDE (caller_phone_number, quote_amount);

-- Lead queries
CREATE INDEX CONCURRENTLY idx_leads_tenant_status_created
ON leads(tenant_id, status, created_at DESC);

-- Booking queries
CREATE INDEX CONCURRENTLY idx_bookings_tenant_scheduled
ON bookings(tenant_id, scheduled_at)
WHERE status != 'canceled';

-- Full-text search (for dashboard search)
CREATE INDEX CONCURRENTLY idx_calls_transcript_search
ON calls USING gin(to_tsvector('english', transcript_text));
```

### 8.3 Caching Strategy

```typescript
// =====================================================
// CACHING LAYERS
// =====================================================

// L1: In-Memory (per-request)
const requestCache = new Map();

// L2: Redis (shared across functions)
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// L3: Vercel Edge Config (ultra-low latency)
import { get } from '@vercel/edge-config';

// =====================================================
// CACHE PATTERNS
// =====================================================

// Pattern 1: Tenant Configuration (changes rarely)
async function getTenantConfig(tenantId: string) {
  // Try L1
  if (requestCache.has(tenantId)) {
    return requestCache.get(tenantId);
  }

  // Try L2 (Redis)
  const cached = await redis.get(`tenant:${tenantId}`);
  if (cached) {
    requestCache.set(tenantId, cached);
    return cached;
  }

  // Fetch from DB
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      businessName: true,
      serviceAreas: true,
      pricingTiers: true,
      timezone: true,
    },
  });

  // Cache for 1 hour
  await redis.setex(`tenant:${tenantId}`, 3600, JSON.stringify(tenant));
  requestCache.set(tenantId, tenant);

  return tenant;
}

// Pattern 2: Property Lookup (changes never)
async function lookupProperty(address: string) {
  const cacheKey = `property:${normalizeAddress(address)}`;

  // Redis cache (1 year TTL)
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // Fetch from Regrid
  const property = await regridAPI.lookup(address);

  // Cache for 1 year (properties don't change)
  await redis.setex(cacheKey, 31536000, JSON.stringify(property));

  return property;
}

// Pattern 3: Call List (needs real-time updates)
// Use React Query on client, no server cache
// Invalidate on webhook

// =====================================================
// CACHE INVALIDATION
// =====================================================

async function invalidateTenantCache(tenantId: string) {
  await redis.del(`tenant:${tenantId}`);

  // Also purge from Edge Config if used
  await fetch(`${process.env.VERCEL_API_URL}/v1/edge-config/purge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
    },
    body: JSON.stringify({ key: `tenant:${tenantId}` }),
  });
}
```

### 8.4 API Rate Limiting

```typescript
// Per-tenant rate limits to prevent abuse

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    100, // requests
    '1 m' // per minute
  ),
  analytics: true,
});

// Middleware
export async function rateLimitMiddleware(
  req: Request,
  tenantId: string
) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `api:${tenantId}`
  );

  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${reset - Date.now()}ms`,
    });
  }

  // Add headers
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}
```

### 8.5 Async Processing (Job Queues)

**Use Cases**:
- Call recording transcription (CPU-intensive)
- Daily analytics aggregation
- Sending batch notifications
- Exporting data (CSV, PDF)

**Technology**: BullMQ + Redis

```typescript
import { Queue, Worker } from 'bullmq';

// =====================================================
// QUEUES
// =====================================================

const transcriptionQueue = new Queue('transcription', {
  connection: redisConnection,
});

const analyticsQueue = new Queue('analytics', {
  connection: redisConnection,
});

// =====================================================
// PRODUCERS (add jobs)
// =====================================================

// After call ends
export async function handleCallEnded(callData: any) {
  // Save call record immediately
  const call = await db.call.create({ data: callData });

  // Queue transcription (async)
  await transcriptionQueue.add('transcribe', {
    callId: call.id,
    recordingUrl: call.recordingUrl,
  });

  // Send immediate notification (sync)
  await sendSMS({ to: tenant.phone, body: '...' });
}

// =====================================================
// WORKERS (process jobs)
// =====================================================

const transcriptionWorker = new Worker(
  'transcription',
  async (job) => {
    const { callId, recordingUrl } = job.data;

    // Download recording
    const audio = await fetch(recordingUrl).then(r => r.arrayBuffer());

    // Transcribe with Deepgram (or VAPI already provides this)
    const transcript = await deepgram.transcribe(audio);

    // Save to DB
    await db.call.update({
      where: { id: callId },
      data: {
        transcript: transcript.words,
        transcriptText: transcript.text,
      },
    });

    // Generate AI summary
    const summary = await generateCallSummary(transcript.text);
    await db.call.update({
      where: { id: callId },
      data: { summary },
    });
  },
  {
    connection: redisConnection,
    concurrency: 10, // Process 10 at a time
  }
);

// Daily analytics aggregation
const analyticsWorker = new Worker(
  'analytics',
  async (job) => {
    const { date, tenantId } = job.data;

    // Aggregate metrics
    const stats = await db.call.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay(date),
          lt: endOfDay(date),
        },
      },
      _count: true,
      _avg: { durationSeconds: true, costTotal: true },
    });

    // Save to analytics table
    await db.analyticsDaily.upsert({
      where: { date_tenantId: { date, tenantId } },
      create: { date, tenantId, ...stats },
      update: stats,
    });
  },
  {
    connection: redisConnection,
  }
);
```

### 8.6 Multi-Region Strategy (Future)

**Phase 1 (MVP)**: Single region (US-East)
- Sufficient for US customers
- <100ms latency coast-to-coast

**Phase 2 (Growth)**: Edge caching
- Vercel Edge Network (automatic)
- Static assets on CDN
- Call recordings on edge

**Phase 3 (Scale)**: Multi-region database
- Primary: US-East
- Read replicas: US-West, US-Central
- Route reads to nearest replica

**Phase 4 (Enterprise)**: Full multi-region
- Database: Multi-region write (CockroachDB)
- App: Deployed to multiple regions
- Voice: VAPI/Twilio auto-routes to nearest

---

## 9. Cost Analysis

### 9.1 MVP Cost Breakdown (10 tenants, 50 calls/day each = 500 calls/day)

| Service | Usage | Unit Cost | Monthly Cost | Notes |
|---------|-------|-----------|--------------|-------|
| **Infrastructure** |
| Vercel (Hosting) | Hobby (free) | $0/mo | $0 | 100GB bandwidth, serverless functions |
| Supabase (Database + Storage) | Free tier | $0/mo | $0 | 500MB DB + 1GB storage, sufficient for MVP |
| Upstash Redis | Free tier | $0 | $0 | <10k requests/day |
| **Voice Infrastructure (VAPI)** |
| Phone numbers | 10 numbers | $1/mo/number | $10 | |
| Inbound calls | 15,000 min/mo (500 calls * 30d * 1min avg) | $0.25/min | $3,750 | Includes STT, TTS, LLM, telephony |
| **External APIs** |
| Regrid (Property) | 500 lookups/day | $0.01/lookup | $150 | 15k/mo lookups |
| Twilio SMS | 1,000 SMS/mo | $0.0075/SMS | $7.50 | Notifications |
| Google Calendar | Free | $0 | $0 | OAuth |
| **Payments** |
| Stripe | 10 subscriptions | 2.9% + $0.30 | ~$45 | $150/mo * 10 * 3% |
| **Monitoring** |
| Sentry | Free tier | $0 | $0 | <5k errors/mo |
| Vercel Analytics | Included | $0 | $0 | |
| **Total (Operational)** | | | **$3,967.50** | |

**Revenue (MVP)**:
- 10 tenants * $150/mo = $1,500/mo
- **Gross Margin**: -164% (expected for MVP, high VAPI cost)

**Key Insight**: Using free tiers (Vercel Hobby + Supabase Free) saves $45/mo compared to paid plans, but VAPI voice cost ($3,750/mo) still dominates. This validates the need for custom LangGraph agent to reduce per-call cost.

---

### 9.2 Growth Phase Cost (100 tenants, 5,000 calls/day)

| Service | Usage | Unit Cost | Monthly Cost | Notes |
|---------|-------|-----------|--------------|-------|
| **Infrastructure** |
| Vercel | Pro plan | $20/mo | $20 | Upgrade for team collaboration |
| Supabase | Pro plan | $25/mo | $25 | Still within free tier limits, upgrade for backups |
| Upstash Redis | Pro plan | $60/mo | $60 | Caching layer needed |
| Supabase Storage | 100GB | $0.021/GB | $2.10 | Call recordings (~2 months retention) |
| **Voice Infrastructure** |
| Phone numbers | 100 numbers | $1/mo | $100 | |
| Inbound calls | 150,000 min/mo | $0.25/min | $37,500 | Largest cost |
| **External APIs** |
| Regrid | 5k lookups/day | $0.01 | $1,500 | Volume pricing |
| Twilio SMS | 10k SMS/mo | $0.0075 | $75 | |
| **Payments** |
| Stripe | 100 subs | 2.9% + $0.30 | $460 | $150 * 100 * 3% |
| **Monitoring** |
| Sentry | Team plan | $26/mo | $26 | |
| PostHog | Startup plan | $0 | $0 | <1M events |
| **Total (Operational)** | | | **$37,793.10** | |

**Revenue**:
- 100 tenants * $150/mo = $15,000/mo
- **Gross Margin**: -152% (still underwater on VAPI cost)

**Cost Optimization Needed**: At this scale, custom LangGraph agent becomes critical to reduce voice infrastructure cost.

**Path to Profitability**:
1. Negotiate VAPI volume pricing ($0.25 → $0.18/min = -$10k/mo)
2. OR migrate to custom LLM endpoint (save 40% on LLM cost)
3. OR increase pricing to $200/tenant ($20k/mo revenue)

---

### 9.3 Scale Phase Cost (1,000 tenants, 50,000 calls/day)

**With Custom LangGraph Agent + VAPI (STT/TTS only)**

| Service | Usage | Unit Cost | Monthly Cost | Notes |
|---------|-------|-----------|--------------|-------|
| **Infrastructure** |
| Vercel | Pro plan | $20/mo | $20 | Still sufficient |
| Supabase | Pro + replicas | $800/mo | $800 | 3x read replicas, larger DB |
| Upstash Redis | Pro plan | $200/mo | $200 | Larger cache |
| Supabase Storage | 1TB | $0.021/GB | $21 | Call recordings (90-day retention) |
| **Voice Infrastructure (Hybrid: VAPI STT/TTS + Our LLM)** |
| VAPI STT/TTS | 1.5M min/mo | $0.10/min | $150,000 | Just transcription + speech synthesis |
| Phone numbers | 1,000 | $1/mo | $1,000 | Twilio via VAPI |
| **Custom LLM (Our LangGraph Agent)** |
| OpenAI GPT-4 Turbo | ~90M tokens/mo | $10/1M tokens in, $30/1M out | $2,700 | 60 tokens/call avg (optimized) |
| Vercel Compute | LangGraph API calls | Included | $0 | Within free tier |
| **Subtotal Voice** | | | **$153,700** | vs $375k with VAPI full stack (59% savings!) |
| **External APIs** |
| Regrid | 50k/day | $0.007 (volume) | $10,500 | Negotiated rate |
| Twilio SMS | 100k/mo | $0.0075 | $750 | |
| **Payments** |
| Stripe | 1k subs | 2.9% + $0.30 | $4,650 | |
| **Monitoring** |
| Sentry | Business | $99/mo | $99 | |
| PostHog | Growth | $450/mo | $450 | |
| Better Stack | Pro | $50/mo | $50 | Logging |
| **Total (Operational)** | | | **$169,391** | |

**Revenue**:
- 1,000 tenants * $150/mo = $150,000/mo
- **Gross Margin**: -13% (still need optimization)

**Key Insights**:
1. Custom LangGraph agent saves $221k/mo vs VAPI full stack (59% reduction: $375k → $154k)
2. But VAPI STT/TTS is still expensive at scale ($150k/mo for 1.5M minutes)
3. **Next optimization**: Migrate to fully custom stack (LiveKit + Deepgram + ElevenLabs)

**Alternative: Fully Custom Stack** (for reference):
- LiveKit (WebRTC): $22,500/mo
- Deepgram (STT): $6,450/mo
- ElevenLabs (TTS): $22,500/mo
- Twilio (SIP): $12,750/mo
- OpenAI GPT-4: $2,700/mo
- **Total Voice**: $66,900/mo (vs $153,700 with VAPI STT/TTS)
- **Gross Margin with fully custom**: 55% healthy!

**Recommendation**: Use LangGraph from day 1, keep VAPI for STT/TTS until 1,000+ tenants, then migrate to fully custom stack.

---

### 9.4 Cost Optimization Strategies

**Immediate (MVP)**:
1. **Reduce call duration**: Optimize AI to be concise (1.5 min avg → 1.0 min = -33% cost)
2. **Property cache**: Cache lot size lookups (99% hit rate = -$140/mo)
3. **Smart routing**: Route to VAPI only when needed (use IVR for some)

**Short-term (Growth)**:
1. **Volume pricing**: Negotiate VAPI discount (10% = -$3.7k/mo)
2. **Pricing increase**: $150 → $175/tenant (+$2.5k/mo revenue)
3. **Usage-based**: Charge $0.50/call beyond 100/mo

**Long-term (Scale)**:
1. **Custom stack**: Build LiveKit + GPT-4 (save 82% on voice)
2. **Self-hosted**: K8s on AWS/GCP (save 30% on infra)
3. **LLM fine-tuning**: Fine-tune smaller model (GPT-3.5 or Llama) for quotes

---

## 10. Deployment Strategy

### 10.1 Environments

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ENVIRONMENTS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Development (Local)                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Local Next.js server (npm run dev)                    │  │
│  │  • Supabase local (Docker)                               │  │
│  │  • VAPI sandbox account                                  │  │
│  │  • Stripe test mode                                      │  │
│  │  • ngrok for webhook testing                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Preview (Per-PR)                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Vercel preview deployment (auto)                      │  │
│  │  • Supabase preview branch (auto)                        │  │
│  │  • VAPI sandbox                                          │  │
│  │  • Stripe test mode                                      │  │
│  │  • URL: <pr-number>.greenacre-ai.vercel.app             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Staging                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Vercel production (staging branch)                    │  │
│  │  • Supabase staging project                              │  │
│  │  • VAPI production (test numbers)                        │  │
│  │  • Stripe test mode                                      │  │
│  │  • URL: staging.greenacre.ai                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Production                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Vercel production (main branch)                       │  │
│  │  • Supabase production project                           │  │
│  │  • VAPI production (real numbers)                        │  │
│  │  • Stripe live mode                                      │  │
│  │  • URL: app.greenacre.ai                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Build
        run: npm run build

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          alias-domains: staging.greenacre.ai

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Notify Sentry of release
        run: |
          npx sentry-cli releases new ${{ github.sha }}
          npx sentry-cli releases set-commits ${{ github.sha }} --auto
          npx sentry-cli releases finalize ${{ github.sha }}
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}

      - name: Smoke tests
        run: npm run test:smoke
        env:
          APP_URL: https://app.greenacre.ai
```

### 10.3 Database Migrations

```bash
# Development: Create and apply migrations
npx prisma migrate dev --name add_analytics_table

# Staging/Production: Apply pending migrations
npx prisma migrate deploy

# Rollback strategy: Revert via down migration
# (Not natively supported in Prisma, use custom scripts)
```

**Migration Safety Checklist**:
- [ ] Test on staging first
- [ ] Backward compatible (don't drop columns immediately)
- [ ] Add indexes CONCURRENTLY (no locks)
- [ ] Large migrations during low-traffic hours
- [ ] Rollback plan documented

### 10.4 Rollback Strategy

**Application Rollback**:
```bash
# Vercel: Instant rollback to previous deployment
vercel rollback

# Or via dashboard: Deployments → Previous → Promote to Production
```

**Database Rollback**:
```sql
-- If migration added a column, and app breaks:
-- Option 1: Deploy code fix (preferred)
-- Option 2: Revert migration
BEGIN;
  -- Undo changes (e.g., drop column added in migration)
  ALTER TABLE calls DROP COLUMN new_column;
  -- Update migration table
  DELETE FROM _prisma_migrations WHERE migration_name = '20241231_add_new_column';
COMMIT;
```

**Disaster Recovery**:
- Supabase: Point-in-time recovery (last 7 days)
- Vercel Blob: Versioned storage (can restore)
- Code: Git revert + redeploy

### 10.5 Monitoring & Alerting

```typescript
// =====================================================
// HEALTH CHECK ENDPOINT
// =====================================================

// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    // Database
    db.$queryRaw`SELECT 1`,

    // VAPI
    fetch('https://api.vapi.ai/health'),

    // Stripe
    stripe.customers.list({ limit: 1 }),

    // Redis
    redis.ping(),
  ]);

  const status = checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded';

  return Response.json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled',
      vapi: checks[1].status === 'fulfilled',
      stripe: checks[2].status === 'fulfilled',
      redis: checks[3].status === 'fulfilled',
    },
  });
}

// =====================================================
// ALERTS (via Sentry)
// =====================================================

// Alert conditions
const alerts = [
  {
    name: 'High error rate',
    condition: 'error_rate > 1% over 5min',
    action: 'Page on-call engineer',
  },
  {
    name: 'Database slow',
    condition: 'p95_query_time > 1s',
    action: 'Slack alert #engineering',
  },
  {
    name: 'VAPI failures',
    condition: 'failed_calls > 5% over 10min',
    action: 'Page on-call, email VAPI support',
  },
  {
    name: 'Webhook failures',
    condition: 'webhook_failures > 10 over 5min',
    action: 'Slack alert #engineering',
  },
];
```

**Uptime Monitoring**:
- BetterUptime: External monitoring (5min checks)
- Alerts via Slack, PagerDuty, SMS
- Status page: status.greenacre.ai

---

## 11. Trade-Off Analysis

### 11.1 Key Architectural Decisions

#### Decision 1: VAPI vs Custom Voice Stack

| Factor | VAPI (MVP Choice) | Custom (LiveKit + GPT-4) |
|--------|------------------|---------------------------|
| **Time to Market** | ✅ 2 weeks | ❌ 3-6 months |
| **Engineering Effort** | ✅ Minimal | ❌ High (orchestration, fallbacks) |
| **Cost (MVP)** | ⚠️ $3.7k/mo (500 calls/day) | ✅ $450/mo |
| **Cost (Scale)** | ❌ $375k/mo (50k calls/day) | ✅ $66k/mo (82% savings) |
| **Reliability** | ✅ Managed, SLA | ⚠️ Self-managed |
| **Flexibility** | ⚠️ Limited customization | ✅ Full control |
| **Latency** | ✅ <500ms (optimized) | ⚠️ 600-800ms (DIY) |
| **Vendor Lock-in** | ⚠️ Moderate (can migrate) | ✅ Open source |

**Decision**: VAPI for MVP, migrate to custom at 1,000+ tenants
**Rationale**: Speed to market trumps cost for validation phase. Migration path is clear.

---

#### Decision 2: MCP vs Native Function Calling

| Factor | MCP (Selected) | Native Function Calling |
|--------|----------------|-------------------------|
| **Standardization** | ✅ Open protocol | ❌ Vendor-specific |
| **Modularity** | ✅ Independent servers | ⚠️ Coupled to LLM config |
| **Reusability** | ✅ Use across agents | ❌ Per-agent definition |
| **Security** | ✅ Process isolation | ⚠️ Same runtime |
| **Debugging** | ✅ Structured logs, clear boundaries | ⚠️ Inline, harder to trace |
| **Complexity** | ⚠️ Medium (new protocol) | ✅ Low (built-in) |
| **LLM Compatibility** | ⚠️ Requires wrapper if unsupported | ✅ Native support |
| **Future-proof** | ✅ Industry-backed (Anthropic) | ⚠️ Proprietary |

**Decision**: MCP for tool integration
**Rationale**: Worth the learning curve for long-term modularity and vendor independence. Fallback to function calling if VAPI doesn't support MCP (via wrapper).

---

#### Decision 3: tRPC vs REST for Internal APIs

| Factor | tRPC (Selected) | REST |
|--------|-----------------|------|
| **Type Safety** | ✅ End-to-end TypeScript | ❌ Manual typing |
| **Developer Experience** | ✅ Auto-complete, refactor-safe | ⚠️ Manual docs, Postman |
| **Boilerplate** | ✅ Minimal | ❌ Controllers, DTOs, validators |
| **Learning Curve** | ⚠️ Medium (new to team) | ✅ Low (everyone knows REST) |
| **Ecosystem** | ⚠️ Smaller (but growing) | ✅ Massive |
| **External Integrations** | ❌ Requires REST wrapper | ✅ Universal |
| **Performance** | ✅ Same as REST (HTTP) | ✅ Same |

**Decision**: tRPC for internal APIs, REST for webhooks
**Rationale**: Type safety dramatically reduces bugs. Use REST only for external interfaces (webhooks, public API if needed).

---

#### Decision 4: Monolith vs Microservices

| Factor | Monolith (Selected) | Microservices |
|--------|---------------------|---------------|
| **Complexity** | ✅ Simple | ❌ High (orchestration, networking) |
| **Deployment** | ✅ Single deploy | ❌ Multiple services |
| **Debugging** | ✅ Single codebase | ❌ Distributed tracing required |
| **Scalability** | ⚠️ Vertical scaling | ✅ Horizontal per-service |
| **Team Size** | ✅ Suited for small teams | ⚠️ Requires multiple teams |
| **Performance** | ✅ No network calls | ❌ Inter-service latency |
| **Tech Diversity** | ❌ Single language/framework | ✅ Best tool per service |

**Decision**: Monolith (Next.js app) for MVP
**Rationale**: Premature microservices add complexity without benefit at MVP scale. Monolith can handle 10k+ tenants easily. Split later if needed (e.g., voice service separate at 50k+ tenants).

---

#### Decision 5: Shared Schema vs Schema-per-Tenant (Multi-tenancy)

| Factor | Shared Schema (Selected) | Schema-per-Tenant |
|--------|--------------------------|-------------------|
| **Simplicity** | ✅ Single database | ❌ Complex provisioning |
| **Cost** | ✅ Efficient resource use | ❌ DB overhead per tenant |
| **Isolation** | ⚠️ Logical (RLS) | ✅ Physical |
| **Scalability** | ✅ Scales to 50k+ tenants | ❌ Limited by DB count |
| **Backup/Restore** | ✅ Single backup | ⚠️ Per-tenant backups |
| **Compliance** | ⚠️ Requires RLS audit | ✅ Natural isolation |
| **Performance** | ✅ Shared connection pool | ❌ Pool per tenant |

**Decision**: Shared schema with RLS
**Rationale**: Industry standard for SaaS (Slack, GitHub use this). Simpler ops, lower cost, scales further. Physical isolation only needed for enterprise customers (can offer later).

---

### 11.2 Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **VAPI cost spirals out of control** | High | High | Set per-tenant usage limits, migrate to custom at 1k tenants |
| **Property data API (Regrid) unavailable** | Low | Medium | Fallback to user-provided lot size, cache aggressively |
| **Google Calendar API rate limits** | Medium | Medium | Cache availability, use batch API, request quota increase |
| **Database performance degrades** | Medium | High | Aggressive indexing, read replicas, connection pooling |
| **AI gives incorrect quotes** | Medium | High | Extensive testing, human-in-loop for first 100 calls, feedback loop |
| **Stripe payment failures** | Low | High | Retry logic, grace period, automated dunning emails |
| **Security breach (data leak)** | Low | Critical | RLS, encryption, security audit, bug bounty, insurance |
| **Competitor launches similar product** | Medium | Medium | Focus on execution, customer relationships, lawn care domain expertise |
| **Regulatory (call recording laws)** | Low | Medium | Legal review, clear disclosures, state-specific compliance |

---

### 11.3 Technical Debt Accepted (for MVP)

These shortcuts are acceptable for MVP but should be addressed post-launch:

1. **No A/B testing framework**: Build when we have enough traffic to test
2. **Basic analytics**: Use PostHog in V2 for funnels, cohorts
3. **No automated call quality scoring**: Add after 1000+ calls
4. **Limited error recovery in voice**: VAPI handles most, add custom fallbacks later
5. **No multi-language support**: English-only MVP, i18n in V2
6. **Basic email notifications**: Just transactional, marketing automation later
7. **No CRM integrations**: Standalone system, integrate post-PMF
8. **Manual customer support**: Use Intercom, AI support bot in V2

**Tech Debt Payoff Plan**:
- After 10 paying customers: Address top 3 bugs
- After 50 customers: Implement analytics, quality scoring
- After 100 customers: Migrate to custom voice stack (if VAPI cost is issue)
- After 500 customers: Microservices split (if monolith is bottleneck)

---

## 12. Appendices

### 12.1 Technology Comparison Matrix

#### Database Options

| Database | Pros | Cons | Best For |
|----------|------|------|----------|
| **PostgreSQL (Supabase)** ✅ | ACID, JSON, RLS, managed | Single-region for MVP | Multi-tenant SaaS |
| MongoDB | Flexible schema, fast writes | No ACID, poor relational | Document-heavy apps |
| PlanetScale (MySQL) | Auto-scaling, branching | No triggers/procedures | Serverless apps |
| CockroachDB | Multi-region, auto-shard | Complex, expensive | Global scale |

#### Voice Infrastructure Options

| Provider | Pros | Cons | Best For |
|----------|------|------|----------|
| **VAPI** ✅ | Managed, fast setup | Expensive at scale | MVP, rapid prototyping |
| Bland AI | Simple API | Less flexible | Basic use cases |
| Synthflow | Low code | Not customizable | Non-technical users |
| LiveKit + GPT-4 | Full control, cheaper | Complex build | Scale (1k+ tenants) |
| Twilio Voice + Custom | Industry standard | Lots of glue code | Enterprise |

#### Hosting Options

| Provider | Pros | Cons | Best For |
|----------|------|------|----------|
| **Vercel** ✅ | Zero config, edge, preview envs | Vendor lock-in | Next.js apps |
| AWS (ECS/Lambda) | Full control, cheaper at scale | Complex setup | Large teams |
| Railway | Simple, good DX | Less mature | Side projects |
| Render | Easy, affordable | Less powerful | Small apps |

### 12.2 API Endpoint Catalog

**tRPC Routes**:
- `auth.login` - Login with email/password
- `auth.signup` - Create account
- `auth.resetPassword` - Request password reset
- `tenant.getCurrent` - Get current tenant
- `tenant.updateBusinessInfo` - Update business name, etc.
- `tenant.updateServiceAreas` - Update ZIP codes
- `tenant.updatePricing` - Update pricing tiers
- `tenant.connectCalendar` - OAuth flow for Google Calendar
- `tenant.provisionPhoneNumber` - Get new phone number
- `call.list` - List calls with filters
- `call.get` - Get call details
- `call.getRecordingUrl` - Get signed URL for recording
- `lead.list` - List leads
- `lead.update` - Update lead status, notes
- `lead.exportCsv` - Export leads to CSV
- `booking.list` - List bookings
- `booking.cancel` - Cancel a booking
- `analytics.getDashboard` - Get metrics for date range

**REST Webhooks**:
- `POST /api/webhooks/vapi` - VAPI events
- `POST /api/webhooks/stripe` - Stripe events
- `POST /api/webhooks/google-calendar` - Calendar changes
- `GET /api/health` - Health check

**MCP Servers** (internal):
- `property-lookup.lookup_property` - Get lot size
- `calendar.get_available_slots` - Get open time slots
- `calendar.book_appointment` - Create booking
- `business-logic.calculate_quote` - Calculate price
- `business-logic.check_service_area` - Validate ZIP

### 12.3 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@host:5432/greenacre
DIRECT_URL=postgresql://user:pass@host:5432/greenacre

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# VAPI
VAPI_API_KEY=sk_xxx
VAPI_WEBHOOK_SECRET=whsec_xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Google Calendar
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx

# Regrid (Property Data)
REGRID_API_KEY=xxx

# Redis (Optional - add when scaling beyond MVP)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# OpenAI (for LangGraph agent)
OPENAI_API_KEY=sk-xxx

# LangChain (for LangGraph)
LANGCHAIN_API_KEY=lsv2_xxx # Optional, for LangSmith tracing/debugging
LANGCHAIN_PROJECT=greenacre-ai

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Feature Flags
POSTHOG_API_KEY=phc_xxx

# Encryption
ENCRYPTION_KEY=xxx # 32-byte key for encrypting OAuth tokens
```

### 12.4 Deployment Checklist

**Pre-Launch**:
- [ ] All environment variables set in Vercel
- [ ] Database migrations applied to production
- [ ] VAPI agent configured with correct business name template
- [ ] Stripe webhook endpoint verified
- [ ] Google OAuth app verified (production)
- [ ] SSL certificate installed (auto via Vercel)
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring (uptime checks) enabled
- [ ] Terms of Service + Privacy Policy published
- [ ] GDPR compliance reviewed (if EU customers)
- [ ] Backup strategy tested (restore from backup)
- [ ] Load testing completed (simulate 100 concurrent calls)
- [ ] Security scan (OWASP top 10)
- [ ] Legal review of call recording disclosures

**Post-Launch**:
- [ ] Monitor error rates (Sentry dashboard)
- [ ] Check VAPI call success rate (should be >95%)
- [ ] Verify SMS notifications delivering
- [ ] Test end-to-end flow with real phone call
- [ ] Monitor database query performance
- [ ] Set up on-call rotation (PagerDuty)
- [ ] Schedule daily backups
- [ ] Create runbook for common incidents

### 12.5 Scaling Milestones

| Milestone | Action Required |
|-----------|-----------------|
| **10 tenants** | Monitor, gather feedback, iterate on UX |
| **50 tenants** | Add read replica, implement caching |
| **100 tenants** | Negotiate VAPI volume discount |
| **500 tenants** | Implement async job processing (BullMQ) |
| **1,000 tenants** | Migrate to custom voice stack (LiveKit) |
| **5,000 tenants** | Database sharding, multi-region |
| **10,000 tenants** | Microservices split (voice, dashboard, billing) |
| **50,000 tenants** | Self-hosted Kubernetes, dedicated SRE team |

---

## Conclusion

This technical architecture document provides a comprehensive blueprint for building GreenAcre AI as an enterprise-grade, scalable, multi-tenant voice AI platform.

**Key Takeaways**:

1. **MVP-first approach**: Use managed services (VAPI, Supabase, Vercel) to launch in weeks, not months
2. **Clear migration path**: VAPI for MVP, custom stack at scale (82% cost savings)
3. **Future-proof decisions**: MCP for tools, tRPC for APIs, modern stack
4. **Security by design**: Multi-layer tenant isolation, encryption, PCI compliance
5. **Cost-conscious**: <$5k/mo operational cost for MVP, path to 40%+ margins at scale
6. **Operational simplicity**: Serverless, managed services, minimal DevOps burden

**Next Steps**:

1. **Review & validate** this architecture with stakeholders
2. **Prototype** core voice flow (1 week)
3. **Build MVP** following this blueprint (4-6 weeks)
4. **Beta test** with 5 lawn care businesses (2 weeks)
5. **Launch** and iterate based on real usage

This architecture is designed to support GreenAcre AI from 10 tenants to 50,000+, with clear inflection points for when to invest in custom infrastructure. The focus is on speed to market while maintaining a path to profitability and scale.

---

**Document Version**: 1.0
**Last Updated**: December 31, 2024
**Next Review**: After MVP launch (target: February 2025)
