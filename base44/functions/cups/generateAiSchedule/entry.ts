import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { GenerateJson } from 'https://deno.land/x/openai_json_client@v1.0.0/mod.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ error: 'Missing cup_id' }, { status: 400 });
    }

    // Fetch cup details
    const cup = await base44.entities.Cup.get(cup_id);
    if (!cup) {
      return Response.json({ error: 'Cup not found' }, { status: 404 });
    }

    if (cup.organizer_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch participants (Teams)
    const participants = await base44.entities.CupParticipant.filter({ cup_id: cup_id, status: 'confirmed' });
    const teamIds = participants.map(p => p.team_id).filter(id => id);
    
    if (teamIds.length < 2) {
      return Response.json({ error: 'Not enough confirmed teams to generate schedule (min 2).' }, { status: 400 });
    }

    // Fetch actual team names for better prompting
    const teams = [];
    for (const tid of teamIds) {
      const t = await base44.entities.Team.get(tid);
      if (t) teams.push({ id: t.id, name: t.name });
    }

    // Construct Prompt
    const prompt = `
      You are a tournament scheduler. Create a balanced schedule for a football tournament.
      
      **Inputs:**
      - Tournament Name: ${cup.name}
      - Teams: ${JSON.stringify(teams)}
      - Start Date: ${cup.start_date || new Date().toISOString().split('T')[0]}
      - End Date: ${cup.end_date || new Date().toISOString().split('T')[0]}
      - Format: ${teamIds.length > 5 ? "Group Stage + Single Elimination Playoffs" : "Round Robin (League)"}
      
      **Requirements:**
      1. If > 5 teams, create groups (Group A, Group B, etc.) and generate group stage matches.
      2. If <= 5 teams, put everyone in "Group A" and play everyone once.
      3. Generate specific dates and times for matches within the start/end date range. Assume matches take 60 mins. Start matches at 10:00, 11:00, etc.
      4. Return a JSON object with:
         - "groups": Array of { name: string, team_ids: string[] }
         - "matches": Array of { 
             team_a_id: string, 
             team_b_id: string, 
             group_name: string (optional), 
             stage: "group" | "quarterfinal" | "semifinal" | "final",
             date: string (YYYY-MM-DD),
             time: string (HH:MM)
           }
      
      **Output Format:**
      JSON only. No text.
    `;

    // Call LLM via Base44 Integration
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          groups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                team_ids: { type: "array", items: { type: "string" } }
              },
              required: ["name", "team_ids"]
            }
          },
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                team_a_id: { type: "string" },
                team_b_id: { type: "string" },
                group_name: { type: "string" },
                stage: { type: "string" },
                date: { type: "string" },
                time: { type: "string" }
              },
              required: ["team_a_id", "team_b_id", "stage", "date", "time"]
            }
          }
        },
        required: ["groups", "matches"]
      }
    });

    const schedule = aiResponse; // InvokeLLM returns parsed object if schema provided

    if (!schedule || !schedule.groups || !schedule.matches) {
        throw new Error("Invalid AI response");
    }

    // --- Data Persistence ---

    // 1. Clear existing groups/matches (Optional? Let's keep it simple and additive or warn user. Admin panel handles warning.)
    // For this implementation, we assume clean slate or appending.
    
    // 2. Create Groups
    const groupIdMap = {}; // name -> id
    for (const g of schedule.groups) {
      const newGroup = await base44.entities.CupGroup.create({
        cup_id: cup.id,
        name: g.name,
        team_ids: g.team_ids,
        standings: g.team_ids.map(tid => ({
            team_id: tid,
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
      groupIdMap[g.name] = newGroup.id;
      
      // Update participants with group_id
      for (const tid of g.team_ids) {
          // Find participant record
          const p = participants.find(par => par.team_id === tid);
          if (p) {
              await base44.entities.CupParticipant.update(p.id, { group_id: newGroup.id });
          }
      }
    }

    // 3. Create Matches
    let matchesCreated = 0;
    for (const m of schedule.matches) {
      // Create the base Match entity
      const matchData = {
        title: `${teams.find(t=>t.id===m.team_a_id)?.name || 'Lag A'} vs ${teams.find(t=>t.id===m.team_b_id)?.name || 'Lag B'}`,
        venue_id: cup.venue_ids?.[0], // Default to first venue or null
        organizer_id: user.id,
        date: m.date,
        time: m.time,
        format: "7v7", // Default or from cup settings
        duration_minutes: 60,
        is_cup_match: true, // IMPORTANT
        is_team_match: true,
        team_a_id: m.team_a_id,
        team_b_id: m.team_b_id,
        status: 'upcoming'
      };
      
      const newMatch = await base44.entities.Match.create(matchData);

      // Link to CupMatch
      await base44.entities.CupMatch.create({
        cup_id: cup.id,
        match_id: newMatch.id,
        stage: m.stage || 'group',
        group_id: m.group_name ? groupIdMap[m.group_name] : null,
        team_a_id: m.team_a_id,
        team_b_id: m.team_b_id,
      });
      
      matchesCreated++;
    }

    return Response.json({ 
      success: true, 
      groups_created: schedule.groups.length,
      matches_created: matchesCreated,
      details: schedule
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});