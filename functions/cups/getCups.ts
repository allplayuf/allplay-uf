import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'all';
    const city = url.searchParams.get('city');
    const format = url.searchParams.get('format');
    const signup_type = url.searchParams.get('signup_type');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch all cups
    let cups = await base44.entities.Cup.list('-start_date', limit);

    // Filter by status
    if (status !== 'all') {
      cups = cups.filter(cup => {
        if (status === 'upcoming') {
          return ['upcoming', 'registration_open', 'registration_closed'].includes(cup.status);
        } else if (status === 'live') {
          return cup.status === 'ongoing';
        } else if (status === 'finished') {
          return cup.status === 'completed';
        }
        return cup.status === status;
      });
    }

    // Filter by city
    if (city) {
      const normalizedCity = city.toLowerCase().trim();
      cups = cups.filter(cup => 
        cup.location?.toLowerCase().includes(normalizedCity)
      );
    }

    // Filter by format
    if (format) {
      cups = cups.filter(cup => cup.format === format);
    }

    // Filter by signup type
    if (signup_type) {
      cups = cups.filter(cup => cup.signup_type === signup_type);
    }

    // Filter out private cups for non-authenticated users
    try {
      const user = await base44.auth.me();
      if (!user) {
        cups = cups.filter(cup => cup.is_public);
      }
    } catch (error) {
      // User not authenticated, only show public cups
      cups = cups.filter(cup => cup.is_public);
    }

    return Response.json({ 
      success: true,
      cups,
      count: cups.length
    });

  } catch (error) {
    console.error('Error fetching cups:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});