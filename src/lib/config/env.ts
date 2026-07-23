/**
 * Environment configuration with fallback values for Cloudflare Pages & self-hosted Supabase.
 * Ensures the app connects out-of-the-box even if environment variables are not configured
 * in the Cloudflare Dashboard.
 *
 * NOTE: META_APP_SECRET is read lazily (getter) so test teardown (delete process.env.META_APP_SECRET)
 * is still respected during the test run.
 */

export const ENV = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'http://supabasekong-ha7ewqvqe4yxkmhz1fgwx37o.138.201.188.208.sslip.io'
    )
  },

  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NDgzMDAyMCwiZXhwIjo0OTQwNTAzNjIwLCJyb2xlIjoiYW5vbiJ9.yIVViaUJLWUBQYqYD9PpaT0JSMO_41rdV5wwPLkMlVE'
    )
  },

  get SUPABASE_SERVICE_ROLE_KEY() {
    return (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NDgzMDAyMCwiZXhwIjo0OTQwNTAzNjIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.7uKQPm4fUKu16tsEnWjF1WuJBi7wS8Uh_5xRMRoS1o4'
    )
  },

  get ENCRYPTION_KEY() {
    return (
      process.env.ENCRYPTION_KEY ||
      '2d15517d9ed3686a30b9e1e1fec2df92651f6b01564c59898451a07ca43042f3'
    )
  },

  // META_APP_SECRET has no fallback — an empty/missing secret causes
  // verifyMetaWebhookSignature() to reject all requests (fail-closed).
  get META_APP_SECRET() {
    return process.env.META_APP_SECRET || ''
  },

  get NEXT_PUBLIC_SITE_URL() {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://wacrm.tech'
  },
}
