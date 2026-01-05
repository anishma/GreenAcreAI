# GreenAcre AI - Implementation Plan
**Enterprise-Grade Multi-Tenant Voice AI Platform**

**Version:** 1.0
**Date:** January 1, 2026
**Architecture Reference:** technical-architecture.md v1.2

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack Reference](#technology-stack-reference)
3. [Project File Structure](#project-file-structure)
4. [Phase 0: Infrastructure & Environment Setup](#phase-0-infrastructure--environment-setup)
5. [Phase 1: Database & Auth Layer](#phase-1-database--auth-layer)
6. [Phase 2: Core Application Skeleton](#phase-2-core-application-skeleton)
7. [Phase 3: Tenant Onboarding & Management](#phase-3-tenant-onboarding--management)
8. [Phase 4: The Intelligence Layer (LangGraph + MCP)](#phase-4-the-intelligence-layer-langgraph--mcp)
9. [Phase 5: Voice Infrastructure Integration](#phase-5-voice-infrastructure-integration)
10. [Phase 6: Dashboard & Analytics](#phase-6-dashboard--analytics)
11. [Phase 7: Billing & Deployment](#phase-7-billing--deployment)

---

## Project Overview

This implementation plan breaks down the GreenAcre AI platform into **7 sequential phases**, each containing **epics**, **tasks**, and **subtasks**. Each subtask is designed to be implemented in a single coding session.

**Key Principles:**
- Strict adherence to technology stack (Next.js 14, Supabase, VAPI, LangGraph, MCP, tRPC)
- Test-driven development where applicable
- Type-safe end-to-end
- Security-first (RLS, encryption, validation)
- Incremental deployment capability

**Implementation Workflow Rules:**
1. **Task Completion:** After completing any task or subtask, immediately mark it as completed with `[x]` in this implementation plan
2. **Ask Before Proceeding:** Always ask for permission before moving to the next task
3. **Commit Progress:** Commit changes to Git after each completed task with descriptive commit messages

---

## Technology Stack Reference

### Core Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript 5.x
- **Styling:** Tailwind CSS 3.x, shadcn/ui
- **Backend:** Next.js API Routes, tRPC 10.x
- **Database:** PostgreSQL 15 (Supabase)
- **ORM:** Prisma 5.x
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Voice:** VAPI (STT/TTS only)
- **LLM Agent:** Custom LangGraph Agent
- **Tool Protocol:** MCP (Model Context Protocol)
- **Payments:** Stripe
- **Hosting:** Vercel (Hobby Free tier)
- **Monitoring:** Sentry, Vercel Analytics

### Key Dependencies (Will be detailed per phase)
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "typescript": "^5.4.0",
  "@trpc/server": "^10.45.0",
  "@trpc/client": "^10.45.0",
  "@trpc/react-query": "^10.45.0",
  "@tanstack/react-query": "^5.28.0",
  "@langchain/langgraph": "^0.0.15",
  "@langchain/openai": "^0.0.25",
  "@modelcontextprotocol/sdk": "^0.5.0",
  "@supabase/supabase-js": "^2.39.0",
  "prisma": "^5.10.0",
  "@prisma/client": "^5.10.0",
  "zod": "^3.22.0",
  "stripe": "^14.0.0",
  "tailwindcss": "^3.4.0"
}
```

---

## Project File Structure

```
greenacre-ai/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── icons/
│   └── images/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── calls/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── leads/
│   │   │   │   └── page.tsx
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── business/
│   │   │   │   ├── pricing/
│   │   │   │   ├── calendar/
│   │   │   │   └── phone/
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (onboarding)/
│   │   │   ├── step-1-business/
│   │   │   ├── step-2-pricing/
│   │   │   ├── step-3-calendar/
│   │   │   ├── step-4-phone/
│   │   │   ├── step-5-test/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── trpc/
│   │   │   │   └── [trpc]/
│   │   │   │       └── route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── vapi/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── stripe/
│   │   │   │   │   └── route.ts
│   │   │   │   └── google-calendar/
│   │   │   │       └── route.ts
│   │   │   ├── vapi-llm/              # Custom LangGraph endpoint
│   │   │   │   └── route.ts
│   │   │   └── auth/
│   │   │       ├── callback/
│   │   │       └── signout/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── dashboard/
│   │   │   ├── call-list.tsx
│   │   │   ├── lead-card.tsx
│   │   │   ├── booking-calendar.tsx
│   │   │   └── metrics-card.tsx
│   │   ├── onboarding/
│   │   │   ├── business-form.tsx
│   │   │   ├── pricing-form.tsx
│   │   │   ├── calendar-connect.tsx
│   │   │   └── phone-setup.tsx
│   │   ├── forms/
│   │   │   └── ...
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   ├── lib/
│   │   ├── agents/                    # LangGraph Agents
│   │   │   ├── conversation-graph.ts
│   │   │   ├── nodes/
│   │   │   │   ├── greeting.ts
│   │   │   │   ├── address-extraction.ts
│   │   │   │   ├── property-lookup.ts
│   │   │   │   ├── quote-calculation.ts
│   │   │   │   ├── booking.ts
│   │   │   │   └── closing.ts
│   │   │   ├── edges/
│   │   │   │   └── conditional-edges.ts
│   │   │   └── state.ts
│   │   ├── mcp/                       # MCP Servers (Standalone Processes)
│   │   │   ├── servers/
│   │   │   │   ├── property-lookup/
│   │   │   │   │   ├── index.ts       # MCP server entry point
│   │   │   │   │   ├── tools/
│   │   │   │   │   │   └── lookup-property.ts
│   │   │   │   │   └── integrations/
│   │   │   │   │       └── regrid-client.ts
│   │   │   │   ├── calendar/
│   │   │   │   │   ├── index.ts       # MCP server entry point
│   │   │   │   │   ├── tools/
│   │   │   │   │   │   ├── get-available-slots.ts
│   │   │   │   │   │   ├── book-appointment.ts
│   │   │   │   │   │   └── cancel-appointment.ts
│   │   │   │   │   └── integrations/
│   │   │   │   │       └── google-calendar-client.ts
│   │   │   │   └── business-logic/
│   │   │   │       ├── index.ts       # MCP server entry point
│   │   │   │       └── tools/
│   │   │   │           ├── calculate-quote.ts
│   │   │   │           ├── validate-service-area.ts
│   │   │   │           └── get-generic-price-range.ts
│   │   │   ├── client.ts              # MCP Client (stdio transport)
│   │   │   └── types.ts
│   │   ├── supabase/
│   │   │   ├── client.ts              # Client-side Supabase client
│   │   │   ├── server.ts              # Server-side Supabase client
│   │   │   ├── middleware.ts
│   │   │   └── storage.ts
│   │   ├── trpc/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── context.ts
│   │   │   ├── routers/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── tenant.ts
│   │   │   │   ├── call.ts
│   │   │   │   ├── lead.ts
│   │   │   │   ├── booking.ts
│   │   │   │   └── analytics.ts
│   │   │   └── root.ts
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── webhooks.ts
│   │   ├── vapi/
│   │   │   ├── client.ts
│   │   │   ├── webhooks.ts
│   │   │   └── types.ts
│   │   ├── validations/
│   │   │   ├── tenant.ts
│   │   │   ├── call.ts
│   │   │   ├── lead.ts
│   │   │   └── booking.ts
│   │   ├── utils/
│   │   │   ├── encryption.ts
│   │   │   ├── formatting.ts
│   │   │   ├── date.ts
│   │   │   └── phone.ts
│   │   └── hooks/
│   │       ├── use-tenant.ts
│   │       ├── use-calls.ts
│   │       ├── use-leads.ts
│   │       └── use-realtime.ts
│   ├── store/
│   │   └── app-state.ts               # Zustand store
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       ├── database.types.ts          # Generated from Supabase
│       ├── trpc.ts
│       └── index.ts
├── scripts/
│   ├── start-mcp-servers.ts            # Launch all MCP servers
│   └── dev.ts                          # Development startup script
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local.example
├── .env.local
├── .eslintrc.json
├── .gitignore
├── components.json                     # shadcn/ui config
├── next.config.js
├── package.json
├── postcss.config.js
├── prettier.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Phase 0: Infrastructure & Environment Setup

**Goal:** Set up the development environment, version control, hosting, and external service accounts.

### Epic 0.1: Repository & Version Control

#### Task 0.1.1: Initialize Git Repository
- [x] **Subtask 0.1.1.1:** Initialize Git repository with `git init`
- [x] **Subtask 0.1.1.2:** Create `.gitignore` file with Next.js, Node, and environment variables
- [x] **Subtask 0.1.1.3:** Create initial `README.md` with project overview
- [x] **Subtask 0.1.1.4:** Set up GitHub repository and push initial commit
- [x] **Subtask 0.1.1.5:** Configure branch protection rules for `main` branch

#### Task 0.1.2: Set Up GitHub Actions for CI/CD
- [x] **Subtask 0.1.2.1:** Create `.github/workflows/ci.yml` for linting and type checking
- [x] **Subtask 0.1.2.2:** Create `.github/workflows/deploy.yml` for Vercel deployments
- [x] **Subtask 0.1.2.3:** Add workflow status badges to README

### Epic 0.2: Next.js Project Initialization

#### Task 0.2.1: Create Next.js 14 Project
- [x] **Subtask 0.2.1.1:** Run `npx create-next-app@latest greenacre-ai --typescript --tailwind --app --use-npm`
- [x] **Subtask 0.2.1.2:** Configure `next.config.js` with required settings (experimental features, image domains)
- [x] **Subtask 0.2.1.3:** Update `tsconfig.json` with strict mode and path aliases (`@/`)
- [x] **Subtask 0.2.1.4:** Set up ESLint configuration (`.eslintrc.json`)
- [x] **Subtask 0.2.1.5:** Set up Prettier configuration (`prettier.config.js`)

#### Task 0.2.2: Install Core Dependencies
```bash
npm install \
  @trpc/server@^10.45.0 \
  @trpc/client@^10.45.0 \
  @trpc/react-query@^10.45.0 \
  @tanstack/react-query@^5.28.0 \
  @supabase/supabase-js@^2.39.0 \
  prisma@^5.10.0 \
  @prisma/client@^5.10.0 \
  zod@^3.22.0 \
  zustand@^4.5.0 \
  stripe@^14.0.0 \
  @langchain/langgraph@^0.0.15 \
  @langchain/openai@^0.0.25 \
  @langchain/core@^0.1.52 \
  @modelcontextprotocol/sdk@^0.5.0 \
  react-hook-form@^7.51.0 \
  @hookform/resolvers@^3.3.4
```
- [x] **Subtask 0.2.2.1:** Install production dependencies listed above
- [x] **Subtask 0.2.2.2:** Install dev dependencies (`@types/*`, `eslint`, `prettier`)
- [x] **Subtask 0.2.2.3:** Verify all dependencies install without conflicts

#### Task 0.2.3: Set Up shadcn/ui
- [x] **Subtask 0.2.3.1:** Run `npx shadcn-ui@latest init` and configure (New York style, Zinc color)
- [x] **Subtask 0.2.3.2:** Install base components: `button`, `input`, `card`, `dialog`, `table`, `form`, `select`, `checkbox`, `toast`
- [x] **Subtask 0.2.3.3:** Verify `components.json` configuration
- [x] **Subtask 0.2.3.4:** Create `src/components/ui/` directory structure

### Epic 0.3: External Service Setup

#### Task 0.3.1: Supabase Project Setup
- [x] **Subtask 0.3.1.1:** Create Supabase account and new project (name: `greenacre-ai-dev`)
- [x] **Subtask 0.3.1.2:** Note down project URL and anon key
- [x] **Subtask 0.3.1.3:** Enable necessary extensions (uuid-ossp, pgcrypto) in SQL Editor
- [x] **Subtask 0.3.1.4:** Configure Supabase Auth providers (Email, Google OAuth)
- [x] **Subtask 0.3.1.5:** Set up Supabase Storage bucket: `call-recordings` (public: false)

#### Task 0.3.2: Vercel Project Setup
- [x] **Subtask 0.3.2.1:** Create Vercel account and connect GitHub repository
- [x] **Subtask 0.3.2.2:** Configure Vercel project settings (Framework Preset: Next.js)
- [x] **Subtask 0.3.2.3:** Note down Vercel project URL
- [x] **Subtask 0.3.2.4:** Added environment variables to Vercel
- [x] **Subtask 0.3.2.5:** Generated application secrets (NEXTAUTH_SECRET, JWT_SECRET, ENCRYPTION_KEY)
- [x] **Subtask 0.3.2.6:** Add GitHub Secrets (VERCEL_TOKEN, PROJECT_ID, ORG_ID)

#### Task 0.3.3: VAPI Account Setup
- [x] **Subtask 0.3.3.1:** Create VAPI account at vapi.ai
- [x] **Subtask 0.3.3.2:** Generate API key from dashboard (use existing private key)
- [x] **Subtask 0.3.3.3:** Understand VAPI's role in architecture (STT/TTS only)
- [ ] **Subtask 0.3.3.4:** Copy webhook secret (PENDING)
- [ ] **Subtask 0.3.3.5:** Add payment method (PENDING)
- [ ] **Subtask 0.3.3.6:** Set up usage alerts (PENDING)

#### Task 0.3.4: Stripe Account Setup (DEFERRED FOR LATER)
- [ ] **Subtask 0.3.4.1:** Create Stripe account (Test mode)
- [ ] **Subtask 0.3.4.2:** Generate API keys (Publishable and Secret)
- [ ] **Subtask 0.3.4.3:** Configure webhook endpoint (will be implemented later)
- [ ] **Subtask 0.3.4.4:** Create product and pricing structure (Starter plan: $99/mo)

#### Task 0.3.5: OpenAI API Setup
- [x] **Subtask 0.3.5.1:** Create OpenAI account and add payment method
- [x] **Subtask 0.3.5.2:** Generate API key for GPT-4o access
- [x] **Subtask 0.3.5.3:** Set up usage limits and alerts
- [ ] **Subtask 0.3.5.4:** Verify GPT-4o model access (PENDING - CRITICAL)

#### Task 0.3.6: Regrid API Setup (Property Data)
- [x] **Subtask 0.3.6.1:** Sign up for Regrid API access (30-day trial)
- [x] **Subtask 0.3.6.2:** Generate API key
- [x] **Subtask 0.3.6.3:** Test API with sample address lookup (Dallas County, TX)
- [x] **Subtask 0.3.6.4:** Understand rate limits and pricing (2,000 parcels, 7 trial counties)
- [x] **Subtask 0.3.6.5:** Verified ll_gissqft field returns lot size in square feet

#### Task 0.3.7: Google Cloud Console Setup (Calendar API)
- [x] **Subtask 0.3.7.1:** Create Google Cloud project (GreenAcreAI)
- [x] **Subtask 0.3.7.2:** Enable Google Calendar API
- [x] **Subtask 0.3.7.3:** Configure OAuth 2.0 consent screen (External, Testing mode)
- [x] **Subtask 0.3.7.4:** Create OAuth 2.0 credentials (Web application)
- [x] **Subtask 0.3.7.5:** Add authorized redirect URIs (localhost and Vercel)
- [x] **Subtask 0.3.7.6:** Note down Client ID and Client Secret
- [x] **Subtask 0.3.7.7:** Configure Google OAuth in Supabase
- [x] **Subtask 0.3.7.8:** Add required Calendar API scopes

#### Task 0.3.8: Sentry Setup (Error Tracking)
- [ ] **Subtask 0.3.8.1:** Create Sentry account and project
- [ ] **Subtask 0.3.8.2:** Generate DSN key
- [ ] **Subtask 0.3.8.3:** Install Sentry SDK: `@sentry/nextjs`
- [ ] **Subtask 0.3.8.4:** Run `npx @sentry/wizard@latest -i nextjs` for automatic setup

### Epic 0.4: Environment Variables Configuration

#### Task 0.4.1: Create Environment Files
- [x] **Subtask 0.4.1.1:** Create `.env.local` file (DO NOT commit)
- [x] **Subtask 0.4.1.2:** Create `.env.local.example` file (commit this)
- [ ] **Subtask 0.4.1.3:** Create `.env.production` template for Vercel (NOT NEEDED - using Vercel dashboard)

#### Task 0.4.2: Configure Environment Variables
Add all environment variables to `.env.local`:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # For Prisma migrations
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhb..."
SUPABASE_SERVICE_ROLE_KEY="eyJhb..." # Server-side only

# Auth
NEXTAUTH_SECRET="your-secret-here" # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# VAPI
VAPI_API_KEY="your-vapi-key"
VAPI_WEBHOOK_SECRET="your-webhook-secret"
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your-public-key"

# OpenAI
OPENAI_API_KEY="sk-..."

# Regrid (Property Data)
REGRID_API_KEY="your-regrid-key"

# Google Calendar
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Sentry
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

- [x] **Subtask 0.4.2.1:** Add all environment variables to `.env.local`
- [x] **Subtask 0.4.2.2:** Add sanitized versions to `.env.local.example`
- [x] **Subtask 0.4.2.3:** Configure same variables in Vercel project settings

#### Task 0.4.3: Create Environment Validation
- [x] **Subtask 0.4.3.1:** Create `src/lib/env.ts` with Zod schema to validate env vars at build time
- [x] **Subtask 0.4.3.2:** Enable instrumentation hook in `next.config.js`
- [x] **Subtask 0.4.3.3:** Create `instrumentation.ts` to validate env vars on server startup
- [x] **Subtask 0.4.3.4:** Test build to ensure validation works correctly

---

## Phase 1: Database & Auth Layer

**Goal:** Set up PostgreSQL schema, Row-Level Security, Prisma ORM, and authentication.

### Epic 1.1: Database Schema & Migrations

#### Task 1.1.1: Initialize Prisma
- [x] **Subtask 1.1.1.1:** Run `npx prisma init` to create `prisma/` directory
- [x] **Subtask 1.1.1.2:** Configure `prisma/schema.prisma` datasource to use Supabase connection string
- [x] **Subtask 1.1.1.3:** Set `directUrl` for migrations (Supabase transaction mode)

#### Task 1.1.2: Define Prisma Schema - Core Tables
Based on technical-architecture.md Section 5.1:

- [x] **Subtask 1.1.2.1:** Create `Tenant` model in `schema.prisma`
  ```prisma
  model Tenant {
    id                              String   @id @default(uuid()) @db.Uuid
    createdAt                       DateTime @default(now()) @map("created_at") @db.Timestamptz
    updatedAt                       DateTime @updatedAt @map("updated_at") @db.Timestamptz

    businessName                    String   @map("business_name") @db.VarChar(255)
    ownerName                       String   @map("owner_name") @db.VarChar(255)
    email                           String   @unique @db.VarChar(255)
    phone                           String?  @db.VarChar(20)

    serviceAreas                    Json     @default("[]") @map("service_areas") @db.JsonB
    pricingTiers                    Json     @default("[]") @map("pricing_tiers") @db.JsonB
    allowsGenericQuotes             Boolean  @default(true) @map("allows_generic_quotes")
    genericQuoteDisclaimer          String?  @default("Prices vary by property size. Address needed for exact quote.") @map("generic_quote_disclaimer") @db.Text

    googleCalendarRefreshToken      String?  @map("google_calendar_refresh_token") @db.Text
    googleCalendarAccessToken       String?  @map("google_calendar_access_token") @db.Text
    googleCalendarTokenExpiresAt    DateTime? @map("google_calendar_token_expires_at") @db.Timestamptz
    calendarId                      String?  @map("calendar_id") @db.VarChar(255)

    phoneNumber                     String?  @unique @map("phone_number") @db.VarChar(20)
    phoneNumberSid                  String?  @map("phone_number_sid") @db.VarChar(255)

    vapiAgentId                     String?  @map("vapi_agent_id") @db.VarChar(255)
    vapiPhoneNumberId               String?  @map("vapi_phone_number_id") @db.VarChar(255)

    stripeCustomerId                String?  @map("stripe_customer_id") @db.VarChar(255)
    stripeSubscriptionId            String?  @map("stripe_subscription_id") @db.VarChar(255)
    subscriptionStatus              String   @default("trialing") @map("subscription_status") @db.VarChar(50)
    subscriptionPlan                String   @default("starter") @map("subscription_plan") @db.VarChar(50)
    trialEndsAt                     DateTime? @map("trial_ends_at") @db.Timestamptz

    timezone                        String   @default("America/New_York") @db.VarChar(50)
    businessHours                   Json     @default("{\"monday\": {\"start\": \"09:00\", \"end\": \"17:00\"}}") @map("business_hours") @db.JsonB
    notificationPreferences         Json     @default("{\"sms_new_lead\": true, \"sms_new_booking\": true}") @map("notification_preferences") @db.JsonB

    status                          String   @default("active") @db.VarChar(50)
    onboardingCompleted             Boolean  @default(false) @map("onboarding_completed")
    onboardingStep                  String   @default("signup") @map("onboarding_step") @db.VarChar(50)
    testCallCompleted               Boolean  @default(false) @map("test_call_completed")
    testCallCompletedAt             DateTime? @map("test_call_completed_at") @db.Timestamptz

    metadata                        Json     @default("{}") @db.JsonB

    users                           User[]
    calls                           Call[]
    leads                           Lead[]
    bookings                        Booking[]
    notifications                   Notification[]
    analyticsDailies                AnalyticsDaily[]

    @@index([email])
    @@index([phoneNumber], map: "idx_tenants_phone_number")
    @@index([stripeCustomerId], map: "idx_tenants_stripe_customer_id")
    @@index([status])
    @@map("tenants")
  }
  ```

- [x] **Subtask 1.1.2.2:** Create `User` model in `schema.prisma`
- [x] **Subtask 1.1.2.3:** Create `Call` model in `schema.prisma`
- [x] **Subtask 1.1.2.4:** Create `Lead` model in `schema.prisma`
- [x] **Subtask 1.1.2.5:** Create `Booking` model in `schema.prisma`
- [x] **Subtask 1.1.2.6:** Create `Notification` model in `schema.prisma`
- [x] **Subtask 1.1.2.7:** Create `Webhook` model in `schema.prisma`
- [x] **Subtask 1.1.2.8:** Create `AnalyticsDaily` model in `schema.prisma`
- [x] **Subtask 1.1.2.9:** Create `PricingTemplate` model in `schema.prisma`

#### Task 1.1.3: Create Initial Migration
- [x] **Subtask 1.1.3.1:** Run `npx prisma migrate dev --name init` to create first migration
- [x] **Subtask 1.1.3.2:** Verify migration SQL matches TAD schema (Section 5.1)
- [x] **Subtask 1.1.3.3:** Apply migration to Supabase database
- [x] **Subtask 1.1.3.4:** Verify tables created in Supabase dashboard

#### Task 1.1.4: Create Database Functions (Raw SQL)
These are PostgreSQL functions that Prisma doesn't handle:

- [x] **Subtask 1.1.4.1:** Create migration file: `prisma/migrations/.../add_functions.sql`
- [x] **Subtask 1.1.4.2:** Add `update_updated_at_column()` trigger function
- [x] **Subtask 1.1.4.3:** Add `get_quote_for_lot_size()` function (TAD line 1425)
- [x] **Subtask 1.1.4.4:** Add `get_generic_price_range()` function (TAD line 1458)
- [x] **Subtask 1.1.4.5:** Add `is_in_service_area()` function (TAD line 1506)
- [x] **Subtask 1.1.4.6:** Add `is_within_business_hours()` function (TAD line 1523)
- [x] **Subtask 1.1.4.7:** Add `update_lead_on_booking()` trigger function (TAD line 1562)
- [x] **Subtask 1.1.4.8:** Apply migration: `npx prisma migrate deploy`

#### Task 1.1.5: Create Database Views
- [x] **Subtask 1.1.5.1:** Create `call_summary` view (TAD line 1584) via SQL migration
- [x] **Subtask 1.1.5.2:** Verify view works with test query

#### Task 1.1.6: Seed Database with Templates
- [x] **Subtask 1.1.6.1:** Create `prisma/seed.ts` file
- [x] **Subtask 1.1.6.2:** Add seed data for `PricingTemplate` (Standard Lawn Care - TAD line 1615)
- [x] **Subtask 1.1.6.3:** Add seed script to `package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }`
- [x] **Subtask 1.1.6.4:** Run `npx prisma db seed`

### Epic 1.2: Row-Level Security (RLS)

#### Task 1.2.1: Enable RLS on Tables
Create SQL migration to enable RLS:

- [x] **Subtask 1.2.1.1:** Create migration: `prisma/migrations/.../enable_rls.sql`
- [x] **Subtask 1.2.1.2:** Add `ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;`
- [x] **Subtask 1.2.1.3:** Add `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
- [x] **Subtask 1.2.1.4:** Add `ALTER TABLE calls ENABLE ROW LEVEL SECURITY;`
- [x] **Subtask 1.2.1.5:** Add `ALTER TABLE leads ENABLE ROW LEVEL SECURITY;`
- [x] **Subtask 1.2.1.6:** Add `ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;`
- [x] **Subtask 1.2.1.7:** Add `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`
- [x] **Subtask 1.2.1.8:** Add `ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;`

#### Task 1.2.2: Create RLS Policies
Based on TAD Section 5.1 (lines 1392-1419):

- [x] **Subtask 1.2.2.1:** Create policy for `tenants` table (tenant_isolation_policy)
  ```sql
  CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL
    USING (id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));
  ```
- [x] **Subtask 1.2.2.2:** Create policy for `users` table
- [x] **Subtask 1.2.2.3:** Create policy for `calls` table
- [x] **Subtask 1.2.2.4:** Create policy for `leads` table
- [x] **Subtask 1.2.2.5:** Create policy for `bookings` table
- [x] **Subtask 1.2.2.6:** Create policy for `notifications` table
- [x] **Subtask 1.2.2.7:** Create policy for `analytics_daily` table
- [x] **Subtask 1.2.2.8:** Apply migration and verify policies in Supabase dashboard

### Epic 1.3: Prisma Client & Type Generation

#### Task 1.3.1: Generate Prisma Client
- [x] **Subtask 1.3.1.1:** Run `npx prisma generate` to create Prisma Client
- [x] **Subtask 1.3.1.2:** Verify `node_modules/.prisma/client` is generated
- [x] **Subtask 1.3.1.3:** Create `src/lib/prisma.ts` singleton instance:
  ```typescript
  import { PrismaClient } from '@prisma/client'

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

  export const prisma = globalForPrisma.prisma ?? new PrismaClient()

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```

#### Task 1.3.2: Generate Supabase Types
- [x] **Subtask 1.3.2.1:** Install Supabase CLI: `npm install -g supabase`
- [x] **Subtask 1.3.2.2:** Generate types: `supabase gen types typescript --project-id <project-id> > src/types/database.types.ts`
- [x] **Subtask 1.3.2.3:** Add script to `package.json`: `"types:supabase": "supabase gen types..."`
- [x] **Subtask 1.3.2.4:** Verify types are correctly generated

### Epic 1.4: Authentication Setup

#### Task 1.4.1: Create Supabase Client Utilities
- [x] **Subtask 1.4.1.1:** Create `src/lib/supabase/client.ts` (client-side):
  ```typescript
  import { createClientComponentClient } from '@supabase/supabase-js'
  import type { Database } from '@/types/database.types'

  export const createClient = () => createClientComponentClient<Database>()
  ```
- [x] **Subtask 1.4.1.2:** Create `src/lib/supabase/server.ts` (server-side, for Server Components):
  ```typescript
  import { createServerComponentClient } from '@supabase/supabase-js'
  import { cookies } from 'next/headers'
  import type { Database } from '@/types/database.types'

  export const createClient = () => createServerComponentClient<Database>({ cookies })
  ```
- [x] **Subtask 1.4.1.3:** Create `src/lib/supabase/middleware.ts` (for middleware auth):
  ```typescript
  import { createMiddlewareClient } from '@supabase/supabase-js'
  import { NextRequest, NextResponse } from 'next/server'
  import type { Database } from '@/types/database.types'

  export const createClient = (req: NextRequest, res: NextResponse) => {
    return createMiddlewareClient<Database>({ req, res })
  }
  ```

#### Task 1.4.2: Create Auth Middleware
- [x] **Subtask 1.4.2.1:** Create `src/middleware.ts` for Next.js middleware
- [x] **Subtask 1.4.2.2:** Implement session refresh logic using Supabase middleware client
- [x] **Subtask 1.4.2.3:** Protect dashboard routes (redirect to login if not authenticated)
- [x] **Subtask 1.4.2.4:** Allow public routes: `/`, `/login`, `/signup`, `/api/webhooks/*`

#### Task 1.4.3: Create Auth API Routes
- [x] **Subtask 1.4.3.1:** Create `src/app/api/auth/callback/route.ts` (OAuth callback handler)
- [x] **Subtask 1.4.3.2:** Create `src/app/api/auth/signout/route.ts` (Sign out handler)
- [ ] **Subtask 1.4.3.3:** Test OAuth flow with Google (using test Google account)
  - **BLOCKED:** OAuth redirects to error page without showing Google consent screen
  - **Debug Steps Needed:**
    1. Check Network tab for Supabase authorize request (status code, redirects)
    2. Check if request reaches Google OAuth servers
    3. Check Supabase logs for OAuth errors
    4. Verify all configurations are correct (Google OAuth scopes, test users, redirect URIs)
  - **All configurations verified as correct:**
    - ✅ Google OAuth Client has Supabase callback URL
    - ✅ Scopes configured (openid, userinfo.email, userinfo.profile)
    - ✅ Test user added (anishmareddy11@gmail.com)
    - ✅ Supabase provider has correct Client ID/Secret
    - ✅ Supabase Site URL and Redirect URLs configured correctly

#### Task 1.4.4: Create Auth Context & Hooks
- [x] **Subtask 1.4.4.1:** Create `src/lib/hooks/use-user.ts`:
  ```typescript
  import { createClient } from '@/lib/supabase/client'
  import { useEffect, useState } from 'react'
  import type { User } from '@supabase/supabase-js'

  export function useUser() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }, [])

    return { user, loading }
  }
  ```
- [ ] **Subtask 1.4.4.2:** Create `src/lib/hooks/use-tenant.ts` to fetch tenant data based on user (DEFERRED - will create when needed)

---

## Phase 2: Core Application Skeleton

**Goal:** Build the foundational Next.js app structure, tRPC setup, UI components, and layouts.

### Epic 2.1: tRPC Setup

#### Task 2.1.1: Initialize tRPC Server
- [x] **Subtask 2.1.1.1:** Create `src/lib/trpc/server.ts`:
  ```typescript
  import { initTRPC, TRPCError } from '@trpc/server'
  import { Context } from './context'
  import superjson from 'superjson'

  const t = initTRPC.context<Context>().create({
    transformer: superjson,
  })

  export const router = t.router
  export const publicProcedure = t.procedure
  export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    })
  })
  ```
- [x] **Subtask 2.1.1.2:** Install `superjson` for serialization: `npm install superjson`

#### Task 2.1.2: Create tRPC Context
- [x] **Subtask 2.1.2.1:** Create `src/lib/trpc/context.ts`:
  ```typescript
  import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
  import { createClient } from '@/lib/supabase/server'
  import { prisma } from '@/lib/prisma'

  export async function createContext(opts?: FetchCreateContextFnOptions) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch tenant_id from users table if authenticated
    let tenantId: string | null = null
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { authUserId: user.id },
        select: { tenantId: true },
      })
      tenantId = dbUser?.tenantId ?? null
    }

    return {
      user,
      tenantId,
      prisma,
    }
  }

  export type Context = Awaited<ReturnType<typeof createContext>>
  ```

#### Task 2.1.3: Create Root Router
- [x] **Subtask 2.1.3.1:** Create `src/lib/trpc/root.ts` (created as `src/lib/trpc/routers/_app.ts`):
  ```typescript
  import { router } from './server'
  import { authRouter } from './routers/auth'
  import { tenantRouter } from './routers/tenant'
  import { callRouter } from './routers/call'
  import { leadRouter } from './routers/lead'
  import { bookingRouter } from './routers/booking'
  import { analyticsRouter } from './routers/analytics'

  export const appRouter = router({
    auth: authRouter,
    tenant: tenantRouter,
    call: callRouter,
    lead: leadRouter,
    booking: bookingRouter,
    analytics: analyticsRouter,
  })

  export type AppRouter = typeof appRouter
  ```

#### Task 2.1.4: Create Initial Routers (Stubs)
- [x] **Subtask 2.1.4.1:** Create `src/lib/trpc/routers/user.ts` with basic test procedures (hello, getProfile)
- [x] **Subtask 2.1.4.2:** Create `src/lib/trpc/routers/tenant.ts` (will be filled in Phase 3)
- [x] **Subtask 2.1.4.3:** Create `src/lib/trpc/routers/call.ts` (stub)
- [x] **Subtask 2.1.4.4:** Create `src/lib/trpc/routers/lead.ts` (stub)
- [x] **Subtask 2.1.4.5:** Create `src/lib/trpc/routers/booking.ts` (stub)
- [x] **Subtask 2.1.4.6:** Create `src/lib/trpc/routers/analytics.ts` (stub)

#### Task 2.1.5: Create tRPC API Route Handler
- [x] **Subtask 2.1.5.1:** Create `src/app/api/trpc/[trpc]/route.ts`:
  ```typescript
  import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
  import { appRouter } from '@/lib/trpc/root'
  import { createContext } from '@/lib/trpc/context'

  const handler = (req: Request) =>
    fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext,
    })

  export { handler as GET, handler as POST }
  ```

#### Task 2.1.6: Create tRPC Client
- [x] **Subtask 2.1.6.1:** Create `src/lib/trpc/client.ts`:
  ```typescript
  import { createTRPCReact } from '@trpc/react-query'
  import type { AppRouter } from './root'

  export const trpc = createTRPCReact<AppRouter>()
  ```
- [x] **Subtask 2.1.6.2:** Create `src/lib/trpc/Provider.tsx` (React Query + tRPC Provider):
  ```typescript
  'use client'

  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { httpBatchLink } from '@trpc/client'
  import { useState } from 'react'
  import { trpc } from './client'
  import superjson from 'superjson'

  export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())
    const [trpcClient] = useState(() =>
      trpc.createClient({
        transformer: superjson,
        links: [
          httpBatchLink({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
          }),
        ],
      })
    )

    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    )
  }
  ```

### Epic 2.2: Layout & UI Components

#### Task 2.2.1: Create Root Layout
- [x] **Subtask 2.2.1.1:** Update `src/app/layout.tsx` (TRPCProvider already added):
  ```typescript
  import type { Metadata } from 'next'
  import { Inter } from 'next/font/google'
  import './globals.css'
  import { TRPCProvider } from '@/lib/trpc/provider'
  import { Toaster } from '@/components/ui/toaster'

  const inter = Inter({ subsets: ['latin'] })

  export const metadata: Metadata = {
    title: 'GreenAcre AI - Voice AI for Lawn Care',
    description: 'Enterprise-grade multi-tenant voice AI platform',
  }

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </body>
      </html>
    )
  }
  ```
- [x] **Subtask 2.2.1.2:** Update `src/styles/globals.css` with Tailwind directives, custom green theme, and scrollbar styles

#### Task 2.2.2: Create Auth Layout
- [x] **Subtask 2.2.2.1:** Create `src/app/(auth)/layout.tsx` with centered card design and GreenAcre branding
- [x] **Subtask 2.2.2.2:** Update `src/app/(auth)/login/page.tsx` to use shadcn Button component
- [x] **Subtask 2.2.2.3:** Create `src/app/(auth)/signup/page.tsx` with similar design
  ```typescript
  export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          {children}
        </div>
      </div>
    )
  }
  ```

#### Task 2.2.3: Create Dashboard Layout
- [x] **Subtask 2.2.3.1:** Create `src/components/layout/header.tsx` (top navigation bar with notifications, settings, user menu)
- [x] **Subtask 2.2.3.2:** Create `src/components/layout/sidebar.tsx` (side navigation with 7 nav links: Dashboard, Calls, Leads, Bookings, Messages, Analytics, Settings)
- [x] **Subtask 2.2.3.3:** Create `src/app/(dashboard)/layout.tsx` with full-height flex layout
- [x] **Subtask 2.2.3.4:** Update `src/app/(dashboard)/dashboard/page.tsx` with stat cards and account info
  ```typescript
  import { Header } from '@/components/layout/header'
  import { Sidebar } from '@/components/layout/sidebar'

  export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    )
  }
  ```

#### Task 2.2.4: Create Onboarding Layout
- [x] **Subtask 2.2.4.1:** Create `src/components/onboarding/progress-steps.tsx` (visual progress indicator)
- [x] **Subtask 2.2.4.2:** Create `src/app/(onboarding)/layout.tsx`:
  ```typescript
  import { ProgressSteps } from '@/components/onboarding/progress-steps'

  export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto py-12">
          <ProgressSteps />
          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
    )
  }
  ```

#### Task 2.2.5: Install Additional shadcn/ui Components
- [x] **Subtask 2.2.5.1:** Install: `badge`, `dropdown-menu`, `avatar`, `separator`, `skeleton`, `tabs`, `alert`
- [x] **Subtask 2.2.5.2:** Install: `calendar`, `popover`, `scroll-area`, `tooltip`
- [x] **Subtask 2.2.5.3:** Verify all components are in `src/components/ui/`

### Epic 2.3: Global State Management

#### Task 2.3.1: Create Zustand Store
- [x] **Subtask 2.3.1.1:** Create `src/store/app-state.ts` with sidebar toggle, tenant state, and user profile management
- [x] **Subtask 2.3.1.2:** Integrate Zustand store into sidebar and header components for collapsible sidebar functionality
  ```typescript
  import { create } from 'zustand'
  import type { Tenant } from '@prisma/client'

  interface AppState {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    currentTenant: Tenant | null
    setCurrentTenant: (tenant: Tenant | null) => void
  }

  export const useAppState = create<AppState>((set) => ({
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    currentTenant: null,
    setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  }))
  ```

### Epic 2.4: Utility Libraries

#### Task 2.4.1: Create Validation Schemas
- [x] **Subtask 2.4.1.1:** Create `src/lib/validations/tenant.ts` with Zod schemas for tenant operations
- [x] **Subtask 2.4.1.2:** Create `src/lib/validations/call.ts`
- [x] **Subtask 2.4.1.3:** Create `src/lib/validations/lead.ts`
- [x] **Subtask 2.4.1.4:** Create `src/lib/validations/booking.ts`

#### Task 2.4.2: Create Utility Functions
- [x] **Subtask 2.4.2.1:** Create `src/lib/utils/formatting.ts` (currency, phone number formatting)
- [x] **Subtask 2.4.2.2:** Create `src/lib/utils/date.ts` (timezone conversion, formatting)
- [x] **Subtask 2.4.2.3:** Create `src/lib/utils/phone.ts` (phone validation, E.164 formatting)
- [x] **Subtask 2.4.2.4:** Create `src/lib/utils/encryption.ts` (for encrypting Google tokens):
  ```typescript
  import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

  const ALGORITHM = 'aes-256-gcm'
  const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

  export function encrypt(text: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, KEY, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  export function decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, KEY, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
  ```
- [x] **Subtask 2.4.2.5:** Generate encryption key and add to `.env.local`: `ENCRYPTION_KEY=$(openssl rand -hex 32)`

---

## Phase 3: Tenant Onboarding & Management

**Goal:** Build the complete onboarding flow and tenant settings pages.

### Epic 3.1: Tenant tRPC Router Implementation

#### Task 3.1.1: Implement Tenant Router Procedures
Based on TAD Section 6.2 (API Design):

- [x] **Subtask 3.1.1.1:** Implement `tenant.getCurrent` procedure in `src/lib/trpc/routers/tenant.ts`
- [x] **Subtask 3.1.1.2:** Implement `tenant.updateBusinessInfo` procedure
- [x] **Subtask 3.1.1.3:** Implement `tenant.updateServiceAreas` procedure
- [x] **Subtask 3.1.1.4:** Implement `tenant.updatePricing` procedure with tier validation
- [x] **Subtask 3.1.1.5:** Implement `tenant.updateBusinessHours` procedure
- [x] **Subtask 3.1.1.6:** Implement `tenant.updateNotificationPreferences` procedure
- [x] **Subtask 3.1.1.7:** Implement `tenant.completeOnboardingStep` procedure

### Epic 3.2: Onboarding Flow Pages

#### Task 3.2.1: Step 1 - Business Information
- [x] **Subtask 3.2.1.1:** Create `src/app/(onboarding)/step-1-business/page.tsx`
- [x] **Subtask 3.2.1.2:** Create `src/components/onboarding/business-form.tsx`:
  - Business Name (required)
  - Owner Name (required)
  - Email (pre-filled from auth)
  - Phone (optional)
  - Service Areas (ZIP codes input, multi-select)
- [x] **Subtask 3.2.1.3:** Implement form validation with Zod + react-hook-form
- [x] **Subtask 3.2.1.4:** On submit: call `tenant.updateBusinessInfo`, then navigate to step 2

#### Task 3.2.2: Step 2 - Pricing Configuration
- [x] **Subtask 3.2.2.1:** Create `src/app/(onboarding)/step-2-pricing/page.tsx`
- [x] **Subtask 3.2.2.2:** Create `src/components/onboarding/pricing-form.tsx`:
  - Load default pricing template
  - Display pricing tier editor (min_sqft, max_sqft, weekly_price, biweekly_price)
  - Add/remove tier functionality
  - Validate no gaps in tiers
  - Toggle: "Allow generic quotes without address"
  - Generic quote disclaimer text
- [x] **Subtask 3.2.2.3:** Implement dynamic tier validation (ensure continuous coverage)
- [x] **Subtask 3.2.2.4:** On submit: call `tenant.updatePricing`, navigate to step 3

#### Task 3.2.3: Step 3 - Google Calendar Integration
- [x] **Subtask 3.2.3.1:** Create `src/app/(onboarding)/step-3-calendar/page.tsx`
- [x] **Subtask 3.2.3.2:** Create `src/components/onboarding/calendar-connect.tsx`:
  - "Connect Google Calendar" button
  - OAuth flow trigger
  - Success state display (calendar name, disconnect option)
- [x] **Subtask 3.2.3.3:** Implement `tenant.connectCalendar` procedure in tRPC router:
  ```typescript
  connectCalendar: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Exchange OAuth code for tokens
      const tokens = await getGoogleTokens(input.code)
      // Encrypt refresh token
      const encrypted = encrypt(tokens.refresh_token)
      // Update tenant
      return await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          googleCalendarRefreshToken: encrypted,
          googleCalendarAccessToken: tokens.access_token,
          googleCalendarTokenExpiresAt: new Date(tokens.expiry_date),
          calendarId: tokens.calendar_id,
        },
      })
    })
  ```
- [x] **Subtask 3.2.3.4:** Create Google OAuth helper: `src/lib/google/oauth.ts`
- [x] **Subtask 3.2.3.5:** On success: navigate to step 4

#### Task 3.2.4: Step 4 - Phone Number Setup
- [x] **Subtask 3.2.4.1:** Create `src/app/(onboarding)/step-4-phone/page.tsx`
- [x] **Subtask 3.2.4.2:** Create `src/components/onboarding/phone-setup.tsx`:
  - Display: "We'll provision a phone number for you"
  - Area code preference input (optional)
  - "Provision Number" button
- [x] **Subtask 3.2.4.3:** Create VAPI client: `src/lib/vapi/client.ts`
- [x] **Subtask 3.2.4.4:** Implement `tenant.provisionPhoneNumber` procedure:
  - Call VAPI API to create phone number
  - Create VAPI agent (configured to use custom LLM endpoint)
  - Link phone number to agent
  - Save `phoneNumber`, `phoneNumberSid`, `vapiAgentId`, `vapiPhoneNumberId` to tenant
- [x] **Subtask 3.2.4.5:** On success: navigate to step 5

#### Task 3.2.5: Step 5 - Test Call & Go Live
- [x] **Subtask 3.2.5.1:** Create `src/app/(onboarding)/step-5-test/page.tsx`
- [x] **Subtask 3.2.5.2:** Create `src/components/onboarding/test-call.tsx`:
  - Display provisioned phone number
  - "Call this number to test" instructions
  - Real-time call status indicator (waiting for call → call detected → call completed)
  - "Mark as Complete" button (manual fallback)
- [x] **Subtask 3.2.5.3:** Implement real-time call detection:
  - Subscribe to `calls` table changes via Supabase Realtime
  - When new call with tenant_id matches → show success
- [x] **Subtask 3.2.5.4:** On test call completion:
  - Update tenant: `testCallCompleted = true`, `testCallCompletedAt = now()`, `onboardingCompleted = true`
  - Navigate to dashboard

### Epic 3.3: Settings Pages

#### Task 3.3.1: Settings Layout
- [x] **Subtask 3.3.1.1:** Create `src/app/(dashboard)/settings/layout.tsx` with tabs for: Business, Pricing, Calendar, Phone, Notifications

#### Task 3.3.2: Business Settings
- [x] **Subtask 3.3.2.1:** Create `src/app/(dashboard)/settings/business/page.tsx`
- [x] **Subtask 3.3.2.2:** Reuse `BusinessForm` component from onboarding
- [x] **Subtask 3.3.2.3:** Add business hours editor (per day of week, start/end time)
- [x] **Subtask 3.3.2.4:** Add timezone selector

#### Task 3.3.3: Pricing Settings
- [x] **Subtask 3.3.3.1:** Create `src/app/(dashboard)/settings/pricing/page.tsx`
- [x] **Subtask 3.3.3.2:** Reuse `PricingForm` component
- [x] **Subtask 3.3.3.3:** Add "Pricing History" section (audit log - future enhancement placeholder)

#### Task 3.3.4: Calendar Settings
- [x] **Subtask 3.3.4.1:** Create `src/app/(dashboard)/settings/calendar/page.tsx`
- [x] **Subtask 3.3.4.2:** Show connected calendar info
- [x] **Subtask 3.3.4.3:** "Disconnect" and "Reconnect" buttons
- [x] **Subtask 3.3.4.4:** Display recent calendar sync status

#### Task 3.3.5: Phone Settings
- [x] **Subtask 3.3.5.1:** Create `src/app/(dashboard)/settings/phone/page.tsx`
- [x] **Subtask 3.3.5.2:** Display current phone number
- [x] **Subtask 3.3.5.3:** Display VAPI agent status
- [x] **Subtask 3.3.5.4:** "Change Number" button (future enhancement placeholder)

#### Task 3.3.6: Notification Settings
- [x] **Subtask 3.3.6.1:** Create `src/app/(dashboard)/settings/notifications/page.tsx`
- [x] **Subtask 3.3.6.2:** Checkboxes for:
  - SMS on new lead
  - SMS on new booking
  - Email daily summary (future)
- [x] **Subtask 3.3.6.3:** Implement `tenant.updateNotificationPreferences` procedure (already exists in tenant router)

---

## Phase 4: The Intelligence Layer (LangGraph + MCP)

**Goal:** Build the core AI conversation engine with LangGraph state machine and MCP tool servers.

**ARCHITECTURE NOTE:** We use **true MCP (Model Context Protocol)** with standalone MCP servers running as separate processes. The LangGraph agent connects to these servers via MCP Client using stdio transport. This provides process isolation, modularity, and follows the Anthropic MCP specification.

**NOTE:** This is the most critical phase. Build MCP servers FIRST, then MCP client, then LangGraph agent.

### Epic 4.1: MCP Server - Property Lookup

#### Task 4.1.1: Create Regrid API Client
- [x] **Subtask 4.1.1.1:** Create `src/lib/mcp/servers/property-lookup/integrations/regrid-client.ts`:
  ```typescript
  import axios from 'axios'

  const REGRID_API_KEY = process.env.REGRID_API_KEY!
  const REGRID_BASE_URL = 'https://api.regrid.com/v1'

  export async function lookupProperty(address: {
    street: string
    city: string
    state: string
    zip: string
  }) {
    try {
      const response = await axios.get(`${REGRID_BASE_URL}/parcels`, {
        headers: { Authorization: `Bearer ${REGRID_API_KEY}` },
        params: {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
        },
      })

      const parcel = response.data.results[0]
      if (!parcel) throw new Error('Property not found')

      return {
        lot_size_sqft: parcel.fields.lot_size_sqft,
        parcel_id: parcel.id,
        address: parcel.fields.address,
        zoning: parcel.fields.zoning,
      }
    } catch (error) {
      throw new Error(`Regrid API error: ${error.message}`)
    }
  }
  ```

#### Task 4.1.2: Create Property Lookup MCP Tool
- [x] **Subtask 4.1.2.1:** Create `src/lib/mcp/servers/property-lookup/tools/lookup-property.ts`:
  ```typescript
  import { z } from 'zod'
  import { lookupProperty } from '../integrations/regrid-client'

  export const lookupPropertyTool = {
    name: 'lookup_property',
    description: 'Look up property lot size and details by address',
    input_schema: z.object({
      street: z.string().describe('Street address'),
      city: z.string().describe('City name'),
      state: z.string().length(2).describe('2-letter state code'),
      zip: z.string().length(5).describe('5-digit ZIP code'),
    }),
    handler: async (input: z.infer<typeof lookupPropertyTool.input_schema>) => {
      const result = await lookupProperty(input)
      return {
        lot_size_sqft: result.lot_size_sqft,
        parcel_id: result.parcel_id,
        address: result.address,
        zoning: result.zoning,
      }
    },
  }
  ```

#### Task 4.1.3: Create Property Lookup MCP Server (Standalone Process)
- [x] **Subtask 4.1.3.1:** Create `src/lib/mcp/servers/property-lookup/index.ts`:
  ```typescript
  #!/usr/bin/env node
  import { Server } from '@modelcontextprotocol/sdk/server/index.js'
  import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
  import { lookupPropertyTool } from './tools/lookup-property.js'

  // Create MCP server
  const server = new Server(
    {
      name: 'property-lookup-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  // Register tool list handler
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'lookup_property',
          description: 'Look up property lot size and details by address',
          inputSchema: {
            type: 'object',
            properties: {
              street: { type: 'string', description: 'Street address' },
              city: { type: 'string', description: 'City name' },
              state: { type: 'string', description: '2-letter state code' },
              zip: { type: 'string', description: '5-digit ZIP code' },
            },
            required: ['street', 'city', 'state', 'zip'],
          },
        },
      ],
    }
  })

  // Register tool call handler
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params

    if (name === 'lookup_property') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(await lookupPropertyTool.handler(args)),
          },
        ],
      }
    }

    throw new Error(`Unknown tool: ${name}`)
  })

  // Start server with stdio transport
  async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('Property Lookup MCP Server running on stdio')
  }

  main().catch((error) => {
    console.error('Server error:', error)
    process.exit(1)
  })
  ```
- [x] **Subtask 4.1.3.2:** Update `package.json` to add build script for MCP servers:
  ```json
  {
    "scripts": {
      "build:mcp": "tsc src/lib/mcp/servers/**/*.ts --outDir dist/mcp"
    }
  }
  ```

### Epic 4.2: MCP Server - Calendar Management

#### Task 4.2.1: Create Google Calendar API Client
- [x] **Subtask 4.2.1.1:** Install Google API client: `npm install googleapis`
- [x] **Subtask 4.2.1.2:** Create `src/lib/mcp/servers/calendar/integrations/google-calendar-client.ts`:
  ```typescript
  import { google } from 'googleapis'
  import { decrypt } from '@/lib/utils/encryption'
  import { prisma } from '@/lib/prisma'

  export async function getCalendarClient(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        googleCalendarRefreshToken: true,
        googleCalendarAccessToken: true,
        googleCalendarTokenExpiresAt: true,
        calendarId: true,
      },
    })

    if (!tenant?.googleCalendarRefreshToken) {
      throw new Error('Calendar not connected')
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      refresh_token: decrypt(tenant.googleCalendarRefreshToken),
      access_token: tenant.googleCalendarAccessToken,
    })

    // Auto-refresh tokens
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { googleCalendarAccessToken: tokens.access_token },
        })
      }
    })

    return {
      calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
      calendarId: tenant.calendarId,
    }
  }

  export async function getAvailableSlots(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const { calendar, calendarId } = await getCalendarClient(tenantId)

    // Fetch busy times
    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: calendarId }],
      },
    })

    const busySlots = data.calendars?.[calendarId!]?.busy || []

    // Generate available slots (9am-5pm, 1-hour blocks, excluding busy times)
    const availableSlots = [] // Implementation details...

    return { available_slots: availableSlots }
  }

  export async function bookAppointment(
    tenantId: string,
    booking: {
      start_time: string
      customer_name: string
      customer_phone: string
      property_address: string
      estimated_price: number
    }
  ) {
    const { calendar, calendarId } = await getCalendarClient(tenantId)

    const event = await calendar.events.insert({
      calendarId: calendarId!,
      requestBody: {
        summary: `Lawn Mowing - ${booking.customer_name}`,
        description: `Address: ${booking.property_address}\nPhone: ${booking.customer_phone}\nEstimated: $${booking.estimated_price}`,
        start: {
          dateTime: booking.start_time,
          timeZone: 'America/New_York', // TODO: Use tenant timezone
        },
        end: {
          dateTime: new Date(new Date(booking.start_time).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
      },
    })

    return {
      calendar_event_id: event.data.id,
      scheduled_at: booking.start_time,
    }
  }
  ```

#### Task 4.2.2: Create Calendar MCP Tools
- [x] **Subtask 4.2.2.1:** Create `src/lib/mcp/servers/calendar/tools/get-available-slots.ts`
- [x] **Subtask 4.2.2.2:** Create `src/lib/mcp/servers/calendar/tools/book-appointment.ts`
- [x] **Subtask 4.2.2.3:** Create `src/lib/mcp/servers/calendar/tools/cancel-appointment.ts` (optional, for future)

#### Task 4.2.3: Create Calendar MCP Server (Standalone Process)
- [x] **Subtask 4.2.3.1:** Create `src/lib/mcp/servers/calendar/index.ts` (similar structure to property-lookup server)
- [x] **Subtask 4.2.3.2:** Register tools: `get_available_slots`, `book_appointment`
- [x] **Subtask 4.2.3.3:** Set up stdio transport and handlers

### Epic 4.3: MCP Server - Business Logic

#### Task 4.3.1: Create Business Logic MCP Tools
- [x] **Subtask 4.3.1.1:** Create `src/lib/mcp/servers/business-logic/tools/calculate-quote.ts`:
  ```typescript
  import { z } from 'zod'
  import { prisma } from '@/lib/prisma'

  export const calculateQuoteTool = {
    name: 'calculate_quote',
    description: 'Calculate pricing quote based on lot size and tenant pricing tiers',
    input_schema: z.object({
      tenant_id: z.string().uuid(),
      lot_size_sqft: z.number().int().positive(),
      frequency: z.enum(['weekly', 'biweekly']).default('weekly'),
    }),
    handler: async (input: z.infer<typeof calculateQuoteTool.input_schema>) => {
      // Use database function get_quote_for_lot_size
      const result = await prisma.$queryRaw`
        SELECT * FROM get_quote_for_lot_size(
          ${input.tenant_id}::uuid,
          ${input.lot_size_sqft}::integer,
          ${input.frequency}::varchar
        )
      `

      if (!result || result.length === 0) {
        throw new Error('No pricing tier found for lot size')
      }

      const quote = result[0]
      return {
        price: input.frequency === 'weekly' ? quote.weekly_price : quote.biweekly_price,
        frequency: input.frequency,
        service_inclusions: quote.service_inclusions,
        pricing_type: quote.pricing_type,
        tier_range: `${quote.tier_min_sqft}-${quote.tier_max_sqft} sqft`,
      }
    },
  }
  ```

- [x] **Subtask 4.3.1.2:** Create `src/lib/mcp/servers/business-logic/tools/validate-service-area.ts`:
  ```typescript
  import { z } from 'zod'
  import { prisma } from '@/lib/prisma'

  export const validateServiceAreaTool = {
    name: 'validate_service_area',
    description: 'Check if a ZIP code is in the tenant service area',
    input_schema: z.object({
      tenant_id: z.string().uuid(),
      zip: z.string().length(5),
    }),
    handler: async (input: z.infer<typeof validateServiceAreaTool.input_schema>) => {
      const result = await prisma.$queryRaw`
        SELECT is_in_service_area(${input.tenant_id}::uuid, ${input.zip}::varchar) as in_area
      `

      return {
        in_service_area: result[0].in_area,
      }
    },
  }
  ```

- [x] **Subtask 4.3.1.3:** Create `src/lib/mcp/servers/business-logic/tools/get-generic-price-range.ts`

#### Task 4.3.2: Create Business Logic MCP Server (Standalone Process)
- [x] **Subtask 4.3.2.1:** Create `src/lib/mcp/servers/business-logic/index.ts` (similar structure to other servers)
- [x] **Subtask 4.3.2.2:** Register tools: `calculate_quote`, `validate_service_area`, `get_generic_price_range`
- [x] **Subtask 4.3.2.3:** Set up stdio transport and handlers

### Epic 4.4: MCP Client Implementation

#### Task 4.4.1: Create MCP Client (Stdio Transport)
- [x] **Subtask 4.4.1.1:** Create `src/lib/mcp/client.ts`:
  ```typescript
  import { Client } from '@modelcontextprotocol/sdk/client/index.js'
  import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
  import { spawn, ChildProcess } from 'child_process'
  import path from 'path'

  type ServerName = 'property-lookup' | 'calendar' | 'business-logic'

  class MCPClientManager {
    private clients: Map<ServerName, Client> = new Map()
    private processes: Map<ServerName, ChildProcess> = new Map()

    async getClient(serverName: ServerName): Promise<Client> {
      // Return existing client if already connected
      if (this.clients.has(serverName)) {
        return this.clients.get(serverName)!
      }

      // Spawn MCP server as child process
      const serverPath = path.join(
        process.cwd(),
        'dist',
        'mcp',
        'servers',
        serverName,
        'index.js'
      )

      const serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      // Store process for cleanup
      this.processes.set(serverName, serverProcess)

      // Create stdio transport
      const transport = new StdioClientTransport({
        input: serverProcess.stdout,
        output: serverProcess.stdin,
      })

      // Create MCP client
      const client = new Client(
        {
          name: 'langgraph-agent-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      )

      // Connect to server
      await client.connect(transport)

      // Store client
      this.clients.set(serverName, client)

      console.error(`Connected to ${serverName} MCP server`)

      return client
    }

    async callTool<T = any>(
      serverName: ServerName,
      toolName: string,
      args: Record<string, any>
    ): Promise<T> {
      const client = await this.getClient(serverName)

      const response = await client.request(
        {
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        },
        { timeout: 30000 }
      )

      // Parse response
      const resultText = response.content[0].text
      return JSON.parse(resultText) as T
    }

    // Cleanup on shutdown
    async shutdown() {
      for (const [serverName, client] of this.clients.entries()) {
        await client.close()
        this.processes.get(serverName)?.kill()
      }
      this.clients.clear()
      this.processes.clear()
    }
  }

  export const mcpClient = new MCPClientManager()

  // Cleanup on process exit
  process.on('SIGINT', async () => {
    await mcpClient.shutdown()
    process.exit(0)
  })
  ```

#### Task 4.4.2: Create MCP Types
- [x] **Subtask 4.4.2.1:** Create `src/lib/mcp/types.ts` with TypeScript interfaces for all MCP tool inputs/outputs

#### Task 4.4.3: Create MCP Server Startup Script
- [x] **Subtask 4.4.3.1:** Create `scripts/start-mcp-servers.ts`:
  ```typescript
  import { spawn } from 'child_process'
  import path from 'path'

  const servers = ['property-lookup', 'calendar', 'business-logic']

  console.log('Starting MCP servers...')

  for (const server of servers) {
    const serverPath = path.join(
      process.cwd(),
      'dist',
      'mcp',
      'servers',
      server,
      'index.js'
    )

    const proc = spawn('node', [serverPath], {
      stdio: 'inherit',
    })

    proc.on('error', (err) => {
      console.error(`Error starting ${server} server:`, err)
    })

    console.log(`Started ${server} MCP server`)
  }
  ```
- [x] **Subtask 4.4.3.2:** Add script to `package.json`:
  ```json
  {
    "scripts": {
      "mcp:start": "tsx scripts/start-mcp-servers.ts"
    }
  }
  ```

### Epic 4.5: LangGraph Agent - Conversation State Machine

#### Task 4.5.1: Define Conversation State
- [ ] **Subtask 4.5.1.1:** Create `src/lib/agents/state.ts`:
  ```typescript
  export interface ConversationState {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    tenant_id: string
    call_id: string

    // Customer info
    customer_phone?: string
    customer_name?: string
    customer_address?: {
      street: string
      city: string
      state: string
      zip: string
    }

    // Property data
    property_data?: {
      lot_size_sqft: number
      parcel_id: string
    }

    // Quote
    quote?: {
      price: number
      frequency: 'weekly' | 'biweekly'
      service_inclusions: string[]
    }

    // Booking
    chosen_time?: string
    booking?: {
      scheduled_at: string
      calendar_event_id: string
    }

    // State tracking
    stage: 'greeting' | 'address_collection' | 'property_lookup' | 'quoting' | 'booking' | 'closing'
    attempts: {
      address_extraction: number
      property_lookup: number
    }
  }
  ```

#### Task 4.5.2: Create LangGraph Nodes
Based on TAD Section 4.2.2 (LangGraph implementation):

- [ ] **Subtask 4.5.2.1:** Create `src/lib/agents/nodes/greeting.ts`:
  ```typescript
  import { ConversationState } from '../state'
  import { prisma } from '@/lib/prisma'

  export async function greetingNode(state: ConversationState): Promise<Partial<ConversationState>> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: state.tenant_id },
      select: { businessName: true },
    })

    return {
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: `Thanks for calling ${tenant?.businessName}! I can help you get a quote for lawn mowing service. What's your address?`,
        },
      ],
      stage: 'address_collection',
    }
  }
  ```

- [ ] **Subtask 4.5.2.2:** Create `src/lib/agents/nodes/address-extraction.ts`:
  - Use GPT-4 to extract address components from user message
  - Validate extracted address
  - Retry logic if unclear (max 3 attempts)

- [ ] **Subtask 4.5.2.3:** Create `src/lib/agents/nodes/property-lookup.ts`:
  ```typescript
  import { mcpClient } from '@/lib/mcp/client'
  import { ConversationState } from '../state'

  export async function propertyLookupNode(
    state: ConversationState
  ): Promise<Partial<ConversationState>> {
    if (!state.customer_address) {
      throw new Error('Address required for property lookup')
    }

    try {
      // Call MCP property lookup server via MCP client
      const propertyData = await mcpClient.callTool<{
        lot_size_sqft: number
        parcel_id: string
        address: string
        zoning: string
      }>(
        'property-lookup',
        'lookup_property',
        {
          street: state.customer_address.street,
          city: state.customer_address.city,
          state: state.customer_address.state,
          zip: state.customer_address.zip,
        }
      )

      return {
        property_data: {
          lot_size_sqft: propertyData.lot_size_sqft,
          parcel_id: propertyData.parcel_id,
        },
        stage: 'property_lookup',
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: `Great! I found your property. It's about ${propertyData.lot_size_sqft} square feet.`,
          },
        ],
      }
    } catch (error) {
      // Property not found - fallback to generic quote
      return {
        stage: 'quoting',
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: `I couldn't find the exact property details, but I can give you a general price range.`,
          },
        ],
      }
    }
  }
  ```
  - Handle "property not found" error
  - Fallback to generic quote if lookup fails

- [ ] **Subtask 4.5.2.4:** Create `src/lib/agents/nodes/quote-calculation.ts`:
  - Check service area first (MCP business logic tool)
  - If outside area: polite decline
  - If inside: call calculate_quote MCP tool
  - Generate friendly quote message

- [ ] **Subtask 4.5.2.5:** Create `src/lib/agents/nodes/booking.ts`:
  - Check if user wants to book (intent detection via LLM)
  - Get available slots (MCP calendar tool)
  - Present options to user
  - Extract chosen time from user response
  - Book appointment (MCP calendar tool)
  - Save to database (calls, leads, bookings tables)
  - Trigger SMS notifications

- [ ] **Subtask 4.5.2.6:** Create `src/lib/agents/nodes/closing.ts`:
  - Thank user
  - Confirm next steps
  - End conversation

#### Task 4.5.3: Create Conditional Edges
- [ ] **Subtask 4.5.3.1:** Create `src/lib/agents/edges/conditional-edges.ts`:
  - Address extracted? → property_lookup : retry_address
  - Property found? → quote_calculation : generic_quote
  - In service area? → quote_calculation : outside_area_decline
  - User wants booking? → get_available_slots : closing
  - Time chosen? → book_appointment : closing

#### Task 4.5.4: Build LangGraph Conversation Graph
- [ ] **Subtask 4.5.4.1:** Create `src/lib/agents/conversation-graph.ts`:
  ```typescript
  import { StateGraph } from '@langchain/langgraph'
  import { ConversationState } from './state'
  import { greetingNode } from './nodes/greeting'
  import { addressExtractionNode } from './nodes/address-extraction'
  import { propertyLookupNode } from './nodes/property-lookup'
  import { quoteCalculationNode } from './nodes/quote-calculation'
  import { bookingNode } from './nodes/booking'
  import { closingNode } from './nodes/closing'

  export function createConversationGraph(tenantId: string) {
    const graph = new StateGraph<ConversationState>({
      channels: {
        messages: { value: (x, y) => x.concat(y) },
        tenant_id: { value: (x, y) => y ?? x },
        call_id: { value: (x, y) => y ?? x },
        customer_phone: { value: (x, y) => y ?? x },
        customer_name: { value: (x, y) => y ?? x },
        customer_address: { value: (x, y) => y ?? x },
        property_data: { value: (x, y) => y ?? x },
        quote: { value: (x, y) => y ?? x },
        chosen_time: { value: (x, y) => y ?? x },
        booking: { value: (x, y) => y ?? x },
        stage: { value: (x, y) => y ?? x },
        attempts: { value: (x, y) => ({ ...x, ...y }) },
      },
    })

    // Add nodes
    graph.addNode('greet', greetingNode)
    graph.addNode('extract_address', addressExtractionNode)
    graph.addNode('lookup_property', propertyLookupNode)
    graph.addNode('calculate_quote', quoteCalculationNode)
    graph.addNode('booking', bookingNode)
    graph.addNode('closing', closingNode)

    // Add edges (from TAD lines 758-770)
    graph.addEdge('greet', 'extract_address')
    graph.addConditionalEdges('extract_address', (state) => {
      return state.customer_address ? 'lookup_property' : 'extract_address'
    })
    graph.addEdge('lookup_property', 'calculate_quote')
    graph.addConditionalEdges('calculate_quote', (state) => {
      // Check if user showed interest in booking
      return state.stage === 'booking' ? 'booking' : 'closing'
    })
    graph.addEdge('booking', 'closing')

    graph.setEntryPoint('greet')

    return graph.compile()
  }
  ```

#### Task 4.5.5: Create VAPI Custom LLM Endpoint
- [ ] **Subtask 4.5.5.1:** Create `src/app/api/vapi-llm/route.ts`:
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { createConversationGraph } from '@/lib/agents/conversation-graph'
  import { prisma } from '@/lib/prisma'

  export async function POST(req: NextRequest) {
    try {
      const { messages, metadata } = await req.json()
      const { call_id, phone_number_called } = metadata

      // Get tenant from phone number
      const tenant = await prisma.tenant.findUnique({
        where: { phoneNumber: phone_number_called },
      })

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }

      // Create or retrieve conversation state
      const graph = createConversationGraph(tenant.id)

      // Run graph
      const result = await graph.invoke({
        messages,
        tenant_id: tenant.id,
        call_id,
        stage: 'greeting',
        attempts: { address_extraction: 0, property_lookup: 0 },
      })

      // Return response in VAPI format
      return NextResponse.json({
        message: result.messages[result.messages.length - 1].content,
        metadata: {
          stage: result.stage,
          quote: result.quote,
          booking: result.booking,
        },
      })
    } catch (error) {
      console.error('LangGraph error:', error)
      return NextResponse.json(
        { message: "I'm sorry, I'm having technical difficulties. Let me transfer you to our team." },
        { status: 500 }
      )
    }
  }
  ```

#### Task 4.5.6: Test LangGraph Agent Locally
- [ ] **Subtask 4.5.6.1:** Create test script: `src/lib/agents/__tests__/conversation-graph.test.ts`
- [ ] **Subtask 4.5.6.2:** Test full conversation flow:
  - Greeting → Address → Property Lookup → Quote → Booking
  - Handle edge cases: address not found, outside service area, user declines

---

## Phase 5: Voice Infrastructure Integration

**Goal:** Integrate VAPI webhooks, handle call lifecycle, store recordings, send SMS notifications.

### Epic 5.1: VAPI Integration

#### Task 5.1.1: Configure VAPI Agent
- [ ] **Subtask 5.1.1.1:** Create VAPI agent via API or dashboard for first tenant
- [ ] **Subtask 5.1.1.2:** Configure agent to use custom LLM endpoint: `https://yourapp.vercel.app/api/vapi-llm`
- [ ] **Subtask 5.1.1.3:** Set up webhook URL in VAPI: `https://yourapp.vercel.app/api/webhooks/vapi`
- [ ] **Subtask 5.1.1.4:** Configure voice settings (ElevenLabs Turbo v2, Deepgram Nova 2)

#### Task 5.1.2: Create VAPI Client
- [ ] **Subtask 5.1.2.1:** Enhance `src/lib/vapi/client.ts`:
  ```typescript
  import axios from 'axios'

  const VAPI_API_KEY = process.env.VAPI_API_KEY!
  const VAPI_BASE_URL = 'https://api.vapi.ai'

  export async function createAgent(config: {
    name: string
    model: { provider: 'custom'; url: string }
    voice: { provider: 'elevenlabs'; voiceId: string }
    transcriber: { provider: 'deepgram'; model: 'nova-2' }
  }) {
    const response = await axios.post(
      `${VAPI_BASE_URL}/agents`,
      config,
      { headers: { Authorization: `Bearer ${VAPI_API_KEY}` } }
    )
    return response.data
  }

  export async function provisionPhoneNumber(areaCode?: string) {
    const response = await axios.post(
      `${VAPI_BASE_URL}/phone-numbers`,
      { areaCode },
      { headers: { Authorization: `Bearer ${VAPI_API_KEY}` } }
    )
    return response.data
  }

  export async function linkPhoneToAgent(phoneNumberId: string, agentId: string) {
    await axios.patch(
      `${VAPI_BASE_URL}/phone-numbers/${phoneNumberId}`,
      { agentId },
      { headers: { Authorization: `Bearer ${VAPI_API_KEY}` } }
    )
  }
  ```

#### Task 5.1.3: Create VAPI Webhook Handler
- [ ] **Subtask 5.1.3.1:** Create `src/lib/vapi/webhooks.ts` with event type definitions
- [ ] **Subtask 5.1.3.2:** Create `src/app/api/webhooks/vapi/route.ts`:
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { prisma } from '@/lib/prisma'
  import { uploadRecording } from '@/lib/supabase/storage'

  export async function POST(req: NextRequest) {
    try {
      const event = await req.json()

      // Verify webhook signature (if VAPI supports it)
      const signature = req.headers.get('x-vapi-signature')
      // ... verify signature

      // Log webhook
      await prisma.webhook.create({
        data: {
          source: 'vapi',
          eventType: event.type,
          payload: event,
          headers: Object.fromEntries(req.headers.entries()),
        },
      })

      switch (event.type) {
        case 'call.started':
          await handleCallStarted(event)
          break
        case 'call.ended':
          await handleCallEnded(event)
          break
        case 'transcript.updated':
          await handleTranscriptUpdated(event)
          break
        default:
          console.log('Unhandled VAPI event:', event.type)
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      console.error('VAPI webhook error:', error)
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
  }

  async function handleCallStarted(event: any) {
    const tenant = await prisma.tenant.findUnique({
      where: { vapiPhoneNumberId: event.phoneNumberId },
    })

    await prisma.call.create({
      data: {
        tenantId: tenant!.id,
        vapiCallId: event.callId,
        phoneNumberCalled: event.to,
        callerPhoneNumber: event.from,
        startedAt: new Date(event.timestamp),
        status: 'in-progress',
      },
    })
  }

  async function handleCallEnded(event: any) {
    const call = await prisma.call.findUnique({
      where: { vapiCallId: event.callId },
    })

    if (!call) return

    // Download and upload recording to Supabase Storage
    let recordingUrl = null
    if (event.recordingUrl) {
      recordingUrl = await uploadRecording(event.callId, event.recordingUrl)
    }

    await prisma.call.update({
      where: { id: call.id },
      data: {
        endedAt: new Date(event.timestamp),
        durationSeconds: event.duration,
        status: 'completed',
        endReason: event.endReason,
        transcript: event.transcript,
        transcriptText: event.transcript.map(m => m.content).join('\n'),
        recordingUrl,
        recordingDuration: event.duration,
        costTotal: event.cost.total,
        costBreakdown: event.cost.breakdown,
      },
    })
  }
  ```

### Epic 5.2: Call & Lead Management

#### Task 5.2.1: Implement Call Router
- [ ] **Subtask 5.2.1.1:** Implement `src/lib/trpc/routers/call.ts`:
  ```typescript
  import { router, protectedProcedure } from '../server'
  import { z } from 'zod'

  export const callRouter = router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        const calls = await ctx.prisma.call.findMany({
          where: { tenantId: ctx.tenantId! },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
          include: {
            lead: true,
            booking: true,
          },
        })

        const total = await ctx.prisma.call.count({
          where: { tenantId: ctx.tenantId! },
        })

        return { calls, total }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return await ctx.prisma.call.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId! },
          include: {
            lead: true,
            booking: true,
          },
        })
      }),
  })
  ```

#### Task 5.2.2: Implement Lead Router
- [ ] **Subtask 5.2.2.1:** Implement `src/lib/trpc/routers/lead.ts` with CRUD operations
- [ ] **Subtask 5.2.2.2:** Add `updateStatus` procedure
- [ ] **Subtask 5.2.2.3:** Add `addNote` procedure

#### Task 5.2.3: Implement Booking Router
- [ ] **Subtask 5.2.3.1:** Implement `src/lib/trpc/routers/booking.ts`
- [ ] **Subtask 5.2.3.2:** Add `list`, `getById`, `cancel` procedures

### Epic 5.3: SMS Notifications (Twilio)

#### Task 5.3.1: Set Up Twilio
- [ ] **Subtask 5.3.1.1:** Create Twilio account and get API credentials
- [ ] **Subtask 5.3.1.2:** Add Twilio credentials to `.env.local`:
  ```bash
  TWILIO_ACCOUNT_SID="AC..."
  TWILIO_AUTH_TOKEN="..."
  TWILIO_PHONE_NUMBER="+1234567890" # Your Twilio number for sending SMS
  ```
- [ ] **Subtask 5.3.1.3:** Install Twilio SDK: `npm install twilio`

#### Task 5.3.2: Create SMS Service
- [ ] **Subtask 5.3.2.1:** Create `src/lib/twilio/sms.ts`:
  ```typescript
  import twilio from 'twilio'
  import { prisma } from '@/lib/prisma'

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  export async function sendSMS(params: {
    to: string
    body: string
    tenantId: string
    callId?: string
    bookingId?: string
  }) {
    try {
      const message = await client.messages.create({
        to: params.to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: params.body,
      })

      // Log notification
      await prisma.notification.create({
        data: {
          tenantId: params.tenantId,
          callId: params.callId,
          bookingId: params.bookingId,
          type: 'sms',
          template: 'booking_confirmation',
          recipient: params.to,
          body: params.body,
          status: 'sent',
          provider: 'twilio',
          providerMessageId: message.sid,
          sentAt: new Date(),
        },
      })

      return message
    } catch (error) {
      console.error('SMS send error:', error)

      // Log failed notification
      await prisma.notification.create({
        data: {
          tenantId: params.tenantId,
          callId: params.callId,
          bookingId: params.bookingId,
          type: 'sms',
          recipient: params.to,
          body: params.body,
          status: 'failed',
          provider: 'twilio',
          errorMessage: error.message,
        },
      })

      throw error
    }
  }

  export async function sendBookingConfirmation(booking: {
    customerPhone: string
    customerName: string
    scheduledAt: Date
    tenantBusinessName: string
  }) {
    const body = `Hi ${booking.customerName}, your lawn mowing appointment with ${booking.tenantBusinessName} is confirmed for ${booking.scheduledAt.toLocaleString()}. We'll see you then!`

    await sendSMS({
      to: booking.customerPhone,
      body,
      tenantId: booking.tenantId,
      bookingId: booking.id,
    })
  }

  export async function sendNewLeadAlert(params: {
    ownerPhone: string
    leadName: string
    leadAddress: string
    quote: number
    tenantId: string
    callId: string
  }) {
    const body = `New lead: ${params.leadName} at ${params.leadAddress}. Quote: $${params.quote}. Check your dashboard for details.`

    await sendSMS({
      to: params.ownerPhone,
      body,
      tenantId: params.tenantId,
      callId: params.callId,
    })
  }
  ```

#### Task 5.3.3: Integrate SMS into Booking Flow
- [ ] **Subtask 5.3.3.1:** Update `booking.ts` node in LangGraph to call `sendBookingConfirmation` after successful booking
- [ ] **Subtask 5.3.3.2:** Call `sendNewLeadAlert` when lead is captured
- [ ] **Subtask 5.3.3.3:** Respect tenant notification preferences (`notificationPreferences` JSON field)

### Epic 5.4: Supabase Storage Integration

#### Task 5.4.1: Create Storage Utilities
- [ ] **Subtask 5.4.1.1:** Create `src/lib/supabase/storage.ts`:
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  import axios from 'axios'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side
  )

  export async function uploadRecording(callId: string, recordingUrl: string): Promise<string> {
    // Download recording from VAPI
    const response = await axios.get(recordingUrl, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data)

    // Upload to Supabase Storage
    const fileName = `${callId}.mp3`
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .upload(fileName, buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (error) throw error

    // Get signed URL (valid for 1 year)
    const { data: signedData } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365)

    return signedData!.signedUrl
  }

  export async function getRecordingUrl(callId: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(`${callId}.mp3`, 60 * 60) // 1 hour validity

    return data?.signedUrl || null
  }
  ```

#### Task 5.4.2: Set Up Storage Bucket RLS
- [ ] **Subtask 5.4.2.1:** Create RLS policy for `call-recordings` bucket in Supabase dashboard:
  ```sql
  -- Allow authenticated users to read recordings for their tenant's calls
  CREATE POLICY "Tenant can read own recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-recordings' AND
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.vapi_call_id = (storage.objects.name)
      AND calls.tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    )
  );
  ```

---

## Phase 6: Dashboard & Analytics

**Goal:** Build the tenant dashboard with calls, leads, bookings, and analytics.

### Epic 6.1: Dashboard Pages

#### Task 6.1.1: Dashboard Home Page
- [ ] **Subtask 6.1.1.1:** Create `src/app/(dashboard)/page.tsx`:
  - Overview cards: Total Calls (today), Leads Captured, Bookings Made, Conversion Rate
  - Recent calls list (last 10)
  - Quick actions: "View All Calls", "Manage Leads"
- [ ] **Subtask 6.1.1.2:** Create `src/components/dashboard/metrics-card.tsx` (reusable metric display)
- [ ] **Subtask 6.1.1.3:** Fetch data using tRPC `analytics.getDashboardMetrics` procedure

#### Task 6.1.2: Calls Page
- [ ] **Subtask 6.1.2.1:** Create `src/app/(dashboard)/calls/page.tsx`:
  - Call list table with columns: Date/Time, Caller, Duration, Outcome, Quote, Actions
  - Filters: Date range, Outcome (quote_given, booking_made, etc.)
  - Pagination
  - Search by phone number
- [ ] **Subtask 6.1.2.2:** Create `src/components/dashboard/call-list.tsx`
- [ ] **Subtask 6.1.2.3:** Use tRPC `call.list` query

#### Task 6.1.3: Call Detail Page
- [ ] **Subtask 6.1.3.1:** Create `src/app/(dashboard)/calls/[id]/page.tsx`:
  - Call metadata (date, duration, caller)
  - Full transcript (formatted conversation)
  - Audio player for recording
  - Associated lead/booking info
  - Actions: "Create Lead", "Book Appointment" (if not done)
- [ ] **Subtask 6.1.3.2:** Create `src/components/dashboard/call-transcript.tsx`
- [ ] **Subtask 6.1.3.3:** Create `src/components/dashboard/audio-player.tsx` (uses Supabase signed URL)

#### Task 6.1.4: Leads Page
- [ ] **Subtask 6.1.4.1:** Create `src/app/(dashboard)/leads/page.tsx`:
  - Lead cards/table: Name, Address, Phone, Quote, Status, Date
  - Filters: Status (new, contacted, quoted, booked, lost)
  - Search by name, address, phone
- [ ] **Subtask 6.1.4.2:** Create `src/components/dashboard/lead-card.tsx`
- [ ] **Subtask 6.1.4.3:** Add inline status update (dropdown)
- [ ] **Subtask 6.1.4.4:** Add notes section

#### Task 6.1.5: Bookings Page
- [ ] **Subtask 6.1.5.1:** Create `src/app/(dashboard)/bookings/page.tsx`:
  - Calendar view of upcoming appointments
  - List view with: Customer, Address, Date/Time, Status, Actions
  - Filter: Upcoming, Completed, Canceled
- [ ] **Subtask 6.1.5.2:** Create `src/components/dashboard/booking-calendar.tsx` (use shadcn calendar)
- [ ] **Subtask 6.1.5.3:** Add "Cancel Appointment" action (calls Google Calendar API)

#### Task 6.1.6: Analytics Page
- [ ] **Subtask 6.1.6.1:** Create `src/app/(dashboard)/analytics/page.tsx`:
  - Date range selector
  - Charts:
    - Calls over time (line chart)
    - Call outcomes (pie chart)
    - Quote-to-booking conversion (funnel)
    - Average quote amount (stat)
  - Cost tracking: Total spend on VAPI
- [ ] **Subtask 6.1.6.2:** Install chart library: `npm install recharts`
- [ ] **Subtask 6.1.6.3:** Create `src/components/dashboard/charts/` with reusable chart components
- [ ] **Subtask 6.1.6.4:** Implement `analytics.getMetrics` tRPC procedure

### Epic 6.2: Real-time Updates

#### Task 6.2.1: Set Up Supabase Realtime Subscriptions
- [ ] **Subtask 6.2.1.1:** Create `src/lib/hooks/use-realtime.ts`:
  ```typescript
  import { useEffect } from 'react'
  import { createClient } from '@/lib/supabase/client'
  import { useQueryClient } from '@tanstack/react-query'

  export function useRealtimeCalls(tenantId: string) {
    const queryClient = useQueryClient()
    const supabase = createClient()

    useEffect(() => {
      const channel = supabase
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
            // Invalidate calls query to refetch
            queryClient.invalidateQueries(['call', 'list'])

            // Show toast notification
            toast.success('New call received!')
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }, [tenantId])
  }
  ```

- [ ] **Subtask 6.2.1.2:** Use `useRealtimeCalls` hook in calls page and dashboard home

### Epic 6.3: Analytics Router Implementation

#### Task 6.3.1: Implement Analytics Procedures
- [ ] **Subtask 6.3.1.1:** Implement `src/lib/trpc/routers/analytics.ts`:
  ```typescript
  import { router, protectedProcedure } from '../server'
  import { z } from 'zod'

  export const analyticsRouter = router({
    getDashboardMetrics: protectedProcedure
      .query(async ({ ctx }) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [callsToday, totalLeads, totalBookings, avgDuration] = await Promise.all([
          ctx.prisma.call.count({
            where: { tenantId: ctx.tenantId!, createdAt: { gte: today } },
          }),
          ctx.prisma.lead.count({
            where: { tenantId: ctx.tenantId! },
          }),
          ctx.prisma.booking.count({
            where: { tenantId: ctx.tenantId! },
          }),
          ctx.prisma.call.aggregate({
            where: { tenantId: ctx.tenantId! },
            _avg: { durationSeconds: true },
          }),
        ])

        return {
          callsToday,
          totalLeads,
          totalBookings,
          avgDuration: avgDuration._avg.durationSeconds || 0,
        }
      }),

    getMetrics: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        // Fetch analytics_daily records
        const dailyMetrics = await ctx.prisma.analyticsDaily.findMany({
          where: {
            tenantId: ctx.tenantId!,
            date: {
              gte: input.startDate,
              lte: input.endDate,
            },
          },
          orderBy: { date: 'asc' },
        })

        // Fetch call outcomes breakdown
        const outcomes = await ctx.prisma.call.groupBy({
          by: ['outcome'],
          where: {
            tenantId: ctx.tenantId!,
            createdAt: {
              gte: input.startDate,
              lte: input.endDate,
            },
          },
          _count: true,
        })

        return {
          dailyMetrics,
          outcomes,
        }
      }),
  })
  ```

#### Task 6.3.2: Create Daily Analytics Aggregation Job
- [ ] **Subtask 6.3.2.1:** Create `src/lib/jobs/aggregate-analytics.ts`:
  ```typescript
  import { prisma } from '@/lib/prisma'

  export async function aggregateDailyAnalytics(date: Date) {
    const tenants = await prisma.tenant.findMany({ where: { status: 'active' } })

    for (const tenant of tenants) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const calls = await prisma.call.findMany({
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      })

      const totalCalls = calls.length
      const successfulCalls = calls.filter(c => c.status === 'completed').length
      const failedCalls = calls.filter(c => c.status === 'failed').length
      const quotesGiven = calls.filter(c => c.outcome === 'quote_given').length
      const bookingsMade = calls.filter(c => c.bookingMade).length
      const leadsCaptured = calls.filter(c => c.leadCaptured).length
      const avgDuration = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / totalCalls || 0
      const totalCost = calls.reduce((sum, c) => sum + (parseFloat(c.costTotal as any) || 0), 0)

      await prisma.analyticsDaily.upsert({
        where: {
          date_tenantId: {
            date: startOfDay,
            tenantId: tenant.id,
          },
        },
        update: {
          totalCalls,
          successfulCalls,
          failedCalls,
          quotesGiven,
          bookingsMade,
          leadsCaptured,
          avgCallDurationSeconds: Math.round(avgDuration),
          quoteToBookingRate: quotesGiven > 0 ? (bookingsMade / quotesGiven) * 100 : 0,
          totalCost,
          avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
        },
        create: {
          tenantId: tenant.id,
          date: startOfDay,
          totalCalls,
          successfulCalls,
          failedCalls,
          quotesGiven,
          bookingsMade,
          leadsCaptured,
          avgCallDurationSeconds: Math.round(avgDuration),
          quoteToBookingRate: quotesGiven > 0 ? (bookingsMade / quotesGiven) * 100 : 0,
          totalCost,
          avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
        },
      })
    }
  }
  ```

- [ ] **Subtask 6.3.2.2:** Create API route for cron job: `src/app/api/cron/aggregate-analytics/route.ts`
- [ ] **Subtask 6.3.2.3:** Set up Vercel Cron Job (or use external cron service) to run daily at 1am

---

## Phase 7: Billing & Deployment

**Goal:** Integrate Stripe for subscriptions, prepare for production deployment.

### Epic 7.1: Stripe Integration

#### Task 7.1.1: Create Stripe Client
- [ ] **Subtask 7.1.1.1:** Create `src/lib/stripe/client.ts`:
  ```typescript
  import Stripe from 'stripe'

  export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  })
  ```

#### Task 7.1.2: Create Stripe Products & Prices
- [ ] **Subtask 7.1.2.1:** Via Stripe Dashboard or API, create:
  - Product: "GreenAcre AI - Starter Plan"
  - Price: $99/month (recurring)
  - Trial period: 14 days
- [ ] **Subtask 7.1.2.2:** Add price ID to `.env.local`: `STRIPE_PRICE_ID_STARTER="price_..."`

#### Task 7.1.3: Implement Subscription Flow
- [ ] **Subtask 7.1.3.1:** Create tRPC procedure `tenant.createCheckoutSession`:
  ```typescript
  createCheckoutSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId! },
      })

      let customerId = tenant?.stripeCustomerId

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: tenant!.email,
          metadata: { tenantId: tenant!.id },
        })
        customerId = customer.id

        await ctx.prisma.tenant.update({
          where: { id: ctx.tenantId! },
          data: { stripeCustomerId: customerId },
        })
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID_STARTER,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?subscription=canceled`,
        subscription_data: {
          trial_period_days: 14,
        },
      })

      return { url: session.url }
    })
  ```

#### Task 7.1.4: Create Stripe Webhook Handler
- [ ] **Subtask 7.1.4.1:** Create `src/lib/stripe/webhooks.ts` with event handlers
- [ ] **Subtask 7.1.4.2:** Create `src/app/api/webhooks/stripe/route.ts`:
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { stripe } from '@/lib/stripe/client'
  import { prisma } from '@/lib/prisma'

  export async function POST(req: NextRequest) {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Log webhook
    await prisma.webhook.create({
      data: {
        source: 'stripe',
        eventType: event.type,
        payload: event.data.object,
      },
    })

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log('Unhandled Stripe event:', event.type)
    }

    return NextResponse.json({ received: true })
  }

  async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    await prisma.tenant.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    })
  }

  async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    await prisma.tenant.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionStatus: 'canceled',
        status: 'suspended', // Suspend tenant access
      },
    })
  }

  async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string

    await prisma.tenant.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionStatus: 'past_due',
      },
    })

    // TODO: Send email notification to tenant
  }
  ```

#### Task 7.1.5: Create Billing Settings Page
- [ ] **Subtask 7.1.5.1:** Create `src/app/(dashboard)/settings/billing/page.tsx`:
  - Display current plan (Starter, Trial ends on X)
  - Subscription status
  - "Manage Subscription" button → Stripe Customer Portal
  - Payment method info
  - Invoice history
- [ ] **Subtask 7.1.5.2:** Implement `tenant.createPortalSession` tRPC procedure:
  ```typescript
  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId! },
      })

      const session = await stripe.billingPortal.sessions.create({
        customer: tenant!.stripeCustomerId!,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      })

      return { url: session.url }
    })
  ```

### Epic 7.2: Production Readiness

#### Task 7.2.1: Error Tracking with Sentry
- [ ] **Subtask 7.2.1.1:** Verify Sentry is initialized in `src/app/layout.tsx`
- [ ] **Subtask 7.2.1.2:** Add error boundaries to critical components
- [ ] **Subtask 7.2.1.3:** Test error reporting in development

#### Task 7.2.2: Environment Variable Validation
- [ ] **Subtask 7.2.2.1:** Enhance `src/lib/env.ts` to validate ALL required env vars at build time
- [ ] **Subtask 7.2.2.2:** Add to `next.config.js`:
  ```javascript
  const { env } = require('./src/lib/env')

  module.exports = {
    // ... other config
    env: {
      VALIDATED: 'true', // Flag to indicate env validation ran
    },
  }
  ```

#### Task 7.2.3: Security Checks
- [ ] **Subtask 7.2.3.1:** Verify all API routes check authentication
- [ ] **Subtask 7.2.3.2:** Verify RLS policies are enabled on all tables
- [ ] **Subtask 7.2.3.3:** Verify webhook signature validation (VAPI, Stripe)
- [ ] **Subtask 7.2.3.4:** Verify sensitive data is encrypted (Google tokens)
- [ ] **Subtask 7.2.3.5:** Run security audit: `npm audit`

#### Task 7.2.4: Performance Optimization
- [ ] **Subtask 7.2.4.1:** Add database indexes for common queries (already in schema)
- [ ] **Subtask 7.2.4.2:** Enable React Query caching with appropriate stale times
- [ ] **Subtask 7.2.4.3:** Optimize images with Next.js Image component
- [ ] **Subtask 7.2.4.4:** Enable Next.js bundle analyzer: `npm install @next/bundle-analyzer`

#### Task 7.2.5: Testing
- [ ] **Subtask 7.2.5.1:** Install testing libraries:
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- [ ] **Subtask 7.2.5.2:** Create `jest.config.js`
- [ ] **Subtask 7.2.5.3:** Write unit tests for critical functions:
  - MCP tool handlers
  - Pricing calculation logic
  - Address extraction
- [ ] **Subtask 7.2.5.4:** Write integration tests for tRPC routers
- [ ] **Subtask 7.2.5.5:** Create E2E test for onboarding flow (Playwright):
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```

### Epic 7.3: Deployment

#### Task 7.3.1: Configure Vercel Environment Variables
- [ ] **Subtask 7.3.1.1:** In Vercel dashboard, add all production environment variables
- [ ] **Subtask 7.3.1.2:** Update URLs to production domains (NEXT_PUBLIC_APP_URL, redirect URIs)
- [ ] **Subtask 7.3.1.3:** Generate new secrets for production (NEXTAUTH_SECRET, ENCRYPTION_KEY)

#### Task 7.3.2: Database Migration to Production
- [ ] **Subtask 7.3.2.1:** Create production Supabase project
- [ ] **Subtask 7.3.2.2:** Run Prisma migrations: `npx prisma migrate deploy`
- [ ] **Subtask 7.3.2.3:** Apply custom SQL migrations (functions, RLS policies)
- [ ] **Subtask 7.3.2.4:** Seed production database with pricing templates

#### Task 7.3.3: Configure External Services for Production
- [ ] **Subtask 7.3.3.1:** Update VAPI webhook URL to production domain
- [ ] **Subtask 7.3.3.2:** Update Stripe webhook URL to production domain
- [ ] **Subtask 7.3.3.3:** Update Google OAuth redirect URIs to production domain
- [ ] **Subtask 7.3.3.4:** Test each webhook endpoint with test events

#### Task 7.3.4: Deploy to Vercel
- [ ] **Subtask 7.3.4.1:** Push to `main` branch to trigger production deployment
- [ ] **Subtask 7.3.4.2:** Monitor deployment logs for errors
- [ ] **Subtask 7.3.4.3:** Verify build succeeds and site is accessible
- [ ] **Subtask 7.3.4.4:** Set up custom domain (if applicable)

#### Task 7.3.5: Post-Deployment Verification
- [ ] **Subtask 7.3.5.1:** Test signup flow end-to-end
- [ ] **Subtask 7.3.5.2:** Test onboarding flow (all 5 steps)
- [ ] **Subtask 7.3.5.3:** Make test call to provisioned VAPI number
- [ ] **Subtask 7.3.5.4:** Verify call appears in dashboard
- [ ] **Subtask 7.3.5.5:** Verify recording is accessible
- [ ] **Subtask 7.3.5.6:** Test booking flow and Google Calendar sync
- [ ] **Subtask 7.3.5.7:** Verify SMS notifications are sent
- [ ] **Subtask 7.3.5.8:** Test Stripe subscription flow (use test card)

#### Task 7.3.6: Monitoring & Alerts
- [ ] **Subtask 7.3.6.1:** Set up Sentry alerts for critical errors
- [ ] **Subtask 7.3.6.2:** Set up Vercel alerts for:
  - Deployment failures
  - Function errors
  - High response times
- [ ] **Subtask 7.3.6.3:** Set up Supabase alerts for database issues
- [ ] **Subtask 7.3.6.4:** Create uptime monitoring (UptimeRobot or similar)

---

## Appendix A: Dependency Reference

### Complete package.json

```json
{
  "name": "greenacre-ai",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node prisma/seed.ts",
    "types:supabase": "supabase gen types typescript --project-id <project-id> > src/types/database.types.ts",
    "test": "jest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@trpc/server": "^10.45.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@tanstack/react-query": "^5.28.0",
    "@supabase/supabase-js": "^2.39.0",
    "prisma": "^5.10.0",
    "@prisma/client": "^5.10.0",
    "zod": "^3.22.0",
    "zustand": "^4.5.0",
    "stripe": "^14.0.0",
    "@langchain/langgraph": "^0.0.15",
    "@langchain/openai": "^0.0.25",
    "@langchain/core": "^0.1.52",
    "@modelcontextprotocol/sdk": "^0.5.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.4",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "lucide-react": "^0.344.0",
    "superjson": "^2.2.1",
    "axios": "^1.6.7",
    "twilio": "^4.23.0",
    "googleapis": "^134.0.0",
    "recharts": "^2.12.2",
    "@sentry/nextjs": "^7.105.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@types/react": "^18.2.61",
    "@types/react-dom": "^18.2.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.5",
    "ts-node": "^10.9.2",
    "@testing-library/react": "^14.2.1",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/user-event": "^14.5.2",
    "jest": "^29.7.0",
    "@playwright/test": "^1.42.1",
    "@next/bundle-analyzer": "^14.2.0"
  }
}
```

---

## Appendix B: Critical Paths & Dependencies

### Phase Dependencies

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
   ↓         ↓         ↓         ↓         ↓         ↓         ↓         ↓
  Setup    Database   App      Tenant   AI Agent  Voice Int  Dashboard Billing
           + Auth    Skeleton  Mgmt     (Core)                         + Deploy
```

**Critical Path:**
1. Phase 0 (must complete all external service setups)
2. Phase 1 (database schema is foundation)
3. Phase 4 Epic 4.1-4.3 (MCP servers MUST be built before LangGraph)
4. Phase 4 Epic 4.4-4.5 (LangGraph depends on MCP)
5. Phase 5 Epic 5.1 (VAPI integration depends on LangGraph endpoint)

**Parallel Work Opportunities:**
- Phase 2 (UI components) can be built in parallel with Phase 1 (database)
- Phase 3 (onboarding) can be built in parallel with Phase 4 (AI agent) - just stub out AI parts
- Phase 6 (dashboard) can start once Phase 5 Epic 5.2 (call/lead routers) is done

---

## Appendix C: Testing Strategy

### Unit Tests
- **MCP Tool Handlers:** Mock external APIs (Regrid, Google Calendar)
- **Database Functions:** Test pricing calculation, service area validation
- **Utility Functions:** Encryption, formatting, validation

### Integration Tests
- **tRPC Routers:** Test each procedure with mock database
- **LangGraph Nodes:** Test each node in isolation
- **Webhooks:** Test with sample payloads

### E2E Tests (Playwright)
- **Onboarding Flow:** Sign up → Configure → Connect Calendar → Provision Phone → Test Call
- **Call Processing:** Webhook received → Database updated → Dashboard updated
- **Booking Flow:** Lead creation → Booking → Google Calendar event → SMS sent

---

## Appendix D: Rollout Plan

### MVP Launch (Target: 10 Beta Tenants)

**Week 1-2: Phase 0-1**
- Infrastructure setup
- Database schema
- Auth layer

**Week 3-4: Phase 2-3**
- App skeleton
- Onboarding flow

**Week 5-6: Phase 4** (CRITICAL)
- MCP servers
- LangGraph agent
- Extensive testing

**Week 7: Phase 5**
- VAPI integration
- Webhook handling
- SMS notifications

**Week 8: Phase 6**
- Dashboard
- Analytics

**Week 9: Phase 7**
- Billing
- Production deployment
- Beta testing

**Week 10: Refinement & Beta Feedback**

---

## Completion Checklist

At the end of each phase, verify:

- [ ] All subtasks completed
- [ ] Code committed to Git
- [ ] Tests written and passing
- [ ] Documentation updated (README, comments)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables documented
- [ ] Deployment successful (if applicable)

---

## Notes for AI Agent Execution

When implementing this plan:

1. **Strictly follow the technology stack** - no deviations
2. **Complete tasks sequentially** - don't skip ahead
3. **Test after each epic** - don't accumulate technical debt
4. **Ask for clarification** if requirements are ambiguous
5. **Flag blockers immediately** - don't proceed if stuck
6. **Update this plan** if you discover missing steps

**Communication Format:**
- Start each subtask with: `[Phase X.Y.Z] Subtask: <description>`
- End each subtask with: `✅ Completed` or `⚠️ Blocked: <reason>`

---

**END OF IMPLEMENTATION PLAN**

This plan is now ready to be executed step-by-step by an AI coding agent. Each subtask is atomic and actionable. Good luck! 🚀
