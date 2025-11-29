import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Trophy, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";
import { useQueryClient } from "@tanstack/react-query";
import MatchResultModal from "./MatchResultModal";

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
    <div className="space-y-4 lg:space-y-6">
      {/* PREMIUM HEADER - Mobile Optimized */}
      <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#B45309] p-4 lg:p-6 shadow-[0_8px_24px_rgba(245,158,11,0.3)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col gap-3 lg:gap-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg lg:text-2xl font-black text-white tracking-tight">Cup Matcher</h2>
              <p className="text-white/80 text-xs lg:text-sm font-medium">{filteredMatches.length} matcher i turneringen</p>
            </div>
          </div>

          {/* Filter Tabs - Mobile Optimized */}
          <div className="flex items-center gap-1 lg:gap-2 bg-black/20 backdrop-blur-sm p-1 lg:p-1.5 rounded-lg lg:rounded-xl border border-white/20">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 h-9 lg:h-10 px-2 lg:px-5 rounded-md lg:rounded-lg text-xs lg:text-sm font-bold transition-all ${
                filter === 'all'
                  ? 'bg-white text-[#D97706] shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Alla
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`flex-1 h-9 lg:h-10 px-2 lg:px-5 rounded-md lg:rounded-lg text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${
                filter === 'upcoming'
                  ? 'bg-white text-[#D97706] shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Kommande <span className="hidden sm:inline">({upcomingCount})</span>
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 h-9 lg:h-10 px-2 lg:px-5 rounded-md lg:rounded-lg text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${
                filter === 'completed'
                  ? 'bg-white text-[#D97706] shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Spelade <span className="hidden sm:inline">({completedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <Card className="bg-[#121715] border-[#223029] rounded-2xl p-12 text-center">
          <Trophy className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga matcher än</h3>
          <p className="text-[#B6C2BC]">Matcher kommer att skapas när schemat genereras.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
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
    </div>
  );
}

function MatchCard({ match, index, canManage }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();
  const { alert } = useCustomDialog();

  const handleResultSaved = async () => {
      // Invalidate specific cup details to trigger refresh
      await queryClient.invalidateQueries(['cupDetails']); 
      setShowReportModal(false);
      setShowEditModal(false);
      await alert('Resultat sparat! ✅', 'Matchen har uppdaterats.', { type: 'success' });
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

  const stageColors = {
    group: 'from-[#2BA84A] to-[#248232]',
    round_of_16: 'from-[#4169E1] to-[#3457D5]',
    quarterfinal: 'from-[#9370DB] to-[#7C3AED]',
    semifinal: 'from-[#F59E0B] to-[#D97706]',
    final: 'from-[#FFD700] to-[#FFA500]',
    bronze: 'from-[#CD7F32] to-[#A0522D]'
  };

  const stageGradient = stageColors[match.stage] || stageColors.group;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card className="bg-[#121715] border-[#223029] rounded-xl lg:rounded-2xl overflow-hidden hover:border-[#F59E0B]/50 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)] group">
        {/* Stage Header Banner - Mobile Optimized */}
        <div className={`bg-gradient-to-r ${stageGradient} px-3 lg:px-4 py-2.5 lg:py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xs lg:text-sm">{stageLabels[match.stage] || match.stage}</div>
              {match.group_id && (
                <div className="text-white/80 text-[10px] lg:text-xs">Gruppspel</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 lg:gap-2">
            {isLive && (
              <Badge className="bg-[#EF4444] text-white border-0 text-[10px] lg:text-xs font-bold px-1.5 lg:px-2 py-0.5 lg:py-1 flex items-center gap-1 lg:gap-1.5 shadow-lg">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </Badge>
            )}
            {hasResult && match.extra_time && (
              <Badge className="bg-white/20 text-white border-0 text-[10px] lg:text-xs font-bold px-1.5 lg:px-2">EF</Badge>
            )}
            {hasResult && match.penalties && (
              <Badge className="bg-white/20 text-white border-0 text-[10px] lg:text-xs font-bold px-1.5 lg:px-2">STR</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-3 lg:p-5">
          {/* Teams Battle - Mobile Optimized */}
          <div className="space-y-2 lg:space-y-3 mb-3 lg:mb-4">
            <Link to={match.match_id ? `${createPageUrl("MatchDetail")}?id=${match.match_id}` : '#'}>
              <div className="flex items-center justify-between p-3 lg:p-4 bg-gradient-to-r from-[#18221E] to-[#0F1513] rounded-lg lg:rounded-xl border-2 border-[#223029] hover:border-[#F59E0B]/30 transition-all group-hover:scale-[1.01]">
                <span className="text-sm lg:text-base font-bold text-[#F4F7F5] truncate flex-1">
                  {match.team_a_name || 'Lag A'}
                </span>
                {hasResult && (
                  <span className="text-2xl lg:text-3xl font-black text-[#F59E0B] ml-2 lg:ml-4">{match.team_a_score}</span>
                )}
              </div>

              <div className="flex items-center justify-center -my-1">
                <div className="px-3 lg:px-4 py-0.5 lg:py-1 bg-[#F59E0B]/20 rounded-full border border-[#F59E0B]/30">
                  <span className="text-[10px] lg:text-xs font-black text-[#FCD34D] tracking-widest">VS</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 lg:p-4 bg-gradient-to-r from-[#0F1513] to-[#18221E] rounded-lg lg:rounded-xl border-2 border-[#223029] hover:border-[#F59E0B]/30 transition-all group-hover:scale-[1.01]">
                <span className="text-sm lg:text-base font-bold text-[#F4F7F5] truncate flex-1">
                  {match.team_b_name || 'Lag B'}
                </span>
                {hasResult && (
                  <span className="text-2xl lg:text-3xl font-black text-[#F59E0B] ml-2 lg:ml-4">{match.team_b_score}</span>
                )}
              </div>
            </Link>
          </div>

          {/* Match Info Bar - Mobile Optimized */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-medium bg-[#0F1513] p-2 lg:p-3 rounded-lg border border-[#223029]">
            {match.date && (
              <div className="flex items-center gap-1 lg:gap-1.5 text-[#B6C2BC]">
                <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-[#F59E0B]" />
                {new Date(match.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              </div>
            )}
            {match.time && (
              <div className="flex items-center gap-1 lg:gap-1.5 text-[#B6C2BC]">
                <Clock className="w-3 h-3 lg:w-4 lg:h-4 text-[#F59E0B]" />
                {match.time}
              </div>
            )}
            {match.venue_name && (
              <div className="flex items-center gap-1 lg:gap-1.5 text-[#B6C2BC] flex-1 min-w-0">
                <MapPin className="w-3 h-3 lg:w-4 lg:h-4 text-[#F59E0B] flex-shrink-0" />
                <span className="truncate">{match.venue_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {canManage && (
        <div className="mt-2 lg:mt-3 flex gap-2">
          {!hasResult ? (
             <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReportModal(true);
                }}
                className="flex-1 h-10 lg:h-11 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#1D6B28] text-white font-bold rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 lg:gap-2 text-sm lg:text-base"
            >
                <Trophy className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Rapportera Resultat</span>
                <span className="sm:hidden">Rapportera</span>
            </button>
          ) : (
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEditModal(true);
                }}
                className="flex-1 h-10 lg:h-11 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-bold rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 lg:gap-2 text-sm lg:text-base"
            >
                <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Ändra Resultat</span>
                <span className="sm:hidden">Ändra</span>
            </button>
          )}
        </div>
      )}

      {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                   <MatchResultModal 
                      match={match} 
                      onClose={() => setShowReportModal(false)} 
                      onSuccess={handleResultSaved}
                   /> 
              </div>
          </div>
      )}

      {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                   <MatchResultModal 
                      match={match} 
                      onClose={() => setShowEditModal(false)} 
                      onSuccess={handleResultSaved}
                   /> 
              </div>
          </div>
      )}
    </motion.div>
  );
}