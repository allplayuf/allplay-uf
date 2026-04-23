/**
 * Friendships Service — SINGLE SOURCE OF TRUTH for friends.
 *
 * Primary: Supabase REST (RLS enforced).
 * Fallback: Base44 Friendship entity — triggered automatically on 404/4xx
 *          if the Supabase table doesn't exist or permissions deny.
 *
 * Schema (both backends share the same shape):
 *   - id, requester_id, addressee_id, status ('pending'|'accepted'|'blocked')
 */

import { getAuthHeaders, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';
import { base44 } from '@/api/base44Client';

// Use Base44 when Supabase REST returns these — the table likely doesn't exist.
const SHOULD_FALLBACK = (status) => status === 404 || status === 406 || status === 400;

async function rest(path, { method = 'GET', body, prefer } = {}) {
  await waitForAuth();
  const headers = await getAuthHeaders();
  if (prefer) headers['Prefer'] = prefer;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`REST ${method} ${path} failed: ${res.status} – ${text.slice(0, 200)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  // DELETE with no content
  if (res.status === 204) return true;

  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

/**
 * Get all friendships involving current user (both directions).
 * Falls back to Base44 if the Supabase table is unavailable.
 */
export async function getMyFriendships() {
  const uid = sessionStore.user?.id;
  if (!uid) return [];

  try {
    const q = `friendships?or=(requester_id.eq.${uid},addressee_id.eq.${uid})&select=*&order=created_date.desc`;
    const rows = await rest(q);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    if (SHOULD_FALLBACK(err.status)) {
      console.warn('[friendshipsService] Supabase unavailable, using Base44 fallback');
      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: uid }).catch(() => []),
        base44.entities.Friendship.filter({ addressee_id: uid }).catch(() => []),
      ]);
      const map = new Map();
      [...sent, ...received].forEach(f => f?.id && map.set(f.id, f));
      return Array.from(map.values());
    }
    throw err;
  }
}

/**
 * Find an existing friendship between current user and target.
 */
function findExisting(friendships, myId, targetId) {
  return (friendships || []).find(
    (f) =>
      (f.requester_id === myId && f.addressee_id === targetId) ||
      (f.requester_id === targetId && f.addressee_id === myId)
  );
}

/**
 * Send a friend request OR accept an incoming one automatically.
 * Returns { action: 'created' | 'accepted' | 'already_friends' | 'already_sent' }
 */
export async function sendFriendRequest(targetUserId) {
  const uid = sessionStore.user?.id;
  if (!uid) {
    const err = new Error('Du måste vara inloggad för att lägga till vänner.');
    err.status = 401;
    throw err;
  }
  if (uid === targetUserId) {
    throw new Error('Du kan inte lägga till dig själv som vän.');
  }

  // Check existing friendship first — prevents duplicate-row errors.
  const all = await getMyFriendships();
  const existing = findExisting(all, uid, targetUserId);

  if (existing) {
    if (existing.status === 'accepted') {
      return { action: 'already_friends', friendship: existing };
    }
    if (existing.status === 'pending') {
      if (existing.requester_id === uid) {
        return { action: 'already_sent', friendship: existing };
      }
      // They sent me a request — auto-accept.
      try {
        const updated = await rest(`friendships?id=eq.${existing.id}`, {
          method: 'PATCH',
          body: { status: 'accepted' },
          prefer: 'return=representation',
        });
        return { action: 'accepted', friendship: Array.isArray(updated) ? updated[0] : updated };
      } catch (err) {
        if (SHOULD_FALLBACK(err.status)) {
          await base44.entities.Friendship.update(existing.id, { status: 'accepted' });
          return { action: 'accepted', friendship: { ...existing, status: 'accepted' } };
        }
        throw err;
      }
    }
    if (existing.status === 'blocked') {
      throw new Error('Kan inte skicka vänförfrågan.');
    }
  }

  // Create new request.
  try {
    const created = await rest('friendships', {
      method: 'POST',
      body: {
        requester_id: uid,
        addressee_id: targetUserId,
        status: 'pending',
      },
      prefer: 'return=representation',
    });
    return { action: 'created', friendship: Array.isArray(created) ? created[0] : created };
  } catch (err) {
    if (SHOULD_FALLBACK(err.status)) {
      console.warn('[friendshipsService] Supabase POST failed, using Base44 fallback');
      const created = await base44.entities.Friendship.create({
        requester_id: uid,
        addressee_id: targetUserId,
        status: 'pending',
      });
      return { action: 'created', friendship: created };
    }
    throw err;
  }
}

/**
 * Accept a pending friend request by id. Falls back to Base44 on failure.
 */
export async function acceptFriendRequest(friendshipId) {
  try {
    const updated = await rest(`friendships?id=eq.${friendshipId}`, {
      method: 'PATCH',
      body: { status: 'accepted' },
      prefer: 'return=representation',
    });
    return Array.isArray(updated) ? updated[0] : updated;
  } catch (err) {
    if (SHOULD_FALLBACK(err.status)) {
      return await base44.entities.Friendship.update(friendshipId, { status: 'accepted' });
    }
    throw err;
  }
}

export async function declineFriendRequest(friendshipId) {
  try {
    return await rest(`friendships?id=eq.${friendshipId}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
  } catch (err) {
    if (SHOULD_FALLBACK(err.status)) {
      return await base44.entities.Friendship.delete(friendshipId);
    }
    throw err;
  }
}

export async function removeFriendship(friendshipId) {
  return declineFriendRequest(friendshipId);
}

/**
 * Get the friendship row between two users (if any).
 */
export async function getFriendshipBetween(userAId, userBId) {
  const q = `friendships?or=(and(requester_id.eq.${userAId},addressee_id.eq.${userBId}),and(requester_id.eq.${userBId},addressee_id.eq.${userAId}))&limit=1`;
  const rows = await rest(q);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/**
 * Helper: derive friendship status from a friendships list for a target user.
 * Returns: 'none' | 'accepted' | 'pending_outgoing' | 'pending_incoming' | 'blocked'
 */
export function getFriendshipStatus(friendships, myId, targetId) {
  if (!myId || !targetId || myId === targetId) return 'self';
  const f = findExisting(friendships, myId, targetId);
  if (!f) return 'none';
  if (f.status === 'accepted') return 'accepted';
  if (f.status === 'blocked') return 'blocked';
  if (f.status === 'pending') {
    return f.requester_id === myId ? 'pending_outgoing' : 'pending_incoming';
  }
  return 'none';
}