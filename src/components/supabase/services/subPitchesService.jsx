/**
 * SubPitchesService
 * Helpers to fetch sub-pitches (venues whose parent_venue_id points to a given parent).
 * Uses the existing venues REST endpoint — RLS enforced.
 */

import { getAuthHeaders, SUPABASE_URL } from '../config';

/**
 * Get all sub-pitches whose parent_venue_id === parentVenueId.
 * Returns [] if column missing or none found.
 */
export async function getSubPitches(parentVenueId) {
  if (!parentVenueId) return [];
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/venues?parent_venue_id=eq.${encodeURIComponent(parentVenueId)}&select=*&order=name.asc`,
      { method: 'GET', headers }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map(v => ({
      ...v,
      latitude: v.latitude ?? v.lat ?? null,
      longitude: v.longitude ?? v.lng ?? null,
    }));
  } catch (e) {
    console.warn('[subPitchesService] failed:', e.message);
    return [];
  }
}

/**
 * Update a venue's parent_venue_id (admin only — RLS enforced)
 */
export async function setParentVenue(venueId, parentVenueId) {
  if (!venueId) throw new Error('venueId required');
  const headers = await getAuthHeaders();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/venues?id=eq.${encodeURIComponent(venueId)}`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ parent_venue_id: parentVenueId || null }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kunde inte uppdatera underplan: ${res.status} ${text}`);
  }
  return res.json();
}