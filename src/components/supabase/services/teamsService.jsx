/**
 * Teams Service
 * 
 * ARCHITECTURE: Backend (Supabase RLS) is source of truth
 * - Reads from Supabase `teams` table via REST API
 * - Writes via Edge Functions
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';
import { EDGE } from '../edgeNames';

const IS_DEV = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Get teams from Supabase `teams` table (authenticated)
 * RLS determines what the user can see
 */
export async function getTeams() {
  await waitForAuth();
  const config = await getSupabaseConfig();

  const headers = { 'Content-Type': 'application/json' };
  if (config.anonKey) headers['apikey'] = config.anonKey;
  if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?select=*&order=created_at.desc`,
    { method: 'GET', headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[teamsService] getTeams failed:', res.status, text);
    throw new Error(`Kunde inte hämta lag: ${res.status}`);
  }

  const teams = await res.json();
  if (IS_DEV) console.log('[teamsService] Fetched', teams.length, 'teams');
  return teams;
}

/**
 * Get team members for a specific team
 */
export async function getTeamMembers(teamId) {
  await waitForAuth();
  const config = await getSupabaseConfig();

  const headers = { 'Content-Type': 'application/json' };
  if (config.anonKey) headers['apikey'] = config.anonKey;
  if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=*&team_id=eq.${teamId}`,
    { method: 'GET', headers }
  );

  if (!res.ok) {
    throw new Error(`Kunde inte hämta lagmedlemmar: ${res.status}`);
  }

  return res.json();
}

/**
 * Get current user's team memberships
 */
export async function getMyTeamMemberships() {
  await waitForAuth();
  const config = await getSupabaseConfig();

  const headers = { 'Content-Type': 'application/json' };
  if (config.anonKey) headers['apikey'] = config.anonKey;
  if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;

  // Get user ID from session
  const userId = sessionStore.user?.id;
  if (!userId) return [];

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=*&user_id=eq.${userId}&status=eq.active`,
    { method: 'GET', headers }
  );

  if (!res.ok) return [];
  return res.json();
}

/**
 * Create a new team via Edge Function
 * 
 * @param {object} data - Team data
 * @returns {Promise<object>} - Created team with id
 */
export async function createTeam(data) {
  return callEdgeFunction(EDGE.createTeam, data);
}