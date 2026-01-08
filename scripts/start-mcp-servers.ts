import { spawn } from 'child_process'
import path from 'path'

const servers = ['property-lookup', 'calendar', 'business-logic']

console.log('Starting MCP servers...')

for (const server of servers) {
  const serverPath = path.join(
    process.cwd(),
    'src',
    'lib',
    'mcp',
    'servers',
    server,
    'index.ts'
  )

  const proc = spawn('npx', ['tsx', serverPath], {
    stdio: 'inherit',
  })

  proc.on('error', (err) => {
    console.error(`Error starting ${server} server:`, err)
  })

  console.log(`Started ${server} MCP server`)
}
