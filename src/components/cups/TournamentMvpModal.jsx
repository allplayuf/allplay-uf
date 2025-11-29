import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Trophy, Crown, Star } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";
import { motion } from "framer-motion";

export default function TournamentMvpModal({ cup, participants, onClose, onSuccess }) {
  const [selectedUserId, setSelectedUserId] = useState(cup.tournament_mvp_user_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useCustomDialog();

  // Get all unique users from all teams
  const allPlayers = React.useMemo(() => {
    const playersMap = new Map();
    
    participants.forEach(p => {
      if (p.team && p.team.members) {
        p.team.members.forEach(member => {
          if (!playersMap.has(member.user_id)) {
            playersMap.set(member.user_id, {
              id: member.user_id,
              name: member.user?.full_name || 'Okänd spelare',
              team_name: p.team.name
            });
          }
        });
      }
    });
    
    return Array.from(playersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [participants]);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      await alert('Välj MVP', 'Vänligen välj en spelare som MVP.', { type: 'warning' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await base44.asServiceRole.entities.Cup.update(cup.id, {
        tournament_mvp_user_id: selectedUserId
      });
      
      if (onSuccess) onSuccess();
      onClose();
      
      await alert('MVP vald! 🏆', 'Turneringens MVP har sparats.', { type: 'success' });
    } catch (error) {
      console.error("Error saving tournament MVP:", error);
      await alert('Ett fel uppstod', 'Kunde inte spara MVP. Försök igen.', { type: 'alert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlayer = allPlayers.find(p => p.id === selectedUserId);

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-[20px] w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Välj Turnerings-MVP</h2>
            <p className="text-white/90 text-sm font-medium">Den bästa spelaren i turneringen</p>
          </div>
        </div>
      </div>

      {/* Selected Player Preview */}
      {selectedPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 border border-[#FFD700]/30 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-[#7B8A83] font-semibold">Vald MVP</div>
              <div className="text-lg font-bold text-white">{selectedPlayer.name}</div>
              <div className="text-xs text-[#B6C2BC]">{selectedPlayer.team_name}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Player List */}
      <div className="space-y-2 mb-6">
        <div className="text-sm font-semibold text-[#B6C2BC] mb-3">Alla spelare ({allPlayers.length})</div>
        
        {allPlayers.length === 0 ? (
          <div className="text-center py-8 text-[#7B8A83]">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Inga spelare tillgängliga</p>
          </div>
        ) : (
          <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
            {allPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedUserId(player.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedUserId === player.id
                    ? 'bg-[#FFD700]/20 border-[#FFD700]/50 ring-2 ring-[#FFD700]/30'
                    : 'bg-[#18221E] border-[#223029] hover:border-[#FFD700]/30 hover:bg-[#223029]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{player.name}</div>
                    <div className="text-xs text-[#7B8A83]">{player.team_name}</div>
                  </div>
                  {selectedUserId === player.id && (
                    <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#223029]">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-white"
        >
          Avbryt
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedUserId}
          className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FF8C00] text-black font-bold"
        >
          {isSubmitting ? 'Sparar...' : 'Spara MVP'}
        </Button>
      </div>
    </div>
  );
}