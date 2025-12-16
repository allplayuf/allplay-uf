import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Syncs or creates PlayerProfile from User data
 * Called after user registration or profile updates
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if PlayerProfile already exists
    const existingProfiles = await base44.entities.PlayerProfile.filter({ user_id: user.id });
    
    const profileData = {
      user_id: user.id,
      display_name: user.display_name || user.full_name,
      full_name: user.full_name,
      city: user.city,
      bio: user.bio,
      interests: user.interests || [],
      favorite_positions: user.favorite_positions || [],
      skill_level: user.skill_level || 'intermediate',
      favorite_club: user.favorite_club,
      preferred_match_types: user.preferred_match_types || [],
      availability: user.availability || [],
      instagram_handle: user.instagram_handle,
      elo_rating: user.elo_rating || 1200,
      matches_played: user.matches_played || 0,
      mvp_count: user.mvp_count || 0,
      current_streak: user.current_streak || 0,
      longest_streak: user.longest_streak || 0,
      profile_image_url: user.profile_image_url,
      publicProfile: user.publicProfile !== false,
      fitness_level: user.fitness_level || 5,
      referral_code: user.referral_code,
      verified_referrals: user.verified_referrals || 0
    };

    let profile;
    if (existingProfiles.length > 0) {
      // Update existing profile
      profile = await base44.entities.PlayerProfile.update(existingProfiles[0].id, profileData);
    } else {
      // Create new profile
      profile = await base44.entities.PlayerProfile.create(profileData);
    }

    return Response.json({ 
      success: true,
      profile 
    });

  } catch (error) {
    console.error('Error syncing PlayerProfile:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});