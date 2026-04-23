import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, UserPlus, Check, Clock, Target, TrendingUp, Shield, Crown, EyeOff, Trophy, Flame, ArrowRight
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { getAvatarUrl } from "@/components/utils/privacyMask";

/**
 * PlayerCard v2 — premium card for the Community "Hitta spelare" grid.
 *
 * Structure (mobile-first):
 *   [skill accent bar]
 *   [avatar | name + @handle + city chip]
 *   [stats strip: Matcher · MVPs · Streak]
 *   [action row: Add/Accept/Sent/Friends]
 */

const SKILL_CONFIG = {
  beginner:     { label: 'Nybörjare',   icon: Target,     accent: '#6EE7B7' },
  intermediate: { label: 'Medel',       icon: TrendingUp, accent: '#5EEAD4' },
  advanced:     { label: 'Avancerad',   icon: Shield,     accent: '#C4B5FD' },
  elite:        { label: 'Elit',        icon: Crown,      accent: '#FDE68A' }
};

export default function PlayerCard({ player, friendshipStatus = 'none', onAddFriend, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const isPrivate = player._isPrivate;
  const avatarUrl = getAvatarUrl(player);
  const skillCfg = SKILL_CONFIG[player.skill_level || 'intermediate'];
  const SkillIcon = skillCfg.icon;

  const displayName = player.display_name || player.full_name || 'Ny spelare';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const profileHref = isPrivate ? '#' : `${createPageUrl('Profile')}?userId=${player.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-[18px] border border-[#223029] bg-gradient-to-b from-[#161C19] to-[#121715] transition-[box-shadow,border-color,transform] duration-200 hover:border-[#2BA84A]/30"
      style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      {/* Skill accent bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${skillCfg.accent}A0 20%, ${skillCfg.accent}A0 80%, transparent)`,
        }}
      />

      <div className="p-4">
        {/* Head row */}
        <Link to={profileHref} className="block">
          <div className="flex items-center gap-3">
            {/* Avatar with ring */}
            <div
              className="relative w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/8"
              style={{ boxShadow: `0 4px 12px ${skillCfg.accent}22, inset 0 0 0 1px rgba(255,255,255,0.04)` }}
            >
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-black text-base"
                  style={{ background: `linear-gradient(135deg, ${skillCfg.accent}55, ${skillCfg.accent}22)` }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="font-bold text-[#F4F7F5] text-[14px] sm:text-[15px] truncate tracking-[-0.01em]">
                  {displayName}
                </h4>
                {isPrivate && <EyeOff className="w-3 h-3 text-[#7B8A83] flex-shrink-0" aria-label="Privat profil" />}
              </div>

              <div className="flex items-center gap-1.5 mt-0.5 text-[11.5px] text-[#9EAAA4]">
                {!isPrivate && player.username && (
                  <span className="truncate max-w-[14ch]">@{player.username}</span>
                )}
                {!isPrivate && player.username && player.city && (
                  <span className="text-[#3E4A45]">•</span>
                )}
                {!isPrivate && player.city && (
                  <span className="inline-flex items-center gap-1 truncate max-w-[16ch]">
                    <MapPin className="w-3 h-3 text-[#6B7A73] flex-shrink-0" />
                    {player.city}
                  </span>
                )}
              </div>

              {/* Skill chip */}
              {!isPrivate && (
                <span
                  className="inline-flex items-center gap-1 h-5 mt-1.5 px-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: `${skillCfg.accent}1C`,
                    color: skillCfg.accent,
                    boxShadow: `inset 0 0 0 1px ${skillCfg.accent}33`,
                  }}
                >
                  <SkillIcon className="w-2.5 h-2.5" strokeWidth={2.8} />
                  {skillCfg.label}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Stats strip */}
        {!isPrivate && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Stat icon={Trophy} value={player.matches_played || 0} label="Matcher" accent="#86EFAC" />
            <Stat icon={Flame}   value={player.mvp_count || 0}       label="MVPs"    accent="#FDBA74" />
            <Stat icon={Shield}  value={player.current_streak || 0}  label="Streak"  accent="#FDE68A" />
          </div>
        )}

        {/* Action row */}
        <div className="mt-3">
          {isPrivate ? (
            <div className="h-10 rounded-xl bg-[#0F1513] ring-1 ring-[#1E2724] flex items-center justify-center">
              <span className="text-[12px] font-semibold text-[#6B7A73] inline-flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" />
                Privat profil
              </span>
            </div>
          ) : friendshipStatus === 'none' ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onAddFriend?.(player.id)}
              className="relative overflow-hidden w-full h-10 rounded-xl text-white text-[13px] font-bold transition-transform"
              style={{
                background: 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)',
                boxShadow: '0 6px 16px rgba(43,168,74,0.35), inset 0 1px 0 rgba(255,255,255,0.22)',
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" strokeWidth={2.6} />
                Lägg till vän
              </span>
            </motion.button>
          ) : friendshipStatus === 'accepted' ? (
            <div className="h-10 rounded-xl bg-[#2BA84A]/10 ring-1 ring-[#2BA84A]/30 flex items-center justify-center">
              <span className="text-[13px] font-bold text-[#86EFAC] inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" strokeWidth={2.8} />
                Vänner
              </span>
            </div>
          ) : friendshipStatus === 'pending_outgoing' ? (
            <div className="h-10 rounded-xl bg-[#18221E] ring-1 ring-[#223029] flex items-center justify-center">
              <span className="text-[13px] font-semibold text-[#9EAAA4] inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" strokeWidth={2.5} />
                Förfrågan skickad
              </span>
            </div>
          ) : friendshipStatus === 'pending_incoming' ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onAddFriend?.(player.id)}
              className="relative overflow-hidden w-full h-10 rounded-xl text-white text-[13px] font-bold"
              style={{
                background: 'linear-gradient(180deg, #FF8A4D 0%, #F4743B 55%, #D95D26 100%)',
                boxShadow: '0 6px 16px rgba(244,116,59,0.35), inset 0 1px 0 rgba(255,255,255,0.22)',
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" strokeWidth={2.8} />
                Acceptera
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </span>
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon: Icon, value, label, accent }) {
  return (
    <div className="relative rounded-lg px-2 py-2 bg-[#0F1513] ring-1 ring-[#1E2724] overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{ background: `linear-gradient(140deg, ${accent} 0%, transparent 55%)` }}
      />
      <div className="relative flex items-center gap-1.5">
        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: accent }} strokeWidth={2.6} />
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-[13px] font-black text-white tabular-nums leading-none">{value}</span>
          <span className="text-[9.5px] text-[#7B8A83] font-semibold uppercase tracking-wider leading-none truncate">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}