import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all venues
    const venues = await base44.asServiceRole.entities.Venue.list();
    
    // Find duplicates by name and city
    const venueMap = new Map();
    const duplicates = [];
    const toKeep = [];
    
    venues.forEach(venue => {
      const key = `${venue.name.toLowerCase().trim()}_${venue.city.toLowerCase().trim()}`;
      
      if (venueMap.has(key)) {
        // This is a duplicate
        const existing = venueMap.get(key);
        
        // Keep the verified one, or the older one if both/neither are verified
        if (venue.is_verified && !existing.is_verified) {
          duplicates.push(existing.id);
          venueMap.set(key, venue);
        } else {
          duplicates.push(venue.id);
        }
      } else {
        venueMap.set(key, venue);
        toKeep.push(venue);
      }
    });

    // Delete duplicates
    for (const duplicateId of duplicates) {
      await base44.asServiceRole.entities.Venue.delete(duplicateId);
    }

    return Response.json({
      success: true,
      stats: {
        totalVenues: venues.length,
        duplicatesRemoved: duplicates.length,
        remainingVenues: toKeep.length
      },
      message: `Tog bort ${duplicates.length} dubbletter av ${venues.length} planer`
    });

  } catch (error) {
    console.error('Error removing duplicates:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});