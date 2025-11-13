
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Team, TeamMember } from "@/entities/Team";
import { User } from "@/entities/User";
import { Match } from "@/entities/Match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Trophy,
  MapPin,
  Crown,
  ArrowLeft,
  TrendingUp,
  Target,
  MessageCircle,
  BarChart,
  Image as ImageIcon,
  Swords
} from "lucide-react";
import { createPageUrl } from "@/utils";

import TeamChat from "../components/teams/TeamChat";
import TeamPolls from "../components/teams/TeamPolls";
import TeamHighlights from "../components/teams/TeamHighlights";
import TeamChallenges from "../components/teams/TeamChallenges";
import TeamColorPicker from "../components/teams/TeamColorPicker";
import RankBadge from "../components/teams/RankBadge";
import InviteFriendsToTeamModal from "../components/teams/InviteFriendsToTeamModal";
import CreateTeamMatchForm from "../components/teams/CreateTeamMatchForm"; // Added import

const SKILL_LEVEL_CONFIG = {
  beginner: { 
    label: 'Nybörjare', 
    icon: Target, 
    bgColor: 'bg-[#059669]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#10B981]/40'
  },
  intermediate: { 
    label: 'Medel', 
    icon: TrendingUp, 
    bgColor: 'bg-[#0D9488]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#14B8A6]/40'
  },
  advanced: { 
    label: 'Avancerad', 
    icon: Shield, 
    bgColor: 'bg-[#7C3AED]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#8B5CF6]/40'
  },
  elite: { 
    label: 'Elit', 
    icon: Crown, 
    bgColor: 'bg-[#D97706]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#F59E0B]/40'
  }
};

const TABS = [
  { id: 'members', label: 'Medlemmar', icon: Users },
  { id: 'stats', label: 'Statistik', icon: Trophy },
  { id: 'chat', label: 'Chatt', icon: MessageCircle },
  { id: 'polls', label: 'Omröstningar', icon: BarChart },
  { id: 'highlights', label: 'Highlights', icon: ImageIcon },
  { id: 'challenges', label: 'Utmaningar', icon: Swords }
];

export default function TeamOverviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const teamId = new URLSearchParams(location.search).get('id');

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamMatches, setTeamMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTeamMatch, setShowCreateTeamMatch] = useState(false); // Added state

  const loadTeamData = useCallback(async () => {
    if (!teamId) return;

    try {
      const [teamData, currentUser] = await Promise.all([
        Team.get(teamId),
        User.me()
      ]);

      setTeam(teamData);
      setUser(currentUser);

      const teamMembersData = await TeamMember.filter({ team_id: teamId, status: 'active' });

      const memberUsers = await Promise.all(
        teamMembersData.map(async (tm) => {
          const memberUser = await User.get(tm.user_id);
          return { ...memberUser, teamRole: tm.role };
        })
      );

      setMembers(memberUsers);

      // Fetch matches where the team is team_a or team_b
      const matchesAsTeamA = await Match.filter({ team_a_id: teamId });
      const matchesAsTeamB = await Match.filter({ team_b_id: teamId });
      
      // Combine and remove potential duplicates (though unlikely for team_a/team_b)
      // and sort to get the latest matches.
      const allMatches = [...matchesAsTeamA, ...matchesAsTeamB];
      const uniqueMatches = Array.from(new Map(allMatches.map(match => [match.id, match])).values());
      uniqueMatches.sort((a, b) => new Date(b.match_date || b.created_at) - new Date(a.match_date || a.created_at));
      
      setTeamMatches(uniqueMatches.slice(0, 10)); // Set latest 10 matches

    } catch (error) {
      console.error("Error loading team data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const handleJoinRequest = async () => {
    if (!user) {
      alert('Du måste vara inloggad för att ansöka');
      return;
    }

    try {
      // Check if already has pending request or is an active member
      const existingRequests = await TeamMember.filter({ 
        team_id: teamId, 
        user_id: user.id 
      });

      if (existingRequests.length > 0) {
        const status = existingRequests[0].status;
        if (status === 'pending') {
          alert('Du har redan en väntande ansökan till detta lag');
          return;
        } else if (status === 'active') {
          alert('Du är redan medlem i detta lag');
          return;
        }
      }

      // Create join request
      await TeamMember.create({
        team_id: teamId,
        user_id: user.id,
        role: 'member',
        status: 'pending'
      });

      alert('Ansökan skickad! Lagkaptenen kommer att granska din ansökan.');
      loadTeamData(); // Reload data to potentially update the UI (e.g., disable button)

    } catch (error) {
      console.error("Error sending join request:", error);
      alert('Kunde inte skicka ansökan. Försök igen.');
    }
  };

  const handleCreateTeamMatch = async (matchData) => {
    try {
      await Match.create(matchData);
      setShowCreateTeamMatch(false);
      alert('Rankad lagmatch skapad!');
      loadTeamData(); // Reload data to reflect the new match
    } catch (error) {
      console.error("Error creating team match:", error);
      alert("Kunde inte skapa match. Försök igen.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#F4F7F5] text-sm font-medium">Laddar lag...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto p-12 text-center bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <h2 className="text-[20px] font-semibold text-[#F4F7F5] mb-4">Lag hittades inte</h2>
          <Button onClick={() => navigate(createPageUrl("Community"))} className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF]">
            Tillbaka till Community
          </Button>
        </Card>
      </div>
    );
  }

  const isUserMember = members.some((m) => m.id === user?.id);
  const isCaptain = team.captain_id === user?.id;
  const viceCapta = team.vice_captain_ids?.includes(user?.id);
  const isCaptainOrVice = isCaptain || viceCapta;

  // Get team color config
  const getTeamColorStyle = () => {
    const colorMap = {
      '#2BA84A': { gradient: 'from-[#2BA84A] to-[#0F2917]', lightCircle: 'bg-[#2BA84A]/40', darkCircle: 'bg-[#0F2917]/60' },
      '#F4743B': { gradient: 'from-[#F4743B] to-[#BF360C]', lightCircle: 'bg-[#F4743B]/40', darkCircle: 'bg-[#BF360C]/60' },
      '#4169E1': { gradient: 'from-[#4169E1] to-[#0D1B4D]', lightCircle: 'bg-[#4169E1]/40', darkCircle: 'bg-[#0D1B4D]/60' },
      '#9370DB': { gradient: 'from-[#9370DB] to-[#2E1A47]', lightCircle: 'bg-[#9370DB]/40', darkCircle: 'bg-[#2E1A47]/60' },
      '#FFD700': { gradient: 'from-[#FFD700] to-[#4D3A00]', lightCircle: 'bg-[#FFD700]/40', darkCircle: 'bg-[#4D3A00]/60' },
      '#DC2626': { gradient: 'from-[#DC2626] to-[#450A0A]', lightCircle: 'bg-[#DC2626]/40', darkCircle: 'bg-[#450A0A]/60' },
      '#14B8A6': { gradient: 'from-[#14B8A6] to-[#042F2E]', lightCircle: 'bg-[#14B8A6]/40', darkCircle: 'bg-[#042F2E]/60' },
      '#EC4899': { gradient: 'from-[#EC4899] to-[#4A0E29]', lightCircle: 'bg-[#EC4899]/40', darkCircle: 'bg-[#4A0E29]/60' }
    };
    return colorMap[team.teamColor] || colorMap['#2BA84A']; // Default to green if color is not set or found
  };

  const teamColors = getTeamColorStyle();

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(createPageUrl("Community"))}
          className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-xl border border-[#223029] px-3 sm:px-4 text-[13px] sm:text-[14px] text-[#F4F7F5] hover:bg-[#18221E] transition-all duration-150 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Tillbaka</span>
        </button>

        {/* Hero Header Card - WITH DYNAMIC COLOR */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${teamColors.gradient} rounded-2xl p-6 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]`}>
            <div className={`absolute top-[-30px] right-[-30px] w-28 h-28 ${teamColors.lightCircle} rounded-full opacity-50`}></div>
            <div className={`absolute bottom-[-40px] left-[-40px] w-32 h-32 ${teamColors.darkCircle} rounded-full opacity-50`}></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Team Logo/Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 bg-[#FFFFFF]/15 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-[#FFFFFF]/30">
                    {team.logo_url ? (
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield className="w-12 h-12 text-[#FFFFFF]" />
                    )}
                  </div>
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {isCaptain && (
                      <Badge className="h-7 px-3 bg-[#F4743B] text-[#FFFFFF] font-semibold flex items-center gap-1.5 text-[12px] border-0">
                        <Crown className="w-3.5 h-3.5" />
                        Lagkapten
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-[#FFFFFF] mb-3 break-words overflow-wrap-anywhere">
                    {team.name}
                  </h1>

                  <p className="text-[#FFFFFF]/90 text-base mb-4 break-words overflow-wrap-anywhere">
                    {team.description || 'Tillsammans är vi starkare! ⚽'}
                  </p>

                  {/* Info Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="h-8 px-4 bg-transparent border border-[#FFFFFF]/30 text-[#FFFFFF] hover:bg-[#FFFFFF]/10 transition-all">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      {team.city}
                    </Badge>

                    <Badge className="h-8 px-4 bg-transparent border border-[#FFFFFF]/30 text-[#FFFFFF] hover:bg-[#FFFFFF]/10 transition-all">
                      <Users className="w-4 h-4 mr-1.5" />
                      {team.current_members}/{team.max_members} medlemmar
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full sm:w-auto flex flex-col gap-3">
                  {!isUserMember && (
                    <Button
                      onClick={handleJoinRequest}
                      className="h-12 w-full sm:w-[200px] bg-[#FFFFFF]/16 hover:bg-[#FFFFFF]/24 text-[#FFFFFF] rounded-xl font-semibold ring-1 ring-[#FFFFFF]/30 transition-all"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Ansök om att gå med
                    </Button>
                  )}

                  {isCaptainOrVice && (
                    <>
                      <Button
                        onClick={() => setShowInviteModal(true)}
                        className="h-12 w-full sm:w-[200px] bg-[#FFFFFF]/16 hover:bg-[#FFFFFF]/24 text-[#FFFFFF] rounded-xl font-semibold ring-1 ring-[#FFFFFF]/30 transition-all"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Bjud in medlemmar
                      </Button>
                      
                      <Button
                        onClick={() => setShowCreateTeamMatch(true)} // Added button
                        className="h-12 w-full sm:w-[200px] bg-[#9B59B6]/16 hover:bg-[#9B59B6]/24 text-[#DDA5E8] rounded-xl font-semibold ring-1 ring-[#9B59B6]/30 transition-all"
                      >
                        <Shield className="w-5 h-5 mr-2" />
                        Skapa lagmatch
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Rank Badge Section */}
              <div className="mt-6 bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl p-4 border border-[#FFFFFF]/20">
                <RankBadge 
                  elo={team.elo_rating} 
                  showProgress={true} 
                  showTrend={true} 
                  rankHistory={team.rank_history}
                  size="lg"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-3 border border-[#FFFFFF]/20 text-center">
                  <div className="text-2xl font-bold text-[#FFFFFF] mb-1">{team.elo_rating || 1200}</div>
                  <div className="text-xs text-[#FFFFFF]/80 font-medium">ELO Rating</div>
                </div>
                <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-3 border border-[#FFFFFF]/20 text-center">
                  <div className="text-2xl font-bold text-[#FFFFFF] mb-1">{team.matches_played || 0}</div>
                  <div className="text-xs text-[#FFFFFF]/80 font-medium">Matcher</div>
                </div>
                <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-3 border border-[#FFFFFF]/20 text-center">
                  <div className="text-2xl font-bold text-[#FFFFFF] mb-1">{team.wins || 0}</div>
                  <div className="text-xs text-[#FFFFFF]/80 font-medium">Vinster</div>
                </div>
                <div className="bg-[#FFFFFF]/15 backdrop-blur-md rounded-xl p-3 border border-[#FFFFFF]/20 text-center">
                  <div className="text-2xl font-bold text-[#FFFFFF] mb-1">{((team.wins || 0) / Math.max(team.matches_played || 1, 1) * 100).toFixed(0)}%</div>
                  <div className="text-xs text-[#FFFFFF]/80 font-medium">Vinst %</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sticky Tab Bar - Improved spacing and visibility */}
        <div className="sticky top-0 z-30 bg-[#0F1513]/95 backdrop-blur-md border-b border-[#223029] -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold transition-all duration-150 flex-shrink-0 rounded-xl border-2 ${
                      activeTab === tab.id
                        ? 'bg-[#2BA84A]/20 border-[#2BA84A] text-[#EAF6EE] shadow-sm'
                        : 'bg-[#18221E] border-[#223029] text-[#B6C2BC] hover:border-[#2BA84A]/50 hover:text-[#F4F7F5]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content - Improved spacing */}
        <div className="pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
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
                        <Card className="bg-[#121715] border border-[#223029] shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-2xl hover:shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:scale-[1.01] transition-all duration-150">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                                {member.profile_image_url ? (
                                  <img src={member.profile_image_url} alt={member.full_name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  <span className="text-[#FFFFFF] font-semibold text-lg">{member.full_name?.[0]}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[15px] text-[#F4F7F5] truncate">{member.full_name}</h4>
                                <p className="text-[13px] text-[#B6C2BC] truncate">{member.city}</p>
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
                                <div className="text-lg font-bold text-[#F4F7F5]">{member.matches_played || 0}</div>
                              </div>
                              <div className="bg-[#0F1513] rounded-xl p-3 border border-[#223029]">
                                <div className="text-xs text-[#B6C2BC] mb-1">MVPs</div>
                                <div className="text-lg font-bold text-[#F4743B]">{member.mvp_count || 0}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
                    <CardHeader className="border-b border-[#223029]">
                      <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#2BA84A]" />
                        Matcher & Resultat
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
                        <span className="text-sm text-[#B6C2BC] font-medium">Totalt matcher</span>
                        <span className="text-2xl font-bold text-[#F4F7F5]">{team.matches_played || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
                        <span className="text-sm text-[#B6C2BC] font-medium">Vinster</span>
                        <span className="text-2xl font-bold text-[#2BA84A]">{team.wins || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
                        <span className="text-sm text-[#B6C2BC] font-medium">Oavgjort</span>
                        <span className="text-2xl font-bold text-[#F4F7F5]">{team.draws || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
                        <span className="text-sm text-[#B6C2BC] font-medium">Förluster</span>
                        <span className="text-2xl font-bold text-[#DC2626]">{team.losses || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {isCaptain && (
                    <TeamColorPicker 
                      team={team} 
                      onColorChange={(color) => setTeam({...team, teamColor: color})} 
                      isCaptain={isCaptain} 
                    />
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TeamChat team={team} currentUser={user} isMember={isUserMember} />
              </motion.div>
            )}

            {activeTab === 'polls' && (
              <motion.div
                key="polls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TeamPolls team={team} currentUser={user} isMember={isUserMember} isCaptainOrVice={isCaptainOrVice} />
              </motion.div>
            )}

            {activeTab === 'highlights' && (
              <motion.div
                key="highlights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TeamHighlights team={team} currentUser={user} isMember={isUserMember} />
              </motion.div>
            )}

            {activeTab === 'challenges' && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TeamChallenges team={team} currentUser={user} isCaptainOrVice={isCaptainOrVice} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Team Match Modal */}
      {showCreateTeamMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            <CreateTeamMatchForm
              currentTeam={team}
              onSubmit={handleCreateTeamMatch}
              onCancel={() => setShowCreateTeamMatch(false)}
            />
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteFriendsToTeamModal
          team={team}
          currentUser={user}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
