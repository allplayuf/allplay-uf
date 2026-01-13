/**
 * Custom Role & Permission System for AllPlay
 * Independent of Base44's built-in role system
 * 
 * Roles:
 * - ADMIN: Full access to everything
 * - CUP_ADMIN: Full access to cups/tournaments only
 * - MODERATOR: Can moderate reports and content
 * - VENUE_MANAGER: Can manage venues
 * - USER: Standard authenticated user
 * - GUEST: Read-only access (non-authenticated)
 */

// ============================================
// ROLE DEFINITIONS
// ============================================
export const ROLES = {
  ADMIN: 'admin',
  CUP_ADMIN: 'cup_admin',
  MODERATOR: 'moderator',
  VENUE_MANAGER: 'venue_manager',
  USER: 'user',
  GUEST: 'guest'
};

// ============================================
// PERMISSION CONTEXTS (Areas of the app)
// ============================================
export const CONTEXTS = {
  CUP: 'cup',
  USER_MANAGEMENT: 'user_management',
  MODERATION: 'moderation',
  VENUE: 'venue',
  MATCH: 'match',
  TEAM: 'team',
  ANALYTICS: 'analytics',
  SYSTEM: 'system',
  CHAT: 'chat',
  FRIENDS: 'friends',
  PROFILE: 'profile'
};

// ============================================
// ACTIONS
// ============================================
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  MODERATE: 'moderate',
  JOIN: 'join',
  LEAVE: 'leave',
  INVITE: 'invite'
};

// ============================================
// PERMISSION MATRIX
// Defines what each role can do in each context
// ============================================
const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: {
    // Full access to everything
    [CONTEXTS.CUP]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.MANAGE],
    [CONTEXTS.USER_MANAGEMENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.MANAGE],
    [CONTEXTS.MODERATION]: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.MODERATE],
    [CONTEXTS.VENUE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.MANAGE],
    [CONTEXTS.MATCH]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.JOIN, ACTIONS.LEAVE],
    [CONTEXTS.TEAM]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.JOIN, ACTIONS.LEAVE, ACTIONS.INVITE],
    [CONTEXTS.ANALYTICS]: [ACTIONS.READ],
    [CONTEXTS.SYSTEM]: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.MANAGE],
    [CONTEXTS.CHAT]: [ACTIONS.CREATE, ACTIONS.READ],
    [CONTEXTS.FRIENDS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.DELETE, ACTIONS.INVITE],
    [CONTEXTS.PROFILE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]
  },
  
  [ROLES.CUP_ADMIN]: {
    // Only cup-related permissions
    [CONTEXTS.CUP]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.MANAGE],
    [CONTEXTS.MATCH]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.JOIN, ACTIONS.LEAVE],
    [CONTEXTS.TEAM]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.JOIN, ACTIONS.LEAVE, ACTIONS.INVITE],
    [CONTEXTS.VENUE]: [ACTIONS.READ],
    [CONTEXTS.CHAT]: [ACTIONS.CREATE, ACTIONS.READ],
    [CONTEXTS.FRIENDS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.DELETE, ACTIONS.INVITE],
    [CONTEXTS.PROFILE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]
  },
  
  [ROLES.MODERATOR]: {
    [CONTEXTS.MODERATION]: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.MODERATE],
    [CONTEXTS.MATCH]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE],
    [CONTEXTS.TEAM]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE, ACTIONS.INVITE],
    [CONTEXTS.CUP]: [ACTIONS.READ],
    [CONTEXTS.VENUE]: [ACTIONS.READ],
    [CONTEXTS.CHAT]: [ACTIONS.CREATE, ACTIONS.READ],
    [CONTEXTS.FRIENDS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.DELETE, ACTIONS.INVITE],
    [CONTEXTS.PROFILE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]
  },
  
  [ROLES.VENUE_MANAGER]: {
    [CONTEXTS.VENUE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [CONTEXTS.MATCH]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE],
    [CONTEXTS.TEAM]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE, ACTIONS.INVITE],
    [CONTEXTS.CUP]: [ACTIONS.READ],
    [CONTEXTS.CHAT]: [ACTIONS.CREATE, ACTIONS.READ],
    [CONTEXTS.FRIENDS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.DELETE, ACTIONS.INVITE],
    [CONTEXTS.PROFILE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]
  },
  
  [ROLES.USER]: {
    // Standard authenticated user
    [CONTEXTS.MATCH]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE],
    [CONTEXTS.TEAM]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE, ACTIONS.INVITE],
    [CONTEXTS.CUP]: [ACTIONS.READ, ACTIONS.JOIN],
    [CONTEXTS.VENUE]: [ACTIONS.READ],
    [CONTEXTS.CHAT]: [ACTIONS.CREATE, ACTIONS.READ],
    [CONTEXTS.FRIENDS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.DELETE, ACTIONS.INVITE],
    [CONTEXTS.PROFILE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]
  },
  
  [ROLES.GUEST]: {
    // Read-only access, NO interactions
    [CONTEXTS.MATCH]: [ACTIONS.READ],
    [CONTEXTS.TEAM]: [ACTIONS.READ],
    [CONTEXTS.CUP]: [ACTIONS.READ],
    [CONTEXTS.VENUE]: [ACTIONS.READ],
    [CONTEXTS.PROFILE]: [ACTIONS.READ]
    // NO chat, friends, join, create, etc.
  }
};

// ============================================
// ROLE DETECTION FUNCTIONS
// ============================================

/**
 * Check if user is a guest (not authenticated)
 */
export function isGuest(user) {
  return !user || user.is_guest === true || user.role === 'guest';
}

/**
 * Check if user is authenticated (not a guest)
 */
export function isAuthenticated(user) {
  return !isGuest(user);
}

/**
 * Check if user is full admin
 */
export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Check if user has a specific custom role
 */
export function hasCustomRole(user, roleName) {
  if (!user) return false;
  return user.custom_roles?.includes(roleName.toUpperCase()) || false;
}

/**
 * Check if user is CUP_ADMIN
 */
export function isCupAdmin(user) {
  return hasCustomRole(user, 'CUP_ADMIN');
}

/**
 * Check if user is MODERATOR
 */
export function isModerator(user) {
  return hasCustomRole(user, 'MODERATOR');
}

/**
 * Check if user is VENUE_MANAGER
 */
export function isVenueManager(user) {
  return hasCustomRole(user, 'VENUE_MANAGER');
}

/**
 * Get user's effective role (highest privilege role)
 */
export function getEffectiveRole(user) {
  if (isGuest(user)) return ROLES.GUEST;
  if (isAdmin(user)) return ROLES.ADMIN;
  if (isCupAdmin(user)) return ROLES.CUP_ADMIN;
  if (isModerator(user)) return ROLES.MODERATOR;
  if (isVenueManager(user)) return ROLES.VENUE_MANAGER;
  return ROLES.USER;
}

/**
 * Get all roles a user has
 */
export function getUserRoles(user) {
  if (isGuest(user)) return [ROLES.GUEST];
  
  const roles = [ROLES.USER]; // All authenticated users have USER role
  
  if (isAdmin(user)) roles.push(ROLES.ADMIN);
  if (isCupAdmin(user)) roles.push(ROLES.CUP_ADMIN);
  if (isModerator(user)) roles.push(ROLES.MODERATOR);
  if (isVenueManager(user)) roles.push(ROLES.VENUE_MANAGER);
  
  return roles;
}

// ============================================
// MAIN PERMISSION CHECKER
// ============================================

/**
 * Check if user can perform an action in a context
 * @param {Object} user - User object
 * @param {string} action - Action from ACTIONS
 * @param {string} context - Context from CONTEXTS
 * @returns {boolean}
 */
export function can(user, action, context) {
  const role = getEffectiveRole(user);
  const permissions = PERMISSION_MATRIX[role];
  
  if (!permissions) return false;
  if (!permissions[context]) return false;
  
  return permissions[context].includes(action);
}

/**
 * Check if user can perform ANY of the given actions in a context
 */
export function canAny(user, actions, context) {
  return actions.some(action => can(user, action, context));
}

/**
 * Check if user can perform ALL of the given actions in a context
 */
export function canAll(user, actions, context) {
  return actions.every(action => can(user, action, context));
}

// ============================================
// CONVENIENCE PERMISSION FUNCTIONS
// ============================================

// Match permissions
export function canJoinMatch(user) {
  return can(user, ACTIONS.JOIN, CONTEXTS.MATCH);
}

export function canCreateMatch(user) {
  return can(user, ACTIONS.CREATE, CONTEXTS.MATCH);
}

export function canLeaveMatch(user) {
  return can(user, ACTIONS.LEAVE, CONTEXTS.MATCH);
}

// Team permissions
export function canJoinTeam(user) {
  return can(user, ACTIONS.JOIN, CONTEXTS.TEAM);
}

export function canCreateTeam(user) {
  return can(user, ACTIONS.CREATE, CONTEXTS.TEAM);
}

export function canInviteToTeam(user) {
  return can(user, ACTIONS.INVITE, CONTEXTS.TEAM);
}

// Cup permissions
export function canManageCups(user) {
  return can(user, ACTIONS.MANAGE, CONTEXTS.CUP);
}

export function canJoinCup(user) {
  return can(user, ACTIONS.JOIN, CONTEXTS.CUP);
}

// Friend/Social permissions
export function canAddFriends(user) {
  return can(user, ACTIONS.CREATE, CONTEXTS.FRIENDS);
}

export function canInviteFriends(user) {
  return can(user, ACTIONS.INVITE, CONTEXTS.FRIENDS);
}

// Chat permissions
export function canChat(user) {
  return can(user, ACTIONS.CREATE, CONTEXTS.CHAT);
}

// Moderation permissions
export function canModerate(user) {
  return can(user, ACTIONS.MODERATE, CONTEXTS.MODERATION);
}

// User management
export function canManageUsers(user) {
  return can(user, ACTIONS.MANAGE, CONTEXTS.USER_MANAGEMENT);
}

// Venue management
export function canManageVenues(user) {
  return can(user, ACTIONS.MANAGE, CONTEXTS.VENUE);
}

// Profile
export function canEditProfile(user) {
  return can(user, ACTIONS.UPDATE, CONTEXTS.PROFILE);
}

// ============================================
// ADMIN PANEL ACCESS
// ============================================

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(user) {
  return isAdmin(user) || isCupAdmin(user) || isModerator(user);
}

/**
 * Get available admin tabs for user based on their role
 */
export function getAvailableAdminTabs(user) {
  if (isAdmin(user)) {
    return ['reports', 'users', 'matches', 'teams', 'venues', 'analytics', 'notifications'];
  }
  
  const tabs = [];
  
  if (isModerator(user)) {
    tabs.push('reports');
  }
  
  // CUP_ADMIN is handled separately via CupAdminTabs
  
  return tabs;
}

// ============================================
// GUEST MODE HELPERS
// ============================================

/**
 * Get guest-blocked features list
 */
export function getGuestBlockedFeatures() {
  return [
    'join_match',
    'create_match', 
    'add_friend',
    'chat',
    'join_team',
    'create_team',
    'join_cup',
    'edit_profile',
    'invite'
  ];
}

/**
 * Check if a feature is blocked for guests
 */
export function isGuestBlocked(user, feature) {
  if (!isGuest(user)) return false;
  return getGuestBlockedFeatures().includes(feature);
}

/**
 * Require authentication - returns true if action should be blocked for guests
 * Use this before protected actions
 */
export function requireAuth(user, redirectToLogin = null) {
  if (isGuest(user)) {
    if (redirectToLogin) {
      // Import dynamically to avoid circular deps
      import('@/api/base44Client').then(({ base44 }) => {
        base44.auth.redirectToLogin(redirectToLogin);
      });
    }
    return true; // Action is blocked
  }
  return false; // Action is allowed
}