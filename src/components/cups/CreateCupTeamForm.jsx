import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
  const [selectedColor, setSelectedColor] = useState('#FF7A3D');

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
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end lg:items-center justify-center z-[60] p-0">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1F2937] rounded-t-[20px] lg:rounded-2xl w-full lg:max-w-lg border border-[#374151] shadow-2xl mb-16 lg:mb-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#374151] bg-gradient-to-r from-[#FF7A3D]/10 to-[#F97316]/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FF7A3D]/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#FF7A3D]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#FFFFFF] flex items-center gap-2">
                  Skapa Cup-Lag
                  <Sparkles className="w-4 h-4 text-[#FF7A3D]" />
                </h2>
                <p className="text-xs text-[#9CA3AF]">Speciellt för denna turnering</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#374151] transition-colors text-[#9CA3AF] hover:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Info Box */}
            <div className="p-4 bg-[#4169E1]/10 border border-[#4169E1]/30 rounded-xl">
              <p className="text-sm text-[#FFFFFF] mb-2 font-semibold">💡 Vad är ett cup-lag?</p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Ett cup-lag skapas specifikt för <strong className="text-[#FFFFFF]">{cup.name}</strong>. 
                Du blir lagkapten och kan bjuda in andra spelare senare. Perfekt om du inte har ett permanent lag!
              </p>
            </div>

            {/* Team Name */}
            <div className="space-y-2">
              <Label className="text-[#FFFFFF] font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF7A3D]" />
                Lagnamn *
              </Label>
              <Input
                placeholder="t.ex. Dynamit FC"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                required
                maxLength={50}
              />
              <p className="text-xs text-[#9CA3AF]">
                Laget kommer att heta: <span className="text-[#FFFFFF] font-semibold">"{teamName || 'Ditt lagnamn'} ({cup.name})"</span>
              </p>
            </div>

            {/* Team Color */}
            <div className="space-y-3">
              <Label className="text-[#FFFFFF] font-semibold">Lagfärg</Label>
              <div className="grid grid-cols-4 gap-3">
                {TEAM_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-14 rounded-xl border-2 transition-all ${
                      selectedColor === color
                        ? 'border-white scale-105 shadow-xl ring-2 ring-white/50'
                        : 'border-transparent hover:scale-105 hover:shadow-lg'
                    }`}
                    style={{ backgroundColor: color }}
                    title={name}
                  >
                    {selectedColor === color && (
                      <div className="w-full h-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#374151]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 border-[#374151] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#FFFFFF] font-semibold"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={createTeamMutation.isPending || !teamName.trim()}
                className="flex-1 h-12 bg-[#FF7A3D] hover:bg-[#F97316] text-[#FFFFFF] gap-2 font-semibold shadow-lg"
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