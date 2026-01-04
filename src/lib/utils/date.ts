/**
 * Date Utilities
 *
 * Functions for date/time formatting and timezone conversions.
 */

import { format, formatDistance, formatRelative, parseISO } from 'date-fns'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

/**
 * Format a date to a readable string
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatString: string = 'PPP'
): string {
  if (!date) {
    return '—'
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  return format(dateObj, formatString)
}

/**
 * Format a date/time to a readable string
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  formatString: string = 'PPp'
): string {
  if (!date) {
    return '—'
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  return format(dateObj, formatString)
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) {
    return '—'
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

/**
 * Format a date relative with full context (e.g., "today at 3:00 PM")
 */
export function formatRelativeDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '—'
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  return formatRelative(dateObj, new Date())
}

/**
 * Format a date in a specific timezone
 */
export function formatDateInTimezone(
  date: Date | string | null | undefined,
  timezone: string,
  formatString: string = 'PPp'
): string {
  if (!date) {
    return '—'
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  return formatInTimeZone(dateObj, timezone, formatString)
}

/**
 * Convert a date to a specific timezone
 */
export function toTimezone(
  date: Date | string,
  timezone: string
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return toZonedTime(dateObj, timezone)
}

/**
 * Format time only (e.g., "3:00 PM")
 */
export function formatTime(
  date: Date | string | null | undefined,
  formatString: string = 'p'
): string {
  if (!date) {
    return '—'
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  return format(dateObj, formatString)
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const today = new Date()

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj < new Date()
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj > new Date()
}
