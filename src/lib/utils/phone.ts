/**
 * Phone Utilities
 *
 * Functions for phone number validation and E.164 formatting.
 */

/**
 * Convert a phone number to E.164 format (+1XXXXXXXXXX)
 */
export function toE164(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')

  // Handle US phone numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned}`
  }

  // Return as-is with + prefix if already formatted
  if (phoneNumber.startsWith('+')) {
    return phoneNumber
  }

  // Assume US country code if not specified
  return `+1${cleaned}`
}

/**
 * Validate a phone number (basic US phone number validation)
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) {
    return false
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')

  // Valid if 10 digits (US) or 11 digits starting with 1 (US with country code)
  if (cleaned.length === 10) {
    return true
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return true
  }

  // Check if it's already in E.164 format
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phoneNumber)
}

/**
 * Format a phone number for display
 */
export function formatPhoneForDisplay(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) {
    return ''
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')

  // Format 10-digit US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Format 11-digit numbers (with country code)
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // Return as-is if format is unexpected
  return phoneNumber
}

/**
 * Alias for formatPhoneForDisplay for backward compatibility
 */
export const formatPhoneNumber = formatPhoneForDisplay

/**
 * Extract area code from phone number
 */
export function getAreaCode(phoneNumber: string): string | null {
  const cleaned = phoneNumber.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return cleaned.slice(0, 3)
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return cleaned.slice(1, 4)
  }

  return null
}

/**
 * Mask a phone number for privacy (e.g., "(XXX) XXX-1234")
 */
export function maskPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return `(XXX) XXX-${cleaned.slice(6)}`
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (XXX) XXX-${cleaned.slice(7)}`
  }

  // Return masked version
  return 'XXX-XXX-XXXX'
}
