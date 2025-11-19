/**
 * System Statistics Endpoint
 * Returns database stats and health metrics for admin dashboard
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAdmin } from '../utils/authorization.js';
import { withErrorHandler, successResponse } from '../utils/errorHandler.js';

const handler = async (req, logger) => {
  // Only admins can access system stats
  const { base44 } = await requireAdmin(req);
  
  logger.info('Fetching system statistics');
  
  // Fetch counts in parallel for performance
  const [
    users,
    matches,
    venues,
    teams,
    cups,
    participants,
    teamMembers
  ] = await Promise.all([
    base44.asServiceRole.entities.User.list(),
    base44.asServiceRole.entities.Match.list(),
    base44.asServiceRole.entities.Venue.list(),
    base44.asServiceRole.entities.Team.filter({ is_active: true }),
    base44.asServiceRole.entities.Cup.list(),
    base44.asServiceRole.entities.MatchParticipant.list(),
    base44.asServiceRole.entities.TeamMember.filter({ status: 'active' })
  ]);
  
  // Calculate match statistics
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  
  // Calculate user statistics
  const activeUsers = users.filter(u => {
    // User active if they have matches in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return participants.some(p => 
      p.user_id === u.id && 
      matches.find(m => m.id === p.match_id && new Date(m.date) > thirtyDaysAgo)
    );
  });
  
  // Calculate cup statistics
  const activeCups = cups.filter(c => 
    c.status === 'registration_open' || 
    c.status === 'ongoing'
  );
  
  const stats = {
    users: {
      total: users.length,
      active: activeUsers.length,
      admins: users.filter(u => u.role === 'admin').length
    },
    matches: {
      total: matches.length,
      upcoming: upcomingMatches.length,
      ongoing: ongoingMatches.length,
      completed: completedMatches.length,
      averageParticipants: matches.length > 0 
        ? (participants.length / matches.length).toFixed(1) 
        : 0
    },
    venues: {
      total: venues.length,
      verified: venues.filter(v => v.is_verified).length,
      withMatches: venues.filter(v => 
        matches.some(m => m.venue_id === v.id && m.status === 'upcoming')
      ).length
    },
    teams: {
      total: teams.length,
      withMembers: teams.filter(t => t.current_members > 1).length,
      averageMembers: teams.length > 0 
        ? (teamMembers.length / teams.length).toFixed(1) 
        : 0
    },
    cups: {
      total: cups.length,
      active: activeCups.length,
      completed: cups.filter(c => c.status === 'completed').length
    }
  };
  
  return successResponse({ stats });
};

Deno.serve(withErrorHandler(handler, 'system-stats'));