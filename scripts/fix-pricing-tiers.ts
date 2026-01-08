#!/usr/bin/env tsx
/**
 * Migration script to fix pricing tiers format
 * Converts existing camelCase pricing tiers to snake_case for database compatibility
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting pricing tiers format migration...\n')

  // Get all tenants
  const tenants = await prisma.tenants.findMany({
    select: {
      id: true,
      business_name: true,
      pricing_tiers: true,
    },
  })

  console.log(`Found ${tenants.length} tenants to check\n`)

  let updatedCount = 0
  let skippedCount = 0

  for (const tenant of tenants) {
    console.log(`Processing: ${tenant.business_name} (${tenant.id})`)

    const pricingTiers = tenant.pricing_tiers as any[]

    if (!pricingTiers || pricingTiers.length === 0) {
      console.log('  ⚠️  No pricing tiers configured, skipping...\n')
      skippedCount++
      continue
    }

    // Check if already in snake_case format
    const firstTier = pricingTiers[0]
    if ('min_sqft' in firstTier && 'weekly_price' in firstTier) {
      console.log('  ✓ Already in snake_case format, skipping...\n')
      skippedCount++
      continue
    }

    // Check if in camelCase format
    if ('minSqft' in firstTier && 'weeklyPrice' in firstTier) {
      console.log('  🔄 Converting from camelCase to snake_case...')

      // Transform to snake_case
      const updatedTiers = pricingTiers.map((tier) => ({
        min_sqft: tier.minSqft,
        max_sqft: tier.maxSqft,
        weekly_price: tier.weeklyPrice,
        biweekly_price: tier.biweeklyPrice,
        monthly_price: tier.monthlyPrice,
      }))

      // Update tenant
      await prisma.tenants.update({
        where: { id: tenant.id },
        data: {
          pricing_tiers: updatedTiers as any,
          updated_at: new Date(),
        },
      })

      console.log(`  ✅ Updated ${updatedTiers.length} pricing tiers\n`)
      updatedCount++
    } else {
      console.log('  ⚠️  Unknown format, skipping...\n')
      skippedCount++
    }
  }

  console.log('\n📊 Migration Summary:')
  console.log(`  - Total tenants: ${tenants.length}`)
  console.log(`  - Updated: ${updatedCount}`)
  console.log(`  - Skipped: ${skippedCount}`)
  console.log('\n✨ Migration complete!')
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
