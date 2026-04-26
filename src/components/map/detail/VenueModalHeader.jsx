import React from 'react';
import { X, MapPin, CheckCircle, LayoutGrid, Star } from 'lucide-react';

export default function VenueModalHeader({ venue, hasSubPitches, subPitchCount, onClose }) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2BA84A] via-[#248232] to-[#1A6028]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 35%)',
        }}
      />

      {/* Image overlay if venue has one */}
      {venue.image_url && (
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: `url(${venue.image_url})` }}
        />
      )}

      {/* Content */}
      <div className="relative px-4 sm:px-6 pt-5 pb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {venue.is_allplay && (
              <span className="inline-flex h-6 items-center gap-1 px-2 rounded-full bg-[#FFD700]/25 backdrop-blur-sm text-[10px] font-black text-[#FFF8DC] uppercase tracking-wider ring-1 ring-[#FFD700]/40">
                <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                AllPlay
              </span>
            )}
            {venue.is_verified && (
              <span className="inline-flex h-6 items-center gap-1 px-2 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider ring-1 ring-white/30">
                <CheckCircle className="w-3 h-3" />
                Verifierad
              </span>
            )}
            {hasSubPitches && (
              <span className="inline-flex h-6 items-center gap-1 px-2 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider ring-1 ring-white/25">
                <LayoutGrid className="w-3 h-3" />
                {subPitchCount} planer
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Stäng"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight mb-1.5">
          {venue.name}
        </h2>

        <div className="flex items-center gap-1.5 text-sm text-[#CFE8D6]">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{venue.address}, {venue.city}</span>
        </div>
      </div>
    </div>
  );
}