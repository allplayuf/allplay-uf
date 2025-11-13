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

  const stages = ['round_of_16', 'quarterfinal', 'semifinal', 'final', 'bronze'];
  const stageLabels = {
    round_of_16: 'Åttondelsfinaler',
    quarterfinal: 'Kvartsfinaler',
    semifinal: 'Semifinaler',
    final: 'Final',
    bronze: 'Bronsmatch'
  };

  const stageColors = {
    round_of_16: { bg: 'from-[#4169E1]/10 to-[#3457D5]/5', border: 'border-[#4169E1]/30', icon: '#4169E1' },
    quarterfinal: { bg: 'from-[#9370DB]/10 to-[#7C3AED]/5', border: 'border-[#9370DB]/30', icon: '#9370DB' },
    semifinal: { bg: 'from-[#F59E0B]/10 to-[#D97706]/5', border: 'border-[#F59E0B]/30', icon: '#F59E0B' },
    final: { bg: 'from-[#FFD700]/10 to-[#FFA500]/5', border: 'border-[#FFD700]/50', icon: '#FFD700' },
    bronze: { bg: 'from-[#CD7F32]/10 to-[#A0522D]/5', border: 'border-[#CD7F32]/30', icon: '#CD7F32' }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#F59E0B]" />
        <h2 className="text-xl font-bold text-[#F4F7F5]">Slutspel</h2>
      </div>

      {stages.map((stage) => {
        const stageBrackets = brackets.filter(b => b.stage === stage);
        if (stageBrackets.length === 0) return null;

        const stageColor = stageColors[stage];

        return (
          <div key={stage}>
            <div className={`bg-gradient-to-r ${stageColor.bg} rounded-xl p-4 mb-4 border ${stageColor.border}`}>
              <h3 className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
                {stage === 'final' && <Trophy className="w-5 h-5" style={{ color: stageColor.icon }} />}
                {stage === 'bronze' && <Award className="w-5 h-5" style={{ color: stageColor.icon }} />}
                {stageLabels[stage]}
                <Badge className="ml-2 bg-white/10 text-white border-0 text-xs">
                  {stageBrackets.length} {stageBrackets.length === 1 ? 'match' : 'matcher'}
                </Badge>
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
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
  );
}

function BracketMatch({ bracket, match, index, stage, stageColor }) {
  const hasResult = match && (match.team_a_score !== null && match.team_a_score !== undefined);
  const winner = hasResult ? (match.team_a_score > match.team_b_score ? 'a' : match.team_b_score > match.team_a_score ? 'b' : 'draw') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className={`bg-[#121715] border ${stageColor.border} rounded-xl overflow-hidden hover:border-[#F59E0B]/50 transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)]`}>
        <CardContent className="p-4">
          {/* Position Badge */}
          <Badge className="mb-3 bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-xs font-semibold">
            Match {bracket.position}
          </Badge>

          {/* Team A */}
          <div className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
            winner === 'a' ? 'bg-[#2BA84A]/20 border-2 border-[#2BA84A] shadow-lg' : 'bg-[#18221E] border border-[#223029]'
          }`}>
            <span className="text-sm font-semibold text-[#F4F7F5] flex-1 truncate">
              {bracket.team_a_name || (bracket.team_a_id ? `Lag A` : 'TBD')}
            </span>
            <div className="flex items-center gap-2">
              {hasResult && (
                <span className="text-lg font-bold text-[#F4F7F5]">{match.team_a_score}</span>
              )}
              {winner === 'a' && <Trophy className="w-4 h-4 text-[#2BA84A]" />}
            </div>
          </div>

          {/* VS */}
          <div className="text-center text-xs text-[#7B8A83] font-bold my-1">VS</div>

          {/* Team B */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
            winner === 'b' ? 'bg-[#2BA84A]/20 border-2 border-[#2BA84A] shadow-lg' : 'bg-[#18221E] border border-[#223029]'
          }`}>
            <span className="text-sm font-semibold text-[#F4F7F5] flex-1 truncate">
              {bracket.team_b_name || (bracket.team_b_id ? `Lag B` : 'TBD')}
            </span>
            <div className="flex items-center gap-2">
              {hasResult && (
                <span className="text-lg font-bold text-[#F4F7F5]">{match.team_b_score}</span>
              )}
              {winner === 'b' && <Trophy className="w-4 h-4 text-[#2BA84A]" />}
            </div>
          </div>

          {/* Extra Info */}
          {match && (
            <div className="mt-3 flex flex-wrap gap-2">
              {match.extra_time && (
                <Badge className="bg-[#FFA500]/20 text-[#FFA500] border-0 text-xs">
                  Förlängning
                </Badge>
              )}
              {match.penalties && (
                <Badge className="bg-[#FF6B35]/20 text-[#FF6B35] border-0 text-xs">
                  Straffar {match.penalty_score}
                </Badge>
              )}
              {match.match_id && (
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.match_id}`}>
                  <Badge className="bg-[#18221E] text-[#B6C2BC] hover:bg-[#F59E0B]/20 hover:text-[#FCD34D] border-0 text-xs cursor-pointer transition-all">
                    Se detaljer →
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