import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Users, CheckCircle, Clock, XCircle, Shield } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";

export default function CupSignupModule({ cup, user, participants, userParticipant }) {
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState('');
  const [preferredPosition, setPreferredPosition] = useState('any');
  const [notes, setNotes] = useState('');

  // Fetch user's teams
  const { data: userTeams = [] } = useQuery({
    queryKey: ['userTeams', user?.id],
    queryFn: async () => {
      const memberships = await base44.entities.TeamMember.filter({
        user_id: user.id,
        status: 'active'
      });
      const teamIds = memberships.map(m => m.team_id);
      const allTeams = await base44.entities.Team.list();
      return allTeams.filter(t => teamIds.includes(t.id));
    },
    enabled: !!user && cup.signup_type === 'team',
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('cups/signupToCup', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      alert('Anmälan skickad! 🎉', 'Din anmälan har skickats till organisatören.', { type: 'success' });
    },
    onError: (error) => {
      alert('Ett fel uppstod', error.message || 'Kunde inte skicka anmälan.', { type: 'alert' });
    }
  });

  const handleSignup = async () => {
    if (cup.signup_type === 'team' && !selectedTeam) {
      alert('Välj lag', 'Välj ett lag att anmäla.', { type: 'alert' });
      return;
    }

    const shouldSignup = await confirm(
      'Bekräfta anmälan',
      cup.signup_type === 'team' 
        ? `Vill du anmäla laget till ${cup.name}?`
        : `Vill du anmäla dig som spelare till ${cup.name}?`,
      { type: 'confirm', confirmText: 'Anmäl', cancelText: 'Avbryt' }
    );

    if (!shouldSignup) return;

    const data = {
      cup_id: cup.id,
      signup_type: cup.signup_type,
      ...(cup.signup_type === 'team' ? { team_id: selectedTeam } : { preferred_position: preferredPosition }),
      notes
    };

    signupMutation.mutate(data);
  };

  const isRegistrationOpen = cup.status === 'registration_open' || cup.status === 'upcoming';
  const isFull = cup.current_participants >= cup.max_participants;

  return (
    <>
      <DialogContainer />
      
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardContent className="p-6 space-y-6">
          
          {/* Status */}
          {userParticipant ? (
            <div className="p-4 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-[#2BA84A]" />
                <div>
                  <h3 className="text-lg font-bold text-[#F4F7F5]">Du är anmäld!</h3>
                  <p className="text-sm text-[#B6C2BC]">
                    Status: {userParticipant.status === 'confirmed' ? 'Bekräftad' : 
                            userParticipant.status === 'pending' ? 'Väntar på godkännande' : 
                            'Avböjd'}
                  </p>
                </div>
              </div>
              
              {userParticipant.status === 'confirmed' && userParticipant.group_id && (
                <Badge className="bg-[#F4743B]/20 text-[#F4743B] border-[#F4743B]/30">
                  Tilldelad grupp
                </Badge>
              )}
            </div>
          ) : (
            <>
              {/* Registration Status */}
              {!isRegistrationOpen && (
                <div className="p-4 bg-[#7B8A83]/10 border border-[#7B8A83]/30 rounded-xl text-center">
                  <XCircle className="w-12 h-12 text-[#7B8A83] mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-[#F4F7F5] mb-1">Anmälan stängd</h3>
                  <p className="text-sm text-[#B6C2BC]">Anmälan till denna turnering är inte längre öppen.</p>
                </div>
              )}

              {isRegistrationOpen && isFull && (
                <div className="p-4 bg-[#F4743B]/10 border border-[#F4743B]/30 rounded-xl text-center">
                  <Clock className="w-12 h-12 text-[#F4743B] mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-[#F4F7F5] mb-1">Fullt</h3>
                  <p className="text-sm text-[#B6C2BC]">Turneringen har nått max antal deltagare.</p>
                </div>
              )}

              {isRegistrationOpen && !isFull && (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Anmäl dig nu!</h3>
                    <p className="text-sm text-[#B6C2BC]">
                      {cup.signup_type === 'team' ? 'Välj ett av dina lag att anmäla' : 'Anmäl dig som spelare'}
                    </p>
                  </div>

                  {/* Team Signup */}
                  {cup.signup_type === 'team' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#F4F7F5] flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#F4743B]" />
                          Välj lag *
                        </label>
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                          <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                            <SelectValue placeholder="Välj ett lag" />
                          </SelectTrigger>
                          <SelectContent>
                            {userTeams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {userTeams.length === 0 && (
                          <p className="text-xs text-[#B6C2BC]">Du har inga lag. Skapa ett lag först!</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Solo Signup */}
                  {cup.signup_type === 'solo' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#F4F7F5] flex items-center gap-2">
                          <Shield className="w-4 h-4 text-[#F4743B]" />
                          Föredragen position
                        </label>
                        <Select value={preferredPosition} onValueChange={setPreferredPosition}>
                          <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="goalkeeper">Målvakt</SelectItem>
                            <SelectItem value="defender">Försvarare</SelectItem>
                            <SelectItem value="midfielder">Mittfältare</SelectItem>
                            <SelectItem value="forward">Anfallare</SelectItem>
                            <SelectItem value="any">Vilken som helst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#F4F7F5]">Anteckningar (valfritt)</label>
                    <Textarea
                      placeholder="Eventuella anteckningar till organisatören..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-20"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSignup}
                    disabled={signupMutation.isPending || (cup.signup_type === 'team' && !selectedTeam)}
                    className="w-full bg-[#F4743B] hover:bg-[#E5683A] text-white gap-2 h-12"
                  >
                    <UserPlus className="w-5 h-5" />
                    {signupMutation.isPending ? 'Anmäler...' : 'Anmäl'}
                  </Button>

                  {cup.entry_fee > 0 && (
                    <p className="text-xs text-center text-[#B6C2BC]">
                      Anmälningsavgift: {cup.entry_fee} kr (betalas senare)
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {/* Participants List */}
          <div className="pt-6 border-t border-[#223029]">
            <h4 className="text-sm font-semibold text-[#F4F7F5] mb-3">
              Anmälda deltagare ({participants.length}/{cup.max_participants})
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {participants.slice(0, 10).map((p, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F4743B]/20 rounded-lg flex items-center justify-center">
                      {cup.signup_type === 'team' ? (
                        <Users className="w-4 h-4 text-[#F4743B]" />
                      ) : (
                        <UserPlus className="w-4 h-4 text-[#F4743B]" />
                      )}
                    </div>
                    <span className="text-sm text-[#F4F7F5]">
                      {p.team?.name || p.user?.full_name || 'Deltagare'}
                    </span>
                  </div>
                  <Badge className={`text-xs ${
                    p.status === 'confirmed' 
                      ? 'bg-[#2BA84A]/20 text-[#2BA84A] border-[#2BA84A]/30'
                      : 'bg-[#F4743B]/20 text-[#F4743B] border-[#F4743B]/30'
                  }`}>
                    {p.status === 'confirmed' ? 'Bekräftad' : 'Väntar'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}