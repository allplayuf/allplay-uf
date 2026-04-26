/**
 * Diagnostic: checks if parent_venue_id column exists, if it's queryable,
 * and counts current sub-pitches. Returns a clear status the admin UI can show.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function svcHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // 1. Check if column exists by trying to select it
    const colCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/venues?select=id,parent_venue_id&limit=1`,
      { headers: svcHeaders() }
    );
    const columnExists = colCheck.ok;
    let columnError = null;
    if (!colCheck.ok) {
      columnError = await colCheck.text();
    }

    // 2. Count sub-pitches (rows with non-null parent_venue_id)
    let subPitchCount = 0;
    let parentCount = 0;
    if (columnExists) {
      const subRes = await fetch(
        `${SUPABASE_URL}/rest/v1/venues?parent_venue_id=not.is.null&select=id`,
        { headers: { ...svcHeaders(), Prefer: 'count=exact' } }
      );
      if (subRes.ok) {
        const range = subRes.headers.get('content-range');
        if (range) subPitchCount = parseInt(range.split('/')[1] || '0', 10);
      }

      // Count distinct parents (venues that have at least one child)
      const parentsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/venues?parent_venue_id=not.is.null&select=parent_venue_id`,
        { headers: svcHeaders() }
      );
      if (parentsRes.ok) {
        const rows = await parentsRes.json();
        parentCount = new Set(rows.map((r) => r.parent_venue_id)).size;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        columnExists,
        columnError,
        subPitchCount,
        parentCount,
        sql_to_run: columnExists
          ? null
          : [
              "ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS parent_venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE;",
              "CREATE INDEX IF NOT EXISTS idx_venues_parent ON public.venues(parent_venue_id);",
              "NOTIFY pgrst, 'reload schema';",
            ],
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});