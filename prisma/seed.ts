/**
 * Prisma Seed File
 *
 * Seeds the database with default pricing templates
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed pricing templates
  const standardTemplate = await prisma.pricing_templates.create({
    data: {
      name: 'Standard Lawn Care',
      tiers: [
        {
          name: 'Small Lot',
          min_sqft: 0,
          max_sqft: 5000,
          weekly_price: 35,
          biweekly_price: 50,
          service_inclusions: ['mowing', 'basic trimming', 'cleanup'],
          pricing_type: 'estimate',
        },
        {
          name: 'Quarter Acre',
          min_sqft: 5001,
          max_sqft: 10000,
          weekly_price: 45,
          biweekly_price: 65,
          service_inclusions: ['mowing', 'trimming', 'edging', 'cleanup'],
          pricing_type: 'estimate',
        },
        {
          name: 'Third Acre',
          min_sqft: 10001,
          max_sqft: 15000,
          weekly_price: 55,
          biweekly_price: 75,
          service_inclusions: ['mowing', 'trimming', 'edging', 'cleanup'],
          pricing_type: 'estimate',
        },
        {
          name: 'Half Acre',
          min_sqft: 15001,
          max_sqft: 22000,
          weekly_price: 70,
          biweekly_price: 95,
          service_inclusions: ['mowing', 'trimming', 'edging', 'cleanup', 'blowing'],
          pricing_type: 'estimate',
        },
        {
          name: 'Large Lot',
          min_sqft: 22001,
          max_sqft: 99999999,
          weekly_price: 85,
          biweekly_price: null,
          service_inclusions: ['mowing', 'trimming', 'edging', 'cleanup', 'blowing'],
          pricing_type: 'estimate',
        },
      ],
    },
  })

  console.log(`✅ Created pricing template: ${standardTemplate.name}`)

  console.log('✨ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
