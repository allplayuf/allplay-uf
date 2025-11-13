import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Trophy, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function CupMatches({ cup, matches, canManage }) {
  const [filter, setFilter] = useState('all'); // all, upcoming, completed

  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') return !match.team_a_score && match.team_a_score !== 0;
    if (filter === 'completed') return match.team_a_score !== null;
    return true;
  });

  const upcomingCount = matches.filter(m => m.team_a_score === null).length;
  const completedCount = matches.filter(m => m.team_a_score !== null).length;

  return (
    <div className="space-y-6">
      
      {/* Header with Clean Tab Bar */}
      <Card className="bg-[#1F2937] border-[#374151] rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-[#FFFFFF] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FF7A3D]" />
              Matcher ({filteredMatches.length})
            </h2>

            {/* Filter Tabs - ALIGNED & CLEAN */}
            <div className="flex items-center gap-2 bg-[#0E0F10] p-1 rounded-xl">
              <button
                onClick={() => setFilter('all')}
                className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-[#FF7A3D] text-[#FFFFFF] shadow-lg'
                    : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
                }`}
              >
                Alla
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all ${
                  filter === 'upcoming'
                    ? 'bg-[#FF7A3D] text-[#FFFFFF] shadow-lg'
                    : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
                }`}
              >
                Kommande ({upcomingCount})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all ${
                  filter === 'completed'
                    ? 'bg-[#FF7A3D] text-[#FFFFFF] shadow-lg'
                    : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
                }`}
              >
                Spelade ({completedCount})
              </button>
            </div>
          </div>

          {/* Matches List */}
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-[#4B5563] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">Inga matcher än</h3>
              <p className="text-[#9CA3AF]">Matcher kommer att skapas när schemat genereras.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match, index) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  index={index}
                  canManage={canManage}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchCard({ match, index, canManage }) {
  const hasResult = match.team_a_score !== null;
  const isLive = match.is_live;

  const stageLabels = {
    group: 'Grupp',
    round_of_16: 'Åttondelsfinal',
    quarterfinal: 'Kvartsfinal',
    semifinal: 'Semifinal',
    final: 'Final',
    bronze: 'Bronsmatch'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link to={match.match_id ? `${createPageUrl("MatchDetail")}?id=${match.match_id}` : '#'}>
        <div className="bg-[#0E0F10] border border-[#374151] hover:border-[#FF7A3D]/50 rounded-xl transition-all group p-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-[#FF7A3D]/20 text-[#FF7A3D] border-0 text-xs font-semibold h-6 px-3">
                {stageLabels[match.stage] || match.stage}
              </Badge>
              {isLive && (
                <Badge className="bg-[#EF4444]/20 text-[#EF4444] border-0 text-xs font-semibold h-6 px-3 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-pulse"></div>
                  LIVE
                </Badge>
              )}
            </div>

            {hasResult && (
              <div className="flex items-center gap-2 text-xs">
                {match.extra_time && (
                  <span className="text-[#FFA500] font-semibold">EF</span>
                )}
                {match.penalties && (
                  <span className="text-[#EF4444] font-semibold">STR</span>
                )}
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between p-3 bg-[#1F2937] rounded-lg">
              <span className="text-sm font-semibold text-[#FFFFFF] truncate">
                {match.team_a_name || 'Lag A'}
              </span>
              {hasResult && (
                <span className="text-lg font-bold text-[#FFFFFF] ml-2">{match.team_a_score}</span>
              )}
            </div>

            <div className="text-center text-xs text-[#6B7280] font-semibold">VS</div>

            <div className="flex items-center justify-between p-3 bg-[#1F2937] rounded-lg">
              <span className="text-sm font-semibold text-[#FFFFFF] truncate">
                {match.team_b_name || 'Lag B'}
              </span>
              {hasResult && (
                <span className="text-lg font-bold text-[#FFFFFF] ml-2">{match.team_b_score}</span>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF]">
            {match.date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(match.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              </div>
            )}
            {match.time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {match.time}
              </div>
            )}
            {match.venue_name && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{match.venue_name}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}