import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Users, Trophy, UserPlus, CheckCircle, Crown, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCustomDialog } from "../ui/custom-dialog";

export default function TeamDiscovery({ teams = [], myTeams = [], user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const { alert, confirm, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  // Ensure teams is an array
  const safeTeams = Array.isArray(teams) ? teams : [];
  const myTeamIds = Array.isArray(myTeams) ? myTeams.map(t => t.id) : [];

  // Get unique cities
  const cities = ['all', ...new Set(safeTeams.map(t => t.city).filter(Boolean))];

  // Filter teams
  const filteredTeams = safeTeams.filter(t => {
    if (!t) return false;
    
    const matchesSearch = !searchQuery || 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = cityFilter === 'all' || t.city === cityFilter;
    
    // Don't show teams user is already in
    const notMember = !myTeamIds.includes(t.id);
    
    return matchesSearch && matchesCity && notMember;
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      await base44.entities.TeamMember.create({
        team_id: teamId,
        user_id: user.id,
        role: 'member',
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicTeams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', user.id] });
      alert('Ansökan skickad! 🎯', 'Din ansökan har skickats till lagkaptenen!', { type: 'success' });
    },
    onError: (error) => {
      alert('Ett fel uppstod', 'Kunde inte skicka ansökan.', { type: 'alert' });
    }
  });

  const handleJoinTeam = async (team) => {
    if (!user) return;

    // Check if team is full
    if (team.max_members && team.current_members >= team.max_members) {
      alert('Laget är fullt', 'Detta lag har nått max antal medlemmar.', { type: 'info' });
      return;
    }

    const shouldJoin = await confirm(
      'Gå med i lag',
      `Vill du ansöka om att gå med i ${team.name}? Lagkaptenen kommer att granska din ansökan.`,
      { type: 'confirm', confirmText: 'Skicka ansökan', cancelText: 'Avbryt' }
    );

    if (!shouldJoin) return;

    joinTeamMutation.mutate(team.id);
  };

  return (
    <>
      <DialogContainer />
      
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7B8A83]" />
            <Input
              placeholder="Sök efter lag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#7B8A83] rounded-[14px] h-12"
            />
          </div>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#18221E] border-[#223029] text-[#F4F7F5]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla städer</SelectItem>
              {cities.filter(c => c !== 'all').map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-[#B6C2BC]">
          {filteredTeams.length} lag hittade
        </p>

        {/* Teams Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team, index) => {
            if (!team) return null;

            const teamColor = team.teamColor || '#2BA84A';
            const isFull = team.max_members && team.current_members >= team.max_members;

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#2BA84A]/30 transition-all rounded-[20px] overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${teamColor}15 0%, #12171500 100%)`
                  }}
                >
                  {/* Team Header */}
                  <div 
                    className="h-24 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${teamColor}40 0%, ${teamColor}20 100%)`
                    }}
                  >
                    {team.logo_url ? (
                      <img 
                        src={team.logo_url} 
                        alt={team.name}
                        className="w-full h-full object-cover opacity-30"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shield className="w-12 h-12 opacity-20" style={{ color: teamColor }} />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <Link to={`${createPageUrl("TeamOverview")}?team_id=${team.id}`}>
                      <h3 className="text-lg font-bold text-[#F4F7F5] mb-2 hover:text-[#2BA84A] transition-colors line-clamp-1">
                        {team.name}
                      </h3>
                    </Link>

                    {team.description && (
                      <p className="text-sm text-[#B6C2BC] mb-3 line-clamp-2">
                        {team.description}
                      </p>
                    )}

                    {/* Team Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                        <MapPin className="w-4 h-4 text-[#9FC9AC]" />
                        {team.city}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                        <Users className="w-4 h-4 text-[#9FC9AC]" />
                        {team.current_members}/{team.max_members} medlemmar
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                        <Trophy className="w-4 h-4 text-[#9FC9AC]" />
                        {team.matches_played || 0} matcher • {team.wins || 0} vinster
                      </div>
                    </div>

                    {/* ELO Badge */}
                    <div className="mb-4">
                      <Badge 
                        className="w-full justify-center py-2 text-sm font-bold"
                        style={{
                          background: `${teamColor}30`,
                          color: teamColor,
                          border: `1px solid ${teamColor}50`
                        }}
                      >
                        ELO: {Math.round(team.elo_rating || 1000)}
                      </Badge>
                    </div>

                    {/* Join Button */}
                    {isFull ? (
                      <Button
                        disabled
                        className="w-full bg-[#18221E] text-[#7B8A83] cursor-not-allowed"
                      >
                        Fullt
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinTeam(team)}
                        disabled={joinTeamMutation.isPending}
                        className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white font-semibold gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Ansök
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/30">
                <Search className="w-8 h-8 text-[#9FC9AC]" />
              </div>
              <h3 className="text-xl font-semibold text-[#F4F7F5] mb-2">
                Inga lag hittades
              </h3>
              <p className="text-sm text-[#B6C2BC]">
                Prova att ändra dina sökkriterier.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}