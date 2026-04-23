import React from "react";
import { motion } from "framer-motion";
import { Shield, Crown, Trophy, MapPin, Users, UserPlus, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RankBadge from "../RankBadge";

/**
 * Maps a team primary color to its gradient + ambient circles.
 */
const TEAM_COLOR_MAP = {
  '#2BA84A': { gradient: 'from-[#2BA84A] to-[#0F2917]', lightCircle: 'bg-[#2BA84A]/40', darkCircle: 'bg-[#0F2917]/60' },
  '#F4743B': { gradient: 'from-[#F4743B] to-[#BF360C]', lightCircle: 'bg-[#F4743B]/40', darkCircle: 'bg-[#BF360C]/60' },
  '#4169E1': { gradient: 'from-[#4169E1] to-[#0D1B4D]', lightCircle: 'bg-[#4169E1]/40', darkCircle: 'bg-[#0D1B4D]/60' },
  '#9370DB': { gradient: 'from-[#9370DB] to-[#2E1A47]', lightCircle: 'bg-[#9370DB]/40', darkCircle: 'bg-[#2E1A47]/60' },
  '#FFD700': { gradient: 'from-[#FFD700] to-[#4D3A00]', lightCircle: 'bg-[#FFD700]/40', darkCircle: 'bg-[#4D3A00]/60' },
  '#DC2626': { gradient: 'from-[#DC2626] to-[#450A0A]', lightCircle: 'bg-[#DC2626]/40', darkCircle: 'bg-[#450A0A]/60' },
  '#14B8A6': { gradient: 'from-[#14B8A6] to-[#042F2E]', lightCircle: 'bg-[#14B8A6]/40', darkCircle: 'bg-[#042F2E]/60' },
  '#EC4899': { gradient: 'from-[#EC4899] to-[#4A0E29]', lightCircle: 'bg-[#EC4899]/40', darkCircle: 'bg-[#4A0E29]/60' },
  '#F59E0B': { gradient: 'from-[#F59E0B] to-[#D97706]', lightCircle: 'bg-[#F59E0B]/40', darkCircle: 'bg-[#D97706]/60' }
};

function getTeamColorStyle(color) {
  return TEAM_COLOR_MAP[color] || TEAM_COLOR_MAP['#2BA84A'];
}

function StatPill({ value, label, valueColor = 'text-white' }) {
  return (
    <div className="flex-1 min-w-0 bg-white/12 backdrop-blur-md rounded-xl px-2.5 py-2 border border-white/20 text-center">
      <div className={`text-base sm:text-lg font-black tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-[9px] sm:text-[10px] text-white/70 font-semibold uppercase tracking-wider mt-0.5 truncate">
        {label}
      </div>
    </div>
  );
}

export default function TeamHero({
  team,
  memberCount,
  isCaptain,
  isCaptainOrVice,
  isCupTeam,
  isUserMember,
  canJoin,
  isJoining,
  onJoin,
  onInvite,
  onCreateMatch,
}) {
  const teamColors = getTeamColorStyle(team.teamColor || team.team_color);
  const played = team.matches_played || 0;
  const wins = team.wins || 0;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br ${teamColors.gradient} p-4 sm:p-6 shadow-[0_12px_28px_rgba(0,0,0,0.35)]`}
    >
      {/* Ambient circles */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${teamColors.lightCircle} rounded-full blur-xl pointer-events-none`} />
      <div className={`absolute -bottom-12 -left-12 w-36 h-36 ${teamColors.darkCircle} rounded-full blur-xl pointer-events-none`} />
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }}
      />

      <div className="relative z-10">
        {/* Identity row */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-white/30 flex-shrink-0">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.2} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] sm:text-2xl font-black text-white truncate tracking-tight">
              {team.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {isCaptain && (
                <Badge className="h-6 px-2 bg-[#F4743B] text-white font-semibold flex items-center gap-1 text-[11px] border-0">
                  <Crown className="w-3 h-3" />
                  Kapten
                </Badge>
              )}
              {isCupTeam && (
                <Badge className="h-6 px-2 bg-[#F59E0B] text-white font-semibold flex items-center gap-1 text-[11px] border-0">
                  <Trophy className="w-3 h-3" />
                  Cup
                </Badge>
              )}
              <span className="text-[12px] text-white/80 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {team.city || 'Okänd'}
              </span>
              <span className="text-[12px] text-white/80 flex items-center gap-1">
                <Users className="w-3 h-3" /> {memberCount}/{team.max_members || 20}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {team.description && (
          <p className="text-white/85 text-[13px] leading-[19px] mb-4 line-clamp-2">
            {team.description}
          </p>
        )}

        {/* Stats row — cleaner: 3 or 4 pills */}
        <div className={`flex gap-2 mb-4 ${isCupTeam ? 'grid grid-cols-3' : 'grid grid-cols-4'}`}>
          {!isCupTeam && (
            <StatPill value={team.elo_rating || 1000} label="ELO" valueColor="text-white" />
          )}
          <StatPill value={played} label="Spelade" />
          <StatPill value={wins} label="Vinster" valueColor="text-[#86EFAC]" />
          <StatPill value={`${winRate}%`} label="Vinst %" />
        </div>

        {/* Rank bar (ELO teams only) */}
        {!isCupTeam && (
          <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <RankBadge
              elo={team.elo_rating}
              showProgress
              showTrend
              rankHistory={team.rank_history}
              size="md"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canJoin && (
            <Button
              onClick={onJoin}
              disabled={isJoining}
              className="h-10 flex-1 sm:flex-none bg-white text-[#0F1513] hover:bg-white/90 rounded-xl font-bold text-sm disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              {isJoining ? 'Skickar...' : 'Ansök om att gå med'}
            </Button>
          )}
          {isUserMember && !isCaptainOrVice && (
            <div className="h-10 flex-1 sm:flex-none px-4 inline-flex items-center justify-center gap-1.5 bg-white/16 text-white rounded-xl font-semibold ring-1 ring-white/30 text-sm">
              <Shield className="w-4 h-4" /> Medlem
            </div>
          )}
          {isCaptainOrVice && (
            <>
              <Button
                onClick={onInvite}
                className="h-10 flex-1 sm:flex-none bg-white/16 hover:bg-white/24 text-white rounded-xl font-semibold ring-1 ring-white/30 text-sm"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Bjud in
              </Button>
              {!isCupTeam && (
                <Button
                  onClick={onCreateMatch}
                  className="h-10 flex-1 sm:flex-none bg-white/16 hover:bg-white/24 text-white rounded-xl font-semibold ring-1 ring-white/30 text-sm"
                >
                  <Swords className="w-4 h-4 mr-1.5" />
                  Lagmatch
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
}