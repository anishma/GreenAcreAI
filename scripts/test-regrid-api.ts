#!/usr/bin/env tsx
import 'dotenv/config'
import axios from 'axios'

const REGRID_API_KEY = process.env.REGRID_API_KEY!
const REGRID_BASE_URL = 'https://app.regrid.com/api/v2/parcels'

async function testRegridAPI() {
  console.log('Testing Regrid API v2 with address endpoint...\n')
  console.log('API Key present:', REGRID_API_KEY ? 'YES' : 'NO')
  console.log('API Key (first 20 chars):', REGRID_API_KEY?.substring(0, 20))

  const fullAddress = '1200 Main Street, Dallas, TX 75202'

  console.log('\nTest address:', fullAddress)

  try {
    console.log('\nMaking API request...')
    const response = await axios.get(`${REGRID_BASE_URL}/address`, {
      params: {
        query: fullAddress,
        token: REGRID_API_KEY,
        limit: 1,
      },
      timeout: 10000,
    })

    console.log('\n✓ API Response Status:', response.status)
    console.log('Response structure:')
    console.log('- Type:', typeof response.data)
    console.log('- Keys:', Object.keys(response.data))
    console.log('\nFull response data:')
    console.log(JSON.stringify(response.data, null, 2))
  } catch (error: any) {
    console.error('\n✗ API Request Failed')
    console.error('Status:', error.response?.status)
    console.error('Status Text:', error.response?.statusText)
    console.error('Error message:', error.message)
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testRegridAPI()
