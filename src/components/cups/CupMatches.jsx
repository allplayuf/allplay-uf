import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function CupMatches({ cup, matches, canManage }) {
  const [filter, setFilter] = useState('all');

  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') return !match.team_a_score && match.team_a_score !== 0;
    if (filter === 'completed') return match.team_a_score !== null;
    return true;
  });

  const upcomingCount = matches.filter(m => m.team_a_score === null).length;
  const completedCount = matches.filter(m => m.team_a_score !== null).length;

  return (
    <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
      <CardContent className="p-6">
        
        {/* Header with Filter Tabs - PERFECTLY ALIGNED */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-[#F4F7F5] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
            Matcher ({filteredMatches.length})
          </h2>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-[#0F1513] p-1 rounded-xl border border-[#223029]">
            <button
              onClick={() => setFilter('all')}
              className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              Alla
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                filter === 'upcoming'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              Kommande <span className="hidden sm:inline">({upcomingCount})</span>
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                filter === 'completed'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              Spelade <span className="hidden sm:inline">({completedCount})</span>
            </button>
          </div>
        </div>

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga matcher än</h3>
            <p className="text-[#B6C2BC]">Matcher kommer att skapas när schemat genereras.</p>
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
  );
}

import MatchResultModal from "./MatchResultModal";

function MatchCard({ match, index, canManage }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const queryClient = useQueryClient();
  const { alert } = useCustomDialog();

  const handleResultSaved = async () => {
      await queryClient.invalidateQueries(['cupDetails']);
      setShowReportModal(false);
      // Optional: Show success message via alert or toast
  };
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
        <div className="bg-[#18221E] border border-[#223029] hover:border-[#F59E0B]/30 rounded-xl transition-all group p-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-xs font-semibold h-6 px-3">
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
                  <span className="text-[#FCD34D] font-semibold">EF</span>
                )}
                {match.penalties && (
                  <span className="text-[#EF4444] font-semibold">STR</span>
                )}
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between p-3 bg-[#0F1513] rounded-lg border border-[#223029]">
              <span className="text-sm font-semibold text-[#F4F7F5] truncate">
                {match.team_a_name || 'Lag A'}
              </span>
              {hasResult && (
                <span className="text-lg font-bold text-[#F4F7F5] ml-2">{match.team_a_score}</span>
              )}
            </div>

            <div className="text-center text-xs text-[#7B8A83] font-semibold">VS</div>

            <div className="flex items-center justify-between p-3 bg-[#0F1513] rounded-lg border border-[#223029]">
              <span className="text-sm font-semibold text-[#F4F7F5] truncate">
                {match.team_b_name || 'Lag B'}
              </span>
              {hasResult && (
                <span className="text-lg font-bold text-[#F4F7F5] ml-2">{match.team_b_score}</span>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#B6C2BC]">
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
      
      {canManage && (
        <div className="mt-2 flex justify-end">
             <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReportModal(true);
                }}
                className="text-xs bg-[#2BA84A]/20 text-[#2BA84A] px-3 py-1.5 rounded-lg hover:bg-[#2BA84A]/30 transition-colors font-semibold"
            >
                Rapportera Resultat
            </button>
        </div>
      )}

      {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                   <MatchResultModal 
                      match={match} 
                      onClose={() => setShowReportModal(false)} 
                      onSuccess={handleResultSaved}
                      // If MatchResultModal expects specific props, adapt them here
                   /> 
              </div>
          </div>
      )}
    </motion.div>
  );
}