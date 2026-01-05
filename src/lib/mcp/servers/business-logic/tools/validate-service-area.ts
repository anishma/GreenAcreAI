import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const validateServiceAreaTool = {
  name: 'validate_service_area',
  description: 'Check if a ZIP code is in the tenant service area',
  input_schema: z.object({
    tenant_id: z.string().uuid(),
    zip: z.string().length(5),
  }),
  handler: async (input: z.infer<typeof validateServiceAreaTool.input_schema>) => {
    const result: any = await prisma.$queryRaw`
      SELECT is_in_service_area(${input.tenant_id}::uuid, ${input.zip}::varchar) as in_area
    `

    return {
      in_service_area: result[0].in_area,
    }
  },
}
