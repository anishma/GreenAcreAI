import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

/**
 * Test Database Connection Endpoint
 *
 * Usage: GET /api/test-db
 *
 * Tests Prisma database connectivity and returns detailed diagnostics.
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Test 1: Simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    const queryTime = Date.now() - startTime

    // Test 2: Count tenants
    const tenantCount = await prisma.tenants.count()
    const totalTime = Date.now() - startTime

    return NextResponse.json({
      status: 'Connected ✅',
      timestamp: new Date().toISOString(),
      diagnostics: {
        queryTest: result,
        queryTime: `${queryTime}ms`,
        tenantCount,
        totalTime: `${totalTime}ms`,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
        directUrl: process.env.DIRECT_URL ? 'Set' : 'Missing',
      },
    })
  } catch (error) {
    console.error('[DB Test] Connection Error:', error)

    return NextResponse.json(
      {
        status: 'Failed ❌',
        timestamp: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
        },
        diagnostics: {
          databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
          directUrl: process.env.DIRECT_URL ? 'Set' : 'Missing',
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    )
  }
}
