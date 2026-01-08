import axios from 'axios'

const REGRID_API_KEY = process.env.REGRID_API_KEY!
const REGRID_BASE_URL = 'https://app.regrid.com/api/v2/parcels'

export async function lookupProperty(address: {
  street: string
  city: string
  state: string
  zip: string
}) {
  try {
    // Construct full address string for query parameter
    const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`

    const response = await axios.get(`${REGRID_BASE_URL}/address`, {
      params: {
        query: fullAddress,
        token: REGRID_API_KEY,
        limit: 1,
      },
      timeout: 10000, // 10 second timeout
    })

    // Response structure: { parcels: { features: [...] } }
    const features = response.data.parcels?.features
    if (!features || features.length === 0) throw new Error('Property not found')

    const parcel = features[0]
    const fields = parcel.properties.fields

    return {
      lot_size_sqft: fields.ll_gissqft || fields.area_building || 0,
      parcel_id: fields.parcelnumb || parcel.id,
      address: fields.address || 'Unknown',
      zoning: fields.zoning || 'Unknown',
    }
  } catch (error: any) {
    throw new Error(`Regrid API error: ${error.message}`)
  }
}
