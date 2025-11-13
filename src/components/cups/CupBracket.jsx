import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function CupBracket({ cup, brackets, matches }) {
  if (!brackets || brackets.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-12 text-center">
        <Trophy className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inget slutspel än</h3>
        <p className="text-[#B6C2BC]">Slutspelet skapas när gruppspelet är klart.</p>
      </Card>
    );
  }

  const stages = ['quarterfinal', 'semifinal', 'final', 'bronze'];
  const stageLabels = {
    quarterfinal: 'Kvartsfinal',
    semifinal: 'Semifinal',
    final: 'Final',
    bronze: 'Bronsmatch'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#F4743B]" />
        <h2 className="text-xl font-bold text-[#F4F7F5]">Slutspel</h2>
      </div>

      <div className="space-y-8">
        {stages.map((stage) => {
          const stageBrackets = brackets.filter(b => b.stage === stage);
          if (stageBrackets.length === 0) return null;

          return (
            <div key={stage}>
              <h3 className="text-lg font-bold text-[#F4F7F5] mb-4 flex items-center gap-2">
                {stage === 'final' && <Trophy className="w-5 h-5 text-[#FFD700]" />}
                {stage === 'bronze' && <Award className="w-5 h-5 text-[#CD7F32]" />}
                {stageLabels[stage]}
              </h3>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stageBrackets.map((bracket, index) => (
                  <BracketMatch 
                    key={bracket.id} 
                    bracket={bracket}
                    match={matches.find(m => m.id === bracket.cup_match_id)}
                    index={index}
                    stage={stage}
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

function BracketMatch({ bracket, match, index, stage }) {
  const hasResult = match && match.team_a_score !== null;
  const winner = hasResult ? (match.team_a_score > match.team_b_score ? 'a' : 'b') : null;

  const stageColors = {
    quarterfinal: 'border-[#F4743B]/30',
    semifinal: 'border-[#FFA500]/30',
    final: 'border-[#FFD700]/50',
    bronze: 'border-[#CD7F32]/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className={`bg-[#121715] border ${stageColors[stage] || 'border-[#223029]'} rounded-[16px] overflow-hidden hover:border-[#F4743B]/50 transition-all`}>
        <CardContent className="p-4">
          {/* Position Badge */}
          <Badge className="mb-3 bg-[#F4743B]/20 text-[#F4743B] border-[#F4743B]/30 text-xs">
            Match {bracket.position}
          </Badge>

          {/* Team A */}
          <div className={`flex items-center justify-between p-3 rounded-lg mb-2 ${
            winner === 'a' ? 'bg-[#2BA84A]/20 border border-[#2BA84A]/30' : 'bg-[#18221E]'
          }`}>
            <span className="text-sm font-semibold text-[#F4F7F5]">
              {bracket.team_a_id ? `Lag A` : 'TBD'}
            </span>
            {hasResult && (
              <span className="text-lg font-bold text-[#F4F7F5]">{match.team_a_score}</span>
            )}
            {winner === 'a' && <Trophy className="w-4 h-4 text-[#2BA84A]" />}
          </div>

          {/* VS */}
          <div className="text-center text-xs text-[#7B8A83] my-1">vs</div>

          {/* Team B */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            winner === 'b' ? 'bg-[#2BA84A]/20 border border-[#2BA84A]/30' : 'bg-[#18221E]'
          }`}>
            <span className="text-sm font-semibold text-[#F4F7F5]">
              {bracket.team_b_id ? `Lag B` : 'TBD'}
            </span>
            {hasResult && (
              <span className="text-lg font-bold text-[#F4F7F5]">{match.team_b_score}</span>
            )}
            {winner === 'b' && <Trophy className="w-4 h-4 text-[#2BA84A]" />}
          </div>

          {/* Extra Info */}
          {match && (
            <div className="mt-3 flex flex-wrap gap-2">
              {match.extra_time && (
                <Badge className="bg-[#FFA500]/20 text-[#FFA500] border-[#FFA500]/30 text-xs">
                  Förlängning
                </Badge>
              )}
              {match.penalties && (
                <Badge className="bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30 text-xs">
                  Straffar {match.penalty_score}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}