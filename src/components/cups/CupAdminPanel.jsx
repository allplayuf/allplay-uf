import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Grid, Swords, Settings, Save, Calendar, Wand2, Trash2, Trophy, Sparkles, TrendingUp, Target, AlertCircle } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function CupAdminPanel({ cup, participants, groups, matches }) {
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [editingGroup, setEditingGroup] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  // --- Manual Team State ---
  const [newTeamName, setNewTeamName] = useState("");

  // --- Group Management State ---
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  // --- Match Creation State ---
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchTeamA, setMatchTeamA] = useState("");
  const [matchTeamB, setMatchTeamB] = useState("");
  const [matchGroup, setMatchGroup] = useState("");
  const [matchVenue, setMatchVenue] = useState("");

  // --- Settings State ---
  const [settingsForm, setSettingsForm] = useState({
    name: cup.name || "",
    description: cup.description || "",
    location: cup.location || "",
    start_date: cup.start_date || "",
    end_date: cup.end_date || "",
    status: cup.status || "upcoming",
    max_participants: cup.max_participants || 16,
    is_public: cup.is_public ?? true,
    rules: cup.rules || "",
    prize: cup.prize || ""
  });

  // --- Mutations ---

  const updateCupMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('cups/updateCup', {
        cup_id: cup.id,
        updates: data
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      queryClient.invalidateQueries(['cups']);
      alert('Sparat! ✅', 'Inställningarna har uppdaterats.', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.message || 'Kunde inte spara inställningar.', { type: 'alert' });
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      // Use AI generation function
      const res = await base44.functions.invoke('cups/generateAiSchedule', {
        cup_id: cup.id
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('AI-schema skapat! 🤖', `Skapade ${data.groups_created} grupper och ${data.matches_created} matcher.`, { type: 'success' });
    },
    onError: (error) => {
      alert('Fel vid schemaläggning', error.response?.data?.details || error.message || 'Kunde inte skapa schema.', { type: 'alert' });
    }
  });

  const createManualTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('cups/createManualTeam', {
        cup_id: cup.id,
        team_name: newTeamName,
        city: cup.location
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      setNewTeamName("");
      alert('Lag skapat', 'Laget har lagts till manuellt.', { type: 'success' });
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('cups/manageGroups', {
        action: 'create_group',
        cup_id: cup.id,
        group_name: newGroupName
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      setNewGroupName("");
      alert('Grupp skapad', 'Gruppen har skapats.', { type: 'success' });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      const res = await base44.functions.invoke('cups/manageGroups', {
        action: 'delete_group',
        cup_id: cup.id,
        group_id: groupId
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('Grupp borttagen', 'Gruppen har raderats.', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', 'Kunde inte ta bort gruppen.', { type: 'alert' });
    }
  });

  const handleDeleteGroup = async (groupId, groupName) => {
    const confirmed = await confirm(
      'Ta bort grupp?',
      `Är du säker på att du vill ta bort ${groupName}? Lag i gruppen kommer att bli grupplösa.`,
      { type: 'destructive', confirmText: 'Ta bort', cancelText: 'Avbryt' }
    );
    if (confirmed) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const assignTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('cups/manageGroups', {
        action: 'assign_team',
        cup_id: cup.id,
        group_id: selectedGroup,
        team_id: selectedTeam
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('Lag tilldelat', 'Laget har placerats i gruppen.', { type: 'success' });
    }
  });

  const removeTeamFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, teamId }) => {
      const res = await base44.functions.invoke('cups/manageGroups', {
        action: 'remove_team',
        cup_id: cup.id,
        group_id: groupId,
        team_id: teamId
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('Lag borttaget', 'Laget har tagits bort från gruppen.', { type: 'success' });
    }
  });

  const createMatchMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('cups/createManualMatch', {
        cup_id: cup.id,
        team_a_id: matchTeamA,
        team_b_id: matchTeamB,
        date: matchDate,
        time: matchTime,
        group_id: matchGroup,
        venue_id: matchVenue || (cup.venue_ids?.[0])
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('Match skapad', 'Matchen har lagts till i schemat.', { type: 'success' });
    }
  });

  const deleteCupMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cups/deleteCup', { cup_id: cup.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cups']);
      alert('Turnering borttagen', 'Turneringen har raderats.', { type: 'success' });
      navigate(createPageUrl("Community") + "?tab=cups");
    }
  });

  const advanceToPlayoffsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cups/advanceToPlayoffs', { cup_id: cup.id });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('Slutspel skapat! 🏆', `${data.teams_advanced} lag har gått vidare till ${data.stage}.`, { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.response?.data?.error || 'Kunde inte skapa slutspel.', { type: 'alert' });
    }
  });

  const advanceToNextRoundMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cups/advanceToNextRound', { cup_id: cup.id });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('Nästa omgång skapad! 🎉', `${data.winners_advanced} lag går vidare till ${data.next_stage}.`, { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.response?.data?.details || error.response?.data?.error || 'Kunde inte skapa nästa omgång.', { type: 'alert' });
    }
  });

  // --- Handlers ---

  const handleSaveSettings = () => {
    updateCupMutation.mutate(settingsForm);
  };

  const handleGenerateSchedule = async () => {
    const confirmed = await confirm(
      'AI-Generera spelschema? 🤖',
      'AI kommer att analysera antal lag och datum för att skapa ett optimalt upplägg. Detta kan ta några sekunder.',
      { type: 'confirm', confirmText: 'Starta AI', cancelText: 'Avbryt' }
    );
    if (confirmed) {
      createScheduleMutation.mutate();
    }
  };

  const handleDeleteCup = async () => {
    const confirmed = await confirm(
        'Ta bort turnering?',
        'Är du säker på att du vill ta bort denna turnering permanent? Detta går inte att ångra.',
        { type: 'destructive', confirmText: 'Ta bort', cancelText: 'Avbryt' }
    );
    if (confirmed) {
        deleteCupMutation.mutate();
    }
  };

  const handleAdvanceToPlayoffs = async () => {
    const confirmed = await confirm(
      'Avsluta gruppspel? 🏆',
      'Top-lagen från varje grupp kommer att gå vidare till slutspel. Kontrollera att alla matcher är spelade.',
      { type: 'confirm', confirmText: 'Starta slutspel', cancelText: 'Avbryt' }
    );
    if (confirmed) {
      advanceToPlayoffsMutation.mutate();
    }
  };

  const handleAdvanceToNextRound = async () => {
    const confirmed = await confirm(
      'Gå vidare till nästa omgång? 🏆',
      'Vinnarna från aktuell omgång kommer att matchas i nästa slutspelsmatch. Kontrollera att alla matcher är spelade och resultat är korrekt.',
      { type: 'confirm', confirmText: 'Skapa nästa omgång', cancelText: 'Avbryt' }
    );
    if (confirmed) {
      advanceToNextRoundMutation.mutate();
    }
  };

  const handleRemoveTeamFromGroup = async (groupId, teamId, teamName) => {
    const confirmed = await confirm(
      'Ta bort lag från grupp?',
      `Vill du ta bort ${teamName} från gruppen?`,
      { type: 'warning', confirmText: 'Ta bort', cancelText: 'Avbryt' }
    );
    if (confirmed) {
      removeTeamFromGroupMutation.mutate({ groupId, teamId });
    }
  };

  const handleGetAiInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await base44.functions.invoke('cups/getAiInsights', { cup_id: cup.id });
      setAiInsights(response.data.insights);
      setActiveTab('ai');
    } catch (error) {
      console.error('Error getting AI insights:', error);
      alert('Fel', 'Kunde inte hämta AI-insikter. Försök igen.', { type: 'alert' });
    } finally {
      setLoadingInsights(false);
    }
  };

  // Filter confirmed teams for selection
  const confirmedTeams = participants
    .filter(p => p.status === 'confirmed' || p.status === 'active')
    .map(p => ({ id: p.team_id, name: p.team?.name || 'Unknown Team' }));

  return (
    <div className="space-y-6">
      <DialogContainer />

      <Card className="bg-[#121715] border-[#223029] rounded-2xl p-1 shadow-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Översikt</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-[#9333EA]/20 data-[state=active]:text-[#C084FC] text-[10px] sm:text-sm">AI 🤖</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Inställningar</TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Lag</TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Grupper</TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Matcher</TabsTrigger>
          </TabsList>

          <div className="p-4 sm:p-6">
            
            {/* AI INSIGHTS TAB */}
            <TabsContent value="ai" className="space-y-6">
              {loadingInsights ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#B6C2BC] font-medium">AI analyserar turneringen...</p>
                </div>
              ) : !aiInsights ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-[#9333EA] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">AI-Strategi Assistent</h3>
                  <p className="text-[#B6C2BC] mb-6">Få intelligenta rekommendationer för att optimera din turnering</p>
                  <button 
                    onClick={handleGetAiInsights}
                    className="bg-gradient-to-r from-[#9333EA] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                  >
                    Analysera Turnering
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group Optimization */}
                  <Card className="bg-gradient-to-br from-[#2BA84A]/10 to-[#248232]/5 border-[#2BA84A]/30 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-[#2BA84A]" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Gruppoptimering</h3>
                    </div>
                    <div className="bg-[#0F1513] rounded-lg p-4 mb-3">
                      <div className="grid sm:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-[#7B8A83] mb-1">Rekommenderade Grupper</div>
                          <div className="text-2xl font-bold text-[#2BA84A]">{aiInsights.group_optimization?.recommended_groups}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#7B8A83] mb-1">Lag per Grupp</div>
                          <div className="text-2xl font-bold text-[#2BA84A]">{aiInsights.group_optimization?.teams_per_group}</div>
                        </div>
                      </div>
                      <p className="text-sm text-[#B6C2BC]">{aiInsights.group_optimization?.reasoning}</p>
                    </div>
                  </Card>

                  {/* Playoff Recommendations */}
                  <Card className="bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/5 border-[#F59E0B]/30 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[#F59E0B]" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Slutspelsstrategi</h3>
                    </div>
                    <div className="bg-[#0F1513] rounded-lg p-4 mb-3">
                      <div className="mb-3">
                        <div className="text-xs text-[#7B8A83] mb-2">Seedning-strategi</div>
                        <p className="text-sm text-[#B6C2BC]">{aiInsights.playoff_recommendations?.seeding_strategy}</p>
                      </div>
                      {aiInsights.playoff_recommendations?.key_matchups?.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-[#7B8A83] mb-2">Nyckel-matcher</div>
                          <ul className="space-y-1">
                            {aiInsights.playoff_recommendations.key_matchups.map((matchup, idx) => (
                              <li key={idx} className="text-sm text-[#F4F7F5] flex items-start gap-2">
                                <span className="text-[#F59E0B]">•</span>
                                {matchup}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-sm text-[#B6C2BC]">{aiInsights.playoff_recommendations?.notes}</p>
                    </div>
                  </Card>

                  {/* Schedule Analysis */}
                  <Card className="bg-gradient-to-br from-[#EF4444]/10 to-[#DC2626]/5 border-[#EF4444]/30 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Schema-analys</h3>
                    </div>
                    <div className="bg-[#0F1513] rounded-lg p-4 space-y-3">
                      {aiInsights.schedule_analysis?.bottlenecks?.length > 0 && (
                        <div>
                          <div className="text-xs text-[#7B8A83] mb-2">Flaskhalsar</div>
                          <ul className="space-y-1">
                            {aiInsights.schedule_analysis.bottlenecks.map((bottleneck, idx) => (
                              <li key={idx} className="text-sm text-[#FCA5A5] flex items-start gap-2">
                                <span>⚠️</span>
                                {bottleneck}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiInsights.schedule_analysis?.solutions?.length > 0 && (
                        <div>
                          <div className="text-xs text-[#7B8A83] mb-2">Lösningar</div>
                          <ul className="space-y-1">
                            {aiInsights.schedule_analysis.solutions.map((solution, idx) => (
                              <li key={idx} className="text-sm text-[#2BA84A] flex items-start gap-2">
                                <span>✓</span>
                                {solution}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-sm text-[#B6C2BC] pt-2 border-t border-[#223029]">{aiInsights.schedule_analysis?.optimization_tips}</p>
                    </div>
                  </Card>

                  {/* General Insights */}
                  <Card className="bg-gradient-to-br from-[#4169E1]/10 to-[#3457D5]/5 border-[#4169E1]/30 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#4169E1]/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#4169E1]" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Allmänna Insikter</h3>
                    </div>
                    <div className="bg-[#0F1513] rounded-lg p-4">
                      <p className="text-sm text-[#B6C2BC] whitespace-pre-line">{aiInsights.general_insights}</p>
                    </div>
                  </Card>

                  <button
                    onClick={handleGetAiInsights}
                    className="w-full h-11 bg-[#18221E] hover:bg-[#223029] text-[#B6C2BC] hover:text-white border border-[#223029] rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analysera igen
                  </button>
                </div>
              )}
            </TabsContent>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div className="text-center text-[#B6C2BC] mb-8">
                <Shield className="w-12 h-12 mx-auto mb-2 text-[#F59E0B]" />
                <h3 className="text-lg font-bold text-white">Admin Översikt</h3>
                <p className="text-sm">Hantera turneringens alla delar från denna panel.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#F59E0B]/30 transition-all cursor-pointer" onClick={() => setActiveTab('settings')}>
                    <div className="flex items-center gap-3 mb-2">
                        <Settings className="w-5 h-5 text-[#F59E0B]" />
                        <h4 className="font-bold text-white">Inställningar</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Redigera namn, datum, status och regler.</p>
                </Card>

                <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#2BA84A]/30 transition-all cursor-pointer" onClick={() => setActiveTab('matches')}>
                    <div className="flex items-center gap-3 mb-2">
                        <Swords className="w-5 h-5 text-[#2BA84A]" />
                        <h4 className="font-bold text-white">Matcher</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Skapa matcher och rapportera resultat.</p>
                </Card>

                <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#9333EA]/30 transition-all cursor-pointer" onClick={handleGetAiInsights}>
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-[#9333EA]" />
                        <h4 className="font-bold text-white">AI-Strategi Insikter</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Få AI-drivna rekommendationer för optimering.</p>
                </Card>

                <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#9333EA]/30 transition-all cursor-pointer" onClick={() => handleGenerateSchedule()}>
                    <div className="flex items-center gap-3 mb-2">
                        <Wand2 className="w-5 h-5 text-[#9333EA]" />
                        <h4 className="font-bold text-white">AI-Generera Schema</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Låt AI skapa grupper och spelschema automatiskt.</p>
                </Card>

                <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#FFD700]/30 transition-all cursor-pointer" onClick={handleAdvanceToPlayoffs}>
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-[#FFD700]" />
                        <h4 className="font-bold text-white">Starta Slutspel</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Avsluta gruppspel och flytta top-lag till slutspel.</p>
                </Card>

                <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#2BA84A]/30 transition-all cursor-pointer" onClick={handleAdvanceToNextRound}>
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-[#2BA84A]" />
                        <h4 className="font-bold text-white">Nästa Slutspelsomgång</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Skapa nästa match med vinnarna från aktuell omgång.</p>
                </Card>

                 <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#EF4444]/30 transition-all cursor-pointer" onClick={handleDeleteCup}>
                    <div className="flex items-center gap-3 mb-2">
                        <Trash2 className="w-5 h-5 text-[#EF4444]" />
                        <h4 className="font-bold text-white">Ta bort Cup</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Radera turneringen och all data permanent.</p>
                </Card>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Cupnamn</Label>
                            <Input 
                                value={settingsForm.name} 
                                onChange={e => setSettingsForm({...settingsForm, name: e.target.value})}
                                className="bg-[#18221E] border-[#223029] text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Plats</Label>
                            <Input 
                                value={settingsForm.location} 
                                onChange={e => setSettingsForm({...settingsForm, location: e.target.value})}
                                className="bg-[#18221E] border-[#223029] text-white"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Startdatum</Label>
                            <Input 
                                type="date"
                                value={settingsForm.start_date} 
                                onChange={e => setSettingsForm({...settingsForm, start_date: e.target.value})}
                                className="bg-[#18221E] border-[#223029] text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Slutdatum</Label>
                            <Input 
                                type="date"
                                value={settingsForm.end_date} 
                                onChange={e => setSettingsForm({...settingsForm, end_date: e.target.value})}
                                className="bg-[#18221E] border-[#223029] text-white"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Status</Label>
                            <Select 
                                value={settingsForm.status} 
                                onValueChange={val => setSettingsForm({...settingsForm, status: val})}
                            >
                                <SelectTrigger className="bg-[#18221E] border-[#223029] text-white">
                                    <SelectValue placeholder="Välj status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upcoming">Kommande</SelectItem>
                                    <SelectItem value="registration_open">Anmälan öppen</SelectItem>
                                    <SelectItem value="registration_closed">Anmälan stängd</SelectItem>
                                    <SelectItem value="ongoing">Pågående</SelectItem>
                                    <SelectItem value="completed">Avslutad</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Max deltagare</Label>
                            <Input 
                                type="number"
                                value={settingsForm.max_participants} 
                                onChange={e => setSettingsForm({...settingsForm, max_participants: parseInt(e.target.value)})}
                                className="bg-[#18221E] border-[#223029] text-white"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-white">Beskrivning</Label>
                        <Textarea 
                            value={settingsForm.description} 
                            onChange={e => setSettingsForm({...settingsForm, description: e.target.value})}
                            className="bg-[#18221E] border-[#223029] text-white min-h-[100px]"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-[#18221E] p-4 rounded-lg border border-[#223029]">
                        <div className="space-y-0.5">
                            <Label className="text-base text-white">Publik Turnering</Label>
                            <p className="text-xs text-[#7B8A83]">Gör turneringen synlig för alla användare</p>
                        </div>
                        <Switch 
                            checked={settingsForm.is_public}
                            onCheckedChange={checked => setSettingsForm({...settingsForm, is_public: checked})}
                        />
                    </div>

                    <Button 
                        onClick={handleSaveSettings}
                        disabled={updateCupMutation.isPending}
                        className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white mt-4 h-12 text-lg font-bold"
                    >
                        {updateCupMutation.isPending ? 'Sparar...' : 'Spara ändringar'}
                    </Button>
                </div>
            </TabsContent>

            {/* TEAMS TAB */}
            <TabsContent value="teams" className="space-y-6">
              <Card className="bg-[#0F1513] border border-[#223029] p-4">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Lägg till manuellt lag</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Lagnamn" 
                    value={newTeamName} 
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="bg-[#18221E] border-[#223029] text-white"
                  />
                  <Button 
                    onClick={() => createManualTeamMutation.mutate()} 
                    disabled={!newTeamName || createManualTeamMutation.isPending}
                    className="bg-[#2BA84A] hover:bg-[#248232] text-white"
                  >
                    Skapa
                  </Button>
                </div>
              </Card>

              <div className="space-y-2">
                <h4 className="text-white font-bold">Deltagande Lag</h4>
                {confirmedTeams.length === 0 ? (
                    <p className="text-[#7B8A83] text-sm italic">Inga lag anmälda än.</p>
                ) : (
                    confirmedTeams.map(team => (
                    <div key={team.id} className="bg-[#18221E] p-3 rounded-lg flex justify-between items-center text-white border border-[#223029]">
                        <span>{team.name}</span>
                        <Badge className="bg-[#2BA84A]/20 text-[#2BA84A]">Bekräftad</Badge>
                    </div>
                    ))
                )}
              </div>
            </TabsContent>

            {/* GROUPS TAB */}
            <TabsContent value="groups" className="space-y-6">
              <Card className="bg-[#0F1513] border border-[#223029] p-4">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Skapa Grupp</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Gruppnamn (t.ex. Grupp A)" 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="bg-[#18221E] border-[#223029] text-white"
                  />
                  <Button 
                    onClick={() => createGroupMutation.mutate()} 
                    disabled={!newGroupName || createGroupMutation.isPending}
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
                  >
                    Skapa
                  </Button>
                </div>
              </Card>
              
              {groups && groups.length > 0 && (
                <Card className="bg-[#0F1513] border border-[#223029] p-4">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Grid className="w-4 h-4" /> Placera lag i grupp</h4>
                    <div className="grid sm:grid-cols-3 gap-2">
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger className="bg-[#18221E] border-[#223029] text-white">
                        <SelectValue placeholder="Välj lag" />
                        </SelectTrigger>
                        <SelectContent>
                        {confirmedTeams.map(team => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="bg-[#18221E] border-[#223029] text-white">
                        <SelectValue placeholder="Välj grupp" />
                        </SelectTrigger>
                        <SelectContent>
                        {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>

                    <Button 
                        onClick={() => assignTeamMutation.mutate()} 
                        disabled={!selectedGroup || !selectedTeam || assignTeamMutation.isPending}
                        className="bg-[#2BA84A] hover:bg-[#248232] text-white"
                    >
                        Tilldela
                    </Button>
                    </div>
                </Card>
              )}

              <div className="space-y-2">
                   <h4 className="text-white font-bold">Befintliga Grupper</h4>
                   {groups.length === 0 ? <p className="text-[#7B8A83] text-sm italic">Inga grupper skapade.</p> : 
                     groups.map(g => (
                        <div key={g.id} className="bg-[#18221E] p-3 rounded-lg border border-[#223029] text-white">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <span className="font-bold">{g.name}</span>
                                    <span className="text-xs text-[#7B8A83] ml-2">({g.team_ids?.length || 0} lag)</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-[#2BA84A] hover:bg-[#2BA84A]/10 hover:text-[#2BA84A] h-8 w-8"
                                        onClick={() => setEditingGroup(editingGroup?.id === g.id ? null : g)}
                                    >
                                        <Grid className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444] h-8 w-8"
                                        onClick={() => handleDeleteGroup(g.id, g.name)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            {editingGroup?.id === g.id && (
                                <div className="mt-3 pt-3 border-t border-[#223029] space-y-2">
                                    <div className="text-xs font-semibold text-[#B6C2BC] mb-2">Lag i gruppen:</div>
                                    {g.team_ids?.length === 0 ? (
                                        <p className="text-xs text-[#7B8A83] italic">Inga lag i denna grupp</p>
                                    ) : (
                                        g.team_ids?.map(teamId => {
                                            const team = confirmedTeams.find(t => t.id === teamId);
                                            if (!team) return null;
                                            return (
                                                <div key={teamId} className="flex justify-between items-center bg-[#0F1513] p-2 rounded-lg">
                                                    <span className="text-sm">{team.name}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[#EF4444] hover:bg-[#EF4444]/10 h-6 px-2"
                                                        onClick={() => handleRemoveTeamFromGroup(g.id, teamId, team.name)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                     ))
                   }
              </div>
            </TabsContent>

            {/* MATCHES TAB */}
            <TabsContent value="matches" className="space-y-6">
              <Card className="bg-[#0F1513] border border-[#223029] p-4">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Swords className="w-4 h-4" /> Skapa manuell match</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Select value={matchTeamA} onValueChange={setMatchTeamA}>
                    <SelectTrigger className="bg-[#18221E] border-[#223029] text-white">
                      <SelectValue placeholder="Lag A" />
                    </SelectTrigger>
                    <SelectContent>
                      {confirmedTeams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={matchTeamB} onValueChange={setMatchTeamB}>
                    <SelectTrigger className="bg-[#18221E] border-[#223029] text-white">
                      <SelectValue placeholder="Lag B" />
                    </SelectTrigger>
                    <SelectContent>
                      {confirmedTeams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input 
                    type="date" 
                    value={matchDate} 
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="bg-[#18221E] border-[#223029] text-white"
                  />
                  <Input 
                    type="time" 
                    value={matchTime} 
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="bg-[#18221E] border-[#223029] text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Select value={matchGroup} onValueChange={setMatchGroup}>
                        <SelectTrigger className="bg-[#18221E] border-[#223029] text-white">
                            <SelectValue placeholder="Grupp (Valfritt)" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                  onClick={() => createMatchMutation.mutate()} 
                  disabled={!matchTeamA || !matchTeamB || !matchDate || !matchTime || createMatchMutation.isPending}
                  className="w-full bg-[#F4743B] hover:bg-[#E5683A] text-white"
                >
                  Lägg till i schema
                </Button>
              </Card>
              
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                     <h4 className="text-white font-bold">Matcher ({matches.length})</h4>
                     <Button variant="outline" size="sm" onClick={() => handleGenerateSchedule()} className="text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/10">
                        <Wand2 className="w-3 h-3 mr-2" />
                        Autogenerera
                     </Button>
                 </div>
                 {matches.length === 0 ? <p className="text-[#7B8A83] text-sm italic">Inga matcher skapade.</p> : 
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {matches.slice().reverse().map(m => (
                            <div key={m.id} className="bg-[#18221E] p-3 rounded-lg border border-[#223029] flex justify-between items-center">
                                <div className="text-sm text-white">
                                    <span className="font-semibold">{m.team_a_name} vs {m.team_b_name}</span>
                                    <div className="text-xs text-[#7B8A83]">{m.date} {m.time}</div>
                                </div>
                                {m.team_a_score !== null && <Badge className="bg-[#2BA84A]/20 text-[#2BA84A]">Spelad</Badge>}
                            </div>
                        ))}
                    </div>
                 }
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}