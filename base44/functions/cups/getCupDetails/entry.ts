import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ 
        error: 'Cup ID is required' 
      }, { status: 400 });
    }

    // Fetch cup
    let cup;
    try {
      cup = await base44.entities.Cup.get(cup_id);
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

    // Check if user can view this cup
    if (!cup.is_public && user?.id !== cup.organizer_id && user?.role !== 'admin') {
      return Response.json({ 
        error: 'This tournament is private' 
      }, { status: 403 });
    }

    // Fetch related data
    const [participants, groups, cupMatches, brackets] = await Promise.all([
      base44.entities.CupParticipant.filter({ cup_id }),
      base44.entities.CupGroup.filter({ cup_id }),
      base44.entities.CupMatch.filter({ cup_id }),
      cup.has_playoffs ? base44.entities.CupBracket.filter({ cup_id }) : []
    ]);

    // Fetch team/user details for participants - OPTIMIZED with service role
    const teamIds = [...new Set(participants.filter(p => p.team_id).map(p => p.team_id))];
    const userIds = [...new Set(participants.filter(p => p.user_id).map(p => p.user_id))];
    
    // Only fetch what we need
    const teamPromises = teamIds.map(id => 
      base44.asServiceRole.entities.Team.get(id).catch(() => null)
    );
    const userPromises = userIds.map(id => 
      base44.asServiceRole.entities.User.get(id).catch(() => null)
    );
    
    const [teams, users] = await Promise.all([
      teamIds.length > 0 ? Promise.all(teamPromises) : [],
      userIds.length > 0 ? Promise.all(userPromises) : []
    ]);

    const filteredTeams = teams.filter(Boolean);
    const filteredUsers = users.filter(Boolean);

    // --- FETCH TEAM MEMBERS FOR CUP TEAMS ---
    let teamMembersMap = {};
    let memberUsersMap = {};

    if (teamIds.length > 0) {
        // Fetch active members for all teams involved
        const teamMembersPromises = teamIds.map(id => 
            base44.asServiceRole.entities.TeamMember.filter({ team_id: id, status: 'active' })
        );
        const teamMembersResults = await Promise.all(teamMembersPromises);
        
        teamIds.forEach((id, index) => {
            teamMembersMap[id] = teamMembersResults[index];
        });

        // Collect user IDs from members to fetch their details
        const memberUserIds = new Set();
        Object.values(teamMembersMap).flat().forEach(m => memberUserIds.add(m.user_id));
        
        // Fetch user details for members
        const allMemberUserIds = [...memberUserIds];
        const memberUserPromises = allMemberUserIds.map(id => 
            base44.asServiceRole.entities.User.get(id).catch(() => null)
        );
        const memberUsers = await Promise.all(memberUserPromises);
        
        memberUsers.filter(Boolean).forEach(u => {
            memberUsersMap[u.id] = u;
        });
    }
    // ----------------------------------------

    // Enrich participants with team/user data AND team members
    const enrichedParticipants = participants.map(p => {
      const team = p.team_id ? filteredTeams.find(t => t.id === p.team_id) : null;
      let team_members = [];
      
      if (team) {
          const members = teamMembersMap[team.id] || [];
          team_members = members.map(m => ({
              ...m,
              user: memberUsersMap[m.user_id]
          })).filter(m => m.user); // Only include if user found
      }

      return {
        ...p,
        team,
        team_members,
        user: p.user_id ? filteredUsers.find(u => u.id === p.user_id) : null
      };
    });

    // Fetch match details for cup matches - OPTIMIZED
    const matchIds = cupMatches.map(cm => cm.match_id).filter(Boolean);
    const matchPromises = matchIds.map(id => 
      base44.asServiceRole.entities.Match.get(id).catch(() => null)
    );
    
    const filteredMatches = matchIds.length > 0 
      ? (await Promise.all(matchPromises)).filter(Boolean)
      : [];

    // Enrich cup matches with match details
    const enrichedMatches = cupMatches.map(cm => {
      const matchDetails = filteredMatches.find(m => m.id === cm.match_id);
      const teamA = cm.team_a_id ? filteredTeams.find(t => t.id === cm.team_a_id) : null;
      const teamB = cm.team_b_id ? filteredTeams.find(t => t.id === cm.team_b_id) : null;
      
      return {
        ...cm,
        match: matchDetails,
        team_a_name: teamA?.name || 'TBD',
        team_b_name: teamB?.name || 'TBD',
        date: matchDetails?.date,
        time: matchDetails?.time,
        venue_name: matchDetails?.venue_name
      };
    });

    // Enrich groups with team names in standings
    const enrichedGroups = groups.map(group => {
      const standings = (group.standings || []).map(standing => {
        const team = filteredTeams.find(t => t.id === standing.team_id);
        return {
          ...standing,
          team_name: team?.name || 'Unknown Team'
        };
      });

      return {
        ...group,
        standings
      };
    });

    // Calculate stats
    const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
    const pendingParticipants = participants.filter(p => p.status === 'pending');
    const completedMatches = enrichedMatches.filter(m => m.team_a_score !== null);

    // Enrich brackets with team names
    const enrichedBrackets = brackets.map(bracket => {
      const teamA = bracket.team_a_id ? filteredTeams.find(t => t.id === bracket.team_a_id) : null;
      const teamB = bracket.team_b_id ? filteredTeams.find(t => t.id === bracket.team_b_id) : null;
      
      return {
        ...bracket,
        team_a_name: teamA?.name || bracket.team_a_name || 'TBD',
        team_b_name: teamB?.name || bracket.team_b_name || 'TBD'
      };
    });

    return Response.json({ 
      success: true,
      cup,
      participants: enrichedParticipants,
      groups: enrichedGroups,
      matches: enrichedMatches,
      brackets: enrichedBrackets,
      stats: {
        total_participants: participants.length,
        confirmed_participants: confirmedParticipants.length,
        pending_participants: pendingParticipants.length,
        total_matches: enrichedMatches.length,
        completed_matches: completedMatches.length
      }
    });

  } catch (error) {
    console.error('Error fetching cup details:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});