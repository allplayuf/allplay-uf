import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Plus, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import RankBadge from "../teams/RankBadge";

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
                  <h3 className="font-bold text-[18px] leading-[24px] text-[#F4F7F5] mb-0.5 truncate">{team.name || 'Namnlöst lag'}</h3>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#B6C2BC]">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{team.city || 'Okänd stad'}</span>
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
                <div className="text-[12px] uppercase tracking-wider font-medium text-[#7B8A83]">Medlemmar</div>
              </div>
              <div className="text-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <div className={`text-xl font-bold ${teamStyle.text}`}>{team.matches_played || 0}</div>
                <div className="text-[12px] uppercase tracking-wider font-medium text-[#7B8A83]">Matcher</div>
              </div>
            </div>

            {team.description && (
              <p className="text-xs text-[#9EAAA4] mb-4 line-clamp-2">{team.description}</p>
            )}

            <div className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/5 px-6 text-[#F4F7F5] ring-1 ring-[#FFFFFF]/10 transition-all group-hover:bg-[#FFFFFF]/10 group-hover:ring-[#FFFFFF]/20 font-semibold">
              <Shield className={`w-5 h-5 ${teamStyle.text}`} />
              Visa lag
              <ChevronRight className="w-5 h-5 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function TeamsList({ teams = [], myTeams = [], teamInvites = [], user, onCreateTeam, onAcceptInvite }) {
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
          Mina lag ({myTeams.length})
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            view === 'all'
              ? 'bg-[#9370DB]/16 text-[#DDD6FE] ring-1 ring-[#9370DB]/30'
              : 'bg-[#18221E] text-[#9EAAA4] hover:bg-[#223029]'
          }`}
        >
          Alla lag ({teams.length})
        </button>
      </div>

      {/* Empty state */}
      {displayTeams.length === 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[16px] lg:rounded-[20px] p-8 sm:p-12 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
          <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full"></div>
          <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-[#FFFFFF]/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#FFFFFF]/25">
              <Shield className="w-8 h-8 text-[#EAF6EE]" />
            </div>
            <h3 className="text-[20px] font-semibold text-[#EAF6EE] mb-3">
              {view === 'mine' ? 'Du har inga lag ännu' : 'Inga lag hittades'}
            </h3>
            <p className="text-[14px] text-[#CFE8D6] mb-8 max-w-md mx-auto">
              {view === 'mine' 
                ? 'Skapa ett nytt lag för att tävla tillsammans och bygga något större!'
                : 'Inga lag att visa just nu.'
              }
            </p>
            {view === 'mine' && (
              <button 
                onClick={onCreateTeam}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/16 px-6 text-[#EAF6EE] ring-1 ring-[#FFFFFF]/30 transition-all hover:bg-[#FFFFFF]/24 hover:ring-[#FFFFFF]/45 hover:scale-[1.02] font-semibold"
              >
                <Plus className="w-5 h-5" />
                Skapa ditt första lag
              </button>
            )}
          </div>
        </Card>
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