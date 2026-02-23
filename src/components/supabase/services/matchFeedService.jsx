/**
 * Match Feed Service — Single-request enriched feed
 * 
 * Combines: matches + participants + participant avatars
 * into one call so MatchCard can render complete on first paint.
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';
import { primeUsers, fetchUsersMissing } from './userCache';
import { transformMatchData } from './matchesQueries';

/**
 * Fetch enriched match feed in a single logical request.
 * Returns { matches, participantsByMatch, userAvatars }
 * 
 * @param {object} options
 * @param {string} [options.status] - 'upcoming' etc.
 * @returns {Promise<{matches: Array, participantsByMatch: Object, userAvatars: Object, myMatchIds: Set}>}
 */
export async function getMatchFeedEnriched(options = {}) {
  await waitForAuth();
  
  const config = await getSupabaseConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (config.anonKey) headers['apikey'] = config.anonKey;
  if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;

  // 1. Fetch matches
  let queryParams = 'select=*&order=starts_at.asc';
  if (options.status) queryParams += `&status=eq.${options.status}`;

  const matchesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/public_matches?${queryParams}`,
    { method: 'GET', headers }
  );

  if (!matchesRes.ok) {
    throw new Error(`Failed to fetch matches: ${matchesRes.status}`);
  }

  const rawMatches = await matchesRes.json();
  const matches = (rawMatches || []).map(transformMatchData);
  const matchIds = matches.map(m => m.id).filter(Boolean);

  if (matchIds.length === 0) {
    return { matches: [], participantsByMatch: {}, userAvatars: {}, myMatchIds: new Set() };
  }

  // 2. Fetch ALL participants for these matches + my match IDs in parallel
  const participantsPromise = (async () => {
    // Batch in groups of 100 IDs to stay under URL length limits
    const chunks = [];
    for (let i = 0; i < matchIds.length; i += 100) {
      chunks.push(matchIds.slice(i, i + 100));
    }

    let allParticipants = [];
    for (const chunk of chunks) {
      const idsParam = `(${chunk.join(',')})`;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/match_participants?match_id=in.${idsParam}&select=id,match_id,user_id,status,team`,
        { method: 'GET', headers }
      );
      if (res.ok) {
        const data = await res.json();
        allParticipants = allParticipants.concat(data);
      }
    }
    return allParticipants;
  })();

  // My participant IDs (only if authenticated)
  const myMatchIdsPromise = sessionStore.user?.id ? (async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?user_id=eq.${sessionStore.user.id}&select=match_id`,
      { method: 'GET', headers }
    );
    if (!res.ok) return [];
    return (await res.json()).map(p => p.match_id);
  })() : Promise.resolve([]);

  const [allParticipants, myMatchIdsList] = await Promise.all([participantsPromise, myMatchIdsPromise]);

  // 3. Group participants by match
  const participantsByMatch = {};
  allParticipants.forEach(p => {
    if (!participantsByMatch[p.match_id]) participantsByMatch[p.match_id] = [];
    participantsByMatch[p.match_id].push(p);
  });

  // 4. Collect unique user IDs for avatar resolution (max 5 per match for preview)
  const userIdsForAvatars = new Set();
  Object.values(participantsByMatch).forEach(participants => {
    participants.slice(0, 5).forEach(p => {
      if (p.user_id) userIdsForAvatars.add(p.user_id);
    });
  });

  // 5. Fetch all user avatars in one batch via userCache
  const userAvatars = {};
  if (userIdsForAvatars.size > 0) {
    const userMap = await fetchUsersMissing([...userIdsForAvatars]);
    userMap.forEach((user, id) => {
      userAvatars[id] = {
        id: user.id,
        display_name: user.display_name || user.full_name || 'Spelare',
        avatar_url: user.avatar_url || user.profile_image_url || null,
      };
    });
  }

  return {
    matches,
    participantsByMatch,
    userAvatars,
    myMatchIds: new Set(myMatchIdsList),
  };
}