# MCP Architecture Clarification

**Date:** January 1, 2026
**Status:** Corrected Architecture

---

## The Correction

The implementation plan has been **updated to use true MCP (Model Context Protocol)** architecture with standalone MCP servers running as separate processes, communicating via stdio transport.

## What Changed

### ❌ **REMOVED: HTTP API Endpoints for MCP**

```
src/app/api/mcp/                    # DELETED - Not needed
├── property-lookup/route.ts
├── calendar/route.ts
└── business-logic/route.ts
```

**Why removed:** These HTTP endpoints were redundant. MCP uses its own protocol (stdio/SSE), not HTTP REST.

### ✅ **CORRECT: Standalone MCP Servers**

```
src/lib/mcp/
├── servers/                         # Standalone MCP server processes
│   ├── property-lookup/
│   │   ├── index.ts                # MCP server entry point (stdio transport)
│   │   ├── tools/
│   │   │   └── lookup-property.ts
│   │   └── integrations/
│   │       └── regrid-client.ts
│   ├── calendar/
│   │   ├── index.ts                # MCP server entry point
│   │   ├── tools/
│   │   │   ├── get-available-slots.ts
│   │   │   └── book-appointment.ts
│   │   └── integrations/
│   │       └── google-calendar-client.ts
│   └── business-logic/
│       ├── index.ts                # MCP server entry point
│       └── tools/
│           ├── calculate-quote.ts
│           └── validate-service-area.ts
├── client.ts                       # MCP Client (stdio transport)
└── types.ts
```

---

## How It Works

### 1. MCP Servers (Standalone Processes)

Each MCP server runs as a **separate Node.js process** using stdio for communication:

```typescript
// src/lib/mcp/servers/property-lookup/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server(
  { name: 'property-lookup-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// Register tools
server.setRequestHandler('tools/list', async () => ({ tools: [...] }))
server.setRequestHandler('tools/call', async (request) => { ... })

// Start with stdio transport
const transport = new StdioServerTransport()
await server.connect(transport)
```

### 2. MCP Client (Used by LangGraph Agent)

The LangGraph agent uses an MCP client to spawn and communicate with MCP servers:

```typescript
// src/lib/mcp/client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { spawn } from 'child_process'

class MCPClientManager {
  async getClient(serverName: 'property-lookup' | 'calendar' | 'business-logic') {
    // Spawn MCP server as child process
    const serverProcess = spawn('node', ['dist/mcp/servers/${serverName}/index.js'])

    // Create stdio transport
    const transport = new StdioClientTransport({
      input: serverProcess.stdout,
      output: serverProcess.stdin,
    })

    // Connect MCP client to server
    const client = new Client({ name: 'agent' }, { capabilities: {} })
    await client.connect(transport)

    return client
  }

  async callTool(serverName, toolName, args) {
    const client = await this.getClient(serverName)
    const response = await client.request({
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    })
    return JSON.parse(response.content[0].text)
  }
}
```

### 3. LangGraph Agent Calls MCP Tools

```typescript
// src/lib/agents/nodes/property-lookup.ts
import { mcpClient } from '@/lib/mcp/client'

export async function propertyLookupNode(state: ConversationState) {
  // Call MCP server directly via MCP client
  const propertyData = await mcpClient.callTool(
    'property-lookup',
    'lookup_property',
    {
      street: state.customer_address.street,
      city: state.customer_address.city,
      state: state.customer_address.state,
      zip: state.customer_address.zip,
    }
  )

  return { property_data: propertyData, stage: 'property_lookup' }
}
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │      LangGraph Agent (/api/vapi-llm endpoint)      │     │
│  │                                                     │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │    MCP Client (MCPClientManager)         │     │     │
│  │  │    - Spawns MCP servers as child procs   │     │     │
│  │  │    - Communicates via stdio               │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  │            │          │          │                 │     │
│  └────────────┼──────────┼──────────┼─────────────────┘     │
│               │          │          │                       │
└───────────────┼──────────┼──────────┼───────────────────────┘
                │          │          │
       (stdio)  │          │          │  (stdio)
                ▼          ▼          ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │Property  │ │Calendar  │ │Business  │
         │ Lookup   │ │   MCP    │ │  Logic   │
         │   MCP    │ │  Server  │ │   MCP    │
         │  Server  │ │          │ │  Server  │
         └──────────┘ └──────────┘ └──────────┘
      (separate proc) (separate proc) (separate proc)
```

---

## Why This Architecture?

### ✅ Benefits of True MCP

1. **Process Isolation**: MCP servers crash won't affect main app
2. **Resource Management**: Can limit CPU/memory per server
3. **Standardized Protocol**: Follows Anthropic's MCP spec exactly
4. **Future-proof**: Can be reused by other agents/apps
5. **Debugging**: Test MCP servers independently
6. **Modularity**: True separation of concerns
7. **Scalability**: Can run servers on separate machines later

### ❌ Why NOT HTTP Endpoints?

- HTTP endpoints = custom protocol, **not standard MCP**
- Loses process isolation benefits
- More network overhead
- Doesn't follow MCP specification

### ❌ Why NOT In-Process Function Calls?

- No process isolation
- Loses modularity and reusability
- Not true MCP (just MCP-inspired patterns)
- Can't be used by external agents

---

## Development Workflow

### Building MCP Servers

```bash
# Build MCP servers to dist/mcp/
npm run build:mcp
```

### Starting Development

```bash
# Terminal 1: Build and watch MCP servers
npm run build:mcp -- --watch

# Terminal 2: Start Next.js dev server
npm run dev

# MCP servers are spawned automatically by MCP client when needed
```

### Testing MCP Servers Independently

```bash
# Test a single MCP server via stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/mcp/servers/property-lookup/index.js
```

---

## Key Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^0.5.0",
  "@langchain/langgraph": "^0.0.15",
  "@langchain/openai": "^0.0.25"
}
```

---

## Implementation Order (Phase 4)

1. **Build MCP Servers First**
   - Epic 4.1: Property Lookup MCP Server
   - Epic 4.2: Calendar MCP Server
   - Epic 4.3: Business Logic MCP Server

2. **Build MCP Client**
   - Epic 4.4: MCP Client with stdio transport

3. **Build LangGraph Agent**
   - Epic 4.5: LangGraph nodes that use MCP client

---

## Production Deployment (Vercel)

### Option 1: Bundle MCP Servers with Next.js
- Include compiled MCP servers in deployment
- MCP client spawns them as child processes
- ✅ Simple, works out of the box
- ⚠️ Limited by serverless function timeout (10min max on Pro)

### Option 2: Separate Long-Running Containers
- Deploy MCP servers to Docker containers (Railway, Fly.io)
- Change MCP client to use HTTP/SSE transport instead of stdio
- ✅ No timeout limits
- ⚠️ More infrastructure complexity

**Recommendation for MVP**: Start with Option 1 (bundled), migrate to Option 2 if needed.

---

## Summary

✅ **Use true MCP architecture** with standalone servers
✅ **MCP Client spawns servers** via stdio transport
✅ **LangGraph nodes call MCP client** to use tools
❌ **No HTTP endpoints** for MCP
❌ **Not in-process** function calls

This follows the **exact Technical Architecture Document specification** and provides maximum flexibility, modularity, and adherence to the MCP standard.
