import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Trophy, MapPin, Crown, TrendingUp, Target,
  MessageCircle, BarChart, Image as ImageIcon, Swords, Calendar, Loader2
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { getTeams, getTeamMembers, getUsersByIds, getMyProfile } from "../components/supabase/services";
import AvatarImage from "@/components/ui/avatar-image";

export default function TeamOverviewPage() {
  const navigate = useNavigate();
  const teamId = new URLSearchParams(window.location.search).get('id');
  const queryClient = useQueryClient();
  const { user: authUser, isAuthenticated } = useSupabaseAuth();

  const [activeTab, setActiveTab] = useState('members');

  // Fetch current user profile
  const { data: user } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: () => getMyProfile(),
    enabled: isAuthenticated && !!authUser?.id,
  });

  // Fetch team data
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: async () => {
      const teams = await getTeams();
      return teams.find(t => t.id === teamId) || null;
    },
    enabled: !!teamId,
  });

  // Fetch team members
  const { data: rawMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => getTeamMembers(teamId),
    enabled: !!teamId,
  });

  // Enrich members with user profiles
  const { data: members = [] } = useQuery({
    queryKey: ['team-members-enriched', teamId, rawMembers.map(m => m.user_id).join(',')],
    queryFn: async () => {
      const userIds = rawMembers.map(m => m.user_id).filter(Boolean);
      if (userIds.length === 0) return [];
      const users = await getUsersByIds(userIds);
      return rawMembers.map(m => {
        const u = users.find(u => u.id === m.user_id) || {};
        return { ...u, ...m, teamRole: m.role };
      });
    },
    enabled: rawMembers.length > 0,
  });

  const isLoading = teamLoading || membersLoading;

  const isUserMember = useMemo(() => {
    return members.some(m => m.user_id === authUser?.id);
  }, [members, authUser?.id]);

  const isCaptain = team?.captain_id === authUser?.id || 
    members.some(m => m.user_id === authUser?.id && m.role === 'captain');

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

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto p-12 text-center bg-[#121715] border border-[#223029] rounded-2xl">
          <h2 className="text-xl font-semibold text-[#F4F7F5] mb-4">Lag hittades inte</h2>
          <Button onClick={() => navigate(createPageUrl("Community"))} className="bg-[#2BA84A] hover:bg-[#248232] text-white">
            Tillbaka till Community
          </Button>
        </Card>
      </div>
    );
  }

  const teamColor = team.team_color || team.teamColor || '#2BA84A';
  const colorMap = {
    '#2BA84A': 'from-[#2BA84A] to-[#0F2917]',
    '#F4743B': 'from-[#F4743B] to-[#BF360C]',
    '#4169E1': 'from-[#4169E1] to-[#0D1B4D]',
    '#9370DB': 'from-[#9370DB] to-[#2E1A47]',
    '#FFD700': 'from-[#FFD700] to-[#4D3A00]',
    '#DC2626': 'from-[#DC2626] to-[#450A0A]',
    '#14B8A6': 'from-[#14B8A6] to-[#042F2E]',
    '#EC4899': 'from-[#EC4899] to-[#4A0E29]',
  };
  const gradient = colorMap[teamColor] || colorMap['#2BA84A'];

  const createdDate = team.created_at 
    ? new Date(team.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-6 border border-[#223029]`}>
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-white/30 flex-shrink-0">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isCaptain && (
                    <Badge className="bg-[#F4743B] text-white text-[11px] border-0">
                      <Crown className="w-3 h-3 mr-1" /> Kapten
                    </Badge>
                  )}
                  {team.is_cup_team && (
                    <Badge className="bg-[#F59E0B] text-white text-[11px] border-0">
                      <Trophy className="w-3 h-3 mr-1" /> Cup-lag
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 break-words">{team.name}</h1>
                <p className="text-white/80 text-sm mb-3 break-words">{team.description || 'Tillsammans är vi starkare! ⚽'}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className="bg-transparent border border-white/30 text-white">
                    <MapPin className="w-3.5 h-3.5 mr-1" /> {team.city}
                  </Badge>
                  <Badge className="bg-transparent border border-white/30 text-white">
                    <Users className="w-3.5 h-3.5 mr-1" /> {members.length} medlemmar
                  </Badge>
                  {createdDate && (
                    <Badge className="bg-transparent border border-white/30 text-white">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> {createdDate}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mt-6 relative z-10">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                <div className="text-xl font-black text-white">{team.matches_played || 0}</div>
                <div className="text-[10px] text-white/80 font-semibold">Spelade</div>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                <div className="text-xl font-black text-[#86EFAC]">{team.wins || 0}</div>
                <div className="text-[10px] text-white/80 font-semibold">Vinster</div>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                <div className="text-xl font-black text-white">{team.draws || 0}</div>
                <div className="text-[10px] text-white/80 font-semibold">Oavgjorda</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Members Section */}
        <div>
          <h2 className="text-lg font-bold text-[#F4F7F5] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2BA84A]" /> Medlemmar ({members.length})
          </h2>

          {members.length === 0 ? (
            <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-[#9EAAA4]/40 mx-auto mb-3" />
                <p className="text-sm text-[#B6C2BC]">Inga medlemmar hittades</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((member, index) => (
                <motion.div
                  key={member.id || member.user_id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="bg-[#121715] border border-[#223029] rounded-2xl hover:border-[#2BA84A]/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AvatarImage
                          src={member.avatar_url || member.profile_image_url}
                          name={member.display_name || member.full_name || 'Spelare'}
                          className="w-12 h-12 flex-shrink-0"
                          textClassName="text-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">
                            {member.display_name || member.full_name || 'Spelare'}
                          </h4>
                          <p className="text-xs text-[#B6C2BC] truncate">{member.city || ''}</p>
                        </div>
                        {member.role === 'captain' && (
                          <Crown className="w-4 h-4 text-[#F4743B] flex-shrink-0" />
                        )}
                        <Badge className="bg-[#18221E] text-[#9EAAA4] text-[10px] border border-[#223029]">
                          {member.role === 'captain' ? 'Kapten' : member.role === 'co_captain' ? 'Vice' : 'Medlem'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}