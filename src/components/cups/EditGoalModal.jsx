import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Pencil, Clock } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";
import { triggerHaptic } from "@/components/utils/motionTokens";

export default function EditGoalModal({ goal, onClose, onSuccess }) {
  const [minute, setMinute] = useState(goal.minute || '');
  const [teamName, setTeamName] = useState(goal.team_name || '');
  const [playerName, setPlayerName] = useState(goal.player_name || '');
  const [playerNumber, setPlayerNumber] = useState(goal.player_number || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useCustomDialog();

  const handleSubmit = async () => {
    if (!minute || !teamName) {
      await alert('Ofullständig information', 'Minut och lagnamn måste fyllas i.', { type: 'warning' });
      return;
    }

    triggerHaptic('light');
    setIsSubmitting(true);
    try {
      await base44.entities.CupGoal.update(goal.id, {
        minute: parseInt(minute),
        team_name: teamName,
        player_name: playerName || null,
        player_number: playerNumber || null
      });

      if (onSuccess) await onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating goal:", error);
      await alert('Ett fel uppstod', 'Kunde inte uppdatera målet. Försök igen.', { type: 'alert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl lg:rounded-[20px] w-full p-4 lg:p-6 shadow-2xl max-w-md" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
      <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6 text-[#F59E0B]">
        <Pencil className="w-5 h-5 lg:w-6 lg:h-6" />
        <h2 className="text-lg lg:text-xl font-bold">Redigera mål</h2>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs text-[#7B8A83] mb-1 block">Minut</label>
          <div className="relative">
            <Input
              type="number"
              min="1"
              max="120"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="bg-[#18221E] border-[#223029] text-white h-10 pr-8"
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs text-[#7B8A83] mb-1 block">Lagnamn</label>
          <Input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-[#18221E] border-[#223029] text-white h-10"
            placeholder="Ex: Sverige"
          />
        </div>

        <div>
          <label className="text-xs text-[#7B8A83] mb-1 block">Spelarnamn (valfritt)</label>
          <Input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="bg-[#18221E] border-[#223029] text-white h-10"
            placeholder="Ex: Johan Andersson"
          />
        </div>

        <div>
          <label className="text-xs text-[#7B8A83] mb-1 block">Tröjnummer (valfritt)</label>
          <Input
            type="text"
            value={playerNumber}
            onChange={(e) => setPlayerNumber(e.target.value)}
            className="bg-[#18221E] border-[#223029] text-white h-10"
            placeholder="Ex: 10"
          />
        </div>
      </div>

      <div className="flex gap-2 lg:gap-3">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-white h-10 lg:h-11"
        >
          Avbryt
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-10 lg:h-11"
        >
          {isSubmitting ? 'Sparar...' : 'Spara'}
        </Button>
      </div>
    </div>
  );
}