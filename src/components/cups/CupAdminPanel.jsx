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
import { Shield, Plus, Grid, Swords, Settings, Save, Calendar, Wand2, Trash2 } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function CupAdminPanel({ cup, participants, groups, matches }) {
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  
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
      const res = await base44.functions.invoke('cups/createSchedule', {
        cup_id: cup.id
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cupDetails', cup.id]);
      alert('Schema skapat! 📅', `Skapade ${data.groups_created} grupper och matchschemat.`, { type: 'success' });
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

  // --- Handlers ---

  const handleSaveSettings = () => {
    updateCupMutation.mutate(settingsForm);
  };

  const handleGenerateSchedule = async () => {
    const confirmed = await confirm(
      'Generera spelschema?',
      'Detta kommer att slumpa in lag i grupper och skapa matcher automatiskt. Befintliga grupper och matcher kan påverkas.',
      { type: 'warning', confirmText: 'Generera', cancelText: 'Avbryt' }
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

  // Filter confirmed teams for selection
  const confirmedTeams = participants
    .filter(p => p.status === 'confirmed' || p.status === 'active')
    .map(p => ({ id: p.team_id, name: p.team?.name || 'Unknown Team' }));

  return (
    <div className="space-y-6">
      <DialogContainer />

      <Card className="bg-[#121715] border-[#223029] rounded-2xl p-1 shadow-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Översikt</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Inställningar</TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Lag</TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Grupper</TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A] text-[10px] sm:text-sm">Matcher</TabsTrigger>
          </TabsList>

          <div className="p-4 sm:p-6">
            
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

                <Card className="bg-[#18221E] border-[#223029] p-4 hover:border-[#2BA84A]/30 transition-all cursor-pointer" onClick={() => handleGenerateSchedule()}>
                    <div className="flex items-center gap-3 mb-2">
                        <Wand2 className="w-5 h-5 text-[#9333EA]" />
                        <h4 className="font-bold text-white">Generera Schema</h4>
                    </div>
                    <p className="text-xs text-[#7B8A83]">Skapa automatiskt spelschema och grupper.</p>
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
                            <span className="font-bold">{g.name}</span>
                            <span className="text-xs text-[#7B8A83] ml-2">({g.team_ids?.length || 0} lag)</span>
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