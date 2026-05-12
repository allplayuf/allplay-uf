import React from 'react';
import { TrendingUp, Trophy } from "lucide-react";

const LEVELS = [
  { name: "Nybörjare",   min: 0,    max: 1000, accent: "#9EAAA4" },
  { name: "Fortsättare", min: 1000, max: 1200, accent: "#86EFAC" },
  { name: "Erfaren",     min: 1200, max: 1400, accent: "#34C257" },
  { name: "Avancerad",   min: 1400, max: 1600, accent: "#C4B5FD" },
  { name: "Expert",      min: 1600, max: 2000, accent: "#FCD34D" },
];

export default function RankingProgress({ user }) {
  const elo = user?.elo_rating || 1200;
  const currentLevel = LEVELS.find(l => elo >= l.min && elo < l.max) || LEVELS[LEVELS.length - 1];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progressPct = nextLevel
    ? ((elo - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100
    : 100;
  const pointsToNext = nextLevel ? nextLevel.min - elo : 0;

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-[#223029] p-5"
      style={{
        background: "linear-gradient(135deg, #151B18 0%, #111613 55%, #0C100E 100%)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)" }} />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FCD34D]/15 ring-1 ring-[#FCD34D]/25">
          <Trophy className="w-4 h-4 text-[#FCD34D]" strokeWidth={2.2} />
        </div>
        <h3 className="font-bold text-[15px] text-[#F4F7F5] tracking-tight">Din ranking</h3>
      </div>

      <div className="text-center mb-4">
        <div className="text-[38px] font-black tabular-nums leading-none" style={{ color: currentLevel.accent }}>{elo}</div>
        <span
          className="mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em]"
          style={{ background: `${currentLevel.accent}20`, color: currentLevel.accent, border: `1px solid ${currentLevel.accent}35` }}
        >
          {currentLevel.name}
        </span>
      </div>

      {nextLevel && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9EAAA4] font-medium">Framsteg till {nextLevel.name}</span>
            <span className="font-bold text-[#F4F7F5] tabular-nums">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 bg-[#0F1513] rounded-full overflow-hidden border border-[#223029]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: currentLevel.accent }}
            />
          </div>
          <p className="text-[11px] text-[#9EAAA4] text-center">
            <span className="font-bold text-[#86EFAC]">{pointsToNext}</span> poäng kvar
          </p>
        </div>
      )}

      <div className="border-t border-[#223029] pt-3 space-y-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#9EAAA4]">Spelade matcher</span>
          <span className="font-bold text-[#F4F7F5] tabular-nums">{user?.matches_played || 0}</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#9EAAA4]">MVP-utmärkelser</span>
          <span className="font-bold text-[#F4F7F5] tabular-nums flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#2BA84A]" />
            {user?.mvp_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
