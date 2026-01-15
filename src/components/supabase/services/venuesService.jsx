/**
 * Venues Service
 * 
 * Venue-related operations for Supabase.
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { getSupabaseConfig, SUPABASE_URL } from '../config';

/**
 * Upsert a venue (sync from Base44)
 * Creates or updates a venue based on external_id
 * 
 * @param {object} venue - Venue data from Base44
 * @param {string} venue.id - Base44 venue ID (external_id)
 * @param {string} venue.name - Venue name
 * @param {string} [venue.city] - City
 * @param {string} [venue.address] - Address
 * @param {number} [venue.latitude] - Latitude
 * @param {number} [venue.longitude] - Longitude
 */
export async function upsertVenue(venue) {
  if (!venue?.id) {
    console.warn('[venuesService] No venue to upsert');
    return null;
  }
  
  console.log('[venuesService] Upserting venue:', venue.id, venue.name);
  
  return callEdgeFunction('upsert_venue', {
    external_id: venue.id,
    name: venue.name || 'Okänd plan',
    city: venue.city || null,
    address: venue.address || null,
    lat: venue.latitude || venue.lat || null,
    lng: venue.longitude || venue.lng || null
  }, { requireAuth: true });
}

/**
 * Get venues list from Supabase
 * Falls back to guest-accessible REST query
 */
export async function getVenues() {
  const config = await getSupabaseConfig();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
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