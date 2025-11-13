import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function CupBracket({ cup, brackets, matches }) {
  if (!cup.has_playoffs || brackets.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-6">
        <p className="text-center text-[#B6C2BC]">Slutspelet har inte startats än</p>
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

  const getBracketsByStage = (stage) => {
    return brackets.filter(b => b.stage === stage).sort((a, b) => a.position - b.position);
  };

  const getMatchForBracket = (bracketId) => {
    const bracket = brackets.find(b => b.id === bracketId);
    if (!bracket?.cup_match_id) return null;
    return matches.find(m => m.id === bracket.cup_match_id);
  };

  const renderBracketMatch = (bracket, index) => {
    const match = getMatchForBracket(bracket.id);
    const hasResult = match?.team_a_score !== null && match?.team_b_score !== null;

    return (
      <motion.div
        key={bracket.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="mb-4"
      >
        <Card className="bg-[#18221E] border border-[#223029] rounded-xl overflow-hidden hover:border-[#F4743B]/30 transition-colors">
          <CardContent className="p-0">
            {/* Team A */}
            <div className={`flex items-center justify-between p-4 border-b border-[#223029] ${
              hasResult && match.winner_id === bracket.team_a_id ? 'bg-[#2BA84A]/10' : ''
            }`}>
              <span className="font-semibold text-[#F4F7F5]">
                {bracket.team_a_name || 'TBD'}
              </span>
              {hasResult && (
                <Badge className={`font-mono font-bold ${
                  match.winner_id === bracket.team_a_id ? 'bg-[#2BA84A] text-white' : 'bg-[#18221E] text-[#B6C2BC]'
                }`}>
                  {match.team_a_score}
                </Badge>
              )}
            </div>

            {/* Team B */}
            <div className={`flex items-center justify-between p-4 ${
              hasResult && match.winner_id === bracket.team_b_id ? 'bg-[#2BA84A]/10' : ''
            }`}>
              <span className="font-semibold text-[#F4F7F5]">
                {bracket.team_b_name || 'TBD'}
              </span>
              {hasResult && (
                <Badge className={`font-mono font-bold ${
                  match.winner_id === bracket.team_b_id ? 'bg-[#2BA84A] text-white' : 'bg-[#18221E] text-[#B6C2BC]'
                }`}>
                  {match.team_b_score}
                </Badge>
              )}
            </div>

            {/* Match details */}
            {match && (
              <div className="p-3 bg-[#0F1513] border-t border-[#223029] text-center">
                <p className="text-xs text-[#7B8A83]">
                  {match.extra_time && <span className="mr-2">📈 Förlängning</span>}
                  {match.penalties && <span>🎯 Straffar {match.penalty_score}</span>}
                  {!hasResult && <span>Väntar på resultat</span>}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-[#F4F7F5] flex items-center gap-2">
        <Trophy className="w-6 h-6 text-[#F4743B]" />
        Slutspel
      </h2>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Quarterfinals */}
        {getBracketsByStage('quarterfinal').length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">
              {stageLabels.quarterfinal}
            </h3>
            {getBracketsByStage('quarterfinal').map((bracket, idx) => 
              renderBracketMatch(bracket, idx)
            )}
          </div>
        )}

        {/* Semifinals */}
        {getBracketsByStage('semifinal').length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">
              {stageLabels.semifinal}
            </h3>
            {getBracketsByStage('semifinal').map((bracket, idx) => 
              renderBracketMatch(bracket, idx)
            )}
          </div>
        )}

        {/* Finals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bronze match */}
          {getBracketsByStage('bronze').length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-[#F4F7F5] mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-[#CD7F32]" />
                {stageLabels.bronze}
              </h3>
              {getBracketsByStage('bronze').map((bracket, idx) => 
                renderBracketMatch(bracket, idx)
              )}
            </div>
          )}

          {/* Final */}
          {getBracketsByStage('final').length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-[#F4F7F5] mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#F4743B]" />
                {stageLabels.final}
              </h3>
              {getBracketsByStage('final').map((bracket, idx) => 
                renderBracketMatch(bracket, idx)
              )}
              
              {/* Winner display */}
              {getBracketsByStage('final')[0]?.winner_id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6 p-6 bg-gradient-to-r from-[#F4743B]/20 to-[#FF8652]/10 border border-[#F4743B]/30 rounded-2xl text-center"
                >
                  <Award className="w-12 h-12 text-[#F4743B] mx-auto mb-3" />
                  <h4 className="text-2xl font-bold text-[#F4F7F5] mb-2">🏆 Vinnare</h4>
                  <p className="text-xl font-bold text-[#F4743B]">
                    {getBracketsByStage('final')[0].winner_name || 'Mästare'}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}