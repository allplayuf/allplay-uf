/**
 * VenueAvailability Service
 * Direct REST access to public.venue_availability (RLS enforced).
 * Replaces base44.entities.VenueAvailability.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { sessionStore, waitForAuth } from '../client';

function headers(withAuth = true) {
  const h = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Accept': 'application/json',
  };
  if (withAuth && sessionStore.accessToken) {
    h['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }
  return h;
}

async function handleRes(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`venue_availability ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

/**
 * List availability slots for a venue (optionally within a date range).
 * @param {object} params
 * @param {string} params.venue_id
 * @param {string} [params.date] - exact date (YYYY-MM-DD)
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 * @param {string} [params.slot_type] - 'available' | 'booked'
 * @param {number} [params.limit]
 */
export async function listVenueAvailability({
  venue_id,
  date,
  date_from,
  date_to,
  slot_type,
  limit = 200,
} = {}) {
  await waitForAuth();
  const qs = new URLSearchParams();
  if (venue_id) qs.set('venue_id', `eq.${venue_id}`);
  if (date) qs.set('date', `eq.${date}`);
  if (date_from && date_to) {
    qs.append('date', `gte.${date_from}`);
    qs.append('date', `lte.${date_to}`);
  } else if (date_from) {
    qs.set('date', `gte.${date_from}`);
  } else if (date_to) {
    qs.set('date', `lte.${date_to}`);
  }
  if (slot_type) qs.set('slot_type', `eq.${slot_type}`);
  qs.set('order', 'date.asc,start_time.asc');
  qs.set('limit', String(limit));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/venue_availability?${qs.toString()}`, {
    method: 'GET',
    headers: headers(true),
  });
  return handleRes(res);
}

export async function createVenueAvailability(slot) {
  await waitForAuth();
  const payload = {
    venue_id: slot.venue_id,
    date: slot.date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    slot_type: slot.slot_type || 'available',
    booked_by: slot.booked_by || null,
    notes: slot.notes || null,
    is_recurring: !!slot.is_recurring,
    recurring_day: slot.recurring_day ?? null,
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venue_availability`, {
    method: 'POST',
    headers: { ...headers(true), 'Prefer': 'return=representation' },
    body: JSON.stringify(payload),
  });
  const data = await handleRes(res);
  return Array.isArray(data) ? data[0] : data;
}

export async function bulkCreateVenueAvailability(slots) {
  if (!slots?.length) return [];
  await waitForAuth();
  const payload = slots.map(s => ({
    venue_id: s.venue_id,
    date: s.date,
    start_time: s.start_time,
    end_time: s.end_time,
    slot_type: s.slot_type || 'available',
    booked_by: s.booked_by || null,
    notes: s.notes || null,
    is_recurring: !!s.is_recurring,
    recurring_day: s.recurring_day ?? null,
  }));
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venue_availability`, {
    method: 'POST',
    headers: { ...headers(true), 'Prefer': 'return=representation' },
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function deleteVenueAvailability(id) {
  await waitForAuth();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venue_availability?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers(true),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`delete venue_availability ${res.status}: ${text}`);
  }
  return { ok: true };
}