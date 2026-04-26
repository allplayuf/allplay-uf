/**
 * Admin function: ensure the 4 multi-pitch IPs (Kristineberg, Östermalm, Stadshagen, Tanto)
 * exist as parent venues with all their sub-pitches linked via parent_venue_id.
 *
 * Idempotent: matches existing rows by (name, city) and only creates what's missing.
 *
 * IMPORTANT: this requires a `parent_venue_id` UUID column on public.venues. If it doesn't
 * exist, the response will explain the SQL the admin must run in Supabase SQL editor:
 *   ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS parent_venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE;
 *   CREATE INDEX IF NOT EXISTS idx_venues_parent ON public.venues(parent_venue_id);
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const PARENTS = [
  {
    name: 'Kristinebergs Idrottsplats',
    city: 'Stockholm',
    address: 'Hjalmar Söderbergs väg 6',
    latitude: 59.3343,
    longitude: 18.0014,
    is_allplay: true,
    formats_supported: ['5v5', '7v7', '11v11'],
    sub_pitches: [
      { name: 'Kristinebergs IP – Konstgräs 7-manna (matchplan)', formats: ['7v7'] },
      { name: 'Kristinebergs IP – Konstgräs 1, 11-manna', formats: ['11v11'] },
      { name: 'Kristinebergs IP – 5-manna matchplan 25', formats: ['5v5'] },
      { name: 'Kristinebergs IP – 5-manna matchplan 26', formats: ['5v5'] },
    ],
  },
  {
    name: 'Östermalms Idrottsplats',
    city: 'Stockholm',
    address: 'Fiskartorpsvägen 2',
    latitude: 59.3477,
    longitude: 18.0876,
    is_allplay: true,
    formats_supported: ['5v5', '7v7', '11v11'],
    sub_pitches: [
      { name: 'Östermalms IP – Konstgräs 11-manna', formats: ['11v11'] },
      { name: 'Östermalms IP – Konstgräs H 7-manna (matchplan 2)', formats: ['7v7'] },
      { name: 'Östermalms IP – Konstgräs V 7-manna (matchplan 3)', formats: ['7v7'] },
      { name: 'Östermalms IP – Konstgräs V 5-manna match 1', formats: ['5v5'] },
      { name: 'Östermalms IP – Konstgräs V 5-manna match 2', formats: ['5v5'] },
    ],
  },
  {
    name: 'Stadshagens Idrottsplats',
    city: 'Stockholm',
    address: 'Stadshagsvägen 8',
    latitude: 59.3372,
    longitude: 18.0152,
    is_allplay: true,
    formats_supported: ['5v5', '7v7', '11v11'],
    sub_pitches: [
      { name: 'Stadshagens IP – Konstgräs 1, 11-manna', formats: ['11v11'] },
      { name: 'Stadshagens IP – Konstgräs 2, 11-manna', formats: ['11v11'] },
      { name: 'Stadshagens IP – Konstgräs 3, 7-manna', formats: ['7v7'] },
      { name: 'Stadshagens IP – Matchplan 32', formats: ['5v5'] },
      { name: 'Stadshagens IP – Matchplan 31', formats: ['5v5'] },
    ],
  },
  {
    name: 'Tanto Idrottsplats',
    city: 'Stockholm',
    address: 'Tantogatan 33',
    latitude: 59.3128,
    longitude: 18.0594,
    is_allplay: true,
    formats_supported: ['5v5', '11v11'],
    sub_pitches: [
      { name: 'Tanto IP – Konstgräs 11-manna', formats: ['11v11'] },
      { name: 'Tanto IP – Konstgräs 5-manna matchplan 2', formats: ['5v5'] },
    ],
  },
];

function svcHeaders() {
  return {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function findVenueByNameCity(name, city) {
  const url = `${SUPABASE_URL}/rest/v1/venues?name=eq.${encodeURIComponent(name)}&city=eq.${encodeURIComponent(city)}&select=id,name,city&limit=1`;
  const res = await fetch(url, { headers: svcHeaders() });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] || null;
}

async function insertVenue(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venues`, {
    method: 'POST',
    headers: svcHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`insert venue ${res.status}: ${body}`);
  }
  const rows = JSON.parse(body);
  return rows?.[0] || null;
}

async function checkParentColumnExists() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/venues?select=id,parent_venue_id&limit=1`,
    { headers: svcHeaders() }
  );
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return Response.json({ error: 'Missing SUPABASE_URL or SERVICE_KEY' }, { status: 500 });
    }

    const hasColumn = await checkParentColumnExists();
    if (!hasColumn) {
      return Response.json({
        error: 'parent_venue_id column missing on public.venues',
        sql_to_run: [
          'ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS parent_venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE;',
          'CREATE INDEX IF NOT EXISTS idx_venues_parent ON public.venues(parent_venue_id);'
        ],
        note: 'Run the SQL above in Supabase SQL editor, then re-run this function.'
      }, { status: 400 });
    }

    const summary = { parents_created: 0, parents_existing: 0, sub_pitches_created: 0, sub_pitches_existing: 0, details: [] };

    for (const parent of PARENTS) {
      const detail = { parent: parent.name, parent_id: null, created_subs: [], existing_subs: [] };

      let parentRow = await findVenueByNameCity(parent.name, parent.city);
      if (!parentRow) {
        const ext = `seed_${parent.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
        parentRow = await insertVenue({
          name: parent.name,
          address: parent.address,
          city: parent.city,
          lat: parent.latitude,
          lng: parent.longitude,
          external_id: ext,
          is_active: true,
          is_verified: true,
          is_allplay: parent.is_allplay,
          added_by_admin: true,
          formats_supported: parent.formats_supported,
          facilities: ['artificial_grass'],
          parent_venue_id: null,
        });
        summary.parents_created++;
      } else {
        summary.parents_existing++;
      }
      detail.parent_id = parentRow.id;

      for (const sub of parent.sub_pitches) {
        const existing = await findVenueByNameCity(sub.name, parent.city);
        if (existing) {
          summary.sub_pitches_existing++;
          detail.existing_subs.push(sub.name);
          continue;
        }
        const ext = `seed_sub_${sub.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
        await insertVenue({
          name: sub.name,
          address: parent.address,
          city: parent.city,
          lat: parent.latitude,
          lng: parent.longitude,
          external_id: ext,
          is_active: true,
          is_verified: true,
          is_allplay: parent.is_allplay,
          added_by_admin: true,
          formats_supported: sub.formats,
          facilities: ['artificial_grass'],
          parent_venue_id: parentRow.id,
        });
        summary.sub_pitches_created++;
        detail.created_subs.push(sub.name);
      }

      summary.details.push(detail);
    }

    return Response.json({ ok: true, summary });
  } catch (error) {
    console.error('[adminSeedSubPitches] error:', error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});