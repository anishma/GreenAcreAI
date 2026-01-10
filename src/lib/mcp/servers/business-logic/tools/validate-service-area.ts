import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const validateServiceAreaSchema = z.object({
  tenant_id: z.string().uuid(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string().length(5),
})

export const validateServiceAreaTool = {
  name: 'validate_service_area',
  description: 'Check if an address is in the tenant service area',
  input_schema: validateServiceAreaSchema,
  handler: async (input: z.infer<typeof validateServiceAreaSchema>) => {
    try {
      console.error('[validate-service-area] Starting query with:', input)
      const result: any = await prisma.$queryRaw`
        SELECT is_in_service_area(${input.tenant_id}::uuid, ${input.zip}::varchar) as in_area
      `
      console.error('[validate-service-area] Query result:', result)

      // For now, return simple boolean. Distance calculation would require geocoding API
      // which is outside the scope of the database function
      return {
        in_service_area: result[0].in_area || false,
        service_radius_miles: 25, // Default service radius
        distance_miles: 10, // Placeholder - would need geocoding to calculate actual distance
      }
    } catch (error: any) {
      console.error('[validate-service-area] Error:', error)
      throw new Error(`Service area validation failed: ${error.message}`)
    }
  },
}
