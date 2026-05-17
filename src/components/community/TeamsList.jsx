import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Plus, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import RankBadge from "../teams/RankBadge";
import { useT } from "@/i18n/LanguageProvider";

const getTeamColorStyle = (color) => {
  const colorMap = {
    '#2BA84A': { gradient: 'from-[#2BA84A] to-[#0F2917]', text: 'text-[#2BA84A]', border: 'group-hover:border-[#2BA84A]' },
    '#F4743B': { gradient: 'from-[#F4743B] to-[#BF360C]', text: 'text-[#F4743B]', border: 'group-hover:border-[#F4743B]' },
    '#4169E1': { gradient: 'from-[#4169E1] to-[#0D1B4D]', text: 'text-[#4169E1]', border: 'group-hover:border-[#4169E1]' },
    '#9370DB': { gradient: 'from-[#9370DB] to-[#2E1A47]', text: 'text-[#9370DB]', border: 'group-hover:border-[#9370DB]' },
    '#FFD700': { gradient: 'from-[#FFD700] to-[#4D3A00]', text: 'text-[#FFD700]', border: 'group-hover:border-[#FFD700]' },
    '#DC2626': { gradient: 'from-[#DC2626] to-[#450A0A]', text: 'text-[#DC2626]', border: 'group-hover:border-[#DC2626]' },
    '#14B8A6': { gradient: 'from-[#14B8A6] to-[#042F2E]', text: 'text-[#14B8A6]', border: 'group-hover:border-[#14B8A6]' },
    '#EC4899': { gradient: 'from-[#EC4899] to-[#4A0E29]', text: 'text-[#EC4899]', border: 'group-hover:border-[#EC4899]' },
    '#F59E0B': { gradient: 'from-[#F59E0B] to-[#D97706]', text: 'text-[#F59E0B]', border: 'group-hover:border-[#F59E0B]' }
  };
  return colorMap[color] || colorMap['#2BA84A'];
};

function TeamCard({ team, index }) {
  const { t } = useT();
  const teamStyle = getTeamColorStyle(team.teamColor || team.team_color);
  
  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link to={`${createPageUrl("TeamOverview")}?id=${team.id}`} className="block">
        <Card className={`bg-[#121715] border border-[#223029] ${teamStyle.border} transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:scale-[1.02] rounded-[16px] group cursor-pointer`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${teamStyle.gradient} rounded-2xl flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0`}>
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-7 h-7 text-[#FFFFFF]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[18px] leading-[24px] text-[#F4F7F5] mb-0.5 truncate">{team.name || t('teams.unnamed')}</h3>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#B6C2BC]">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{team.city || t('common.unknown')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rank Badge */}
            <div className="mb-4">
              <RankBadge 
                elo={team.elo_rating} 
                showProgress={true} 
                showTrend={true} 
                rankHistory={team.rank_history}
                size="lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <div className={`text-xl font-bold ${teamStyle.text}`}>{team.current_members || 1}</div>
                <div className="text-[12px] uppercase tracking-wider font-medium text-[#7B8A83]">{t('teams.members')}</div>
              </div>
              <div className="text-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <div className={`text-xl font-bold ${teamStyle.text}`}>{team.matches_played || 0}</div>
                <div className="text-[12px] uppercase tracking-wider font-medium text-[#7B8A83]">{t('profile.hero.matches_label')}</div>
              </div>
            </div>

            {team.description && (
              <p className="text-xs text-[#9EAAA4] mb-4 line-clamp-2">{team.description}</p>
            )}

            <div className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/5 px-6 text-[#F4F7F5] ring-1 ring-[#FFFFFF]/10 transition-all group-hover:bg-[#FFFFFF]/10 group-hover:ring-[#FFFFFF]/20 font-semibold">
              <Shield className={`w-5 h-5 ${teamStyle.text}`} />
              {t('teams.view')}
              <ChevronRight className="w-5 h-5 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function TeamsList({ teams = [], myTeams = [], teamInvites = [], user, onCreateTeam, onAcceptInvite }) {
  const { t } = useT();
  const [view, setView] = useState('mine'); // 'mine' | 'all'

  const displayTeams = view === 'mine' ? myTeams : teams;

  return (
    <div className="space-y-4">
      {/* Toggle: Mina lag / Alla lag */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('mine')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            view === 'mine'
              ? 'bg-[#9370DB]/16 text-[#DDD6FE] ring-1 ring-[#9370DB]/30'
              : 'bg-[#18221E] text-[#9EAAA4] hover:bg-[#223029]'
          }`}
        >
          {t('teams.my_teams')} ({myTeams.length})
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            view === 'all'
              ? 'bg-[#9370DB]/16 text-[#DDD6FE] ring-1 ring-[#9370DB]/30'
              : 'bg-[#18221E] text-[#9EAAA4] hover:bg-[#223029]'
          }`}
        >
          {t('teams.all_teams')} ({teams.length})
        </button>
      </div>

      {/* Empty state */}
      {displayTeams.length === 0 && (
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
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-16 w-56 h-56 bg-[#9370DB]/14 rounded-full blur-3xl pointer-events-none" />
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
          />

          <div className="relative z-10 text-center max-w-sm mx-auto">
            <div className="relative inline-flex mb-5">
              <div className="absolute -inset-3 bg-[#9370DB]/20 rounded-full blur-xl" />
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center ring-1 ring-[#9370DB]/30"
                style={{ background: 'rgba(147,112,219,0.12)' }}
              >
                <Shield className="w-7 h-7 text-[#DDD6FE]" strokeWidth={2.2} />
              </div>
            </div>

            <h3 className="text-[20px] leading-[26px] font-black text-white tracking-tight mb-2">
              {view === 'mine' ? t('teams.empty_mine_title') : t('teams.empty_all_title')}
            </h3>
            <p className="text-[13px] leading-[19px] text-[#B6C2BC] mb-6">
              {view === 'mine' ? t('teams.empty_mine_desc') : t('teams.empty_all_desc')}
            </p>

            {view === 'mine' && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onCreateTeam}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-white font-bold text-[14px]"
                style={{
                  background: 'linear-gradient(180deg, #A78BFA 0%, #9370DB 55%, #7C3AED 100%)',
                  boxShadow: '0 6px 18px rgba(147,112,219,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.4} />
                {t('teams.create_first')}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Team grid */}
      {displayTeams.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          {displayTeams.map((team, index) => (
            <TeamCard key={team.id} team={team} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}