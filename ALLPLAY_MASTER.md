# ALLPLAY UF — Master Document

A new developer should be able to clone this repo and ship code within a day after reading this file. Last updated: 2026-04-25.

---

## 1. Product

**AllPlay UF** is a Swedish football matchmaking PWA. Players find or organize pickup matches near them, join teams, and run cups. The web app is at https://allplayuf.se. UI strings are in Swedish (`<html lang="sv">`); the codebase is English.

The five main pages: **Dashboard** (Hem), **Map** (Karta), **Matches** (Matcher), **Community**, **Profile** (Profil). Admin and Cup organizer features are gated by role.

> **TODO (founder):** mission, vision, team and roles, freemium tier breakdown, B2B pricing — fill in when ready. This file is the single source of truth for product context, please keep it current.

---

## 2. Tech stack

| Layer | Choice | Version |
|---|---|---|
| Build | Vite | ^6.1.0 |
| Framework | React | ^18.2.0 |
| Routing | react-router-dom | ^6.26.0 |
| Styling | Tailwind CSS | ^3.4.17 |
| Component primitives | shadcn/ui (`new-york` style, `neutral` base, see `components.json`) + Radix UI | latest |
| Data fetching | @tanstack/react-query | ^5.84.1 |
| Forms | react-hook-form | ^7.54.2 + zod ^3.24.2 |
| Toasts | sonner ^2.0.1 + react-hot-toast ^2.6.0 |
| Maps | react-leaflet ^4.2.1 |
| Animation | framer-motion ^11.16.4 |
| Charts | recharts ^2.15.4 |
| Push (web) | Firebase ^11.0.0 (FCM) |
| Auth + DB + Storage + Edge Functions | Supabase | postgres 17 |
| Hosting | Vercel (after this migration) |

No test framework configured — there is no `npm test`. Type checking is `tsc -p ./jsconfig.json` over JSDoc `checkJs:true`.

---

## 3. Repository layout

```
allplay-uf/
├── src/
│   ├── App.jsx, main.jsx, index.css        # Boot
│   ├── Layout.jsx                          # Wraps every route: Auth → QueryProvider → Consent → Boundary
│   ├── pages.config.js                     # AUTO-GENERATED route table (only edit `mainPage`)
│   ├── pages/                              # Route components — drop a .jsx here, it auto-registers
│   ├── api/
│   │   ├── base44Client.js                 # Supabase compatibility shim (legacy entry point used by 41 components)
│   │   └── integrations.js                 # Re-exports UploadFile / Core
│   ├── entities/                           # Re-export shims so `@/entities/<X>` resolves to base44.entities.<X>
│   ├── integrations/Core.js                # Re-exports UploadFile / Core for `@/integrations/Core`
│   ├── components/
│   │   ├── ui/                             # shadcn primitives — DO NOT lint, generated
│   │   ├── layout/                         # Header, GlassBottomNav, etc.
│   │   ├── supabase/                       # Auth provider, edge-call wrapper, services/, config
│   │   ├── matches/, cups/, teams/, ...    # Feature components
│   │   └── utils/                          # privacyMask, permissions, analytics
│   ├── lib/                                # AppContext-style state, feature flags, NavigationTracker
│   ├── hooks/, utils/
│   └── firebase/                           # FCM push (credentials still placeholder, see §11)
├── base44/                                 # LEGACY Deno entry.ts files — NOT deployed, kept for reference
├── public/                                 # Static assets, manifest.json, icons
├── vite.config.js                          # Manual `@` → ./src alias (Base44 vite plugin removed)
├── vercel.json                             # SPA rewrite (all routes → /index.html)
├── .env.example                            # Documentation only — keys are hardcoded (see §9)
└── CLAUDE.md                               # Working notes for AI assistants on this repo
```

---

## 4. Database schema (Supabase project `vqfjjokqmykqawjlgevj` — "AllPlay backend", EU-West-1)

18 tables in the `public` schema. RLS is enabled on every one.

### Core

| Table | Purpose | Key relationships |
|---|---|---|
| `profiles` | One row per registered user. Display info (full_name, display_name, username, avatar_url), gameplay stats (elo_rating, matches_played, mvp_count), location (last_lat/lng), preferences (city, skill_level, birth_year, is_public), admin flag. PK = `auth.users.id`. |
| `matches` | Pickup match. `created_by` = creator, `organizer_id` = current organizer (auto-filled by `set_match_organizer` trigger from `created_by` on insert). Status enum: upcoming/ongoing/finished/cancelled. `current_players` is a denormalized count maintained by triggers. | venue_id → venues, created_by/organizer_id → auth.users |
| `match_players` | Join table. Status: joined/checked_in/left. PK (match_id, user_id). | → matches, → auth.users |
| `match_results` | Final score per match. PK = match_id. | → matches |
| `match_ratings` | Player-to-player rating after a match (1–5). PK (match_id, rater_id, rated_user_id). | → matches, → auth.users |
| `venues` | Pitches, parks, courts. `is_allplay = true` for app-curated venues. `created_by` (uuid) for app-registered users; `created_by_email` for legacy/scraped imports. | |
| `venue_availability` | Recurring + one-off availability slots per venue. | → venues |

### Social

| Table | Purpose |
|---|---|
| `friendships` | Single-row friendship: requester_id + addressee_id with status pending/accepted/blocked. Used by `friendshipsService` and `base44Client.entities.Friendship`. |
| `user_blocks` | Hard block list. PK (blocker_id, blocked_id). |
| `reports` | User reports for moderation. |

### Teams + Cups

| Table | Purpose |
|---|---|
| `teams` | Team/club with elo_rating, captain_id, max_members, current_members. |
| `team_members` | (team_id, user_id) join with role + status. |
| `cups` | Tournament. |
| `cup_matches` | Many-to-many between cups and matches. |

### Auth + infra

| Table | Purpose |
|---|---|
| `user_roles` | (user_id, role) — role ∈ user/admin/cup_admin. |
| `user_devices` | Expo push tokens (mobile). |
| `push_tokens` | FCM push tokens (web). Both empty — push is not yet functional. |
| `admin_view_backups` | Backup of view DDL prior to schema cleanup migration runs. Internal. |

### Views (in `public`, all `security_invoker = true`)

| View | Source | Used by |
|---|---|---|
| `users` | `profiles` with COALESCE on full_name/display_name and elo_rating | base44 shim's `User` entity, edge functions like `get_match_participants` |
| `users_public` | `profiles WHERE is_public = true` | (currently no frontend reads — internal abstraction) |
| `player_directory` | `profiles` with simplified columns | (internal) |
| `match_feed_basic` | `matches LEFT JOIN venues LEFT JOIN profiles` for organizer info | `get_match_feed` SQL function |
| `match_participants` | `match_players` with status normalized to confirmed/checked_in/cancelled | base44 shim's `MatchParticipant` entity |
| `match_participants_with_users` | `match_players JOIN profiles` | (internal) |
| `public_matches` | `matches WHERE is_public = true` with live participant count subquery | (internal) |
| `admin_reports` | `reports JOIN profiles` × 2 for reporter + reported names | Admin pages |

---

## 5. Supabase Edge Functions (25 active, all in EU-West-1)

All functions are wrapped by `src/components/supabase/callEdgeFunction.jsx` — never call `supabase.functions.invoke()` or raw `fetch` to `/functions/v1/...` directly. Edge function names are centralized in `src/components/supabase/edgeNames.jsx` as the `EDGE` constant.

| Function | What it does | Auth |
|---|---|---|
| `me` | Returns current user's `{id, email, is_admin}`. Bootstraps the session. | JWT bearer required |
| `update_profile` | Whitelisted profile field update via service-role bypass for own row. Accepts `profile_image_url` for backwards compat (routes to `avatar_url`). | JWT bearer required |
| `delete_account` | Deletes matches owned, removes from match_players, deletes profile, deletes auth user. | JWT bearer required |
| `get_users_by_ids` | Batch profile lookup, max 50 ids. Returns `elo` field aliased from `elo_rating`. | JWT bearer required |
| `create_match` / `join_match` / `leave_match` / `delete_match` / `finish_match` | Match lifecycle ops | JWT |
| `report_match` / `report_user` | Moderation flows | JWT |
| `get_match_details` / `get_match_participants` / `get_matches` | Read endpoints | JWT |
| `get_venues` / `upsert_venue` | Venue CRUD | JWT |
| `create_team` | Create team (owner = caller) | JWT |
| `send-push-notification` / `notify-match-update` | Push fan-out (placeholder until Firebase keys real) | JWT |
| `auth_test` / `ping` / `helpers` / `helper_shered` / `match_network` | Internal/test stubs | varies |
| `fetchTraderaPrice` | Unrelated utility, can be removed | JWT |

Architecture rule (in `services/index.jsx`):

> Writes go through Edge Functions. Reads use the Supabase REST API directly. RLS is the source of truth — the frontend never filters for security, only for UI concerns (city preference, date filter, etc.).

---

## 6. Frontend routing

`src/pages.config.js` is auto-generated. To add a page, drop a `.jsx` into `src/pages/` and the wiring updates itself. The only field worth editing is `mainPage` (currently `"Dashboard"` — controls the landing route).

URLs are computed by `createPageUrl(name)` in `src/utils/index.ts`: lowercased name, spaces → hyphens.

`src/Layout.jsx` wraps every route in:
```
QueryProvider → SupabaseAuthProvider → ConsentChecker
  + ErrorBoundary, OfflineDetector, OnboardingModal, RouteGuard, RouteProgress, PageTransition
```

Mobile gets `GlassBottomNav` + `GlassHeader`; ≥`lg` viewports get a sidebar. The five primary tabs (Dashboard, Map, Matches, Community, Profile) are `lazy()`-loaded.

The Admin link only renders after `checkIsAdmin()` from `adminService.jsx` resolves true.

---

## 7. Auth flow

- **Provider:** `SupabaseAuthProvider` (`src/components/supabase/AuthProvider.jsx`).
- **Hook:** `useSupabaseAuth()` — exposes `user`, `isAuthenticated`, `isGuest`, `isLoading`.
- **Token storage:** `sessionStore` in `src/components/supabase/client.jsx` persists tokens to `localStorage` under `allplay_supabase_*` keys.
- **`waitForAuth()`** is an init gate — services already await it before any network call. Preserve this pattern when adding network code.
- **Guest mode:** unauthenticated users get a synthesized `{is_guest: true, full_name: 'Gäst', display_name: 'Gäst'}` user object and can browse but not write.
- **Admin check:** `checkIsAdmin()` from `services/adminService.jsx` — reads `public.users.is_admin`. The cached `useSupabaseAuth().isAdmin()` is for fast UI gating only.
- **Protected routes:** `RouteGuard` in `Layout.jsx` redirects unauthenticated users to login on protected pages.
- **The legacy file `src/lib/AuthContext.jsx` was deleted** in the Vercel migration — it was Base44-era auth, never used by current code. The single live auth path is `SupabaseAuthProvider`.

---

## 8. Business model

> **TODO (founder):** Document freemium tiers, what's free vs paid, B2B (clubs / organizers / leagues), pricing, billing flows. None of this is implemented in code yet, so keep it consistent with what you build.

---

## 9. Environment variables

Currently **no `.env` file is required to run locally**. `SUPABASE_URL` and `SUPABASE_ANON_KEY` are hardcoded in `src/components/supabase/config.jsx` as a deliberate workaround for an iOS/TestFlight bug where a backend-fetched anon key sometimes arrived as `null`, producing silent 403s. The anon key is a public key — RLS enforces security, not the key — so this is safe.

`.env.example` documents the variable names that *would* be needed if/when the project switches to env-based config:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

To rotate the anon key in Supabase Dashboard, **also update `config.jsx`** in the same commit.

Edge function secrets (set in Supabase project settings, not in this repo):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase
- Firebase admin keys for `send-push-notification` (currently placeholder — see §11)

---

## 10. Run + deploy

### Run locally

```bash
git clone https://github.com/allplayuf/allplay-uf.git
cd allplay-uf
npm install
npm run dev          # Vite dev server, default http://localhost:5173
```

Useful scripts:
| Script | What |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` / `lint:fix` | ESLint over `src/components/**`, `src/pages/**`, and `Layout.jsx`. `src/components/ui`, `src/api`, `src/lib`, `src/vite-plugins` are intentionally excluded. |
| `npm run typecheck` | `tsc -p ./jsconfig.json` |

### Deploy to Vercel

1. Connect the GitHub repo `allplayuf/allplay-uf` in the Vercel dashboard.
2. Framework preset: **Vite**. Build command auto-detected (`npm run build`). Output dir `dist`.
3. The included `vercel.json` rewrites every route to `/index.html` so React Router handles client-side navigation.
4. No environment variables required — Supabase keys are hardcoded (see §9).
5. Push to `main` → Vercel auto-deploys preview + production.

### Apply database migrations

Migrations live in Supabase's migration history (managed via the MCP server / Dashboard). To apply new migrations:
- Use `mcp__supabase__apply_migration` from a Claude Code session, or
- Use the Supabase CLI: `supabase db push`.

Never edit production tables outside a migration — the `admin_view_backups` table preserves prior view DDL for emergencies.

---

## 11. Known issues + tech debt

Items captured during the Base44 → Vercel + Supabase migration (2026-04). Address opportunistically.

### Resolved by this migration
- ✅ Base44 SDK + Vite plugin removed; `src/lib/AuthContext.jsx` deleted (was unused legacy auth).
- ✅ `users__legacy` and `match_participants__legacy` tables dropped (data fully replicated in `profiles` and `match_players`).
- ✅ Empty unused tables `friends` and `friend_requests` dropped; the app uses `friendships` exclusively.
- ✅ Redundant views `match_participants_v2` and `public_matches_old` dropped.
- ✅ `profiles.elo` consolidated into `elo_rating`. `profiles.profile_image_url` consolidated into `avatar_url`.
- ✅ `matches.current_players` drift backfilled (5 rows fixed).
- ✅ All recreated views switched to `security_invoker = true` (RLS now enforced through views).
- ✅ Function search_path pinned on `set_updated_date` and `tg_venue_availability_touch`.
- ✅ `venue_availability_admin_write` policy repointed at `profiles` table directly (was via `users` view — fragile).

### Outstanding
- 🟡 **Firebase FCM credentials are still `YOUR_*` placeholders** in `src/firebase/firebaseConfig.jsx`. Push notifications will not deliver until populated. `send-push-notification` and `notify-match-update` edge functions exist but have nothing to talk to.
- 🟡 **`push_tokens` (FCM) vs `user_devices` (Expo) coexist.** Both empty. Pick one when push is wired up — the other can be dropped.
- 🟡 **Supabase Auth: leaked password protection is disabled.** Toggle on in `Authentication → Providers → Email` (uses HaveIBeenPwned). Surfaced by Supabase advisor.
- 🟡 **Bundle size warning.** Main `index-*.js` chunk is ~1.45 MB minified (~410 KB gzip). Consider `manualChunks` in `vite.config.js` to split vendor bundles.
- 🟡 **`base44/` directory still exists** with ~80 legacy Deno `entry.ts` files. Not deployed, doesn't affect build, but bloats the repo. Safe to delete in a follow-up.
- 🟡 **CUPS_ENABLED feature flag is `false`** in `src/lib/featureFlags.js` — entire cup UI is hidden. Flip + smoke-test the cup flow end-to-end before claiming cups work.
- 🟡 **`fetchTraderaPrice` edge function** appears unrelated to AllPlay — leftover from another project. Consider deleting.
- 🟡 **`matches.organizer_id` is currently always equal to `created_by`** — the trigger `set_match_organizer` auto-fills it. Kept for future flexibility (transferring match ownership) but represents accidental complexity until that feature exists.
- 🟡 **No automated tests.** No `npm test`. Type-check is the only safety net beyond build.

### Architecture invariants — don't break these
1. All edge calls go through `callEdgeFunction(name, body)` from `src/components/supabase/callEdgeFunction.jsx`. Never use `supabase.functions.invoke()` directly.
2. Edge function names live in `EDGE` constant in `src/components/supabase/edgeNames.jsx`. Add new ones there, all snake_case.
3. Writes through Edge Functions, reads through REST. RLS is the source of truth.
4. New pages: drop `.jsx` in `src/pages/` — `pages.config.js` regenerates.
5. Hardcoded Supabase keys in `config.jsx` are a deliberate iOS workaround. If you change anything, document why.
6. The `base44Client.js` shim is a bridge, not an SDK. New code should call Supabase services directly via `src/components/supabase/services/*` instead of expanding the shim.
