
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Trophy,
  ArrowLeft,
  UserPlus,
  Share2,
  Flag,
  Target,
  TrendingUp,
  Shield,
  Crown
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useCustomDialog } from "../components/ui/custom-dialog";
import MatchEndModal from "../components/matches/MatchEndModal";
import InviteFriendsModal from "../components/matches/InviteFriendsModal";

// CONSISTENT SKILL LEVEL CONFIG - WCAG AA compliant colors
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

// STATUS CONFIG - WCAG AA compliant with Royal Blue for upcoming
const STATUS_CONFIG = {
  upcoming: {
    label: 'Kommande',
    bgColor: 'bg-[#4169E1]', // Royal Blue
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#4169E1]/40'
  },
  ongoing: {
    label: 'Pågår',
    bgColor: 'bg-[#F59E0B]',
    textColor: 'text-[#000000]',
    ringColor: 'ring-[#F59E0B]/40'
  },
  completed: {
    label: 'Avslutad',
    bgColor: 'bg-[#6B7280]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#6B7280]/40'
  },
  cancelled: {
    label: 'Inställd',
    bgColor: 'bg-[#DC2626]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#DC2626]/40'
  }
};

export default function MatchDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const matchId = new URLSearchParams(location.search).get('id');

  const [match, setMatch] = useState(null);
  const [venue, setVenue] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendships, setFriendships] = useState([]);

  const { confirm, alert, DialogContainer } = useCustomDialog();

  useEffect(() => {
    if (matchId) {
      loadMatchData();
    }
  }, [matchId]);

  const loadMatchData = async () => {
    try {
      const [matchData, currentUser] = await Promise.all([
        base44.entities.Match.get(matchId),
        base44.auth.me()
      ]);

      setMatch(matchData);
      setUser(currentUser);

      // Load friendships
      const allFriendships = await base44.entities.Friendship.list();
      setFriendships(allFriendships);

      if (matchData.venue_id) {
        const venueData = await base44.entities.Venue.get(matchData.venue_id);
        setVenue(venueData);
      }

      const participantData = await base44.entities.MatchParticipant.filter({ match_id: matchId });
      const participantUsers = await Promise.all(
        participantData.map(async (p) => {
          const userData = await base44.entities.User.get(p.user_id);
          return { ...userData, participantInfo: p };
        })
      );

      setParticipants(participantUsers);

    } catch (error) {
      console.error("Error loading match data:", error);
      await alert("Kunde inte ladda match", "Försök igen.", { type: 'alert' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    try {
      const existingParticipation = participants.find(p => p.id === user.id);

      if (existingParticipation) {
        await alert(
          'Redan anmäld',
          'Du har redan anmält dig till denna match!',
          { type: 'info' }
        );
        return;
      }

      if (!match.is_spontaneous && participants.length >= match.max_players) {
        await alert(
          'Match fullbokad',
          'Tyvärr är denna match redan fullbokad!',
          { type: 'warning' }
        );
        return;
      }

      await base44.entities.MatchParticipant.create({
        match_id: matchId,
        user_id: user.id,
        status: 'confirmed'
      });

      if (!match.is_spontaneous) {
        await base44.entities.Match.update(matchId, {
          current_players: participants.length + 1
        });
      }

      loadMatchData();

      // Success popup
      await alert(
        'Anmäld! 🎉',
        `Du har anmält dig till "${match.title}". Vi ses där!`,
        { type: 'success' }
      );

    } catch (error) {
      console.error("Error joining match:", error);
      await alert(
        'Ett fel uppstod',
        'Kunde inte anmäla dig. Försök igen.',
        { type: 'alert' }
      );
    }
  };

  const handleLeaveMatch = async () => {
    try {
      const myParticipation = participants.find(p => p.id === user.id);

      if (!myParticipation) return;

      const shouldLeave = await confirm(
        'Lämna match',
        'Är du säker på att du vill lämna denna match?',
        {
          type: 'warning',
          confirmText: 'Ja, lämna',
          cancelText: 'Avbryt'
        }
      );

      if (!shouldLeave) return;

      await base44.entities.MatchParticipant.delete(myParticipation.participantInfo.id);

      if (!match.is_spontaneous) {
        await base44.entities.Match.update(matchId, {
          current_players: Math.max(0, participants.length - 1)
        });
      }

      loadMatchData();

      await alert(
        'Match lämnad',
        'Du har lämnat matchen',
        { type: 'info' }
      );

    } catch (error) {
      console.error("Error leaving match:", error);
      await alert(
        'Ett fel uppstod',
        'Kunde inte lämna matchen. Försök igen.',
        { type: 'alert' }
      );
    }
  };

  const handleMatchEnd = async (resultData) => {
    try {
      await base44.entities.Match.update(matchId, {
        status: 'completed',
        ...resultData,
        completed_at: new Date().toISOString()
      });

      setShowEndModal(false);
      loadMatchData();
      await alert("Match avslutad!", "Resultaten har sparats.", { type: 'success' });

    } catch (error) {
      console.error("Error ending match:", error);
      await alert("Kunde inte avsluta match", "Försök igen.", { type: 'alert' });
    }
  };

  // New function to handle adding friends
  const handleAddFriend = async (participantId) => {
    try {
      // Check if already friends or request exists
      const existing = friendships.find(f =>
        (f.requester_id === user.id && f.addressee_id === participantId) ||
        (f.requester_id === participantId && f.addressee_id === user.id)
      );

      if (existing) {
        if (existing.status === 'accepted') {
          await alert(
            'Redan vänner',
            'Ni är redan vänner!',
            { type: 'info' }
          );
        } else if (existing.status === 'pending') {
          await alert(
            'Vänförfrågan skickad',
            'Du har redan skickat en vänförfrågan!',
            { type: 'info' }
          );
        }
        return;
      }

      await base44.entities.Friendship.create({
        requester_id: user.id,
        addressee_id: participantId,
        status: 'pending'
      });

      // Success popup with celebration
      await alert(
        'Vänförfrågan skickad! 🤝',
        'Din vänförfrågan har skickats!',
        { type: 'success' }
      );

      loadMatchData();

    } catch (error) {
      console.error("Error adding friend:", error);
      await alert(
        'Ett fel uppstod',
        'Kunde inte skicka vänförfrågan. Försök igen.',
        { type: 'alert' }
      );
    }
  };

  // New function to determine friendship status
  const getFriendStatus = (participantId) => {
    if (!friendships || participantId === user.id) return null;

    const friendship = friendships.find(f =>
      (f.requester_id === user.id && f.addressee_id === participantId) ||
      (f.requester_id === participantId && f.addressee_id === user.id)
    );

    if (!friendship) return 'none';
    if (friendship.status === 'accepted') return 'friends';
    if (friendship.status === 'pending') {
      return friendship.requester_id === user.id ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#F4F7F5] text-sm font-medium">Laddar match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <DialogContainer />
        <Card className="max-w-2xl mx-auto p-12 text-center bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
          <h2 className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] mb-4">Match hittades inte</h2>
          <p className="text-[14px] leading-[20px] text-[#B6C2BC] mb-6">Matchen du söker existerar inte eller har tagits bort.</p>
          <Button
            onClick={() => navigate(createPageUrl("Matches"))}
            className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] font-semibold"
          >
            Tillbaka till Matcher
          </Button>
        </Card>
      </div>
    );
  }

  const isOrganizer = match.organizer_id === user?.id;
  const isParticipant = participants.some(p => p.id === user?.id);
  const canJoin = !isParticipant && match.status === 'upcoming' && (match.is_spontaneous || participants.length < match.max_players);
  const isCompleted = match.status === 'completed';

  const statusConfig = STATUS_CONFIG[match.status] || STATUS_CONFIG.upcoming;
  const skillConfig = match.skill_bracket ? SKILL_LEVEL_CONFIG[match.skill_bracket] : null;
  const SkillIcon = skillConfig?.icon;

  return (
    <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8 pb-24 lg:pb-8">
      <DialogContainer />

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back Button */}
        <button
          onClick={() => navigate(createPageUrl("Matches"))}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] px-4 text-[#F4F7F5] hover:bg-[#18221E] transition-all font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>

        {/* Match Header - IMPROVED SPACING */}
        <Card className="bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Status Badge - WCAG AA compliant */}
                  <Badge className={`h-8 px-4 ${statusConfig.bgColor} ${statusConfig.textColor} ring-1 ${statusConfig.ringColor} font-semibold`}>
                    {statusConfig.label}
                  </Badge>

                  {/* Skill Level Badge - WCAG AA compliant */}
                  {skillConfig && (
                    <Badge className={`h-8 px-4 ${skillConfig.bgColor} ${skillConfig.textColor} ring-1 ${skillConfig.ringColor} font-semibold flex items-center gap-1.5`}>
                      {SkillIcon && <SkillIcon className="w-4 h-4" />}
                      {skillConfig.label}
                    </Badge>
                  )}

                  {isOrganizer && (
                    <Badge className="h-8 px-4 bg-[#F4743B] text-[#FFFFFF] ring-1 ring-[#F4743B]/40 font-semibold">
                      Arrangör
                    </Badge>
                  )}
                </div>

                <h1 className="text-[28px] leading-[34px] lg:text-[32px] lg:leading-[40px] font-semibold text-[#EAF6EE] mb-6">
                  {match.title}
                </h1>

                <div className="space-y-3 text-[#CFE8D6]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[14px] leading-[20px]">{venue?.name || 'Okänd plats'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[14px] leading-[20px]">{match.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[14px] leading-[20px]">{match.time} ({match.duration_minutes || 90} min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[14px] leading-[20px]">
                      {match.is_spontaneous
                        ? `${participants.length} anmälda (spontan match)`
                        : `${participants.length}/${match.max_players} spelare`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - IMPROVED SPACING */}
              <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[220px]">
                {canJoin && (
                  <button
                    onClick={handleJoinMatch}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF] px-6 text-[#2BA84A] font-semibold hover:bg-[#EAF6EE] transition-all hover:scale-[1.02]"
                  >
                    <UserPlus className="w-5 h-5" />
                    Anmäl dig
                  </button>
                )}

                {isParticipant && match.status === 'upcoming' && (
                  <>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/10 backdrop-blur-sm px-6 text-[#FFFFFF] font-semibold border border-[#FFFFFF]/30 hover:bg-[#FFFFFF]/20 transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                      Bjud in vänner
                    </button>

                    <button
                      onClick={handleLeaveMatch}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#FFFFFF]/30 px-6 text-[#FFFFFF] font-semibold hover:bg-[#FFFFFF]/10 transition-all"
                    >
                      Lämna match
                    </button>
                  </>
                )}

                {isOrganizer && match.status === 'upcoming' && (
                  <button
                    onClick={() => setShowEndModal(true)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#F4743B] px-6 text-[#FFFFFF] font-semibold hover:bg-[#E5683A] transition-all"
                  >
                    <Trophy className="w-5 h-5" />
                    Avsluta match
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="bg-[#121715] p-1 border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] grid grid-cols-2 w-full rounded-[16px]">
            <TabsTrigger
              value="participants"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold rounded-[14px] transition-all"
            >
              <Users className="w-4 h-4" />
              Deltagare ({participants.length})
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold rounded-[14px] transition-all"
            >
              <Flag className="w-4 h-4" />
              Detaljer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            {participants.length === 0 ? (
              <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] p-12 text-center">
                <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#9FC9AC]" />
                </div>
                <h3 className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] mb-2">Inga deltagare än</h3>
                <p className="text-[14px] leading-[20px] text-[#B6C2BC]">Bli den första att anmäla dig!</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((participant) => {
                  const participantSkill = participant.skill_level ? SKILL_LEVEL_CONFIG[participant.skill_level] : null;
                  const ParticipantSkillIcon = participantSkill?.icon;
                  const friendStatus = getFriendStatus(participant.id);
                  const isCurrentUser = participant.id === user.id;

                  return (
                    <Card key={participant.id} className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] hover:scale-[1.02] hover:border-[#2BA84A]/30 transition-all">
                      <CardContent className="p-4">
                        {/* Clickable profile area */}
                        <Link
                          to={`${createPageUrl("Profile")}?userId=${participant.id}`}
                          className="block mb-3 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              {participant.profile_image_url ? (
                                <img src={participant.profile_image_url} alt={participant.full_name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <span className="text-[#FFFFFF] font-semibold text-lg">{participant.full_name?.[0] || 'U'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#F4F7F5] text-[14px] leading-[20px] truncate group-hover:text-[#2BA84A] transition-colors">{participant.full_name}</h4>
                              <p className="text-[12px] leading-[16px] text-[#B6C2BC]">{participant.city}</p>
                            </div>
                          </div>
                        </Link>

                        {participantSkill && (
                          <Badge className={`w-full justify-center py-1.5 ${participantSkill.bgColor} ${participantSkill.textColor} ring-1 ${participantSkill.ringColor} rounded-[10px] text-[12px] leading-[16px] font-semibold flex items-center gap-1.5 mb-3`}>
                            {ParticipantSkillIcon && <ParticipantSkillIcon className="w-3.5 h-3.5" />}
                            {participantSkill.label}
                          </Badge>
                        )}

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-[#0F1513] rounded-[10px] p-2 text-center">
                            <div className="text-[12px] leading-[16px] text-[#B6C2BC] mb-1">Matcher</div>
                            <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{participant.matches_played || 0}</div>
                          </div>
                          <div className="bg-[#0F1513] rounded-[10px] p-2 text-center">
                            <div className="text-[12px] leading-[16px] text-[#B6C2BC] mb-1">MVPs</div>
                            <div className="text-[16px] leading-[24px] font-semibold text-[#F4743B]">{participant.mvp_count || 0}</div>
                          </div>
                        </div>

                        {/* Add Friend Button for completed matches */}
                        {isCompleted && !isCurrentUser && (
                          <div className="pt-3 mt-3 border-t border-[#223029]">
                            {friendStatus === 'none' && (
                              <button
                                onClick={() => handleAddFriend(participant.id)}
                                className="w-full h-9 flex items-center justify-center gap-2 rounded-[10px] bg-[#2BA84A]/16 text-[#CFE8D6] text-sm font-semibold ring-1 ring-[#2BA84A]/30 hover:bg-[#2BA84A]/24 transition-all"
                              >
                                <UserPlus className="w-4 h-4" />
                                Lägg till vän
                              </button>
                            )}
                            {friendStatus === 'friends' && (
                              <div className="w-full h-9 flex items-center justify-center gap-2 rounded-[10px] bg-[#2BA84A]/10 text-[#2BA84A] text-sm font-semibold">
                                <Users className="w-4 h-4" />
                                Vänner
                              </div>
                            )}
                            {friendStatus === 'pending_sent' && (
                              <div className="w-full h-9 flex items-center justify-center gap-2 rounded-[10px] bg-[#18221E] text-[#B6C2BC] text-sm font-semibold">
                                <Clock className="w-4 h-4" />
                                Förfrågan skickad
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details">
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
              <CardHeader className="border-b border-[#223029]">
                <CardTitle className="text-[#F4F7F5] text-[18px] leading-[24px]">Matchdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Format</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{match.format}</div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Typ</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">
                      {match.is_spontaneous ? 'Spontan match' : 'Organiserad match'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Status</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{statusConfig.label}</div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Plats</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{venue?.address || 'Okänd adress'}</div>
                  </div>
                </div>

                {match.notes && (
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Anteckningar</div>
                    <p className="text-[14px] leading-[20px] text-[#F4F7F5]">{match.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showEndModal && (
        <MatchEndModal
          match={match}
          participants={participants}
          currentUser={user}
          onClose={() => setShowEndModal(false)}
          onSubmit={handleMatchEnd}
        />
      )}

      {showInviteModal && (
        <InviteFriendsModal
          match={match}
          currentUser={user}
          onClose={() => setShowInviteModal(false)}
          onInvitesSent={async () => {
            setShowInviteModal(false);
            await alert('Inbjudningar skickade!', 'Dina vänner har blivit inbjudna till matchen.', { type: 'success' });
          }}
        />
      )}
    </div>
  );
}
