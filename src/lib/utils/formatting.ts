/**
 * Formatting Utilities
 *
 * Functions for formatting currency, phone numbers, and other data.
 */

/**
 * Format a number as US currency
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a phone number to US format: (XXX) XXX-XXXX
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) {
    return ''
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')

  // Handle different lengths
  if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // Format as +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // Return as-is if format is unexpected
  return phoneNumber
}

/**
 * Format a number with commas for thousands separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return '0'
  }

  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format square footage
 */
export function formatSquareFeet(sqft: number | null | undefined): string {
  if (sqft === null || sqft === undefined) {
    return '—'
  }

  return `${formatNumber(sqft)} sq ft`
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds === 0) {
    return '0s'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`)
  }

  return parts.join(' ')
}

/**
 * Format a percentage
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) {
    return '0%'
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) {
    return ''
  }

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}...`
}
