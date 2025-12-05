import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Inbox
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function InboxNotifications({ 
  friendRequests, 
  teamInvites,
  teamJoinRequests = [], // NEW: Accept team join requests
  onAcceptFriend, 
  onDeclineFriend,
  onAcceptTeam,
  onDeclineTeam,
  onAcceptJoinRequest, // NEW: Handler for accepting join requests
  onDeclineJoinRequest // NEW: Handler for declining join requests
}) {
  const [requestersData, setRequestersData] = useState({});
  const [teamsData, setTeamsData] = useState({});
  const [joinRequestUsersData, setJoinRequestUsersData] = useState({}); // NEW: Store user data for join requests
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequestersAndTeams();
  }, [friendRequests, teamInvites, teamJoinRequests]);

  const loadRequestersAndTeams = async () => {
    try {
      // Load friend requesters
      const requesterIds = friendRequests.map(fr => fr.requester_id);
      const requestersPromises = requesterIds.map(id => 
        base44.entities.User.get(id).catch(err => {
          console.error(`Failed to load user ${id}:`, err);
          return null;
        })
      );
      const requestersArray = await Promise.all(requestersPromises);
      const requestersMap = {};
      requestersArray.forEach((user, idx) => {
        if (user) requestersMap[requesterIds[idx]] = user;
      });
      setRequestersData(requestersMap);

      // Load teams for team invites
      const teamIds = teamInvites.map(ti => ti.team_id);
      const teamsPromises = teamIds.map(id => 
        base44.entities.Team.get(id).catch(err => {
          console.error(`Failed to load team ${id}:`, err);
          return null;
        })
      );
      const teamsArray = await Promise.all(teamsPromises);
      const teamsMap = {};
      teamsArray.forEach((team, idx) => {
        if (team) teamsMap[teamIds[idx]] = team;
      });
      setTeamsData(teamsMap);

      // NEW: Load users for team join requests
      const joinRequestUserIds = teamJoinRequests.map(jr => jr.user_id);
      const joinRequestUsersPromises = joinRequestUserIds.map(id => 
        base44.entities.User.get(id).catch(err => {
          console.error(`Failed to load user ${id}:`, err);
          return null;
        })
      );
      const joinRequestUsersArray = await Promise.all(joinRequestUsersPromises);
      const joinRequestUsersMap = {};
      joinRequestUsersArray.forEach((user, idx) => {
        if (user) joinRequestUsersMap[joinRequestUserIds[idx]] = user;
      });
      setJoinRequestUsersData(joinRequestUsersMap);

      // Also load teams for join requests
      const joinRequestTeamIds = teamJoinRequests.map(jr => jr.team_id);
      const joinRequestTeamsPromises = joinRequestTeamIds.map(id => 
        base44.entities.Team.get(id).catch(err => {
          console.error(`Failed to load team ${id}:`, err);
          return null;
        })
      );
      const joinRequestTeamsArray = await Promise.all(joinRequestTeamsPromises);
      joinRequestTeamsArray.forEach((team, idx) => {
        if (team) teamsMap[joinRequestTeamIds[idx]] = team;
      });
      setTeamsData(teamsMap);

    } catch (error) {
      console.error("Error loading requesters and teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalNotifications = friendRequests.length + teamInvites.length + teamJoinRequests.length;

  if (isLoading) {
    return (
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
        <CardContent className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#B6C2BC] mt-4">Laddar notiser...</p>
        </CardContent>
      </Card>
    );
  }

  if (totalNotifications === 0) {
    return (
      <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/20 border border-[#223029] shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-[16px]">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6 text-[#2BA84A]" />
          </div>
          <h3 className="text-base font-bold text-[#F4F7F5] mb-1">
            Inga nya notiser
          </h3>
          <p className="text-xs text-[#B6C2BC]">
            Nya notiser visas här
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#F4F7F5]">
          Inbox ({totalNotifications})
        </h3>
        <Badge className="bg-[#2BA84A]/20 text-[#2BA84A] border-0">
          {totalNotifications} nya
        </Badge>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#B6C2BC] uppercase tracking-wide">
            Vänförfrågningar ({friendRequests.length})
          </h4>
          <AnimatePresence>
            {friendRequests.map((request, index) => {
              const requester = requestersData[request.requester_id];
              if (!requester) return null;

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A]/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-[16px]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                          {requester.profile_image_url ? (
                            <img
                              src={requester.profile_image_url}
                              alt={requester.full_name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <span className="text-[#FFFFFF] font-semibold text-lg">
                              {requester.full_name?.[0] || 'U'}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={`${createPageUrl("Profile")}?userId=${requester.id}`}>
                            <h4 className="font-semibold text-[#F4F7F5] hover:text-[#2BA84A] transition-colors truncate">
                              {requester.full_name}
                            </h4>
                          </Link>
                          <p className="text-sm text-[#B6C2BC] flex items-center gap-1">
                            <UserPlus className="w-3 h-3" />
                            Vill bli vän
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => onAcceptFriend(request.id)}
                            size="sm"
                            className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] h-9 px-3 rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Acceptera
                          </Button>
                          <Button
                            onClick={() => onDeclineFriend(request.id)}
                            size="sm"
                            variant="outline"
                            className="border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] h-9 px-3 rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* NEW: Team Join Requests */}
      {teamJoinRequests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#B6C2BC] uppercase tracking-wide">
            Ansökningar till dina lag ({teamJoinRequests.length})
          </h4>
          <AnimatePresence>
            {teamJoinRequests.map((request, index) => {
              const applicant = joinRequestUsersData[request.user_id];
              const team = teamsData[request.team_id];
              if (!applicant || !team) return null;

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="bg-[#121715] border border-[#223029] hover:border-[#9B59B6]/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-[16px]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] rounded-xl flex items-center justify-center flex-shrink-0">
                          {applicant.profile_image_url ? (
                            <img
                              src={applicant.profile_image_url}
                              alt={applicant.full_name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <span className="text-[#FFFFFF] font-semibold text-lg">
                              {applicant.full_name?.[0] || 'U'}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={`${createPageUrl("Profile")}?userId=${applicant.id}`}>
                            <h4 className="font-semibold text-[#F4F7F5] hover:text-[#9B59B6] transition-colors truncate">
                              {applicant.full_name}
                            </h4>
                          </Link>
                          <p className="text-sm text-[#B6C2BC] flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Vill gå med i <span className="text-[#9B59B6] font-medium">{team.name}</span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => onAcceptJoinRequest(request.id)}
                            size="sm"
                            className="bg-[#9B59B6] hover:bg-[#8E44AD] text-[#FFFFFF] h-9 px-3 rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Acceptera
                          </Button>
                          <Button
                            onClick={() => onDeclineJoinRequest(request.id)}
                            size="sm"
                            variant="outline"
                            className="border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] h-9 px-3 rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Team Invites */}
      {teamInvites.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#B6C2BC] uppercase tracking-wide">
            Laginbjudningar ({teamInvites.length})
          </h4>
          <AnimatePresence>
            {teamInvites.map((invite, index) => {
              const team = teamsData[invite.team_id];
              if (!team) return null;

              return (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="bg-[#121715] border border-[#223029] hover:border-[#F4743B]/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-[16px]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Team Logo */}
                        <div className="w-12 h-12 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-xl flex items-center justify-center flex-shrink-0">
                          {team.logo_url ? (
                            <img
                              src={team.logo_url}
                              alt={team.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Shield className="w-6 h-6 text-[#FFFFFF]" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={`${createPageUrl("TeamOverview")}?id=${team.id}`}>
                            <h4 className="font-semibold text-[#F4F7F5] hover:text-[#F4743B] transition-colors truncate">
                              {team.name}
                            </h4>
                          </Link>
                          <p className="text-sm text-[#B6C2BC] flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Inbjudan till lag
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => onAcceptTeam(invite.id)}
                            size="sm"
                            className="bg-[#F4743B] hover:bg-[#E5683A] text-[#FFFFFF] h-9 px-3 rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Acceptera
                          </Button>
                          <Button
                            onClick={() => onDeclineTeam(invite.id)}
                            size="sm"
                            variant="outline"
                            className="border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] h-9 px-3 rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}