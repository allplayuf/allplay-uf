import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CupGroupStage({ cup, groups, matches }) {
  if (!groups || groups.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-12 text-center shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
        <Users className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga grupper än</h3>
        <p className="text-[#B6C2BC]">Grupper kommer att skapas när schemat genereras.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#F59E0B]" />
        <h2 className="text-xl font-bold text-[#F4F7F5]">Gruppspel</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {groups.map((group, index) => (
          <GroupCard 
            key={group.id} 
            group={group} 
            index={index}
            matches={matches.filter(m => m.group_id === group.id)}
            cup={cup}
          />
        ))}
      </div>
    </div>
  );
}

function GroupCard({ group, index, matches, cup }) {
  const standings = group.standings || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="bg-[#121715] border border-[#F59E0B]/30 rounded-2xl overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
        <div className="bg-gradient-to-r from-[#F59E0B]/20 to-[#D97706]/10 p-4 border-b border-[#F59E0B]/30">
          <h3 className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#F59E0B]" />
            {group.name}
          </h3>
        </div>

        <CardContent className="p-0">
          {/* Standings Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#18221E] text-xs text-[#B6C2BC] uppercase">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Lag</th>
                  <th className="px-2 py-3 text-center">M</th>
                  <th className="px-2 py-3 text-center hidden sm:table-cell">V</th>
                  <th className="px-2 py-3 text-center hidden sm:table-cell">O</th>
                  <th className="px-2 py-3 text-center hidden sm:table-cell">F</th>
                  <th className="px-2 py-3 text-center">MS</th>
                  <th className="px-2 py-3 text-center font-bold">P</th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-[#B6C2BC]">
                      Tabellen uppdateras när matcher spelas
                    </td>
                  </tr>
                ) : (
                  standings.map((team, idx) => {
                    const isAdvancing = idx < (cup.teams_advance_per_group || 2);
                    return (
                      <tr 
                        key={team.team_id} 
                        className={`border-b border-[#223029] hover:bg-[#18221E] transition-colors ${
                          isAdvancing ? 'bg-[#2BA84A]/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${
                            isAdvancing ? 'text-[#2BA84A]' : 'text-[#B6C2BC]'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`${createPageUrl("TeamOverview")}?id=${team.team_id}`} className="hover:underline">
                            <span className="text-sm font-semibold text-[#F4F7F5]">
                              {team.team_name || `Lag ${team.team_id.slice(0, 4)}`}
                            </span>
                          </Link>
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-[#B6C2BC]">
                          {team.matches_played}
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-[#B6C2BC] hidden sm:table-cell">
                          {team.wins}
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-[#B6C2BC] hidden sm:table-cell">
                          {team.draws}
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-[#B6C2BC] hidden sm:table-cell">
                          {team.losses}
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-[#F4F7F5] font-mono">
                          {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className="text-sm font-bold text-[#F59E0B]">
                            {team.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Matches */}
          {matches.length > 0 && (
            <div className="p-4 border-t border-[#223029]">
              <h4 className="text-sm font-semibold text-[#F4F7F5] mb-3">Matcher i gruppen</h4>
              <div className="space-y-2">
                {matches
                  .sort((a, b) => {
                    const dateCompare = (a.date || '').localeCompare(b.date || '');
                    if (dateCompare !== 0) return dateCompare;
                    return (a.time || '').localeCompare(b.time || '');
                  })
                  .slice(0, 5)
                  .map((match) => (
                    <Link key={match.id} to={match.match_id ? `${createPageUrl("MatchDetail")}?id=${match.match_id}` : '#'}>
                      <div className="flex items-center justify-between p-3 bg-[#0F1513] rounded-xl border border-[#223029] hover:border-[#F59E0B]/30 transition-all group">
                        <div className="flex-1">
                          <span className="text-sm text-[#F4F7F5] font-semibold">
                            {match.team_a_name || 'Lag A'} vs {match.team_b_name || 'Lag B'}
                          </span>
                          <span className="text-xs text-[#7B8A83] ml-2">
                            {match.time}
                          </span>
                        </div>
                        {match.team_a_score !== null && match.team_a_score !== undefined ? (
                          <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-sm font-bold">
                            {match.team_a_score} - {match.team_b_score}
                          </Badge>
                        ) : (
                          <Badge className="bg-[#18221E] text-[#B6C2BC] border-0 text-xs">
                            Ej spelad
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Legend */}
          {standings.length > 0 && (
            <div className="p-4 border-t border-[#223029] bg-[#0F1513]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#2BA84A]/20 border border-[#2BA84A]/30 rounded"></div>
                  <span className="text-[#B6C2BC] font-medium">Går vidare till slutspel</span>
                </div>
                <div className="text-[#7B8A83]">
                  M=Matcher · V=Vinster · O=Oavgjort · F=Förluster · MS=Målskillnad · P=Poäng
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}