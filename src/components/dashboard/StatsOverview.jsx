import React from 'react';
import { Trophy, Target, Star, TrendingUp, Award } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";

export default function StatsOverview({ user, recentMatches = [] }) {
  const { t } = useT();
  const winRate = user?.matches_played > 0
    ? Math.round((recentMatches.filter(m => m?.status === 'completed').length / user.matches_played) * 100)
    : 0;

  const getSkillLevelText = (elo) => {
    if (elo < 1000) return t('stats.skill.novice');
    if (elo < 1200) return t('stats.skill.beginner');
    if (elo < 1400) return t('stats.skill.experienced');
    if (elo < 1600) return t('stats.skill.advanced');
    return t('stats.skill.expert');
  };

  const getSkillProgress = (elo) => {
    const ranges = [
      { min: 0, max: 1000 }, { min: 1000, max: 1200 },
      { min: 1200, max: 1400 }, { min: 1400, max: 1600 }, { min: 1600, max: 2000 }
    ];
    const r = ranges.find(x => elo >= x.min && elo < x.max) || ranges[ranges.length - 1];
    return Math.max(0, Math.min(100, ((elo - r.min) / (r.max - r.min)) * 100));
  };

  const elo = user?.elo_rating || 1200;
  const progress = getSkillProgress(elo);

  const stats = [
    {
      label: t('stats.your_ranking'),
      value: elo,
      sub: getSkillLevelText(elo),
      icon: Trophy,
      accent: "#FCD34D",
      extra: (
        <div className="h-1.5 bg-[#0F1513] rounded-full overflow-hidden mt-2 border border-[#223029]">
          <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      ),
    },
    {
      label: t('stats.matches_played'),
      value: user?.matches_played || 0,
      sub: t('stats.success_rate', { pct: winRate }),
      icon: Target,
      accent: "#86EFAC",
    },
    {
      label: t('stats.mvp_awards'),
      value: user?.mvp_count || 0,
      sub: user?.matches_played > 0
        ? t('stats.pct_of_matches', { pct: Math.round((user?.mvp_count || 0) / user.matches_played * 100) })
        : t('stats.no_matches'),
      icon: Star,
      accent: "#C4B5FD",
    },
    {
      label: t('stats.current_streak'),
      value: user?.current_streak || 0,
      sub: t('stats.longest_days', { n: user?.longest_streak || 0 }),
      icon: Award,
      accent: "#FDBA74",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map(({ label, value, sub, icon: Icon, accent, extra }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-[18px] border border-[#223029] p-4"
          style={{
            background: "linear-gradient(135deg, #151B18 0%, #111613 55%, #0C100E 100%)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)" }} />
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-25 pointer-events-none" style={{ background: accent }} />
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}>
              <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={2.2} />
            </div>
          </div>
          <div className="text-[28px] leading-none font-black tabular-nums" style={{ color: accent }}>{value}</div>
          <div className="mt-1 text-[11px] font-semibold text-[#9EAAA4]">{label}</div>
          {sub && <div className="mt-0.5 text-[10px] text-[#6B7A73]">{sub}</div>}
          {extra}
        </div>
      ))}
    </div>
  );
}
