import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cupData = await req.json();

    // Basic validation
    if (!cupData.name || !cupData.location || !cupData.start_date || !cupData.start_time) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'name, location, start_date and start_time are required' 
      }, { status: 400 });
    }

    if (cupData.max_participants < 4 || cupData.max_participants > 64) {
      return Response.json({ 
        error: 'Invalid max_participants',
        details: 'Must be between 4 and 64' 
      }, { status: 400 });
    }

    // Sanitize and prepare data
    const sanitizedData = {
      name: cupData.name.trim(),
      description: cupData.description?.trim() || '',
      logo_url: cupData.logo_url || '',
      location: cupData.location.trim(),
      venue_ids: cupData.venue_ids || [],
      start_date: cupData.start_date,
      end_date: cupData.end_date || cupData.start_date,
      start_time: cupData.start_time,
      format: cupData.format || '5v5',
      signup_type: cupData.signup_type || 'team',
      skill_level: cupData.skill_level || 'mixed',
      age_group: cupData.age_group || 'Open',
      max_participants: parseInt(cupData.max_participants) || 16,
      rules: cupData.rules?.trim() || '',
      prize: cupData.prize?.trim() || '',
      entry_fee: parseFloat(cupData.entry_fee) || 0,
      has_group_stage: cupData.has_group_stage !== false,
      has_playoffs: cupData.has_playoffs !== false,
      number_of_groups: parseInt(cupData.number_of_groups) || 4,
      teams_advance_per_group: parseInt(cupData.teams_advance_per_group) || 2,
      enable_mvp_voting: cupData.enable_mvp_voting !== false,
      is_public: cupData.is_public !== false,
      organizer_id: user.id,
      current_participants: 0,
      status: 'registration_open'
    };

    // Create cup using service role for elevated permissions
    const cup = await base44.asServiceRole.entities.Cup.create(sanitizedData);

    // Create groups if group stage is enabled
    if (cup.has_group_stage && cup.number_of_groups) {
      const groupPromises = [];
      for (let i = 0; i < cup.number_of_groups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        groupPromises.push(
          base44.asServiceRole.entities.CupGroup.create({
            cup_id: cup.id,
            name: `Grupp ${groupName}`,
            team_ids: [],
            standings: []
          })
        );
      }
      await Promise.all(groupPromises);
    }

    return Response.json({ 
      success: true,
      cup 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating cup:', error);
    return Response.json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, { status: 500 });
  }
});