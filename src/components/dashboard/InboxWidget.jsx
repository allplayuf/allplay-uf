import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, UserPlus, Users, Shield, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CACHE_STRATEGIES } from "../providers/QueryProvider";
import { useSupabaseAuth } from "../supabase/AuthProvider";

export default function InboxWidget() {
  const { user: authUser, isAuthenticated } = useSupabaseAuth();

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships-inbox-widget'],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: authUser.id }),
        base44.entities.Friendship.filter({ addressee_id: authUser.id })
      ]);
      const map = new Map();
      sent.forEach(f => map.set(f.id, f));
      received.forEach(f => map.set(f.id, f));
      return Array.from(map.values());
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: isAuthenticated && !!authUser?.id,
  });

  const { data: teamInvites = [] } = useQuery({
    queryKey: ['team-invites-inbox-widget', authUser?.id],
    queryFn: async () => {
      return await base44.entities.TeamMember.filter({
        user_id: authUser.id,
        status: 'pending'
      });
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: isAuthenticated && !!authUser?.id,
  });

  const { data: teamJoinRequests = [] } = useQuery({
    queryKey: ['team-join-requests-inbox-widget', authUser?.id],
    queryFn: async () => {
      const captainTeams = await base44.entities.Team.filter({ captain_id: authUser.id });
      if (captainTeams.length === 0) return [];
      const allPending = await base44.entities.TeamMember.list();
      return allPending.filter(
        tm => captainTeams.some(t => t.id === tm.team_id) && tm.status === 'pending'
      );
    },
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
      bg: 'bg-[#2BA84A]/15',
      count: pendingFriendRequests.length,
      label: pendingFriendRequests.length === 1 ? 'vänförfrågan' : 'vänförfrågningar'
    },
    teamInvites.length > 0 && {
      icon: Shield,
      color: '#F4743B',
      bg: 'bg-[#F4743B]/15',
      count: teamInvites.length,
      label: teamInvites.length === 1 ? 'laginbjudan' : 'laginbjudningar'
    },
    teamJoinRequests.length > 0 && {
      icon: Users,
      color: '#9370DB',
      bg: 'bg-[#9370DB]/15',
      count: teamJoinRequests.length,
      label: teamJoinRequests.length === 1 ? 'lagansökan' : 'lagansökningar'
    },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link to={createPageUrl("Profile")}>
        <Card className="bg-[#121715] rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.25)] border border-[#F4743B]/20 hover:border-[#F4743B]/40 transition-all overflow-hidden cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Icon with badge */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-[#F4743B]/15 rounded-xl flex items-center justify-center ring-1 ring-[#F4743B]/25 group-hover:scale-105 transition-transform">
                  <Inbox className="w-5 h-5 text-[#F4743B]" strokeWidth={2} />
                </div>
                <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#F4743B] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                  <span className="text-[10px] font-black text-white px-1">{totalNotifications}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-[#F4F7F5] group-hover:text-[#F4743B] transition-colors">
                    Inkorg
                  </h3>
                </div>
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

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-[#9EAAA4] group-hover:text-[#F4743B] transition-colors flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}