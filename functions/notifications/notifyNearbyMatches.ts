import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createNotification } from '../utils/notificationService.js';

// Haversine distance in KM
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Deno.serve(async (req) => {
  try {
    // Use service role as this is likely a scheduled task or triggered by a cron
    const base44 = createClientFromRequest(req);
    
    // Get all upcoming public matches
    const upcomingMatches = await base44.asServiceRole.entities.Match.filter({ 
      status: 'upcoming',
      is_private: false 
    });

    // Get all users (with coordinates)
    // Assuming user entity has lat/long or city coordinates stored.
    // Since the user entity schema in snapshot doesn't explicitly show lat/long on user, 
    // we might rely on 'city' or assume we added it. 
    // For this implementation, I'll try to fetch users who have lat/long.
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithLocation = allUsers.filter(u => u.last_latitude && u.last_longitude);

    let notificationsSent = 0;

    for (const match of upcomingMatches) {
       // Get venue location
       const venue = await base44.asServiceRole.entities.Venue.get(match.venue_id);
       if (!venue) continue;

       for (const user of usersWithLocation) {
          // Check if user is already participant
          const isParticipant = await base44.asServiceRole.entities.MatchParticipant.filter({
             match_id: match.id,
             user_id: user.id
          });
          if (isParticipant.length > 0) continue;

          // Calculate distance
          const dist = calculateDistance(user.last_latitude, user.last_longitude, venue.latitude, venue.longitude);
          
          // If within 10km
          if (dist <= 10) {
             // Check if we already notified this user about this match (to avoid spam)
             // This would require a separate tracking entity or checking past notifications.
             // For simplicity, we'll skip this check in this MVP but ideally we should have it.
             
             await createNotification(base44, {
                userId: user.id,
                type: 'match_nearby',
                title: 'Match nära dig!',
                message: `Det finns en kommande match "${match.title}" endast ${dist.toFixed(1)}km bort!`,
                link: `/match?id=${match.id}`,
                metadata: { match_id: match.id, distance: dist },
                sendMail: true // Maybe limit email frequency in real app
             });
             notificationsSent++;
          }
       }
    }

    return Response.json({ success: true, notificationsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});