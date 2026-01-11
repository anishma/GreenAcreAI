/**
 * Prisma Client Singleton
 *
 * This file creates a singleton instance of PrismaClient to prevent
 * multiple instances in development (Next.js hot reload).
 *
 * Serverless Configuration:
 * - Uses connection pooling optimized for serverless
 * - Prevents "prepared statement already exists" errors
 * - Configures appropriate connection limits for Vercel
 *
 * Usage:
 * import { prisma } from '@/lib/prisma'
 *
 * const users = await prisma.users.findMany()
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Serverless-optimized connection pooling
    // Prevents "prepared statement already exists" errors in Vercel
    // IMPORTANT: DATABASE_URL must include ?pgbouncer=true&connection_limit=1
    // for Supabase connection pooling to work properly
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    query: {
      $allOperations: async ({ operation, model, args, query }) => {
        // Add timeout to all queries to prevent hanging connections in serverless
        // operation: the Prisma operation (e.g., 'findUnique', 'create')
        // model: the Prisma model being queried (e.g., 'conversations', 'tenants')
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Query timeout after 10s (${model}.${operation})`)),
            10000
          )
        )
        return Promise.race([query(args), timeoutPromise])
      },
    },
  }) as unknown as PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Global connection cleanup to prevent connection leaks
// This is especially important in serverless environments
if (typeof window === 'undefined') {
  // Only run in Node.js environment (not browser)
  const cleanup = async () => {
    await prisma.$disconnect()
  }

  // Cleanup on process exit
  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}
