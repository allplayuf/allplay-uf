import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Users, CheckCircle, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";

export default function CupSignupModule({ cup, user, participants, userParticipant }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [preferredPosition, setPreferredPosition] = useState('any');
  const [notes, setNotes] = useState('');
  const { alert, confirm, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('cups/signupToCup', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      setSelectedTeamId('');
      setNotes('');
      alert('Anmäld! 🎉', 'Du har anmält dig till turneringen!', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel vid anmälan', error.message || 'Kunde inte anmäla dig. Försök igen.', { type: 'alert' });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (participantId) => {
      await base44.entities.CupParticipant.update(participantId, { status: 'withdrawn' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      alert('Avanmäld', 'Du har avanmält dig från turneringen.', { type: 'info' });
    }
  });

  const handleSignup = async () => {
    if (!user) {
      alert('Logga in', 'Du måste vara inloggad för att anmäla dig.', { type: 'info' });
      return;
    }

    if (cup.signup_type === 'team' && !selectedTeamId) {
      alert('Välj lag', 'Du måste välja ett lag att anmäla.', { type: 'alert' });
      return;
    }

    const shouldSignup = await confirm(
      'Bekräfta anmälan',
      `Vill du anmäla ${cup.signup_type === 'team' ? 'ditt lag' : 'dig'} till ${cup.name}?`,
      { type: 'confirm', confirmText: 'Ja, anmäl', cancelText: 'Avbryt' }
    );

    if (!shouldSignup) return;

    signupMutation.mutate({
      cup_id: cup.id,
      signup_type: cup.signup_type,
      team_id: cup.signup_type === 'team' ? selectedTeamId : null,
      preferred_position: cup.signup_type === 'solo' ? preferredPosition : null,
      notes
    });
  };

  const handleWithdraw = async () => {
    const shouldWithdraw = await confirm(
      'Avanmäl dig',
      'Är du säker på att du vill avanmäla dig från turneringen?',
      { type: 'warning', confirmText: 'Ja, avanmäl', cancelText: 'Avbryt' }
    );

    if (!shouldWithdraw) return;
    withdrawMutation.mutate(userParticipant.id);
  };

  // Check if registration is open
  const isRegistrationOpen = cup.status === 'registration_open';
  const isRegistrationClosed = cup.status === 'registration_closed';
  const isFull = cup.current_participants >= cup.max_participants;

  // Get user's teams
  const [userTeams, setUserTeams] = React.useState([]);
  React.useEffect(() => {
    if (user && cup.signup_type === 'team') {
      base44.entities.TeamMember.filter({ user_id: user.id, status: 'active' })
        .then(async memberships => {
          const teamIds = memberships.map(m => m.team_id);
          const allTeams = await base44.entities.Team.list();
          const teams = allTeams.filter(t => teamIds.includes(t.id));
          // Filter to only teams where user is captain or vice captain
          const leaderTeams = teams.filter(t => 
            t.captain_id === user.id || t.vice_captain_ids?.includes(user.id)
          );
          setUserTeams(leaderTeams);
        });
    }
  }, [user, cup.signup_type]);

  return (
    <>
      <DialogContainer />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-6">
          <h2 className="text-xl font-bold text-[#F4F7F5] mb-6 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#2BA84A]" />
            Anmälan
          </h2>

          {/* Already signed up */}
          {userParticipant && userParticipant.status !== 'withdrawn' && (
            <div className="mb-6 p-6 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#2BA84A]" />
                  <div>
                    <p className="font-bold text-[#F4F7F5] text-lg">Du är anmäld!</p>
                    <p className="text-sm text-[#B6C2BC]">
                      Status: {userParticipant.status === 'confirmed' ? 'Bekräftad' : 
                               userParticipant.status === 'pending' ? 'Väntar på bekräftelse' : 
                               'På väntelista'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                >
                  <X className="w-4 h-4" />
                  Avanmäl
                </Button>
              </div>

              {userParticipant.notes && (
                <div className="mt-3 p-3 bg-[#0F1513] rounded-lg">
                  <p className="text-xs text-[#B6C2BC] mb-1">Dina anteckningar:</p>
                  <p className="text-sm text-[#F4F7F5]">{userParticipant.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Registration closed */}
          {!isRegistrationOpen && !userParticipant && (
            <div className="p-6 bg-[#18221E] border border-[#223029] rounded-xl text-center">
              <Clock className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
              <p className="font-bold text-[#F4F7F5] mb-1">
                {isRegistrationClosed ? 'Anmälan stängd' : 'Anmälan inte öppen än'}
              </p>
              <p className="text-sm text-[#B6C2BC]">
                Anmälan är för närvarande inte möjlig
              </p>
            </div>
          )}

          {/* Registration full */}
          {isRegistrationOpen && isFull && !userParticipant && (
            <div className="p-6 bg-[#18221E] border border-[#223029] rounded-xl text-center">
              <Users className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
              <p className="font-bold text-[#F4F7F5] mb-1">Turneringen är fullbokad</p>
              <p className="text-sm text-[#B6C2BC]">
                Alla platser är tyvärr upptagna
              </p>
            </div>
          )}

          {/* Signup form */}
          {isRegistrationOpen && !isFull && !userParticipant && (
            <div className="space-y-4">
              {cup.signup_type === 'team' && (
                <div>
                  <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">
                    Välj lag *
                  </label>
                  {userTeams.length === 0 ? (
                    <p className="text-sm text-[#B6C2BC] p-4 bg-[#18221E] rounded-xl">
                      Du måste vara lagkapten eller vice kapten för att anmäla ett lag.
                    </p>
                  ) : (
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                        <SelectValue placeholder="Välj ett lag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {cup.signup_type === 'solo' && (
                <div>
                  <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">
                    Föredragen position
                  </label>
                  <Select value={preferredPosition} onValueChange={setPreferredPosition}>
                    <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Vilken som</SelectItem>
                      <SelectItem value="goalkeeper">Målvakt</SelectItem>
                      <SelectItem value="defender">Försvarare</SelectItem>
                      <SelectItem value="midfielder">Mittfältare</SelectItem>
                      <SelectItem value="forward">Anfallare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">
                  Anteckningar (valfritt)
                </label>
                <Textarea
                  placeholder="Lägg till eventuella anteckningar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] min-h-[100px]"
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#2BA84A] text-white font-bold py-6"
                onClick={handleSignup}
                disabled={signupMutation.isPending || (cup.signup_type === 'team' && userTeams.length === 0)}
              >
                {signupMutation.isPending ? 'Anmäler...' : 'Anmäl dig nu'}
              </Button>
            </div>
          )}

          {/* Participants list */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">
              Anmälda ({participants.filter(p => p.status === 'confirmed').length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {participants
                .filter(p => p.status === 'confirmed')
                .map(p => (
                  <div 
                    key={p.id}
                    className="flex items-center gap-3 p-3 bg-[#18221E] rounded-xl"
                  >
                    {p.team ? (
                      <>
                        <Users className="w-5 h-5 text-[#2BA84A]" />
                        <span className="font-semibold text-[#F4F7F5]">{p.team.name}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 text-[#9FC9AC]" />
                        <span className="font-semibold text-[#F4F7F5]">{p.user?.full_name}</span>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}