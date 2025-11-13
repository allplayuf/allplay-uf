import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Medal, ShieldCheck, Sparkles, Zap, Flame, Rocket } from "lucide-react";

// RANK CONFIGURATION - UNIQUE ICONS FOR TEAM RANKS
export const RANK_CONFIG = {
  brons: {
    name: 'Brons',
    min: 0,
    max: 999,
    color: 'from-[#CD7F32] to-[#8B4513]',
    textColor: 'text-[#FFFFFF]',
    bgColor: 'bg-[#CD7F32]',
    icon: Medal
  },
  silver: {
    name: 'Silver',
    min: 1000,
    max: 1199,
    color: 'from-[#C0C0C0] to-[#808080]',
    textColor: 'text-[#FFFFFF]',
    bgColor: 'bg-[#C0C0C0]',
    icon: ShieldCheck
  },
  guld: {
    name: 'Guld',
    min: 1200,
    max: 1399,
    color: 'from-[#FFD700] to-[#FFA500]',
    textColor: 'text-[#000000]',
    bgColor: 'bg-[#FFD700]',
    icon: Sparkles
  },
  platinum: {
    name: 'Platinum',
    min: 1400,
    max: 1599,
    color: 'from-[#00CED1] to-[#20B2AA]',
    textColor: 'text-[#000000]',
    bgColor: 'bg-[#00CED1]',
    icon: Zap
  },
  diamant: {
    name: 'Diamant',
    min: 1600,
    max: 1799,
    color: 'from-[#4169E1] to-[#0000CD]',
    textColor: 'text-[#FFFFFF]',
    bgColor: 'bg-[#4169E1]',
    icon: Flame
  },
  proffs: {
    name: 'Proffs',
    min: 1800,
    max: 9999,
    color: 'from-[#9370DB] to-[#8B008B]',
    textColor: 'text-[#FFFFFF]',
    bgColor: 'bg-[#9370DB]',
    icon: Rocket
  }
};

export function getRankFromElo(elo) {
  const rating = elo || 1200;
  
  if (rating < 1000) return 'brons';
  if (rating < 1200) return 'silver';
  if (rating < 1400) return 'guld';
  if (rating < 1600) return 'platinum';
  if (rating < 1800) return 'diamant';
  return 'proffs';
}

export function getRankProgress(elo) {
  const rating = elo || 1200;
  const rankKey = getRankFromElo(rating);
  const rank = RANK_CONFIG[rankKey];
  
  if (rankKey === 'proffs') {
    return 100; // Max rank
  }
  
  const progress = ((rating - rank.min) / (rank.max - rank.min)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function getRankTrend(rankHistory) {
  if (!rankHistory || rankHistory.length < 2) return 'neutral';
  
  const latest = rankHistory[rankHistory.length - 1]?.elo || 1200;
  const previous = rankHistory[rankHistory.length - 2]?.elo || 1200;
  
  if (latest > previous) return 'up';
  if (latest < previous) return 'down';
  return 'neutral';
}

export default function RankBadge({ elo, showProgress = false, showTrend = false, rankHistory = [], size = 'md' }) {
  const rankKey = getRankFromElo(elo);
  const rank = RANK_CONFIG[rankKey];
  const RankIcon = rank.icon;
  const progress = getRankProgress(elo);
  const trend = getRankTrend(rankHistory);
  
  const sizeClasses = {
    sm: 'h-6 px-2 text-[11px]',
    md: 'h-7 px-3 text-[12px]',
    lg: 'h-8 px-4 text-[13px]'
  };

  return (
    <div className="space-y-3">
      <Badge 
        className={`${sizeClasses[size]} inline-flex items-center gap-1.5 bg-gradient-to-r ${rank.color} ${rank.textColor} font-semibold border-0 shadow-md`}
      >
        <RankIcon className="w-3.5 h-3.5" />
        {rank.name}
        {showTrend && trend !== 'neutral' && (
          <span className="ml-1">
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </Badge>
      
      {showProgress && (
        <div className="w-full">
          <div className="h-1.5 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
            <div 
              className={`h-full ${rank.bgColor} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-[#B6C2BC] mt-1">
            {elo || 1200} ELO • {Math.round(progress)}% till nästa nivå
          </p>
        </div>
      )}
    </div>
  );
}