#!/usr/bin/env tsx
/**
 * Test script for MCP servers
 * Tests property lookup, calendar, and business logic servers
 */

import 'dotenv/config'
import { mcpClient } from '../src/lib/mcp/client'

// Use the actual tenant ID from the database
const TENANT_ID = '182557c2-22e6-4577-b2a6-9c6681361227'

async function testPropertyLookup() {
  console.log('\n=== Testing Property Lookup Server ===')
  try {
    const result = await mcpClient.callTool(
      'property-lookup',
      'lookup_property',
      {
        street: '1200 Main Street',
        city: 'Dallas',
        state: 'TX',
        zip: '75202',
      }
    )
    console.log('✓ Property lookup successful:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('✗ Property lookup failed:', error)
  }
}

async function testBusinessLogic() {
  console.log('\n=== Testing Business Logic Server ===')

  // Test service area validation
  try {
    console.log('\n1. Testing service area validation:')
    const serviceAreaResult = await mcpClient.callTool(
      'business-logic',
      'validate_service_area',
      {
        tenant_id: TENANT_ID,
        zip: '75202',
      }
    )
    console.log('✓ Service area validation successful:')
    console.log(JSON.stringify(serviceAreaResult, null, 2))
  } catch (error) {
    console.error('✗ Service area validation failed:', error)
  }

  // Test quote calculation
  try {
    console.log('\n2. Testing quote calculation:')
    const quoteResult = await mcpClient.callTool(
      'business-logic',
      'calculate_quote',
      {
        tenant_id: TENANT_ID,
        lot_size_sqft: 5000,
        frequency: 'weekly',
      }
    )
    console.log('✓ Quote calculation successful:')
    console.log(JSON.stringify(quoteResult, null, 2))
  } catch (error) {
    console.error('✗ Quote calculation failed:', error)
  }

  // Test generic price range
  try {
    console.log('\n3. Testing generic price range:')
    const priceRangeResult = await mcpClient.callTool(
      'business-logic',
      'get_generic_price_range',
      {
        tenant_id: TENANT_ID,
      }
    )
    console.log('✓ Generic price range successful:')
    console.log(JSON.stringify(priceRangeResult, null, 2))
  } catch (error) {
    console.error('✗ Generic price range failed:', error)
  }
}

async function testCalendar() {
  console.log('\n=== Testing Calendar Server ===')

  // Test get available slots
  try {
    console.log('\n1. Testing get available slots:')
    const now = new Date()
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const slotsResult = await mcpClient.callTool(
      'calendar',
      'get_available_slots',
      {
        tenant_id: TENANT_ID,
        start_date: now.toISOString(),
        end_date: twoWeeksLater.toISOString(),
      }
    )
    console.log('✓ Get available slots successful:')
    console.log(`Found ${slotsResult.slots?.length || 0} available slots`)
    if (slotsResult.slots?.length > 0) {
      console.log('First 3 slots:')
      console.log(JSON.stringify(slotsResult.slots.slice(0, 3), null, 2))
    }
  } catch (error) {
    console.error('✗ Get available slots failed:', error)
  }

  // Test book appointment (and then cancel it)
  try {
    console.log('\n2. Testing book appointment:')
    const now = new Date()
    const tomorrow9am = new Date(now)
    tomorrow9am.setDate(tomorrow9am.getDate() + 1)
    tomorrow9am.setHours(9, 0, 0, 0)
    const tomorrow10am = new Date(tomorrow9am)
    tomorrow10am.setHours(10, 0, 0, 0)

    const bookingResult = await mcpClient.callTool(
      'calendar',
      'book_appointment',
      {
        tenant_id: TENANT_ID,
        start_time: tomorrow9am.toISOString(),
        customer_name: 'Test Customer',
        customer_phone: '+15551234567',
        property_address: '1200 Main Street, Dallas, TX 75202',
        estimated_price: 45,
      }
    )
    console.log('✓ Book appointment successful:')
    console.log(JSON.stringify(bookingResult, null, 2))

    // Cancel the test appointment
    if (bookingResult.calendar_event_id) {
      console.log('\n3. Testing cancel appointment:')
      const cancelResult = await mcpClient.callTool(
        'calendar',
        'cancel_appointment',
        {
          tenant_id: TENANT_ID,
          calendar_event_id: bookingResult.calendar_event_id,
        }
      )
      console.log('✓ Cancel appointment successful:')
      console.log(JSON.stringify(cancelResult, null, 2))
    }
  } catch (error) {
    console.error('✗ Book/cancel appointment failed:', error)
  }
}

async function main() {
  console.log('Starting MCP Server Tests...')
  console.log('Make sure you have:')
  console.log('1. Set REGRID_API_KEY in .env.local')
  console.log('2. Completed Google Calendar OAuth setup')
  console.log('3. Have a tenant with service areas and pricing configured in the database')
  console.log('4. Started the MCP servers with: npm run mcp:start')
  console.log('\nPress Ctrl+C to cancel, or wait 3 seconds to continue...')

  await new Promise(resolve => setTimeout(resolve, 3000))

  try {
    await testPropertyLookup()
    await testBusinessLogic()
    await testCalendar()

    console.log('\n=== All Tests Complete ===')
  } catch (error) {
    console.error('\n=== Test Failed ===')
    console.error(error)
  } finally {
    // Cleanup
    process.exit(0)
  }
}

main()
