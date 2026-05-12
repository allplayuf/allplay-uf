import React from 'react';
import { Award, Star, Target, Users } from "lucide-react";

const RARITY = {
  common:    { label: "Vanlig",    color: "#9EAAA4" },
  rare:      { label: "Sällsynt",  color: "#86EFAC" },
  epic:      { label: "Episk",     color: "#C4B5FD" },
  legendary: { label: "Legendarisk", color: "#FCD34D" },
};

export default function RecentAchievements({ user }) {
  const achievements = [
    { id: 1, name: "Första matchen",  description: "Spelade din första match!",   icon: Target, earned: user?.matches_played >= 1,  rarity: "common" },
    { id: 2, name: "MVP-stjärna",     description: "Blev MVP i en match",          icon: Star,   earned: user?.mvp_count >= 1,         rarity: "rare" },
    { id: 3, name: "Veteran",         description: "Spelat 10 matcher",            icon: Award,  earned: user?.matches_played >= 10,   rarity: "epic" },
    { id: 4, name: "Lagspelare",      description: "Spelat med 5 olika spelare",   icon: Users,  earned: false,                        rarity: "rare" },
  ];

  const earned = achievements.filter(a => a.earned);
  const next = achievements.find(a => !a.earned);

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
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#C4B5FD]/15 ring-1 ring-[#C4B5FD]/25">
          <Award className="w-4 h-4 text-[#C4B5FD]" strokeWidth={2.2} />
        </div>
        <h3 className="font-bold text-[15px] text-[#F4F7F5] tracking-tight">Utmärkelser</h3>
      </div>

      {earned.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-[#18221E] rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-[#223029]">
            <Award className="w-6 h-6 text-[#4a5550]" strokeWidth={2} />
          </div>
          <p className="text-[13px] font-semibold text-[#9EAAA4]">Inga utmärkelser än</p>
          <p className="text-[11px] text-[#6B7A73] mt-1">Spela dina första matcher!</p>
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#6B7A73] mb-3">Senaste</p>
          {earned.slice(0, 3).map((a) => {
            const r = RARITY[a.rarity] || RARITY.common;
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#223029] bg-[#18221E]/60">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${r.color}20`, border: `1px solid ${r.color}30` }}
                >
                  <a.icon className="w-4 h-4" style={{ color: r.color }} strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#F4F7F5] truncate">{a.name}</span>
                    <span
                      className="text-[9px] font-extrabold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${r.color}20`, color: r.color }}
                    >
                      {r.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA097] mt-0.5">{a.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {next && (
        <div className="border-t border-[#223029] pt-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#6B7A73] mb-2">Nästa</p>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#223029] opacity-60">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#18221E] ring-1 ring-[#223029]">
              <next.icon className="w-4 h-4 text-[#4a5550]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#9EAAA4]">{next.name}</p>
              <p className="text-[11px] text-[#6B7A73]">{next.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
