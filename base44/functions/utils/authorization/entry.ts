/**
 * Authorization Utility
 * Validates user permissions for various actions
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Check if user is authenticated
 */
export async function requireAuth(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return { base44, user };
}

/**
 * Check if user is admin
 */
export async function requireAdmin(req) {
  const { base44, user } = await requireAuth(req);
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return { base44, user };
}

/**
 * Check if user owns a match (is organizer)
 */
export async function requireMatchOwnership(req, matchId) {
  const { base44, user } = await requireAuth(req);
  
  const match = await base44.asServiceRole.entities.Match.get(matchId);
  
  if (!match) {
    throw new Error('Match not found');
  }
  
  if (match.organizer_id !== user.id && user.role !== 'admin') {
    throw new Error('You do not have permission to modify this match');
  }
  
  return { base44, user, match };
}

/**
 * Check if user owns a team (is captain)
 */
export async function requireTeamOwnership(req, teamId) {
  const { base44, user } = await requireAuth(req);
  
  const team = await base44.asServiceRole.entities.Team.get(teamId);
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  if (team.captain_id !== user.id && user.role !== 'admin') {
    throw new Error('You do not have permission to modify this team');
  }
  
  return { base44, user, team };
}

/**
 * Check if user owns a cup (is organizer)
 */
export async function requireCupOwnership(req, cupId) {
  const { base44, user } = await requireAuth(req);
  
  const cup = await base44.asServiceRole.entities.Cup.get(cupId);
  
  if (!cup) {
    throw new Error('Cup not found');
  }
  
  if (cup.organizer_id !== user.id && user.role !== 'admin') {
    throw new Error('You do not have permission to modify this cup');
  }
  
  return { base44, user, cup };
}

/**
 * Check if user is team captain or admin
 */
export async function requireTeamCaptainOrAdmin(req, teamId) {
  const { base44, user } = await requireAuth(req);
  
  if (user.role === 'admin') {
    return { base44, user, isAdmin: true };
  }
  
  const team = await base44.asServiceRole.entities.Team.get(teamId);
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  if (team.captain_id !== user.id) {
    throw new Error('Team captain access required');
  }
  
  return { base44, user, team, isAdmin: false };
}