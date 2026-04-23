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
 * Delete a team (admin) — uses soft-delete via REST PATCH.
 * Sets is_active=false + deleted_at. The teams list already filters these out.
 * RLS must allow admins to UPDATE teams for this to work.
 * Tries the Edge Function first for hard-delete, falls back to soft-delete.
 */
export async function deleteTeamRest(teamId) {
  if (!teamId) throw new Error('teamId is required');
  await waitForAuth();
  const userId = sessionStore.user?.id;

  // Try edge function first (may hard-delete with service role)
  try {
    const result = await callEdgeFunction(EDGE.deleteTeam, { team_id: teamId, teamId });
    return { ok: true, ...result };
  } catch (edgeError) {
    console.warn('[teamsService] Edge delete_team unavailable, using REST soft-delete:', edgeError.message);
  }

  // Soft-delete via REST PATCH
  const headers = await supabaseHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?id=eq.${encodeURIComponent(teamId)}`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: userId || null,
      })
    }
  );
  const body = await res.text().catch(() => '');
  console.log('[teamsService] soft-delete response:', res.status, body);

  if (!res.ok) {
    throw new Error(`Kunde inte radera lag: ${res.status} ${body}`);
  }
  let rows = [];
  try { rows = JSON.parse(body); } catch (_) {}
  if (Array.isArray(rows) && rows.length === 0) {
    throw new Error('Ingen ändring gjordes. RLS blockerar UPDATE för admin. Kontakta utvecklare för att uppdatera RLS-policy på teams-tabellen.');
  }

  return { ok: true, soft_deleted: true };
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

  const result = await callEdgeFunction(EDGE.createTeam, payload);

  if (result?.error) {
    throw new Error(result.error);
  }

  return result;
}

/**
 * Update team fields (RLS enforced — only captain can update)
 */
export async function updateTeam(teamId, updates) {
  if (!teamId) throw new Error('teamId is required');
  await waitForAuth();
  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?id=eq.${encodeURIComponent(teamId)}`,
    { method: 'PATCH', headers, body: JSON.stringify(updates) }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kunde inte uppdatera lag: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data?.[0] || null;
}

/**
 * Invite a user to a team by creating a pending team_members row (RLS enforced)
 */
export async function inviteToTeam(teamId, userId) {
  if (!teamId || !userId) throw new Error('teamId and userId required');
  await waitForAuth();
  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };

  // Check existing membership first
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}&select=*`,
    { method: 'GET', headers: await supabaseHeaders() }
  );
  if (existingRes.ok) {
    const existing = await existingRes.json();
    if (existing.length > 0) {
      return { ok: false, reason: 'already_exists', row: existing[0] };
    }
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ team_id: teamId, user_id: userId, role: 'member', status: 'pending' })
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kunde inte skicka inbjudan: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { ok: true, row: data?.[0] || null };
}

/**
 * Request to join a team as current user (creates pending team_members row)
 */
export async function requestJoinTeam(teamId) {
  const userId = sessionStore.user?.id;
  if (!userId) throw new Error('Du måste vara inloggad');
  return inviteToTeam(teamId, userId);
}