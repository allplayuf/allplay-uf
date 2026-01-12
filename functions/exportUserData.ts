import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Collect all user data
    const userData = {
      exportDate: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        display_name: user.display_name,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        nationality: user.nationality,
        city: user.city,
        bio: user.bio,
        skill_level: user.skill_level,
        favorite_club: user.favorite_club,
        favorite_positions: user.favorite_positions,
        preferred_match_types: user.preferred_match_types,
        availability: user.availability,
        profile_image_url: user.profile_image_url,
        created_date: user.created_date,
        marketing_opt_in: user.marketing_opt_in,
        publicProfile: user.publicProfile
      },
      statistics: {
        elo_rating: user.elo_rating,
        matches_played: user.matches_played,
        mvp_count: user.mvp_count,
        goals_scored: user.goals_scored,
        current_streak: user.current_streak,
        longest_streak: user.longest_streak,
        verified_referrals: user.verified_referrals
      },
      matches: [],
      teams: [],
      friendships: [],
      reports_submitted: [],
      badges: []
    };

    // Get match history
    const participations = await base44.asServiceRole.entities.MatchParticipant.filter({ user_id: user.id });
    const matchIds = participations.map(p => p.match_id);
    
    if (matchIds.length > 0) {
      const allMatches = await base44.asServiceRole.entities.Match.list();
      const userMatches = allMatches.filter(m => matchIds.includes(m.id));
      
      userData.matches = userMatches.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        time: m.time,
        format: m.format,
        status: m.status,
        team_a_score: m.team_a_score,
        team_b_score: m.team_b_score,
        created_date: m.created_date
      }));
    }

    // Get team memberships
    const teamMemberships = await base44.asServiceRole.entities.TeamMember.filter({ user_id: user.id });
    const teamIds = teamMemberships.map(tm => tm.team_id);
    
    if (teamIds.length > 0) {
      const allTeams = await base44.asServiceRole.entities.Team.list();
      const userTeams = allTeams.filter(t => teamIds.includes(t.id));
      
      userData.teams = userTeams.map(t => ({
        id: t.id,
        name: t.name,
        role: teamMemberships.find(tm => tm.team_id === t.id)?.role || 'member',
        joined_date: teamMemberships.find(tm => tm.team_id === t.id)?.created_date
      }));
    }

    // Get friendships
    const friendships1 = await base44.asServiceRole.entities.Friendship.filter({ requester_id: user.id });
    const friendships2 = await base44.asServiceRole.entities.Friendship.filter({ addressee_id: user.id });
    
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = {};
    allUsers.forEach(u => userMap[u.id] = u.full_name || u.email);

    userData.friendships = [...friendships1, ...friendships2].map(f => ({
      friend_name: f.requester_id === user.id ? userMap[f.addressee_id] : userMap[f.requester_id],
      status: f.status,
      created_date: f.created_date
    }));

    // Get reports submitted by user
    const reports = await base44.asServiceRole.entities.Report.filter({ reporter_id: user.id });
    userData.reports_submitted = reports.map(r => ({
      id: r.id,
      category: r.category,
      status: r.status,
      created_date: r.created_date
    }));

    // Get badges (if entity exists)
    try {
      const badges = await base44.asServiceRole.entities.UserBadge.filter({ user_id: user.id });
      userData.badges = badges.map(b => ({
        badge_type: b.badge_type,
        earned_date: b.created_date
      }));
    } catch (e) {
      // UserBadge entity might not exist
      userData.badges = [];
    }

    // Get ELO history (if entity exists)
    try {
      const eloHistory = await base44.asServiceRole.entities.EloHistory.filter({ user_id: user.id });
      userData.elo_history = eloHistory.map(e => ({
        rating: e.new_rating,
        change: e.change,
        date: e.created_date,
        match_id: e.match_id
      }));
    } catch (e) {
      userData.elo_history = [];
    }

    // Get MVP votes received
    try {
      const mvpVotes = await base44.asServiceRole.entities.MvpVote.filter({ voted_for_id: user.id });
      userData.mvp_votes_received = mvpVotes.length;
    } catch (e) {
      userData.mvp_votes_received = user.mvp_count || 0;
    }

    console.log('AUDIT LOG:', {
      action: 'DATA_EXPORT_REQUESTED',
      user_id: user.id,
      user_email: user.email,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Error in exportUserData:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});