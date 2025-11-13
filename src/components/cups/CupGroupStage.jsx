import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

export default function CupGroupStage({ cup, groups, matches }) {
  if (!cup.has_group_stage || groups.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-6">
        <p className="text-center text-[#B6C2BC]">Gruppspel har inte startats än</p>
      </Card>
    );
  }

  // Get group matches
  const getGroupMatches = (groupId) => {
    return matches.filter(m => m.group_id === groupId && m.stage === 'group');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#F4F7F5] flex items-center gap-2">
        <Trophy className="w-6 h-6 text-[#2BA84A]" />
        Gruppspel
      </h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {groups.map((group, index) => {
          const groupMatches = getGroupMatches(group.id);
          const standings = group.standings || [];

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-[#121715] border border-[#223029] rounded-[20px] overflow-hidden">
                <div className="bg-gradient-to-r from-[#2BA84A]/20 to-[#248232]/10 p-4 border-b border-[#223029]">
                  <h3 className="text-xl font-bold text-[#F4F7F5]">{group.name}</h3>
                  <p className="text-sm text-[#B6C2BC]">
                    {groupMatches.length} matcher • {standings.length} lag
                  </p>
                </div>

                <CardContent className="p-0">
                  {/* Standings Table */}
                  {standings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs text-[#7B8A83] border-b border-[#223029]">
                            <th className="text-left p-3 font-semibold">#</th>
                            <th className="text-left p-3 font-semibold">Lag</th>
                            <th className="text-center p-3 font-semibold">M</th>
                            <th className="text-center p-3 font-semibold">V</th>
                            <th className="text-center p-3 font-semibold">O</th>
                            <th className="text-center p-3 font-semibold">F</th>
                            <th className="text-center p-3 font-semibold">+/-</th>
                            <th className="text-center p-3 font-semibold">P</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((standing, idx) => {
                            const isAdvancing = idx < (cup.teams_advance_per_group || 2);
                            
                            return (
                              <tr 
                                key={standing.team_id}
                                className={`border-b border-[#223029] hover:bg-[#18221E] transition-colors ${
                                  isAdvancing ? 'bg-[#2BA84A]/5' : ''
                                }`}
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#F4F7F5]">{idx + 1}</span>
                                    {isAdvancing && (
                                      <TrendingUp className="w-3 h-3 text-[#2BA84A]" />
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold text-[#F4F7F5]">
                                    {standing.team_name || `Lag ${standing.team_id.slice(0, 6)}`}
                                  </span>
                                </td>
                                <td className="text-center p-3 text-[#B6C2BC]">{standing.matches_played}</td>
                                <td className="text-center p-3 text-[#B6C2BC]">{standing.wins}</td>
                                <td className="text-center p-3 text-[#B6C2BC]">{standing.draws}</td>
                                <td className="text-center p-3 text-[#B6C2BC]">{standing.losses}</td>
                                <td className="text-center p-3">
                                  <span className={`font-mono ${
                                    standing.goal_difference > 0 ? 'text-[#2BA84A]' : 
                                    standing.goal_difference < 0 ? 'text-[#F4743B]' : 
                                    'text-[#B6C2BC]'
                                  }`}>
                                    {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
                                  </span>
                                </td>
                                <td className="text-center p-3">
                                  <Badge className="bg-[#2BA84A]/20 text-[#2BA84A] font-bold">
                                    {standing.points}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-[#B6C2BC]">
                      Tabellen uppdateras när matcher har spelats
                    </div>
                  )}

                  {/* Recent Matches */}
                  {groupMatches.length > 0 && (
                    <div className="p-4 border-t border-[#223029] bg-[#0F1513]">
                      <h4 className="text-sm font-semibold text-[#B6C2BC] mb-3">Senaste matcher</h4>
                      <div className="space-y-2">
                        {groupMatches.slice(0, 3).map(match => (
                          <div 
                            key={match.id}
                            className="flex items-center justify-between p-2 bg-[#121715] rounded-lg text-sm"
                          >
                            <span className="text-[#F4F7F5] flex-1">
                              {match.team_a_name || 'Lag A'}
                            </span>
                            {match.team_a_score !== null && match.team_b_score !== null ? (
                              <span className="font-mono font-bold text-[#F4F7F5] mx-3">
                                {match.team_a_score} - {match.team_b_score}
                              </span>
                            ) : (
                              <span className="text-[#7B8A83] mx-3">vs</span>
                            )}
                            <span className="text-[#F4F7F5] flex-1 text-right">
                              {match.team_b_name || 'Lag B'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}