import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listVenueAvailability } from '@/components/supabase/services/venueAvailabilityService';
import { Clock, Ban, CheckCircle } from 'lucide-react';

/**
 * Shows availability status for a venue on a given date/time.
 * Used in match creation form to warn about booking conflicts.
 * 
 * Logic:
 * - "booked" slots = times the venue is occupied (by clubs, events, etc.)
 * - "available" slots = times explicitly marked as open for AllPlay
 * - If a user's selected time overlaps a "booked" slot → show RED warning
 * - If "available" slots exist → show GREEN with open times
 */
export default function VenueAvailabilityBadge({ venueId, date, time, isAllplay }) {
  const { data: slots = [] } = useQuery({
    queryKey: ['venue-availability-check', venueId, date],
    queryFn: () => listVenueAvailability({ venue_id: venueId, date, limit: 50 }),
    staleTime: 60000,
    enabled: !!isAllplay && !!venueId && !!date,
  });

  if (!isAllplay || !venueId || !date) return null;
  if (slots.length === 0) return null;

  const bookedSlots = slots.filter(s => s.slot_type === 'booked');
  const availableSlots = slots.filter(s => s.slot_type === 'available');

  // Check if the requested time falls within a booked slot
  const isTimeBooked = time && bookedSlots.some(s => 
    s.start_time <= time && s.end_time > time
  );

  // Check if time is within an available slot
  const isTimeAvailable = time && availableSlots.some(s => 
    s.start_time <= time && s.end_time > time
  );

  return (
    <div className="space-y-2 mt-2">
      {/* Conflict warning */}
      {isTimeBooked && (
        <div className="flex items-start gap-2 p-2.5 bg-[#DC2626]/10 rounded-lg border border-[#DC2626]/30">
          <Ban className="w-4 h-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#FCA5A5]">Planen är upptagen denna tid!</p>
            <p className="text-[10px] text-[#FCA5A5]/70 mt-0.5">
              Välj en annan tid.
              {bookedSlots.filter(s => s.start_time <= time && s.end_time > time).map(s => 
                s.booked_by ? ` Bokad av: ${s.booked_by}` : ''
              )}
            </p>
          </div>
        </div>
      )}

      {/* Confirmation that time is available */}
      {!isTimeBooked && isTimeAvailable && (
        <div className="flex items-start gap-2 p-2.5 bg-[#2BA84A]/10 rounded-lg border border-[#2BA84A]/30">
          <CheckCircle className="w-4 h-4 text-[#2BA84A] mt-0.5 flex-shrink-0" />
          <p className="text-xs font-semibold text-[#86EFAC]">Planen är ledig denna tid ✓</p>
        </div>
      )}

      {/* Show schedule overview */}
      {(bookedSlots.length > 0 || availableSlots.length > 0) && (
        <div className="flex items-start gap-2 p-2.5 bg-[#18221E] rounded-lg border border-[#223029]">
          <Clock className="w-4 h-4 text-[#9EAAA4] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#B6C2BC] mb-1">Schema för detta datum</p>
            {availableSlots.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                <span className="text-[10px] text-[#86EFAC] font-medium">Ledigt:</span>
                {availableSlots.map((s, i) => (
                  <span key={i} className="text-[10px] text-[#86EFAC]/80 bg-[#2BA84A]/10 px-1.5 py-0.5 rounded">
                    {s.start_time}–{s.end_time}
                  </span>
                ))}
              </div>
            )}
            {bookedSlots.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-[#FCA5A5] font-medium">Upptaget:</span>
                {bookedSlots.map((s, i) => (
                  <span key={i} className="text-[10px] text-[#FCA5A5]/80 bg-[#DC2626]/10 px-1.5 py-0.5 rounded">
                    {s.start_time}–{s.end_time}{s.booked_by ? ` (${s.booked_by})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}