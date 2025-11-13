import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Badge definitions matching frontend
const BADGE_DEFINITIONS = [
  { id: 'match_creator', name: 'Matchstartare', description: 'Skapa matcher', category: 'matches', tiers: { bronze: 1, silver: 5, gold: 10, diamond: 25 }, stat: 'created_matches' },
  { id: 'match_player', name: 'Spelstomme', description: 'Delta i matcher', category: 'matches', tiers: { bronze: 10, silver: 50, gold: 100, diamond: 250 }, stat: 'matches_played' },
  { id: 'team_player', name: 'Lagspelare', description: 'Spela med olika personer', category: 'social', tiers: { bronze: 10, silver: 25, gold: 50, diamond: 100 }, stat: 'unique_opponents' },
  { id: 'reliable', name: 'Pålitlig', description: 'Slutför matcher', category: 'dedication', tiers: { bronze: 10, silver: 50, gold: 100, diamond: 250 }, stat: 'completed_matches' },
  { id: 'mvp_champion', name: 'MVP Champion', description: 'Bli MVP', category: 'skill', tiers: { bronze: 5, silver: 15, gold: 30, diamond: 75 }, stat: 'mvp_wins' },
  { id: 'streak_master', name: 'Streak Master', description: 'Spela dagar i rad', category: 'dedication', tiers: { bronze: 3, silver: 7, gold: 14, diamond: 30 }, stat: 'current_streak' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Spela på helger', category: 'dedication', tiers: { bronze: 4, silver: 8, gold: 16, diamond: 32 }, stat: 'weekend_matches' },
  { id: 'night_owl', name: 'Nattuggla', description: 'Spela efter 22:00', category: 'special', tiers: { bronze: 5, silver: 10, gold: 25, diamond: 50 }, stat: 'night_matches' },
  { id: 'early_bird', name: 'Early Bird', description: 'Spela före 09:00', category: 'special', tiers: { bronze: 5, silver: 10, gold: 25, diamond: 50 }, stat: 'morning_matches' },
  { id: 'explorer', name: 'Utforskare', description: 'Spela på olika platser', category: 'matches', tiers: { bronze: 3, silver: 5, gold: 10, diamond: 20 }, stat: 'unique_venues' },
  { id: 'social', name: 'Social', description: 'Ha aktiva vänner', category: 'social', tiers: { bronze: 5, silver: 10, gold: 25, diamond: 50 }, stat: 'friends_count' },
  { id: 'team_builder', name: 'Team Builder', description: 'Skapa och hantera lag', category: 'social', tiers: { bronze: 1, silver: 2, gold: 3, diamond: 5 }, stat: 'teams_created' },
  { id: 'supporter', name: 'Supporter', description: 'Ge feedback', category: 'special', tiers: { bronze: 1, silver: 5, gold: 10, diamond: 20 }, stat: 'feedback_count' },
  { id: 'cup_participant', name: 'Turneringsspelare', description: 'Delta i turneringar', category: 'matches', tiers: { bronze: 1, silver: 3, gold: 5, diamond: 10 }, stat: 'cups_participated' }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    const targetUserId = userId || user.id;

    // Fetch user data
    const targetUser = await base44.asServiceRole.entities.User.get(targetUserId);
    
    // Fetch all matches for this user
    const allParticipations = await base44.asServiceRole.entities.MatchParticipant.filter({ 
      user_id: targetUserId 
    });
    const matchIds = allParticipations.map(p => p.match_id);
    
    let allMatches = [];
    if (matchIds.length > 0) {
      allMatches = await base44.asServiceRole.entities.Match.list();
      allMatches = allMatches.filter(m => matchIds.includes(m.id));
    }

    // Fetch friendships
    const allFriendships = await base44.asServiceRole.entities.Friendship.filter({ 
      status: 'accepted' 
    });
    const userFriendships = allFriendships.filter(f => 
      f.requester_id === targetUserId || f.addressee_id === targetUserId
    );

    // Fetch teams created by user
    const teamsCreated = await base44.asServiceRole.entities.Team.filter({ 
      captain_id: targetUserId 
    });

    // Fetch cup participations
    const cupParticipations = await base44.asServiceRole.entities.CupParticipant.filter({ 
      user_id: targetUserId,
      status: 'confirmed'
    });

    // Fetch feedback posts
    const feedbackPosts = await base44.asServiceRole.entities.FeedbackPost.filter({ 
      author_id: targetUserId 
    });

    // Calculate stats
    const completedMatches = allMatches.filter(m => m.status === 'completed');
    const organizedMatches = allMatches.filter(m => m.organizer_id === targetUserId);
    
    // Count unique venues
    const uniqueVenueIds = new Set(completedMatches.map(m => m.venue_id));
    
    // Count unique opponents
    const uniqueOpponentIds = new Set();
    for (const match of completedMatches) {
      const matchParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({ 
        match_id: match.id 
      });
      matchParticipants.forEach(p => {
        if (p.user_id !== targetUserId) {
          uniqueOpponentIds.add(p.user_id);
        }
      });
    }

    // Count time-based matches
    let weekendMatches = 0;
    let nightMatches = 0;
    let morningMatches = 0;

    completedMatches.forEach(match => {
      const matchDate = new Date(match.date);
      const dayOfWeek = matchDate.getDay();
      
      // Weekend (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendMatches++;
      }

      // Night/Morning matches (based on time)
      if (match.time) {
        const hour = parseInt(match.time.split(':')[0]);
        if (hour >= 22 || hour < 6) {
          nightMatches++;
        }
        if (hour >= 6 && hour < 9) {
          morningMatches++;
        }
      }
    });

    // Build user stats object
    const userStats = {
      matches_played: targetUser.matches_played || 0,
      created_matches: organizedMatches.length,
      unique_opponents: uniqueOpponentIds.size,
      completed_matches: completedMatches.length,
      mvp_wins: targetUser.mvp_count || 0,
      current_streak: targetUser.current_streak || 0,
      weekend_matches: weekendMatches,
      night_matches: nightMatches,
      morning_matches: morningMatches,
      unique_venues: uniqueVenueIds.size,
      friends_count: userFriendships.length,
      teams_created: teamsCreated.length,
      feedback_count: feedbackPosts.length,
      cups_participated: cupParticipations.length
    };

    // Calculate badges
    const earnedBadges = [];
    const newlyUnlocked = [];

    // Fetch existing user badges
    const existingBadges = await base44.asServiceRole.entities.UserBadge.filter({ 
      user_id: targetUserId 
    });

    for (const badgeDef of BADGE_DEFINITIONS) {
      const statValue = userStats[badgeDef.stat] || 0;
      let highestTier = null;

      // Determine highest tier achieved
      const tiers = ['diamond', 'gold', 'silver', 'bronze'];
      for (const tier of tiers) {
        if (statValue >= badgeDef.tiers[tier]) {
          highestTier = tier;
          break;
        }
      }

      if (highestTier) {
        // Check if user already has this badge at this tier
        const existingBadge = existingBadges.find(
          b => b.badge_id === badgeDef.id && b.tier === highestTier
        );

        if (!existingBadge) {
          // New badge or tier upgrade!
          const newBadge = {
            user_id: targetUserId,
            badge_id: badgeDef.id,
            tier: highestTier,
            progress_value: statValue,
            unlocked_at: new Date().toISOString()
          };

          // Check if upgrading existing badge
          const lowerTierBadge = existingBadges.find(b => b.badge_id === badgeDef.id);
          if (lowerTierBadge) {
            // Update existing badge
            await base44.asServiceRole.entities.UserBadge.update(lowerTierBadge.id, {
              tier: highestTier,
              progress_value: statValue,
              unlocked_at: new Date().toISOString()
            });
          } else {
            // Create new badge
            await base44.asServiceRole.entities.UserBadge.create(newBadge);
          }

          newlyUnlocked.push({
            ...badgeDef,
            tier: highestTier
          });
        }

        earnedBadges.push({
          ...badgeDef,
          tier: highestTier,
          progress: statValue
        });
      }
    }

    return Response.json({
      success: true,
      stats: userStats,
      badges: earnedBadges,
      newlyUnlocked: newlyUnlocked,
      totalBadges: earnedBadges.length,
      totalPossible: BADGE_DEFINITIONS.length * 4 // 4 tiers per badge
    });

  } catch (error) {
    console.error('Error calculating badges:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});