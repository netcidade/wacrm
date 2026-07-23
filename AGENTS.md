<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cloudflare Pages Deployment Rules
- Always maintain `.npmrc` with `legacy-peer-deps=true` in root.
- Ensure all API routes, heartbeat, middleware, and dynamic `[id]` pages export `export const runtime = 'edge'`.
- Build command must be `npm run pages:build` pointing to `next-on-pages`.
- Require `nodejs_compat` flag in Cloudflare Pages Functions settings.
- Refer to `docs/CLOUDFLARE_PAGES.md` for full details.

