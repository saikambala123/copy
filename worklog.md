# Worklog — NOVA Streaming Platform

Premium animated full-stack SaaS movie & series streaming platform.

## Stack decisions
- Next.js 16 App Router, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion
- Database: **MongoDB ONLY** (user requirement) — embedded mongod binary managed by watchdog service in `mini-services/mongo-service`, port **27017**
- Driver: official `mongodb` npm package (dev server runs under Node 24 → fully compatible)
- Auth: custom JWT (HMAC-SHA256 via node:crypto), httpOnly cookie sessions, scrypt password hashing
- Single user-visible route `/` — SPA with client-side view switching (Zustand)
- Demo videos: Google sample bucket (https://commondatastorage.googleapis.com/gtv-videos-bucket/...)

## Project sections
---
Task ID: 1
Agent: main-orchestrator (Z.ai Code)
Task: Setup embedded MongoDB on port 27017

Work Log:
- (in progress)

Stage Summary:
- (pending)

---
Task ID: 1
Agent: main-orchestrator (Z.ai Code)
Task: Setup embedded MongoDB on port 27017

Work Log:
- Downloaded MongoDB 7.0.14 (debian12 build) to /home/z/my-project/mongodb/mongodb-bin
- Created watchdog mini-service mini-services/mongo-service (bun, spawns+restarts mongod)
- IMPORTANT: background processes survive between commands ONLY via double-fork: `( setsid cmd & )`
- Installed mongodb@7.7.0 driver; verified ping + insert + find via node

Stage Summary:
- MongoDB live at 127.0.0.1:27017 (db: nova). Restart command:
  cd /home/z/my-project/mini-services/mongo-service && ( setsid bun run index.ts >> /home/z/my-project/mongodb/service.log 2>&1 < /dev/null & )

---
Task ID: 2
Agent: main-orchestrator (Z.ai Code)
Task: Collect poster/backdrop imagery for 40 titles

Work Log:
- image-search skill (z-ai CLI): 18 real posters + backdrops for dune/interstellar + 6 more backdrops after rate-limit recovery
- image-generation skill: 22 AI cinematic posters (public/art/*.poster.png, 768x1344)
- Built final catalog: image-catalog/catalog.json {slug: {poster, backdrop?}}

Stage Summary:
- 40/40 posters, 18 landscape backdrops (covers 8 featured heroes + detail views)
- Remote images are OSS URLs (z-cdn.chatglm.cn); local AI art served from /art/*.png

---
Task ID: 3-a
Agent: full-stack-developer (frontend) — context ran out near the end; orchestrator verified
Task: Build complete NOVA frontend SPA per FRONTEND_SPEC.md

Work Log:
- Created src/app/page.tsx (Providers + AppShell), layout.tsx (dark, sonner Toaster), globals.css (cinematic tokens)
- src/lib/api.ts (fetch wrapper), src/lib/store.ts (Zustand: view routing, user, auth modal)
- src/components/app/: navbar, footer, hero-carousel, content-row, title-card, detail-overlay,
  auth-modal, cursor-glow, skeletons, bits (shared motion primitives), providers
- views/: browse, catalog (movies/series), search, mylist, plans, account, watch (831-line custom player)
- admin/: portal (sidebar), dashboard (recharts + count-ups), titles CRUD, users, settings
- Orchestrator: restarted dev server after Turbopack cache corruption (rm -rf .next), GET / 200, lint passes clean

Stage Summary:
- 7,456 lines of frontend; all views + admin portal implemented; compiles and lints clean
- Known: no worklog entry was written by the agent itself (context deadline) — this entry substitutes

---
Task ID: 3-b
Agent: full-stack-developer (backend) — context ran out at the end; orchestrator verified & finished
Task: Build MongoDB backend + APIs + seed per API_CONTRACT.md

Work Log:
- src/lib/mongo.ts (cached client singleton), auth.ts (JWT HMAC + scrypt), seed.ts, doc-types.ts, api-utils.ts, title-input.ts, password.mjs
- All API routes: auth (4), home, titles (+[id]), watchlist, progress, ratings, me (+history), plans, subscribe, admin (stats/titles/users/settings)
- scripts/seed.mjs seeds: 40 titles, 4 plans, 14 users (admin+demo+12 random), watchlist, progress, ratings, settings

Stage Summary:
- Orchestrator ran seed + curl-verified EVERY endpoint (login demo/admin, home w&wo cookie, watchlist toggle,
  progress, ratings, plans, admin stats/titles/users/settings, 403 guards) — all pass
- Video pool swapped: Google gtv-videos bucket now 403s → 9 local clips in public/videos/ (Blender trailers +
  Pexels CC footage, Referer header needed for Pexels downloads), all 40 titles reassigned, seed.ts updated

---
Task ID: 4
Agent: main-orchestrator (Z.ai Code)
Task: Integration QA with agent-browser + fixes

Work Log:
- Fixed Radix DialogTitle a11y errors in detail-overlay.tsx + auth-modal.tsx (sr-only titles)
- Fixed recurring Turbopack crash: experimental.turbopackFileSystemCacheForDev=false + allowedDevOrigins in next.config.ts
- Full E2E QA via agent-browser: browse/hero/rows/Top10, detail dialog, demo login, watch player (play/pause,
  progress saved 9s/26s verified via API), search (suggestions + grid), My List, Plans, admin portal
  (dashboard stats+charts, content CRUD: created "Inception 2: The Dreaming" + deleted w/ confirm,
  users table, settings), mobile 390px (no overflow), sticky footer (sticks on short pages, pushes on long)
- Screenshots analyzed via VLM; console + dev.log clean; lint passes

Stage Summary:
- GOLDEN PATH VERIFIED END-TO-END. Known-good demo accounts: admin@nova.stream/Admin@123, demo@nova.stream/Demo@123
- Remaining polish ideas for next phase (cron agent): episode-list UX in detail view, notifications real data,
  more content rows (Because you watched X), profile avatars picker, account view deep-link from navbar
