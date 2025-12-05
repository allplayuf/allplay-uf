import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox, UserPlus, Users, ArrowRight, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function InboxWidget() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => await base44.auth.me(),
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships'],
    queryFn: async () => await base44.entities.Friendship.list(),
    enabled: !!user,
  });

  const { data: teamInvites = [] } = useQuery({
    queryKey: ['teamInvites'],
    queryFn: async () => await base44.entities.TeamInvitation.list(),
    enabled: !!user,
  });

  const { data: matchInvites = [] } = useQuery({
    queryKey: ['matchInvites'],
    queryFn: async () => await base44.entities.MatchInvitation.list(),
    enabled: !!user,
  });

  const pendingFriendRequests = friendships.filter(
    f => f.addressee_id === user?.id && f.status === 'pending'
  );

  const pendingTeamInvites = teamInvites.filter(
    i => i.invited_user_id === user?.id && i.status === 'pending'
  );

  const pendingMatchInvites = matchInvites.filter(
    i => i.invited_user_id === user?.id && i.status === 'pending'
  );

  const totalNotifications = pendingFriendRequests.length + pendingTeamInvites.length + pendingMatchInvites.length;

  if (totalNotifications === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link to={createPageUrl("Profile")}>
        <Card className="bg-gradient-to-br from-[#121715] to-[#18221E]/50 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#F4743B]/20 hover:border-[#F4743B]/40 transition-all overflow-hidden cursor-pointer group">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 bg-[#F4743B]/20 rounded-xl flex items-center justify-center ring-2 ring-[#F4743B]/30 group-hover:scale-110 transition-transform">
                    <Inbox className="w-5 h-5 text-[#F4743B]" strokeWidth={2.5} />
                  </div>
                  {totalNotifications > 0 && (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#F4743B] rounded-full flex items-center justify-center ring-2 ring-[#121715]"
                    >
                      <span className="text-[10px] font-black text-white">{totalNotifications}</span>
                    </motion.div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F4F7F5] group-hover:text-[#F4743B] transition-colors">
                    Inkorg
                  </h3>
                  <p className="text-xs text-[#B6C2BC]">
                    {totalNotifications} {totalNotifications === 1 ? 'notis' : 'notiser'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  {pendingFriendRequests.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 h-7 bg-[#18221E] rounded-lg border border-[#223029]">
                      <UserPlus className="w-3.5 h-3.5 text-[#9370DB]" />
                      <span className="text-xs font-bold text-[#9370DB]">{pendingFriendRequests.length}</span>
                    </div>
                  )}
                  {pendingTeamInvites.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 h-7 bg-[#18221E] rounded-lg border border-[#223029]">
                      <Users className="w-3.5 h-3.5 text-[#2BA84A]" />
                      <span className="text-xs font-bold text-[#2BA84A]">{pendingTeamInvites.length}</span>
                    </div>
                  )}
                  {pendingMatchInvites.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 h-7 bg-[#18221E] rounded-lg border border-[#223029]">
                      <Bell className="w-3.5 h-3.5 text-[#F4743B]" />
                      <span className="text-xs font-bold text-[#F4743B]">{pendingMatchInvites.length}</span>
                    </div>
                  )}
                </div>

                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5 text-[#F4743B]" />
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}