import React from 'react';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MapPin, UserPlus, Trophy, Flame, ArrowRight,
  Target, TrendingUp, Shield, Crown
} from "lucide-react";
import RankBadge from "@/components/rank/RankBadge";

const SKILL_CONFIG = {
  beginner:     { label: 'Nybörjare',  icon: Target,     accent: '#6EE7B7' },
  intermediate: { label: 'Medel',      icon: TrendingUp, accent: '#5EEAD4' },
  advanced:     { label: 'Avancerad',  icon: Shield,     accent: '#C4B5FD' },
  elite:        { label: 'Elit',       icon: Crown,      accent: '#FDE68A' },
};

function FriendCard({ friend, index }) {
  const skill = SKILL_CONFIG[friend.skill_level] || SKILL_CONFIG.intermediate;
  const SkillIcon = skill.icon;
  const name = friend.display_name || friend.full_name || 'Spelare';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden flex flex-col rounded-[18px] border border-[#223029] bg-gradient-to-b from-[#161C19] to-[#121715] transition-[box-shadow,border-color] duration-200 hover:border-[#2BA84A]/35"
      style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      {/* Skill accent bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${skill.accent}A0 20%, ${skill.accent}A0 80%, transparent)` }}
      />

      <div className="p-4 flex-1 flex flex-col">
        {/* Head row */}
        <Link to={`${createPageUrl('Profile')}?userId=${friend.id}`} className="block">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/8"
              style={{ boxShadow: `0 4px 12px ${skill.accent}22` }}
            >
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-black text-base"
                  style={{ background: `linear-gradient(135deg, ${skill.accent}55, ${skill.accent}22)` }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[#F4F7F5] text-[14px] truncate tracking-[-0.01em]">{name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#9EAAA4]">
                {friend.city && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#6B7A73] flex-shrink-0" />
                    {friend.city}
                  </span>
                )}
              </div>
              <span
                className="inline-flex items-center gap-1 h-5 mt-1 px-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${skill.accent}1C`, color: skill.accent, boxShadow: `inset 0 0 0 1px ${skill.accent}33` }}
              >
                <SkillIcon className="w-2.5 h-2.5" strokeWidth={2.8} />
                {skill.label}
              </span>
            </div>
          </div>
        </Link>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <StatPill icon={Trophy} value={friend.matches_played || 0} label="Matcher" accent="#86EFAC" />
          <div className="relative rounded-lg bg-[#0F1513] ring-1 ring-[#1E2724] overflow-hidden flex items-center justify-center py-2">
            <RankBadge matchesPlayed={friend.matches_played || 0} currentStreak={friend.current_streak || 0} size="sm" showLabel={false} />
          </div>
          <StatPill icon={Flame}  value={friend.mvp_count || 0}      label="MVPs"    accent="#FDBA74" />
        </div>

        {/* Profile link */}
        <div className="mt-auto pt-3">
          <Link to={`${createPageUrl('Profile')}?userId=${friend.id}`}>
            <div className="h-10 rounded-xl bg-[#2BA84A]/10 ring-1 ring-[#2BA84A]/30 flex items-center justify-center gap-1.5 hover:bg-[#2BA84A]/18 transition-colors">
              <span className="text-[13px] font-bold text-[#86EFAC]">Visa profil</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#86EFAC] opacity-80" strokeWidth={2.5} />
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({ icon: Icon, value, label, accent }) {
  return (
    <div className="relative rounded-lg px-2 py-2 bg-[#0F1513] ring-1 ring-[#1E2724] overflow-hidden flex items-center justify-center">
      <div aria-hidden className="absolute inset-0 opacity-[0.10] pointer-events-none" style={{ background: `linear-gradient(140deg, ${accent} 0%, transparent 55%)` }} />
      <div className="relative flex items-center justify-center gap-1.5">
        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: accent }} strokeWidth={2.6} />
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-[13px] font-black text-white tabular-nums leading-none">{value}</span>
          <span className="text-[9.5px] text-[#7B8A83] font-semibold uppercase tracking-wider leading-none truncate">{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function FriendsList({ friends }) {
  const uniqueFriends = friends.filter((f, i, arr) => i === arr.findIndex(t => t.id === f.id));

  if (uniqueFriends.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-white/[0.06] p-8 sm:p-12"
        style={{
          background: 'linear-gradient(135deg, #151B18 0%, #111613 55%, #0C100E 100%)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute -top-20 -right-16 w-56 h-56 bg-[#2BA84A]/14 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

        <div className="relative z-10 text-center max-w-sm mx-auto">
          <div className="relative inline-flex mb-5">
            <div className="absolute -inset-3 bg-[#2BA84A]/20 rounded-full blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center ring-1 ring-[#2BA84A]/30" style={{ background: 'rgba(43,168,74,0.12)' }}>
              <UserPlus className="w-7 h-7 text-[#86EFAC]" strokeWidth={2.2} />
            </div>
          </div>
          <h3 className="text-[20px] leading-[26px] font-black text-white tracking-tight mb-2">Bygg ditt nätverk</h3>
          <p className="text-[13px] leading-[19px] text-[#B6C2BC] mb-6">Spela matcher för att möta nya spelare och bygga din vänlista.</p>
          <div className="flex flex-col gap-2 text-left">
            {[
              { num: '1', text: 'Gå med i en match nära dig' },
              { num: '2', text: 'Lägg till spelare som vänner' },
              { num: '3', text: 'Bjud in dem till nästa spel' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                <div className="w-6 h-6 rounded-full bg-[#2BA84A]/20 ring-1 ring-[#2BA84A]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-black text-[#86EFAC]">{step.num}</span>
                </div>
                <span className="text-[12px] text-[#C2CEC8] font-medium">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {uniqueFriends.map((friend, index) => (
        <FriendCard key={friend.id} friend={friend} index={index} />
      ))}
    </div>
  );
}
