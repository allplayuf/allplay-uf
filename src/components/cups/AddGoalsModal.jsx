import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Trophy, Plus, Trash2, Clock } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";
import { triggerHaptic } from "@/components/utils/motionTokens";

export default function AddGoalsModal({ match, onClose, onSuccess }) {
  const [goals, setGoals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useCustomDialog();

  const addGoal = () => {
    triggerHaptic('light');
    setGoals([...goals, { minute: '', team_name: '', player_name: '', player_number: '' }]);
  };

  const removeGoal = (index) => {
    triggerHaptic('light');
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
      if (!goal.minute || !goal.team_name) {
        await alert('Ofullständig målinformation', `Mål ${i + 1} saknar information (minut eller lag).`, { type: 'warning' });
        return;
      }
    }

    if (goals.length === 0) {
      await alert('Inga mål', 'Du måste lägga till minst ett mål.', { type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.functions.invoke('cups/addManualGoals', {
        cup_match_id: match.id,
        goals: goals.map(g => ({
          minute: parseInt(g.minute),
          team_name: g.team_name,
          player_name: g.player_name,
          player_number: g.player_number || ''
        }))
      });

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
    <div className="bg-[#121715] border border-[#223029] rounded-2xl lg:rounded-[20px] w-full p-4 lg:p-6 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
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
                  <div>
                    <label className="text-[10px] text-[#7B8A83] mb-1 block">Minut</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={goal.minute}
                        onChange={(e) => updateGoal(index, 'minute', e.target.value)}
                        className="bg-[#18221E] border-[#223029] text-white h-9 text-sm pr-6"
                        placeholder="45"
                      />
                      <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7B8A83] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7B8A83] mb-1 block">Lagnamn</label>
                    <Input
                      type="text"
                      value={goal.team_name}
                      onChange={(e) => updateGoal(index, 'team_name', e.target.value)}
                      className="bg-[#18221E] border-[#223029] text-white h-9 text-sm"
                      placeholder="Ex: Sverige"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7B8A83] mb-1 block">Spelarnamn (valfritt)</label>
                    <Input
                      type="text"
                      value={goal.player_name}
                      onChange={(e) => updateGoal(index, 'player_name', e.target.value)}
                      className="bg-[#18221E] border-[#223029] text-white h-9 text-sm"
                      placeholder="Ex: Johan Andersson"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7B8A83] mb-1 block">Tröjnummer (valfritt)</label>
                    <Input
                      type="text"
                      value={goal.player_number}
                      onChange={(e) => updateGoal(index, 'player_number', e.target.value)}
                      className="bg-[#18221E] border-[#223029] text-white h-9 text-sm"
                      placeholder="Ex: 10"
                    />
                  </div>
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