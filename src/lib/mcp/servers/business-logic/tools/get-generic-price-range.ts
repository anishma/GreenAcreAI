import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const getGenericPriceRangeSchema = z.object({
  tenant_id: z.string().uuid(),
})

export const getGenericPriceRangeTool = {
  name: 'get_generic_price_range',
  description: 'Get a generic price range for services when lot size is unknown',
  input_schema: getGenericPriceRangeSchema,
  handler: async (input: z.infer<typeof getGenericPriceRangeSchema>) => {
    // Get tenant with pricing_tiers JSON column
    const tenant = await prisma.tenants.findUnique({
      where: { id: input.tenant_id },
      select: {
        pricing_tiers: true,
        allows_generic_quotes: true,
        generic_quote_disclaimer: true,
      },
    })

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    if (!tenant.allows_generic_quotes) {
      throw new Error('Generic quotes are not enabled for this tenant')
    }

    // Parse pricing tiers from JSON
    const pricingTiers = tenant.pricing_tiers as any[]

    if (!pricingTiers || pricingTiers.length === 0) {
      throw new Error('No pricing tiers configured for tenant')
    }

    // Get min and max weekly prices
    const weeklyPrices = pricingTiers.map((tier) => Number(tier.weekly_price))
    const minWeekly = Math.min(...weeklyPrices)
    const maxWeekly = Math.max(...weeklyPrices)

    // Get min and max biweekly prices
    const biweeklyPrices = pricingTiers.map((tier) => Number(tier.biweekly_price))
    const minBiweekly = Math.min(...biweeklyPrices)
    const maxBiweekly = Math.max(...biweeklyPrices)

    return {
      min_price: minWeekly,
      max_price: maxWeekly,
      typical_frequency: 'weekly' as const,
      weekly: {
        min: minWeekly,
        max: maxWeekly,
        range: `$${minWeekly} - $${maxWeekly}`,
      },
      biweekly: {
        min: minBiweekly,
        max: maxBiweekly,
        range: `$${minBiweekly} - $${maxBiweekly}`,
      },
      message: tenant.generic_quote_disclaimer || 'Pricing varies based on lot size. An exact quote requires property information.',
    }
  },
}
