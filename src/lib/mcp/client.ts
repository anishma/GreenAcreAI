import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import path from 'path'

type ServerName = 'property-lookup' | 'calendar' | 'business-logic'

// Type guard for MCP response content
interface MCPTextContent {
  type: 'text'
  text: string
}

function isMCPTextContentArray(content: unknown): content is MCPTextContent[] {
  return (
    Array.isArray(content) &&
    content.length > 0 &&
    typeof content[0] === 'object' &&
    content[0] !== null &&
    'type' in content[0] &&
    content[0].type === 'text' &&
    'text' in content[0] &&
    typeof content[0].text === 'string'
  )
}

class MCPClientManager {
  private clients: Map<ServerName, Client> = new Map()

  async getClient(serverName: ServerName): Promise<Client> {
    // Return existing client if already connected
    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!
    }

    // MCP server path
    const serverPath = path.join(
      process.cwd(),
      'src',
      'lib',
      'mcp',
      'servers',
      serverName,
      'index.ts'
    )

    // Create stdio transport with command and args
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', serverPath],
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

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await client.callTool(
        {
          name: toolName,
          arguments: args,
        },
        undefined, // resultSchema
        { signal: controller.signal }
      )

      // Validate and parse response
      if (!isMCPTextContentArray(response.content)) {
        throw new Error(
          `Invalid MCP response format from ${serverName}.${toolName}: expected text content array`
        )
      }

      const resultText = response.content[0].text
      return JSON.parse(resultText) as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Cleanup on shutdown
  async shutdown() {
    for (const [_serverName, client] of this.clients.entries()) {
      await client.close()
    }
    this.clients.clear()
  }
}

export const mcpClient = new MCPClientManager()

// Cleanup on process exit
process.on('SIGINT', async () => {
  await mcpClient.shutdown()
  process.exit(0)
})
