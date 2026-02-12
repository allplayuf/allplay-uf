/**
 * Privacy masking utility
 * 
 * Applies privacy rules to player data before display.
 * - Own profile: always full info
 * - is_public === false: mask name, avatar, username
 * - is_public !== false: show normally
 */

/**
 * Mask a player object for display based on privacy settings.
 * @param {object} player - Raw player data
 * @param {string|null} currentUserId - Logged-in user's ID
 * @returns {object} - Player with privacy applied
 */
export function applyPrivacy(player, currentUserId) {
  if (!player) return player;

  // Own profile – always full info
  if (currentUserId && player.id === currentUserId) return player;

  // Public profile – show normally
  if (player.is_public !== false) return player;

  // Private profile – mask identifying info
  return {
    ...player,
    full_name: 'Okänd användare',
    display_name: 'Okänd användare',
    username: null,
    avatar_url: null,
    profile_image_url: null,
    city: null,
    _isPrivate: true
  };
}

/**
 * Get the best avatar URL from a player object.
 * Handles multiple field names used across the app.
 */
export function getAvatarUrl(player) {
  if (!player) return null;
  return player.avatar_url || player.profile_image_url || null;
}