import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ 
        error: 'Cup ID is required' 
      }, { status: 400 });
    }

    // Get cup and verify permissions
    const cup = await base44.entities.Cup.get(cup_id);
    
    const isOrganizer = cup.organizer_id === user.id;
    const isAdmin = user.role === 'admin';
    
    if (!isOrganizer && !isAdmin) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You do not have permission to create schedule' 
      }, { status: 403 });
    }

    // CHECK: Venue måste finnas
    if (!cup.venue_ids || cup.venue_ids.length === 0) {
      return Response.json({ 
        error: 'No venue selected',
        details: 'Du måste välja en plan för turneringen först. Gå till Redigera och välj en plan.'
      }, { status: 400 });
    }

    // Get groups and confirmed participants using service role
    const groups = await base44.asServiceRole.entities.CupGroup.filter({ cup_id });
    const participants = await base44.asServiceRole.entities.CupParticipant.filter({
      cup_id,
      status: 'confirmed'
    });

    if (participants.length < 4) {
      return Response.json({ 
        error: 'Not enough participants',
        details: 'At least 4 participants required to create schedule'
      }, { status: 400 });
    }

    // Distribute teams into groups evenly
    const teamIds = participants.map(p => p.team_id || p.user_id);
    const shuffledTeams = [...teamIds].sort(() => Math.random() - 0.5); // Shuffle for fair distribution
    const teamsPerGroup = Math.ceil(shuffledTeams.length / groups.length);
    
    for (let i = 0; i < groups.length; i++) {
      const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
      
      // Update group with teams
      await base44.asServiceRole.entities.CupGroup.update(groups[i].id, {
        team_ids: groupTeams,
        standings: groupTeams.map(teamId => ({
          team_id: teamId,
          team_name: participants.find(p => (p.team_id === teamId) || (p.user_id === teamId))?.team?.name || 'Lag',
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0
        }))
      });

      // Update participants with group assignment
      for (const teamId of groupTeams) {
        const participant = participants.find(p => 
          (p.team_id === teamId) || (p.user_id === teamId)
        );
        if (participant) {
          await base44.asServiceRole.entities.CupParticipant.update(participant.id, {
            group_id: groups[i].id
          });
        }
      }

      // Create round-robin matches for this group
      const matchPairs = [];
      for (let j = 0; j < groupTeams.length; j++) {
        for (let k = j + 1; k < groupTeams.length; k++) {
          matchPairs.push({
            team_a_id: groupTeams[j],
            team_b_id: groupTeams[k]
          });
        }
      }

      // Create match entities with intelligent scheduling
      const startDate = new Date(cup.start_date);
      let currentDate = new Date(startDate);
      
      // Parse daily time constraints
      const [startHour, startMinute] = (cup.start_time || "10:00").split(':').map(Number);
      const [endHour, endMinute] = (cup.end_time || "20:00").split(':').map(Number);
      
      // Set initial time for the first day
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      const matchDuration = cup.match_duration || 15;
      const breakDuration = 5; // 5 min break between matches
      
      for (let m = 0; m < matchPairs.length; m++) {
        // Check if next match fits in today's schedule
        // If current time + duration > end time, move to next day
        const matchEndTimeHour = currentHour + Math.floor((currentMinute + matchDuration) / 60);
        const matchEndTimeMinute = (currentMinute + matchDuration) % 60;
        
        const isPastEndTime = matchEndTimeHour > endHour || (matchEndTimeHour === endHour && matchEndTimeMinute > endMinute);
        
        if (isPastEndTime) {
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
            currentHour = startHour;
            currentMinute = startMinute;
        }

        // Format time string HH:mm
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        // Prepare for next match time
        currentMinute += matchDuration + breakDuration;
        currentHour += Math.floor(currentMinute / 60);
        currentMinute %= 60;
        
        // Get team names for match title
        const teamAParticipant = participants.find(p => 
          (p.team_id === matchPairs[m].team_a_id) || (p.user_id === matchPairs[m].team_a_id)
        );
        const teamBParticipant = participants.find(p => 
          (p.team_id === matchPairs[m].team_b_id) || (p.user_id === matchPairs[m].team_b_id)
        );
        
        const teamAName = teamAParticipant?.team?.name || teamAParticipant?.user?.full_name || 'Lag A';
        const teamBName = teamBParticipant?.team?.name || teamBParticipant?.user?.full_name || 'Lag B';

        // Create regular match first using service role - FIX: Använd första venue_id som STRING
        const match = await base44.asServiceRole.entities.Match.create({
          title: `${cup.name} - ${groups[i].name}`,
          venue_id: cup.venue_ids[0], // FIX: Alltid en string nu
          organizer_id: cup.organizer_id,
          date: currentDate.toISOString().split('T')[0],
          time: timeString,
          duration_minutes: matchDuration,
          format: cup.format,
          max_players: cup.format === '5v5' ? 10 : cup.format === '7v7' ? 14 : 22,
          is_team_match: true,
          is_ranked: false,
          status: 'upcoming',
          team_a_id: matchPairs[m].team_a_id,
          team_b_id: matchPairs[m].team_b_id
        });

        // Create cup match reference
        await base44.asServiceRole.entities.CupMatch.create({
          cup_id,
          match_id: match.id,
          stage: 'group',
          group_id: groups[i].id,
          team_a_id: matchPairs[m].team_a_id,
          team_b_id: matchPairs[m].team_b_id,
          team_a_name: teamAName,
          team_b_name: teamBName
        });
      }
    }

    // Create playoff brackets if enabled
    if (cup.has_playoffs) {
      const advancingTeamsPerGroup = cup.teams_advance_per_group || 2;
      const totalAdvancing = groups.length * advancingTeamsPerGroup;

      // Determine playoff stages needed based on number of advancing teams
      let stages = [];
      if (totalAdvancing === 16) stages = ['round_of_16', 'quarterfinal', 'semifinal', 'final', 'bronze'];
      else if (totalAdvancing === 8) stages = ['quarterfinal', 'semifinal', 'final', 'bronze'];
      else if (totalAdvancing === 4) stages = ['semifinal', 'final', 'bronze'];
      else if (totalAdvancing === 2) stages = ['final'];

      // Create bracket placeholders
      for (const stage of stages) {
        const numMatches = stage === 'final' || stage === 'bronze' ? 1 :
                          stage === 'semifinal' ? 2 :
                          stage === 'quarterfinal' ? 4 : 8;

        for (let i = 0; i < numMatches; i++) {
          await base44.asServiceRole.entities.CupBracket.create({
            cup_id,
            stage,
            position: i + 1,
            team_a_id: null, // TBD - filled when group stage completes
            team_b_id: null  // TBD - filled when group stage completes
          });
        }
      }
    }

    // Update cup status
    await base44.asServiceRole.entities.Cup.update(cup_id, {
      status: 'ongoing'
    });

    return Response.json({ 
      success: true,
      message: 'Schedule created successfully',
      groups_created: groups.length,
      matches_created: true
    });

  } catch (error) {
    console.error('Error creating schedule:', error);
    return Response.json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, { status: 500 });
  }
});