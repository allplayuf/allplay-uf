/**
 * Friendships Service — SINGLE SOURCE OF TRUTH for friends.
 *
 * All writes AND reads go through the `friendships_action` edge function,
 * which uses service role to read/write the Supabase `friendships` table.
 * This bypasses RLS issues and the missing-table 404s we were hitting.
 *
 * Schema:
 *   - id, requester_id, addressee_id, status ('pending'|'accepted'|'blocked')
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { sessionStore } from '../client';
import { track } from '@/lib/analytics';

const FN = 'friendships_action';

/**
 * Get all friendships involving current user (both directions).
 */
export async function getMyFriendships() {
  const uid = sessionStore.user?.id;
  if (!uid) return [];
  try {
    const res = await callEdgeFunction(FN, { action: 'list' });
    return Array.isArray(res?.friendships) ? res.friendships : [];
  } catch (err) {
    console.warn('[friendshipsService] list failed:', err.message);
    return [];
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
 * Returns { action: 'created' | 'accepted' | 'already_friends' | 'already_sent', friendship }
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

  const result = await callEdgeFunction(FN, { action: 'send', target_id: targetUserId });
  track('friend_request_sent', { result: result?.action || 'created' });
  return result;
}

/**
 * Accept a pending friend request by id.
 */
export async function acceptFriendRequest(friendshipId) {
  const res = await callEdgeFunction(FN, { action: 'accept', friendship_id: friendshipId });
  track('friend_request_accepted');
  return res?.friendship;
}

/**
 * Decline/delete a friend request or remove an existing friendship.
 */
export async function declineFriendRequest(friendshipId) {
  const result = await callEdgeFunction(FN, { action: 'decline', friendship_id: friendshipId });
  track('friend_request_declined');
  return result;
}

export async function removeFriendship(friendshipId) {
  return declineFriendRequest(friendshipId);
}

/**
 * Get the friendship row between two users (if any).
 * Derived from the current user's friendship list.
 */
export async function getFriendshipBetween(userAId, userBId) {
  const all = await getMyFriendships();
  return findExisting(all, userAId, userBId) || null;
}

/**
 * Helper: derive friendship status from a friendships list for a target user.
 * Returns: 'none' | 'accepted' | 'pending_outgoing' | 'pending_incoming' | 'blocked' | 'self'
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