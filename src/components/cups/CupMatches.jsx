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

  const filteredMatches = matches
    .filter(match => {
      if (filter === 'upcoming') return !match.team_a_score && match.team_a_score !== 0;
      if (filter === 'completed') return match.team_a_score !== null;
      return true;
    })
    .sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = (a.date || '').localeCompare(b.date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.time || '').localeCompare(b.time || '');
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
      <Card className="bg-gradient-to-br from-[#121715] to-[#0F1513] border-[#223029] rounded-2xl overflow-hidden hover:border-[#F59E0B]/50 transition-all shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.25)] group">
        {/* Stage Header Banner - Enhanced Mobile */}
        <div className={`bg-gradient-to-r ${stageGradient} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30">
              <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-black text-sm lg:text-base tracking-tight">{stageLabels[match.stage] || match.stage}</div>
              {match.group_id && (
                <div className="text-white/90 text-xs font-medium">Gruppspel</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge className="bg-[#EF4444] text-white border-0 text-xs font-black px-2.5 py-1 flex items-center gap-1.5 shadow-xl ring-2 ring-[#EF4444]/50">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </Badge>
            )}
            {hasResult && match.extra_time && (
              <Badge className="bg-white/25 text-white border-0 text-xs font-black px-2 py-1 backdrop-blur-sm">EF</Badge>
            )}
            {hasResult && match.penalties && (
              <Badge className="bg-white/25 text-white border-0 text-xs font-black px-2 py-1 backdrop-blur-sm">STR</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 lg:p-6">
          {/* Teams Battle - Enhanced Mobile */}
          <Link to={match.match_id ? `${createPageUrl("MatchDetail")}?id=${match.match_id}` : '#'}>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#18221E] to-[#121715] rounded-xl border-2 border-[#223029] hover:border-[#2BA84A]/40 active:scale-98 transition-all">
                <span className="text-base lg:text-lg font-black text-[#F4F7F5] truncate flex-1">
                  {match.team_a_name || 'Lag A'}
                </span>
                {hasResult && (
                  <span className="text-3xl lg:text-4xl font-black text-[#2BA84A] ml-3 tabular-nums">{match.team_a_score}</span>
                )}
              </div>

              <div className="flex items-center justify-center">
                <div className="px-5 py-1.5 bg-gradient-to-r from-[#F59E0B]/20 to-[#D97706]/20 rounded-full border-2 border-[#F59E0B]/30 shadow-lg">
                  <span className="text-xs font-black text-[#FCD34D] tracking-widest">VS</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#121715] to-[#18221E] rounded-xl border-2 border-[#223029] hover:border-[#F59E0B]/40 active:scale-98 transition-all">
                <span className="text-base lg:text-lg font-black text-[#F4F7F5] truncate flex-1">
                  {match.team_b_name || 'Lag B'}
                </span>
                {hasResult && (
                  <span className="text-3xl lg:text-4xl font-black text-[#F59E0B] ml-3 tabular-nums">{match.team_b_score}</span>
                )}
              </div>
            </div>
          </Link>

          {/* Match Info Bar - Enhanced Mobile */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold bg-[#0F1513] p-3 rounded-xl border border-[#223029]">
            {match.date && (
              <div className="flex items-center gap-1.5 text-[#B6C2BC]">
                <Calendar className="w-4 h-4 text-[#F59E0B]" />
                <span>{new Date(match.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {match.time && (
              <div className="flex items-center gap-1.5 text-[#B6C2BC]">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
                <span>{match.time}</span>
              </div>
            )}
            {match.venue_name && (
              <div className="flex items-center gap-1.5 text-[#B6C2BC] flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                <span className="truncate">{match.venue_name}</span>
              </div>
            )}
          </div>

          {/* Admin Actions - Mobile Enhanced */}
          {canManage && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {!hasResult ? (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReportModal(true);
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#1D6B28] active:scale-98 text-white font-black rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  <Trophy className="w-4 h-4" />
                  Rapportera Resultat
                </button>
              ) : (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] active:scale-98 text-white font-black rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  <Settings className="w-4 h-4" />
                  Ändra Resultat
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showReportModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4">
              <div className="w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
                   <MatchResultModal 
                      match={match} 
                      onClose={() => setShowReportModal(false)} 
                      onSuccess={handleResultSaved}
                   /> 
              </div>
          </div>
      )}

      {showEditModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4">
              <div className="w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
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