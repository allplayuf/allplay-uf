/**
 * Permissions utility for AllPlay
 * Handles admin, CUP_ADMIN, and guest permissions
 */

// Permission contexts
export const CONTEXTS = {
  CUP: 'cup',
  USER_MANAGEMENT: 'user_management',
  MODERATION: 'moderation',
  VENUE: 'venue',
  MATCH: 'match',
  TEAM: 'team',
  ANALYTICS: 'analytics',
  SYSTEM: 'system'
};

// Actions
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  MODERATE: 'moderate'
};

/**
 * Check if user has a specific custom role
 */
export function hasCustomRole(user, roleName) {
  if (!user) return false;
  return user.custom_roles?.includes(roleName) || false;
}

/**
 * Check if user is full admin
 */
export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Check if user is CUP_ADMIN
 */
export function isCupAdmin(user) {
  return hasCustomRole(user, 'CUP_ADMIN');
}

/**
 * Check if user is moderator
 */
export function isModerator(user) {
  return hasCustomRole(user, 'MODERATOR');
}

/**
 * Check if user is guest (not authenticated)
 */
export function isGuest(user) {
  return !user || user.is_guest === true;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user) {
  return !isGuest(user);
}

/**
 * Main permission checker
 * @param {Object} user - Current user object
 * @param {string} action - Action to perform (from ACTIONS)
 * @param {string} context - Context of the action (from CONTEXTS)
 * @returns {boolean} - Whether user has permission
 */
export function can(user, action, context) {
  // Guests can only READ, nothing else
  if (isGuest(user)) {
    return action === ACTIONS.READ;
  }

  // Full admins can do everything
  if (isAdmin(user)) {
    return true;
  }

  // CUP_ADMIN has full access in CUP context
  if (context === CONTEXTS.CUP && isCupAdmin(user)) {
    return true;
  }

  // MODERATOR can moderate content (reports)
  if (context === CONTEXTS.MODERATION && isModerator(user)) {
    return [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.MODERATE].includes(action);
  }

  // Regular authenticated users can read and create/update their own content
  if (isAuthenticated(user)) {
    // Users can create matches, teams, etc.
    if ([CONTEXTS.MATCH, CONTEXTS.TEAM].includes(context) && 
        [ACTIONS.CREATE, ACTIONS.READ].includes(action)) {
      return true;
    }
    
    // Users can read most things
    if (action === ACTIONS.READ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can manage cups
 */
export function canManageCups(user) {
  return can(user, ACTIONS.MANAGE, CONTEXTS.CUP);
}

/**
 * Check if user can moderate content
 */
export function canModerate(user) {
  return can(user, ACTIONS.MODERATE, CONTEXTS.MODERATION);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(user) {
  return isAdmin(user); // Only full admins
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(user) {
  return isAdmin(user) || isCupAdmin(user) || isModerator(user);
}

/**
 * Get available admin tabs for user
 */
export function getAvailableAdminTabs(user) {
  const tabs = [];

  if (isAdmin(user)) {
    // Full admin sees everything
    return ['reports', 'users', 'matches', 'teams', 'venues', 'analytics', 'notifications'];
  }

  if (isModerator(user)) {
    tabs.push('reports');
  }

  if (isCupAdmin(user)) {
    // CUP_ADMIN only sees cup-related content
    // We'll handle this in the Cup pages directly
  }

  return tabs;
}