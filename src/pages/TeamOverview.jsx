import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, Users, Trophy, Swords, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import {
  getTeamById,
  getTeamMembersWithProfiles,
  requestJoinTeam,
} from "../components/supabase/services";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";

import TeamChallenges from "../components/teams/TeamChallenges";
import TeamColorPicker from "../components/teams/TeamColorPicker";
import InviteFriendsToTeamModal from "../components/teams/InviteFriendsToTeamModal";
import CreateTeamMatchForm from "../components/teams/CreateTeamMatchForm";
import TeamStatsCard from "../components/teams/TeamStatsCard";

import TeamHero from "../components/teams/overview/TeamHero";
import TeamTabBar from "../components/teams/overview/TeamTabBar";
import TeamMembersList from "../components/teams/overview/TeamMembersList";

const ALL_TABS = [
  { id: 'stats',      label: 'Statistik',  icon: Trophy,  accent: '#34C257', showForCupTeam: true  },
  { id: 'members',    label: 'Medlemmar',  icon: Users,   accent: '#60A5FA', showForCupTeam: true  },
  { id: 'challenges', label: 'Utmaningar', icon: Swords,  accent: '#F4743B', showForCupTeam: false },
];

export default function TeamOverviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const teamId = new URLSearchParams(location.search).get('id');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('stats');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTeamMatch, setShowCreateTeamMatch] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const { user: authUser } = useSupabaseAuth();

  const { data: team, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: () => getTeamById(teamId),
    enabled: !!teamId,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  const { data: membersWithProfiles = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => getTeamMembersWithProfiles(teamId),
    enabled: !!teamId && !!team,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  // Derived state
  const user = authUser;
  const isCupTeam = team?.is_cup_team === true;
  const isCaptain = !!user?.id && team?.captain_id === user.id;
  const isViceCaptain = !!user?.id && (team?.vice_captain_ids || []).includes(user.id);
  const isCaptainOrVice = isCaptain || isViceCaptain;

  const activeMembers = (membersWithProfiles || []).filter(m => m.status === 'active');
  const members = activeMembers.map(m => ({
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

  const isUserMember = !!user?.id && activeMembers.some(m => m.user_id === user.id);
  const hasPendingInvite = !!user?.id &&
    (membersWithProfiles || []).some(m => m.user_id === user.id && m.status === 'pending');
  const canJoin = !isUserMember && !isCupTeam && !hasPendingInvite && !!user?.id;
  const memberCount = members.length;

  const TABS = isCupTeam ? ALL_TABS.filter(t => t.showForCupTeam) : ALL_TABS;

  // --- Actions ---
  const handleJoin = async () => {
    if (isJoining || !team?.id) return;
    setIsJoining(true);
    try {
      const result = await requestJoinTeam(team.id);
      if (result?.reason === 'already_exists') {
        toast.info('Du har redan en förfrågan eller är medlem');
      } else {
        toast.success('Förfrågan skickad — kaptenen måste godkänna');
      }
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    } catch (error) {
      toast.error(error.message || 'Kunde inte skicka förfrågan');
    } finally {
      setIsJoining(false);
    }
  };

  const handleColorChange = () => {
    queryClient.invalidateQueries({ queryKey: ['team-detail', teamId] });
  };

  const handleInviteClose = () => {
    setShowInviteModal(false);
    queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
  };

  const handleCreateMatchClose = () => {
    setShowCreateTeamMatch(false);
    queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
  };

  // --- Loading / error states ---
  if (teamLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-[#2BA84A] animate-spin mx-auto" />
          <p className="text-[#F4F7F5] text-sm font-medium">Laddar lag...</p>
        </div>
      </div>
    );
  }

  if (!team || teamError) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto p-10 text-center bg-[#121715] border border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <Shield className="w-10 h-10 text-[#9EAAA4] mx-auto mb-3" />
          <h2 className="text-[20px] font-semibold text-[#F4F7F5] mb-2">Lag hittades inte</h2>
          <p className="text-[#B6C2BC] mb-6 text-sm">
            {teamError ? `Fel: ${teamError.message}` : 'Laget finns inte eller har tagits bort.'}
          </p>
          <Button
            onClick={() => navigate(`${createPageUrl("Community")}?tab=teams`)}
            className="bg-[#2BA84A] hover:bg-[#248232] text-white"
          >
            Tillbaka till Community
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-[#0F1513] pb-6 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-5 py-4 sm:py-6">

        {/* HERO */}
        <TeamHero
          team={team}
          memberCount={memberCount}
          isCaptain={isCaptain}
          isCaptainOrVice={isCaptainOrVice}
          isCupTeam={isCupTeam}
          isUserMember={isUserMember}
          canJoin={canJoin}
          isJoining={isJoining}
          onJoin={handleJoin}
          onInvite={() => setShowInviteModal(true)}
          onCreateMatch={() => setShowCreateTeamMatch(true)}
        />

        {/* Pending invite hint */}
        {hasPendingInvite && (
          <div className="px-4 py-3 bg-[#F4743B]/12 border border-[#F4743B]/30 rounded-xl text-[13px] text-[#FDE3D2] text-center">
            Din ansökan är skickad — en kapten måste godkänna den.
          </div>
        )}

        {/* TABS */}
        <TeamTabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        {/* CONTENT */}
        <div>
          <AnimatePresence mode="wait">
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
              >
                <TeamStatsCard team={team} />
                {isCaptain && !isCupTeam && (
                  <TeamColorPicker team={team} onColorChange={handleColorChange} isCaptain={isCaptain} />
                )}
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              >
                <TeamMembersList
                  members={members}
                  team={team}
                  isLoading={membersLoading}
                />
              </motion.div>
            )}

            {!isCupTeam && activeTab === 'challenges' && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              >
                <TeamChallenges
                  team={team}
                  currentUser={user}
                  isCaptainOrVice={isCaptainOrVice}
                />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                onSubmit={handleCreateMatchClose}
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
            onClose={handleInviteClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}