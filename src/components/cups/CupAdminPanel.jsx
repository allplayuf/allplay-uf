import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Users, Calendar, Trophy, Plus, Grid, Swords } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CupAdminPanel({ cup, participants, groups, matches, venues }) { // venues passed as prop or fetched
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Manual Team State
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Group Management State
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [isManagingGroup, setIsManagingGroup] = useState(false);

  // Match Creation State
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchTeamA, setMatchTeamA] = useState("");
  const [matchTeamB, setMatchTeamB] = useState("");
  const [matchGroup, setMatchGroup] = useState("");
  const [matchVenue, setMatchVenue] = useState("");
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  // --- Mutations ---

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

  // Filter confirmed teams for selection
  const confirmedTeams = participants
    .filter(p => p.status === 'confirmed' || p.status === 'active')
    .map(p => ({ id: p.team_id, name: p.team?.name || 'Unknown Team' }));

  return (
    <div className="space-y-6">
      <DialogContainer />

      <Card className="bg-[#121715] border-[#223029] rounded-2xl p-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A]">Översikt</TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A]">Lag</TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A]">Grupper</TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-[#2BA84A]/20 data-[state=active]:text-[#2BA84A]">Matcher</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="overview">
              <div className="text-center text-[#B6C2BC]">
                <Shield className="w-12 h-12 mx-auto mb-2 text-[#F59E0B]" />
                <h3 className="text-lg font-bold text-white">Admin Översikt</h3>
                <p>Använd flikarna ovan för att hantera cupen.</p>
              </div>
            </TabsContent>

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
                {confirmedTeams.map(team => (
                  <div key={team.id} className="bg-[#18221E] p-3 rounded-lg flex justify-between items-center text-white border border-[#223029]">
                    <span>{team.name}</span>
                    <Badge className="bg-[#2BA84A]/20 text-[#2BA84A]">Bekräftad</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

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
            </TabsContent>

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
                     {/* Venue selection if needed, else uses default */}
                </div>

                <Button 
                  onClick={() => createMatchMutation.mutate()} 
                  disabled={!matchTeamA || !matchTeamB || !matchDate || !matchTime || createMatchMutation.isPending}
                  className="w-full bg-[#F4743B] hover:bg-[#E5683A] text-white"
                >
                  Lägg till i schema
                </Button>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}