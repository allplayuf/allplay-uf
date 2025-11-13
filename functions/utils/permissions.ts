/**
 * Permission and authorization utilities
 * Centralized place for all permission checks
 */

/**
 * Check if user is admin
 */
export function isAdmin(user) {
  return user && user.role === 'admin';
}

/**
 * Check if user is team captain
 */
export async function isTeamCaptain(base44, userId, teamId) {
  try {
    const team = await base44.entities.Team.get(teamId);
    return team && team.captain_id === userId;
  } catch (error) {
    console.error('Error checking team captain:', error);
    return false;
  }
}

/**
 * Check if user is team vice captain
 */
export async function isTeamViceCaptain(base44, userId, teamId) {
  try {
    const team = await base44.entities.Team.get(teamId);
    return team && Array.isArray(team.vice_captain_ids) && team.vice_captain_ids.includes(userId);
  } catch (error) {
    console.error('Error checking vice captain:', error);
    return false;
  }
}

/**
 * Check if user is team captain or vice captain
 */
export async function isTeamLeader(base44, userId, teamId) {
  const isCaptain = await isTeamCaptain(base44, userId, teamId);
  if (isCaptain) return true;
  
  const isVice = await isTeamViceCaptain(base44, userId, teamId);
  return isVice;
}

/**
 * Check if user is a member of a team
 */
export async function isTeamMember(base44, userId, teamId) {
  try {
    const memberships = await base44.entities.TeamMember.filter({
      user_id: userId,
      team_id: teamId,
      status: 'active'
    });
    return memberships && memberships.length > 0;
  } catch (error) {
    console.error('Error checking team membership:', error);
    return false;
  }
}

/**
 * Check if user is match organizer
 */
export async function isMatchOrganizer(base44, userId, matchId) {
  try {
    const match = await base44.entities.Match.get(matchId);
    return match && match.organizer_id === userId;
  } catch (error) {
    console.error('Error checking match organizer:', error);
    return false;
  }
}

/**
 * Check if user is participating in a match
 */
export async function isMatchParticipant(base44, userId, matchId) {
  try {
    const participants = await base44.entities.MatchParticipant.filter({
      user_id: userId,
      match_id: matchId
    });
    return participants && participants.length > 0;
  } catch (error) {
    console.error('Error checking match participant:', error);
    return false;
  }
}

/**
 * Check if user can edit match
 * (must be organizer or admin)
 */
export async function canEditMatch(base44, user, matchId) {
  if (isAdmin(user)) return true;
  return await isMatchOrganizer(base44, user.id, matchId);
}

/**
 * Check if user can edit team
 * (must be captain, vice captain, or admin)
 */
export async function canEditTeam(base44, user, teamId) {
  if (isAdmin(user)) return true;
  return await isTeamLeader(base44, user.id, teamId);
}

/**
 * Check if user can delete match
 * (must be organizer or admin)
 */
export async function canDeleteMatch(base44, user, matchId) {
  return await canEditMatch(base44, user, matchId);
}

/**
 * Check if user can delete team
 * (must be captain or admin)
 */
export async function canDeleteTeam(base44, user, teamId) {
  if (isAdmin(user)) return true;
  return await isTeamCaptain(base44, user.id, teamId);
}

/**
 * Check if user can access private match
 * (must be organizer, participant, or admin)
 */
export async function canAccessPrivateMatch(base44, user, match) {
  if (isAdmin(user)) return true;
  if (match.organizer_id === user.id) return true;
  return await isMatchParticipant(base44, user.id, match.id);
}

/**
 * Check if user can report match result
 * (must be participant or organizer)
 */
export async function canReportMatchResult(base44, user, matchId) {
  if (isAdmin(user)) return true;
  
  const isOrganizer = await isMatchOrganizer(base44, user.id, matchId);
  if (isOrganizer) return true;
  
  return await isMatchParticipant(base44, user.id, matchId);
}

/**
 * Check if user can send team message
 * (must be team member)
 */
export async function canSendTeamMessage(base44, user, teamId) {
  if (isAdmin(user)) return true;
  return await isTeamMember(base44, user.id, teamId);
}

/**
 * Check if user can view team
 * (must be public team or user is member)
 */
export async function canViewTeam(base44, user, team) {
  if (team.is_public) return true;
  if (isAdmin(user)) return true;
  return await isTeamMember(base44, user.id, team.id);
}

/**
 * Check if user can invite to team
 * (must be captain or vice captain)
 */
export async function canInviteToTeam(base44, user, teamId) {
  if (isAdmin(user)) return true;
  return await isTeamLeader(base44, user.id, teamId);
}

/**
 * Rate limiting check (simple in-memory implementation)
 * In production, use Redis or similar
 */
const rateLimitMap = new Map();

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return { allowed: true, remaining: maxRequests - recentRequests.length };
}

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000;
  
  for (const [identifier, requests] of rateLimitMap.entries()) {
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    if (recentRequests.length === 0) {
      rateLimitMap.delete(identifier);
    } else {
      rateLimitMap.set(identifier, recentRequests);
    }
  }
}, 60000); // Clean up every minute