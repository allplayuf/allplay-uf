import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Users, CheckCircle, Clock, XCircle, Target, MapPin, Plus, Sparkles } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../dashboard/CupsWidget";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils/helpers";
import CreateCupTeamForm from "./CreateCupTeamForm";
import { AnimatePresence } from "framer-motion";

export default function CupSignupModule({ cup, user, participants, userParticipant }) {
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState('');
  const [preferredPosition, setPreferredPosition] = useState('any');
  const [notes, setNotes] = useState('');
  const [showCreateCupTeam, setShowCreateCupTeam] = useState(false);

  const { data: userTeams = [] } = useQuery({
    queryKey: ['userTeams', user?.id],
    queryFn: async () => {
      const memberships = await base44.entities.TeamMember.filter({
        user_id: user.id,
        status: 'active'
      });
      const teamIds = memberships.map(m => m.team_id);
      const allTeams = await base44.entities.Team.list();
      return allTeams.filter(t => teamIds.includes(t.id) && t.is_active !== false);
    },
    enabled: !!user && cup.signup_type === 'team',
  });

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('cups/signupToCup', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      alert('Anmälan skickad! 🎉', 'Din anmälan har skickats till organisatören.', { type: 'success' });
    },
    onError: (error) => {
      alert('Ett fel uppstod', error.response?.data?.error || error.message || 'Kunde inte skicka anmälan.', { type: 'alert' });
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
      
      <AnimatePresence>
        {showCreateCupTeam && (
          <CreateCupTeamForm
            cup={cup}
            onClose={() => setShowCreateCupTeam(false)}
            onSuccess={(team) => {
              setShowCreateCupTeam(false);
              setSelectedTeam(team.id);
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="space-y-6">
        
        {/* Signup Form Card */}
        <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <CardContent className="p-6 space-y-6">
            
            {userParticipant ? (
              <div className="p-5 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#2BA84A] flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-[#F4F7F5] mb-1">Du är anmäld!</h3>
                    <p className="text-sm text-[#B6C2BC]">
                      Status: {userParticipant.status === 'confirmed' ? '✓ Bekräftad' : 
                              userParticipant.status === 'pending' ? '⏳ Väntar på godkännande' : 
                              '❌ Avböjd'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {!isRegistrationOpen && (
                  <div className="p-6 bg-[#18221E] border border-[#223029] rounded-xl text-center">
                    <XCircle className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-[#F4F7F5] mb-1">Anmälan stängd</h3>
                    <p className="text-sm text-[#B6C2BC]">Anmälan till denna turnering är inte längre öppen.</p>
                  </div>
                )}

                {isRegistrationOpen && isFull && (
                  <div className="p-6 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-center">
                    <Clock className="w-12 h-12 text-[#FCD34D] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-[#F4F7F5] mb-1">Fullt</h3>
                    <p className="text-sm text-[#B6C2BC]">Turneringen har nått max antal deltagare.</p>
                  </div>
                )}

                {isRegistrationOpen && !isFull && (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Anmäl dig nu!</h3>
                      <p className="text-sm text-[#B6C2BC]">
                        {cup.signup_type === 'team' ? 'Välj ett av dina lag eller skapa ett nytt cup-lag' : 'Anmäl dig som spelare'}
                      </p>
                    </div>

                    {/* Team Signup */}
                    {cup.signup_type === 'team' && (
                      <div className="space-y-4">
                        
                        {/* Option 1: Create Cup Team (Primary) */}
                        <Button
                          type="button"
                          onClick={() => setShowCreateCupTeam(true)}
                          className="w-full h-20 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white font-bold text-lg rounded-2xl shadow-xl gap-3 transition-all hover:scale-[1.02] border-2 border-[#FCD34D]/30"
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                <span>Skapa nytt cup-lag</span>
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-normal text-[#FDE3D2] mt-1">Det enklaste sättet att delta!</span>
                          </div>
                        </Button>

                        {/* Divider */}
                        {userTeams.length > 0 && (
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-[#223029]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-[#121715] text-[#7B8A83] font-medium">eller</span>
                            </div>
                          </div>
                        )}

                        {/* Option 2: Use Existing Team */}
                        {userTeams.length > 0 && (
                          <div className="space-y-3">
                            <label className="text-sm font-semibold text-[#B6C2BC] text-center block">
                              Använd ett befintligt lag
                            </label>
                            
                            <div className="grid gap-2 max-h-[240px] overflow-y-auto">
                              {userTeams.map(team => (
                                <button
                                  key={team.id}
                                  type="button"
                                  onClick={() => setSelectedTeam(team.id)}
                                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                    selectedTeam === team.id
                                      ? 'bg-[#F59E0B]/15 border-[#F59E0B] ring-2 ring-[#F59E0B]/30'
                                      : 'bg-[#18221E] border-[#223029] hover:border-[#F59E0B]/50'
                                  }`}
                                >
                                  {team.logo_url ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: `${team.teamColor}30` }}
                                    >
                                      <Users className="w-6 h-6" style={{ color: team.teamColor }} />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#F4F7F5] truncate">{team.name}</p>
                                    <p className="text-xs text-[#B6C2BC] flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {team.city}
                                    </p>
                                  </div>
                                  {selectedTeam === team.id && (
                                    <CheckCircle className="w-6 h-6 text-[#F59E0B] flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Help Text */}
                        <div className="p-4 bg-[#4169E1]/8 border border-[#4169E1]/20 rounded-xl">
                          <p className="text-xs text-[#B6C2BC] text-center leading-relaxed">
                            💡 Ett <strong className="text-[#F4F7F5]">cup-lag</strong> är perfekt om du inte har ett permanent lag. Du blir kapten och kan bjuda in vänner!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Solo Signup */}
                    {cup.signup_type === 'solo' && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#F4F7F5] flex items-center gap-2">
                          <Target className="w-4 h-4 text-[#F59E0B]" />
                          Föredragen position
                        </label>
                        <Select value={preferredPosition} onValueChange={setPreferredPosition}>
                          <SelectTrigger className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121715] border-[#223029]">
                            <SelectItem value="goalkeeper">Målvakt</SelectItem>
                            <SelectItem value="defender">Försvarare</SelectItem>
                            <SelectItem value="midfielder">Mittfältare</SelectItem>
                            <SelectItem value="forward">Anfallare</SelectItem>
                            <SelectItem value="any">Vilken som helst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#F4F7F5]">Anteckningar (valfritt)</label>
                      <Textarea
                        placeholder="Eventuella anteckningar till organisatören..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-20 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSignup}
                      disabled={signupMutation.isPending || (cup.signup_type === 'team' && !selectedTeam)}
                      className="w-full h-14 text-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#FFFFFF] gap-2 font-bold shadow-lg transform hover:scale-[1.02] transition-all"
                    >
                      <UserPlus className="w-6 h-6" />
                      {signupMutation.isPending ? 'Registrerar...' : 'Slutför anmälan'}
                    </Button>

                    {cup.entry_fee > 0 && (
                      <p className="text-xs text-center text-[#B6C2BC]">
                        Anmälningsavgift: <span className="font-semibold text-[#F4F7F5]">{cup.entry_fee} kr</span> (betalas senare)
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-[#F4F7F5]">
                Anmälda {cup.signup_type === 'team' ? 'Lag' : 'Spelare'}
              </h4>
              <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 font-semibold h-7 px-3">
                {participants.length}/{cup.max_participants}
              </Badge>
            </div>
            
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                <p className="text-sm text-[#B6C2BC]">Inga anmälningar än</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {participants.map((p, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {cup.signup_type === 'team' && p.team ? (
                        <>
                          {p.team.logo_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={p.team.logo_url} alt={p.team.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <Link to={`${createPageUrl("TeamOverview")}?id=${p.team.id}`} className="hover:underline">
                              <p className="text-sm font-semibold text-[#F4F7F5] truncate">{p.team.name}</p>
                              <p className="text-xs text-[#B6C2BC] flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {p.team.city}
                              </p>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                              {p.user?.full_name?.[0] || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#F4F7F5] truncate">{p.user?.full_name || 'Spelare'}</p>
                            {p.preferred_position && p.preferred_position !== 'any' && (
                              <p className="text-xs text-[#B6C2BC] capitalize flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {p.preferred_position === 'goalkeeper' ? 'Målvakt' :
                                 p.preferred_position === 'defender' ? 'Försvarare' :
                                 p.preferred_position === 'midfielder' ? 'Mittfältare' :
                                 p.preferred_position === 'forward' ? 'Anfallare' : p.preferred_position}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <Badge className={`text-xs flex-shrink-0 h-6 px-2 border-0 ${
                      p.status === 'confirmed' 
                        ? 'bg-[#2BA84A]/20 text-[#2BA84A]'
                        : p.status === 'pending'
                        ? 'bg-[#F59E0B]/20 text-[#FCD34D]'
                        : 'bg-[#DC2626]/20 text-[#FCA5A5]'
                    }`}>
                      {p.status === 'confirmed' ? '✓' : 
                       p.status === 'pending' ? '⏳' : '❌'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}