import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated and is admin/organizer
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ error: 'Cup ID is required' }, { status: 400 });
    }

    // Get cup details
    const cupDetailsResponse = await base44.functions.invoke('cups/getCupDetails', { cup_id });
    const cupDetails = cupDetailsResponse.data;

    if (!cupDetails.success) {
      return Response.json({ error: 'Failed to fetch cup details' }, { status: 500 });
    }

    const { cup, participants, groups, matches, stats } = cupDetails;
    
    // Check permissions
    if (cup.organizer_id !== user.id && user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden',
        details: 'Only organizer or admin can get AI insights' 
      }, { status: 403 });
    }

    const confirmedCount = participants.filter(p => p.status === 'confirmed' || p.status === 'active').length;
    const groupCount = groups.length;
    const completedMatches = matches.filter(m => m.team_a_score !== null).length;
    const totalMatches = matches.length;

    // Prepare data for AI analysis
    const analysisContext = {
      cup_name: cup.name,
      total_teams: confirmedCount,
      current_groups: groupCount,
      teams_per_group: groupCount > 0 ? Math.floor(confirmedCount / groupCount) : 0,
      total_matches: totalMatches,
      completed_matches: completedMatches,
      match_completion_rate: totalMatches > 0 ? (completedMatches / totalMatches * 100).toFixed(1) : 0,
      format: cup.format,
      start_date: cup.start_date,
      end_date: cup.end_date,
      has_groups: groupCount > 0,
      has_playoffs: cup.has_playoffs || false,
      groups_summary: groups.map(g => ({
        name: g.name,
        teams_count: g.team_ids?.length || 0,
        matches_played: matches.filter(m => m.group_id === g.id && m.team_a_score !== null).length
      }))
    };

    // Build comprehensive prompt for AI
    const prompt = `Du är en expert på fotbollsturneringar och turneringsplanering. Analysera följande turnering och ge strategiska insikter:

**Turneringsinformation:**
- Namn: ${analysisContext.cup_name}
- Antal lag: ${analysisContext.total_teams}
- Format: ${analysisContext.format}
- Period: ${analysisContext.start_date} till ${analysisContext.end_date}
- Nuvarande grupper: ${analysisContext.current_groups}
- Lag per grupp (genomsnitt): ${analysisContext.teams_per_group}
- Matcher slutförda: ${analysisContext.completed_matches}/${analysisContext.total_matches} (${analysisContext.match_completion_rate}%)
- Har slutspel: ${analysisContext.has_playoffs ? 'Ja' : 'Nej'}

**Gruppöversikt:**
${analysisContext.groups_summary.map(g => `- ${g.name}: ${g.teams_count} lag, ${g.matches_played} matcher spelade`).join('\n')}

**Uppdrag:**
1. **Gruppindelning:** Föreslå det optimala antalet grupper och lag per grupp baserat på totalt ${analysisContext.total_teams} lag. Förklara varför detta är bäst.

2. **Slutspelsstrategi:** Om gruppspelet är klart eller nästan klart, analysera topplagen och ge rekommendationer för seedning i slutspelet. Föreslå matchningar som ger spännande matcher.

3. **Schemaläggning:** Identifiera potentiella flaskhalsar eller problem i spelschemat (t.ex. för många matcher per dag, ojämn fördelning). Ge konkreta lösningar.

4. **Allmänna förbättringar:** Ge ytterligare strategiska råd för att göra turneringen mer framgångsrik och underhållande.

Var konkret, praktisk och fokusera på genomförbara åtgärder. Svara på svenska.`;

    // Call AI for insights
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          group_optimization: {
            type: "object",
            properties: {
              recommended_groups: { type: "integer" },
              teams_per_group: { type: "integer" },
              reasoning: { type: "string" }
            }
          },
          playoff_recommendations: {
            type: "object",
            properties: {
              seeding_strategy: { type: "string" },
              key_matchups: { type: "array", items: { type: "string" } },
              notes: { type: "string" }
            }
          },
          schedule_analysis: {
            type: "object",
            properties: {
              bottlenecks: { type: "array", items: { type: "string" } },
              solutions: { type: "array", items: { type: "string" } },
              optimization_tips: { type: "string" }
            }
          },
          general_insights: {
            type: "string"
          }
        }
      }
    });

    return Response.json({ 
      success: true,
      insights: aiResponse,
      context: analysisContext
    });

  } catch (error) {
    console.error('Error getting AI insights:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});