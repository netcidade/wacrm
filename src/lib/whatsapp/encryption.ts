/**
 * WhatsApp token encryption using Web Crypto API (AES-GCM / AES-CBC).
 * 100% compatible with Edge Runtime, Cloudflare Workers, and Node.js.
 */

const GCM_IV_LENGTH = 12
const CBC_IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getAesKey(keyHex: string, algoName: 'AES-GCM' | 'AES-CBC'): Promise<CryptoKey> {
  const rawKey = hexToBytes(keyHex)
  return crypto.subtle.importKey(
    'raw',
    rawKey as unknown as BufferSource,
    { name: algoName },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(text: string): Promise<string> {
  const encryptionKey = process.env.ENCRYPTION_KEY!
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH))
  const key = await getAesKey(encryptionKey, 'AES-GCM')
  const encoder = new TextEncoder()
  const encoded = encoder.encode(text)

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource, tagLength: 128 },
    key,
    encoded as unknown as BufferSource
  )

  const cipherBytes = new Uint8Array(cipherBuffer)
  const ciphertextBytes = cipherBytes.slice(0, cipherBytes.length - AUTH_TAG_LENGTH)
  const authTagBytes = cipherBytes.slice(cipherBytes.length - AUTH_TAG_LENGTH)

  return `${bytesToHex(iv)}:${bytesToHex(ciphertextBytes)}:${bytesToHex(authTagBytes)}`
}

export async function decrypt(encryptedText: string): Promise<string> {
  const encryptionKey = process.env.ENCRYPTION_KEY!
  const parts = encryptedText.split(':')

  if (parts.length === 3) {
    // GCM — current format.
    const [ivHex, ctHex, tagHex] = parts
    const iv = hexToBytes(ivHex)
    if (iv.length !== GCM_IV_LENGTH) {
      throw new Error(`Encrypted token has unexpected GCM IV length ${iv.length}`)
    }
    const ct = hexToBytes(ctHex)
    const tag = hexToBytes(tagHex)
    if (tag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Encrypted token has unexpected GCM auth-tag length ${tag.length}`)
    }

    const cipherAndTag = new Uint8Array(ct.length + tag.length)
    cipherAndTag.set(ct, 0)
    cipherAndTag.set(tag, ct.length)

    const key = await getAesKey(encryptionKey, 'AES-GCM')
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource, tagLength: 128 },
      key,
      cipherAndTag as unknown as BufferSource
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  }

  if (parts.length === 2) {
    // CBC — legacy format.
    const [ivHex, ctHex] = parts
    const iv = hexToBytes(ivHex)
    if (iv.length !== CBC_IV_LENGTH) {
      throw new Error(`Encrypted token has unexpected CBC IV length ${iv.length}`)
    }
    const ct = hexToBytes(ctHex)
    const key = await getAesKey(encryptionKey, 'AES-CBC')
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv as unknown as BufferSource },
      key,
      ct as unknown as BufferSource
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  }

  throw new Error(
    `Encrypted token has unrecognised format (expected 1 or 2 colons, got ${parts.length - 1})`
  )
}

export function isLegacyFormat(encryptedText: string): boolean {
  return encryptedText.split(':').length === 2
}
