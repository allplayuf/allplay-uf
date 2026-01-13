import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId, userLat, userLng } = await req.json();

    if (!matchId || userLat === undefined || userLng === undefined) {
      return Response.json({ error: 'matchId, userLat, and userLng krävs' }, { status: 400 });
    }

    // 1. Get match and verify status
    const match = await base44.asServiceRole.entities.Match.get(matchId);
    if (!match) {
      return Response.json({ error: 'Match hittades inte' }, { status: 404 });
    }

    // 2. Check time window: 1h before to 3h after match start
    const now = new Date();
    const [year, month, day] = match.date.split('-');
    const [hour, minute] = match.time.split(':');
    const matchStart = new Date(year, month - 1, day, hour, minute);
    
    const oneHourBefore = new Date(matchStart.getTime() - 60 * 60 * 1000);
    const threeHoursAfter = new Date(matchStart.getTime() + 3 * 60 * 60 * 1000);

    if (now < oneHourBefore || now > threeHoursAfter) {
      return Response.json({
        error: 'Check-in endast tillgänglig 1h innan till 3h efter matchstart',
        canCheckIn: false
      }, { status: 400 });
    }

    // 3. Verify user is registered for this match
    const participants = await base44.asServiceRole.entities.MatchParticipant.filter({
      match_id: matchId,
      user_id: user.id
    });

    if (participants.length === 0) {
      return Response.json({ error: 'Du är inte anmäld till denna match' }, { status: 403 });
    }

    const participant = participants[0];

    // 4. Check if already checked in (idempotent)
    if (participant.checked_in) {
      return Response.json({
        success: true,
        alreadyCheckedIn: true,
        message: 'Du är redan incheckad'
      });
    }

    // 5. Get venue and verify it has coordinates
    const venue = await base44.asServiceRole.entities.Venue.get(match.venue_id);
    if (!venue || !venue.latitude || !venue.longitude) {
      return Response.json({
        error: 'Planen saknar platsdata',
        canCheckIn: false
      }, { status: 400 });
    }

    // 6. Calculate distance
    const distance = calculateDistance(userLat, userLng, venue.latitude, venue.longitude);

    // 7. Check if within 500m
    if (distance > 500) {
      return Response.json({
        error: 'Du måste vara inom 500 meter från planen',
        distance: Math.round(distance),
        canCheckIn: false
      }, { status: 400 });
    }

    // 8. Update participant with check-in
    await base44.asServiceRole.entities.MatchParticipant.update(participant.id, {
      checked_in: true,
      check_in_time: new Date().toISOString(),
      check_in_lat: userLat,
      check_in_lng: userLng
    });

    console.log('AUDIT LOG:', {
      action: 'MATCH_CHECK_IN',
      user_id: user.id,
      match_id: matchId,
      distance: Math.round(distance),
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Du är nu på plats!',
      distance: Math.round(distance)
    });

  } catch (error) {
    console.error('Error in checkInToMatch:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});