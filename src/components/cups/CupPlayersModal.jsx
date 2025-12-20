import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Users, Target, Award, Edit2, Save, Sparkles, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";

export default function CupPlayersModal({ cup, onClose }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterTeam, setFilterTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { alert } = useCustomDialog();

  // Fetch all cup players
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['cupPlayers', cup.id],
    queryFn: async () => {
      const allPlayers = await base44.entities.CupPlayer.filter({ cup_id: cup.id });
      // Fetch team data for each player
      const playerTeams = await Promise.all(
        allPlayers.map(async (p) => {
          const team = await base44.entities.Team.get(p.team_id);
          return { ...p, team };
        })
      );
      return playerTeams;
    }
  });

  // Get unique teams
  const teams = [...new Set(players.map(p => p.team))].filter(Boolean);

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ playerId, data }) => {
      return await base44.entities.CupPlayer.update(playerId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cupPlayers', cup.id]);
      setEditingPlayer(null);
      alert('Spelare uppdaterad! ✅', 'Ändringar har sparats.', { type: 'success' });
    }
  });

  const handleEdit = (player) => {
    setEditingPlayer(player.id);
    setEditForm({
      name: player.name,
      goals: player.goals || 0,
      assists: player.assists || 0
    });
  };

  const handleSave = () => {
    updatePlayerMutation.mutate({
      playerId: editingPlayer,
      data: editForm
    });
  };

  const filteredPlayers = players
    .filter(p => filterTeam === 'all' || p.team_id === filterTeam)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.goals || 0) - (a.goals || 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#121715] border border-[#223029] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Cup-spelare</h2>
              <p className="text-white/80 text-sm">{cup.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 lg:p-6 border-b border-[#223029] space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-[#7B8A83]" />
              <Input
                placeholder="Sök spelare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 lg:pl-10 bg-[#0F1513] border-[#223029] text-[#F4F7F5] h-10 lg:h-11 text-sm"
              />
            </div>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="h-10 lg:h-11 px-3 lg:px-4 bg-[#0F1513] border border-[#223029] rounded-xl text-[#F4F7F5] font-medium text-sm"
            >
              <option value="all">Alla lag ({players.length})</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({players.filter(p => p.team_id === team.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-[#B6C2BC]">Totalt: <span className="font-bold text-[#F4F7F5]">{players.reduce((sum, p) => sum + (p.goals || 0), 0)} mål</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#2BA84A]" />
              <span className="text-[#B6C2BC]">Totalt: <span className="font-bold text-[#F4F7F5]">{players.reduce((sum, p) => sum + (p.assists || 0), 0)} assist</span></span>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="p-4 lg:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#B6C2BC]">Laddar spelare...</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
              <p className="text-[#B6C2BC]">Inga spelare hittades</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              <AnimatePresence>
                {filteredPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="bg-gradient-to-br from-[#18221E] to-[#121715] border-[#223029] hover:border-[#F59E0B]/40 transition-all">
                      <CardContent className="p-4">
                        {editingPlayer === player.id ? (
                          <div className="space-y-3">
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="bg-[#0F1513] border-[#223029] text-[#F4F7F5] font-bold"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-[#7B8A83] mb-1 block">Mål</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editForm.goals}
                                  onChange={(e) => setEditForm({...editForm, goals: parseInt(e.target.value) || 0})}
                                  className="bg-[#0F1513] border-[#223029] text-[#F4F7F5]"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-[#7B8A83] mb-1 block">Assist</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editForm.assists}
                                  onChange={(e) => setEditForm({...editForm, assists: parseInt(e.target.value) || 0})}
                                  className="bg-[#0F1513] border-[#223029] text-[#F4F7F5]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSave}
                                disabled={updatePlayerMutation.isPending}
                                className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-9 text-sm"
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Spara
                              </Button>
                              <Button
                                onClick={() => setEditingPlayer(null)}
                                variant="outline"
                                className="flex-1 h-9 text-sm"
                              >
                                Avbryt
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[#F4F7F5] text-sm truncate mb-1">{player.name}</h4>
                                <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-xs">
                                  {player.team?.name}
                                </Badge>
                              </div>
                              <button
                                onClick={() => handleEdit(player)}
                                className="w-8 h-8 rounded-lg bg-[#0F1513] hover:bg-[#18221E] flex items-center justify-center transition-all"
                              >
                                <Edit2 className="w-4 h-4 text-[#F59E0B]" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-[#0F1513] rounded-lg">
                                <div className="text-xs text-[#B6C2BC] mb-1">Mål</div>
                                <div className="text-lg font-black text-[#F59E0B]">{player.goals || 0}</div>
                              </div>
                              <div className="p-2 bg-[#0F1513] rounded-lg">
                                <div className="text-xs text-[#B6C2BC] mb-1">Assist</div>
                                <div className="text-lg font-black text-[#2BA84A]">{player.assists || 0}</div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}