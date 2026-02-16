import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

import { motion } from "framer-motion";

export default function VenueCard({ venue, matches, isSelected, onClick, onMatchClick, userMatchIds = [], allParticipants = [] }) {
  // Determine venue color based on user participation
  const hasUserMatch = matches.some(m => userMatchIds.includes(m.id));
  const hasMatches = matches.length > 0;
  
  const [matchUsers, setMatchUsers] = useState({});

  useEffect(() => {
    if (matches && matches.length > 0) {
      // Only load for the first match as we only show one
      loadMatchUsers(matches[0]);
    }
  }, [matches, allParticipants]);

  const loadMatchUsers = async (match) => {
    if (!match) return;
    
    // Get participants for this match
    const matchParticipants = allParticipants.filter(p => p.match_id === match.id);
    
    if (matchParticipants.length === 0) {
      setMatchUsers(prev => ({ ...prev, [match.id]: [] }));
      return;
    }

    try {
      // Fetch user data for all participants
      const userPromises = matchParticipants.map(p => 
        base44.entities.User.get(p.user_id).catch(() => null)
      );
      
      const users = await Promise.all(userPromises);
      const validUsers = users.filter(u => u !== null);
      
      setMatchUsers(prev => ({ ...prev, [match.id]: validUsers }));
    } catch (error) {
      console.error("Error loading venue card users:", error);
    }
  };
  
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
            {matches.slice(0, 1).map(match => {
              const currentPlayers = allParticipants.filter(p => p.match_id === match.id).length;
              const maxPlayers = match.max_players || 0;
              const progressPercentage = maxPlayers > 0 ? (currentPlayers / maxPlayers) * 100 : 0;
              const users = matchUsers[match.id] || [];
              
              return (
                <div 
                  key={match.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMatchClick(match.id);
                  }}
                  className="bg-[#18221E] rounded-lg p-3 border border-[#223029] hover:border-[#2BA84A]/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                      <div className="truncate pr-2">
                          <span className="text-sm font-medium text-white block truncate">{match.title}</span>
                          <span className="text-xs text-secondary block">{match.date} {match.time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-secondary bg-[#121715] px-2 py-1 rounded-md border border-[#223029]">
                          <Users className="w-3 h-3" />
                          {currentPlayers}/{maxPlayers}
                      </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-[#121715] rounded-full overflow-hidden border border-[#223029] mb-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full transition-all ${
                        progressPercentage >= 90 
                          ? 'bg-[#F4743B]'
                          : 'bg-[#2BA84A]'
                      }`}
                    />
                  </div>

                  {/* Users Avatars */}
                  {users.length > 0 && (
                    <div className="flex -space-x-2 overflow-x-auto py-1 scrollbar-hide">
                      {users.map((user, i) => (
                        <div 
                          key={user?.id || i}
                          className="w-6 h-6 flex-shrink-0 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] border border-[#121715] flex items-center justify-center overflow-hidden"
                          title={user?.full_name || 'User'}
                        >
                          {user?.profile_image_url ? (
                            <img src={user.profile_image_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-semibold text-white">{user?.full_name?.[0] || '?'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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