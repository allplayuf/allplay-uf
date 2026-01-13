/**
 * Backend Permission System for AllPlay
 * Mirror of frontend permissions for server-side validation
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
// PERMISSION CONTEXTS
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
// ============================================
const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: {
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
    [CONTEXTS.MATCH]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE],
    [CONTEXTS.TEAM]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.JOIN, ACTIONS.LEAVE, ACTIONS.INVITE],
    [CONTEXTS.CUP]: [ACTIONS.READ, ACTIONS.JOIN],
    [CONTEXTS.VENUE]: [ACTIONS.READ],
    [CONTEXTS.CHAT]: [ACTIONS.CREATE, ACTIONS.READ],
    [CONTEXTS.FRIENDS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.DELETE, ACTIONS.INVITE],
    [CONTEXTS.PROFILE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]
  },
  
  [ROLES.GUEST]: {
    [CONTEXTS.MATCH]: [ACTIONS.READ],
    [CONTEXTS.TEAM]: [ACTIONS.READ],
    [CONTEXTS.CUP]: [ACTIONS.READ],
    [CONTEXTS.VENUE]: [ACTIONS.READ],
    [CONTEXTS.PROFILE]: [ACTIONS.READ]
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function isGuest(user) {
  return !user || user.is_guest === true;
}

export function isAuthenticated(user) {
  return !isGuest(user);
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function hasCustomRole(user, roleName) {
  if (!user) return false;
  return user.custom_roles?.includes(roleName.toUpperCase()) || false;
}

export function isCupAdmin(user) {
  return hasCustomRole(user, 'CUP_ADMIN');
}

export function isModerator(user) {
  return hasCustomRole(user, 'MODERATOR');
}

export function isVenueManager(user) {
  return hasCustomRole(user, 'VENUE_MANAGER');
}

export function getEffectiveRole(user) {
  if (isGuest(user)) return ROLES.GUEST;
  if (isAdmin(user)) return ROLES.ADMIN;
  if (isCupAdmin(user)) return ROLES.CUP_ADMIN;
  if (isModerator(user)) return ROLES.MODERATOR;
  if (isVenueManager(user)) return ROLES.VENUE_MANAGER;
  return ROLES.USER;
}

// ============================================
// MAIN PERMISSION CHECKER
// ============================================

export function can(user, action, context) {
  const role = getEffectiveRole(user);
  const permissions = PERMISSION_MATRIX[role];
  
  if (!permissions) return false;
  if (!permissions[context]) return false;
  
  return permissions[context].includes(action);
}

// ============================================
// BACKEND ENFORCEMENT HELPERS
// ============================================

/**
 * Require authentication - throws error if guest
 */
export function requireAuth(user) {
  if (isGuest(user)) {
    throw new Error('Authentication required');
  }
}

/**
 * Require permission - throws error if not allowed
 */
export function requirePermission(user, action, context) {
  if (!can(user, action, context)) {
    throw new Error(`Permission denied: ${action} on ${context}`);
  }
}

/**
 * Require admin - throws error if not admin
 */
export function requireAdmin(user) {
  if (!isAdmin(user)) {
    throw new Error('Admin access required');
  }
}

/**
 * Create permission check response for unauthorized
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 });
}

/**
 * Create permission check response for forbidden
 */
export function forbiddenResponse(message = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 });
}