#!/usr/bin/env tsx
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
  
  try {
    console.log('\nTesting Prisma connection...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✓ Prisma connected successfully')
    console.log('Test query result:', result)
  } catch (error) {
    console.error('✗ Prisma connection failed:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

main()
