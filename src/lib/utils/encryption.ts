/**
 * Encryption Utilities
 *
 * Functions for encrypting and decrypting sensitive data (e.g., Google Calendar tokens).
 * Uses AES-256-GCM for authenticated encryption.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // Ensure key is 32 bytes (64 hex characters)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a string
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty text')
  }

  const key = getEncryptionKey()
  const iv = randomBytes(16) // Initialization vector

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a string
 *
 * @param encryptedData - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty data')
  }

  const key = getEncryptionKey()

  // Parse the encrypted data
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [ivHex, authTagHex, encryptedText] = parts

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if data is encrypted (basic format check)
 */
export function isEncrypted(data: string): boolean {
  if (!data) {
    return false
  }

  const parts = data.split(':')
  return parts.length === 3 && parts.every((part) => /^[0-9a-f]+$/i.test(part))
}
