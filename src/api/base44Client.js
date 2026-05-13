/**
 * Base44 → Supabase compatibility shim
 *
 * Legacy cup/admin pages still import `base44` from this file.
 * The real Base44 SDK has been removed; this shim maps the most common
 * calls to Supabase equivalents so builds succeed and features keep working.
 *
 * Eventually all `base44.*` call sites should be migrated to direct
 * Supabase services — this file exists only to make the Vercel migration
 * possible without touching every legacy page.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';
import { sessionStore } from '@/components/supabase/client';
import { callEdgeFunction } from '@/components/supabase/callEdgeFunction';
import { UploadFile as SupabaseUploadFile } from '@/components/supabase/integrations';

/* ─────────── Helpers ─────────── */

async function buildHeaders(json = true) {
  const h = { apikey: SUPABASE_ANON_KEY };
  if (json) h['Content-Type'] = 'application/json';
  if (sessionStore.accessToken) h['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  return h;
}

// Convert a Base44-style function path ("cups/createCup") to a Supabase
// edge-function name ("cups_create_cup"). Edge functions in this project
// use snake_case; legacy callers pass camelCase/slash paths.
function toEdgeName(fnPath) {
  return String(fnPath || '')
    .replace(/\//g, '_')                   // cups/createCup -> cups_createCup
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // createCup -> create_Cup
    .toLowerCase();                         // cups_create_cup
}

function restBase(table) {
  return `${SUPABASE_URL}/rest/v1/${table}`;
}

function makeEntity(table) {
  return {
    async list(sort) {
      const headers = await buildHeaders(false);
      let url = `${restBase(table)}?select=*`;
      if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.slice(1) : sort;
        url += `&order=${field}.${desc ? 'desc' : 'asc'}`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`list ${table} failed: ${res.status}`);
      return res.json();
    },
    async filter(query = {}, sort, limit) {
      const headers = await buildHeaders(false);
      const parts = ['select=*'];
      Object.entries(query).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        parts.push(`${k}=eq.${encodeURIComponent(v)}`);
      });
      if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.slice(1) : sort;
        parts.push(`order=${field}.${desc ? 'desc' : 'asc'}`);
      }
      if (limit) parts.push(`limit=${limit}`);
      const res = await fetch(`${restBase(table)}?${parts.join('&')}`, { headers });
      if (!res.ok) throw new Error(`filter ${table} failed: ${res.status}`);
      return res.json();
    },
    async create(body) {
      const headers = await buildHeaders();
      headers['Prefer'] = 'return=representation';
      const res = await fetch(restBase(table), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`create ${table} failed: ${res.status}`);
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },
    async update(id, body) {
      const headers = await buildHeaders();
      headers['Prefer'] = 'return=representation';
      const res = await fetch(`${restBase(table)}?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`update ${table} failed: ${res.status}`);
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },
    async delete(id) {
      const headers = await buildHeaders(false);
      const res = await fetch(`${restBase(table)}?id=eq.${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`delete ${table} failed: ${res.status}`);
      return true;
    },
  };
}

/* ─────────── Shim ─────────── */

export const base44 = {
  auth: {
    async me() {
      // Prefer cached user from Supabase session — avoids any extra round-trip
      if (!sessionStore.isAuthenticated || !sessionStore.user) {
        const err = new Error('Not authenticated');
        err.status = 401;
        throw err;
      }
      return sessionStore.user;
    },
    async updateMe(payload) {
      // Map ConsentChecker fields to update_profile edge function payload
      const mapped = { ...payload };
      if ('tos_version_accepted' in payload) {
        mapped.terms_version = payload.tos_version_accepted;
        delete mapped.tos_version_accepted;
      }
      if ('tos_accepted_at' in payload) {
        mapped.accepted_terms_at = payload.tos_accepted_at;
        delete mapped.tos_accepted_at;
      }
      return callEdgeFunction('update_profile', mapped);
    },
    logout() {
      sessionStore.clear();
    },
    async isAuthenticated() {
      return sessionStore.isAuthenticated;
    },
  },

  entities: new Proxy({}, {
    get(_t, name) {
      // Map Base44 entity name (PascalCase) to Supabase table (snake_case plural)
      // Known mappings for this app:
      const TABLE_MAP = {
        Friendship: 'friendships',
        TeamMember: 'team_members',
        Cup: 'cups',
        CupParticipant: 'cup_participants',
        CupGroup: 'cup_groups',
        CupMatch: 'cup_matches',
        CupPlayer: 'cup_players',
        CupGoal: 'cup_goals',
        Team: 'teams',
        Match: 'matches',
        MatchParticipant: 'match_participants',
        Venue: 'venues',
        User: 'users',
        Report: 'reports',
        Badge: 'badges',
        UserBadge: 'user_badges',
      };
      const table = TABLE_MAP[name] || String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase() + 's';
      return makeEntity(table);
    },
  }),

  functions: {
    async invoke(fnPath, payload) {
      const edgeName = toEdgeName(fnPath);
      const data = await callEdgeFunction(edgeName, payload || {});
      // Legacy callers read response.data — wrap for compatibility
      return { data };
    },
  },

  integrations: {
    Core: {
      UploadFile: SupabaseUploadFile,
    },
  },
};

export default base44;