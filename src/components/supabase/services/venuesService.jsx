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