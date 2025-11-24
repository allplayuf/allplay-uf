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
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all rounded-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] ${
          isSelected 
            ? 'bg-[#2BA84A]/10 border border-[#2BA84A] scale-[1.02]' 
            : 'bg-[#121715] border border-[#223029] hover:border-[#2BA84A]'
        }`}
        onClick={onClick}
      >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5] truncate mb-1">{venue.name}</h4>
            <div className="flex items-center gap-1 text-[13px] leading-[18px] text-[#B6C2BC]">
              <MapPin className="w-4 h-4 flex-shrink-0 text-[#9FC9AC]" />
              <span className="truncate">{venue.city}</span>
              {venue.distance && (
                <span className="text-[#9FC9AC] ml-2 flex-shrink-0">• {venue.distance.toFixed(1)}km</span>
              )}
            </div>
          </div>
          {venue.rating && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Star className="w-4 h-4 text-[#F4743B] fill-[#F4743B]" />
              <span className="text-[13px] leading-[18px] font-semibold text-[#F4F7F5]">{venue.rating}</span>
            </div>
          )}
        </div>

        {/* Formats */}
        {venue.formats_supported && venue.formats_supported.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {venue.formats_supported.map(format => (
              <span key={format} className="inline-flex h-7 items-center rounded-full bg-[#2BA84A]/18 px-3 text-[13px] leading-[18px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                {format}
              </span>
            ))}
          </div>
        )}

        {/* Status & Active Matches */}
        {matches && matches.length > 0 ? (
          <div className="space-y-2">
            <span className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] leading-[18px] font-medium ring-1 ${statusColor}`}>
              <Calendar className="w-3 h-3 mr-1" />
              {matches.length} match{matches.length === 1 ? '' : 'er'} • {statusText}
            </span>
            {matches.slice(0, 2).map(match => (
              <div 
                key={match.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMatchClick(match.id);
                }}
                className="bg-[#18221E] rounded-xl p-3 border border-[#223029] hover:border-[#2BA84A] hover:scale-[1.01] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] leading-[18px] font-semibold text-[#F4F7F5] truncate mb-1">{match.title}</div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC]">{match.date} {match.time}</div>
                  </div>
                  <span className="inline-flex h-7 items-center rounded-full bg-[#18221E] px-3 text-[13px] leading-[18px] font-medium text-[#9FC9AC] ring-1 ring-[#2BA84A]/25 flex-shrink-0">
                    <Users className="w-3 h-3 mr-1" />
                    {match.is_spontaneous 
                      ? `${match.current_players || 0}`
                      : `${match.current_players || 0}/${match.max_players}`
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] leading-[18px] font-medium ring-1 ${statusColor}`}>
            {statusText}
          </span>
        )}
      </CardContent>
      </Card>
    </motion.div>
  );
}