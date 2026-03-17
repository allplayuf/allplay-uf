import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Ban } from 'lucide-react';

/**
 * Shows availability status for a venue on a given date/time.
 * Used in match creation form to warn about booking conflicts.
 */
export default function VenueAvailabilityBadge({ venueId, date, time, isAllplay }) {
  if (!isAllplay || !venueId || !date) return null;

  const { data: slots = [] } = useQuery({
    queryKey: ['venue-availability-check', venueId, date],
    queryFn: () => base44.entities.VenueAvailability.filter(
      { venue_id: venueId, date },
      'start_time',
      50
    ),
    staleTime: 60000,
    enabled: !!venueId && !!date,
  });

  if (slots.length === 0) return null;

  // Check if the requested time falls within a booked slot
  const isBooked = time && slots.some(s => 
    s.slot_type === 'booked' && s.start_time <= time && s.end_time > time
  );

  const isAvailable = time && slots.some(s => 
    s.slot_type === 'available' && s.start_time <= time && s.end_time > time
  );

  const availableSlots = slots.filter(s => s.slot_type === 'available');
  const bookedSlots = slots.filter(s => s.slot_type === 'booked');

  if (isBooked) {
    return (
      <div className="flex items-start gap-2 p-2.5 bg-[#DC2626]/10 rounded-lg border border-[#DC2626]/30 mt-2">
        <Ban className="w-4 h-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[#FCA5A5]">Planen är bokad denna tid</p>
          <p className="text-[10px] text-[#FCA5A5]/70 mt-0.5">Välj en annan tid eller plan</p>
        </div>
      </div>
    );
  }

  if (availableSlots.length > 0) {
    return (
      <div className="flex items-start gap-2 p-2.5 bg-[#2BA84A]/10 rounded-lg border border-[#2BA84A]/30 mt-2">
        <Clock className="w-4 h-4 text-[#2BA84A] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[#86EFAC]">Tillgängliga tider</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {availableSlots.map((s, i) => (
              <span key={i} className="text-[10px] text-[#86EFAC]/80 bg-[#2BA84A]/10 px-1.5 py-0.5 rounded">
                {s.start_time}–{s.end_time}
              </span>
            ))}
          </div>
          {bookedSlots.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {bookedSlots.map((s, i) => (
                <span key={i} className="text-[10px] text-[#FCA5A5]/80 bg-[#DC2626]/10 px-1.5 py-0.5 rounded line-through">
                  {s.start_time}–{s.end_time} {s.booked_by && `(${s.booked_by})`}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}