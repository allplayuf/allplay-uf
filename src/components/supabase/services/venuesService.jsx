/**
 * Venues Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All writes go through Edge Functions
 * - Reads use REST API with RLS enforcement
 * - No frontend authorization checks
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

/**
 * Upsert a venue (sync from Base44)
 * Backend RLS decides if user can write - no frontend guard
 */
export async function upsertVenue(venue) {
  if (!venue?.id) {
    console.warn('[venuesService] No venue to upsert');
    return null;
  }
  
  return callEdgeFunction('upsert_venue', {
    external_id: venue.id,
    name: venue.name || 'Okänd plan',
    city: venue.city || null,
    address: venue.address || null,
    lat: venue.latitude || venue.lat || null,
    lng: venue.longitude || venue.lng || null
  });
}

/**
 * Get venues list from Supabase
 * Always include auth token - RLS decides what user can see
 */
export async function getVenues() {
  const config = await getSupabaseConfig();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
  }
  
  // Always include auth if available - RLS handles access
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/venues?select=*&order=name.asc`, {
      method: 'GET',
      headers
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch venues: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    console.error('[venuesService] Failed to fetch venues:', e);
    return [];
  }
}