/**
 * In-Process MCP Client for Serverless Environments
 *
 * This adapter allows MCP tools to work in serverless environments like Vercel
 * by calling the tool handlers directly instead of spawning child processes.
 *
 * Why this is needed:
 * - Vercel serverless functions cannot spawn child processes reliably
 * - StdioClientTransport requires `npx tsx` which fails in serverless
 * - npm cannot create cache directories in read-only serverless filesystems
 *
 * How it works:
 * - Import MCP tool handlers directly from the servers
 * - Call handlers in-process without MCP protocol overhead
 * - Same interface as the regular MCP client for compatibility
 */

import { lookupPropertyTool } from './servers/property-lookup/tools/lookup-property'

type ServerName = 'property-lookup' | 'calendar' | 'business-logic'

class MCPClientServerless {
  async callTool<T = any>(
    serverName: ServerName,
    toolName: string,
    args: Record<string, any>
  ): Promise<T> {
    // Route to appropriate server and tool
    if (serverName === 'property-lookup' && toolName === 'lookup_property') {
      // Validate args with Zod schema
      const validatedArgs = lookupPropertyTool.input_schema.parse(args)
      // Call handler directly (in-process, no subprocess)
      const result = await lookupPropertyTool.handler(validatedArgs)
      return result as T
    }

    throw new Error(`Unknown tool: ${serverName}.${toolName}`)
  }

  async shutdown() {
    // No cleanup needed for in-process calls
  }
}

export const mcpClient = new MCPClientServerless()

// No process.on('SIGINT') needed - we're not managing subprocesses
