# GreenAcre AI

Enterprise-Grade Multi-Tenant Voice AI Platform for Lawn Care Service Businesses

## Overview

GreenAcre AI is a sophisticated voice AI platform that enables lawn care service companies to automate customer interactions through natural voice conversations. The platform handles appointment scheduling, property information lookup, service quotations, and customer relationship management through an intelligent conversational agent.

## Key Features

- **Voice-First Customer Interaction**: Natural voice conversations powered by VAPI (Speech-to-Text/Text-to-Speech)
- **Custom LangGraph Agent**: Advanced conversation management with context-aware routing
- **MCP Tool Integration**: Modular tool architecture using Model Context Protocol
- **Multi-Tenant Architecture**: Secure tenant isolation with Row-Level Security
- **Property Intelligence**: Automated property data lookup via Regrid API
- **Calendar Management**: Google Calendar integration for appointment scheduling
- **Real-Time Analytics**: Comprehensive dashboard with call metrics and insights
- **Enterprise Security**: SOC 2 compliant with RBAC and audit logging

## Technology Stack

### Core Framework
- **Next.js 14** (App Router)
- **TypeScript**
- **React 18**

### Backend & Database
- **Supabase** (PostgreSQL, Auth, Storage)
- **Prisma ORM**
- **tRPC** (Type-safe API layer)

### AI & Voice
- **VAPI** (Voice infrastructure - STT/TTS)
- **Custom LangGraph Agent** (Conversation logic)
- **OpenAI GPT-4o** (LLM)
- **MCP Protocol** (Tool integration)

### External Integrations
- **Regrid API** (Property data)
- **Google Calendar API** (Scheduling)
- **Stripe** (Billing)
- **Sentry** (Error tracking)

### UI/UX
- **Tailwind CSS**
- **shadcn/ui**
- **Radix UI**

### Deployment
- **Vercel** (Hosting)
- **GitHub Actions** (CI/CD)

## Project Structure

```
GreenAcreAI/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── lib/
│   │   ├── agents/             # LangGraph conversation agent
│   │   ├── mcp/                # MCP servers and client
│   │   ├── supabase/           # Supabase client & utilities
│   │   └── trpc/               # tRPC routers
│   └── components/             # React components
├── prisma/                     # Database schema
├── scripts/                    # Build and deployment scripts
└── Docs/                       # Architecture documentation
```

## Architecture Highlights

### MCP (Model Context Protocol) Integration

This project uses **true MCP architecture** with standalone servers running as separate processes:

- **Property Lookup Server**: Regrid API integration for property data
- **Calendar Server**: Google Calendar integration for scheduling
- **Business Logic Server**: Quote calculation and service validation

Each MCP server runs as an isolated Node.js process, communicating via stdio transport. The LangGraph agent spawns these servers as needed using an MCP client.

See [MCP_ARCHITECTURE_CLARIFICATION.md](./MCP_ARCHITECTURE_CLARIFICATION.md) for detailed architecture.

### Multi-Tenant Security

- PostgreSQL Row-Level Security (RLS) policies
- Tenant-scoped data access
- JWT-based authentication
- Role-Based Access Control (RBAC)

### Conversation Flow

1. Customer calls business phone number
2. VAPI handles speech-to-text conversion
3. Custom LangGraph agent processes conversation:
   - Address collection
   - Property lookup via MCP
   - Service area validation
   - Appointment scheduling
   - Quote generation
4. VAPI converts agent response to speech
5. All interactions logged to Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- VAPI account
- Google Cloud project (for Calendar API)
- Regrid API key
- OpenAI API key

### Installation

```bash
# Clone repository
git clone https://github.com/anishma/GreenAcreAI.git
cd GreenAcreAI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npx prisma migrate dev

# Build MCP servers
npm run build:mcp

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the dashboard.

## Documentation

- [Technical Architecture Document](./Docs/technical-architecture.md)
- [Implementation Plan](./implementation_plan.md)
- [MCP Architecture Clarification](./MCP_ARCHITECTURE_CLARIFICATION.md)

## Development Workflow

### Running MCP Servers in Development

```bash
# Terminal 1: Build and watch MCP servers
npm run build:mcp -- --watch

# Terminal 2: Start Next.js dev server
npm run dev
```

### Testing MCP Servers Independently

```bash
# Test property lookup server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/mcp/servers/property-lookup/index.js
```

## Deployment

This application is designed to deploy to **Vercel** with MCP servers bundled as part of the Next.js deployment.

```bash
# Deploy to Vercel
npm run build
vercel --prod
```

## Security

- All sensitive data encrypted at rest
- TLS/SSL for data in transit
- API key rotation support
- Comprehensive audit logging
- GDPR and CCPA compliance ready

## License

Proprietary - All rights reserved

## Support

For questions or issues, please contact the development team.

---

**Status**: 🚧 In Development (Phase 0 - Infrastructure Setup)
