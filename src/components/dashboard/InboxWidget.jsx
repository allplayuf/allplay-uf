import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox, UserPlus, Users, Shield, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { CACHE_STRATEGIES } from "../providers/QueryProvider";
import { useSupabaseAuth } from "../supabase/AuthProvider";
import { getMyFriendships } from "../supabase/services/friendshipsService";
import { getAuthHeaders, SUPABASE_URL } from "../supabase/config";
import { waitForAuth, sessionStore } from "../supabase/client";

async function getPendingTeamInvites(userId) {
  await waitForAuth();
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=*&user_id=eq.${userId}&status=eq.pending`,
    { method: 'GET', headers }
  );
  if (!res.ok) return [];
  return res.json();
}

async function getCaptainTeamJoinRequests(userId) {
  await waitForAuth();
  const headers = await getAuthHeaders();
  // Get teams where I'm captain
  const teamsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?select=id&captain_id=eq.${userId}&is_active=eq.true`,
    { method: 'GET', headers }
  );
  if (!teamsRes.ok) return [];
  const teams = await teamsRes.json();
  if (teams.length === 0) return [];

  const teamIds = teams.map(t => t.id).join(',');
  const membersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=*&team_id=in.(${teamIds})&status=eq.pending`,
    { method: 'GET', headers }
  );
  if (!membersRes.ok) return [];
  const pending = await membersRes.json();
  // Exclude rows that are invites sent to someone (where the current user is the inviter)
  // Join requests are rows where the user_id is not the current user (someone else requested)
  return pending.filter(m => m.user_id !== userId);
}

export default function InboxWidget() {
  const { user: authUser, isAuthenticated } = useSupabaseAuth();

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships-inbox-widget', authUser?.id],
    queryFn: () => getMyFriendships(),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: isAuthenticated && !!authUser?.id,
  });

  const { data: teamInvites = [] } = useQuery({
    queryKey: ['team-invites-inbox-widget', authUser?.id],
    queryFn: () => getPendingTeamInvites(authUser.id),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: isAuthenticated && !!authUser?.id,
  });

  const { data: teamJoinRequests = [] } = useQuery({
    queryKey: ['team-join-requests-inbox-widget', authUser?.id],
    queryFn: () => getCaptainTeamJoinRequests(authUser.id),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: isAuthenticated && !!authUser?.id,
  });

  const pendingFriendRequests = friendships.filter(
    f => f.addressee_id === authUser?.id && f.status === 'pending'
  );

  const totalNotifications = pendingFriendRequests.length + teamInvites.length + teamJoinRequests.length;

  if (totalNotifications === 0) return null;

  const items = [
    pendingFriendRequests.length > 0 && {
      icon: UserPlus,
      color: '#2BA84A',
      count: pendingFriendRequests.length,
      label: pendingFriendRequests.length === 1 ? 'vänförfrågan' : 'vänförfrågningar'
    },
    teamInvites.length > 0 && {
      icon: Shield,
      color: '#F4743B',
      count: teamInvites.length,
      label: teamInvites.length === 1 ? 'laginbjudan' : 'laginbjudningar'
    },
    teamJoinRequests.length > 0 && {
      icon: Users,
      color: '#9370DB',
      count: teamJoinRequests.length,
      label: teamJoinRequests.length === 1 ? 'lagansökan' : 'lagansökningar'
    },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={createPageUrl("Profile")}>
        <Card className="bg-[#121715] rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.25)] border border-[#F4743B]/20 hover:border-[#F4743B]/40 transition-all overflow-hidden cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-[#F4743B]/15 rounded-xl flex items-center justify-center ring-1 ring-[#F4743B]/25 group-hover:scale-105 transition-transform">
                  <Inbox className="w-5 h-5 text-[#F4743B]" strokeWidth={2} />
                </div>
                <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#F4743B] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                  <span className="text-[10px] font-black text-white px-1">{totalNotifications}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#F4F7F5] group-hover:text-[#F4743B] transition-colors mb-1">
                  Inkorg
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {items.map((item, i) => (
                    <span key={i} className="flex items-center gap-1 text-[11px] text-[#B6C2BC]">
                      <item.icon className="w-3 h-3" style={{ color: item.color }} />
                      <span className="font-semibold" style={{ color: item.color }}>{item.count}</span>
                      <span>{item.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-[#9EAAA4] group-hover:text-[#F4743B] transition-colors flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
