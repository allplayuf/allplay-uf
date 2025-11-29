import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CupBracket({ cup, brackets, matches }) {
  if (!brackets || brackets.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-12 text-center shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
        <Trophy className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inget slutspel än</h3>
        <p className="text-[#B6C2BC]">Slutspelet skapas när gruppspelet är klart.</p>
      </Card>
    );
  }

  const stages = ['round_of_16', 'quarterfinal', 'semifinal', 'bronze', 'final'];
  const stageLabels = {
    round_of_16: 'Åttondelsfinaler',
    quarterfinal: 'Kvartsfinaler',
    semifinal: 'Semifinaler',
    final: 'FINAL',
    bronze: 'Bronsmatch'
  };

  const stageColors = {
    round_of_16: { bg: 'from-[#4169E1]/10 to-[#3457D5]/5', border: 'border-[#4169E1]/30', icon: '#4169E1', textColor: 'text-[#4169E1]' },
    quarterfinal: { bg: 'from-[#9370DB]/10 to-[#7C3AED]/5', border: 'border-[#9370DB]/30', icon: '#9370DB', textColor: 'text-[#9370DB]' },
    semifinal: { bg: 'from-[#F59E0B]/10 to-[#D97706]/5', border: 'border-[#F59E0B]/30', icon: '#F59E0B', textColor: 'text-[#F59E0B]' },
    final: { bg: 'from-[#FFD700] via-[#FFA500] to-[#FF8C00]', border: 'border-[#FFD700]', icon: '#FFD700', textColor: 'text-[#FFD700]' },
    bronze: { bg: 'from-[#CD7F32]/10 to-[#A0522D]/5', border: 'border-[#CD7F32]/30', icon: '#CD7F32', textColor: 'text-[#CD7F32]' }
  };

  // Organize stages into progression flow
  const finalBracket = brackets.find(b => b.stage === 'final');
  const finalMatch = finalBracket ? matches.find(m => m.id === finalBracket.cup_match_id) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#FFD700]" />
        <h2 className="text-[#F4F7F5] heading-h2">Slutspelsutslagning</h2>
      </div>

      {/* BRACKET FLOW VISUALIZATION */}
      <div className="relative">
        {stages.map((stage) => {
          const stageBrackets = brackets.filter(b => b.stage === stage);
          if (stageBrackets.length === 0) return null;

          const stageColor = stageColors[stage];
          const isFinal = stage === 'final';

          // Special rendering for FINAL
          if (isFinal && finalBracket && finalMatch) {
            return (
              <motion.div 
                key={stage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-12"
              >
                <FinalMatchCard 
                  bracket={finalBracket}
                  match={finalMatch}
                  cup={cup}
                />
              </motion.div>
            );
          }

          return (
            <div key={stage} className="mb-10">
              {/* Stage Header with Progression */}
              <div className="relative mb-6">
                <div className={`bg-gradient-to-r ${stageColor.bg} rounded-xl p-4 border ${stageColor.border} shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`${stageColor.textColor} flex items-center gap-3 heading-h3`}>
                      {stage === 'bronze' && <Award className="w-6 h-6" />}
                      {stage !== 'bronze' && <Trophy className="w-6 h-6" />}
                      {stageLabels[stage]}
                      <Badge className="bg-white/20 text-white border-0 badge-text">
                        {stageBrackets.length} {stageBrackets.length === 1 ? 'match' : 'matcher'}
                      </Badge>
                    </h3>
                    {stage !== 'bronze' && (
                      <div className="flex items-center gap-2 text-white/70 body-xs" style={{ fontWeight: 500 }}>
                        <span>Vinnare går vidare</span>
                        <span className="text-lg">→</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector line to next stage */}
                {stage !== 'bronze' && stage !== 'semifinal' && (
                  <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-[#F59E0B] to-transparent mt-2"></div>
                )}
              </div>

              {/* Matches Grid */}
              <div className={`grid gap-4 ${
                stage === 'quarterfinal' ? 'sm:grid-cols-2 lg:grid-cols-4' :
                stage === 'semifinal' ? 'sm:grid-cols-2 max-w-4xl mx-auto' :
                'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {stageBrackets.map((bracket, index) => (
                  <BracketMatch 
                    key={bracket.id} 
                    bracket={bracket}
                    match={matches.find(m => m.id === bracket.cup_match_id)}
                    index={index}
                    stage={stage}
                    stageColor={stageColor}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketMatch({ bracket, match, index, stage, stageColor }) {
  const hasResult = match && (match.team_a_score !== null && match.team_a_score !== undefined);
  
  // Determine winner - CRITICAL: Check penalties for knockout stages
  let winner = null;
  if (hasResult) {
    if (match.team_a_score > match.team_b_score) {
      winner = 'a';
    } else if (match.team_b_score > match.team_a_score) {
      winner = 'b';
    } else if (match.penalties && match.penalty_score) {
      // If draw, check penalty winner
      const [penA, penB] = match.penalty_score.split('-').map(Number);
      winner = penA > penB ? 'a' : penB > penA ? 'b' : null;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className={`bg-[#121715] border ${stageColor.border} rounded-xl overflow-hidden hover:border-[#F59E0B]/50 transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] group`}>
        <CardContent className="p-4">
          {/* Position Badge */}
          <Badge className={`mb-3 ${stageColor.textColor} bg-opacity-20 border-0 text-xs font-semibold`}>
            Match {bracket.position}
          </Badge>

          {/* Team A */}
          <div className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
            winner === 'a' 
              ? 'bg-gradient-to-r from-[#2BA84A]/30 to-[#2BA84A]/10 border-2 border-[#2BA84A] shadow-[0_0_20px_rgba(43,168,74,0.3)]' 
              : 'bg-[#18221E] border border-[#223029] hover:border-[#223029]/50'
          }`}>
            <span className="text-sm font-semibold text-[#F4F7F5] flex-1 truncate">
              {bracket.team_a_name || (bracket.team_a_id ? `Lag A` : 'TBD')}
            </span>
            <div className="flex items-center gap-2">
              {hasResult && (
                <span className={`text-xl font-black ${winner === 'a' ? 'text-[#2BA84A]' : 'text-[#7B8A83]'}`}>
                  {match.team_a_score}
                </span>
              )}
              {winner === 'a' && <Trophy className="w-5 h-5 text-[#2BA84A] animate-pulse" />}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center my-2">
            <div className="px-3 py-1 bg-[#F59E0B]/20 rounded-full border border-[#F59E0B]/30">
              <span className="text-[10px] font-black text-[#FCD34D] tracking-widest">VS</span>
            </div>
          </div>

          {/* Team B */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
            winner === 'b' 
              ? 'bg-gradient-to-r from-[#2BA84A]/30 to-[#2BA84A]/10 border-2 border-[#2BA84A] shadow-[0_0_20px_rgba(43,168,74,0.3)]' 
              : 'bg-[#18221E] border border-[#223029] hover:border-[#223029]/50'
          }`}>
            <span className="text-sm font-semibold text-[#F4F7F5] flex-1 truncate">
              {bracket.team_b_name || (bracket.team_b_id ? `Lag B` : 'TBD')}
            </span>
            <div className="flex items-center gap-2">
              {hasResult && (
                <span className={`text-xl font-black ${winner === 'b' ? 'text-[#2BA84A]' : 'text-[#7B8A83]'}`}>
                  {match.team_b_score}
                </span>
              )}
              {winner === 'b' && <Trophy className="w-5 h-5 text-[#2BA84A] animate-pulse" />}
            </div>
          </div>

          {/* Extra Info */}
          {match && (
            <div className="mt-3 flex flex-wrap gap-2">
              {match.extra_time && (
                <Badge className="bg-[#FFA500]/20 text-[#FFA500] border-0 text-[10px] font-bold">
                  EF
                </Badge>
              )}
              {match.penalties && (
                <Badge className="bg-[#EF4444]/20 text-[#EF4444] border-0 text-[10px] font-bold">
                  STR {match.penalty_score}
                </Badge>
              )}
              {winner && (
                <Badge className="bg-[#2BA84A]/20 text-[#2BA84A] border-0 text-[10px] font-bold flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Går vidare
                </Badge>
              )}
              {match.match_id && (
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.match_id}`}>
                  <Badge className="bg-[#18221E] text-[#B6C2BC] hover:bg-[#F59E0B]/20 hover:text-[#FCD34D] border-0 text-[10px] cursor-pointer transition-all">
                    Detaljer →
                  </Badge>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// NEW: Special FINAL Match Card Component
function FinalMatchCard({ bracket, match, cup }) {
  const hasResult = match && (match.team_a_score !== null && match.team_a_score !== undefined);
  
  // Determine winner - CRITICAL: Check penalties
  let winner = null;
  if (hasResult) {
    if (match.team_a_score > match.team_b_score) {
      winner = 'a';
    } else if (match.team_b_score > match.team_a_score) {
      winner = 'b';
    } else if (match.penalties && match.penalty_score) {
      const [penA, penB] = match.penalty_score.split('-').map(Number);
      winner = penA > penB ? 'a' : penB > penA ? 'b' : null;
    }
  }

  const winnerName = winner === 'a' ? bracket.team_a_name : winner === 'b' ? bracket.team_b_name : null;

  return (
    <div className="relative">
      {/* Epic Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/20 via-[#FFA500]/10 to-[#FF8C00]/20 rounded-3xl blur-3xl"></div>
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <Card className="bg-gradient-to-br from-[#1A1A1A] via-[#121715] to-[#0F1513] border-4 border-[#FFD700] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(255,215,0,0.4)]">
          
          {/* Animated Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] p-6 lg:p-8">
            <motion.div 
              className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"
              animate={{ x: [0, 40, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mb-4"
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                  <Trophy className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </div>
              </motion.div>
              
              <h1 className="text-white mb-2 tracking-tight uppercase heading-h1" style={{ fontSize: '40px', lineHeight: '48px', fontWeight: 700 }}>
                FINAL
              </h1>
              <p className="text-white/90 body-small" style={{ fontWeight: 600 }}>{cup.name}</p>
            </div>
          </div>

          <CardContent className="p-6 lg:p-10">
            {/* Teams Battle */}
            <div className="space-y-4 mb-6">
              {/* Team A */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all ${
                  winner === 'a'
                    ? 'bg-gradient-to-r from-[#FFD700]/30 via-[#FFA500]/20 to-[#FFD700]/30 border-4 border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.5)]'
                    : 'bg-[#18221E] border-2 border-[#223029] hover:border-[#FFD700]/50'
                }`}
              >
                {winner === 'a' && (
                  <motion.div 
                    className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/20 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-[#B6C2BC] mb-1 uppercase body-xs" style={{ fontWeight: 600 }}>Finalist 1</div>
                    <h2 className="text-white mb-1 heading-h2" style={{ fontSize: '28px', lineHeight: '34px', fontWeight: 700 }}>
                      {bracket.team_a_name || 'TBD'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasResult && (
                      <span className={`stat-number ${
                        winner === 'a' ? 'text-[#FFD700]' : 'text-[#7B8A83]'
                      }`} style={{ fontSize: '56px', lineHeight: '60px' }}>
                        {match.team_a_score}
                      </span>
                    )}
                    {winner === 'a' && (
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Trophy className="w-8 h-8 lg:w-10 lg:h-10 text-[#FFD700]" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* VS EPIC DIVIDER */}
              <div className="flex items-center justify-center py-4">
                <motion.div 
                  className="px-8 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full shadow-xl ring-4 ring-[#FFD700]/30"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-2xl font-black text-white tracking-widest">VS</span>
                </motion.div>
              </div>

              {/* Team B */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all ${
                  winner === 'b'
                    ? 'bg-gradient-to-r from-[#FFD700]/30 via-[#FFA500]/20 to-[#FFD700]/30 border-4 border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.5)]'
                    : 'bg-[#18221E] border-2 border-[#223029] hover:border-[#FFD700]/50'
                }`}
              >
                {winner === 'b' && (
                  <motion.div 
                    className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/20 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-[#B6C2BC] mb-1 uppercase body-xs" style={{ fontWeight: 600 }}>Finalist 2</div>
                    <h2 className="text-white mb-1 heading-h2" style={{ fontSize: '28px', lineHeight: '34px', fontWeight: 700 }}>
                      {bracket.team_b_name || 'TBD'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasResult && (
                      <span className={`stat-number ${
                        winner === 'b' ? 'text-[#FFD700]' : 'text-[#7B8A83]'
                      }`} style={{ fontSize: '56px', lineHeight: '60px' }}>
                        {match.team_b_score}
                      </span>
                    )}
                    {winner === 'b' && (
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Trophy className="w-8 h-8 lg:w-10 lg:h-10 text-[#FFD700]" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Winner Banner */}
            {winner && winnerName && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] rounded-2xl p-6 text-center shadow-2xl"
              >
                <Trophy className="w-12 h-12 text-white mx-auto mb-3" />
                <div className="text-white/80 uppercase tracking-widest mb-1 badge-text">Mästare</div>
                <h2 className="text-white tracking-tight mb-2 heading-h1" style={{ fontSize: '36px', lineHeight: '42px', fontWeight: 700 }}>
                  {winnerName}
                </h2>
                <p className="text-white/90 body-small" style={{ fontWeight: 500 }}>Grattis till er fantastiska vinst! 🏆</p>
              </motion.div>
            )}

            {/* Match Details */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {match.extra_time && (
                <Badge className="bg-[#FFA500]/20 text-[#FFA500] border-0 px-4 py-2 badge-text" style={{ fontSize: '14px' }}>
                  Förlängning
                </Badge>
              )}
              {match.penalties && (
                <Badge className="bg-[#EF4444]/20 text-[#EF4444] border-0 px-4 py-2 badge-text" style={{ fontSize: '14px' }}>
                  Straffar {match.penalty_score}
                </Badge>
              )}
              {match.match_id && (
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.match_id}`}>
                  <Badge className="bg-[#18221E] text-[#FFD700] hover:bg-[#FFD700]/20 border-0 px-4 py-2 cursor-pointer transition-all badge-text" style={{ fontSize: '14px' }}>
                    Se matchdetaljer →
                  </Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}