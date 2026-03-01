/**
 * Teams Service
 * 
 * ARCHITECTURE: Backend (Supabase RLS) is source of truth
 * - Reads from Supabase `teams` table via REST API
 * - Writes via Edge Functions
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { getAuthHeaders, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';
import { EDGE } from '../edgeNames';

// Alias for backward compat inside this file
const supabaseHeaders = () => getAuthHeaders();

/**
 * Get all teams (RLS determines visibility)
 */
export async function getTeams() {
  await waitForAuth();
  const headers = await supabaseHeaders();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?select=*&order=created_at.desc`,
    { method: 'GET', headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[teamsService] getTeams failed:', res.status, text);
    throw new Error(`Kunde inte hämta lag: ${res.status}`);
  }

  return res.json();
}

/**
 * Get a single team by ID
 */
export async function getTeamById(teamId) {
  if (!teamId) return null;
  await waitForAuth();
  const headers = await supabaseHeaders();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?id=eq.${teamId}&select=*`,
    { method: 'GET', headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[teamsService] getTeamById failed:', res.status, text);
    throw new Error(`Kunde inte hämta lag: ${res.status}`);
  }

  const data = await res.json();
  return data?.[0] || null;
}

/**
 * Get team members for a specific team (raw rows)
 */
export async function getTeamMembers(teamId) {
  if (!teamId) return [];
  await waitForAuth();
  const headers = await supabaseHeaders();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=*&team_id=eq.${teamId}`,
    { method: 'GET', headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[teamsService] getTeamMembers failed:', res.status, text);
    return [];
  }

  return res.json();
}

/**
 * Get team members WITH user profiles joined
 * Returns array of { ...team_member_fields, user: { id, full_name, avatar_url, ... } }
 */
export async function getTeamMembersWithProfiles(teamId) {
  if (!teamId) return [];
  await waitForAuth();

  const members = await getTeamMembers(teamId);
  if (members.length === 0) return [];

  // Fetch user profiles for all member user_ids
  const userIds = members.map(m => m.user_id).filter(Boolean);
  if (userIds.length === 0) return members.map(m => ({ ...m, user: null }));

  const headers = await supabaseHeaders();
  const idsParam = `(${userIds.join(',')})`;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=id,full_name,username,avatar_url,city,skill_level,matches_played,mvp_count`,
    { method: 'GET', headers }
  );

  let users = [];
  if (res.ok) {
    users = await res.json();
  }

  const userMap = new Map(users.map(u => [u.id, u]));

  return members.map(m => ({
    ...m,
    user: userMap.get(m.user_id) || { id: m.user_id, full_name: 'Okänd spelare', avatar_url: null }
  }));
}

/**
 * Get current user's team memberships → returns teams (joined)
 * 
 * Query: team_members WHERE user_id = me AND status = active
 * Then fetches the actual teams by IDs.
 */
export async function getMyTeams() {
  await waitForAuth();
  const userId = sessionStore.user?.id;
  if (!userId) return [];

  const headers = await supabaseHeaders();

  // Step 1: Get my memberships
  const membershipsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=team_id&user_id=eq.${userId}&status=eq.active`,
    { method: 'GET', headers }
  );

  if (!membershipsRes.ok) return [];
  const memberships = await membershipsRes.json();
  if (memberships.length === 0) return [];

  // Step 2: Fetch those teams
  const teamIds = memberships.map(m => m.team_id).filter(Boolean);
  if (teamIds.length === 0) return [];

  const idsParam = `(${teamIds.join(',')})`;
  const teamsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?id=in.${idsParam}&select=*&order=created_at.desc`,
    { method: 'GET', headers }
  );

  if (!teamsRes.ok) return [];
  return teamsRes.json();
}

/** @deprecated Use getMyTeams() instead */
export async function getMyTeamMemberships() {
  await waitForAuth();
  const userId = sessionStore.user?.id;
  if (!userId) return [];

  const headers = await supabaseHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=*&user_id=eq.${userId}&status=eq.active`,
    { method: 'GET', headers }
  );

  if (!res.ok) return [];
  return res.json();
}

/**
 * Create a new team via Supabase Edge Function
 * Edge function handles: INSERT into teams + INSERT into team_members (owner row)
 */
export async function createTeam(data) {
  const payload = {
    name: (data.name || '').trim(),
    description: (data.description || '').trim().slice(0, 500),
    city: (data.city || '').trim(),
    logo_url: (data.logo_url || '').trim() || null,
    is_public: data.is_public !== false,
    max_members: Math.max(2, Math.min(50, parseInt(data.max_members) || 20)),
    teamColor: data.teamColor || data.team_color || '#2BA84A',
  };

  if (!payload.name) throw new Error('Lagnamn krävs');
  if (!payload.city) throw new Error('Stad krävs');

  console.log('[teamsService] createTeam payload:', JSON.stringify(payload));

  const result = await callEdgeFunction(EDGE.createTeam, payload);
  
  console.log('[teamsService] createTeam result:', JSON.stringify(result));
  
  if (result?.error) {
    throw new Error(result.error);
  }
  
  return result;
}