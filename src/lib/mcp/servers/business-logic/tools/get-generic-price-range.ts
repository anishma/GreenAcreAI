import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const getGenericPriceRangeTool = {
  name: 'get_generic_price_range',
  description: 'Get a generic price range for services when lot size is unknown',
  input_schema: z.object({
    tenant_id: z.string().uuid(),
  }),
  handler: async (input: z.infer<typeof getGenericPriceRangeTool.input_schema>) => {
    // Get all pricing tiers for the tenant
    const pricingTiers = await prisma.pricing_tiers.findMany({
      where: { tenant_id: input.tenant_id },
      orderBy: { tier_min_sqft: 'asc' },
    })

    if (pricingTiers.length === 0) {
      throw new Error('No pricing tiers found for tenant')
    }

    // Get min and max weekly prices
    const weeklyPrices = pricingTiers.map((tier) => tier.weekly_price)
    const minWeekly = Math.min(...weeklyPrices)
    const maxWeekly = Math.max(...weeklyPrices)

    // Get min and max biweekly prices
    const biweeklyPrices = pricingTiers.map((tier) => tier.biweekly_price)
    const minBiweekly = Math.min(...biweeklyPrices)
    const maxBiweekly = Math.max(...biweeklyPrices)

    return {
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
      message: 'Pricing varies based on lot size. An exact quote requires property information.',
    }
  },
}
