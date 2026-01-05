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
