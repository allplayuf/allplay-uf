/**
 * Get Venues with Pagination and Filtering
 * Returns paginated venues based on location and filters
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50); // Max 50
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const city = url.searchParams.get('city');
    const format = url.searchParams.get('format');
    const userLat = parseFloat(url.searchParams.get('lat') || '0');
    const userLon = parseFloat(url.searchParams.get('lon') || '0');
    const maxDistance = parseFloat(url.searchParams.get('distance') || '50'); // km
    
    const base44 = createClientFromRequest(req);
    
    // Get all venues
    let venues = await base44.asServiceRole.entities.Venue.list();
    
    // Filter by city if provided
    if (city) {
      venues = venues.filter(v => 
        v.city && v.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    // Filter by format if provided
    if (format && format !== 'all') {
      venues = venues.filter(v => 
        v.formats_supported && v.formats_supported.includes(format)
      );
    }
    
    // Filter by distance if user location provided
    if (userLat && userLon) {
      venues = venues
        .map(venue => {
          if (!venue.latitude || !venue.longitude) return null;
          
          const distance = calculateDistance(
            userLat,
            userLon,
            parseFloat(venue.latitude),
            parseFloat(venue.longitude)
          );
          
          return { ...venue, distance };
        })
        .filter(venue => venue && venue.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
    }
    
    // Apply pagination
    const totalCount = venues.length;
    const paginatedVenues = venues.slice(skip, skip + limit);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return Response.json({
      success: true,
      venues: paginatedVenues,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    console.error('Error getting venues:', error);
    
    return Response.json(
      { error: error.message || 'Failed to get venues' },
      { status: 500 }
    );
  }
});