import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Calendar, Users } from "lucide-react";

import { motion } from "framer-motion";

export default function VenueCard({ venue, matches, isSelected, onClick, onMatchClick, userMatchIds = [] }) {
  // Determine venue color based on user participation
  const hasUserMatch = matches.some(m => userMatchIds.includes(m.id));
  const hasMatches = matches.length > 0;
  
  let statusColor = 'bg-[#2BA84A]/18 text-[#CFE8D6] ring-[#2BA84A]/25'; // Default green
  let statusText = 'Tillgänglig';
  
  if (hasUserMatch) {
    statusColor = 'bg-[#4169E1]/18 text-[#B0C4DE] ring-[#4169E1]/25'; // Blue
    statusText = 'Du spelar här';
  } else if (hasMatches) {
    statusColor = 'bg-[#F4743B]/18 text-[#FDE3D2] ring-[#F4743B]/25'; // Orange
    statusText = 'Matcher tillgängliga';
  }

  return (
    <div
      className={`cursor-pointer transition-all rounded-xl border shadow-sm ${
        isSelected 
          ? 'bg-[#18221E] border-[#2BA84A] ring-1 ring-[#2BA84A]/20' 
          : 'bg-[#121715] border-[#223029] hover:border-[#2BA84A]/50'
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-white truncate mb-0.5">{venue.name}</h4>
            <div className="flex items-center gap-1 text-sm text-secondary">
              <span className="truncate">{venue.city}</span>
              {venue.distance && (
                <span>• {venue.distance.toFixed(1)}km</span>
              )}
            </div>
          </div>
          {venue.rating && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Star className="w-3.5 h-3.5 text-[#F4743B] fill-[#F4743B]" />
              <span className="text-sm font-medium text-white">{venue.rating}</span>
            </div>
          )}
        </div>

        {/* Formats */}
        <div className="flex flex-wrap gap-1.5 mb-3">
            {venue.formats_supported?.map(format => (
              <span key={format} className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-[#18221E] border border-[#223029] text-secondary">
                {format}
              </span>
            ))}
        </div>

        {/* Active Matches Preview */}
        {matches && matches.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-[#223029]">
            <div className="flex items-center gap-2 text-xs font-medium text-[#F4743B]">
               <Calendar className="w-3.5 h-3.5" />
               <span>{matches.length} aktiv{matches.length === 1 ? '' : 'a'} matcher</span>
            </div>
            {matches.slice(0, 1).map(match => (
              <div 
                key={match.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMatchClick(match.id);
                }}
                className="bg-[#18221E] rounded-lg p-2.5 border border-[#223029] hover:border-[#2BA84A]/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                    <div className="truncate pr-2">
                        <span className="text-sm font-medium text-white block truncate">{match.title}</span>
                        <span className="text-xs text-secondary block">{match.date} {match.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-secondary bg-[#121715] px-2 py-1 rounded-md border border-[#223029]">
                        <Users className="w-3 h-3" />
                        {match.current_players || 0}/{match.max_players}
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-2 border-t border-[#223029]">
             <span className="text-xs text-secondary flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2BA84A]"></div>
                Tillgänglig för bokning
             </span>
          </div>
        )}
      </div>
    </div>
  );
}