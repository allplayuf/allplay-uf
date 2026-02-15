import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown, Minus, Percent, Swords, Shield } from "lucide-react";

function StatBox({ label, value, color = 'text-[#F4F7F5]', icon: Icon }) {
  return (
    <div className="bg-[#0F1513] rounded-xl p-3 border border-[#223029] text-center">
      {Icon && (
        <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-[#18221E] flex items-center justify-center">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
      )}
      <div className={`text-xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-[#9EAAA4] font-semibold uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

export default function TeamStatsCard({ team }) {
  const played = team.matches_played || 0;
  const wins = team.wins || 0;
  const draws = team.draws || 0;
  const losses = team.losses || 0;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  // Simple form guide from recent results (placeholder since we don't track per-match)
  const totalPoints = wins * 3 + draws;
  const maxPoints = played * 3;
  const pointsPerGame = played > 0 ? (totalPoints / played).toFixed(1) : '0.0';

  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
      <div className="border-b border-[#223029] px-5 py-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#2BA84A]" />
        <h3 className="text-base font-bold text-[#F4F7F5]">Lagstatistik</h3>
      </div>
      <CardContent className="p-5 space-y-4">
        {/* Win rate bar */}
        <div className="bg-[#0F1513] rounded-xl p-4 border border-[#223029]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9EAAA4]">Vinstprocent</span>
            <span className="text-lg font-black text-[#2BA84A]">{winRate}%</span>
          </div>
          <div className="h-2 bg-[#18221E] rounded-full overflow-hidden flex">
            {played > 0 && (
              <>
                <div className="bg-[#2BA84A] h-full rounded-l-full" style={{ width: `${(wins / played) * 100}%` }} />
                <div className="bg-[#9EAAA4] h-full" style={{ width: `${(draws / played) * 100}%` }} />
                <div className="bg-[#DC2626] h-full rounded-r-full" style={{ width: `${(losses / played) * 100}%` }} />
              </>
            )}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-semibold">
            <span className="text-[#2BA84A]">{wins}V</span>
            <span className="text-[#9EAAA4]">{draws}O</span>
            <span className="text-[#DC2626]">{losses}F</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Spelade" value={played} icon={Swords} color="text-[#F4F7F5]" />
          <StatBox label="Vinster" value={wins} icon={TrendingUp} color="text-[#2BA84A]" />
          <StatBox label="Förluster" value={losses} icon={TrendingDown} color="text-[#DC2626]" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Oavgjort" value={draws} icon={Minus} color="text-[#9EAAA4]" />
          <StatBox label="Poäng/match" value={pointsPerGame} icon={Percent} color="text-[#F4743B]" />
        </div>

        {/* ELO */}
        {!team.is_cup_team && (
          <div className="bg-gradient-to-r from-[#2BA84A]/10 to-[#248232]/5 rounded-xl p-4 border border-[#2BA84A]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2BA84A]" />
              <span className="text-sm font-semibold text-[#F4F7F5]">ELO Rating</span>
            </div>
            <span className="text-2xl font-black text-[#2BA84A]">{team.elo_rating || 1000}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}