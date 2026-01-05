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
