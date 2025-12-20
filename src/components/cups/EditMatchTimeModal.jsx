import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Clock, Calendar } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";

export default function EditMatchTimeModal({ match, onClose, onSuccess }) {
  const [date, setDate] = useState(match.date || '');
  const [time, setTime] = useState(match.time || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useCustomDialog();

  const handleSubmit = async () => {
    if (!date || !time) {
      await alert('Ofullständig information', 'Datum och tid måste fyllas i.', { type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update the regular Match entity
      await base44.entities.Match.update(match.match_id, {
        date: date,
        time: time
      });

      if (onSuccess) await onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating match time:", error);
      await alert('Ett fel uppstod', 'Kunde inte uppdatera matchtiden. Försök igen.', { type: 'alert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl lg:rounded-[20px] w-full p-4 lg:p-6 shadow-2xl max-w-md">
      <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6 text-[#F59E0B]">
        <Clock className="w-5 h-5 lg:w-6 lg:h-6" />
        <h2 className="text-lg lg:text-xl font-bold">Ändra matchtid</h2>
      </div>

      <div className="mb-4 p-3 bg-[#18221E] rounded-xl border border-[#223029]">
        <p className="text-xs text-[#7B8A83] mb-1">Match</p>
        <p className="text-sm font-bold text-[#F4F7F5]">
          {match.team_a_name} vs {match.team_b_name}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs text-[#7B8A83] mb-1 block">Datum</label>
          <div className="relative">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#18221E] border-[#223029] text-white h-10 pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs text-[#7B8A83] mb-1 block">Tid</label>
          <div className="relative">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-[#18221E] border-[#223029] text-white h-10 pr-10"
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83] pointer-events-none" />
          </div>
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