/**
 * Venues Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All writes go through Edge Functions
 * - Reads use REST API with RLS enforcement
 * - No frontend authorization checks
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { getAuthHeaders, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';

/**
 * Upsert a venue by external_id
 * 
 * ARCHITECTURE: external_id is the unique key.
 * - Calls upsert_venue edge function (onConflict: external_id)
 * - If edge function returns duplicate key error, refetch by external_id
 * - Never creates duplicate rows for the same external_id
 * 
 * @param {object} venue - Venue object (must have .id as external_id)
 * @returns {Promise<object|null>} - Upserted venue or existing venue
 */
export async function upsertVenue(venue) {
  if (!venue?.id) {
    console.warn('[venuesService] No venue to upsert');
    return null;
  }
  
  const payload = {
    external_id: String(venue.id),
    name: venue.name || 'Okänd plan',
    city: venue.city || null,
    address: venue.address || null,
    lat: venue.latitude || venue.lat || null,
    lng: venue.longitude || venue.lng || null
  };

  try {
    return await callEdgeFunction('upsert_venue', payload);
  } catch (e) {
    // Handle duplicate key / conflict errors gracefully
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('duplicate') || msg.includes('conflict') || msg.includes('unique') || msg.includes('23505')) {
      console.info('[venuesService] Venue already exists, fetching by external_id:', payload.external_id);
      return getVenueByExternalId(payload.external_id);
    }
    // Re-throw other errors
    throw e;
  }
}

/**
 * Get a single venue by its external_id
 * Used as fallback when upsert hits a duplicate key conflict
 */
export async function getVenueByExternalId(externalId) {
  if (!externalId) return null;
  
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/venues?external_id=eq.${encodeURIComponent(externalId)}&limit=1`,
      { method: 'GET', headers }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

/**
 * Create a new venue directly in Supabase via REST API
 * Used by admin panel to add venues
 */
export async function createVenue(venueData) {
  const headers = await getAuthHeaders();
  
  const payload = {
    name: venueData.name,
    address: venueData.address || null,
    city: venueData.city || null,
    lat: venueData.latitude ?? venueData.lat ?? null,
    lng: venueData.longitude ?? venueData.lng ?? null,
    external_id: venueData.external_id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    is_active: true,
    is_verified: venueData.is_verified ?? true,
    added_by_admin: true,
    formats_supported: venueData.formats_supported || ['5v5'],
    facilities: venueData.facilities || [],
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/venues`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error('[venuesService] createVenue failed:', res.status, err);
    throw new Error(`Kunde inte skapa plan: ${res.status}`);
  }

  const rows = await res.json();
  return rows[0] || null;
}

/**
 * Delete a venue from Supabase via REST API
 * Used by admin panel
 */
export async function deleteVenue(venueId) {
  if (!venueId) throw new Error('venueId is required');
  
  const headers = await getAuthHeaders();
  
  console.log('[venuesService] deleteVenue:', venueId);
  
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/venues?id=eq.${encodeURIComponent(venueId)}`,
    { 
      method: 'DELETE', 
      headers: { ...headers, 'Prefer': 'return=representation' }
    }
  );

  const body = await res.text().catch(() => '');
  console.log('[venuesService] deleteVenue response:', res.status, body);

  if (!res.ok) {
    console.error('[venuesService] deleteVenue failed:', res.status, body);
    throw new Error(`Kunde inte radera plan: ${res.status} ${body}`);
  }
  
  // Check if anything was actually deleted
  let deleted = [];
  try { deleted = JSON.parse(body); } catch (_) {}
  if (Array.isArray(deleted) && deleted.length === 0) {
    throw new Error('Ingen plan raderades — RLS kan blockera borttagning. Kontrollera admin-behörighet.');
  }
  
  return { ok: true, deleted };
}

/**
 * Delete multiple venues by IDs (one by one for reliable error reporting)
 */
export async function deleteVenues(venueIds) {
  if (!venueIds?.length) return { ok: true, deleted: 0 };
  
  const results = [];
  const errors = [];
  
  for (const id of venueIds) {
    try {
      await deleteVenue(id);
      results.push(id);
    } catch (e) {
      console.error('[venuesService] Failed to delete venue', id, e.message);
      errors.push({ id, error: e.message });
    }
  }
  
  console.log(`[venuesService] deleteVenues: ${results.length}/${venueIds.length} deleted, ${errors.length} failed`);
  
  if (errors.length > 0 && results.length === 0) {
    throw new Error(`Kunde inte radera några planer: ${errors[0].error}`);
  }
  
  return { ok: true, deleted: results.length, errors };
}

/**
 * Get venues list from Supabase
 * Always include auth token - RLS decides what user can see
 */
export async function getVenues() {
  const headers = await getAuthHeaders();
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/venues?select=*&order=name.asc`, {
      method: 'GET',
      headers
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch venues: ${res.status}`);
    }
    
    const rows = await res.json();
    
    // Normalize coordinates: Supabase stores lat/lng, app uses latitude/longitude
    const normalized = rows.map(v => ({
      ...v,
      latitude: v.latitude ?? v.lat ?? null,
      longitude: v.longitude ?? v.lng ?? null,
    }));
    
    // Debug: log first raw venue to see actual DB columns
    if (rows.length > 0) {
      console.log('[venuesService] RAW venue keys:', Object.keys(rows[0]));
      console.log('[venuesService] RAW venue sample:', JSON.stringify(rows[0]));
    }
    if (normalized.length > 0) {
      console.log('[venuesService] NORMALIZED venue sample:', {
        id: normalized[0].id,
        name: normalized[0].name,
        latitude: normalized[0].latitude,
        longitude: normalized[0].longitude,
      });
    }
    
    return normalized;
  } catch (e) {
    console.error('[venuesService] Failed to fetch venues:', e);
    return [];
  }
}