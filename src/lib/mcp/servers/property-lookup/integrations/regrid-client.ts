import axios from 'axios'

const REGRID_API_KEY = process.env.REGRID_API_KEY!
const REGRID_BASE_URL = 'https://api.regrid.com/v1'

export async function lookupProperty(address: {
  street: string
  city: string
  state: string
  zip: string
}) {
  try {
    const response = await axios.get(`${REGRID_BASE_URL}/parcels`, {
      headers: { Authorization: `Bearer ${REGRID_API_KEY}` },
      params: {
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
    })

    const parcel = response.data.results[0]
    if (!parcel) throw new Error('Property not found')

    return {
      lot_size_sqft: parcel.fields.lot_size_sqft,
      parcel_id: parcel.id,
      address: parcel.fields.address,
      zoning: parcel.fields.zoning,
    }
  } catch (error: any) {
    throw new Error(`Regrid API error: ${error.message}`)
  }
}
