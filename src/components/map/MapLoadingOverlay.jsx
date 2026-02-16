/**
 * MapLoadingOverlay
 * 
 * Strategy B (Gate): Show this skeleton while venue/pin data loads.
 * Matches the dark map aesthetic so the transition feels intentional.
 * On revisit with cached data, this is never shown.
 */
import React from 'react';
import { MapPin } from 'lucide-react';

export default function MapLoadingOverlay() {
  return (
    <div className="w-full h-full bg-[#0D1210] flex items-center justify-center relative overflow-hidden">
      {/* Simulated map grid lines */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(#2BA84A 1px, transparent 1px), linear-gradient(90deg, #2BA84A 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Simulated pin placeholders at different positions */}
      {[
        { top: '25%', left: '35%' },
        { top: '40%', left: '55%' },
        { top: '55%', left: '30%' },
        { top: '35%', left: '70%' },
        { top: '60%', left: '60%' },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-10 h-10 rounded-full bg-[#18221E] border border-[#223029] animate-pulse flex items-center justify-center"
          style={{ top: pos.top, left: pos.left, animationDelay: `${i * 150}ms` }}
        >
          <div className="w-3 h-3 rounded-full bg-[#2BA84A]/30" />
        </div>
      ))}

      {/* Center loading indicator */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#18221E] border border-[#223029] flex items-center justify-center">
          <MapPin className="w-6 h-6 text-[#2BA84A] animate-pulse" />
        </div>
        <p className="text-xs font-semibold text-[#9EAAA4]">Laddar planer...</p>
      </div>
    </div>
  );
}