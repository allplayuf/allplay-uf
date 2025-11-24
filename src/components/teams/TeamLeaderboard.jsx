import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { Trophy, Medal, ArrowUp, ArrowDown, Minus } from "lucide-react";
import RankBadge, { getRankFromElo } from "./RankBadge";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/components/utils/helpers";

export default function TeamLeaderboard({ currentTeamId }) {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      // In a real scenario with many teams, we would want a backend function 
      // or a query that sorts by ELO. For now, fetching list and sorting client side.
      const allTeams = await base44.entities.Team.list();
      
      // Filter active teams and sort by ELO descending
      const sortedTeams = allTeams
        .filter(t => t.is_active !== false)
        .sort((a, b) => (b.elo_rating || 1200) - (a.elo_rating || 1200));

      setTeams(sortedTeams);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionChange = (team, index) => {
    // Placeholder logic for trend since we don't have historical rank data easily accessible
    // in a simple list view without processing rank_history.
    // Using rank_history if available.
    
    if (!team.rank_history || team.rank_history.length < 2) return 'neutral';
    
    const currentElo = team.elo_rating || 1200;
    const prevElo = team.rank_history[team.rank_history.length - 2]?.elo || 1200;
    
    if (currentElo > prevElo) return 'up';
    if (currentElo < prevElo) return 'down';
    return 'neutral';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-[#121715] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
      <CardHeader className="border-b border-[#223029] pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFD700]" />
            Lagranking
          </CardTitle>
          <span className="text-sm text-[#B6C2BC]">Top {teams.length} lag</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#223029] bg-[#18221E]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#B6C2BC] uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#B6C2BC] uppercase tracking-wider">Lag</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#B6C2BC] uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#B6C2BC] uppercase tracking-wider hidden sm:table-cell">Matcher</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#B6C2BC] uppercase tracking-wider">ELO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#223029]">
              {teams.map((team, index) => {
                const rank = index + 1;
                const isCurrentTeam = team.id === currentTeamId;
                const trend = getPositionChange(team, index);
                
                return (
                  <tr 
                    key={team.id} 
                    onClick={() => navigate(`${createPageUrl('TeamOverview')}?id=${team.id}`)}
                    className={`
                      group transition-colors cursor-pointer
                      ${isCurrentTeam ? 'bg-[#2BA84A]/10 hover:bg-[#2BA84A]/20' : 'hover:bg-[#18221E]'}
                    `}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`
                          font-bold w-6 text-center
                          ${rank === 1 ? 'text-[#FFD700]' : 
                            rank === 2 ? 'text-[#C0C0C0]' : 
                            rank === 3 ? 'text-[#CD7F32]' : 'text-[#F4F7F5]'}
                        `}>
                          {rank}
                        </span>
                        {trend === 'up' && <ArrowUp className="w-3 h-3 text-[#2BA84A]" />}
                        {trend === 'down' && <ArrowDown className="w-3 h-3 text-[#DC2626]" />}
                        {trend === 'neutral' && <Minus className="w-3 h-3 text-[#7B8A83]" />}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#18221E] rounded-lg flex items-center justify-center mr-3 overflow-hidden border border-[#223029]">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[#F4F7F5]">{team.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${isCurrentTeam ? 'text-[#2BA84A]' : 'text-[#F4F7F5]'}`}>
                            {team.name}
                          </div>
                          <div className="text-xs text-[#B6C2BC]">{team.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <RankBadge elo={team.elo_rating} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-[#B6C2BC] hidden sm:table-cell">
                      {team.matches_played || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-[#F4F7F5]">{team.elo_rating || 1200}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}