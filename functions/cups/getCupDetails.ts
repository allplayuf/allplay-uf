import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { canViewCup } from '../utils/cupPermissions.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse query parameters
    const url = new URL(req.url);
    const cupId = url.searchParams.get('cup_id');

    if (!cupId) {
      return Response.json({ 
        error: 'Cup ID is required' 
      }, { status: 400 });
    }

    // Fetch cup
    let cup;
    try {
      cup = await base44.entities.Cup.get(cupId);
    } catch (error) {
      return Response.json({ 
        error: 'Tournament not found' 
      }, { status: 404 });
    }

    // Check permissions
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (error) {
      // User not authenticated
    }

    if (user) {
      const canView = await canViewCup(base44, user, cup);
      if (!canView) {
        return Response.json({ 
          error: 'Forbidden',
          details: 'You do not have permission to view this tournament' 
        }, { status: 403 });
      }
    } else if (!cup.is_public) {
      return Response.json({ 
        error: 'This tournament is private' 
      }, { status: 403 });
    }

    // Fetch related data
    const [participants, groups, matches] = await Promise.all([
      base44.entities.CupParticipant.filter({ cup_id: cupId }),
      base44.entities.CupGroup.filter({ cup_id: cupId }),
      base44.entities.CupMatch.filter({ cup_id: cupId })
    ]);

    // Fetch brackets if playoffs enabled
    let brackets = [];
    if (cup.has_playoffs) {
      brackets = await base44.entities.CupBracket.filter({ cup_id: cupId });
    }

    // Fetch team/user details for participants
    const teamIds = participants.filter(p => p.team_id).map(p => p.team_id);
    const userIds = participants.filter(p => p.user_id).map(p => p.user_id);
    
    const teams = teamIds.length > 0 ? 
      await base44.entities.Team.list('name', 200) : [];
    const users = userIds.length > 0 ? 
      await base44.entities.User.list('full_name', 200) : [];

    const filteredTeams = teams.filter(t => teamIds.includes(t.id));
    const filteredUsers = users.filter(u => userIds.includes(u.id));

    // Enrich participants with team/user data
    const enrichedParticipants = participants.map(p => ({
      ...p,
      team: p.team_id ? filteredTeams.find(t => t.id === p.team_id) : null,
      user: p.user_id ? filteredUsers.find(u => u.id === p.user_id) : null
    }));

    return Response.json({ 
      success: true,
      cup,
      participants: enrichedParticipants,
      groups,
      matches,
      brackets,
      stats: {
        total_participants: participants.length,
        confirmed_participants: participants.filter(p => p.status === 'confirmed').length,
        pending_participants: participants.filter(p => p.status === 'pending').length,
        total_matches: matches.length,
        completed_matches: matches.filter(m => m.team_a_score !== null && m.team_b_score !== null).length
      }
    });

  } catch (error) {
    console.error('Error fetching cup details:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});