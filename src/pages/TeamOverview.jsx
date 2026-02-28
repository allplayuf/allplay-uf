import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Trophy, MapPin, Crown, TrendingUp, Target,
  Swords, Loader2
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { getTeamById, getTeamMembersWithProfiles } from "../components/supabase/services";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";

import TeamChallenges from "../components/teams/TeamChallenges";
import TeamColorPicker from "../components/teams/TeamColorPicker";
import RankBadge from "../components/teams/RankBadge";
import InviteFriendsToTeamModal from "../components/teams/InviteFriendsToTeamModal";
import CreateTeamMatchForm from "../components/teams/CreateTeamMatchForm";
import TeamStatsCard from "../components/teams/TeamStatsCard";

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target, bgColor: 'bg-[#059669]', textColor: 'text-[#FFFFFF]' },
  intermediate: { label: 'Medel', icon: TrendingUp, bgColor: 'bg-[#0D9488]', textColor: 'text-[#FFFFFF]' },
  advanced: { label: 'Avancerad', icon: Shield, bgColor: 'bg-[#7C3AED]', textColor: 'text-[#FFFFFF]' },
  elite: { label: 'Elit', icon: Crown, bgColor: 'bg-[#D97706]', textColor: 'text-[#FFFFFF]' }
};

const ALL_TABS = [
  { id: 'stats', label: 'Statistik', icon: Trophy, showForCupTeam: true },
  { id: 'members', label: 'Medlemmar', icon: Users, showForCupTeam: true },
  { id: 'challenges', label: 'Utmaningar', icon: Swords, showForCupTeam: false }
];

const getTeamColorStyle = (teamColor) => {
  const colorMap = {
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
  return colorMap[teamColor] || colorMap['#2BA84A'];
};

export default function TeamOverviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const teamId = new URLSearchParams(location.search).get('id');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('stats');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTeamMatch, setShowCreateTeamMatch] = useState(false);

  const { user: authUser, isAuthenticated } = useSupabaseAuth();

  // --- QUERIES ---

  // 1. Fetch team by ID from Supabase
  const { data: team, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: () => getTeamById(teamId),
    enabled: !!teamId,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  // 2. Fetch team members with user profiles (JOIN team_members → users)
  const { data: membersWithProfiles = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => getTeamMembersWithProfiles(teamId),
    enabled: !!teamId && !!team,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  // Derived state
  const isLoading = teamLoading;
  const user = authUser;
  const isCupTeam = team?.is_cup_team === true;
  const isCaptain = team?.captain_id === user?.id;
  const viceCapta = team?.vice_captain_ids?.includes(user?.id);
  const isCaptainOrVice = isCaptain || viceCapta;
  const isUserMember = membersWithProfiles.some(m => m.user_id === user?.id && m.status === 'active');

  const TABS = isCupTeam 
    ? ALL_TABS.filter(tab => tab.showForCupTeam)
    : ALL_TABS;

  // --- LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#2BA84A] animate-spin mx-auto" />
          <p className="text-[#F4F7F5] text-sm font-medium">Laddar lag...</p>
        </div>
      </div>
    );
  }

  if (!team || teamError) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto p-12 text-center bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <h2 className="text-[20px] font-semibold text-[#F4F7F5] mb-4">Lag hittades inte</h2>
          <p className="text-[#B6C2BC] mb-6 text-sm">
            {teamError ? `Fel: ${teamError.message}` : 'Laget finns inte eller har tagits bort.'}
          </p>
          <Button onClick={() => navigate(`${createPageUrl("Community")}?tab=teams`)} className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF]">
            Tillbaka till Community
          </Button>
        </Card>
      </div>
    );
  }

  const teamColors = getTeamColorStyle(team.teamColor || team.team_color);

  // Build member list for rendering (enriched with user profiles)
  const members = membersWithProfiles
    .filter(m => m.status === 'active')
    .map(m => ({
      id: m.user_id,
      teamRole: m.role,
      display_name: m.user?.full_name || m.user?.username || 'Okänd spelare',
      full_name: m.user?.full_name || 'Okänd spelare',
      profile_image_url: m.user?.avatar_url || null,
      city: m.user?.city || '',
      skill_level: m.user?.skill_level || null,
      matches_played: m.user?.matches_played || 0,
      mvp_count: m.user?.mvp_count || 0,
    }));

  return (
    <div className="bg-[#0F1513] pb-4 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        
        {/* Hero Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${teamColors.gradient} rounded-2xl p-4 sm:p-6 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]`}>
            <div className={`absolute top-[-30px] right-[-30px] w-28 h-28 ${teamColors.lightCircle} rounded-full opacity-50`}></div>
            <div className={`absolute bottom-[-40px] left-[-40px] w-32 h-32 ${teamColors.darkCircle} rounded-full opacity-50`}></div>
            
            <div className="relative z-10">
              {/* Top row: logo + name + badges */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFFFFF]/15 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-[#FFFFFF]/30 flex-shrink-0">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFFFFF]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] truncate">{team.name}</h1>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {isCaptain && (
                      <Badge className="h-6 px-2 bg-[#F4743B] text-[#FFFFFF] font-semibold flex items-center gap-1 text-[11px] border-0">
                        <Crown className="w-3 h-3" />
                        Kapten
                      </Badge>
                    )}
                    {isCupTeam && (
                      <Badge className="h-6 px-2 bg-[#F59E0B] text-[#FFFFFF] font-semibold flex items-center gap-1 text-[11px] border-0">
                        <Trophy className="w-3 h-3" />
                        Cup
                      </Badge>
                    )}
                    <span className="text-[12px] text-[#FFFFFF]/70 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {team.city || 'Okänd'}
                    </span>
                    <span className="text-[12px] text-[#FFFFFF]/70 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {members.length}/{team.max_members || 20}
                    </span>
                  </div>
                </div>
              </div>

              {team.description && (
                <p className="text-[#FFFFFF]/80 text-sm mb-3 line-clamp-2">
                  {team.description}
                </p>
              )}

              {/* Stats grid */}
              <div className={`grid ${isCupTeam ? 'grid-cols-3' : 'grid-cols-4'} gap-2 mb-3`}>
                {!isCupTeam && (
                  <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-[#FFFFFF]/20 text-center">
                    <div className="text-base sm:text-xl font-black text-[#FFFFFF]">{team.elo_rating || 1000}</div>
                    <div className="text-[9px] sm:text-xs text-[#FFFFFF]/70 font-semibold">ELO</div>
                  </div>
                )}
                <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-[#FFFFFF]/20 text-center">
                  <div className="text-base sm:text-xl font-black text-[#FFFFFF]">{team.matches_played || 0}</div>
                  <div className="text-[9px] sm:text-xs text-[#FFFFFF]/70 font-semibold">Spelade</div>
                </div>
                <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-[#FFFFFF]/20 text-center">
                  <div className="text-base sm:text-xl font-black text-[#2BA84A]">{team.wins || 0}</div>
                  <div className="text-[9px] sm:text-xs text-[#FFFFFF]/70 font-semibold">Vinster</div>
                </div>
                <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-[#FFFFFF]/20 text-center">
                  <div className="text-base sm:text-xl font-black text-[#FFFFFF]">{((team.wins || 0) / Math.max(team.matches_played || 1, 1) * 100).toFixed(0)}%</div>
                  <div className="text-[9px] sm:text-xs text-[#FFFFFF]/70 font-semibold">Vinst %</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {!isUserMember && !isCupTeam && (
                  <Button className="h-10 flex-1 sm:flex-none bg-[#FFFFFF]/16 hover:bg-[#FFFFFF]/24 text-[#FFFFFF] rounded-xl font-semibold ring-1 ring-[#FFFFFF]/30 text-sm">
                    <Users className="w-4 h-4 mr-1.5" />
                    Gå med
                  </Button>
                )}
                {isCaptainOrVice && (
                  <>
                    <Button
                      onClick={() => setShowInviteModal(true)}
                      className="h-10 flex-1 sm:flex-none bg-[#FFFFFF]/16 hover:bg-[#FFFFFF]/24 text-[#FFFFFF] rounded-xl font-semibold ring-1 ring-[#FFFFFF]/30 text-sm"
                    >
                      <Users className="w-4 h-4 mr-1.5" />
                      Bjud in
                    </Button>
                    {!isCupTeam && (
                      <Button
                        onClick={() => setShowCreateTeamMatch(true)}
                        className="h-10 flex-1 sm:flex-none bg-[#FFFFFF]/16 hover:bg-[#FFFFFF]/24 text-[#FFFFFF] rounded-xl font-semibold ring-1 ring-[#FFFFFF]/30 text-sm"
                      >
                        <Shield className="w-4 h-4 mr-1.5" />
                        Lagmatch
                      </Button>
                    )}
                  </>
                )}
              </div>

              {!isCupTeam && (
                <div className="mt-3 bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl p-3 border border-[#FFFFFF]/20">
                  <RankBadge elo={team.elo_rating} showProgress showTrend rankHistory={team.rank_history} size="lg" />
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 h-10 px-4 text-sm font-semibold transition-all flex-shrink-0 rounded-xl ${
                  activeTab === tab.id
                    ? 'bg-[#2BA84A]/20 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                    : 'bg-[#18221E] text-[#B6C2BC] ring-1 ring-[#223029] hover:text-[#F4F7F5]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-6"
              >
                {membersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#2BA84A] animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-8 text-center">
                    <Users className="w-10 h-10 text-[#9EAAA4] mx-auto mb-3" />
                    <p className="text-[#B6C2BC]">Inga medlemmar hittades</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member, index) => {
                      const memberSkill = member.skill_level ? SKILL_LEVEL_CONFIG[member.skill_level] : null;
                      const MemberSkillIcon = memberSkill?.icon;
                      
                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                        >
                          <Card className="bg-[#121715] border border-[#223029] shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-2xl hover:shadow-[0_6px_18px_rgba(0,0,0,0.22)] transition-all">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {member.profile_image_url ? (
                                    <img src={member.profile_image_url} alt={member.display_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[#FFFFFF] font-semibold text-lg">{(member.display_name)?.[0] || '?'}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-[15px] text-[#F4F7F5] truncate">{member.display_name}</h4>
                                  <p className="text-[13px] text-[#B6C2BC] truncate">{member.city || 'Okänd stad'}</p>
                                </div>
                                {member.id === team.captain_id && <Crown className="w-5 h-5 text-[#F4743B] flex-shrink-0" />}
                              </div>

                              {memberSkill && (
                                <Badge className={`w-full justify-center mb-4 text-[12px] py-2 ${memberSkill.bgColor} ${memberSkill.textColor} font-semibold`}>
                                  {MemberSkillIcon && <MemberSkillIcon className="w-3.5 h-3.5 mr-1.5" />}
                                  {memberSkill.label}
                                </Badge>
                              )}

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#0F1513] rounded-xl p-3 border border-[#223029]">
                                  <div className="text-xs text-[#B6C2BC] mb-1">Matcher</div>
                                  <div className="text-lg font-bold text-[#F4F7F5]">{member.matches_played}</div>
                                </div>
                                <div className="bg-[#0F1513] rounded-xl p-3 border border-[#223029]">
                                  <div className="text-xs text-[#B6C2BC] mb-1">MVPs</div>
                                  <div className="text-lg font-bold text-[#F4743B]">{member.mvp_count}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TeamStatsCard team={team} />
                  {isCaptain && !isCupTeam && (
                    <TeamColorPicker team={team} onColorChange={(color) => {}} isCaptain={isCaptain} />
                  )}
                </div>
              </motion.div>
            )}

            {!isCupTeam && activeTab === 'challenges' && (
              <motion.div key="challenges" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                <TeamChallenges team={team} currentUser={user} isCaptainOrVice={isCaptainOrVice} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Team Match Modal */}
      <AnimatePresence>
        {!isCupTeam && showCreateTeamMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateTeamMatch(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              className="relative z-10 max-w-2xl w-full mx-4 my-8"
            >
              <CreateTeamMatchForm
                currentTeam={team}
                onSubmit={() => setShowCreateTeamMatch(false)}
                onCancel={() => setShowCreateTeamMatch(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteFriendsToTeamModal
            team={team}
            currentUser={user}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}