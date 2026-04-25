# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server. |
| `npm run build` | Production build. |
| `npm run preview` | Serve the built bundle locally. |
| `npm run lint` / `npm run lint:fix` | ESLint over `src/components/**`, `src/pages/**`, and `Layout.jsx` only — `src/components/ui`, `src/api`, `src/lib`, `src/vite-plugins` are intentionally excluded (`eslint.config.js`, `jsconfig.json`). |
| `npm run typecheck` | `tsc -p ./jsconfig.json`. The project is `.jsx` JavaScript with `checkJs: true`, so this matters even though `src/utils/index.ts` is the only `.ts` file. |

No test runner is configured — there is no `npm test`.

Path alias `@/*` maps to `./src/*` — set in both `jsconfig.json` (for tooling) and `vite.config.js` (for builds, via `fileURLToPath`). The `@base44/vite-plugin` was removed in the Vercel migration; the alias is now manual.

Legacy Base44 import paths (`@/entities/X`, `@/integrations/Core`) are kept resolvable by thin re-export files in `src/entities/` and `src/integrations/` that route to the `base44Client.js` shim.

## High-level architecture

**Product:** AllPlay UF — Swedish football matchmaking PWA (`<html lang="sv">`, all UI strings in Swedish: `Karta`, `Matcher`, `Community`, `Profil`).

**Stack:** Vite 6, React 18, Tailwind 3, `shadcn/ui` (`new-york` style, `neutral` base — `components.json`), TanStack Query 5, react-router-dom 6, Sonner toasts, react-hook-form, react-leaflet, framer-motion, recharts.

### Backend is Supabase, not Base44

This repo started as a Base44 (no-code platform) project and was migrated to Supabase. The naming has not been cleaned up yet, so several things look misleading:

- The `base44/` directory (Deno `entry.ts` files under `base44/functions/**` and JSON schemas under `base44/entities/`) is **legacy and not deployed**. Real backend logic lives as Supabase Edge Functions; the entries here are kept only for reference.
- `src/api/base44Client.js` is a **compatibility shim**. It exposes a `base44` object whose `.entities.<Pascal>` calls map to Supabase REST tables (snake_case plural via `TABLE_MAP`), and whose `.functions.invoke('cups/createCup')` rewrites the path to a snake_case Edge Function name. Legacy pages still import from it; new code should call Supabase services directly instead of expanding the shim.
- The Base44-era `src/lib/AuthContext.jsx` was **deleted** during the Vercel migration. The live auth path is `SupabaseAuthProvider` / `useSupabaseAuth()`. Don't recreate the legacy file.

### Edge function calls go through one wrapper

`src/components/supabase/callEdgeFunction.jsx` is the **single source of truth** for every edge call. It hard-fails if `SUPABASE_ANON_KEY` is missing, builds standardized headers, normalizes Swedish error messages for common 4xx cases, and pushes every call into an in-memory log surfaced by `EdgeFunctionDebugPanel` (iOS Safari has no usable console).

**Never** call `supabaseClient.functions.invoke(...)` or do raw `fetch('/functions/v1/...')` — always go through `callEdgeFunction(name, body)`.

Edge function names are centralized as the `EDGE` constant in `src/components/supabase/edgeNames.jsx`; all names are snake_case. Add new functions there.

### Service layer

`src/components/supabase/services/*.jsx` — one file per domain (`matchesService`, `matchesQueries`, `venuesService`, `usersService`, `userCache`, `teamsService`, `friendshipsService`, `reportsService`, `adminService`, `playersService`, `participantsService`, `venueAvailabilityService`). Re-exported through `services/index.jsx` and again through `src/components/supabase/index.jsx`.

Architecture rule (documented inline in `services/index.jsx`):

> Writes go through Edge Functions. Reads use the Supabase REST API. RLS is the source of truth — the frontend never filters for security, only for UI concerns (city preference, date filter, etc.).

### Auth

- Provider: `SupabaseAuthProvider` (`src/components/supabase/AuthProvider.jsx`); hook: `useSupabaseAuth()`.
- Token storage: `sessionStore` in `src/components/supabase/client.jsx` persists tokens to `localStorage` under the `allplay_supabase_*` keys.
- **`waitForAuth()`** is an init gate the services already await before networking — preserve that pattern when adding network code.
- Admin check: call `checkIsAdmin()` from `src/components/supabase/services/adminService.jsx` for the authoritative answer (reads `public.users.is_admin`). The cached `useSupabaseAuth().isAdmin()` is fine for fast UI gating only.

### Supabase config is hardcoded on purpose

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are constants in `src/components/supabase/config.jsx`. The header comment explains why: an earlier iOS/TestFlight bug had the anon key arriving as `null` from a backend call, producing silent 403s. Anon keys are public — rotate by editing this file.

### Pages are auto-registered

`src/pages.config.js` is **auto-generated** (header comment says so). To add a page, drop a `.jsx` into `src/pages/` and let the wiring update itself. The only field you should ever edit by hand is `mainPage` (currently `"Dashboard"`) — it controls the landing route.

URLs are computed by `createPageUrl(name)` in `src/utils/index.ts`: lowercased name, spaces → hyphens.

### Layout shell

`src/Layout.jsx` wraps every route in `QueryProvider → SupabaseAuthProvider → ConsentChecker`, with `ErrorBoundary`, `OfflineDetector`, `OnboardingModal`, `RouteGuard`, `RouteProgress`, and `PageTransition` mounted globally.

The five primary tabs are `lazy()`-loaded: `Dashboard`, `Map` (`Karta`), `Matches` (`Matcher`), `Community`, `Profile` (`Profil`). Mobile gets `GlassBottomNav` + `GlassHeader`; ≥`lg` gets a sidebar. The Admin link only renders after `checkIsAdmin()` resolves true.

### Feature flags

`src/lib/featureFlags.js`. `CUPS_ENABLED` is currently `false`, which hides the entire cup UI (Community widget, Dashboard widget, `Cups` / `CupDetail` / `CreateCup` / `TeamOverview` page surfaces) but **does not** delete data. Flip the flag and re-verify the cup flow end-to-end before claiming cups work.

### Firebase

Used only for FCM push notifications (`src/components/firebase/`). Credentials in `firebaseConfig.jsx` are still `YOUR_*` placeholders — pushes will not actually deliver until those are populated.

### iOS quirks worth knowing

- Layout pads with `env(safe-area-inset-*)` everywhere; mobile header and bottom nav float over scrollable content.
- `Layout.jsx` creates a one-shot silent `AudioContext` on first user interaction so iOS does not pause Spotify / Apple Music when the app loads.
- `EdgeFunctionDebugPanel` mounts inside `Layout.jsx` and surfaces the in-memory edge-call log because iOS Safari has no devtools.
- Theme color and root background are pinned to `#0F1513` (`index.html` inline style) to avoid a flash on the notch / status bar.

### Standard data-flow when adding a feature

1. Write the Supabase Edge Function.
2. Register its name in `src/components/supabase/edgeNames.jsx` under the `EDGE` constant.
3. Add a service function in the relevant `services/*.jsx` file that calls `callEdgeFunction(EDGE.x, body)` (writes) or hits the REST API with `getStandardHeaders()` (reads).
4. Consume from a page or component via `useQuery` / `useMutation`.

Do not introduce another HTTP wrapper.
