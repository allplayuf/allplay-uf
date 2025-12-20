import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Trophy, Plus, Trash2, Clock } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";
import { useQuery } from "@tanstack/react-query";

export default function AddGoalsModal({ match, onClose, onSuccess }) {
  const [goals, setGoals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useCustomDialog();

  // Fetch cup players for both teams
  const { data: cupPlayers = [] } = useQuery({
    queryKey: ['cupPlayers', match.cup_id, match.team_a_id, match.team_b_id],
    queryFn: async () => {
      const players = await base44.entities.CupPlayer.filter({ cup_id: match.cup_id });
      return players.filter(p => p.team_id === match.team_a_id || p.team_id === match.team_b_id);
    },
    enabled: !!match.cup_id
  });

  const teamAPlayers = cupPlayers.filter(p => p.team_id === match.team_a_id);
  const teamBPlayers = cupPlayers.filter(p => p.team_id === match.team_b_id);

  const addGoal = () => {
    setGoals([...goals, { minute: '', team_id: '', player_id: '' }]);
  };

  const removeGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index, field, value) => {
    const newGoals = [...goals];
    newGoals[index][field] = value;
    setGoals(newGoals);
  };

  const handleSubmit = async () => {
    // Validate each goal
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      if (!goal.minute || !goal.team_id || !goal.player_id) {
        await alert('Ofullständig målinformation', `Mål ${i + 1} saknar information (minut, lag eller spelare).`, { type: 'warning' });
        return;
      }
    }

    if (goals.length === 0) {
      await alert('Inga mål', 'Du måste lägga till minst ett mål.', { type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create goals directly
      for (const goal of goals) {
        await base44.entities.CupGoal.create({
          cup_id: match.cup_id,
          cup_match_id: match.id,
          team_id: goal.team_id,
          player_id: goal.player_id,
          minute: parseInt(goal.minute),
          is_own_goal: false
        });

        // Update player stats
        const player = await base44.entities.CupPlayer.get(goal.player_id);
        await base44.entities.CupPlayer.update(goal.player_id, {
          goals: (player.goals || 0) + 1
        });

        // Sync to user if available
        if (player.user_id) {
          try {
            const userProfile = await base44.entities.User.get(player.user_id);
            await base44.entities.User.update(player.user_id, {
              goals_scored: (userProfile.goals_scored || 0) + 1
            });
          } catch (err) {
            console.error('Failed to sync user stats:', err);
          }
        }
      }

      if (onSuccess) await onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding goals:", error);
      await alert('Ett fel uppstod', 'Kunde inte lägga till målen. Försök igen.', { type: 'alert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl lg:rounded-[20px] w-full p-4 lg:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6 text-[#F59E0B]">
        <Trophy className="w-5 h-5 lg:w-6 lg:h-6" />
        <h2 className="text-lg lg:text-xl font-bold">Lägg till målöversikt</h2>
      </div>

      <div className="mb-4 p-3 bg-[#0F1513] rounded-lg border border-[#223029]">
        <div className="text-sm text-[#B6C2BC]">
          <span className="font-bold text-white">{match.team_a_name}</span>
          <span className="mx-2 text-[#F59E0B] font-bold">{match.team_a_score} - {match.team_b_score}</span>
          <span className="font-bold text-white">{match.team_b_name}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-[#B6C2BC]">
            Mål ({goals.length})
          </div>
          <Button
            onClick={addGoal}
            size="sm"
            className="bg-[#2BA84A] hover:bg-[#248232] text-white h-8 gap-1"
          >
            <Plus className="w-4 h-4" />
            Lägg till mål
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-[#7B8A83] text-sm">
              Klicka på "Lägg till mål" för att börja
            </div>
          ) : (
            goals.map((goal, index) => (
              <div key={index} className="bg-[#0F1513] p-3 rounded-lg border border-[#223029]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#F59E0B]">Mål {index + 1}</span>
                  <button
                    onClick={() => removeGoal(index)}
                    className="text-[#EF4444] hover:bg-[#EF4444]/10 p-1 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Minute */}
                  <div>
                    <label className="text-[10px] text-[#7B8A83] mb-1 block">Minut</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="90"
                        value={goal.minute}
                        onChange={(e) => updateGoal(index, 'minute', e.target.value)}
                        className="bg-[#18221E] border-[#223029] text-white h-9 text-sm pr-6"
                        placeholder="45"
                      />
                      <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7B8A83] pointer-events-none" />
                    </div>
                  </div>

                  {/* Team - Larger buttons */}
                  <div>
                    <label className="text-xs text-[#B6C2BC] mb-2 block font-semibold">Lag som gjorde mål</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateGoal(index, 'team_id', match.team_a_id);
                          updateGoal(index, 'player_id', '');
                        }}
                        className={`h-14 rounded-xl font-bold text-sm transition-all ${
                          goal.team_id === match.team_a_id
                            ? 'bg-[#2BA84A] text-white ring-2 ring-[#2BA84A]/50 shadow-lg'
                            : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029] border border-[#223029]'
                        }`}
                      >
                        {match.team_a_name}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateGoal(index, 'team_id', match.team_b_id);
                          updateGoal(index, 'player_id', '');
                        }}
                        className={`h-14 rounded-xl font-bold text-sm transition-all ${
                          goal.team_id === match.team_b_id
                            ? 'bg-[#F59E0B] text-white ring-2 ring-[#F59E0B]/50 shadow-lg'
                            : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029] border border-[#223029]'
                        }`}
                      >
                        {match.team_b_name}
                      </button>
                    </div>
                  </div>

                  {/* Player - Larger list items */}
                  {goal.team_id && (
                    <div>
                      <label className="text-xs text-[#B6C2BC] mb-2 block font-semibold">
                        Välj målskytt ({goal.team_id === match.team_a_id ? teamAPlayers.length : teamBPlayers.length} spelare)
                      </label>
                      <div className="max-h-[200px] overflow-y-auto space-y-1 bg-[#0F1513] p-2 rounded-lg border border-[#223029]">
                        {(goal.team_id === match.team_a_id ? teamAPlayers : teamBPlayers)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(player => (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => updateGoal(index, 'player_id', player.id)}
                              className={`w-full h-12 px-4 rounded-lg font-semibold text-left transition-all ${
                                goal.player_id === player.id
                                  ? 'bg-[#2BA84A] text-white shadow-lg'
                                  : 'bg-[#18221E] text-[#F4F7F5] hover:bg-[#223029]'
                              }`}
                            >
                              {player.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2 lg:gap-3">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-white h-10 lg:h-11 text-sm lg:text-base"
        >
          Avbryt
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || goals.length === 0}
          className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-10 lg:h-11 text-sm lg:text-base"
        >
          {isSubmitting ? 'Sparar...' : 'Spara mål'}
        </Button>
      </div>
    </div>
  );
}