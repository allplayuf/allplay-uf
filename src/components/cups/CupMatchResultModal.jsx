import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Trophy, Plus, Trash2, Clock } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";
import { useQuery } from "@tanstack/react-query";

export default function CupMatchResultModal({ match, onClose, onSuccess }) {
  const [teamAScore, setTeamAScore] = useState(match.team_a_score ?? '');
  const [teamBScore, setTeamBScore] = useState(match.team_b_score ?? '');
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

  // Load existing goals if match has been reported
  useEffect(() => {
    const loadExistingGoals = async () => {
      if (match.team_a_score !== null && match.team_a_score !== undefined) {
        try {
          const existingGoals = await base44.entities.CupGoal.filter({ cup_match_id: match.id });
          const formattedGoals = existingGoals.map(g => ({
            minute: g.minute,
            team_id: g.team_id,
            player_id: g.player_id,
            is_own_goal: g.is_own_goal || false
          }));
          setGoals(formattedGoals);
        } catch (error) {
          console.error("Error loading goals:", error);
        }
      }
    };
    loadExistingGoals();
  }, [match.id, match.team_a_score]);

  const totalGoals = parseInt(teamAScore || 0) + parseInt(teamBScore || 0);
  const teamAPlayers = cupPlayers.filter(p => p.team_id === match.team_a_id);
  const teamBPlayers = cupPlayers.filter(p => p.team_id === match.team_b_id);

  const addGoal = () => {
    setGoals([...goals, { minute: '', team_id: '', player_id: '', is_own_goal: false }]);
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
    // Validation
    if (teamAScore === '' || teamBScore === '') {
      await alert('Felaktig inmatning', 'Vänligen fyll i båda resultaten.', { type: 'warning' });
      return;
    }

    const totalScore = parseInt(teamAScore) + parseInt(teamBScore);
    if (goals.length !== totalScore) {
      await alert('Antal mål matchar inte', `Du måste registrera exakt ${totalScore} mål (${teamAScore} + ${teamBScore}).`, { type: 'warning' });
      return;
    }

    // Validate each goal
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      if (!goal.minute || !goal.team_id || !goal.player_id) {
        await alert('Ofullständig målinformation', `Mål ${i + 1} saknar information (minut, lag eller spelare).`, { type: 'warning' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await base44.functions.invoke('cups/enterMatchResult', {
        cup_match_id: match.id,
        team_a_score: parseInt(teamAScore),
        team_b_score: parseInt(teamBScore),
        goals: goals.map(g => ({
          minute: parseInt(g.minute),
          team_id: g.team_id,
          player_id: g.player_id,
          is_own_goal: g.is_own_goal
        }))
      });

      if (onSuccess) await onSuccess();
      onClose();
    } catch (error) {
      console.error("Error reporting result:", error);
      await alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte spara resultatet. Försök igen.', { type: 'alert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl lg:rounded-[20px] w-full p-4 lg:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6 text-[#F59E0B]">
        <Trophy className="w-5 h-5 lg:w-6 lg:h-6" />
        <h2 className="text-lg lg:text-xl font-bold">Rapportera Cup-resultat</h2>
      </div>

      {/* Step 1: Final Score */}
      <div className="mb-6">
        <div className="text-sm font-bold text-[#B6C2BC] mb-3">Steg 1: Slutresultat</div>
        <div className="flex items-center justify-between gap-2 lg:gap-4">
          <div className="text-center flex-1">
            <div className="font-bold text-white text-xs lg:text-sm mb-1 lg:mb-2 truncate">{match.team_a_name}</div>
            <Input 
              type="number" 
              min="0"
              value={teamAScore}
              onChange={(e) => setTeamAScore(e.target.value)}
              className="bg-[#18221E] border-[#223029] text-white text-center text-xl lg:text-2xl h-12 lg:h-16 font-bold"
            />
          </div>
          <div className="text-[#7B8A83] font-bold text-lg lg:text-xl pt-4 lg:pt-6">-</div>
          <div className="text-center flex-1">
            <div className="font-bold text-white text-xs lg:text-sm mb-1 lg:mb-2 truncate">{match.team_b_name}</div>
            <Input 
              type="number" 
              min="0"
              value={teamBScore}
              onChange={(e) => setTeamBScore(e.target.value)}
              className="bg-[#18221E] border-[#223029] text-white text-center text-xl lg:text-2xl h-12 lg:h-16 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Goals Registration */}
      {totalGoals > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-[#B6C2BC]">
              Steg 2: Registrera {totalGoals} mål ({goals.length}/{totalGoals})
            </div>
            <Button
              onClick={addGoal}
              size="sm"
              className="bg-[#2BA84A] hover:bg-[#248232] text-white h-8 gap-1"
              disabled={goals.length >= totalGoals}
            >
              <Plus className="w-4 h-4" />
              Lägg till mål
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {goals.map((goal, index) => (
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
                        placeholder="7"
                      />
                      <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7B8A83] pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">

                  {/* Team */}
                  <div className="col-span-3">
                    <label className="text-[10px] text-[#7B8A83] mb-1 block">Lag</label>
                    <Select
                      value={goal.team_id}
                      onValueChange={(value) => {
                        updateGoal(index, 'team_id', value);
                        updateGoal(index, 'player_id', ''); // Reset player when team changes
                      }}
                    >
                      <SelectTrigger className="bg-[#18221E] border-[#223029] text-white h-9 text-xs">
                        <SelectValue placeholder="Välj lag" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        <SelectItem value={match.team_a_id}>{match.team_a_name}</SelectItem>
                        <SelectItem value={match.team_b_id}>{match.team_b_name}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Player - Full width below */}
                {goal.team_id && (
                  <div className="mt-2">
                    <label className="text-[10px] text-[#7B8A83] mb-1 block">Spelare</label>
                    <Select
                      value={goal.player_id}
                      onValueChange={(value) => updateGoal(index, 'player_id', value)}
                    >
                      <SelectTrigger className="bg-[#18221E] border-[#223029] text-white h-9 text-xs">
                        <SelectValue placeholder="Välj spelare" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {(goal.team_id === match.team_a_id ? teamAPlayers : teamBPlayers).map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>

          {goals.length < totalGoals && (
            <div className="mt-3 p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
              <p className="text-xs text-[#FCD34D] font-medium">
                ⚠️ Du måste lägga till {totalGoals - goals.length} mål till innan du kan spara.
              </p>
            </div>
          )}
        </div>
      )}

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
          disabled={isSubmitting || teamAScore === '' || teamBScore === '' || goals.length !== totalGoals}
          className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-10 lg:h-11 text-sm lg:text-base"
        >
          {isSubmitting ? 'Sparar...' : 'Spara resultat'}
        </Button>
      </div>
    </div>
  );
}