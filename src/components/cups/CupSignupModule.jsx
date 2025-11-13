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
import { createPageUrl } from "@/utils";
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
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');

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
        <Card className="bg-[#1F2937] border-[#374151] rounded-2xl">
          <CardContent className="p-6 space-y-6">
            
            {userParticipant ? (
              <div className="p-5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#10B981] flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">Du är anmäld!</h3>
                    <p className="text-sm text-[#9CA3AF]">
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
                  <div className="p-6 bg-[#374151] rounded-xl text-center">
                    <XCircle className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">Anmälan stängd</h3>
                    <p className="text-sm text-[#9CA3AF]">Anmälan till denna turnering är inte längre öppen.</p>
                  </div>
                )}

                {isRegistrationOpen && isFull && (
                  <div className="p-6 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-center">
                    <Clock className="w-12 h-12 text-[#F59E0B] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">Fullt</h3>
                    <p className="text-sm text-[#9CA3AF]">Turneringen har nått max antal deltagare.</p>
                  </div>
                )}

                {isRegistrationOpen && !isFull && (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">Anmäl dig nu!</h3>
                      <p className="text-sm text-[#9CA3AF]">
                        {cup.signup_type === 'team' ? 'Välj ett av dina lag eller skapa ett nytt cup-lag' : 'Anmäl dig som spelare'}
                      </p>
                    </div>

                    {/* Team Signup */}
                    {cup.signup_type === 'team' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#FF7A3D]" />
                            Välj lag *
                          </label>
                          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                            <SelectTrigger className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30">
                              <SelectValue placeholder="Välj ett lag" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1F2937] border-[#374151]">
                              {userTeams.map(team => (
                                <SelectItem key={team.id} value={team.id} className="text-[#FFFFFF]">
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Create Cup Team Button */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateCupTeam(true)}
                          className="w-full h-12 border-[#FF7A3D]/50 text-[#FF7A3D] hover:bg-[#FF7A3D]/10 gap-2 font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          <Sparkles className="w-4 h-4" />
                          Skapa nytt cup-lag
                        </Button>

                        {userTeams.length === 0 && (
                          <div className="p-4 bg-[#4169E1]/10 border border-[#4169E1]/30 rounded-xl">
                            <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
                              💡 Inget lag? Skapa ett cup-lag ovan eller gå till{' '}
                              <Link to={createPageUrl("Community") + "?tab=teams"} className="text-[#4169E1] hover:underline font-semibold">
                                Community
                              </Link>
                              {' '}för att skapa ett permanent lag!
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Solo Signup */}
                    {cup.signup_type === 'solo' && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
                          <Target className="w-4 h-4 text-[#FF7A3D]" />
                          Föredragen position
                        </label>
                        <Select value={preferredPosition} onValueChange={setPreferredPosition}>
                          <SelectTrigger className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1F2937] border-[#374151]">
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
                      <label className="text-sm font-semibold text-[#FFFFFF]">Anteckningar (valfritt)</label>
                      <Textarea
                        placeholder="Eventuella anteckningar till organisatören..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-20 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSignup}
                      disabled={signupMutation.isPending || (cup.signup_type === 'team' && !selectedTeam)}
                      className="w-full h-12 bg-[#FF7A3D] hover:bg-[#F97316] text-[#FFFFFF] gap-2 font-semibold shadow-lg"
                    >
                      <UserPlus className="w-5 h-5" />
                      {signupMutation.isPending ? 'Anmäler...' : 'Anmäl'}
                    </Button>

                    {cup.entry_fee > 0 && (
                      <p className="text-xs text-center text-[#9CA3AF]">
                        Anmälningsavgift: <span className="font-semibold text-[#FFFFFF]">{cup.entry_fee} kr</span> (betalas senare)
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card className="bg-[#1F2937] border-[#374151] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-[#FFFFFF]">
                Anmälda {cup.signup_type === 'team' ? 'Lag' : 'Spelare'}
              </h4>
              <Badge className="bg-[#FF7A3D]/20 text-[#FF7A3D] border-0 font-semibold h-7 px-3">
                {participants.length}/{cup.max_participants}
              </Badge>
            </div>
            
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-[#4B5563] mx-auto mb-3" />
                <p className="text-sm text-[#9CA3AF]">Inga anmälningar än</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {participants.map((p, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#0E0F10] rounded-xl border border-[#374151]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {cup.signup_type === 'team' && p.team ? (
                        <>
                          {p.team.logo_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={p.team.logo_url} alt={p.team.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-[#FF7A3D]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-[#FF7A3D]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <Link to={`${createPageUrl("TeamOverview")}?id=${p.team.id}`} className="hover:underline">
                              <p className="text-sm font-semibold text-[#FFFFFF] truncate">{p.team.name}</p>
                              <p className="text-xs text-[#9CA3AF] flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {p.team.city}
                              </p>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-gradient-to-br from-[#FF7A3D] to-[#F97316] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                              {p.user?.full_name?.[0] || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#FFFFFF] truncate">{p.user?.full_name || 'Spelare'}</p>
                            {p.preferred_position && p.preferred_position !== 'any' && (
                              <p className="text-xs text-[#9CA3AF] capitalize flex items-center gap-1">
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
                        ? 'bg-[#10B981]/20 text-[#10B981]'
                        : p.status === 'pending'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        : 'bg-[#EF4444]/20 text-[#EF4444]'
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