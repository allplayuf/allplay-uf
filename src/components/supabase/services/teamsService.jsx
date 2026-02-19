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
 * Create a new team via Base44 backend function
 * 
 * The create_team function lives as a Base44 backend function (functions/teams/createTeam),
 * NOT as a Supabase edge function. So we call it through the Base44 SDK.
 * 
 * @param {object} data - Team data from CreateTeamForm
 * @returns {Promise<object>} - Created team with id
 */
export async function createTeam(data) {
  // Normalize payload
  const payload = {
    name: (data.name || '').trim(),
    description: (data.description || '').trim(),
    city: (data.city || '').trim(),
    logo_url: data.logo_url || null,
    is_public: data.is_public !== false,
    max_members: data.max_members || 20,
    teamColor: data.teamColor || data.team_color || '#2BA84A',
  };

  console.log('[teamsService] createTeam payload:', JSON.stringify(payload));

  if (!payload.name) throw new Error('Lagnamn krävs');
  if (!payload.city) throw new Error('Stad krävs');

  // Use Base44 SDK to call the backend function (NOT Supabase edge function)
  const { base44 } = await import('@/api/base44Client');
  const response = await base44.functions.invoke('teams/createTeam', payload);
  
  console.log('[teamsService] createTeam result:', JSON.stringify(response?.data));
  
  // The base44 SDK wraps response in { data: ... }
  const result = response?.data || response;
  
  if (result?.error) {
    const error = new Error(result.error);
    error.status = result.details ? 400 : 500;
    throw error;
  }
  
  return result;
}