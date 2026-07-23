/**
 * Verify the HMAC-SHA256 signature Meta attaches to webhook POSTs.
 * Uses Web Crypto API (crypto.subtle) — 100% compatible with Edge Runtime & Node.js.
 */
export async function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const secret = process.env.META_APP_SECRET
  if (!secret) {
    console.error(
      '[webhook] META_APP_SECRET is not set — rejecting request. ' +
        'Configure the env var (Meta → App Settings → Basic → App Secret) ' +
        'to enable signature verification.',
    )
    return false
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(rawBody) as unknown as BufferSource
    )

    const expectedHex =
      'sha256=' +
      Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

    return signatureHeader === expectedHex
  } catch (err) {
    console.error('[webhook] Signature verification error:', err)
    return false
  }
}
