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

    // Enhanced AI prompt with more context and better instructions
    const prompt = `Du är en EXPERT på fotbollsturneringar, turneringsplanering och knockout-system. Analysera följande turnering DJUPGÅENDE och ge KONKRETA, GENOMFÖRBARA strategiska insikter:

**📊 TURNERINGSINFORMATION:**
- Namn: ${analysisContext.cup_name}
- Antal lag: ${analysisContext.total_teams}
- Format: ${analysisContext.format}
- Period: ${analysisContext.start_date} till ${analysisContext.end_date}
- Nuvarande grupper: ${analysisContext.current_groups}
- Lag per grupp (genomsnitt): ${analysisContext.teams_per_group}
- Matcher slutförda: ${analysisContext.completed_matches}/${analysisContext.total_matches} (${analysisContext.match_completion_rate}%)
- Har slutspel: ${analysisContext.has_playoffs ? 'Ja' : 'Nej'}

**👥 GRUPPÖVERSIKT:**
${analysisContext.groups_summary.map(g => `- ${g.name}: ${g.teams_count} lag, ${g.matches_played} matcher spelade`).join('\n')}

**🎯 UPPDRAG (ge DETALJERADE, PRAKTISKA svar):**

1. **GRUPPINDELNING OCH OPTIMERING:**
   - Baserat på ${analysisContext.total_teams} lag, föreslå EXAKT antal grupper och lag per grupp
   - Förklara matematiskt VARFÖR detta är optimalt (jämnt antal, slutspelsformat, matchbelastning)
   - Ge alternativa lösningar om nuvarande inte är optimal
   - Diskutera balans mellan gruppspel och slutspel

2. **SLUTSPELSSTRATEGI OCH BRACKET-DESIGN:**
   - Analysera hur många lag som bör gå vidare per grupp (vanligtvis 2, men kan variera)
   - Föreslå SPECIFIK bracket-struktur (Kvartsfinal? Semifinal? Direkt till final?)
   - Ge KONKRETA seedning-rekommendationer (Grupp A 1:a mot Grupp B 2:a, etc.)
   - Identifiera potentiella "drömfinal"-matchups baserat på gruppspel
   - Föreslå spännande matchningar som undviker tidiga kollisioner mellan topplöag

3. **SCHEMALÄGGNING OCH LOGISTIK:**
   - Identifiera SPECIFIKA flaskhalsar (t.ex. "4 matcher samma dag på samma plan")
   - Räkna ut optimal matchfördelning per dag/vecka
   - Ge KONKRETA tidsförslag (t.ex. "Dag 1: Gruppspel matcher 1-4, Dag 2: Matcher 5-8")
   - Föreslå viloperioder mellan matcher för lag
   - Överväg venue-tillgänglighet och publikflöde

4. **STRATEGISKA FÖRBÄTTRINGAR:**
   - Föreslå spännande tillägg (bronsmatch, utmärkelser, sidoevent)
   - Analysera turneringsflöde och underhållningsvärde
   - Ge tips för att maximera publikengagemang
   - Föreslå hur man hanterar oväntade händelser (avbokningar, oväder)

**⚠️ VIKTIGT:**
- Var EXTREM konkret med siffror och exempel
- Ge FLERA alternativ när möjligt
- Fokusera på GENOMFÖRBARA åtgärder, inte teoretiska ideal
- Tänk på realism och praktiska begränsningar
- Använd fotbollsterminologi korrekt (seedning, bracket, knockout, etc.)

Svara STRUKTURERAT och DETALJERAT på svenska.`;

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