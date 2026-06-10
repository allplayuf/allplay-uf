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
import { track } from '@/lib/analytics';

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
 * Get multiple teams by their IDs (used for team match detail page)
 */
export async function getTeamsByIds(teamIds) {
  const ids = (teamIds || []).filter(Boolean);
  if (ids.length === 0) return [];
  await waitForAuth();
  const headers = await supabaseHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?id=in.(${ids.join(',')})&select=id,name,team_color`,
    { method: 'GET', headers }
  );
  if (!res.ok) return [];
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

  // Soft-delete via REST PATCH — only `is_active` exists in teams schema
  const headers = await supabaseHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?id=eq.${encodeURIComponent(teamId)}`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ is_active: false })
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

  track('team_created', { team_id: result?.team?.id || result?.id || null, city: payload.city, is_public: payload.is_public });
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
  const result = await inviteToTeam(teamId, userId);
  if (result?.ok) track('team_join_requested', { team_id: teamId });
  return result;
}

function getMaxPlayers(format) {
  return { '5v5': 10, '7v7': 14, '11v11': 22 }[format] || 10;
}

/**
 * Get challenges for a team (sent + received) with team names joined
 */
export async function getTeamChallenges(teamId) {
  if (!teamId) return [];
  await waitForAuth();
  const headers = await supabaseHeaders();

  const [sentRes, receivedRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/team_challenges?challenger_team_id=eq.${teamId}&select=*&order=created_at.desc`, { method: 'GET', headers }),
    fetch(`${SUPABASE_URL}/rest/v1/team_challenges?challenged_team_id=eq.${teamId}&select=*&order=created_at.desc`, { method: 'GET', headers }),
  ]);

  const sent = sentRes.ok ? await sentRes.json() : [];
  const received = receivedRes.ok ? await receivedRes.json() : [];
  const unique = [...new Map([...sent, ...received].map(c => [c.id, c])).values()];

  if (unique.length === 0) return [];

  const teamIds = [...new Set([...unique.map(c => c.challenger_team_id), ...unique.map(c => c.challenged_team_id)])].filter(Boolean);
  const teamsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?id=in.(${teamIds.join(',')})&select=id,name,logo_url,team_color`,
    { method: 'GET', headers }
  );
  const teams = teamsRes.ok ? await teamsRes.json() : [];
  const teamMap = new Map(teams.map(t => [t.id, t]));

  return unique
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(c => ({ ...c, challengerTeam: teamMap.get(c.challenger_team_id) || null, challengedTeam: teamMap.get(c.challenged_team_id) || null }));
}

/**
 * Send a challenge to another team
 */
export async function sendTeamChallenge({ challengerTeamId, challengedTeamId, format, proposedDate, proposedTime, venueId, message }) {
  if (!challengerTeamId || !challengedTeamId) throw new Error('Båda lagen krävs');
  await waitForAuth();
  const userId = sessionStore.user?.id;
  if (!userId) throw new Error('Du måste vara inloggad');

  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/team_challenges`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      challenger_team_id: challengerTeamId,
      challenged_team_id: challengedTeamId,
      format: format || '5v5',
      proposed_date: proposedDate || null,
      proposed_time: proposedTime || null,
      venue_id: venueId || null,
      message: message?.trim() || null,
      status: 'pending',
      created_by: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kunde inte skicka utmaning: ${res.status} ${text}`);
  }
  const data = await res.json();
  track('team_challenge_sent', { challenger_team_id: challengerTeamId, challenged_team_id: challengedTeamId, format: format || '5v5' });
  return data?.[0] || null;
}

/**
 * Accept a challenge — creates a match and updates challenge status
 */
export async function acceptTeamChallenge(challenge) {
  await waitForAuth();
  const userId = sessionStore.user?.id;
  if (!userId) throw new Error('Du måste vara inloggad');

  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };

  // Get venue external_id for pitch_id
  let pitchId = challenge.venue_id || 'team_match';
  if (challenge.venue_id) {
    const venueRes = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${challenge.venue_id}&select=id,external_id`, { method: 'GET', headers: await supabaseHeaders() });
    if (venueRes.ok) {
      const venues = await venueRes.json();
      if (venues[0]?.external_id) pitchId = venues[0].external_id;
    }
  }

  const startsAt = challenge.proposed_date && challenge.proposed_time
    ? `${challenge.proposed_date}T${challenge.proposed_time}:00`
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const matchRes = await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      created_by: userId,
      organizer_id: userId,
      pitch_id: pitchId,
      venue_id: challenge.venue_id || null,
      title: `${challenge.challengerTeam?.name || 'Lag A'} vs ${challenge.challengedTeam?.name || 'Lag B'}`,
      starts_at: startsAt,
      format: challenge.format || '5v5',
      max_players: getMaxPlayers(challenge.format || '5v5'),
      level: 'intermediate',
      is_public: true,
      is_spontaneous: false,
      is_team_match: true,
      team_a_id: challenge.challenger_team_id,
      team_b_id: challenge.challenged_team_id,
      status: 'upcoming',
      notes: challenge.message || null,
    }),
  });

  if (!matchRes.ok) {
    const text = await matchRes.text().catch(() => '');
    throw new Error(`Kunde inte skapa match: ${matchRes.status} ${text}`);
  }
  const matchRows = await matchRes.json();
  const match = matchRows?.[0];
  if (!match?.id) throw new Error('Match skapades men inget ID returnerades');

  await fetch(`${SUPABASE_URL}/rest/v1/team_challenges?id=eq.${challenge.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'accepted', match_id: match.id, updated_at: new Date().toISOString() }),
  });

  track('team_challenge_accepted', { challenge_id: challenge.id, match_id: match.id });
  return { match };
}

/**
 * Decline a challenge
 */
export async function declineTeamChallenge(challengeId) {
  await waitForAuth();
  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/team_challenges?id=eq.${challengeId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'declined', updated_at: new Date().toISOString() }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${res.status} ${t}`); }
  return true;
}

/**
 * Cancel a challenge (by challenger)
 */
export async function cancelTeamChallenge(challengeId) {
  await waitForAuth();
  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/team_challenges?id=eq.${challengeId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${res.status} ${t}`); }
  return true;
}

/**
 * Create an open team match (shows in feed, any team captain can join as opponent)
 */
export async function createTeamMatch({ team, venueId, venueExternalId, title, date, time, format, notes }) {
  await waitForAuth();
  const userId = sessionStore.user?.id;
  if (!userId) throw new Error('Du måste vara inloggad');

  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };
  const pitchId = venueExternalId || venueId;
  if (!pitchId) throw new Error('Välj en plan');
  const startsAt = date && time ? `${date}T${time}:00` : null;
  if (!startsAt) throw new Error('Datum och tid krävs');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      created_by: userId,
      organizer_id: userId,
      pitch_id: pitchId,
      venue_id: venueId || null,
      title: (title || `${team.name} söker motståndare`).trim(),
      starts_at: startsAt,
      format: format || '5v5',
      max_players: getMaxPlayers(format || '5v5'),
      level: 'intermediate',
      is_public: true,
      is_spontaneous: false,
      is_team_match: true,
      team_a_id: team.id,
      status: 'upcoming',
      notes: notes?.trim() || null,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kunde inte skapa match: ${res.status} ${text}`);
  }
  const rows = await res.json();
  return rows?.[0] || null;
}

/**
 * Get team matches (both as team_a and team_b) from matches table
 */
export async function getTeamMatches(teamId) {
  if (!teamId) return [];
  await waitForAuth();
  const headers = await supabaseHeaders();

  // Fetch matches + join venue name + team names via PostgREST embed
  const select = [
    '*',
    'venues(id,name,city)',
    'team_a:teams!team_a_id(id,name,team_color)',
    'team_b:teams!team_b_id(id,name,team_color)',
  ].join(',');

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?or=(team_a_id.eq.${teamId},team_b_id.eq.${teamId})&order=starts_at.desc&limit=50&select=${encodeURIComponent(select)}`,
    { method: 'GET', headers }
  );
  if (!res.ok) return [];
  const rows = await res.json();

  // Flatten embedded relations to flat fields TeamMatchesList expects
  return rows.map(m => ({
    ...m,
    team_a_name: m.team_a?.name || null,
    team_b_name: m.team_b?.name || null,
    venue_name: m.venues?.name || null,
    venue_city: m.venues?.city || null,
  }));
}

/**
 * Join an open team match as team B (captain only via RLS)
 */
export async function joinTeamMatchAsTeamB(matchId, teamId) {
  await waitForAuth();
  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ team_b_id: teamId }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Kunde inte ansluta: ${res.status} ${t}`); }
  return true;
}

/**
 * Accept a pending team member (captain only via RLS)
 */
export async function acceptTeamMember(teamId, memberId) {
  await waitForAuth();
  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${memberId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'active' }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Kunde inte godkänna: ${res.status} ${t}`); }
  return true;
}

/**
 * Remove a team member (captain or self)
 */
export async function removeTeamMember(teamId, memberId) {
  await waitForAuth();
  const headers = { ...(await supabaseHeaders()), Prefer: 'return=representation' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${memberId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'left' }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Kunde inte ta bort: ${res.status} ${t}`); }
  return true;
}