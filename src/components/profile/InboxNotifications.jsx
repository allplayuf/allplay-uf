import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  X, 
  Clock,
  Inbox,
  UserCheck,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getUsersByIds } from "../supabase/services/usersService";
import { base44 } from "@/api/base44Client";
import { CACHE_STRATEGIES } from "../providers/QueryProvider";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: sv });
  } catch { return ''; }
}

function NotificationCard({ 
  icon: Icon, 
  iconBg, 
  iconColor, 
  borderHover, 
  title, 
  subtitle, 
  timestamp, 
  profileUrl,
  onAccept, 
  onDecline, 
  acceptLabel = 'Acceptera',
  acceptBg,
  isProcessing,
  index 
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Card className={`bg-[#121715] border border-[#223029] ${borderHover} transition-all shadow-sm rounded-[16px] overflow-hidden`}>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Avatar / Icon */}
            <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {profileUrl ? (
                <Link to={profileUrl}>
                  <h4 className="font-semibold text-[#F4F7F5] hover:text-[#2BA84A] transition-colors text-sm truncate">
                    {title}
                  </h4>
                </Link>
              ) : (
                <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">{title}</h4>
              )}
              <p className="text-xs text-[#9EAAA4] mt-0.5 truncate">{subtitle}</p>
              {timestamp && (
                <p className="text-[10px] text-[#6B7C74] mt-0.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timestamp}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                onClick={onAccept}
                disabled={isProcessing}
                size="sm"
                className={`${acceptBg} text-white h-8 px-3 rounded-xl text-xs font-semibold`}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    {acceptLabel}
                  </>
                )}
              </Button>
              <Button
                onClick={onDecline}
                disabled={isProcessing}
                size="sm"
                variant="ghost"
                className="text-[#9EAAA4] hover:bg-[#18221E] hover:text-[#F4F7F5] h-8 w-8 p-0 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function InboxNotifications({ 
  friendRequests = [], 
  teamInvites = [],
  teamJoinRequests = [],
  onAcceptFriend, 
  onDeclineFriend,
  onAcceptTeam,
  onDeclineTeam,
  onAcceptJoinRequest,
  onDeclineJoinRequest
}) {
  const [processingIds, setProcessingIds] = useState(new Set());

  // Collect all user IDs we need
  const allUserIds = useMemo(() => {
    const ids = new Set();
    friendRequests.forEach(fr => ids.add(fr.requester_id));
    teamJoinRequests.forEach(jr => ids.add(jr.user_id));
    return [...ids].filter(Boolean);
  }, [friendRequests, teamJoinRequests]);

  // Collect all team IDs we need
  const allTeamIds = useMemo(() => {
    const ids = new Set();
    teamInvites.forEach(ti => ids.add(ti.team_id));
    teamJoinRequests.forEach(jr => ids.add(jr.team_id));
    return [...ids].filter(Boolean);
  }, [teamInvites, teamJoinRequests]);

  // Fetch users via Supabase service (consistent with rest of app)
  const { data: usersMap = {}, isLoading: usersLoading } = useQuery({
    queryKey: ['inbox-users', allUserIds],
    queryFn: async () => {
      if (allUserIds.length === 0) return {};
      const users = await getUsersByIds(allUserIds);
      const map = {};
      users.forEach(u => { map[u.id] = u; });
      return map;
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: allUserIds.length > 0,
  });

  // Fetch teams via Base44 (TeamMember still uses Base44)
  const { data: teamsMap = {}, isLoading: teamsLoading } = useQuery({
    queryKey: ['inbox-teams', allTeamIds],
    queryFn: async () => {
      if (allTeamIds.length === 0) return {};
      const teams = await Promise.all(
        allTeamIds.map(id => base44.entities.Team.get(id).catch(() => null))
      );
      const map = {};
      teams.forEach(t => { if (t) map[t.id] = t; });
      return map;
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: allTeamIds.length > 0,
  });

  const totalNotifications = friendRequests.length + teamInvites.length + teamJoinRequests.length;
  const isLoading = (allUserIds.length > 0 && usersLoading) || (allTeamIds.length > 0 && teamsLoading);

  const wrapAction = async (id, action) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await action(id);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse bg-[#121715] border border-[#223029] rounded-[16px] p-4 h-[72px]" />
        ))}
      </div>
    );
  }

  if (totalNotifications === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/20">
            <Inbox className="w-7 h-7 text-[#2BA84A]" />
          </div>
          <h3 className="text-base font-bold text-[#F4F7F5] mb-1">
            Allt ikapp!
          </h3>
          <p className="text-sm text-[#9EAAA4]">
            Du har inga väntande förfrågningar just nu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#F4743B]/15 rounded-lg flex items-center justify-center">
          <Inbox className="w-4 h-4 text-[#F4743B]" />
        </div>
        <h3 className="text-base font-bold text-[#F4F7F5]">
          Förfrågningar
        </h3>
        <Badge className="bg-[#F4743B]/15 text-[#F4743B] border-0 text-xs font-bold ml-auto">
          {totalNotifications}
        </Badge>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#9EAAA4] uppercase tracking-wider px-1">
            Vänförfrågningar
          </p>
          <AnimatePresence mode="popLayout">
            {friendRequests.map((request, index) => {
              const requester = usersMap[request.requester_id];
              if (!requester) return null;

              return (
                <NotificationCard
                  key={request.id}
                  icon={({ className }) => (
                    requester.profile_image_url || requester.avatar_url ? (
                      <img
                        src={requester.profile_image_url || requester.avatar_url}
                        alt={requester.full_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {requester.full_name?.[0] || 'U'}
                      </span>
                    )
                  )}
                  iconBg="bg-gradient-to-br from-[#2BA84A] to-[#248232]"
                  iconColor="text-white"
                  borderHover="hover:border-[#2BA84A]/30"
                  title={requester.display_name || requester.full_name}
                  subtitle="Vill bli din vän"
                  timestamp={timeAgo(request.created_date)}
                  profileUrl={`${createPageUrl("Profile")}?userId=${requester.id}`}
                  onAccept={() => wrapAction(request.id, onAcceptFriend)}
                  onDecline={() => wrapAction(request.id, onDeclineFriend)}
                  acceptBg="bg-[#2BA84A] hover:bg-[#248232]"
                  isProcessing={processingIds.has(request.id)}
                  index={index}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Team Join Requests (for captains) */}
      {teamJoinRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#9EAAA4] uppercase tracking-wider px-1">
            Ansökningar till dina lag
          </p>
          <AnimatePresence mode="popLayout">
            {teamJoinRequests.map((request, index) => {
              const applicant = usersMap[request.user_id];
              const team = teamsMap[request.team_id];
              if (!applicant || !team) return null;

              return (
                <NotificationCard
                  key={request.id}
                  icon={({ className }) => (
                    applicant.profile_image_url || applicant.avatar_url ? (
                      <img
                        src={applicant.profile_image_url || applicant.avatar_url}
                        alt={applicant.full_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {applicant.full_name?.[0] || 'U'}
                      </span>
                    )
                  )}
                  iconBg="bg-gradient-to-br from-[#9370DB] to-[#7C3AED]"
                  iconColor="text-white"
                  borderHover="hover:border-[#9370DB]/30"
                  title={applicant.display_name || applicant.full_name}
                  subtitle={`Vill gå med i ${team.name}`}
                  timestamp={timeAgo(request.created_date)}
                  profileUrl={`${createPageUrl("Profile")}?userId=${applicant.id}`}
                  onAccept={() => wrapAction(request.id, onAcceptJoinRequest)}
                  onDecline={() => wrapAction(request.id, onDeclineJoinRequest)}
                  acceptLabel="Godkänn"
                  acceptBg="bg-[#9370DB] hover:bg-[#7C3AED]"
                  isProcessing={processingIds.has(request.id)}
                  index={index}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Team Invites */}
      {teamInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#9EAAA4] uppercase tracking-wider px-1">
            Laginbjudningar
          </p>
          <AnimatePresence mode="popLayout">
            {teamInvites.map((invite, index) => {
              const team = teamsMap[invite.team_id];
              if (!team) return null;

              return (
                <NotificationCard
                  key={invite.id}
                  icon={({ className }) => (
                    team.logo_url ? (
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Shield className="w-5 h-5 text-white" />
                    )
                  )}
                  iconBg="bg-gradient-to-br from-[#F4743B] to-[#E5683A]"
                  iconColor="text-white"
                  borderHover="hover:border-[#F4743B]/30"
                  title={team.name}
                  subtitle="Du har blivit inbjuden till laget"
                  timestamp={timeAgo(invite.created_date)}
                  profileUrl={`${createPageUrl("TeamOverview")}?id=${team.id}`}
                  onAccept={() => wrapAction(invite.id, onAcceptTeam)}
                  onDecline={() => wrapAction(invite.id, onDeclineTeam)}
                  acceptLabel="Gå med"
                  acceptBg="bg-[#F4743B] hover:bg-[#E5683A]"
                  isProcessing={processingIds.has(invite.id)}
                  index={index}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}