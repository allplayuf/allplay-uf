/**
 * Permission utilities specific to Cup/Tournament system
 */
import { isAdmin } from './permissions.js';

/**
 * Check if user is cup organizer
 */
export async function isCupOrganizer(base44, userId, cupId) {
  try {
    const cup = await base44.entities.Cup.get(cupId);
    return cup && cup.organizer_id === userId;
  } catch (error) {
    console.error('Error checking cup organizer:', error);
    return false;
  }
}

/**
 * Check if user can edit cup
 * (must be organizer or admin)
 */
export async function canEditCup(base44, user, cupId) {
  if (isAdmin(user)) return true;
  return await isCupOrganizer(base44, user.id, cupId);
}

/**
 * Check if user can manage cup signups
 * (must be organizer or admin)
 */
export async function canManageCupSignups(base44, user, cupId) {
  return await canEditCup(base44, user, cupId);
}

/**
 * Check if user/team is participating in cup
 */
export async function isCupParticipant(base44, userId, cupId, teamId = null) {
  try {
    const participants = await base44.entities.CupParticipant.filter({ cup_id: cupId });
    
    if (teamId) {
      // Check team participation
      return participants.some(p => p.team_id === teamId && p.status === 'confirmed');
    } else {
      // Check individual participation
      return participants.some(p => p.user_id === userId && p.status === 'confirmed');
    }
  } catch (error) {
    console.error('Error checking cup participant:', error);
    return false;
  }
}

/**
 * Check if user can enter cup match results
 * (must be organizer, admin, or participant)
 */
export async function canEnterCupMatchResult(base44, user, cupMatchId) {
  if (isAdmin(user)) return true;
  
  try {
    const cupMatch = await base44.entities.CupMatch.get(cupMatchId);
    const cup = await base44.entities.Cup.get(cupMatch.cup_id);
    
    // Check if organizer
    if (cup.organizer_id === user.id) return true;
    
    // Check if participant in this match
    const isTeamA = await isCupParticipant(base44, user.id, cupMatch.cup_id, cupMatch.team_a_id);
    const isTeamB = await isCupParticipant(base44, user.id, cupMatch.cup_id, cupMatch.team_b_id);
    
    return isTeamA || isTeamB;
  } catch (error) {
    console.error('Error checking cup match result permission:', error);
    return false;
  }
}

/**
 * Check if cup registration is open
 */
export async function isCupRegistrationOpen(base44, cupId) {
  try {
    const cup = await base44.entities.Cup.get(cupId);
    
    if (cup.status !== 'registration_open') return false;
    
    // Check if deadline has passed
    if (cup.registration_deadline) {
      const deadline = new Date(cup.registration_deadline);
      if (new Date() > deadline) return false;
    }
    
    // Check if max participants reached
    if (cup.max_participants && cup.current_participants >= cup.max_participants) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking cup registration:', error);
    return false;
  }
}

/**
 * Check if user can signup to cup
 */
export async function canSignupToCup(base44, user, cupId, teamId = null) {
  // Check if registration is open
  const isOpen = await isCupRegistrationOpen(base44, cupId);
  if (!isOpen) return { allowed: false, reason: 'Registration is closed' };
  
  // Check if already signed up
  const isParticipant = await isCupParticipant(base44, user.id, cupId, teamId);
  if (isParticipant) return { allowed: false, reason: 'Already registered' };
  
  // Check if user is team captain (for team signups)
  if (teamId) {
    try {
      const team = await base44.entities.Team.get(teamId);
      if (team.captain_id !== user.id && !team.vice_captain_ids?.includes(user.id)) {
        return { allowed: false, reason: 'Only team captain or vice captain can register' };
      }
    } catch (error) {
      return { allowed: false, reason: 'Invalid team' };
    }
  }
  
  return { allowed: true };
}

/**
 * Check if user can view cup
 * (public cups are visible to all, private cups only to participants)
 */
export async function canViewCup(base44, user, cup) {
  if (cup.is_public) return true;
  if (isAdmin(user)) return true;
  if (cup.organizer_id === user.id) return true;
  
  return await isCupParticipant(base44, user.id, cup.id);
}

/**
 * Check if user can send cup announcement
 * (must be organizer or admin)
 */
export async function canSendCupAnnouncement(base44, user, cupId) {
  return await canEditCup(base44, user, cupId);
}