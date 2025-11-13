import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, X, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../dashboard/CupsWidget";

const TEAM_COLORS = [
  { color: '#2BA84A', name: 'Grön' },
  { color: '#F4743B', name: 'Orange' },
  { color: '#4169E1', name: 'Blå' },
  { color: '#9370DB', name: 'Lila' },
  { color: '#FFD700', name: 'Guld' },
  { color: '#DC2626', name: 'Röd' },
  { color: '#14B8A6', name: 'Turkos' },
  { color: '#EC4899', name: 'Rosa' }
];

export default function CreateCupTeamForm({ cup, onClose, onSuccess }) {
  const { alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  
  const [teamName, setTeamName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#2BA84A');

  // Create cup team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('cups/createCupTeam', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['userTeams'] });
      alert('Lag skapat! 🎉', 'Ditt cup-lag har skapats och anmälts till turneringen!', { type: 'success' });
      onSuccess?.(data.team);
      onClose();
    },
    onError: (error) => {
      alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte skapa laget.', { type: 'alert' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!teamName || teamName.trim().length < 3) {
      alert('Ogiltigt lagnamn', 'Lagnamnet måste vara minst 3 tecken.', { type: 'alert' });
      return;
    }

    createTeamMutation.mutate({
      cup_id: cup.id,
      team_name: teamName.trim(),
      team_color: selectedColor
    });
  };

  return (
    <>
      <DialogContainer />
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-[60] p-0">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-md border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] mb-16 lg:mb-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#223029] bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
                  Skapa Cup-Lag
                  <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                </h2>
                <p className="text-xs text-[#B6C2BC]">Speciellt för denna turnering</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#18221E] transition-colors text-[#B6C2BC] hover:text-[#F4F7F5]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Info Box */}
            <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl">
              <p className="text-sm text-[#F4F7F5] mb-2 font-semibold">💡 Vad är ett cup-lag?</p>
              <p className="text-xs text-[#B6C2BC] leading-relaxed">
                Ett cup-lag skapas specifikt för <strong className="text-[#F4F7F5]">{cup.name}</strong>. 
                Du blir lagkapten och kan bjuda in andra spelare senare. Perfekt om du inte har ett permanent lag!
              </p>
            </div>

            {/* Team Name */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F59E0B]" />
                Lagnamn *
              </Label>
              <Input
                placeholder="t.ex. Dynamit FC"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                required
                maxLength={50}
              />
              <p className="text-xs text-[#B6C2BC]">
                Laget kommer att heta: "{teamName || 'Ditt lagnamn'} ({cup.name})"
              </p>
            </div>

            {/* Team Color */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold">Lagfärg</Label>
              <div className="grid grid-cols-4 gap-3">
                {TEAM_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-12 rounded-xl border-2 transition-all ${
                      selectedColor === color
                        ? 'border-white scale-105 shadow-lg'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={name}
                  >
                    {selectedColor === color && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E]"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={createTeamMutation.isPending || !teamName.trim()}
                className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white gap-2 font-semibold"
              >
                <Trophy className="w-4 h-4" />
                {createTeamMutation.isPending ? 'Skapar...' : 'Skapa & Anmäl'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}