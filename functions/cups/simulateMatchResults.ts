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
      return Response.json({ error: 'Cup ID is required' }, { status: 400 });
    }

    // Get cup and verify permissions
    const cup = await base44.entities.Cup.get(cup_id);
    
    const isOrganizer = cup.organizer_id === user.id;
    const isAdmin = user.role === 'admin';
    
    if (!isOrganizer && !isAdmin) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You do not have permission to simulate results' 
      }, { status: 403 });
    }

    // Get all cup matches
    const cupMatches = await base44.asServiceRole.entities.CupMatch.filter({ cup_id });
    const groups = await base44.asServiceRole.entities.CupGroup.filter({ cup_id });

    // Helper function to generate realistic score
    const generateScore = () => {
      const rand = Math.random();
      if (rand < 0.15) return 0; // Low scoring
      if (rand < 0.35) return 1;
      if (rand < 0.55) return 2;
      if (rand < 0.75) return 3;
      if (rand < 0.90) return 4;
      return 5; // High scoring
    };

    // 1. SIMULATE GROUP STAGE MATCHES
    const groupMatches = cupMatches.filter(m => m.stage === 'group');
    
    for (const cupMatch of groupMatches) {
      const teamAScore = generateScore();
      const teamBScore = generateScore();
      const winnerId = teamAScore > teamBScore ? cupMatch.team_a_id : 
                       teamBScore > teamAScore ? cupMatch.team_b_id : null;

      // Update CupMatch
      await base44.asServiceRole.entities.CupMatch.update(cupMatch.id, {
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        winner_id: winnerId
      });

      // Update Match entity
      await base44.asServiceRole.entities.Match.update(cupMatch.match_id, {
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }

    // 2. UPDATE GROUP STANDINGS
    for (const group of groups) {
      const standings = {};
      
      // Initialize standings
      for (const teamId of group.team_ids) {
        standings[teamId] = {
          team_id: teamId,
          team_name: group.standings?.find(s => s.team_id === teamId)?.team_name || 'Lag',
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0
        };
      }

      // Calculate standings from matches
      const groupMatchResults = groupMatches.filter(m => m.group_id === group.id);
      
      for (const match of groupMatchResults) {
        const teamA = standings[match.team_a_id];
        const teamB = standings[match.team_b_id];
        
        if (teamA && teamB) {
          teamA.matches_played++;
          teamB.matches_played++;
          teamA.goals_for += match.team_a_score;
          teamA.goals_against += match.team_b_score;
          teamB.goals_for += match.team_b_score;
          teamB.goals_against += match.team_a_score;

          if (match.team_a_score > match.team_b_score) {
            teamA.wins++;
            teamA.points += 3;
            teamB.losses++;
          } else if (match.team_b_score > match.team_a_score) {
            teamB.wins++;
            teamB.points += 3;
            teamA.losses++;
          } else {
            teamA.draws++;
            teamB.draws++;
            teamA.points++;
            teamB.points++;
          }

          teamA.goal_difference = teamA.goals_for - teamA.goals_against;
          teamB.goal_difference = teamB.goals_for - teamB.goals_against;
        }
      }

      // Sort standings by points, then goal difference
      const sortedStandings = Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goal_difference - a.goal_difference;
      });

      // Update group with standings
      await base44.asServiceRole.entities.CupGroup.update(group.id, {
        standings: sortedStandings
      });
    }

    // 3. POPULATE PLAYOFF BRACKETS WITH QUALIFIED TEAMS
    if (cup.has_playoffs) {
      const brackets = await base44.asServiceRole.entities.CupBracket.filter({ cup_id });
      const advancingTeamsPerGroup = cup.teams_advance_per_group || 2;

      // Get qualified teams from each group
      const qualifiedTeams = [];
      for (const group of groups) {
        const updatedGroup = await base44.asServiceRole.entities.CupGroup.get(group.id);
        const topTeams = updatedGroup.standings.slice(0, advancingTeamsPerGroup);
        qualifiedTeams.push(...topTeams.map(t => t.team_id));
      }

      // Determine first stage of playoffs
      const firstStage = brackets.length === 8 ? 'quarterfinal' : 
                        brackets.length === 4 ? 'semifinal' : 'final';

      // Assign teams to first playoff stage
      const firstStageBrackets = brackets.filter(b => b.stage === firstStage);
      for (let i = 0; i < firstStageBrackets.length && i * 2 + 1 < qualifiedTeams.length; i++) {
        await base44.asServiceRole.entities.CupBracket.update(firstStageBrackets[i].id, {
          team_a_id: qualifiedTeams[i * 2],
          team_b_id: qualifiedTeams[i * 2 + 1],
          team_a_name: groups.flatMap(g => g.standings).find(s => s.team_id === qualifiedTeams[i * 2])?.team_name,
          team_b_name: groups.flatMap(g => g.standings).find(s => s.team_id === qualifiedTeams[i * 2 + 1])?.team_name
        });
      }

      // 4. SIMULATE PLAYOFF MATCHES
      const stages = ['quarterfinal', 'semifinal', 'bronze', 'final'];
      
      for (const stage of stages) {
        const stageBrackets = brackets.filter(b => b.stage === stage);
        
        for (const bracket of stageBrackets) {
          // Skip if teams not assigned yet
          if (!bracket.team_a_id || !bracket.team_b_id) continue;

          const teamAScore = generateScore();
          const teamBScore = generateScore();
          
          // For playoffs, no draws allowed - simulate extra time if needed
          let finalTeamAScore = teamAScore;
          let finalTeamBScore = teamBScore;
          let extraTime = false;
          let penalties = false;
          let penaltyScore = null;

          if (teamAScore === teamBScore) {
            extraTime = true;
            // Extra time - small chance for goal
            const extraGoal = Math.random();
            if (extraGoal < 0.4) {
              finalTeamAScore++;
            } else if (extraGoal < 0.8) {
              finalTeamBScore++;
            } else {
              // Penalties
              penalties = true;
              const penA = Math.floor(Math.random() * 3) + 3; // 3-5
              const penB = penA === Math.floor(Math.random() * 3) + 3 ? penA + 1 : Math.floor(Math.random() * 3) + 3;
              penaltyScore = penA > penB ? `${penA}-${penB}` : `${penB}-${penA}`;
              if (penA > penB) {
                finalTeamAScore++; // Symbolisk vinst
              } else {
                finalTeamBScore++;
              }
            }
          }

          const winnerId = finalTeamAScore > finalTeamBScore ? bracket.team_a_id : bracket.team_b_id;

          // Create or update playoff match
          if (bracket.cup_match_id) {
            // Update existing
            const existingCupMatch = await base44.asServiceRole.entities.CupMatch.get(bracket.cup_match_id);
            
            await base44.asServiceRole.entities.CupMatch.update(bracket.cup_match_id, {
              team_a_score: finalTeamAScore,
              team_b_score: finalTeamBScore,
              extra_time: extraTime,
              penalties: penalties,
              penalty_score: penaltyScore,
              winner_id: winnerId
            });

            if (existingCupMatch.match_id) {
              await base44.asServiceRole.entities.Match.update(existingCupMatch.match_id, {
                team_a_score: finalTeamAScore,
                team_b_score: finalTeamBScore,
                status: 'completed',
                completed_at: new Date().toISOString()
              });
            }
          }

          // Update bracket with winner
          await base44.asServiceRole.entities.CupBracket.update(bracket.id, {
            winner_id: winnerId
          });

          // Advance winner to next stage (if not final)
          if (stage !== 'final' && stage !== 'bronze') {
            const nextStage = stage === 'quarterfinal' ? 'semifinal' : 'final';
            const nextBrackets = brackets.filter(b => b.stage === nextStage);
            
            // Find which next bracket this winner should go to
            const nextBracketIndex = Math.floor(stageBrackets.indexOf(bracket) / 2);
            if (nextBrackets[nextBracketIndex]) {
              const isFirstSlot = stageBrackets.indexOf(bracket) % 2 === 0;
              const updateField = isFirstSlot ? 'team_a_id' : 'team_b_id';
              const nameField = isFirstSlot ? 'team_a_name' : 'team_b_name';
              
              const winnerName = groups.flatMap(g => g.standings).find(s => s.team_id === winnerId)?.team_name;
              
              await base44.asServiceRole.entities.CupBracket.update(nextBrackets[nextBracketIndex].id, {
                [updateField]: winnerId,
                [nameField]: winnerName
              });
            }
          }
        }
      }
    }

    // Update cup status to completed
    await base44.asServiceRole.entities.Cup.update(cup_id, {
      status: 'completed'
    });

    return Response.json({ 
      success: true,
      message: 'Match results simulated successfully',
      group_matches: groupMatches.length,
      playoff_matches: cupMatches.length - groupMatches.length
    });

  } catch (error) {
    console.error('Error simulating results:', error);
    return Response.json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, { status: 500 });
  }
});