/**
 * Supabase Storage Utilities
 *
 * Handles storage operations for call recordings and transcripts:
 * - Upload call recordings from VAPI to Supabase Storage
 * - Generate signed URLs for secure access
 * - Manage recording lifecycle
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

/**
 * Get Supabase client with service role key for server-side operations
 * This bypasses RLS policies and allows full access to storage
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Upload call recording from VAPI to Supabase Storage
 *
 * @param tenantId - Tenant ID for organization
 * @param callId - Unique call identifier (VAPI call ID)
 * @param recordingUrl - URL to download recording from VAPI
 * @returns Signed URL for accessing the recording (valid for 1 year)
 */
export async function uploadRecording(
  tenantId: string,
  callId: string,
  recordingUrl: string
): Promise<string> {
  console.log(`[Storage] Uploading recording for call ${callId}`)

  const supabase = getSupabaseAdmin()

  try {
    // Download recording from VAPI
    console.log(`[Storage] Downloading recording from VAPI: ${recordingUrl}`)
    const response = await axios.get(recordingUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    })

    const buffer = Buffer.from(response.data)
    console.log(`[Storage] Downloaded ${buffer.length} bytes`)

    // Create path: tenant_id/call_id.mp3
    const filePath = `${tenantId}/${callId}.mp3`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .upload(filePath, buffer, {
        contentType: 'audio/mpeg',
        upsert: true, // Overwrite if exists
      })

    if (error) {
      console.error('[Storage] Upload error:', error)
      throw new Error(`Failed to upload recording: ${error.message}`)
    }

    console.log(`[Storage] Recording uploaded successfully: ${data.path}`)

    // Generate signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year

    if (signedError) {
      console.error('[Storage] Signed URL error:', signedError)
      throw new Error(`Failed to create signed URL: ${signedError.message}`)
    }

    console.log(`[Storage] Signed URL generated for call ${callId}`)
    return signedData.signedUrl
  } catch (error: any) {
    console.error('[Storage] Error uploading recording:', error)
    throw new Error(`Recording upload failed: ${error.message}`)
  }
}

/**
 * Get signed URL for existing call recording
 *
 * @param tenantId - Tenant ID for organization
 * @param callId - Unique call identifier
 * @param expiresIn - URL validity in seconds (default: 1 hour)
 * @returns Signed URL or null if recording doesn't exist
 */
export async function getRecordingUrl(
  tenantId: string,
  callId: string,
  expiresIn: number = 60 * 60 // 1 hour
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const filePath = `${tenantId}/${callId}.mp3`

  try {
    // Check if file exists
    const { data: listData, error: listError } = await supabase.storage
      .from('call-recordings')
      .list(tenantId, {
        search: `${callId}.mp3`,
      })

    if (listError || !listData || listData.length === 0) {
      console.log(`[Storage] Recording not found: ${filePath}`)
      return null
    }

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('[Storage] Error creating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('[Storage] Error getting recording URL:', error)
    return null
  }
}

/**
 * Delete call recording
 *
 * @param tenantId - Tenant ID for organization
 * @param callId - Unique call identifier
 * @returns True if deleted successfully
 */
export async function deleteRecording(
  tenantId: string,
  callId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const filePath = `${tenantId}/${callId}.mp3`

  try {
    const { error } = await supabase.storage
      .from('call-recordings')
      .remove([filePath])

    if (error) {
      console.error('[Storage] Delete error:', error)
      return false
    }

    console.log(`[Storage] Recording deleted: ${filePath}`)
    return true
  } catch (error) {
    console.error('[Storage] Error deleting recording:', error)
    return false
  }
}

/**
 * Check if recording exists in storage
 *
 * @param tenantId - Tenant ID for organization
 * @param callId - Unique call identifier
 * @returns True if recording exists
 */
export async function recordingExists(
  tenantId: string,
  callId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .list(tenantId, {
        search: `${callId}.mp3`,
      })

    if (error) {
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('[Storage] Error checking recording existence:', error)
    return false
  }
}
